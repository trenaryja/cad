/**
 * Arca Swiss Plate + Multiboard Peg
 */

// --- Dimensions ---
plate_top_width = 32; // [mm] Top width of dovetail plate
plate_bottom_width = 38; // [mm] Bottom width of dovetail plate
plate_height = 5; // [mm] Total plate height
plate_length = 13.5; // [mm] Plate length (matches peg width)
$fn = 100;

// --- Computed ---
dovetail_h = 3; // [mm] Height of the angled dovetail portion
base_h = plate_height - dovetail_h;

module arca_plate_profile() {
  polygon([
    [-plate_bottom_width / 2, 0],
    [plate_bottom_width / 2, 0],
    [plate_bottom_width / 2, base_h],
    [plate_top_width / 2, plate_height],
    [-plate_top_width / 2, plate_height],
    [-plate_bottom_width / 2, base_h],
  ]);
}

module arca_plate() {
  rotate([90, 0])
    linear_extrude(height=plate_length, center=true)
      arca_plate_profile();
}

module peg() {
  translate([0, 0, 31])
    rotate([90, 180, 0])
      translate([-6.75, 0, -6.75])
        import("25mm-push-fit-peg.stl");
}

rotate([-90, 0, 0]) {
  arca_plate();
  peg();
}
