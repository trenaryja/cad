#!/usr/bin/env bun
/** Unified CAD build + render CLI — progressive TUI with parallel execution */

import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import * as p from '@clack/prompts'
import chalk from 'chalk'
import { MultiBar, Presets } from 'cli-progress'

// --- Config ---

const VIEWS = [
	{ name: 'iso-A', rx: 54.74, ry: 0, rz: 315 },
	{ name: 'front', rx: 90, ry: 0, rz: 0 },
	{ name: 'iso-B', rx: 54.74, ry: 0, rz: 135 },
	{ name: 'left', rx: 90, ry: 0, rz: 270 },
	{ name: 'top', rx: 0, ry: 0, rz: 0 },
	{ name: 'right', rx: 90, ry: 0, rz: 90 },
	{ name: 'iso-C', rx: 125.26, ry: 0, rz: 45 },
	{ name: 'bottom', rx: 180, ry: 0, rz: 0 },
	{ name: 'back', rx: 90, ry: 0, rz: 180 },
]

const IMGSIZE = '1024,1024'
const IMGSIZE_PX = 1024
const COLORSCHEME = 'Starnight'
const BG_COLOR = '#1a1a2e'
const STROKE_COLOR = '#7fb5cc'
const MAX_CONCURRENT = 3
const ROOT = resolve(import.meta.dir)
const PROJECTS_DIR = join(ROOT, 'src')

// Replicad projection views: named planes for orthographic, direction vectors for isometric.
// Isometric directions computed from OpenSCAD tetrahedral camera angles (rx, ry, rz).
// Direction = object→camera vector (projection plane normal), not view direction.
const REPLICAD_VIEWS: { name: string; camera: import('replicad').ProjectionPlane | [number, number, number] }[] = [
	{ name: 'iso-A', camera: [-0.5774, -0.5774, 0.5774] }, // rx=54.74, rz=315
	{ name: 'front', camera: 'front' },
	{ name: 'iso-B', camera: [0.5774, 0.5774, 0.5774] }, // rx=54.74, rz=135
	{ name: 'left', camera: 'left' },
	{ name: 'top', camera: 'top' },
	{ name: 'right', camera: 'right' },
	{ name: 'iso-C', camera: [0.5774, -0.5774, -0.5774] }, // rx=125.26, rz=45
	{ name: 'bottom', camera: 'bottom' },
	{ name: 'back', camera: 'back' },
]

// --- Helpers ---

type Action = 'build' | 'render'

type ProjectType = 'replicad' | 'scad'

type ProgressFn = (step: number, total: number, label: string) => void

type CLIProject = {
	name: string
	type: ProjectType
}

type Task = { project: CLIProject; action: Action; label: string; total: number }

const isScad = (f: string) => f.endsWith('.scad') && !/\.v\d/.test(f)

async function prompt<T>(promise: Promise<symbol | T>) {
	const result = await promise

	if (p.isCancel(result)) {
		p.cancel('Cancelled.')
		process.exit(0)
	}

	return result
}

function discoverProjects(): CLIProject[] {
	return readdirSync(PROJECTS_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory() && existsSync(join(PROJECTS_DIR, d.name, 'src')))
		.flatMap((d): CLIProject[] => {
			const files = readdirSync(join(PROJECTS_DIR, d.name, 'src'))
			if (files.some(isScad)) return [{ name: d.name, type: 'scad' }]
			if (files.includes('model.ts')) return [{ name: d.name, type: 'replicad' }]
			return []
		})
		.sort((a, b) => a.name.localeCompare(b.name))
}

function findScadFile(project: string) {
	const srcDir = join(PROJECTS_DIR, project, 'src')
	const file = readdirSync(srcDir).find(isScad)
	if (!file) throw new Error(`No .scad source found for ${project}`)
	return join(srcDir, file)
}

function findOpenSCAD() {
	const result = Bun.spawnSync(['which', 'openscad'])
	if (result.exitCode === 0) return result.stdout.toString().trim()
	const macPath = '/Applications/OpenSCAD.app/Contents/MacOS/OpenSCAD'
	if (existsSync(macPath)) return macPath
	throw new Error('openscad not found — install it first')
}

async function run(cmd: string, args: string[], ignoreExit = false) {
	const proc = Bun.spawn([cmd, ...args], { stderr: 'ignore', stdout: 'ignore' })
	const code = await proc.exited
	if (code !== 0 && !ignoreExit) throw new Error(`${cmd} exited with code ${code}`)
	return code
}

async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit: number) {
	const results: T[] = []
	let i = 0

	async function worker() {
		while (i < tasks.length) {
			const idx = i++
			results[idx] = await tasks[idx]!()
		}
	}

	await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()))
	return results
}

// --- Actions ---

async function renderProject(openscad: string, project: string, onProgress: ProgressFn) {
	const scad = findScadFile(project)
	const tmp = mkdtempSync(join(tmpdir(), `cad-render-${project}-`))
	const tiles: string[] = []
	const total = VIEWS.length + 1

	for (let i = 0; i < VIEWS.length; i++) {
		const view = VIEWS[i]!
		onProgress(i, total, view.name)
		const outFile = join(tmp, `${view.name}.png`)
		await run(openscad, [
			'--preview',
			'--projection=ortho',
			`--imgsize=${IMGSIZE}`,
			'--viewall',
			'--autocenter',
			`--colorscheme=${COLORSCHEME}`,
			`--camera=0,0,0,${view.rx},${view.ry},${view.rz},0`,
			'-o',
			outFile,
			scad,
		])
		tiles.push(outFile)
	}

	onProgress(VIEWS.length, total, 'montage')
	// Build 3x3 grid using magick append (avoids montage font issues)
	const rows = [0, 3, 6].map((start) => ['(', ...tiles.slice(start, start + 3), '+append', ')'])
	await run('magick', [...rows.flat(), '-append', join(PROJECTS_DIR, project, 'render.png')])

	onProgress(total, total, 'done')
	rmSync(tmp, { recursive: true })
}

async function buildProject(openscad: string, project: string, onProgress: ProgressFn) {
	const scad = findScadFile(project)
	onProgress(0, 1, 'building')
	await run(openscad, ['-o', join(PROJECTS_DIR, project, `${project}.stl`), scad])
	onProgress(1, 1, 'done')
}

// --- Replicad Actions ---

let replicadReady: Promise<void> | null = null

function ensureReplicad() {
	replicadReady ??= (async () => {
		const { setOC } = await import('replicad')
		const ocModule = await import('replicad-opencascadejs/src/replicad_single.js')
		const opencascade = ocModule.default
		const wasmPath = join(ROOT, 'node_modules/replicad-opencascadejs/src/replicad_single.wasm')
		// init() accepts { locateFile } at runtime but .d.ts omits it (https://github.com/sgenoud/replicad/issues/54)
		const OC = await (
			opencascade as unknown as (config: {
				locateFile: () => string
			}) => Promise<import('replicad-opencascadejs').OpenCascadeInstance>
		)({ locateFile: () => wasmPath })
		setOC(OC)
	})()

	return replicadReady
}

async function loadReplicadShape(project: string) {
	await ensureReplicad()
	const modelPath = join(PROJECTS_DIR, project, 'src/model.ts')
	const mod = await import(modelPath)
	const mainFn = mod.default ?? mod.main
	if (typeof mainFn !== 'function') throw new Error(`${project}/src/model.ts must export a default function`)
	return await mainFn()
}

function fuseAll(result: unknown) {
	if (!Array.isArray(result)) return result as import('replicad').Shape3D
	const shapes = result.map((item) => (item?.shape ?? item) as import('replicad').Shape3D)
	// A model always yields at least one body, so shapes[0] is the fuse seed.
	return shapes.slice(1).reduce((acc, s) => acc.fuse(s), shapes[0]!)
}

async function renderReplicadProject(_unused: string, project: string, onProgress: ProgressFn) {
	const { drawProjection, ProjectionCamera } = await import('replicad')
	const shape = fuseAll(await loadReplicadShape(project))
	const tmp = mkdtempSync(join(tmpdir(), `cad-render-${project}-`))
	const tiles: string[] = []
	const total = REPLICAD_VIEWS.length + 1

	for (let i = 0; i < REPLICAD_VIEWS.length; i++) {
		const view = REPLICAD_VIEWS[i]!
		onProgress(i, total, view.name)

		const cam = typeof view.camera === 'string' ? view.camera : new ProjectionCamera([0, 0, 0], view.camera)
		const { visible } = drawProjection(shape, cam)

		let svg = visible.toSVG(5)
		svg = svg.replace('stroke="black"', `stroke="${STROKE_COLOR}"`)
		svg = svg.replace('stroke-width="0.6%"', 'stroke-width="0.8%"')

		const svgFile = join(tmp, `${view.name}.svg`)
		const pngFile = join(tmp, `${view.name}.png`)
		writeFileSync(svgFile, svg)

		// rsvg-convert for high-quality SVG→PNG, then magick to pad to exact size
		await run('rsvg-convert', [
			svgFile,
			'-w',
			String(IMGSIZE_PX),
			'-h',
			String(IMGSIZE_PX),
			'--keep-aspect-ratio',
			'-b',
			BG_COLOR,
			'-o',
			pngFile,
		])
		// Pad to exact dimensions (rsvg-convert may leave non-square output)
		const extent = `${IMGSIZE_PX}x${IMGSIZE_PX}`
		await run('magick', [pngFile, '-gravity', 'center', '-background', BG_COLOR, '-extent', extent, pngFile])
		tiles.push(pngFile)
	}

	onProgress(REPLICAD_VIEWS.length, total, 'montage')
	const rows = [0, 3, 6].map((start) => ['(', ...tiles.slice(start, start + 3), '+append', ')'])
	await run('magick', [...rows.flat(), '-append', join(PROJECTS_DIR, project, 'render.png')])

	onProgress(total, total, 'done')
	rmSync(tmp, { recursive: true })
}

async function buildReplicadProject(_unused: string, project: string, onProgress: ProgressFn) {
	onProgress(0, 1, 'building')
	const shape = await loadReplicadShape(project)
	const blob: Blob = shape.blobSTL()
	const buffer = Buffer.from(await blob.arrayBuffer())
	await Bun.write(join(PROJECTS_DIR, project, `${project}.stl`), buffer)
	onProgress(1, 1, 'done')
}

// --- Action Dispatch ---

function getActionFn(action: Action, projectType: ProjectType): typeof renderProject {
	if (projectType === 'replicad') {
		return action === 'render' ? renderReplicadProject : buildReplicadProject
	}

	return action === 'render' ? renderProject : buildProject
}

const actionSteps = (action: Action): number => (action === 'render' ? VIEWS.length + 1 : 1)

// --- CLI ---

// ./cad.ts dev — start the Vite viewer dev server. Returns true when it handled the command.
async function maybeRunDev(argv: string[]) {
	if (argv[0] !== 'dev') return false
	const proc = Bun.spawn(['bun', 'run', 'dev', ...argv.slice(1)], {
		cwd: ROOT,
		stdio: ['inherit', 'inherit', 'inherit'],
	})
	process.exitCode = await proc.exited
	return true
}

// Non-interactive parse of flags/positionals into actions + project names (empty ⇒ prompt later).
function parseSelection(argv: string[], allProjects: CLIProject[]) {
	const flags = new Set(argv.filter((a) => a.startsWith('-')))
	const positional = argv.filter((a) => !a.startsWith('-'))
	const projectNames = allProjects.map((project) => project.name)

	const actions: Action[] = []
	if (flags.has('--render') || flags.has('-r')) actions.push('render')
	if (flags.has('--build') || flags.has('-b')) actions.push('build')

	if (flags.has('--all') || flags.has('-a')) return { actions, selectedNames: projectNames }
	if (positional.length === 0) return { actions, selectedNames: [] as string[] }

	const unknown = positional.find((n) => !projectNames.includes(n))

	if (unknown) {
		console.error(`${chalk.red('error')} Unknown project: ${unknown}`)
		console.error(`  Available: ${projectNames.join(', ')}`)
		process.exit(1)
	}

	return { actions, selectedNames: positional }
}

const promptActions = () =>
	prompt(
		p.multiselect<Action>({
			message: 'What would you like to do?',
			options: [
				{ value: 'render', label: 'Render previews', hint: '3x3 composite PNG' },
				{ value: 'build', label: 'Build STLs', hint: 'printable .stl files' },
			],
			required: true,
		}),
	)

const promptProjects = (allProjects: CLIProject[]) =>
	prompt(
		p.multiselect({
			message: 'Which projects?',
			options: allProjects.map((project) => ({
				value: project.name,
				label: project.name,
				hint: project.type === 'replicad' ? '.ts' : '.scad',
			})),
			required: true,
		}),
	)

// OpenSCAD is only needed for .scad projects; returns '' when none are selected.
function resolveOpenSCAD(selected: CLIProject[], interactive: boolean) {
	if (!selected.some((project) => project.type === 'scad')) return ''

	try {
		return findOpenSCAD()
	} catch {
		if (interactive) p.cancel('openscad not found. Install it first.')
		else console.error(`${chalk.red('error')} openscad not found. Install it first.`)
		process.exit(1)
	}
}

async function main() {
	const argv = process.argv.slice(2)
	if (await maybeRunDev(argv)) return

	const allProjects = discoverProjects()
	const parsed = parseSelection(argv, allProjects)

	const interactive = parsed.actions.length === 0 || parsed.selectedNames.length === 0
	if (interactive) p.intro(chalk.bold('cad'))

	const actions = parsed.actions.length ? parsed.actions : await promptActions()
	const selectedNames = parsed.selectedNames.length ? parsed.selectedNames : await promptProjects(allProjects)

	const selected = allProjects.filter((project) => selectedNames.includes(project.name))
	const openscad = resolveOpenSCAD(selected, interactive)

	const tasks = selected.flatMap((project) =>
		actions.map((action) => ({
			project,
			action,
			label: `${action === 'render' ? 'Render' : 'Build '} ${project.name}`,
			total: actionSteps(action),
		})),
	)

	await runTasks(tasks, openscad, interactive)
}

async function runTasks(tasks: Task[], openscad: string, interactive: boolean) {
	if (interactive) console.log()

	const multibar = new MultiBar(
		{
			clearOnComplete: false,
			hideCursor: true,
			format: ` ${chalk.cyan('{bar}')} {percentage}% | {task} | ${chalk.dim('{step}')}`,
			barCompleteChar: '\u2588',
			barIncompleteChar: '\u2591',
			barsize: 24,
		},
		Presets.shades_grey,
	)

	const bars = tasks.map((t) => ({
		...t,
		bar: multibar.create(t.total, 0, { task: t.label, step: 'waiting' }),
	}))

	const errors: { label: string; error: Error }[] = []

	await runWithConcurrency(
		bars.map(({ bar, project, action, total, label }) => async () => {
			const onProgress: ProgressFn = (step, _total, stepLabel) => {
				bar.update(step, { task: label, step: stepLabel })
			}

			try {
				const fn = getActionFn(action, project.type)
				await fn(openscad, project.name, onProgress)
				bar.update(total, { task: label, step: chalk.green('done') })
			} catch (err) {
				bar.update(0, { task: label, step: chalk.red('failed') })
				errors.push({ label, error: err instanceof Error ? err : new Error(String(err)) })
			}

			bar.stop()
		}),
		MAX_CONCURRENT,
	)

	multibar.stop()

	if (errors.length > 0) {
		console.log()
		for (const { label, error } of errors) console.error(`${chalk.red('\u2717')} ${label}: ${error.message}`)
		process.exit(1)
	}

	if (interactive) p.outro(chalk.green('Done!'))
	else console.log(`\n${chalk.green('Done.')}`)
}

main().catch((err) => {
	if (err?.name === 'ExitPromptError') {
		console.log('\nCancelled.')
		process.exit(0)
	}

	console.error(err)
	process.exit(1)
})
