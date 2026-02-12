/**
 * Parametric Dowel Generator v1.0.0
 *
 * Generates replacement dowels for IKEA-style furniture panel connections.
 * Supports both solid and fold-flat print modes.
 *
 * NOMENCLATURE:
 * - dowel:       The complete cylindrical pin
 * - half:        One semi-cylindrical half of a split dowel
 * - flat:        The chord face where a half sits on the print bed
 * - bridge:      Thin connecting segment between two halves (fold mode)
 * - span:        The gap between halves where the bridge crosses
 */

// =====================================================================
// PARAMETERS
// =====================================================================

// --- Core Dimensions ---
diameter = 8.15; // [mm] Outer diameter of the dowel
length = 40; // [mm] Total length of the dowel

// --- Chamfer ---
chamfer_enabled = true; // Bevel the ends for easier insertion
chamfer_depth = 1.0; // [mm] How far the bevel extends along the dowel axis
chamfer_angle = 45; // [deg] Bevel angle (45 = classic, steeper = more aggressive)

// --- Fold-Flat Print Mode ---
fold_mode = true; // Split dowel into two halves with bridges
bridge_count = 10; // Number of bridges connecting the halves
bridge_width = 0.6; // [mm] Width of each bridge along dowel length
bridge_thickness = 0.2; // [mm] Thickness of bridge (1–2 layer heights)
span_gap = .6; // [mm] Gap between flat faces (hinge flex room)

// --- Print Tuning ---
tolerance = 0.0; // [mm] Diameter reduction for fit adjustment
$fn = 100; // Render quality

// // --- End Treatment (TODO) ---
// cap_style       = 1;        // [0=flat, 1=hemisphere, 2=chamfer]
// cap_ratio       = 0.5;      // Hemisphere height as fraction of radius (0.0–1.0)
// chamfer_angle   = 45;       // [deg] Angle of chamfer bevel (cap_style=2)
// chamfer_depth   = 1.0;      // [mm] Axial depth of chamfer (cap_style=2)

// // --- Surface Features (TODO) ---
// knurl_enabled   = true;     // Add longitudinal ridges for grip
// knurl_count     = 12;       // Number of ridges around circumference
// knurl_depth     = 0.4;      // [mm] Depth of each ridge groove
// knurl_style     = 0;        // [0=longitudinal, 1=helical, 2=diamond]
// knurl_helix     = 30;       // [deg] Helix twist angle (style 1 & 2)

// groove_enabled  = true;     // Add ring groove(s) for glue retention
// groove_count    = 1;        // Number of ring grooves
// groove_width    = 1.5;      // [mm] Width of each groove
// groove_depth    = 0.6;      // [mm] Depth of each groove
// groove_spacing  = 5;        // [mm] Center-to-center spacing between grooves

// =====================================================================
// COMPUTED VALUES
// =====================================================================

radius = diameter / 2;
effective_radius = radius - tolerance;

// Bridge placement (evenly spaced along length)
bridge_spacing = length / (bridge_count + 1);

// =====================================================================
// MODULES
// =====================================================================

/**
 * Complete dowel along Y axis, centered on XZ.
 * When chamfer_enabled, ends taper to a smaller radius for easier insertion.
 */
module dowel() {
  tip_radius = max(0, effective_radius - chamfer_depth * tan(chamfer_angle));
  rotate([-90, 0, 0]) {
    if (chamfer_enabled) {
      // Front taper
      cylinder(h=chamfer_depth, r1=tip_radius, r2=effective_radius);
      // Main body
      translate([0, 0, chamfer_depth])
        cylinder(h=length - 2 * chamfer_depth, r=effective_radius);
      // Back taper
      translate([0, 0, length - chamfer_depth])
        cylinder(h=chamfer_depth, r1=effective_radius, r2=tip_radius);
    } else {
      cylinder(h=length, r=effective_radius);
    }
  }
}

/**
 * Half-dowel: cylinder sliced at Z=0.
 * Flat face on the XY plane (Z=0), curved surface extends up (+Z).
 * Dowel length runs along Y from 0 to length.
 */
module half_dowel() {
  intersection() {
    dowel();
    translate([-(effective_radius + 1), 0, 0])
      cube([effective_radius * 2 + 2, length + 1, effective_radius + 1]);
  }
}

/**
 * Fold-flat assembly: two halves flat on the bed, connected by bridges.
 *
 * Layout (looking down -Z):
 *   [Half A]  gap  [Half B]
 *
 * Both flat faces at Z=0, curved surfaces up.
 * Fold Half B onto Half A to form a complete dowel.
 */
module fold_flat_assembly() {
  // Half A — left side, inner edge at X = -span_gap/2
  translate([-(effective_radius + span_gap / 2), 0, 0])
    half_dowel();

  // Half B — right side, inner edge at X = +span_gap/2
  translate([effective_radius + span_gap / 2, 0, 0])
    half_dowel();

  // Living-hinge bridges
  fold_bridges();
}

/**
 * Thin bridges connecting the two halves at the hinge line.
 * Flat rectangles at Z=0 spanning the gap in X.
 * Evenly spaced along the dowel length (Y axis).
 */
module fold_bridges() {
  for (i = [1:bridge_count]) {
    y_pos = i * bridge_spacing;
    translate([-span_gap / 2, y_pos - bridge_width / 2, 0])
      cube([span_gap, bridge_width, bridge_thickness]);
  }
}

// =====================================================================
// RENDER
// =====================================================================

if (fold_mode) {
  fold_flat_assembly();
} else {
  dowel();
}
