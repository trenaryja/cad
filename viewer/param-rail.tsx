import { LuBox, LuGalleryHorizontalEnd, LuPanelLeftClose, LuPanelLeftOpen, LuRotateCcw, LuSettings, LuSun } from 'react-icons/lu'
import type { SceneSettings } from './hooks/use-scene-settings'
import { ENV_PRESETS, MATERIAL_PRESETS, type MaterialPreset } from './hooks/use-scene-settings'
import type { ParamState } from './hooks/use-params'
import type { Param } from './param-parser'
import type { BodyState } from './viewer'

export function ParamRail({ params, bodyState, sceneSettings, children }: { params?: ParamState; bodyState?: BodyState; sceneSettings?: SceneSettings; children: React.ReactNode }) {
	const hasParams = params && params.params.length > 0
	const hasOverrides = params && Object.keys(params.overrides).length > 0
	const hasBodies = bodyState && bodyState.bodyNames.length > 0

	return (
		<div className='rail h-full'>
			<input type='checkbox' className='rail-toggle' id='param-rail' />
			<aside className='flex flex-col bg-base-200 h-full border-r border-base-300 transition-all duration-300'>
				<nav className='flex flex-col gap-1 p-2'>
					<RailToggle />
					<RailLink href='#/' icon={LuGalleryHorizontalEnd} label='Gallery' />
					{hasBodies && <RailNavItem icon={LuBox} label='Bodies' />}
					<RailNavItem icon={LuSettings} label='Parameters' />
					<RailNavItem icon={LuSun} label='Scene' />
				</nav>
				<div className='flex-1 overflow-y-auto p-2 is-rail-close:hidden'>
					{hasBodies && <BodyControls bodyState={bodyState} />}
					{hasBodies && hasParams && <div className='divider my-1' />}
					{hasParams ? (
						<ParamControls params={params} />
					) : (
						!hasBodies && <p className='text-xs opacity-50 px-2'>No parameters found.</p>
					)}
					{hasOverrides && (
						<button type='button' className='btn btn-ghost btn-xs btn-block mt-3 gap-1' onClick={params.resetOverrides}>
							<LuRotateCcw className='w-3 h-3' />
							Reset to defaults
						</button>
					)}
					{(hasParams || hasBodies) && <div className='divider my-1' />}
					{sceneSettings && <SceneControls settings={sceneSettings} />}
				</div>
			</aside>
			<main className='flex-1 flex flex-col min-w-0'>{children}</main>
		</div>
	)
}

// --- Color swatches for multi-body ---

/** DaisyUI-inspired swatch palette + neutral tones */
const COLOR_SWATCHES = [
	'#5a8296', '#96785a', '#7a5a96', '#5a9672', '#96605a', '#5a7896', '#8a965a', '#965a8a',
	'#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c', '#3498db', '#9b59b6', '#34495e',
	'#ecf0f1', '#bdc3c7', '#95a5a6', '#7f8c8d', '#2c3e50', '#1a1a2e', '#ffffff', '#000000',
]

// Palette for multi-body — matches BODY_COLORS in viewer.tsx
const BODY_COLORS = ['#5a8296', '#96785a', '#7a5a96', '#5a9672', '#96605a', '#5a7896', '#8a965a', '#965a8a']

function BodyControls({ bodyState }: { bodyState: BodyState }) {
	return (
		<div className='flex flex-col gap-1'>
			<span className='text-xs font-semibold opacity-60 uppercase tracking-wide px-2 mb-1'>Bodies</span>
			{bodyState.bodyNames.map((name, i) => {
				const visible = bodyState.visible[name] !== false
				const color = bodyState.colors[name] || BODY_COLORS[i % BODY_COLORS.length]
				return (
					<div key={name} className='flex flex-col gap-1 px-2'>
						<div className='flex items-center gap-2'>
							<input
								type='checkbox'
								className='toggle toggle-xs'
								checked={visible}
								onChange={() => bodyState.setVisible(name, !visible)}
							/>
							<span className='text-sm truncate flex-1'>{name}</span>
							<input
								type='color'
								className='w-5 h-5 cursor-pointer rounded border-0 p-0'
								value={color}
								onChange={(e) => bodyState.setColor(name, e.target.value)}
							/>
						</div>
						<div className='flex flex-wrap gap-0.5 ml-7'>
							{COLOR_SWATCHES.slice(0, 16).map((swatch) => (
								<button
									key={swatch}
									type='button'
									className='w-4 h-4 rounded-sm border border-base-300 cursor-pointer hover:scale-125 transition-transform'
									style={{ backgroundColor: swatch, outline: swatch === color ? '2px solid var(--color-primary)' : undefined, outlineOffset: '1px' }}
									onClick={() => bodyState.setColor(name, swatch)}
								/>
							))}
						</div>
					</div>
				)
			})}
		</div>
	)
}

// --- Scene controls ---

function SceneControls({ settings }: { settings: SceneSettings }) {
	return (
		<div className='flex flex-col gap-3'>
			<span className='text-xs font-semibold opacity-60 uppercase tracking-wide px-2'>Scene</span>

			{/* Material preset */}
			<label className='flex flex-col gap-0.5 px-2'>
				<span className='text-xs opacity-70'>Material</span>
				<select
					className='select select-xs select-bordered w-full'
					value={settings.material}
					onChange={(e) => settings.setMaterial(e.target.value as MaterialPreset)}
				>
					{(Object.keys(MATERIAL_PRESETS) as MaterialPreset[]).map((key) => (
						<option key={key} value={key}>{MATERIAL_PRESETS[key].label}</option>
					))}
				</select>
			</label>

			{/* Environment preset */}
			<label className='flex flex-col gap-0.5 px-2'>
				<span className='text-xs opacity-70'>Environment</span>
				<select
					className='select select-xs select-bordered w-full'
					value={settings.envPreset}
					onChange={(e) => settings.setEnvPreset(e.target.value as typeof settings.envPreset)}
				>
					{ENV_PRESETS.map((p) => (
						<option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
					))}
				</select>
			</label>

			{/* Light intensity */}
			<label className='flex flex-col gap-0.5 px-2'>
				<div className='flex items-center justify-between'>
					<span className='text-xs opacity-70'>Light intensity</span>
					<span className='text-xs font-mono opacity-50'>{settings.lightIntensity.toFixed(1)}</span>
				</div>
				<input
					type='range'
					className='range range-xs'
					min={0}
					max={3}
					step={0.1}
					value={settings.lightIntensity}
					onChange={(e) => settings.setLightIntensity(parseFloat(e.target.value))}
				/>
			</label>
		</div>
	)
}

// --- Parameter controls ---

function ParamControls({ params }: { params: ParamState }) {
	// Group params by their group name
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
					<legend className='text-xs font-semibold opacity-60 uppercase tracking-wide px-2 mb-1'>{group}</legend>
					<div className='flex flex-col gap-2'>
						{items.map((p) => (
							<ParamControl key={p.name} param={p} value={params.overrides[p.name]} onChange={(v) => params.setOverride(p.name, v)} />
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
	const currentValue = value ?? param.value

	if (param.type === 'boolean') {
		return (
			<label className='flex items-center gap-2 px-2 cursor-pointer'>
				<input type='checkbox' className='toggle toggle-xs' checked={currentValue as boolean} onChange={(e) => onChange(e.target.checked)} />
				<span className='text-sm'>{param.name}</span>
			</label>
		)
	}

	if (param.type === 'number') {
		return (
			<label className='flex flex-col gap-0.5 px-2'>
				<div className='flex items-center justify-between'>
					<span className='text-xs opacity-70'>{param.description || param.name}</span>
					<span className='text-xs font-mono opacity-50'>
						{currentValue}
						{param.unit && <span className='ml-0.5'>{param.unit}</span>}
					</span>
				</div>
				<input
					type='number'
					className='input input-xs input-bordered w-full font-mono'
					value={currentValue as number}
					step={guessStep(param.value as number)}
					onChange={(e) => {
						const v = parseFloat(e.target.value)
						if (!isNaN(v)) onChange(v)
					}}
				/>
			</label>
		)
	}

	// String
	return (
		<label className='flex flex-col gap-0.5 px-2'>
			<span className='text-xs opacity-70'>{param.description || param.name}</span>
			<input
				type='text'
				className='input input-xs input-bordered w-full'
				value={currentValue as string}
				onChange={(e) => onChange(e.target.value)}
			/>
		</label>
	)
}

/** Guess a reasonable step size for number inputs based on the default value */
function guessStep(value: number): number {
	if (Number.isInteger(value)) return 1
	const decimals = value.toString().split('.')[1]?.length ?? 0
	return Math.pow(10, -decimals)
}

// --- Rail navigation ---

function RailToggle() {
	return (
		<label
			htmlFor='param-rail'
			className='btn btn-block btn-ghost transition-all justify-start is-rail-close:gap-0'
			tabIndex={0}
		>
			<span className='transition-all is-rail-open:grow' />
			<div className='swap is-rail-open:swap-active'>
				<LuPanelLeftClose className='swap-on shrink-0' />
				<LuPanelLeftOpen className='swap-off shrink-0' />
			</div>
		</label>
	)
}

function RailLink({
	href,
	icon: Icon,
	label,
}: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
	return (
		<a href={href} className='btn btn-block btn-ghost transition-all justify-start is-rail-close:gap-0'>
			<Icon className='shrink-0' />
			<span className='overflow-hidden whitespace-nowrap transition-all is-rail-close:w-0 is-rail-close:opacity-0'>
				{label}
			</span>
		</a>
	)
}

function RailNavItem({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
	return (
		<label htmlFor='param-rail' className='btn btn-block btn-ghost transition-all justify-start is-rail-close:gap-0 is-rail-open:pointer-events-none is-rail-open:opacity-60' tabIndex={0}>
			<Icon className='shrink-0' />
			<span className='overflow-hidden whitespace-nowrap transition-all is-rail-close:w-0 is-rail-close:opacity-0'>
				{label}
			</span>
		</label>
	)
}
