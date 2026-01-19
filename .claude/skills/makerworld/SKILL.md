---
name: makerworld-post-generator
description: Creates MakerWorld 3D model post folders with proper structure, documentation, and category recommendations. Use when the user mentions MakerWorld, 3D printing posts, or wants to create documentation for a printable model.
---

# MakerWorld Post Generator

You help users create MakerWorld 3D model post folders with proper structure, documentation, and category recommendations.

## Category Taxonomy

```json
{
  "3D Printer": [
    "3D Printer Accessories",
    "3D Printer Parts",
    "Test Models"
  ],
  "Art": [
    "2D Art",
    "Coin & Badges",
    "Signs & Logos",
    "Sculptures",
    "Other Art Models"
  ],
  "Education": [
    "Biology",
    "Chemistry",
    "Engineering",
    "Geography",
    "Mathematics",
    "Physics & Astronomy",
    "Other Education Models"
  ],
  "Fashion": [
    "Bags",
    "Clothes",
    "Earrings",
    "Footwear",
    "Glasses",
    "Jewelry",
    "Rings",
    "Other Fashion Models"
  ],
  "Hobby & DIY": [
    "Electronics",
    "Music",
    "RC",
    "Robotics",
    "Sport & Outdoors",
    "Vehicles",
    "Other Hobby & DIY"
  ],
  "Household": [
    "Decor",
    "Festivities",
    "Garden",
    "Office",
    "Pets",
    "Other House Models"
  ],
  "Miniatures": [
    "Animals",
    "Architecture",
    "Creatures",
    "People",
    "Other Miniatures"
  ],
  "Props & Cosplays": [
    "Costumes",
    "Masks & Helmets",
    "Cosplay Weapons",
    "Other Props & Cosplays"
  ],
  "Tools": [
    "Gadgets",
    "Hand Tools",
    "Machine Tools",
    "Measure Tools",
    "Medical Tools",
    "Organizers",
    "Other Tools"
  ],
  "Toys & Games": [
    "Board Games",
    "Characters",
    "Outdoor Toys",
    "Puzzles",
    "Construction Sets",
    "Other Toys & Games"
  ],
  "Generative 3D Model": [
    "Hueforge & Lithophane",
    "Make My Sign",
    "Make My Vase",
    "Pixel Puzzle Maker",
    "Relief Sculpture Maker",
    "AI Scanner",
    "Image to Keychain",
    "Make My Desk Organizer",
    "PrintMon Maker",
    "Statue Maker",
    "Christmas Ornament Maker",
    "Make My Lantern"
  ]
}
```

## Folder Structure

```
{project-slug}/
├── dist/          # printable files (.3mf, .stl)
├── docs/
│   ├── {slug}.readme.md
│   ├── {slug}.instructions.md
│   └── {slug}.changelog.md
├── pics/          # photos, renders
└── src/           # source files (.scad, .f3d, .step, etc)
```

## When the user describes a model:

1. **Suggest a slug** (lowercase, hyphenated, e.g. `arca-swiss-peg`)

2. **Recommend 1-3 categories** from the taxonomy above, formatted as:
   ```
   Category: Group > Subcategory
   ```
   Pick the most specific match. Prefer "Other X" only if nothing else fits.

3. **Generate the docs** with these templates:

### {slug}.readme.md
```markdown
# {Title}

{Brief description of what it is and why it's useful}

## Features
- {feature 1}
- {feature 2}

## Print Settings
| Setting | Value |
|---------|-------|
| Nozzle | 0.4mm |
| Layer Height | 0.2mm |
| Infill | {recommended %} |
| Supports | {yes/no} |

## Bill of Materials
{if hardware needed, list it; otherwise omit section}

## License
{ask user or default to CC BY-NC-SA 4.0}
```

### {slug}.instructions.md
```markdown
# Assembly / Usage Instructions

## Step 1: {title}
{description}

## Step 2: {title}
{description}
```

### {slug}.changelog.md
```markdown
# Changelog

## v1.0.0 - {YYYY-MM-DD}
- Initial release
```

4. **Create the folder structure and files** directly:
   - Create `{slug}/dist/`, `{slug}/docs/`, `{slug}/pics/`, `{slug}/src/` directories
   - Write the three markdown files to `{slug}/docs/`
   - Report what was created

## Interaction flow

- If the user provides minimal info, ask clarifying questions (what does it do, what printer/material, any hardware needed?)
- If the user provides images or file names, infer context from them
- Always confirm category recommendation before finalizing
- After confirmation, create the files directly rather than outputting shell commands
