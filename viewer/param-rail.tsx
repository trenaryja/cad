import { useEffect, useRef, useState } from 'react'
import {
	LuBox,
	LuDownload,
	LuGalleryHorizontalEnd,
	LuRotateCcw,
	LuSettings,
	LuSun,
	LuUpload,
	LuX,
} from 'react-icons/lu'
import type { ParamState } from './hooks/use-params'
import type { SceneSettings } from './hooks/use-scene-settings'
import { ENV_PRESETS, MATERIAL_PRESET_KEYS, MATERIAL_PRESETS } from './hooks/use-scene-settings'
import { cssVarToHex, resolveColor } from './hooks/use-theme-colors'
import type { Param } from './param-parser'
import type { BodyState } from './viewer'

type PanelId = 'bodies' | 'params' | 'scene'

export function ParamRail({
	params,
	bodyState,
	sceneSettings,
	slug,
	children,
}: {
	params?: ParamState
	bodyState?: BodyState
	sceneSettings?: SceneSettings
	slug?: string
	children: React.ReactNode
}) {
	const [activePanel, setActivePanel] = useState<PanelId | null>(null)
	const hasParams = params && params.params.length > 0
	const hasOverrides = params && Object.keys(params.overrides).length > 0
	const hasBodies = bodyState && bodyState.bodyNames.length > 0

	const toggle = (panel: PanelId) => setActivePanel((prev) => (prev === panel ? null : panel))

	// Close panel on Escape
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setActivePanel(null)
		}
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [])

	const panelTitles: Record<PanelId, string> = { bodies: 'Bodies', params: 'Parameters', scene: 'Scene' }

	return (
		<div className='flex h-full'>
			{/* Icon strip */}
			<nav className='flex flex-col items-center gap-0.5 w-12 bg-base-200 border-r border-base-300 py-2 shrink-0 z-20'>
				<NavLink href='#/' icon={LuGalleryHorizontalEnd} tooltip='Gallery' />
				<div className='w-6 border-t border-base-300 my-1' />
				{hasBodies && (
					<NavButton icon={LuBox} tooltip='Bodies' active={activePanel === 'bodies'} onClick={() => toggle('bodies')} />
				)}
				{hasParams && (
					<NavButton
						icon={LuSettings}
						tooltip='Parameters'
						active={activePanel === 'params'}
						onClick={() => toggle('params')}
					/>
				)}
				<NavButton icon={LuSun} tooltip='Scene' active={activePanel === 'scene'} onClick={() => toggle('scene')} />
			</nav>

			{/* Content area with overlaying flyout */}
			<div className='flex-1 relative min-w-0'>
				{/* Flyout panel */}
				<div
					className={`absolute left-0 top-0 bottom-0 w-72 bg-base-200/95 backdrop-blur-sm border-r border-base-300 z-10 flex flex-col transition-all duration-200 ease-out ${
						activePanel ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0 pointer-events-none'
					}`}
				>
					{activePanel && (
						<>
							<div className='flex items-center justify-between px-3 py-2 border-b border-base-300'>
								<span className='text-xs font-semibold uppercase tracking-wider opacity-60'>
									{panelTitles[activePanel]}
								</span>
								<button type='button' className='btn btn-ghost btn-xs btn-square' onClick={() => setActivePanel(null)}>
									<LuX className='w-3.5 h-3.5' />
								</button>
							</div>
							<div className='flex-1 overflow-y-auto p-3'>
								{activePanel === 'bodies' && bodyState && <BodyControls bodyState={bodyState} />}
								{activePanel === 'params' && params && (
									<>
										<ParamControls params={params} />
										<ParamActions params={params} slug={slug} hasOverrides={hasOverrides} />
									</>
								)}
								{activePanel === 'scene' && sceneSettings && <SceneControls settings={sceneSettings} />}
							</div>
						</>
					)}
				</div>

				{/* Main content */}
				<div className='h-full flex flex-col'>{children}</div>
			</div>
		</div>
	)
}

// --- Nav strip components ---

function NavLink({
	href,
	icon: Icon,
	tooltip,
}: {
	href: string
	icon: React.ComponentType<{ className?: string }>
	tooltip: string
}) {
	return (
		<a href={href} className='btn btn-ghost btn-square btn-sm' title={tooltip}>
			<Icon className='w-4 h-4' />
		</a>
	)
}

function NavButton({
	icon: Icon,
	tooltip,
	active,
	onClick,
}: {
	icon: React.ComponentType<{ className?: string }>
	tooltip: string
	active: boolean
	onClick: () => void
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			className={`btn btn-ghost btn-square btn-sm relative ${active ? 'bg-base-300' : ''}`}
			title={tooltip}
		>
			<Icon className='w-4 h-4' />
			{active && <div className='absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary' />}
		</button>
	)
}

// --- Body controls ---

/** DaisyUI semantic CSS variables used as swatch colors */
const SWATCH_VARS = [
	{ var: '--color-base-content', label: 'Content' },
	{ var: '--color-primary', label: 'Primary' },
	{ var: '--color-secondary', label: 'Secondary' },
	{ var: '--color-accent', label: 'Accent' },
	{ var: '--color-info', label: 'Info' },
	{ var: '--color-success', label: 'Success' },
	{ var: '--color-warning', label: 'Warning' },
	{ var: '--color-error', label: 'Error' },
	{ var: '--color-base-100', label: 'Base 100' },
	{ var: '--color-base-200', label: 'Base 200' },
	{ var: '--color-base-300', label: 'Base 300' },
]

interface Swatch {
	hex: string
	label: string
	cssVar: string
}

function readSwatchColors(): Swatch[] {
	return SWATCH_VARS.map((s) => ({ hex: cssVarToHex(s.var), label: s.label, cssVar: s.var }))
}

function useSwatchColors() {
	const [swatches, setSwatches] = useState<Swatch[]>([])

	useEffect(() => {
		setSwatches(readSwatchColors())
		const observer = new MutationObserver(() => {
			requestAnimationFrame(() => setSwatches(readSwatchColors()))
		})
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme', 'class', 'style'],
		})
		return () => observer.disconnect()
	}, [])

	return swatches
}

// Palette for multi-body — matches BODY_COLORS in viewer.tsx
const BODY_COLORS = ['#5a8296', '#96785a', '#7a5a96', '#5a9672', '#96605a', '#5a7896', '#8a965a', '#965a8a']

function BodyControls({ bodyState }: { bodyState: BodyState }) {
	const swatches = useSwatchColors()
	const [expandedBody, setExpandedBody] = useState<string | null>(null)

	return (
		<div className='flex flex-col gap-1.5'>
			{bodyState.bodyNames.map((name, i) => {
				const visible = bodyState.visible[name] !== false
				const rawColor = bodyState.colors[name] || BODY_COLORS[i % BODY_COLORS.length]
				const resolvedColor = resolveColor(rawColor)
				const isExpanded = expandedBody === name

				return (
					<div key={name} className='rounded-lg bg-base-300/40 overflow-hidden'>
						{/* Compact row */}
						<div className='flex items-center gap-2 px-2.5 py-1.5'>
							<input
								type='checkbox'
								className='toggle toggle-xs'
								checked={visible}
								onChange={() => bodyState.setVisible(name, !visible)}
							/>
							<span className='text-sm truncate flex-1'>{name}</span>
							<button
								type='button'
								className='w-5 h-5 rounded-full border-2 border-neutral/30 cursor-pointer shrink-0 transition-transform hover:scale-110'
								style={{ backgroundColor: resolvedColor }}
								onClick={() => setExpandedBody(isExpanded ? null : name)}
								title='Change color'
							/>
						</div>

						{/* Expanded color picker */}
						{isExpanded && (
							<div className='px-2.5 pb-2 pt-1.5 border-t border-base-300/50'>
								<div className='flex flex-wrap gap-1 mb-2'>
									{swatches.map((swatch) => (
										<button
											key={swatch.label}
											type='button'
											title={swatch.label}
											className='w-5 h-5 rounded-full border border-neutral/20 cursor-pointer transition-transform hover:scale-125'
											style={{
												backgroundColor: swatch.hex,
												outline: rawColor === swatch.cssVar ? '2px solid var(--color-primary)' : undefined,
												outlineOffset: '1px',
											}}
											onClick={() => {
												bodyState.setColor(name, swatch.cssVar)
											}}
										/>
									))}
								</div>
								<input
									type='color'
									className='w-full h-7 cursor-pointer rounded border border-neutral/20 p-0'
									value={resolvedColor}
									onChange={(e) => bodyState.setColor(name, e.target.value)}
								/>
							</div>
						)}
					</div>
				)
			})}
		</div>
	)
}

// --- Scene controls ---

function SceneControls({ settings }: { settings: SceneSettings }) {
	return (
		<div className='flex flex-col gap-4'>
			{/* Material chips */}
			<section>
				<span className='text-xs font-semibold opacity-50 uppercase tracking-wider'>Material</span>
				<div className='grid grid-cols-3 gap-1 mt-1.5'>
					{MATERIAL_PRESET_KEYS.map((key) => (
						<button
							key={key}
							type='button'
							className={`btn btn-xs justify-start ${settings.material === key ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => settings.setMaterial(key)}
						>
							{MATERIAL_PRESETS[key].label}
						</button>
					))}
				</div>
			</section>

			{/* Lighting */}
			<section>
				<span className='text-xs font-semibold opacity-50 uppercase tracking-wider'>Lighting</span>
				<div className='flex flex-col gap-2 mt-1.5'>
					<label className='flex flex-col gap-0.5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs opacity-70'>Direct</span>
							<span className='text-xs font-mono opacity-50'>{settings.lightIntensity.toFixed(1)}</span>
						</div>
						<input
							type='range'
							className='range range-xs'
							min={0}
							max={5}
							step={0.1}
							value={settings.lightIntensity}
							onChange={(e) => settings.setLightIntensity(parseFloat(e.target.value))}
						/>
					</label>
					<label className='flex flex-col gap-0.5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs opacity-70'>Ambient</span>
							<span className='text-xs font-mono opacity-50'>{settings.ambientIntensity.toFixed(1)}</span>
						</div>
						<input
							type='range'
							className='range range-xs'
							min={0}
							max={2}
							step={0.1}
							value={settings.ambientIntensity}
							onChange={(e) => settings.setAmbientIntensity(parseFloat(e.target.value))}
						/>
					</label>
				</div>
			</section>

			{/* Environment */}
			<section>
				<span className='text-xs font-semibold opacity-50 uppercase tracking-wider'>Environment</span>
				<div className='flex gap-1 mt-1.5'>
					{ENV_PRESETS.map((p) => (
						<button
							key={p}
							type='button'
							className={`btn btn-xs flex-1 ${settings.envPreset === p ? 'btn-primary' : 'btn-ghost'}`}
							onClick={() => settings.setEnvPreset(p)}
						>
							{p.charAt(0).toUpperCase() + p.slice(1)}
						</button>
					))}
				</div>
			</section>

			{/* Display toggles */}
			<section>
				<span className='text-xs font-semibold opacity-50 uppercase tracking-wider'>Display</span>
				<div className='flex flex-col gap-1.5 mt-1.5'>
					<SceneToggle label='Build plate' checked={settings.showBuildPlate} onChange={settings.setShowBuildPlate} />
					<SceneToggle label='Wireframe' checked={settings.wireframe} onChange={settings.setWireframe} />
					<SceneToggle label='Edges' checked={settings.showEdges} onChange={settings.setShowEdges} />
					<SceneToggle label='Auto-rotate' checked={settings.autoRotate} onChange={settings.setAutoRotate} />
				</div>
			</section>
		</div>
	)
}

function SceneToggle({
	label,
	checked,
	onChange,
}: {
	label: string
	checked: boolean
	onChange: (v: boolean) => void
}) {
	return (
		<label className='flex items-center gap-2 cursor-pointer'>
			<input
				type='checkbox'
				className='toggle toggle-xs'
				checked={checked}
				onChange={(e) => onChange(e.target.checked)}
			/>
			<span className='text-sm'>{label}</span>
		</label>
	)
}

// --- Parameter actions (export / import / reset) ---

function ParamActions({
	params,
	slug,
	hasOverrides,
}: {
	params: ParamState
	slug?: string
	hasOverrides: boolean | undefined
}) {
	const fileRef = useRef<HTMLInputElement>(null)

	const handleExport = () => {
		const values: Record<string, number | string | boolean> = {}
		for (const p of params.params) {
			values[p.name] = params.overrides[p.name] ?? p.value
		}
		const blob = new Blob([JSON.stringify(values, null, 2)], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `${slug ?? 'params'}-params.json`
		a.click()
		URL.revokeObjectURL(url)
	}

	const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		file.text().then((text) => {
			try {
				params.importOverrides(JSON.parse(text))
			} catch {
				// ignore malformed JSON
			}
		})
		e.target.value = ''
	}

	return (
		<div className='flex gap-1 mt-3'>
			<button type='button' className='btn btn-ghost btn-xs flex-1 gap-1' onClick={handleExport}>
				<LuDownload className='w-3 h-3' />
				Export
			</button>
			<button type='button' className='btn btn-ghost btn-xs flex-1 gap-1' onClick={() => fileRef.current?.click()}>
				<LuUpload className='w-3 h-3' />
				Import
			</button>
			<input ref={fileRef} type='file' accept='.json' className='hidden' onChange={handleImport} />
			{hasOverrides && (
				<button type='button' className='btn btn-ghost btn-xs flex-1 gap-1' onClick={params.resetOverrides}>
					<LuRotateCcw className='w-3 h-3' />
					Reset
				</button>
			)}
		</div>
	)
}

// --- Parameter controls ---

function ParamControls({ params }: { params: ParamState }) {
	const groups = new Map<string, Param[]>()
	for (const p of params.params) {
		const list = groups.get(p.group) || []
		list.push(p)
		groups.set(p.group, list)
	}

	return (
		<div className='flex flex-col gap-3'>
			{[...groups.entries()].map(([group, items]) => (
				<fieldset key={group}>
					<legend className='text-xs font-semibold opacity-50 uppercase tracking-wider mb-1'>{group}</legend>
					<div className='flex flex-col gap-2'>
						{items.map((p) => (
							<ParamControl
								key={p.name}
								param={p}
								value={params.overrides[p.name]}
								onChange={(v) => params.setOverride(p.name, v)}
							/>
						))}
					</div>
				</fieldset>
			))}
		</div>
	)
}

function ParamControl({
	param,
	value,
	onChange,
}: {
	param: Param
	value: number | string | boolean | undefined
	onChange: (v: number | string | boolean) => void
}) {
	if (param.type === 'boolean') {
		const checked = typeof value === 'boolean' ? value : param.value
		return (
			<label className='flex items-center gap-2 cursor-pointer'>
				<input
					type='checkbox'
					className='toggle toggle-xs'
					checked={checked}
					onChange={(e) => onChange(e.target.checked)}
				/>
				<span className='text-sm'>{param.name}</span>
			</label>
		)
	}

	if (param.type === 'number') {
		const current = typeof value === 'number' ? value : param.value
		return (
			<label className='flex flex-col gap-0.5'>
				<div className='flex items-center justify-between'>
					<span className='text-xs opacity-70'>{param.description || param.name}</span>
					<span className='text-xs font-mono opacity-50'>
						{current}
						{param.unit && <span className='ml-0.5'>{param.unit}</span>}
					</span>
				</div>
				<input
					type='number'
					className='input input-xs input-bordered w-full font-mono'
					value={current}
					step={guessStep(param.value)}
					onChange={(e) => {
						const v = parseFloat(e.target.value)
						if (!Number.isNaN(v)) onChange(v)
					}}
				/>
			</label>
		)
	}

	// String
	const current = typeof value === 'string' ? value : param.value
	return (
		<label className='flex flex-col gap-0.5'>
			<span className='text-xs opacity-70'>{param.description || param.name}</span>
			<input
				type='text'
				className='input input-xs input-bordered w-full'
				value={current}
				onChange={(e) => onChange(e.target.value)}
			/>
		</label>
	)
}

function guessStep(value: number): number {
	if (Number.isInteger(value)) return 1
	const decimals = value.toString().split('.')[1]?.length ?? 0
	return 10 ** -decimals
}
