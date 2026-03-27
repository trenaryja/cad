const modelModules = import.meta.glob('../src/*/src/model.ts', {
	query: '?url',
	import: 'default',
	eager: true,
})

const thumbnailModules = import.meta.glob('../src/*/render.png', {
	query: '?url',
	import: 'default',
	eager: true,
})

const stlModules = import.meta.glob('../src/*/*.stl', {
	query: '?url',
	import: 'default',
	eager: true,
})

const scadModules = import.meta.glob('../src/*/src/*.scad', {
	query: '?url',
	import: 'default',
	eager: true,
})

export interface Project {
	slug: string
	type: 'replicad' | 'openscad'
	thumbnail?: string
	modelUrl?: string
	stlUrl?: string
	sourceUrl?: string
}

export function discoverProjects(): Project[] {
	const projects = new Map<string, Project>()

	// Discover replicad projects (model.ts)
	for (const [path, url] of Object.entries(modelModules)) {
		const match = path.match(/\.\.\/src\/([^/]+)\/src\/model\.ts$/)
		if (!match) continue
		const slug = match[1]
		projects.set(slug, {
			slug,
			type: 'replicad',
			modelUrl: url as string,
			sourceUrl: url as string,
		})
	}

	// Discover OpenSCAD projects (.scad files)
	for (const [path, url] of Object.entries(scadModules)) {
		const match = path.match(/\.\.\/src\/([^/]+)\/src\/[^/]+\.scad$/)
		if (!match) continue
		const slug = match[1]
		if (!projects.has(slug)) {
			projects.set(slug, { slug, type: 'openscad', sourceUrl: url as string })
		}
	}

	// Attach thumbnails
	for (const [path, url] of Object.entries(thumbnailModules)) {
		const match = path.match(/\.\.\/src\/([^/]+)\/render\.png$/)
		if (!match) continue
		const slug = match[1]
		const project = projects.get(slug)
		if (project) project.thumbnail = url as string
	}

	// Attach STL files
	for (const [path, url] of Object.entries(stlModules)) {
		const match = path.match(/\.\.\/src\/([^/]+)\/[^/]+\.stl$/)
		if (!match) continue
		const slug = match[1]
		const project = projects.get(slug)
		if (project) project.stlUrl = url as string
	}

	return Array.from(projects.values()).sort((a, b) => a.slug.localeCompare(b.slug))
}
