/** TPU foot for Foxwood Lamp 2.0 E27 Base — bottom face sliced directly from STL */

import { draw, drawCircle } from 'replicad'
import type { Shape3D } from 'replicad'

// --- Parameters ---
const thickness = 3 // [mm] Foot height
const ridge_count = 4 // Concentric grip ridges on desk-contact face
const ridge_height = 0.8 // [mm] Ridge height

// --- Model ---
// _init starts the fetch synchronously (no TDZ, no top-level await race).
// main() awaits it before touching _polygons, so parallel calls are safe.
let _polygons: [number, number][][] | undefined
const _init = fetch(new URL('../Lamp+2.0+E27+Base+By+Foxwood.stl', import.meta.url))
	.then((r) => r.arrayBuffer())
	.then((buf) => {
		_polygons = sliceFlat(buf)
	})

/** Extract 2D boundary loops from the flat bottom face of a binary STL */
function sliceFlat(buffer: ArrayBuffer): [number, number][][] {
	const view = new DataView(buffer)
	const count = view.getUint32(80, true)

	// Parse all triangles, track minimum Z
	let minZ = Infinity
	const tris: [number, number, number][][] = []

	for (let i = 0; i < count; i++) {
		const base = 84 + i * 50
		const tri: [number, number, number][] = []

		for (let v = 0; v < 3; v++) {
			const o = base + 12 + v * 12
			const z = view.getFloat32(o + 8, true)
			tri.push([view.getFloat32(o, true), view.getFloat32(o + 4, true), z])
			if (z < minZ) minZ = z
		}

		tris.push(tri)
	}

	// Keep only triangles whose every vertex sits on the bottom face
	const bottom = tris.filter((t) => t.every(([, , z]) => Math.abs(z - minZ) < 0.01))

	// Boundary edges appear in exactly one triangle (interior edges appear twice and cancel)
	const edgeSet = new Map<string, [[number, number], [number, number]]>()

	for (const tri of bottom) {
		const verts = tri.map(([x, y]) => [x, y] as [number, number])

		for (let i = 0; i < 3; i++) {
			const a = verts[i]!
			const b = verts[(i + 1) % 3]!
			const ka = `${a[0].toFixed(4)},${a[1].toFixed(4)}`
			const kb = `${b[0].toFixed(4)},${b[1].toFixed(4)}`
			const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`
			if (edgeSet.has(key)) edgeSet.delete(key)
			else edgeSet.set(key, [a, b])
		}
	}

	// Build undirected adjacency from boundary edges
	const adj = new Map<string, [number, number][]>()

	for (const [a, b] of edgeSet.values()) {
		const ka = `${a[0].toFixed(4)},${a[1].toFixed(4)}`
		const kb = `${b[0].toFixed(4)},${b[1].toFixed(4)}`
		if (!adj.has(ka)) adj.set(ka, [])
		if (!adj.has(kb)) adj.set(kb, [])
		adj.get(ka)!.push(b)
		adj.get(kb)!.push(a)
	}

	// Walk adjacency to chain boundary edges into closed loops
	const visited = new Set<string>()
	const loops: [number, number][][] = []

	for (const startKey of adj.keys()) {
		if (visited.has(startKey)) continue
		const loop: [number, number][] = []
		let cur = startKey
		let prev: string | null = null

		while (!visited.has(cur)) {
			visited.add(cur)
			loop.push(cur.split(',').map(Number) as [number, number])
			const prevKey = prev
			const next = (adj.get(cur) ?? []).find((n) => `${n[0].toFixed(4)},${n[1].toFixed(4)}` !== prevKey)
			if (!next) break
			prev = cur
			cur = `${next[0].toFixed(4)},${next[1].toFixed(4)}`
		}

		if (loop.length > 2) loops.push(rdp(loop, 0.3))
	}

	return loops
}

/** Ramer-Douglas-Peucker polyline simplification */
function rdp(pts: [number, number][], eps: number): [number, number][] {
	if (pts.length <= 2) return pts
	const [ax, ay] = pts[0]!
	const [bx, by] = pts[pts.length - 1]!
	const dx = bx - ax
	const dy = by - ay
	const len = Math.sqrt(dx * dx + dy * dy)
	let idx = 0
	let maxD = 0

	for (let i = 1; i < pts.length - 1; i++) {
		const [px, py] = pts[i]!
		const d = len > 0 ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / len : Math.hypot(px - ax, py - ay)

		if (d > maxD) {
			maxD = d
			idx = i
		}
	}

	if (maxD <= eps) return [pts[0]!, pts[pts.length - 1]!]
	return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)]
}

/** Shoelace signed area — positive = CCW (outer loop), negative = CW (hole) */
function signedArea(pts: [number, number][]): number {
	return (
		pts.reduce((sum, [x1, y1], i) => {
			const [x2, y2] = pts[(i + 1) % pts.length]!
			return sum + x1 * y2 - x2 * y1
		}, 0) / 2
	)
}

/** Convert a point list into a closed Drawing via chained lineTo calls */
function penFrom(pts: [number, number][]) {
	let pen = draw(pts[0])
	for (const pt of pts.slice(1)) pen = pen.lineTo(pt)
	return pen.close()
}

export default async function main(overrides?: Record<string, number>): Promise<Shape3D> {
	await _init
	const polygons = _polygons!
	const t = overrides?.thickness ?? thickness
	const rc = Math.round(overrides?.ridge_count ?? ridge_count)
	const rh = overrides?.ridge_height ?? ridge_height

	// CCW loops (positive area) are outer boundaries; CW loops are holes
	const outers = polygons.filter((p) => signedArea(p) > 0)
	const holes = polygons.filter((p) => signedArea(p) < 0)

	// If STL winding is reversed (all negative), flip all loops so they're usable
	const mainLoops = outers.length ? outers : polygons.map((p) => [...p].reverse())
	const holeLoops = outers.length ? holes : []

	const primary = mainLoops.reduce((a, b) => (Math.abs(signedArea(a)) >= Math.abs(signedArea(b)) ? a : b))

	// Rebuild the drawing as needed (Drawing objects are consumed by sketchOnPlane)
	const stamp = () => {
		let d = penFrom(primary)
		for (const hole of holeLoops) d = d.cut(penFrom(hole))
		return d
	}

	// Bottom face (Z=0) is smooth — glue this to the lamp.
	// Top face (Z=t) gets the ridges — this faces the desk.
	// Print with the ridged face DOWN on textured PEI so ridge tips pick up the bed texture.
	let shape = stamp().sketchOnPlane('XY').extrude(t) as Shape3D

	if (rc > 0 && rh > 0) {
		// Derive inner/outer radius from the polygon's vertex radii
		const allRadii = primary.map(([x, y]) => Math.sqrt(x * x + y * y))
		const innerR = Math.min(...allRadii)
		const outerR = Math.max(...allRadii)
		const span = outerR - innerR
		// Ridge width is 45% of the inter-ridge spacing, leaving 55% as gap
		const ridgeW = (span / (rc + 1)) * 0.45

		// Extend the stamp footprint upward to use as a clip solid for the ridges.
		// This ensures ridges are cut to the ring-with-notch outline, not full circles.
		const clipSolid = stamp()
			.sketchOnPlane('XY')
			.extrude(t + rh) as Shape3D

		for (let i = 1; i <= rc; i++) {
			const centerR = innerR + span * (i / (rc + 1))
			const ridge = drawCircle(centerR + ridgeW / 2)
				.cut(drawCircle(centerR - ridgeW / 2))
				.sketchOnPlane('XY', t)
				.extrude(rh) as Shape3D
			shape = shape.fuse(ridge.intersect(clipSolid))
		}
	}

	return shape
}
