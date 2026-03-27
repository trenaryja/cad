import { Bounds, Environment, Grid, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { syncFaces, syncLines } from 'replicad-threejs-helper'
import * as THREE from 'three'

THREE.Object3D.DEFAULT_UP.set(0, 0, 1)

interface ThreeSceneProps {
	children: React.ReactNode
	showGrid?: boolean
}

export interface ThreeSceneHandle {
	resetCamera: () => void
}

export function ThreeScene({ children, showGrid = true }: ThreeSceneProps) {
	return (
		<Canvas
			dpr={Math.min(window.devicePixelRatio, 2)}
			frameloop='demand'
			camera={{ position: [40, 60, 50], fov: 45 }}
			style={{ background: 'oklch(0.15 0 0)' }}
		>
			<Suspense fallback={null}>
				<ambientLight intensity={0.6} />
				<directionalLight position={[50, 80, 60]} intensity={1.2} />
				<directionalLight position={[-30, -20, 40]} intensity={0.4} />
				<Environment preset='studio' />

				<Bounds fit clip observe margin={1.5}>
					{children}
				</Bounds>

				{showGrid && (
					<Grid
						args={[200, 200]}
						cellSize={5}
						cellThickness={0.5}
						cellColor='#444'
						sectionSize={25}
						sectionThickness={1}
						sectionColor='#666'
						fadeDistance={150}
						fadeStrength={1}
						infiniteGrid
					/>
				)}
				<OrbitControls makeDefault />
			</Suspense>
		</Canvas>
	)
}

interface ReplicadMeshProps {
	faces: any
	edges: any
	wireframe?: boolean
}

export function ReplicadMesh({ faces, edges, wireframe = false }: ReplicadMeshProps) {
	const bodyRef = useRef(new THREE.BufferGeometry())
	const linesRef = useRef(new THREE.BufferGeometry())
	const { invalidate } = useThree()

	useEffect(() => {
		if (faces) syncFaces(bodyRef.current, faces)
		if (edges) syncLines(linesRef.current, edges)
		invalidate()
	}, [faces, edges, invalidate])

	useEffect(() => {
		const body = bodyRef.current
		const lines = linesRef.current
		return () => {
			body.dispose()
			lines.dispose()
		}
	}, [])

	return (
		<group>
			<mesh geometry={bodyRef.current}>
				<meshStandardMaterial
					color='#5a8296'
					wireframe={wireframe}
					polygonOffset
					polygonOffsetFactor={2.0}
					polygonOffsetUnits={1.0}
				/>
			</mesh>
			<lineSegments geometry={linesRef.current}>
				<lineBasicMaterial color='#3c5a6e' />
			</lineSegments>
		</group>
	)
}

interface StlMeshProps {
	geometry: THREE.BufferGeometry
	wireframe?: boolean
}

export function StlMesh({ geometry, wireframe = false }: StlMeshProps) {
	const { invalidate } = useThree()

	useEffect(() => {
		geometry.computeVertexNormals()
		invalidate()
	}, [geometry, invalidate])

	return (
		<mesh geometry={geometry}>
			<meshStandardMaterial
				color='#5a8296'
				wireframe={wireframe}
				polygonOffset
				polygonOffsetFactor={2.0}
				polygonOffsetUnits={1.0}
			/>
		</mesh>
	)
}
