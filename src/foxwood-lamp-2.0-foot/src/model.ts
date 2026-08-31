/** TPU foot for Foxwood Lamp 2.0 E27 Base — bottom face sliced directly from STL */

import { draw, drawCircle } from 'replicad'
import type { Shape3D } from 'replicad'

// --- Parameters ---
const thickness = 3 // [mm] Foot height
const ridgeCount = 4 // Concentric grip ridges on desk-contact face
const ridgeHeight = 0.8 // [mm] Ridge height

// --- Model ---
// _init starts the fetch synchronously (no TDZ, no top-level await race).
// main() awaits it before touching _polygons, so parallel calls are safe.
let _polygons: Point[][] | undefined
const _init = fetch(new URL('../Lamp+2.0+E27+Base+By+Foxwood.stl', import.meta.url))
	.then((r) => r.arrayBuffer())
	.then((buf) => {
		_polygons = sliceFlat(buf)
	})

type Point = [number, number]

type Triangle = [number, number, number][]

/** Rounded coordinate pair, so vertices shared between triangles hash to one key */
const pointKey = ([x, y]: Point) => `${x.toFixed(4)},${y.toFixed(4)}`

/** Read every triangle out of a binary STL, tracking the minimum Z seen */
function parseTriangles(buffer: ArrayBuffer) {
	const view = new DataView(buffer)
	const count = view.getUint32(80, true)
	const triangles: Triangle[] = []
	let minZ = Infinity

	for (let i = 0; i < count; i++) {
		const base = 84 + i * 50
		const triangle: Triangle = []

		for (let vertex = 0; vertex < 3; vertex++) {
			const offset = base + 12 + vertex * 12
			const z = view.getFloat32(offset + 8, true)
			triangle.push([view.getFloat32(offset, true), view.getFloat32(offset + 4, true), z])
			if (z < minZ) minZ = z
		}

		triangles.push(triangle)
	}

	return { triangles, minZ }
}

/** Keep only triangles whose every vertex sits on the bottom face */
const bottomFaceTriangles = (triangles: Triangle[], minZ: number) =>
	triangles.filter((triangle) => triangle.every(([, , z]) => Math.abs(z - minZ) < 0.01))

/** Boundary edges appear in exactly one triangle — interior edges appear twice and cancel */
function boundaryEdges(triangles: Triangle[]) {
	const edges = new Map<string, [Point, Point]>()

	for (const triangle of triangles) {
		const corners = triangle.map(([x, y]) => [x, y] as Point)

		for (let i = 0; i < 3; i++) {
			const start = corners[i]!
			const end = corners[(i + 1) % 3]!
			const startKey = pointKey(start)
			const endKey = pointKey(end)
			const key = startKey < endKey ? `${startKey}|${endKey}` : `${endKey}|${startKey}`
			if (edges.has(key)) edges.delete(key)
			else edges.set(key, [start, end])
		}
	}

	return [...edges.values()]
}

/** Undirected adjacency: every boundary point maps to the points it shares an edge with */
function buildAdjacency(edges: [Point, Point][]) {
	const adjacency = new Map<string, Point[]>()

	const link = (from: Point, to: Point) => {
		const key = pointKey(from)
		if (!adjacency.has(key)) adjacency.set(key, [])
		adjacency.get(key)!.push(to)
	}

	for (const [start, end] of edges) {
		link(start, end)
		link(end, start)
	}

	return adjacency
}

/** Walk the adjacency map to chain boundary edges into closed, simplified loops */
function chainLoops(adjacency: Map<string, Point[]>) {
	const visited = new Set<string>()
	const loops: Point[][] = []

	for (const startKey of adjacency.keys()) {
		if (visited.has(startKey)) continue
		const loop: Point[] = []
		let current = startKey
		let previous: string | null = null

		while (!visited.has(current)) {
			visited.add(current)
			loop.push(current.split(',').map(Number) as Point)
			const previousKey = previous
			const next = (adjacency.get(current) ?? []).find((point) => pointKey(point) !== previousKey)
			if (!next) break
			previous = current
			current = pointKey(next)
		}

		if (loop.length > 2) loops.push(rdp(loop, 0.3))
	}

	return loops
}

/** Extract 2D boundary loops from the flat bottom face of a binary STL */
function sliceFlat(buffer: ArrayBuffer): Point[][] {
	const { triangles, minZ } = parseTriangles(buffer)
	const bottomFace = bottomFaceTriangles(triangles, minZ)
	const edges = boundaryEdges(bottomFace)
	const adjacency = buildAdjacency(edges)
	return chainLoops(adjacency)
}

/** Ramer-Douglas-Peucker polyline simplification */
function rdp(pts: Point[], eps: number): Point[] {
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
function signedArea(pts: Point[]): number {
	return (
		pts.reduce((sum, [x1, y1], i) => {
			const [x2, y2] = pts[(i + 1) % pts.length]!
			return sum + x1 * y2 - x2 * y1
		}, 0) / 2
	)
}

/** Convert a point list into a closed Drawing via chained lineTo calls */
function penFrom(pts: Point[]) {
	let pen = draw(pts[0])
	for (const pt of pts.slice(1)) pen = pen.lineTo(pt)
	return pen.close()
}

export default async function main(overrides?: Record<string, number>): Promise<Shape3D> {
	await _init
	const polygons = _polygons!
	const t = overrides?.thickness ?? thickness
	const rc = Math.round(overrides?.ridgeCount ?? ridgeCount)
	const rh = overrides?.ridgeHeight ?? ridgeHeight

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
