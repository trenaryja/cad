import { useLocalStorage } from '@mantine/hooks'

/**
 * Persists state to localStorage with a namespaced key.
 * URL state (nuqs) can be layered on top when we switch from hash routing to query routing.
 */
export function usePersistedState<T>(key: string, defaultValue: T) {
	return useLocalStorage<T>({
		key: `cad-viewer:${key}`,
		defaultValue,
		getInitialValueInEffect: false,
	})
}
