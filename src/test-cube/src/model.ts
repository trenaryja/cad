/** Parametric cube with fillets — first replicad test model */

import { drawRoundedRectangle } from 'replicad'

// --- Parameters ---
const width = 30 // [mm]
const depth = 30 // [mm]
const height = 20 // [mm]
const fillet = 3 // [mm]

// --- Model ---
export default function main() {
	const shape = drawRoundedRectangle(width, depth, fillet).sketchOnPlane().extrude(height)
	return (shape as any).fillet(1.5)
}
