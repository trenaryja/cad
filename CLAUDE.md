# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a collection of parametric OpenSCAD models for 3D printing — primarily functional parts (hooks, clips, dowels, brackets, adapters). Prioritize structural strength, print reliability, and mechanical fit over aesthetics. All projects live under `src/`, each following a standard structure:

```
src/
└── project-name/
    ├── src/           # source files (.scad, imported .stl, etc)
    ├── pics/          # photos, reference images (optional)
    ├── {name}.stl     # printable STL (built from default .scad values)
    ├── render.png     # 3x3 composite of 9 views (3 isometric + 6 orthographic)
    ├── CHANGELOG.md
    └── README.md
```

### .scad File Structure

```scad
/** Header — 1-3 line description */

// --- Parameter Group ---
param = value; // [mm] Inline description

// --- Computed ---
derived = expression;

module helper() { ... }

module assembly() { ... }

assembly();
```

- `// --- Group ---` sub-headers separate parameter groups and computed values
- No section banners, no docstrings on modules — names are the documentation
- Inline `// [mm]` or `// [deg]` unit annotations on parameters
- File ends with the top-level assembly call, no heading

### Design Patterns

**Side-Profile Extrusion**: Build as 2D profiles (XY plane), then `linear_extrude()`. Optimizes for side printing without overhangs.

**Dual-Fillet Offset Trick**: Smooths both internal and external corners:
```scad
offset(r=R) offset(r=-2*R) offset(r=R) { ... }
```

**Single-Direction Fillet**: `offset(r=R) offset(r=-R)` rounds only external corners.

**Additive Construction**: Union primitives rather than subtracting notches — prevents geometry collapse during offset operations.

**Geometric Safeguards**: Clamp radius/depth variables with `min()`/`max()` to prevent self-intersection. Apply tolerance once to an effective dimension (e.g., `effective_radius = radius - tolerance`).

**SVG Import Pattern**: `import() → scale() → linear_extrude()` with `scale_factor = target_size / original_svg_size`.

## Scripts

**`./cad.ts`** — unified build & render CLI (requires `bun`). Progressive TUI: flags for non-interactive use, interactive prompts when flags are omitted.

```bash
./cad.ts --render --build usb-keychain   # render + build one project
./cad.ts -r -b --all                     # render + build everything
./cad.ts --build dowel c-clip            # build STLs for two projects
./cad.ts                                 # interactive: prompts for action + projects
```

Flags: `--render`/`-r`, `--build`/`-b`, `--all`/`-a`. Runs up to 3 tasks in parallel with progress bars.

## Render Layout

```
iso-A (54.74,0,315) | front  (90,0,0)   | iso-B (54.74,0,135)
left  (90,0,270)    | top    (0,0,0)     | right (90,0,90)
iso-C (125.26,0,45) | bottom (180,0,0)   | back  (90,0,180)
```

Isometric angles use tetrahedral vertices (109.47° apart) for maximum angular spread.

## OpenSCAD CLI

```bash
openscad path/to/file.scad                          # open in GUI
openscad -o out.stl file.scad                        # render STL
openscad -D 'height=50' -D 'width=30' -o out.stl f.scad  # override variables
```
