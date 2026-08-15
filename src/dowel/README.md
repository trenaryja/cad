# Parametric Dowel Generator

Replacement dowels for IKEA-style furniture panel connections. Fully parametric with optional fold-flat printing.

## Features

- **Adjustable core dimensions**: diameter, length
- **End treatments**: flat, hemisphere, or chamfer — all parametric
- **Surface grip**: longitudinal, helical, or diamond knurl patterns
- **Glue retention**: configurable ring grooves (count, width, depth, spacing)
- **Fold-flat print mode**: prints as two halves connected by thin bridges — peel off the bed and fold into a complete dowel
- **Print tuning**: tolerance offset for dialing in fit

## Default Configuration

| Parameter        | Default        | Description             |
| ---------------- | -------------- | ----------------------- |
| `diameter`       | 8 mm           | Outer diameter          |
| `length`         | 30 mm          | Total length            |
| `cap_style`      | 1 (hemisphere) | End shape               |
| `knurl_enabled`  | true           | Surface ridges          |
| `groove_enabled` | true           | Glue ring channels      |
| `fold_mode`      | true           | Split for flat printing |

## Printing

- **Orientation**: Fold mode prints flat on bed. Solid mode prints upright.
- **Material**: PLA for most furniture; PETG for moisture-prone areas
- **Layer height**: 0.2 mm typical; 0.12 mm for tighter tolerances
- **Infill**: 100% recommended for structural dowels
- **Supports**: None needed in fold mode

## Customization

Open `src/dowel.scad` in OpenSCAD and adjust parameters at the top of the file. Key parameters:

| Parameter          | Range       | Notes                                |
| ------------------ | ----------- | ------------------------------------ |
| `diameter`         | 4–12 mm     | Common IKEA sizes: 5, 6, 8 mm        |
| `length`           | 15–50 mm    | Common: 20, 30, 35 mm                |
| `cap_ratio`        | 0.0–1.0     | 1.0 = full hemisphere                |
| `knurl_depth`      | 0.2–0.8 mm  | Deeper = more grip, harder insertion |
| `tolerance`        | -0.1–0.3 mm | Negative = tighter fit               |
| `bridge_thickness` | 0.2–0.6 mm  | Match to 1–2 layer heights           |
