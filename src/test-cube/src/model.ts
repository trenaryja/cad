/** Parametric cube with fillets — first replicad test model */

import { drawRoundedRectangle } from 'replicad'

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
	const shape = drawRoundedRectangle(w, d, f).sketchOnPlane().extrude(h)
	return (shape as any).fillet(1.5)
}
