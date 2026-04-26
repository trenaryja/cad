/// <reference types="vite/client" />
import type { ThreeElements } from '@react-three/fiber'

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
