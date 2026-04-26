import { expose } from 'comlink'
import type { Shape3D } from 'replicad'
import { makeCompound, setOC } from 'replicad'
import type { OpenCascadeInstance } from 'replicad-opencascadejs'
import opencascade from 'replicad-opencascadejs/src/replicad_single.js'
import opencascadeWasm from 'replicad-opencascadejs/src/replicad_single.wasm?url'
import type { ReplicadMeshedEdges, ReplicadMeshedFaces } from 'replicad-threejs-helper'

let loaded = false

const init = async () => {
	if (loaded) return
	// init() accepts { locateFile } at runtime but .d.ts omits it (https://github.com/sgenoud/replicad/issues/54)
	const OC = await (opencascade as unknown as (config: { locateFile: () => string }) => Promise<OpenCascadeInstance>)({
		locateFile: () => opencascadeWasm,
	})
	setOC(OC)
	loaded = true
}

const started = init()

interface BodyMesh {
	name: string
	faces: ReplicadMeshedFaces
	edges: ReplicadMeshedEdges
}

interface NamedShape {
	name: string
	shape: Shape3D
}

function isNamedShapeArray(result: unknown): result is NamedShape[] {
	return (
		Array.isArray(result) &&
		result.length > 0 &&
		typeof result[0] === 'object' &&
		result[0] !== null &&
		'name' in result[0] &&
		'shape' in result[0]
	)
}

function meshShape(shape: Shape3D) {
	return {
		faces: shape.mesh({ tolerance: 0.05, angularTolerance: 30 }),
		edges: shape.meshEdges(),
	}
}

type MainFn = (overrides?: Record<string, number | string | boolean>) => Shape3D | NamedShape[]

function callMain(mainFn: MainFn, overrides?: Record<string, number | string | boolean>) {
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
		return compound.blobSTL()
	}
	return result.blobSTL()
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
		return compound.blobSTEP()
	}
	return result.blobSTEP()
}

expose({ buildModelFromImport, exportSTL, exportSTEP })
