import { usePersistedState } from './use-persisted-state'

/** Material preset names */
export type MaterialPreset = 'pla-matte' | 'petg-glossy' | 'metal' | 'resin'

/** drei environment preset names */
export type EnvPreset = 'apartment' | 'city' | 'dawn' | 'forest' | 'lobby' | 'night' | 'park' | 'studio' | 'sunset' | 'warehouse'

/** MeshPhysicalMaterial properties for each preset */
export const MATERIAL_PRESETS: Record<MaterialPreset, { roughness: number; metalness: number; clearcoat: number; clearcoatRoughness: number; label: string }> = {
	'pla-matte': { roughness: 0.85, metalness: 0.0, clearcoat: 0, clearcoatRoughness: 0, label: 'PLA Matte' },
	'petg-glossy': { roughness: 0.2, metalness: 0.0, clearcoat: 0.8, clearcoatRoughness: 0.1, label: 'PETG Glossy' },
	metal: { roughness: 0.3, metalness: 0.9, clearcoat: 0.3, clearcoatRoughness: 0.05, label: 'Metal' },
	resin: { roughness: 0.1, metalness: 0.0, clearcoat: 1.0, clearcoatRoughness: 0.05, label: 'Resin' },
}

export const ENV_PRESETS: EnvPreset[] = ['studio', 'city', 'dawn', 'forest', 'lobby', 'night', 'park', 'apartment', 'sunset', 'warehouse']

export interface SceneSettings {
	material: MaterialPreset
	setMaterial: (m: MaterialPreset) => void
	envPreset: EnvPreset
	setEnvPreset: (e: EnvPreset) => void
	lightIntensity: number
	setLightIntensity: (v: number) => void
}

export function useSceneSettings(): SceneSettings {
	const [material, setMaterial] = usePersistedState<MaterialPreset>('material', 'pla-matte')
	const [envPreset, setEnvPreset] = usePersistedState<EnvPreset>('envPreset', 'studio')
	const [lightIntensity, setLightIntensity] = usePersistedState<number>('lightIntensity', 1.2)

	return { material, setMaterial, envPreset, setEnvPreset, lightIntensity, setLightIntensity }
}
