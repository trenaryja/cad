import { useEffect, useState } from 'react'
import type { Project } from '../discovery'
import { parseParams, type Param } from '../param-parser'

export interface ParamState {
	/** Parsed parameter definitions from source */
	params: Param[]
	/** Current override values (user-modified) */
	overrides: Record<string, number | string | boolean>
	/** Update a single parameter override */
	setOverride: (name: string, value: number | string | boolean) => void
	/** Reset all overrides to defaults */
	resetOverrides: () => void
}

export function useParams(project: Project): ParamState {
	const [params, setParams] = useState<Param[]>([])
	const [overrides, setOverrides] = useState<Record<string, number | string | boolean>>({})

	useEffect(() => {
		if (!project.sourceUrl) return

		fetch(project.sourceUrl)
			.then((r) => r.text())
			.then((source) => {
				const parsed = parseParams(source, project.type)
				setParams(parsed)
			})
			.catch(() => setParams([]))
	}, [project.sourceUrl, project.type])

	// Reset overrides when project changes
	useEffect(() => {
		setOverrides({})
	}, [project.slug])

	const setOverride = (name: string, value: number | string | boolean) => {
		setOverrides((prev) => ({ ...prev, [name]: value }))
	}

	const resetOverrides = () => setOverrides({})

	return { params, overrides, setOverride, resetOverrides }
}
