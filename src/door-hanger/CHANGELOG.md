# Changelog

## [3.1.0] - 2026-04-26

### Added

- `front_length`: minimum front spine length, mirroring `back_length`. Enables hook-free front spine (e.g. pure C-clip with `front_hook_count = 0`, `back_hook_count = 0`).

### Fixed

- `front_spine_length` now guards against `front_hook_count = 0` producing a nonsensical negative length. Uses `max(front_length, computed)` when hooks are present, `front_length` alone when count is zero.

## [3.0.0] - 2026-04-26

### Breaking Changes

- **BREAKING**: Renamed `spine_thickness` → `front_thickness`.
- **BREAKING**: Renamed `tail_thickness` → `back_thickness`.
- **BREAKING**: Renamed `tail_length` → `back_length`.
- **BREAKING**: Renamed `drop` → `front_drop`.
- **BREAKING**: Renamed all `hook_*` params → `front_hook_*` (e.g. `hook_count` → `front_hook_count`, `hook_brace_hollow` → `front_hook_brace_hollow`, etc.).
- **BREAKING**: Default output now includes back hooks matching the front spine. Set `back_hook_count = 0` to restore tail-only behavior.

### Added

- Full back-spine hook support: symmetric hook configuration for the back/tail side of the door.
- `back_drop`: distance from door top to first back hook. Default `-1` (match `front_drop`).
- `back_hook_count`, `back_hook_offset`, `back_hook_depth`, `back_hook_tip_height`, `back_hook_tip_thickness`, `back_hook_basin_thickness`, `back_hook_angle`, `back_hook_scoop_radius`: full back hook geometry params.
- `back_hook_brace_thickness`, `back_hook_brace_height`, `back_hook_brace_depth`, `back_hook_brace_hollow`: back brace params.
- All `back_hook_*` params accept `-1` to mirror the corresponding `front_hook_*` param. `back_hook_brace_hollow` additionally accepts `0` (false) or `1` (true).
- `back_length`: minimum back spine length retained as a grip when `back_hook_count = 0`.
- Back hooks are geometrically mirrored from the front (extend away from the door on the back side).
- Parameterized `hook_unit` module — accepts all hook geometry as arguments, enabling independent front/back hook shapes.

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
