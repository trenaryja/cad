/** Parse parameters from .scad and .ts model source files */

type ParamBase = {
	name: string
	unit?: string
	description?: string
	group: string
}

export type Param =
	| (ParamBase & { type: 'boolean'; value: boolean })
	| (ParamBase & { type: 'number'; value: number })
	| (ParamBase & { type: 'string'; value: string })

/**
 * Parse parameters from a .scad source file.
 * Pattern: `name = value; // [unit] description` under `// --- Group ---` headers
 */
function parseScadParams(source: string): Param[] {
	const params: Param[] = []
	let group = 'Parameters'

	for (const line of source.split('\n')) {
		// Group header: // --- Group Name ---
		const groupMatch = /^\/\/\s*---(.+?)---/.exec(line)

		if (groupMatch) {
			const g = groupMatch[1]!.trim()
			// Stop at "Computed" section — those aren't user params
			if (/computed/i.test(g)) break
			group = g
			continue
		}

		// Parameter: name = value; // [unit] description
		const paramMatch = /^(\w+)\s*=([^;]+);\s*(?:\/\/(.*))?$/.exec(line)
		if (!paramMatch) continue
		const [, name = '', rawValue = '', comment] = paramMatch

		// Skip $fn and other special variables
		if (name.startsWith('$')) continue

		const parsed = parseValue(rawValue)
		if (!parsed) continue

		const { unit, description } = parseComment(comment)
		params.push({ name, ...parsed, unit, description, group })
	}

	return params
}

/**
 * Parse parameters from a replicad .ts source file.
 * Pattern: `const name = value // [unit] description` under `// --- Group ---` headers
 */
function parseTsParams(source: string): Param[] {
	const params: Param[] = []
	let group = 'Parameters'
	let inParams = false

	for (const line of source.split('\n')) {
		// Group header: // --- Group Name ---
		const groupMatch = /^\/\/\s*---(.+?)---/.exec(line)

		if (groupMatch) {
			const g = groupMatch[1]!.trim()
			// Start capturing at any group, stop at "Model" or "Computed"
			if (/computed|model/i.test(g)) break
			group = g
			inParams = true
			continue
		}

		// Only parse after we've seen a parameter group header
		if (!inParams) continue

		// Stop at export/function boundaries
		if (/^export\s|^function\s|^class\s/.test(line.trim())) break

		// Parameter: const name = value // [unit] description
		const paramMatch = /^\s*(?:const|let)\s+(\w+)\s*=((?:[^/]|\/(?!\/))*)(?:\/\/(.*))?$/.exec(line)
		if (!paramMatch) continue
		const [, name = '', rawValue = '', comment] = paramMatch

		const parsed = parseValue(rawValue.trim())
		if (!parsed) continue

		const { unit, description } = parseComment(comment)
		params.push({ name, ...parsed, unit, description, group })
	}

	return params
}

type ParsedValue =
	{ value: boolean; type: 'boolean' } | { value: number; type: 'number' } | { value: string; type: 'string' }

function parseValue(raw: string): ParsedValue | null {
	const trimmed = raw.trim().replace(/;$/, '')

	// Boolean
	if (trimmed === 'true' || trimmed === 'false') {
		return { value: trimmed === 'true', type: 'boolean' }
	}

	// Number (int or float)
	const num = Number(trimmed)

	if (!Number.isNaN(num) && trimmed !== '') {
		return { value: num, type: 'number' }
	}

	// String (quoted)
	const strMatch = /^["'](.+?)["']$/.exec(trimmed)

	if (strMatch) {
		return { value: strMatch[1]!, type: 'string' }
	}

	return null
}

function parseComment(comment: string | undefined): { unit?: string; description?: string } {
	const trimmed = comment?.trim()
	if (!trimmed) return {}
	const unitMatch = /^\[([^\]]+)\]\s*(\S.*)?$/.exec(trimmed)

	if (unitMatch) return { unit: unitMatch[1], description: unitMatch[2] }

	return { description: trimmed }
}

export function parseParams(source: string, type: 'openscad' | 'replicad'): Param[] {
	return type === 'openscad' ? parseScadParams(source) : parseTsParams(source)
}

/** Format parameter overrides as OpenSCAD -D flags */
export function toScadOverrides(params: Record<string, boolean | number | string>): string[] {
	return Object.entries(params).flatMap(([key, val]) => {
		if (typeof val === 'string') return ['-D', `${key}="${val}"`]
		return ['-D', `${key}=${val}`]
	})
}
