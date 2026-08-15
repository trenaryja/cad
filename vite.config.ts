import { spawn } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin, ViteDevServer } from 'vite'

function modelHmr(): Plugin {
	const scadBuilds = new Map<string, AbortController>()
	let viteServer: ViteDevServer

	function buildScad(slug: string, overrides?: Record<string, boolean | number | string>) {
		const projectDir = resolve('src', slug)
		const srcDir = resolve(projectDir, 'src')

		// Find the .scad file in src/
		let scadFile: string | undefined

		try {
			const files = readdirSync(srcDir)
			const scad = files.find((f) => f.endsWith('.scad') && !f.includes('.v'))
			if (scad) scadFile = resolve(srcDir, scad)
		} catch {
			return
		}

		if (!scadFile) return

		const stlFile = resolve(projectDir, `${slug}.stl`)

		// Abort any in-flight build for this project
		scadBuilds.get(slug)?.abort()
		const controller = new AbortController()
		scadBuilds.set(slug, controller)

		viteServer.ws.send({ type: 'custom', event: 'scad-building', data: { slug } })

		// Build -D flags from overrides
		const args = ['-o', stlFile]

		if (overrides) {
			for (const [key, val] of Object.entries(overrides)) {
				if (typeof val === 'string') args.push('-D', `${key}="${val}"`)
				else args.push('-D', `${key}=${val}`)
			}
		}

		args.push(scadFile)

		const proc = spawn('openscad', args, { signal: controller.signal })

		let stderr = ''
		proc.stderr?.on('data', (chunk: Buffer) => {
			stderr += chunk.toString()
		})

		proc.on('close', (code) => {
			scadBuilds.delete(slug)
			if (controller.signal.aborted) return
			if (code === 0) {
				viteServer.ws.send({ type: 'custom', event: 'scad-update', data: { slug } })
			} else {
				viteServer.ws.send({ type: 'custom', event: 'scad-error', data: { slug, error: stderr } })
			}
		})

		proc.on('error', (err) => {
			scadBuilds.delete(slug)
			if (controller.signal.aborted) return
			viteServer.ws.send({ type: 'custom', event: 'scad-error', data: { slug, error: err.message } })
		})
	}

	return {
		name: 'model-hmr',

		configureServer(server) {
			viteServer = server

			// API endpoint for triggering scad rebuilds with parameter overrides
			server.middlewares.use('/api/scad-rebuild', (req, res) => {
				if (req.method !== 'POST') {
					res.statusCode = 405
					res.end()
					return
				}

				let body = ''
				req.on('data', (chunk: string) => {
					body += chunk
				})
				req.on('end', () => {
					try {
						const { slug, overrides } = JSON.parse(body)
						buildScad(slug, overrides)
						res.statusCode = 200
						res.setHeader('Content-Type', 'application/json')
						res.end(JSON.stringify({ ok: true }))
					} catch {
						res.statusCode = 400
						res.end()
					}
				})
			})
		},

		handleHotUpdate({ file }) {
			// Replicad .ts live-reload
			if (file.endsWith('/src/model.ts')) {
				viteServer.ws.send({ type: 'custom', event: 'model-update', data: { file } })
				return []
			}

			// OpenSCAD .scad live-reload
			if (file.endsWith('.scad')) {
				const srcDir = dirname(file)
				const projectDir = dirname(srcDir)
				const slug = basename(projectDir)
				buildScad(slug)
				return []
			}

			// Prevent full reload when STL changes (triggered by our openscad build)
			if (file.endsWith('.stl')) {
				return []
			}
		},
	}
}

export default defineConfig({
	plugins: [react(), tailwindcss(), modelHmr()],
	optimizeDeps: {
		exclude: ['replicad-opencascadejs'],
	},
	worker: {
		format: 'es',
	},
})
