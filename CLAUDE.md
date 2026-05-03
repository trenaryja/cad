# cad

Parametric OpenSCAD models for 3D printing — functional parts (hooks, clips, dowels, brackets, adapters). Prioritize structural strength, print reliability, and mechanical fit over aesthetics.

### .scad Conventions

- `// --- Group ---` sub-headers separate parameter groups and computed values
- No docstrings on modules — names are the documentation
- Inline `// [mm]` or `// [deg]` unit annotations on parameters
- File ends with the top-level assembly call

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

### Viewer Parameter Requirements

Every user-tunable parameter in a `.scad` file **must appear in the viewer's Parameters panel**. This is a hard requirement.

Rules:
- Parameters must be declared before the `// --- Computed ---` section
- Each parameter needs the standard format: `name = value; // [unit] description`
- Parameters with `-1` sentinel defaults are fine — they parse as numbers and show in the UI
- After adding or modifying parameters, verify they appear in the viewer (the parser runs on mount and on HMR `scad-update` events — a file save during dev should refresh the panel automatically; if not, do a full browser reload and confirm)

## Scripts

`./cad.ts` — build & render CLI. Flags: `--render`/`-r`, `--build`/`-b`, `--all`/`-a`. Interactive when flags omitted.

## Render Layout

```
iso-A (54.74,0,315) | front  (90,0,0)   | iso-B (54.74,0,135)
left  (90,0,270)    | top    (0,0,0)     | right (90,0,90)
iso-C (125.26,0,45) | bottom (180,0,0)   | back  (90,0,180)
```

Isometric angles use tetrahedral vertices (109.47° apart) for maximum angular spread.
