/**
 * Parametric Dowel Generator
 *
 * Replacement dowels for IKEA-style furniture panel connections.
 * Prints as two half-cylinders connected by living-hinge bridges,
 * then folds into a complete dowel — strongest FDM approach by
 * avoiding cross-layer shear on the cylinder.
 */

// --- Core Dimensions ---
diameter = 8.15; // [mm] Outer diameter
length = 40; // [mm] Total length

// --- Chamfer ---
chamfer_depth = 1.0; // [mm] Bevel depth along axis
chamfer_angle = 45; // [deg] Bevel angle

// --- Living Hinge ---
bridge_count = 10;
bridge_width = 0.6; // [mm] Width of each bridge along dowel length
bridge_thickness = 0.2; // [mm] Thickness (1-2 layer heights)
span_gap = 0.6; // [mm] Gap between flat faces

// --- Print Tuning ---
tolerance = 0.0; // [mm] Diameter reduction for fit adjustment
$fn = 100;

// --- Computed ---
radius = diameter / 2;
effective_radius = radius - tolerance;
tip_radius = max(0, effective_radius - chamfer_depth * tan(chamfer_angle));
bridge_spacing = length / (bridge_count + 1);

module dowel() {
  rotate([-90, 0, 0]) {
    cylinder(h=chamfer_depth, r1=tip_radius, r2=effective_radius);
    translate([0, 0, chamfer_depth])
      cylinder(h=length - 2 * chamfer_depth, r=effective_radius);
    translate([0, 0, length - chamfer_depth])
      cylinder(h=chamfer_depth, r1=effective_radius, r2=tip_radius);
  }
}

module half_dowel() {
  intersection() {
    dowel();
    translate([-(effective_radius + 1), 0, 0])
      cube([effective_radius * 2 + 2, length + 1, effective_radius + 1]);
  }
}

module bridges() {
  for (i = [1:bridge_count]) {
    y_pos = i * bridge_spacing;
    translate([-span_gap / 2, y_pos - bridge_width / 2, 0])
      cube([span_gap, bridge_width, bridge_thickness]);
  }
}

translate([-(effective_radius + span_gap / 2), 0, 0])
  half_dowel();
translate([effective_radius + span_gap / 2, 0, 0])
  half_dowel();
bridges();
