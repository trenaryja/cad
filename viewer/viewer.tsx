import { ThemePicker } from '@trenaryja/ui'
import { wrap } from 'comlink'
import { useEffect, useRef, useState } from 'react'
import type { BufferGeometry } from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { discoverProjects, type Project } from './discovery'
import { useParams } from './hooks/use-params'
import { usePersistedState } from './hooks/use-persisted-state'
import { useThemeColors } from './hooks/use-theme-colors'
import { ParamRail } from './param-rail'
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

interface BodyMesh {
	name: string
	faces: any
	edges: any
}

interface ModelData {
	multiBody: boolean
	// Single body
	faces?: any
	edges?: any
	// Multi body
	bodies?: BodyMesh[]
}

function useReplicadModel(modelUrl: string | undefined, overrides?: Record<string, number | string | boolean>) {
	const [model, setModel] = useState<ModelData | null>(null)
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
			.buildModelFromImport(url, overrides)
			.then((data: ModelData) => {
				setModel(data)
				setLoading(false)
				hasLoaded.current = true
			})
			.catch((err: Error) => {
				setError(err.message)
				setLoading(false)
			})
	}, [modelUrl, version, overrides])

	return { model, error, loading }
}

function useStlModel(stlUrl: string | undefined, slug?: string) {
	const [geometry, setGeometry] = useState<BufferGeometry | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)
	const [version, setVersion] = useState(0)
	const [building, setBuilding] = useState(false)
	const hasLoaded = useRef(false)

	// Listen for OpenSCAD HMR events
	useEffect(() => {
		if (!import.meta.hot || !slug) return
		import.meta.hot.on('scad-building', (data: { slug: string }) => {
			if (data.slug === slug) setBuilding(true)
		})
		import.meta.hot.on('scad-update', (data: { slug: string }) => {
			if (data.slug === slug) {
				setBuilding(false)
				setVersion((v) => v + 1)
			}
		})
		import.meta.hot.on('scad-error', (data: { slug: string; error: string }) => {
			if (data.slug === slug) {
				setBuilding(false)
				setError(data.error)
			}
		})
	}, [slug])

	useEffect(() => {
		if (!stlUrl) {
			setLoading(false)
			return
		}
		if (!hasLoaded.current) setLoading(true)
		setError(null)

		const loader = new STLLoader()
		const url = version > 0 ? `${stlUrl}?v=${version}` : stlUrl
		loader.load(
			url,
			(geo) => {
				setGeometry(geo)
				setLoading(false)
				hasLoaded.current = true
			},
			undefined,
			(err) => {
				setError(err instanceof Error ? err.message : 'Failed to load STL')
				setLoading(false)
			},
		)
	}, [stlUrl, version])

	return { geometry, error, loading, building }
}

interface ViewerProps {
	slug: string
}

export function Viewer({ slug }: ViewerProps) {
	const projects = discoverProjects()
	const project = projects.find((p) => p.slug === slug)

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

	return <ProjectViewer project={project} />
}

export interface BodyState {
	visible: Record<string, boolean>
	colors: Record<string, string>
	setVisible: (name: string, visible: boolean) => void
	setColor: (name: string, color: string) => void
	bodyNames: string[]
}

function ProjectViewer({ project }: { project: Project }) {
	const colors = useThemeColors()
	const [showBuildPlate, setShowBuildPlate] = usePersistedState('showBuildPlate', true)
	const [wireframe, setWireframe] = usePersistedState('wireframe', false)
	const paramState = useParams(project)
	const [bodyVisible, setBodyVisible] = useState<Record<string, boolean>>({})
	const [bodyColors, setBodyColors] = useState<Record<string, string>>({})
	const [bodyNames, setBodyNames] = useState<string[]>([])

	const bodyState: BodyState = {
		visible: bodyVisible,
		colors: bodyColors,
		setVisible: (name, vis) => setBodyVisible((prev) => ({ ...prev, [name]: vis })),
		setColor: (name, color) => setBodyColors((prev) => ({ ...prev, [name]: color })),
		bodyNames,
	}

	return (
		<div className='h-screen bg-base-300'>
			<ParamRail params={paramState} bodyState={bodyNames.length > 0 ? bodyState : undefined}>
				<ViewerToolbar
					project={project}
					showBuildPlate={showBuildPlate}
					wireframe={wireframe}
					onToggleBuildPlate={() => setShowBuildPlate((b) => !b)}
					onToggleWireframe={() => setWireframe((w) => !w)}
				/>
				<div className='flex-1 relative'>
					{project.type === 'replicad' ? (
						<ReplicadViewer project={project} showBuildPlate={showBuildPlate} wireframe={wireframe} colors={colors} overrides={paramState.overrides} bodyState={bodyState} onBodiesDiscovered={setBodyNames} />
					) : (
						<OpenScadViewer project={project} showBuildPlate={showBuildPlate} wireframe={wireframe} colors={colors} overrides={paramState.overrides} />
					)}
				</div>
			</ParamRail>
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
	showBuildPlate,
	wireframe,
	onToggleBuildPlate,
	onToggleWireframe,
}: {
	project: Project
	showBuildPlate: boolean
	wireframe: boolean
	onToggleBuildPlate: () => void
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
			<h1 className='text-lg font-semibold flex-1'>{project.slug}</h1>
			<label className='flex items-center gap-1.5 text-sm cursor-pointer'>
				<input type='checkbox' className='toggle toggle-xs' checked={showBuildPlate} onChange={onToggleBuildPlate} />
				Bed
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
			<ThemePicker variant='popover' />
		</div>
	)
}

interface SceneViewerProps {
	project: Project
	showBuildPlate: boolean
	wireframe: boolean
	colors: import('./hooks/use-theme-colors').ThemeColors
	overrides?: Record<string, number | string | boolean>
	bodyState?: BodyState
	onBodiesDiscovered?: (names: string[]) => void
}

// Palette for multi-body models — cycles through distinct hues
const BODY_COLORS = ['#5a8296', '#96785a', '#7a5a96', '#5a9672', '#96605a', '#5a7896', '#8a965a', '#965a8a']

function ReplicadViewer({ project, showBuildPlate, wireframe, colors, overrides, bodyState, onBodiesDiscovered }: SceneViewerProps) {
	const { model, error, loading } = useReplicadModel(project.modelUrl, overrides)

	// Report discovered body names to parent
	useEffect(() => {
		if (!model?.multiBody || !model.bodies || !onBodiesDiscovered) return
		onBodiesDiscovered(model.bodies.map((b) => b.name))
	}, [model, onBodiesDiscovered])

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

	if (!model) return null

	if (model.multiBody && model.bodies) {
		return (
			<ThreeScene showBuildPlate={showBuildPlate} colors={colors}>
				{model.bodies.map((body, i) => {
					const isVisible = bodyState?.visible[body.name] !== false
					if (!isVisible) return null
					const bodyColor = bodyState?.colors[body.name] || BODY_COLORS[i % BODY_COLORS.length]
					return (
						<ReplicadMesh
							key={body.name}
							faces={body.faces}
							edges={body.edges}
							wireframe={wireframe}
							color={bodyColor}
							edgeColor={colors.base300}
						/>
					)
				})}
			</ThreeScene>
		)
	}

	return (
		<ThreeScene showBuildPlate={showBuildPlate} colors={colors}>
			<ReplicadMesh faces={model.faces} edges={model.edges} wireframe={wireframe} color={colors.baseContent} edgeColor={colors.base300} />
		</ThreeScene>
	)
}

function OpenScadViewer({ project, showBuildPlate, wireframe, colors, overrides }: SceneViewerProps) {
	const { geometry, error, loading, building } = useStlModel(project.stlUrl, project.slug)

	// Trigger rebuild when param overrides change
	useEffect(() => {
		if (!overrides || Object.keys(overrides).length === 0) return
		fetch('/api/scad-rebuild', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ slug: project.slug, overrides }),
		}).catch(() => {})
	}, [overrides, project.slug])

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
				<div className='alert alert-error max-w-lg whitespace-pre-wrap'>{error}</div>
			</div>
		)
	}

	if (!geometry) return null

	return (
		<>
			{building && (
				<div className='absolute top-14 left-1/2 -translate-x-1/2 z-10'>
					<div className='badge badge-warning gap-1'>
						<span className='loading loading-spinner loading-xs' />
						Rebuilding...
					</div>
				</div>
			)}
			<ThreeScene showBuildPlate={showBuildPlate} colors={colors}>
				<StlMesh geometry={geometry} wireframe={wireframe} color={colors.baseContent} />
			</ThreeScene>
		</>
	)
}
