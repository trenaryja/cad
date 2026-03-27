import { useEffect, useState } from 'react'

/** CSS variable names to read from the DaisyUI theme */
const CSS_VARS = ['--color-base-100', '--color-base-200', '--color-base-300', '--color-base-content', '--color-primary'] as const

type ThemeColorKey = 'base100' | 'base200' | 'base300' | 'baseContent' | 'primary'

export type ThemeColors = Record<ThemeColorKey, string>

const VAR_TO_KEY: Record<(typeof CSS_VARS)[number], ThemeColorKey> = {
	'--color-base-100': 'base100',
	'--color-base-200': 'base200',
	'--color-base-300': 'base300',
	'--color-base-content': 'baseContent',
	'--color-primary': 'primary',
}

const DEFAULT_COLORS: ThemeColors = {
	base100: '#1a1a2e',
	base200: '#252540',
	base300: '#333355',
	baseContent: '#c0c0d0',
	primary: '#5a8296',
}

// Shared off-screen canvas for CSS color → hex conversion
let ctx: CanvasRenderingContext2D | null = null
function getCtx() {
	if (!ctx) {
		const canvas = document.createElement('canvas')
		canvas.width = 1
		canvas.height = 1
		ctx = canvas.getContext('2d')!
	}
	return ctx
}

/** Convert any CSS color (including oklch) to hex via Canvas 2D fillStyle */
function cssColorToHex(cssColor: string): string {
	const c = getCtx()
	c.clearRect(0, 0, 1, 1)
	c.fillStyle = cssColor
	c.fillRect(0, 0, 1, 1)
	const [r, g, b] = c.getImageData(0, 0, 1, 1).data
	return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

/** Read a CSS variable's resolved color as hex */
export function cssVarToHex(cssVar: string): string {
	const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
	if (!value) return '#888888'
	return cssColorToHex(value)
}

function readAllColors(): ThemeColors {
	const colors = { ...DEFAULT_COLORS }
	for (const cssVar of CSS_VARS) {
		colors[VAR_TO_KEY[cssVar]] = cssVarToHex(cssVar)
	}
	return colors
}

/**
 * Reads DaisyUI theme CSS variables and converts them to hex strings
 * for use in Three.js materials. Re-reads on theme change.
 */
export function useThemeColors(): ThemeColors {
	const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS)

	useEffect(() => {
		// Initial read
		setColors(readAllColors())

		// Watch for theme changes (data-theme attribute on <html>)
		const observer = new MutationObserver(() => {
			requestAnimationFrame(() => setColors(readAllColors()))
		})
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme', 'class', 'style'],
		})

		return () => observer.disconnect()
	}, [])

	return colors
}
