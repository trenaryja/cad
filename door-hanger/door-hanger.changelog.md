# Changelog

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
