import { wrap } from 'comlink'
import { useEffect, useRef, useState } from 'react'
import type { BufferGeometry } from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { discoverProjects, type Project } from './discovery'
import { ReplicadMesh, StlMesh, ThreeScene } from './three-scene'

// Lazy-init the worker once
let workerApi: any
function getWorker() {
	if (!workerApi) {
		const w = new Worker(new URL('./worker/replicad.worker.ts', import.meta.url), {
			type: 'module',
		})
		workerApi = wrap(w)
	}
	return workerApi
}

interface MeshData {
	faces: any
	edges: any
}

function useReplicadModel(modelUrl: string | undefined) {
	const [mesh, setMesh] = useState<MeshData | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [version, setVersion] = useState(0)
	const hasLoaded = useRef(false)

	// Listen for custom HMR event from model-hmr Vite plugin
	useEffect(() => {
		if (!import.meta.hot) return
		import.meta.hot.on('model-update', () => setVersion((v) => v + 1))
	}, [])

	useEffect(() => {
		if (!modelUrl) return
		if (!hasLoaded.current) setLoading(true)
		setError(null)

		const worker = getWorker()
		const url = version > 0 ? `${modelUrl}?v=${version}` : modelUrl
		worker
			.buildModelFromImport(url)
			.then((data: MeshData) => {
				setMesh(data)
				setLoading(false)
				hasLoaded.current = true
			})
			.catch((err: Error) => {
				setError(err.message)
				setLoading(false)
			})
	}, [modelUrl, version])

	return { mesh, error, loading }
}

function useStlModel(stlUrl: string | undefined) {
	const [geometry, setGeometry] = useState<BufferGeometry | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!stlUrl) {
			setLoading(false)
			return
		}
		setLoading(true)
		setError(null)

		const loader = new STLLoader()
		loader.load(
			stlUrl,
			(geo) => {
				setGeometry(geo)
				setLoading(false)
			},
			undefined,
			(err) => {
				setError(err instanceof Error ? err.message : 'Failed to load STL')
				setLoading(false)
			},
		)
	}, [stlUrl])

	return { geometry, error, loading }
}

interface ViewerProps {
	slug: string
}

export function Viewer({ slug }: ViewerProps) {
	const projects = discoverProjects()
	const project = projects.find((p) => p.slug === slug)

	const [showGrid, setShowGrid] = useState(true)
	const [wireframe, setWireframe] = useState(false)

	if (!project) {
		return (
			<div className='flex h-screen items-center justify-center bg-base-300'>
				<div className='text-center'>
					<h1 className='text-2xl font-bold'>Project not found: {slug}</h1>
					<a href='#/' className='btn btn-primary mt-4'>
						Back to Gallery
					</a>
				</div>
			</div>
		)
	}

	return (
		<div className='flex h-screen flex-col bg-base-300'>
			<ViewerToolbar
				project={project}
				showGrid={showGrid}
				wireframe={wireframe}
				onToggleGrid={() => setShowGrid((g) => !g)}
				onToggleWireframe={() => setWireframe((w) => !w)}
			/>
			<div className='flex-1'>
				{project.type === 'replicad' ? (
					<ReplicadViewer project={project} showGrid={showGrid} wireframe={wireframe} />
				) : (
					<OpenScadViewer project={project} showGrid={showGrid} wireframe={wireframe} />
				)}
			</div>
		</div>
	)
}

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}

function ViewerToolbar({
	project,
	showGrid,
	wireframe,
	onToggleGrid,
	onToggleWireframe,
}: {
	project: Project
	showGrid: boolean
	wireframe: boolean
	onToggleGrid: () => void
	onToggleWireframe: () => void
}) {
	const [exporting, setExporting] = useState(false)

	const handleExport = async (format: 'stl' | 'step') => {
		if (!project.modelUrl || exporting) return
		setExporting(true)
		try {
			const worker = getWorker()
			const blob: Blob =
				format === 'stl' ? await worker.exportSTL(project.modelUrl) : await worker.exportSTEP(project.modelUrl)
			downloadBlob(blob, `${project.slug}.${format}`)
		} catch (err) {
			console.error(`Export failed:`, err)
		} finally {
			setExporting(false)
		}
	}

	return (
		<div className='flex items-center gap-3 bg-base-200 px-4 py-2'>
			<a href='#/' className='btn btn-ghost btn-sm'>
				&larr; Gallery
			</a>
			<h1 className='text-lg font-semibold flex-1'>{project.slug}</h1>
			<span className='badge badge-sm badge-outline'>{project.type === 'replicad' ? '.ts' : '.scad'}</span>
			<label className='flex items-center gap-1.5 text-sm cursor-pointer'>
				<input type='checkbox' className='toggle toggle-xs' checked={showGrid} onChange={onToggleGrid} />
				Grid
			</label>
			<label className='flex items-center gap-1.5 text-sm cursor-pointer'>
				<input type='checkbox' className='toggle toggle-xs' checked={wireframe} onChange={onToggleWireframe} />
				Wireframe
			</label>
			{project.type === 'replicad' && (
				<div className='flex gap-1'>
					<button
						type='button'
						className='btn btn-ghost btn-xs'
						disabled={exporting}
						onClick={() => handleExport('stl')}
					>
						{exporting ? '...' : 'STL'}
					</button>
					<button
						type='button'
						className='btn btn-ghost btn-xs'
						disabled={exporting}
						onClick={() => handleExport('step')}
					>
						{exporting ? '...' : 'STEP'}
					</button>
				</div>
			)}
		</div>
	)
}

function ReplicadViewer({ project, showGrid, wireframe }: { project: Project; showGrid: boolean; wireframe: boolean }) {
	const { mesh, error, loading } = useReplicadModel(project.modelUrl)

	if (loading) {
		return (
			<div className='flex h-full items-center justify-center'>
				<span className='loading loading-spinner loading-lg' />
				<span className='ml-3'>Loading OpenCascade WASM...</span>
			</div>
		)
	}

	if (error) {
		return (
			<div className='flex h-full items-center justify-center'>
				<div className='alert alert-error max-w-lg'>{error}</div>
			</div>
		)
	}

	if (!mesh) return null

	return (
		<ThreeScene showGrid={showGrid}>
			<ReplicadMesh faces={mesh.faces} edges={mesh.edges} wireframe={wireframe} />
		</ThreeScene>
	)
}

function OpenScadViewer({ project, showGrid, wireframe }: { project: Project; showGrid: boolean; wireframe: boolean }) {
	const { geometry, error, loading } = useStlModel(project.stlUrl)

	if (!project.stlUrl) {
		return (
			<div className='flex h-full items-center justify-center'>
				<div className='text-center'>
					<p className='text-lg opacity-60'>No STL file found for this project.</p>
					<p className='text-sm opacity-40 mt-1'>
						Run <code>./cad.ts --build {project.slug}</code> to generate one.
					</p>
				</div>
			</div>
		)
	}

	if (loading) {
		return (
			<div className='flex h-full items-center justify-center'>
				<span className='loading loading-spinner loading-lg' />
				<span className='ml-3'>Loading STL...</span>
			</div>
		)
	}

	if (error) {
		return (
			<div className='flex h-full items-center justify-center'>
				<div className='alert alert-error max-w-lg'>{error}</div>
			</div>
		)
	}

	if (!geometry) return null

	return (
		<ThreeScene showGrid={showGrid}>
			<StlMesh geometry={geometry} wireframe={wireframe} />
		</ThreeScene>
	)
}
