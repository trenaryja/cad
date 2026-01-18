/**
* Arca Swiss Plate + Multiboard Peg v1.0.0
*/

// --- Dimensions ---
plate_top_width = 32;
plate_bottom_width = 38;
plate_height = 5;
plate_length = 13.5; // Matching peg width for uniform print height
dovetail_h = 3;
base_h = plate_height - dovetail_h;

// --- Styling ---
$fn = 100;

module arca_plate_profile() {
  polygon(
    [
      [-plate_bottom_width / 2, 0],
      [plate_bottom_width / 2, 0],
      [plate_bottom_width / 2, base_h],
      [plate_top_width / 2, plate_height],
      [-plate_top_width / 2, plate_height],
      [-plate_bottom_width / 2, base_h],
    ]
  );
}

module arca_plate() {
  rotate([90, 0])
    linear_extrude(height=plate_length, center=true)
      arca_plate_profile();
}

module peg() {
  color("green")
    // TODO: figure out translating the peg with percentages instead of manual mm numbers
    translate([0, 0, 31])
      rotate([90, 180, 0])
        translate([-6.75, 0, -6.75])
          import("25mm-push-fit-peg.stl");
}

module functional_assembly() {
  arca_plate();
  peg();
}

rotate([-90, 0, 0])
  functional_assembly();
