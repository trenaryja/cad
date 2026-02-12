# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a collection of parametric OpenSCAD models for 3D printing — primarily functional parts (hooks, clips, dowels, brackets, adapters). Prioritize structural strength, print reliability, and mechanical fit over aesthetics. Each project follows a standard structure:

```
project-name/
├── src/           # source files (.scad, imported .stl, etc)
├── pics/          # photos, reference images (optional)
├── {name}.stl     # printable STL (built from default .scad values)
├── render.png     # 2x2 composite of 4 orthographic views
├── CHANGELOG.md
└── README.md
```

### Design Patterns Used

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

- **`./render.sh [project...]`** — generates `render.png` (2x2 composite: isometric, front, top, right)
- **`./build.sh [project...]`** — generates `{name}.stl` from default .scad variables

No args = all projects.

## Render Layout

```
isometric (35.26,0,45) | front (90,0,0)
top       (0,0,0)      | right (90,0,90)
```

## OpenSCAD CLI

```bash
openscad path/to/file.scad                          # open in GUI
openscad -o out.stl file.scad                        # render STL
openscad -D 'height=50' -D 'width=30' -o out.stl f.scad  # override variables
```
