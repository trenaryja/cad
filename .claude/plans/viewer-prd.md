# PRD: Web-Based 3D Model Viewer & Gallery

## Context

This CAD repo currently has a headless CLI workflow: edit `.scad` in VS Code, render with OpenSCAD CLI, build STLs. There's no way to interactively view models in a browser. Adding **replicad** (BREP/TypeScript) as a second modeling engine requires a web-based viewer since replicad has no standalone GUI like OpenSCAD does.

The goal is a local Vite dev server with a gallery of all projects (both OpenSCAD and replicad) and full-screen interactive 3D viewing — enabling the same "code left, preview right" workflow with Claude Code assistance.

## Architecture

```
cad.ts                      # existing CLI + `dev` subcommand
package.json                # single package.json: CLI + web deps
biome.jsonc                 # Biome formatter/linter config
vite.config.ts              # Vite config at root
index.html                  # web entry point at root
tsconfig.json               # TypeScript config
viewer/                     # web app source
  ├── main.tsx              # app shell: hash router
  ├── styles.css            # Tailwind + daisyUI + @trenaryja/ui/css
  ├── env.d.ts              # type declarations (R3F JSX, replicad-threejs-helper, WASM)
  ├── gallery.tsx           # searchable grid of project cards w/ render.png thumbs
  ├── viewer.tsx            # full-screen Three.js viewer page + STL/STEP export
  ├── three-scene.tsx       # Three.js canvas: scene, camera, lights, OrbitControls
  ├── discovery.ts          # auto-discover projects via import.meta.glob
  └── worker/
      └── replicad.worker.ts  # WASM init + model eval + export in web worker
src/
  ├── dowel/                # existing OpenSCAD project
  │   ├── src/dowel.scad
  │   ├── render.png
  │   └── README.md
  └── test-cube/            # new replicad project
      ├── src/model.ts      # ← Claude edits this
      └── README.md
```

All deps live in the root `package.json`. `bun dev` or `./cad.ts dev` from repo root starts the viewer. `./cad.ts` continues to work as before for CLI rendering/building.

**Replicad model file convention** (mirrors `.scad` conventions from CLAUDE.md):
```typescript
// src/{name}/src/model.ts
/** Brief description of the model */

import { drawRoundedRectangle } from 'replicad'

// --- Parameters ---
const height = 50 // [mm]
const width = 30  // [mm]

// --- Computed ---
const halfWidth = width / 2

// --- Model ---
export default function main() {
  return drawRoundedRectangle(width, height)
    .sketchOnPlane()
    .extrude(10)
}
```

**Project discovery**: `import.meta.glob("../src/*/src/model.ts")` finds replicad projects. Existing `.stl` files in `src/{name}/{name}.stl` are used for OpenSCAD project 3D viewing (no WASM needed). `render.png` used for gallery thumbnails for all project types.

**Routing**: Hash-based (`#/` = gallery, `#/project/{slug}` = viewer). No react-router needed.

**Rendering pipeline**:
- Replicad: worker loads WASM → evaluates model.ts → calls `.mesh()` / `.meshEdges()` → transfers BufferGeometry data to main thread → `replicad-threejs-helper` syncs to Three.js
- OpenSCAD: loads pre-built `{name}.stl` via Three.js `STLLoader`

## Dependencies (root package.json)

```
# existing (CLI)
  @clack/prompts, chalk, cli-progress

# new (web viewer)
dependencies:
  react, react-dom          # UI framework
  three                     # 3D rendering
  @react-three/fiber        # React Three.js bindings
  @react-three/drei         # OrbitControls, Grid, helpers
  replicad                  # BREP modeling core
  replicad-threejs-helper   # geometry sync
  replicad-opencascadejs    # OpenCascade WASM build
  comlink                   # web worker RPC
  @trenaryja/ui             # user's component library

devDependencies:
  vite                      # build tool
  @vitejs/plugin-react      # React fast refresh
  @tailwindcss/vite         # Tailwind integration
  tailwindcss               # Tailwind CSS v4
  daisyui                   # UI component library
  @biomejs/biome            # formatter + linter
  typescript
  @types/three, @types/react, @types/react-dom
```

Note: `vite-plugin-wasm` and `vite-plugin-top-level-await` are NOT needed — Vite natively handles `.wasm?url` imports and `?worker` imports.

## Phases

### Phase 1: Core Viewer — Render a single replicad model in Three.js

- [x] Add web deps to root `package.json`
- [x] `vite.config.ts` — Vite config with React, Tailwind, replicad-opencascadejs excluded from optimizeDeps
- [x] `tsconfig.json` — TypeScript config for the project
- [x] `index.html` — minimal HTML shell with `<div id="root">`
- [x] `viewer/main.tsx` — React root with hash router
- [x] `viewer/styles.css` — Tailwind + `@import '@trenaryja/ui/css'` + daisyUI plugin + `@source` directive
- [x] `viewer/env.d.ts` — type declarations for R3F JSX elements, replicad-threejs-helper, WASM URLs
- [x] `viewer/viewer.tsx` — loads model by slug, renders in Three.js
- [x] `viewer/three-scene.tsx` — React Three Fiber canvas with OrbitControls, lighting, grid, Bounds auto-fit
- [x] `viewer/worker/replicad.worker.ts` — Web Worker: init OpenCascade WASM via comlink, evaluate model, return mesh data
- [x] `src/test-cube/src/model.ts` — first replicad model (parametric cube with fillets)
- [x] `src/test-cube/README.md` — minimal readme

**Verification:** ✅
- `bun install && bun dev` starts Vite dev server from repo root
- Browser shows a 3D cube with smooth BREP fillets
- OrbitControls work (rotate, pan, zoom)
- Edit `src/test-cube/src/model.ts` parameters → save → model updates in browser

### Phase 2: Gallery + Project Discovery

- [x] `viewer/discovery.ts` — `import.meta.glob` with `?url` query for models, thumbnails, STLs, and .scad files
- [x] `viewer/gallery.tsx` — responsive grid of project cards with render.png thumbnails, search filter, project type badge (.scad / .ts)
- [x] `viewer/main.tsx` — hash router: `#/` → gallery, `#/project/{slug}` → viewer

**Verification:** ✅
- Gallery shows all 8 projects (7 OpenSCAD + 1 replicad) with thumbnails
- Search filters by project name
- Clicking a replicad project opens interactive 3D viewer
- Clicking an OpenSCAD project opens STL viewer
- Browser back/forward navigation works

### Phase 3: OpenSCAD STL Viewing + Polish

- [x] `viewer/viewer.tsx` — STL loading path: detect project type, load `{name}.stl` via Three.js STLLoader for .scad projects
- [x] `viewer/three-scene.tsx` — viewer controls: toggle wireframe, toggle grid, auto-fit to model bounds (via drei `<Bounds>`)
- [ ] Consider: render.png generation for replicad projects (headless Three.js screenshot or export from viewer)

**Verification:** ✅
- OpenSCAD projects render their pre-built STL in 3D viewer
- All projects are interactively viewable
- Wireframe and grid toggles work

### Phase 4: Stretch Goals

- [ ] **OpenSCAD WASM**: Live `.scad` editing → WASM compilation → STL → Three.js (no dependency on pre-built STL) — *deferred: requires heavyweight separate WASM build*
- [x] **CLI integration**: `./cad.ts dev` starts the Vite server
- [x] **Replicad scaffold skill**: extended `/new-model` skill to scaffold replicad projects with `model.ts` convention
- [x] **Export**: STL/STEP export buttons in viewer toolbar for replicad models (via worker `blobSTL()`/`blobSTEP()`)
- [ ] **Parameter UI**: auto-generate sliders from model parameters (parse `// [mm]` annotations) — *deferred: requires model source parsing*

### Tooling (added during implementation)

- [x] `biome.jsonc` — Biome config matching codepen repo (line width 120, single quotes, no semicolons, tailwindDirectives)
- [x] Convenience scripts: `lint`, `check`, `get-latest`, `reinstall`

## Branch Strategy

Work on `feature/viewer` branch. Main branch remains unblocked for OpenSCAD work.

## Key Patterns for LLM Agents

- **Model files are pure functions**: `export default function main()` returns geometry. No side effects, no imports from viewer code.
- **One model.ts per project**: always at `src/{name}/src/model.ts`
- **Parameters at top**: same `// --- Parameters ---` / `// [mm]` convention as .scad files
- **Discovery is automatic**: add `src/{name}/src/model.ts` and the gallery picks it up
- **Viewer source lives in `viewer/`**: web app code, separate from model projects but same package.json
- **CSS setup**: `viewer/styles.css` must `@import '@trenaryja/ui/css'` and `@source '../node_modules/@trenaryja/ui'` for Tailwind to scan the UI library
- **WASM pattern**: use `?url` suffix for `.wasm` imports, `comlink` for worker RPC — no WASM plugins needed
