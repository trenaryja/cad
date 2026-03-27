import { LuGalleryHorizontalEnd, LuPanelLeftClose, LuPanelLeftOpen, LuSettings } from 'react-icons/lu'

export function ParamRail({ children }: { children: React.ReactNode }) {
	return (
		<div className='rail h-full'>
			<input type='checkbox' className='rail-toggle' id='param-rail' />
			<aside className='flex flex-col bg-base-200 h-full border-r border-base-300 transition-all duration-300'>
				<nav className='flex flex-col gap-1 p-2'>
					<RailToggle />
					<RailLink href='#/' icon={LuGalleryHorizontalEnd} label='Gallery' />
					<RailNavItem icon={LuSettings} label='Parameters' />
				</nav>
				<div className='flex-1 overflow-y-auto p-2 is-rail-close:hidden'>
					<p className='text-xs opacity-50 px-2'>Parameter controls coming soon.</p>
				</div>
			</aside>
			<main className='flex-1 flex flex-col min-w-0'>{children}</main>
		</div>
	)
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
		<div className='btn btn-block btn-ghost transition-all justify-start is-rail-close:gap-0'>
			<Icon className='shrink-0' />
			<span className='overflow-hidden whitespace-nowrap transition-all is-rail-close:w-0 is-rail-close:opacity-0'>
				{label}
			</span>
		</div>
	)
}
