# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a collection of parametric OpenSCAD models for 3D printing. Each project follows a standard structure:

```
project-name/
├── dist/          # printable files (.3mf, .stl)
├── docs/          # markdown documentation
│   ├── {name}.readme.md
│   ├── {name}.instructions.md
│   └── {name}.changelog.md
├── pics/          # photos, renders, reference images
└── src/           # source files (.scad, imported .stl, etc)
```

## Working with OpenSCAD Files

### Preview and Render
```bash
# Preview in OpenSCAD GUI
openscad path/to/file.scad

# Render to STL from command line
openscad -o output.stl path/to/file.scad
```

### Design Patterns Used

**Side-Profile Extrusion**: Models are built as 2D profiles in the XY plane, then extruded with `linear_extrude()`. This approach optimizes for 3D printing on the side (avoiding overhangs).

**Dual-Fillet Offset Trick**: For smoothing both internal stress points and external corners:
```scad
offset(r=R) offset(r=-2*R) offset(r=R) { ... }
```

**Additive Construction**: Hooks and complex shapes are built by unioning primitives (basin + tip + scoop) rather than subtracting notches, which prevents geometry collapse during offset operations.

## Documentation Standards

All projects use semantic versioning with three documentation files:
- **{name}.readme.md**: User-facing description for MakerWorld/sharing (concise, no fluff)
- **{name}.instructions.md**: LLM-facing engineering guide (design philosophy, nomenclature, baseline code)
- **{name}.changelog.md**: Version history following SemVer conventions

## Project-Specific Notes

### door-hanger/
The most actively developed project. Key nomenclature:
- **tail**: Part touching back of door
- **spine**: Part touching front of door (carries hooks)
- **drop**: Distance from door top to first hook
- **basin**: Horizontal arm of hook
- **tip**: Vertical part of hook
- **scoop**: Internal fillet in hook notch
- **brace**: Support structure under hook

When modifying: clamp radius/depth variables with `min()`/`max()` to prevent self-intersection. Use `v_thick = basin_thickness / cos(hook_angle)` for tilted geometry calculations.

### arca-peg/
Arca Swiss dovetail plate + Multiboard peg adapter. Key nomenclature:
- **plate**: The Arca Swiss dovetail adapter portion
- **dovetail**: The angled portion (top 3mm, 38mm→32mm taper)
- **base**: The rectangular foundation beneath dovetail
- **peg**: Imported `25mm-push-fit-peg.stl` from Multiboard
- **functional_assembly**: Combined plate + peg in operational positions

Hybrid design combining parametric SCAD with imported STL. Print orientation pre-rotated for side printing.
