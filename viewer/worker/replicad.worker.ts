import { expose } from 'comlink'
import { makeCompound, setOC } from 'replicad'
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

interface BodyMesh {
	name: string
	faces: any
	edges: any
}

interface NamedShape {
	name: string
	shape: any
}

function isNamedShapeArray(result: unknown): result is NamedShape[] {
	return Array.isArray(result) && result.length > 0 && typeof result[0] === 'object' && result[0] !== null && 'name' in result[0] && 'shape' in result[0]
}

function meshShape(shape: any) {
	return {
		faces: shape.mesh({ tolerance: 0.05, angularTolerance: 30 }),
		edges: shape.meshEdges({ keepMesh: true }),
	}
}

function callMain(mainFn: Function, overrides?: Record<string, number | string | boolean>) {
	return overrides && Object.keys(overrides).length > 0 ? mainFn(overrides) : mainFn()
}

async function buildModelFromImport(modelPath: string, overrides?: Record<string, number | string | boolean>) {
	await started
	const mod = await import(/* @vite-ignore */ modelPath)
	const mainFn = mod.default || mod.main
	if (typeof mainFn !== 'function') {
		throw new Error('Model must export a default function')
	}
	const result = callMain(mainFn, overrides)

	// Multi-body: array of { name, shape }
	if (isNamedShapeArray(result)) {
		const bodies: BodyMesh[] = result.map((b) => ({
			name: b.name,
			...meshShape(b.shape),
		}))
		return { bodies, multiBody: true }
	}

	// Single body
	return { ...meshShape(result), multiBody: false }
}

async function exportSTL(modelPath: string): Promise<Blob> {
	await started
	const mod = await import(/* @vite-ignore */ modelPath)
	const mainFn = mod.default || mod.main
	if (typeof mainFn !== 'function') {
		throw new Error('Model must export a default function')
	}
	const result = callMain(mainFn)

	if (isNamedShapeArray(result)) {
		const compound = makeCompound(result.map((b) => b.shape))
		return compound.blobSTL() as Blob
	}
	return result.blobSTL() as Blob
}

async function exportSTEP(modelPath: string): Promise<Blob> {
	await started
	const mod = await import(/* @vite-ignore */ modelPath)
	const mainFn = mod.default || mod.main
	if (typeof mainFn !== 'function') {
		throw new Error('Model must export a default function')
	}
	const result = callMain(mainFn)

	if (isNamedShapeArray(result)) {
		const compound = makeCompound(result.map((b) => b.shape))
		return compound.blobSTEP() as Blob
	}
	return result.blobSTEP() as Blob
}

expose({ buildModelFromImport, exportSTL, exportSTEP })
