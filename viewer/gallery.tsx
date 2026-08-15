import { useState } from 'react'
import { discoverProjects } from './discovery'
import type { Project } from './discovery'

export function Gallery() {
	const projects = discoverProjects()
	const [search, setSearch] = useState('')

	const filtered = projects.filter((p) => p.slug.toLowerCase().includes(search.toLowerCase()))

	return (
		<div className='min-h-screen bg-base-300 p-6'>
			<div className='mx-auto max-w-6xl'>
				<div className='flex items-center justify-between mb-6'>
					<h1 className='text-3xl font-bold'>CAD Gallery</h1>
					<input
						type='text'
						placeholder='Search projects...'
						className='input input-bordered w-64'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>

				{filtered.length === 0 ? (
					<p className='text-center opacity-50 py-12'>No projects found.</p>
				) : (
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
						{filtered.map((project) => (
							<ProjectCard key={project.slug} project={project} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}

function ProjectCard({ project }: { project: Project }) {
	return (
		<a
			href={`#/project/${project.slug}`}
			className='card bg-base-100 shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden'
		>
			<figure className='aspect-square bg-base-200'>
				{project.thumbnail ? (
					<img src={project.thumbnail} alt={project.slug} className='h-full w-full object-cover' />
				) : (
					<div className='flex h-full w-full items-center justify-center text-4xl opacity-20'>?</div>
				)}
			</figure>
			<div className='card-body p-3'>
				<h2 className='card-title text-sm'>{project.slug}</h2>
				<span className={`badge badge-xs ${project.type === 'replicad' ? 'badge-primary' : 'badge-secondary'}`}>
					{project.type === 'replicad' ? '.ts' : '.scad'}
				</span>
			</div>
		</a>
	)
}
