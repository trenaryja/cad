# Viewer Phase 6+: Build Plate, Theming, Parameters, Multi-Body, and Beyond

## Context

The web viewer works but feels generic — hardcoded colors, infinite grid, no parameter editing. The user wants it to feel more like BambuStudio: models on a realistic X1C build plate, theme-aware colors, collapsible parameter sidebar, multi-body support with per-body colors, and persistent settings. This plan captures everything from immediate builds to stretch goals.

## Tier 1: Core (build now)

### 1.1 Theme Integration

**Use existing `@trenaryja/ui` ThemeProvider + useTheme hook** — no custom theme system needed.

- Wrap app in `<ThemeProvider>` in `main.tsx`
- Create `useThemeColors()` hook that reads DaisyUI CSS vars via DOM probe (hidden div with applied CSS var → `getComputedStyle().color` → rgb → hex). MutationObserver on `<html>` for live theme switches.
- Apply to Three.js: canvas background → `--color-base-100`, model material → `--color-base-content`, edges → `--color-base-300`, grid/build plate → `--color-base-200`
- Add theme switcher to toolbar (or use existing `@trenaryja/ui` component)

**Files:** `viewer/main.tsx`, `viewer/three-scene.tsx` (new hook), `viewer/viewer.tsx` (toolbar)

### 1.2 Build Plate (X1C: 256×256×256mm)

- Replace infinite `<Grid>` with fixed 256×256mm grid at Z=0
- Add `<BuildPlate>` component: semi-transparent surface + border lines showing bed outline
- Grid cells: 10mm sections, 50mm major lines (matches slicer conventions)
- Toggle build plate on/off (existing grid toggle)
- Models auto-centered via `<Bounds>`

**Files:** `viewer/three-scene.tsx`

### 1.3 Parameter Rail (scaffold)

- Wrap viewer page in `@trenaryja/ui` `rail` layout
- Left sidebar with toggle button using `is-rail-open:`/`is-rail-close:` variants
- Scaffold: "Parameters" heading + placeholder content
- Canvas fills remaining space, resizes on rail toggle

**Files:** `viewer/viewer.tsx`, `viewer/param-rail.tsx` (new)

### 1.4 Settings Persistence

Install `nuqs` + `@mantine/hooks`.

**Pattern — `usePersistedState()`:** A generic hook that layers URL state (nuqs) over localStorage (@mantine/hooks useLocalStorage):

- localStorage = user defaults (persist across sessions)
- URL params = shareable overrides (bookmarkable views)
- URL params take precedence when present; changes write to both

**Apply to:** `showGrid`, `wireframe`, `showBuildPlate`, `theme`, rail open/closed state. Camera position is a stretch goal (URL-encode orbit angles).

**Files:** `viewer/hooks/use-persisted-state.ts` (new), install nuqs + @mantine/hooks

## Tier 2: Near-term

### 2.1 Live-Reload for .scad Files

Same camera-preserving live-reload experience as replicad .ts files, but for OpenSCAD.

**Pipeline:**

1. Extend `modelHmr` Vite plugin to detect `.scad` file changes (server-side)
2. Plugin spawns `openscad -o <tmp>.stl <file>.scad` in background (Vite server is Bun — can spawn processes)
3. When OpenSCAD finishes, serve the STL and send custom HMR event `scad-update` with project slug
4. Viewer fetches fresh STL via cache-busted URL, swaps BufferGeometry, camera stays mounted
5. Show subtle "rebuilding..." indicator while OpenSCAD runs (it takes 1-5s depending on complexity)

**Key insight:** The Vite dev server runs in Bun, so the HMR plugin can spawn CLI tools. No separate backend needed.

**Files:** `vite.config.ts` (extend modelHmr), `viewer/viewer.tsx` (listen for scad-update, re-fetch STL)

### 2.2 Parameter Parsing & Controls

Parse parameters from both `.ts` and `.scad` source files:

- **`.ts`**: Parse `const name = value // [unit] description` in `// --- Parameters ---` section
- **`.scad`**: Parse `param = value; // [unit] description` in `// --- Parameter Group ---` sections
- Extract: name, value, unit, description, type (number/boolean/string)

Render as sliders (numbers with ranges), inputs, toggles in the rail. Re-evaluate model on change:

- **Replicad**: Pass param overrides to worker → `mainFn(params)` (requires model convention change to accept params object)
- **OpenSCAD**: Re-render via CLI with `-D` flag overrides (requires backend/API — complex, defer)

**Files:** `viewer/param-parser.ts` (new), `viewer/param-rail.tsx`, `viewer/worker/replicad.worker.ts`

### 2.3 Multi-Body Models

Replicad supports multi-body via `Compound` / `makeCompound(shapeArray)`. The `mesh()` API returns `faceGroups` with per-face IDs that map to individual bodies.

**Changes:**

- Worker: detect compound shapes, return per-body mesh data with labels
- Scene: render each body as separate `<mesh>` with independent material
- Rail: per-body visibility toggles (show/hide individual bodies)
- Rail: per-body color pickers — DaisyUI semantic color swatches + custom color picker

**Model convention for named bodies:**

```typescript
export default function main() {
	return [
		{ name: 'housing', shape: housing },
		{ name: 'lid', shape: lid },
	]
}
```

**Export considerations:** STL export per-body (separate files) or combined. STEP handles assemblies natively.

**Files:** `viewer/worker/replicad.worker.ts`, `viewer/three-scene.tsx`, `viewer/param-rail.tsx`

### 2.4 3MF Export

Replicad does NOT support 3MF natively (only STL + STEP). Options:

1. **Build 3MF in the worker** — 3MF is a ZIP of XML files. We can construct it manually from mesh data. Libraries like `3mf-js` exist but are minimal.
2. **Use STEP as the multi-body format** — STEP already preserves assembly structure and is well-supported by slicers.

**Recommendation:** Start with per-body STL export + combined STEP. Add 3MF later if needed (it's essentially a ZIP with XML manifests + binary mesh data — doable but not trivial).

## Tier 3: Stretch Goals

### 3.1 Materials & Textures in Three.js

Three.js has rich material capabilities relevant to CAD visualization:

- **`MeshPhysicalMaterial`**: PBR material with roughness, metalness, clearcoat, sheen, iridescence, transmission (glass)
- **Presets**: Could offer "PLA matte", "PETG glossy", "metal", "resin" material presets
- **Environment maps**: Already using `<Environment preset='studio'>` — can swap presets for different lighting feels
- Per-body material assignment ties into multi-body color system

### 3.2 Lighting Controls

- Expose environment preset selector (studio, city, sunset, warehouse, etc.)
- Adjustable directional light intensity/position
- Toggle ambient occlusion (drei `<ContactShadows>`)
- All settings persisted via `usePersistedState`

### 3.3 .scad ↔ Replicad Translation (Ollama)

Run a local Ollama instance for code translation:

- CLI command: `./cad.ts translate <project>` — sends .scad source to local LLM, outputs model.ts
- Viewer button: "Convert to TypeScript" in toolbar for .scad projects
- Model: **Qwen 3.5 or Kimi** (whichever runs best on M4 Apple Silicon via Ollama)
- Prompt template with replicad API reference + conventions from CLAUDE.md
- Output validation: try to evaluate the generated model.ts, show errors if it fails

## Tier 4: Inspection Tools

### 4.1 Cross-Section / Clipping Plane Tool

Interactive clipping plane for inspecting model internals — like a planar bisect tool.

**Core mechanic:** Three.js global `clippingPlanes` on the WebGL renderer. A single `THREE.Plane` positioned via slider controls. Material `clipShadows` for clean cut faces.

**Interaction:**

- **Toggle on/off**: Toolbar button (scissor/plane icon) or `C` key
- **Default axis**: Z — slider in toolbar controls the Z height of the cut plane
- **Hold X key**: Temporarily switches to X-axis clipping (slider maps to X position)
- **Hold Y key**: Temporarily switches to Y-axis clipping (slider maps to Y position)
- **Option/Alt key**: Flips which side of the plane is hidden (inverts plane normal)
- **Release modifier**: Returns to Z axis

**Visual feedback:**

- Semi-transparent plane or hatched outline at the cut location
- Optional: cross-section fill (cap the cut face with a flat color) — drei `<Edges>` or custom shader

**Implementation notes:**

- `renderer.localClippingEnabled = true` in Canvas `gl` prop
- All mesh materials get `material.clippingPlanes = [plane]`
- Plane position derived from slider value mapped to model bounding box range
- Keyboard state tracked via `useEffect` with `keydown`/`keyup` listeners
- Persisted via `usePersistedState`: active state, axis, position

**Files:** `viewer/three-scene.tsx` (clipping plane), `viewer/viewer.tsx` (toolbar toggle + slider), `viewer/hooks/use-clipping.ts` (new)

## Implementation Order

```
1.1 Theme hook + ThemeProvider          ✅ done
1.2 Build plate component               ✅ done
1.3 Rail scaffold                        ✅ done
1.4 Settings persistence                 ✅ done
---
2.1 .scad live-reload via Vite HMR      ✅ done
2.2 Parameter parsing + controls         ✅ done
2.3 Multi-body rendering + per-body      ✅ done
2.4 3MF export (if needed beyond STEP)
---
3.1 Materials & textures (PBR presets)     ✅ done
3.2 Lighting controls (env presets, adjustable lights) ✅ done
3.3 Richer body color picker (DaisyUI semantic swatches + custom) ✅ done
3.4 .scad ↔ Replicad translation (Ollama)
---
4.1 Cross-section clipping plane tool
```

## Key Files

| File                                  | Change                                                       |
| ------------------------------------- | ------------------------------------------------------------ |
| `viewer/main.tsx`                     | Wrap in ThemeProvider                                        |
| `viewer/three-scene.tsx`              | Theme hook, build plate, themed materials, multi-body meshes |
| `viewer/viewer.tsx`                   | Rail layout, theme switcher, build plate toggle              |
| `viewer/param-rail.tsx`               | **New** — parameter sidebar with rail component              |
| `viewer/param-parser.ts`              | **New** — parse params from .ts/.scad                        |
| `viewer/hooks/use-persisted-state.ts` | **New** — nuqs + localStorage layered persistence            |
| `viewer/hooks/use-theme-colors.ts`    | **New** — CSS var → Three.js color bridge                    |

## New Dependencies

```
nuqs                  # URL query state
@mantine/hooks        # useLocalStorage
```

## Verification

- `bun dev` → viewer loads with DaisyUI theme colors
- Switch theme → scene colors update live
- Build plate shows 256×256mm at Z=0 with grid
- Toggle build plate on/off
- Rail opens/closes, canvas resizes
- Refresh page → settings persist (grid, wireframe, theme)
- Share URL with settings → recipient sees same view
