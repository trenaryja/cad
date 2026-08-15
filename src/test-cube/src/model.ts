/** Parametric cube with fillets — first replicad test model */

import { drawRoundedRectangle } from 'replicad'
import type { Shape3D } from 'replicad'

// --- Parameters ---
const width = 30 // [mm]
const depth = 30 // [mm]
const height = 20 // [mm]
const fillet = 10 // [mm]

// --- Model ---
export default function main(overrides?: Record<string, number>) {
	const w = overrides?.width ?? width
	const d = overrides?.depth ?? depth
	const h = overrides?.height ?? height
	const f = overrides?.fillet ?? fillet
	// Drawing.sketchOnPlane() widens return to SketchInterface | Sketches, making .extrude() return AnyShape (https://github.com/sgenoud/replicad/issues/122)
	const shape = drawRoundedRectangle(w, d, f).sketchOnPlane().extrude(h) as Shape3D
	return shape.fillet(1.5)
}
