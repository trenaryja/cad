import { useEffect, useState } from 'react'
import type { Project } from '../discovery'
import { parseParams } from '../param-parser'
import type { Param } from '../param-parser'

export type ParamState = {
	/** Parsed parameter definitions from source */
	params: Param[]
	/** Current override values (user-modified) */
	overrides: Record<string, boolean | number | string>
	/** Update a single parameter override */
	setOverride: (name: string, value: boolean | number | string) => void
	/** Reset all overrides to defaults */
	resetOverrides: () => void
	/** Replace all overrides at once (for JSON import) */
	importOverrides: (values: Record<string, boolean | number | string>) => void
}

export function useParams(project: Project): ParamState {
	const [params, setParams] = useState<Param[]>([])
	const [overrides, setOverrides] = useState<Record<string, boolean | number | string>>({})
	const [sourceVersion, setSourceVersion] = useState(0)

	// Re-parse params when the SCAD file is rebuilt via HMR
	useEffect(() => {
		if (!import.meta.hot || project.type !== 'openscad') return
		import.meta.hot.on('scad-update', (data: { slug: string }) => {
			if (data.slug === project.slug) setSourceVersion((v) => v + 1)
		})
	}, [project.slug, project.type])

	useEffect(() => {
		if (!project.sourceUrl) return

		const controller = new AbortController()
		const url = sourceVersion > 0 ? `${project.sourceUrl}?v=${sourceVersion}` : project.sourceUrl
		fetch(url, { signal: controller.signal })
			.then((r) => r.text())
			.then((source) => setParams(parseParams(source, project.type)))
			.catch((error: unknown) => {
				if (error instanceof Error && error.name === 'AbortError') return
				setParams([])
			})

		return () => controller.abort()
	}, [project.sourceUrl, project.type, sourceVersion])

	const setOverride = (name: string, value: boolean | number | string) => {
		setOverrides((prev) => ({ ...prev, [name]: value }))
	}

	const resetOverrides = () => setOverrides({})

	const importOverrides = (values: Record<string, boolean | number | string>) => setOverrides(values)

	return { params, overrides, setOverride, resetOverrides, importOverrides }
}
