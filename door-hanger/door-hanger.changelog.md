# Changelog

## [2.2.0] - 2026-01-03

### Added

- `hook_tip_thickness`: Independent variable to control vertical tip width.
- `hook_basin_thickness`: Dedicated variable for the primary horizontal arm of the hook.
- `hook_scoop_radius`: Variable to create a smooth internal curve (material addition) in the hook notch.
- `hook_brace_depth`: Explicit control over horizontal support reach.
- Trig-based support placement: Braces now follow `hook_angle` while staying flush against the spine.

### Changed

- **REFACTOR**: Simplified `hook_unit` by removing redundant "notch subtraction" in favor of solid geometry construction.
- **REFACTOR**: Decoupled `hook_brace_thickness` (the hollow wall) from the basin thickness.
- **FIX**: `spine_length` now correctly calculates total height based on `v_thick` (tilted basin height) and `hook_brace_height`.
- **FIX**: Implemented geometry safeguards for the scoop to prevent spikes and floating artifacts.

## [2.1.2] - 2026-01-03

### Added

- `hook_brace_depth` parameter to explicitly control the horizontal reach of the support.
- Trig-based point calculation for braces: Supports now follow the `hook_angle` while maintaining a vertical flush-fit against the spine.
- `hook_scoop_radius` variable to add a large, smooth fillet (extra material) between the basin and the tip.
- `hook_notch_radius` for independent control of the spine-side corner transition.

### Changed

- Simplified `hanger_bracket_profile` math: `door_gap` now defines the bridge thickness.
- Refactored `triangular_brace` into `brace_geometry` to support non-right-triangle polygons.
- Updated `spine_length` and hook positioning math to account for tilted thickness (`v_thick`).
- Renamed `hook_inner_radius` to `hook_notch_radius`.
- Refactored `hook_unit` Boolean logic: The scoop is now unioned **after** the notch subtraction to ensure it renders correctly regardless of notch size.

### Fixed

- **Geometry Guard**: Implemented clamping on `hook_scoop_radius` to prevent it from exceeding hook dimensions, which previously caused "spiking" and floating geometry artifacts.

## [2.1.1] - 2026-01-03

### Fixed

- **Critical**: Replaced manual trigonometry in `triangular_brace` with `offset(delta = -wall)`. This resolves the rendering error where braces appeared solid or distorted.

## [2.1.0] - 2026-01-03

### Added

- `hook_brace_height` parameter to control support length.
- `hook_brace_hollow` boolean for aesthetic/material saving.
- `hook_brace_wall` to define thickness of hollow support structures.
- `hook_angle` to allow upward-tilting hook basins.
- Nested Offset "Dual-Fillet" logic for 3D print toolpath optimization.

### Changed

- Refactored `hook_unit` into a difference-based manifold to prevent geometric "collapse" during offsets.
- Updated `spine_length` calculation to dynamically encompass the full height of the lowest hook's brace.

## [2.0.0] - 2026-01-03

### Added

- `drop` variable for precise placement of the first hook from the door top.
- `spine_thickness` to allow front/back wall independence.

### Changed

- **BREAKING**: Renamed `hanger_tail_thickness` to `tail_thickness`.
- **BREAKING**: Renamed `hanger_tail_length` to `tail_length`.
- **BREAKING**: Renamed `hook_thickness` to `hook_brace_thickness`.
- **BREAKING**: Renamed `hook_up_height` to `hook_tip_height`.
- **REFACTOR**: Standardized coordinate system (Y=0 at top-of-door, negative Y is "down").

### Fixed

- Spine length now terminates exactly at the bottom of the last hook.
