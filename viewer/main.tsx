import './styles.css'

import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Gallery } from './gallery'
import { Viewer } from './viewer'

// Workaround: ensure Vite includes the WASM asset in the build
import 'replicad-opencascadejs/src/replicad_single.wasm?url'

type Route = { page: 'gallery' } | { page: 'viewer'; slug: string }

function parseHash(): Route {
	const hash = window.location.hash
	const match = hash.match(/^#\/project\/(.+)$/)
	if (match) return { page: 'viewer', slug: match[1] }
	return { page: 'gallery' }
}

function App() {
	const [route, setRoute] = useState<Route>(parseHash)

	useEffect(() => {
		const onHashChange = () => setRoute(parseHash())
		window.addEventListener('hashchange', onHashChange)
		return () => window.removeEventListener('hashchange', onHashChange)
	}, [])

	if (route.page === 'viewer') {
		return <Viewer slug={route.slug} />
	}
	return <Gallery />
}

createRoot(document.getElementById('root')!).render(<App />)
