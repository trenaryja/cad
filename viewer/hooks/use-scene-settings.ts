import { usePersistedState } from './use-persisted-state'

/** Material preset names */
export type MaterialPreset =
	| 'pla-matte'
	| 'petg-glossy'
	| 'silk-pla'
	| 'metal'
	| 'brushed-metal'
	| 'copper'
	| 'resin'
	| 'ceramic'
	| 'nylon'
	| 'glass'
	| 'carbon'
	| 'clay'

/** MeshPhysicalMaterial configuration for each preset */
export interface MaterialConfig {
	label: string
	roughness: number
	metalness: number
	clearcoat?: number
	clearcoatRoughness?: number
	sheen?: number
	sheenRoughness?: number
	sheenColor?: string
	transmission?: number
	ior?: number
	thickness?: number
}

export const MATERIAL_PRESET_KEYS: MaterialPreset[] = [
	'pla-matte',
	'petg-glossy',
	'silk-pla',
	'metal',
	'brushed-metal',
	'copper',
	'resin',
	'ceramic',
	'nylon',
	'glass',
	'carbon',
	'clay',
]

export const MATERIAL_PRESETS: Record<MaterialPreset, MaterialConfig> = {
	'pla-matte': { label: 'PLA Matte', roughness: 0.85, metalness: 0 },
	'petg-glossy': { label: 'PETG Glossy', roughness: 0.2, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.1 },
	'silk-pla': {
		label: 'Silk PLA',
		roughness: 0.3,
		metalness: 0.4,
		clearcoat: 0.5,
		clearcoatRoughness: 0.15,
		sheen: 0.8,
		sheenRoughness: 0.3,
		sheenColor: '#ffffff',
	},
	metal: { label: 'Metal', roughness: 0.3, metalness: 0.9, clearcoat: 0.3, clearcoatRoughness: 0.05 },
	'brushed-metal': { label: 'Brushed', roughness: 0.5, metalness: 0.95, clearcoat: 0.15, clearcoatRoughness: 0.2 },
	copper: { label: 'Copper', roughness: 0.25, metalness: 1.0, clearcoat: 0.1, clearcoatRoughness: 0.1 },
	resin: { label: 'Resin', roughness: 0.1, metalness: 0, clearcoat: 1.0, clearcoatRoughness: 0.05 },
	ceramic: { label: 'Ceramic', roughness: 0.4, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.15 },
	nylon: { label: 'Nylon', roughness: 0.7, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.3 },
	glass: { label: 'Glass', roughness: 0.05, metalness: 0, clearcoat: 0.5, transmission: 0.9, ior: 1.5, thickness: 2 },
	carbon: { label: 'Carbon', roughness: 0.6, metalness: 0.1, clearcoat: 0.5, clearcoatRoughness: 0.1 },
	clay: { label: 'Clay', roughness: 1.0, metalness: 0 },
}

/** Extract mesh-applicable material props (everything except label) */
export function materialProps(mat: MaterialConfig): Record<string, unknown> {
	return Object.fromEntries(Object.entries(mat).filter(([k, v]) => k !== 'label' && v !== undefined))
}

/** drei environment preset names */
export type EnvPreset = 'studio' | 'sunset' | 'dawn' | 'warehouse'

export const ENV_PRESETS: EnvPreset[] = ['studio', 'sunset', 'dawn', 'warehouse']

export interface SceneSettings {
	material: MaterialPreset
	setMaterial: (m: MaterialPreset) => void
	envPreset: EnvPreset
	setEnvPreset: (e: EnvPreset) => void
	lightIntensity: number
	setLightIntensity: (v: number) => void
	ambientIntensity: number
	setAmbientIntensity: (v: number) => void
	showBuildPlate: boolean
	setShowBuildPlate: (v: boolean) => void
	wireframe: boolean
	setWireframe: (v: boolean) => void
	showEdges: boolean
	setShowEdges: (v: boolean) => void
	autoRotate: boolean
	setAutoRotate: (v: boolean) => void
}

export function useSceneSettings(): SceneSettings {
	const [material, setMaterial] = usePersistedState<MaterialPreset>('material', 'pla-matte')
	const [envPreset, setEnvPreset] = usePersistedState<EnvPreset>('envPreset', 'studio')
	const [lightIntensity, setLightIntensity] = usePersistedState('lightIntensity', 1.2)
	const [ambientIntensity, setAmbientIntensity] = usePersistedState('ambientIntensity', 0.6)
	const [showBuildPlate, setShowBuildPlate] = usePersistedState('showBuildPlate', true)
	const [wireframe, setWireframe] = usePersistedState('wireframe', false)
	const [showEdges, setShowEdges] = usePersistedState('showEdges', true)
	const [autoRotate, setAutoRotate] = usePersistedState('autoRotate', false)

	return {
		material,
		setMaterial,
		envPreset,
		setEnvPreset,
		lightIntensity,
		setLightIntensity,
		ambientIntensity,
		setAmbientIntensity,
		showBuildPlate,
		setShowBuildPlate,
		wireframe,
		setWireframe,
		showEdges,
		setShowEdges,
		autoRotate,
		setAutoRotate,
	}
}
