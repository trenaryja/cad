# C-Clip

Parametric C-shaped clip for clamping flat objects, with optional grip textures for fabric retention.

## What It Does

Slides over the edge of a flat object (headboard, panel, shelf) and holds fabric or material against the back surface. The C-shape provides spring tension while configurable textures grip the fabric.

## Features

- **Fully parametric**: Adjust all dimensions to fit your object
- **Independent arm lengths**: Front and back arms can differ
- **Texture options**: Smooth, ridges, or teeth on either inner face
- **Spring angle**: Optional inward tilt for increased grip pressure
- **Print-ready**: No supports needed when printed flat

## Default Configuration

- **Target thickness**: 25mm (headboard)
- **Fabric gap**: 2.5mm
- **Clip width**: 50mm
- **Wall thickness**: 3mm
- **Arm lengths**: 25mm front and back

## Printing

- **Orientation**: Flat on bed, C-opening facing up
- **Material**: PLA (black recommended for aesthetics)
- **Layer height**: 0.2mm
- **Infill**: 20%+ for durability
- **Supports**: None needed

## Customization

Edit parameters in `src/c-clip.scad`:

| Parameter            | Description                 | Default |
| -------------------- | --------------------------- | ------- |
| `target_thickness`   | Object being clipped        | 25mm    |
| `tolerance`          | Fit adjustment              | 0mm     |
| `fabric_gap`         | Space for fabric            | 2.5mm   |
| `front_length`       | Front arm length            | 25mm    |
| `back_length`        | Back arm length             | 25mm    |
| `clip_width`         | Width along edge            | 50mm    |
| `wall`               | Material thickness          | 3mm     |
| `spring_angle`       | Back arm inward tilt        | 0°      |
| `back_texture`       | 0=smooth, 1=ridges, 2=teeth | 1       |
| `back_texture_depth` | Texture depth               | 0.5mm   |
