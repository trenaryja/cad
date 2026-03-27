import { Bounds, Environment, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef } from 'react'
import { syncFaces, syncLines } from 'replicad-threejs-helper'
import * as THREE from 'three'
import type { ThemeColors } from './hooks/use-theme-colors'

THREE.Object3D.DEFAULT_UP.set(0, 0, 1)

// Bambu Lab X1C build plate dimensions (mm)
const BED_X = 256
const BED_Y = 256

interface ThreeSceneProps {
	children: React.ReactNode
	showBuildPlate?: boolean
	colors: ThemeColors
}

export function ThreeScene({ children, showBuildPlate = true, colors }: ThreeSceneProps) {
	return (
		<Canvas
			dpr={Math.min(window.devicePixelRatio, 2)}
			frameloop='demand'
			camera={{ position: [200, 300, 200], fov: 45 }}
			style={{ background: colors.base100 }}
		>
			<Suspense fallback={null}>
				<ambientLight intensity={0.6} />
				<directionalLight position={[50, 80, 60]} intensity={1.2} />
				<directionalLight position={[-30, -20, 40]} intensity={0.4} />
				<Environment preset='studio' />

				<Bounds fit clip margin={1.5}>
					{children}
				</Bounds>

				{showBuildPlate && <BuildPlate colors={colors} />}

				<OrbitControls makeDefault />
			</Suspense>
		</Canvas>
	)
}

function BuildPlate({ colors }: { colors: ThemeColors }) {
	const { invalidate } = useThree()

	useEffect(() => {
		invalidate()
	}, [colors, invalidate])

	return (
		<group>
			{/* Semi-transparent bed surface */}
			<mesh position={[0, 0, -0.1]} rotation={[0, 0, 0]}>
				<planeGeometry args={[BED_X, BED_Y]} />
				<meshBasicMaterial color={colors.base200} transparent opacity={0.3} side={THREE.DoubleSide} />
			</mesh>

			{/* Bed border outline */}
			<lineLoop>
				<bufferGeometry>
					<bufferAttribute
						attach='attributes-position'
						args={[
							new Float32Array([
								-BED_X / 2, -BED_Y / 2, 0,
								BED_X / 2, -BED_Y / 2, 0,
								BED_X / 2, BED_Y / 2, 0,
								-BED_X / 2, BED_Y / 2, 0,
							]),
							3,
						]}
					/>
				</bufferGeometry>
				<lineBasicMaterial color={colors.primary} linewidth={2} />
			</lineLoop>
		</group>
	)
}

interface ReplicadMeshProps {
	faces: any
	edges: any
	wireframe?: boolean
	color?: string
	edgeColor?: string
}

export function ReplicadMesh({ faces, edges, wireframe = false, color, edgeColor }: ReplicadMeshProps) {
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
					color={color ?? '#5a8296'}
					wireframe={wireframe}
					polygonOffset
					polygonOffsetFactor={2.0}
					polygonOffsetUnits={1.0}
				/>
			</mesh>
			<lineSegments geometry={linesRef.current}>
				<lineBasicMaterial color={edgeColor ?? '#3c5a6e'} />
			</lineSegments>
		</group>
	)
}

interface StlMeshProps {
	geometry: THREE.BufferGeometry
	wireframe?: boolean
	color?: string
}

export function StlMesh({ geometry, wireframe = false, color }: StlMeshProps) {
	const { invalidate } = useThree()

	useEffect(() => {
		geometry.computeVertexNormals()
		invalidate()
	}, [geometry, invalidate])

	return (
		<mesh geometry={geometry}>
			<meshStandardMaterial
				color={color ?? '#5a8296'}
				wireframe={wireframe}
				polygonOffset
				polygonOffsetFactor={2.0}
				polygonOffsetUnits={1.0}
			/>
		</mesh>
	)
}
