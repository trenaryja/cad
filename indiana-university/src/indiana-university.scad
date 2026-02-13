/**
 * Indiana University Logo
 *
 * Extruded IU trident logo from SVG import.
 */

file = "indiana-university.svg";
original_height = 341; // [px] Height of source SVG
target_height = 50; // [mm] Desired output height
thickness = 19; // [mm] Extrusion depth
$fn = 100;

// --- Computed ---
scale_factor = target_height / original_height;

linear_extrude(height=thickness)
  scale([scale_factor, scale_factor, 1])
    import(file=file, center=true);
