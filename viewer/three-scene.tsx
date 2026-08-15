import { Bounds, Environment, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import type { ReplicadMeshedEdges, ReplicadMeshedFaces } from 'replicad-threejs-helper'
import { syncFaces, syncLines } from 'replicad-threejs-helper'
import * as THREE from 'three'
import type { EnvPreset, MaterialPreset } from './hooks/use-scene-settings'
import { MATERIAL_PRESETS, materialProps } from './hooks/use-scene-settings'
import type { ThemeColors } from './hooks/use-theme-colors'

THREE.Object3D.DEFAULT_UP.set(0, 0, 1)

// Bambu Lab X1C build plate dimensions (mm)
const BED_X = 256
const BED_Y = 256

type ThreeSceneProps = {
	children: React.ReactNode
	showBuildPlate?: boolean
	colors: ThemeColors
	envPreset?: EnvPreset
	lightIntensity?: number
	ambientIntensity?: number
	autoRotate?: boolean
}

export function ThreeScene({
	children,
	showBuildPlate = true,
	colors,
	envPreset = 'studio',
	lightIntensity = 1.2,
	ambientIntensity = 0.6,
	autoRotate = false,
}: ThreeSceneProps) {
	return (
		<Canvas
			dpr={Math.min(window.devicePixelRatio, 2)}
			frameloop={autoRotate ? 'always' : 'demand'}
			camera={{ position: [200, 300, 200], fov: 45 }}
			style={{ background: colors.base100 }}
		>
			<Suspense fallback={null}>
				<ambientLight intensity={ambientIntensity} />
				<directionalLight position={[50, 80, 60]} intensity={lightIntensity} />
				<directionalLight position={[-30, -20, 40]} intensity={lightIntensity * 0.33} />
				<Environment preset={envPreset} />

				<Bounds fit clip margin={1.5}>
					{children}
				</Bounds>

				{showBuildPlate && <BuildPlate colors={colors} />}

				<OrbitControls makeDefault autoRotate={autoRotate} autoRotateSpeed={1} />
			</Suspense>
		</Canvas>
	)
}

function BuildPlate({ colors }: { colors: ThemeColors }) {
	const { invalidate } = useThree()

	useEffect(() => {
		invalidate()
	}, [invalidate])

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
								-BED_X / 2,
								-BED_Y / 2,
								0,
								BED_X / 2,
								-BED_Y / 2,
								0,
								BED_X / 2,
								BED_Y / 2,
								0,
								-BED_X / 2,
								BED_Y / 2,
								0,
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

type ReplicadMeshProps = {
	faces: ReplicadMeshedFaces
	edges: ReplicadMeshedEdges
	wireframe?: boolean
	color?: string
	edgeColor?: string
	material?: MaterialPreset
	showEdges?: boolean
}

export function ReplicadMesh({
	faces,
	edges,
	wireframe = false,
	color,
	edgeColor,
	material = 'pla-matte',
	showEdges = true,
}: ReplicadMeshProps) {
	const [bodyGeometry] = useState(() => new THREE.BufferGeometry())
	const [linesGeometry] = useState(() => new THREE.BufferGeometry())
	const { invalidate } = useThree()

	useEffect(() => {
		if (faces) syncFaces(bodyGeometry, faces)
		if (edges) syncLines(linesGeometry, edges)
		invalidate()
	}, [faces, edges, invalidate, bodyGeometry, linesGeometry])

	useEffect(
		() => () => {
			bodyGeometry.dispose()
			linesGeometry.dispose()
		},
		[bodyGeometry, linesGeometry],
	)

	const mat = MATERIAL_PRESETS[material]

	return (
		<group>
			<mesh geometry={bodyGeometry}>
				<meshPhysicalMaterial
					color={color ?? '#5a8296'}
					wireframe={wireframe}
					{...materialProps(mat)}
					polygonOffset
					polygonOffsetFactor={2.0}
					polygonOffsetUnits={1.0}
				/>
			</mesh>
			{showEdges && (
				<lineSegments geometry={linesGeometry}>
					<lineBasicMaterial color={edgeColor ?? '#3c5a6e'} />
				</lineSegments>
			)}
		</group>
	)
}

type StlMeshProps = {
	geometry: THREE.BufferGeometry
	wireframe?: boolean
	color?: string
	material?: MaterialPreset
}

export function StlMesh({ geometry, wireframe = false, color, material = 'pla-matte' }: StlMeshProps) {
	const { invalidate } = useThree()

	useEffect(() => {
		geometry.computeVertexNormals()
		invalidate()
	}, [geometry, invalidate])

	const mat = MATERIAL_PRESETS[material]

	return (
		<mesh geometry={geometry}>
			<meshPhysicalMaterial
				color={color ?? '#5a8296'}
				wireframe={wireframe}
				{...materialProps(mat)}
				polygonOffset
				polygonOffsetFactor={2.0}
				polygonOffsetUnits={1.0}
			/>
		</mesh>
	)
}
