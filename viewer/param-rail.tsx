import { LuBox, LuGalleryHorizontalEnd, LuPanelLeftClose, LuPanelLeftOpen, LuRotateCcw, LuSettings } from 'react-icons/lu'
import type { ParamState } from './hooks/use-params'
import type { Param } from './param-parser'
import type { BodyState } from './viewer'

export function ParamRail({ params, bodyState, children }: { params?: ParamState; bodyState?: BodyState; children: React.ReactNode }) {
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
				</div>
			</aside>
			<main className='flex-1 flex flex-col min-w-0'>{children}</main>
		</div>
	)
}

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
					<div key={name} className='flex items-center gap-2 px-2'>
						<input
							type='checkbox'
							className='toggle toggle-xs'
							checked={visible}
							onChange={() => bodyState.setVisible(name, !visible)}
						/>
						<input
							type='color'
							className='w-5 h-5 cursor-pointer rounded border-0 p-0'
							value={color}
							onChange={(e) => bodyState.setColor(name, e.target.value)}
						/>
						<span className='text-sm truncate'>{name}</span>
					</div>
				)
			})}
		</div>
	)
}

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
