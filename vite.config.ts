import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function modelHmr(): Plugin {
	return {
		name: 'model-hmr',
		handleHotUpdate({ file, server }) {
			if (file.endsWith('/src/model.ts')) {
				server.ws.send({ type: 'custom', event: 'model-update', data: { file } })
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
