---
name: new-model
description: Scaffolds a new parametric OpenSCAD project in this repo. Creates directory structure, generates an initial .scad design (simple + detailed versions), README, CHANGELOG, renders, and opens in OpenSCAD. Use when the user wants to start a new 3D model.
---

# New Model Generator

You help the user scaffold and generate a new parametric OpenSCAD model project in this repository.

## Input

The user provides a project name as an argument (e.g. `/new-model hook-holder`). If no name is given, ask for one. The name should be lowercase and hyphenated.

## Step 1: Interview

Before generating anything, conduct a thorough interactive interview to understand what the user wants to build. Ask questions adaptively — simple shapes may need fewer questions, complex mechanisms may need many. Don't rush this; the quality of the generated model depends on the quality of context gathered here.

**Ask questions about (as relevant):**

- **Purpose**: What does this part do? What problem does it solve?
- **Mounting/attachment**: How does it connect to other things? Friction fit, screws, adhesive, clips?
- **Key dimensions**: What are the critical measurements? What does it interface with?
- **Tolerances**: Does anything need to fit tightly or loosely? Moving parts?
- **Shape description**: Overall form — flat profile extruded? Rotational? Complex 3D?
- **Cross-section**: If it's a profile extrusion, what does the 2D profile look like?
- **Load/stress**: Will it bear weight? In which direction? How much?
- **Print orientation**: How should it sit on the bed? Any overhang concerns?
- **Material**: PLA, PETG, TPU? (affects design decisions like wall thickness, flexibility)
- **Features**: Holes, slots, chamfers, fillets, textures, text?
- **Parametric variables**: Which dimensions should be user-adjustable vs hardcoded?
- **Reference objects**: Is this similar to anything already in the repo? Any real-world reference images in pics/?
- **Constraints**: Printer bed size limits? Nozzle diameter considerations?
- **Quantities**: Will they print multiples? Should it tile or nest?

Ask questions in batches of 2-4 using the AskUserQuestion tool. Continue asking until you have a clear mental model of the part. It's fine to ask 10+ questions for complex designs — the user prefers thoroughness.

## Step 2: Study Existing Models

Before generating code, read ALL `.scad` files in the repository to deeply understand the user's coding style:

```
find . -path '*/src/*.scad' -not -name '*.v[0-9]*'
```

Read each file. Pay attention to:
- Parameter naming conventions (snake_case, grouped with `// --- Group ---`)
- How modules are structured and named
- Design patterns used (profile extrusion, offset tricks, boolean ops)
- Level of parametric detail
- Comment style and density
- How computed values are derived

Also reference the CLAUDE.md conventions for the canonical .scad file structure.

## Step 3: Generate Files

Create the project directory and all files:

```
{name}/
├── src/
│   ├── {name}-simple.scad   # Lo-fi version: basic geometry, correct shape
│   └── {name}.scad           # Hi-fi version: refined with fillets, textures, safeguards
├── README.md
└── CHANGELOG.md
```

### .scad Files

Both files must follow the repository's .scad conventions exactly:

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

**Simple version (`{name}-simple.scad`):**
- Core geometry only — get the shape right
- All key parameters defined and annotated
- Minimal modules, straightforward construction
- Should be valid and renderable

**Detailed version (`{name}.scad`):**
- Full parametric design using the repo's design patterns
- Dual-fillet offset trick where appropriate
- Geometric safeguards (min/max clamping)
- Side-profile extrusion if the part suits it
- Additional features: chamfers, textures, tolerances
- Should be valid and renderable

Both files must share the same parameter names and groups so the user can compare them directly.

### README.md

Follow the pattern from existing projects:

```markdown
# {Title}

{1-2 sentence description of what it does and why}

## Features

- {feature list}

## Printing

- **Orientation**: {how to place on bed}
- **Material**: {recommended material}
- **Infill**: {percentage}
- **Supports**: {yes/no and why}

## Customization

| Parameter | Default | Description |
| --- | --- | --- |
| `param_name` | `value` | What it controls |
```

### CHANGELOG.md

```markdown
# Changelog

## [0.1.0] - {today's date YYYY-MM-DD}

### Added
- Initial generated design with simple and detailed variants
- {list key features}
```

## Step 4: Render

Run the render script to generate the 2x2 composite preview image for the detailed version:

```bash
cd /Users/justin/Git/cad && ./render.sh {name}
```

This generates `{name}/render.png` with isometric, front, top, and right views.

Also render the simple version manually for comparison:

```bash
cd /Users/justin/Git/cad
openscad --preview --projection=ortho \
  --imgsize="1024,1024" --viewall --autocenter \
  --colorscheme="Starnight" \
  --camera="0,0,0,35.26,0,45,0" \
  -o {name}/render-simple.png {name}/src/{name}-simple.scad
```

## Step 5: Open in OpenSCAD

Open both versions in the OpenSCAD GUI so the user can inspect them:

```bash
openscad /Users/justin/Git/cad/{name}/src/{name}.scad &
openscad /Users/justin/Git/cad/{name}/src/{name}-simple.scad &
```

## Step 6: Present Results

Show the user:
1. The render images (use the Read tool to display render.png and render-simple.png)
2. A brief summary of the two versions and their key differences
3. Ask which version they'd like to use as the starting point for iteration
4. Once they choose, offer to delete the other version and rename if needed

## Guidelines

- Never generate geometry you haven't reasoned about — if unsure about a dimension or approach, ask
- Prefer additive construction (union) over subtractive (difference) where possible
- Use `$fn = 100` for curved surfaces unless the user specifies otherwise
- All parameters should have `// [unit]` annotations
- Clamp radius/tolerance values with `min()`/`max()` to prevent self-intersection
- The file must end with the top-level assembly call, no trailing comments or headers
- Test that your generated code is syntactically valid OpenSCAD before writing it
