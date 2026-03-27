import { expose } from 'comlink'
import { setOC } from 'replicad'
import opencascade from 'replicad-opencascadejs/src/replicad_single.js'
import opencascadeWasm from 'replicad-opencascadejs/src/replicad_single.wasm?url'

let loaded = false

const init = async () => {
	if (loaded) return
	const OC = await (opencascade as any)({
		locateFile: () => opencascadeWasm,
	})
	setOC(OC)
	loaded = true
}

const started = init()

async function buildModel(modelCode: string) {
	await started

	const blob = new Blob([modelCode], { type: 'text/javascript' })
	const url = URL.createObjectURL(blob)
	try {
		const mod = await import(/* @vite-ignore */ url)
		const mainFn = mod.default || mod.main
		if (typeof mainFn !== 'function') {
			throw new Error('Model must export a default function')
		}
		const shape = mainFn()
		return {
			faces: shape.mesh({ tolerance: 0.05, angularTolerance: 30 }),
			edges: shape.meshEdges({ keepMesh: true }),
		}
	} finally {
		URL.revokeObjectURL(url)
	}
}

async function buildModelFromImport(modelPath: string) {
	await started
	const mod = await import(/* @vite-ignore */ modelPath)
	const mainFn = mod.default || mod.main
	if (typeof mainFn !== 'function') {
		throw new Error('Model must export a default function')
	}
	const shape = mainFn()
	return {
		faces: shape.mesh({ tolerance: 0.05, angularTolerance: 30 }),
		edges: shape.meshEdges({ keepMesh: true }),
	}
}

async function exportSTL(modelPath: string): Promise<Blob> {
	await started
	const mod = await import(/* @vite-ignore */ modelPath)
	const mainFn = mod.default || mod.main
	if (typeof mainFn !== 'function') {
		throw new Error('Model must export a default function')
	}
	const shape = mainFn()
	return shape.blobSTL() as Blob
}

async function exportSTEP(modelPath: string): Promise<Blob> {
	await started
	const mod = await import(/* @vite-ignore */ modelPath)
	const mainFn = mod.default || mod.main
	if (typeof mainFn !== 'function') {
		throw new Error('Model must export a default function')
	}
	const shape = mainFn()
	return shape.blobSTEP() as Blob
}

expose({ buildModel, buildModelFromImport, exportSTL, exportSTEP })
