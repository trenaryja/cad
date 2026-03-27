/// <reference types="vite/client" />
import type { ThreeElements } from '@react-three/fiber'

declare module 'replicad-threejs-helper' {
	import type { BufferGeometry } from 'three'
	export function syncFaces(geometry: BufferGeometry, faces: any): void
	export function syncLines(geometry: BufferGeometry, edges: any): void
	export function syncLinesFromFaces(lines: BufferGeometry, body: BufferGeometry): void
	export function syncGeometries(meshed: any[], previous: any[]): any[]
}

declare global {
	namespace React {
		namespace JSX {
			// R3F extends JSX with Three.js elements
			interface IntrinsicElements extends ThreeElements {}
		}
	}
}

declare module '*.wasm?url' {
	const url: string
	export default url
}

declare module '*?worker' {
	const workerConstructor: new () => Worker
	export default workerConstructor
}
