# USB-C Cable Keychain Holder

Holds both ends of a USB-C male-male cable in a compact keychain-friendly form factor, keeping cables tidy and accessible.

## Features

- Two side-by-side USB-C receptacle slots (stacked vertically)
- Stepped cavities: narrow inner slot for metal tip, wider outer pocket for overmold housing
- Merged overmold pocket with chamfered step transition to tip slots
- Entry chamfers for smooth plug insertion
- Hemispherical grip nubs for compliant friction retention
- Integrated keyring lug with smooth hull taper from body
- Parametric side texture ridges wrapping all faces
- Optional cap to close the back
- Full parametric control over all dimensions, tolerances, and features

## Printing

- **Orientation**: Ports facing down (on the bed)
- **Material**: TPU (flexible, grip) or PETG (rigid)
- **Infill**: 100% for TPU, 40%+ for PETG
- **Supports**: Likely not needed — entry and step chamfers reduce internal overhangs
- **Layer Height**: 0.2mm (0.15mm for better grip nub resolution)

## Customization

| Parameter | Default | Description |
| --- | --- | --- |
| `usbc_width` | `8.34` | Metal tip width (USB-C spec) |
| `usbc_height` | `2.56` | Metal tip height (USB-C spec) |
| `usbc_depth` | `7` | How far the tip inserts |
| `usbc_corner_r` | `0.7` | USB-C plug corner radius |
| `overmold_enabled` | `true` | Enable wider entrance pocket for overmold |
| `overmold_width` | `12.35` | Overmold housing width |
| `overmold_height` | `6.5` | Overmold housing height |
| `overmold_depth` | `3` | Overmold pocket depth |
| `overmold_corner_r` | `1` | Overmold pocket corner rounding |
| `tip_tolerance` | `0.1` | Per-side clearance for metal tip |
| `overmold_tolerance` | `0.3` | Per-side clearance for overmold |
| `port_spacing` | `0` | Gap between the two slots (0=touching) |
| `wall` | `1` | Outer wall thickness |
| `corner_radius` | `2` | Body corner rounding (0=sharp) |
| `cap_enabled` | `false` | Close the back (false=through-slots) |
| `cap_thickness` | `1.2` | Cap wall thickness (when enabled) |
| `keyring_enabled` | `true` | Add keyring lug with through-hole |
| `keyring_hole_dia` | `5` | Ring wire diameter |
| `keyring_wall` | `1` | Wall around keyring hole |
| `grip_nubs_enabled` | `true` | Hemispherical nubs inside slots for retention |
| `grip_nub_height` | `0.3` | How far nubs protrude into slot |
| `grip_nub_count` | `2` | Number of nubs per side per slot |
| `fillet_r` | `0.5` | Internal fillet/chamfer radius |
| `texture_enabled` | `true` | Side grip ridges |
| `texture_depth` | `0.5` | Ridge/groove depth |
| `texture_count` | `5` | Number of ridges |

## Default Dimensions

- Body: ~15mm wide x 16mm tall x 10mm deep
- With keyring lug: ~17mm total depth
