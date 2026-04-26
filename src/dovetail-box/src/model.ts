/** Two-piece snap box — multi-body demo with interlocking lid */

import { drawRoundedRectangle, type Shape3D } from 'replicad'

// --- Parameters ---
const width = 60 // [mm] Box width
const depth = 40 // [mm] Box depth
const height = 30 // [mm] Total height
const wall = 3 // [mm] Wall thickness
const lipHeight = 4 // [mm] Interlocking lip depth
const gap = 0.15 // [mm] Clearance between parts
const corner = 3 // [mm] Corner radius

// --- Model ---
export default function main(overrides?: Record<string, number>) {
	const w = overrides?.width ?? width
	const d = overrides?.depth ?? depth
	const h = overrides?.height ?? height
	const wl = overrides?.wall ?? wall
	const lh = overrides?.lipHeight ?? lipHeight
	const g = overrides?.gap ?? gap
	const cr = overrides?.corner ?? corner

	const splitZ = h * 0.6
	const icr = Math.max(0.5, cr - wl)
	const lipWall = (wl - g * 2) / 2

	// Drawing.sketchOnPlane() widens return to SketchInterface | Sketches, making .extrude() return AnyShape (https://github.com/sgenoud/replicad/issues/122)

	// --- Base: open-top box with inner lip ---
	// Outer walls
	const baseWalls = drawRoundedRectangle(w, d, cr)
		.cut(drawRoundedRectangle(w - wl * 2, d - wl * 2, icr))
		.sketchOnPlane()
		.extrude(splitZ) as Shape3D
	// Floor
	const floor = drawRoundedRectangle(w, d, cr).sketchOnPlane().extrude(wl) as Shape3D
	// Inner lip: a thin ridge inside the walls at the top
	const lipRing = drawRoundedRectangle(w - wl * 2, d - wl * 2, icr)
		.cut(drawRoundedRectangle(w - wl * 2 - lipWall * 2, d - wl * 2 - lipWall * 2, Math.max(0.3, icr - lipWall)))
		.sketchOnPlane('XY', splitZ)
		.extrude(lh) as Shape3D

	const base = baseWalls.fuse(floor).fuse(lipRing)

	// --- Lid: sits on top, groove receives the lip ---
	// Lid outer walls that slide over the base
	const lidOuter = drawRoundedRectangle(w, d, cr)
		.cut(drawRoundedRectangle(w - wl * 2, d - wl * 2, icr))
		.sketchOnPlane('XY', splitZ)
		.extrude(lh) as Shape3D
	// Lid top cap
	const lidCap = drawRoundedRectangle(w, d, cr)
		.sketchOnPlane('XY', splitZ + lh)
		.extrude(h - splitZ - lh) as Shape3D

	const lid = lidOuter.fuse(lidCap)

	return [
		{ name: 'base', shape: base },
		{ name: 'lid', shape: lid },
	]
}
