# Mickey Ears Badge

Customizable Mickey Mouse ears badge with optional text. Perfect for name tags, ornaments, or Disney-themed crafts.

## What It Does

Generates parametric Mickey Mouse ear silhouettes with mathematically-proportioned ears and optional customizable text overlay using the classic Waltograph font.

## Features

- **Customizable text** - add names, phrases, or leave blank
- **Parametric design** - adjust size with a single scale parameter
- **Disney font included** - Waltograph font files bundled for authentic look

## Specifications

| Property       | Default Value |
| -------------- | ------------- |
| Face diameter  | 50mm          |
| Face thickness | 2mm           |
| Text height    | 1mm           |
| Font size      | 14pt          |

## Printing

- **No supports needed** - prints flat
- **Recommended layer height**: 0.2mm
- **Infill**: 10-15% (mostly cosmetic)
- **Multi-color option**: Pause at layer change to swap colors for text

## Customization

Open `src/mickey_ears.scad` in OpenSCAD and adjust:

- `face_diameter` - overall size
- `text_input` - your custom text
- `add_text` - toggle text on/off
- `font_size` - text size
- `scale` - uniform scaling multiplier

## Credits

Font: [Waltograph](https://www.dafont.com/waltograph.font) by Justin Callaghan

## License

For personal use. Mickey Mouse design is trademarked by The Walt Disney Company.
