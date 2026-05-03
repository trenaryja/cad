import { useEffect, useState } from 'react'
import type { Project } from '../discovery'
import { type Param, parseParams } from '../param-parser'

export interface ParamState {
	/** Parsed parameter definitions from source */
	params: Param[]
	/** Current override values (user-modified) */
	overrides: Record<string, number | string | boolean>
	/** Update a single parameter override */
	setOverride: (name: string, value: number | string | boolean) => void
	/** Reset all overrides to defaults */
	resetOverrides: () => void
	/** Replace all overrides at once (for JSON import) */
	importOverrides: (values: Record<string, number | string | boolean>) => void
}

export function useParams(project: Project): ParamState {
	const [params, setParams] = useState<Param[]>([])
	const [overrides, setOverrides] = useState<Record<string, number | string | boolean>>({})
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

		const url = sourceVersion > 0 ? `${project.sourceUrl}?v=${sourceVersion}` : project.sourceUrl
		fetch(url)
			.then((r) => r.text())
			.then((source) => {
				const parsed = parseParams(source, project.type)
				setParams(parsed)
			})
			.catch(() => setParams([]))
	}, [project.sourceUrl, project.type, sourceVersion])

	// Reset overrides when project changes
	useEffect(() => {
		setOverrides({})
	}, [])

	const setOverride = (name: string, value: number | string | boolean) => {
		setOverrides((prev) => ({ ...prev, [name]: value }))
	}

	const resetOverrides = () => setOverrides({})

	const importOverrides = (values: Record<string, number | string | boolean>) => setOverrides(values)

	return { params, overrides, setOverride, resetOverrides, importOverrides }
}
