const modelModules = import.meta.glob<string>('../src/*/src/model.ts', {
	query: '?url',
	import: 'default',
	eager: true,
})

const thumbnailModules = import.meta.glob<string>('../src/*/render.png', {
	query: '?url',
	import: 'default',
	eager: true,
})

const stlModules = import.meta.glob<string>('../src/*/*.stl', {
	query: '?url',
	import: 'default',
	eager: true,
})

const scadModules = import.meta.glob<string>('../src/*/src/*.scad', {
	query: '?url',
	import: 'default',
	eager: true,
})

export type Project = {
	slug: string
	type: 'openscad' | 'replicad'
	thumbnail?: string
	modelUrl?: string
	stlUrl?: string
	sourceUrl?: string
}

export function discoverProjects(): Project[] {
	const projects = new Map<string, Project>()

	// Discover replicad projects (model.ts)
	for (const [path, url] of Object.entries(modelModules)) {
		const match = /\.\.\/src\/([^/]+)\/src\/model\.ts$/.exec(path)
		if (!match) continue
		const slug = match[1]!
		projects.set(slug, {
			slug,
			type: 'replicad',
			modelUrl: url,
			sourceUrl: url,
		})
	}

	// Discover OpenSCAD projects (.scad files)
	for (const [path, url] of Object.entries(scadModules)) {
		const match = /\.\.\/src\/([^/]+)\/src\/[^/]+\.scad$/.exec(path)
		if (!match) continue
		const slug = match[1]!

		if (!projects.has(slug)) {
			projects.set(slug, { slug, type: 'openscad', sourceUrl: url })
		}
	}

	// Attach thumbnails
	for (const [path, url] of Object.entries(thumbnailModules)) {
		const match = /\.\.\/src\/([^/]+)\/render\.png$/.exec(path)
		if (!match) continue
		const slug = match[1]!
		const project = projects.get(slug)
		if (project) project.thumbnail = url
	}

	// Attach STL files
	for (const [path, url] of Object.entries(stlModules)) {
		const match = /\.\.\/src\/([^/]+)\/[^/]+\.stl$/.exec(path)
		if (!match) continue
		const slug = match[1]!
		const project = projects.get(slug)
		if (project) project.stlUrl = url
	}

	return Array.from(projects.values()).sort((a, b) => a.slug.localeCompare(b.slug))
}
