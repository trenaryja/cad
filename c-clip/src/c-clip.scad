/* c-clip.scad
 * Parametric C-clip for clamping flat objects with optional grip textures
 * v1.0.0
 *
 * Print orientation: Flat on bed with C-opening facing up (no supports needed)
 */

// =====================================================================
// PARAMETERS
// =====================================================================

// -- Target Object --
target_thickness = 25; // [mm] Thickness of object being clipped
tolerance = 0; // [mm] Fit adjustment (+looser, -tighter)
fabric_gap = 2.5; // [mm] Extra gap on back arm for fabric

// -- Clip Geometry --
front_length = 25; // [mm] Front arm length (from top down)
back_length = 25; // [mm] Back arm length (from top down)
clip_width = 50; // [mm] Width of clip (along clipped edge)
wall = 3; // [mm] Wall thickness

// -- Edge Treatment --
fillet = 1; // [mm] Corner rounding radius (must be < wall/2)

// -- Spring Action --
spring_angle = 0; // [deg] Back arm inward tilt (0 = straight)

// -- Textures --
// Type: 0 = smooth, 1 = ridges, 2 = teeth
front_texture = 0; // Front arm inner surface texture type
front_texture_depth = 0; // [mm] Depth of front texture features
back_texture = 1; // Back arm inner surface texture type
back_texture_depth = 0.5; // [mm] Depth of back texture features
texture_spacing = 2; // [mm] Distance between texture features

// =====================================================================
// COMPUTED VALUES
// =====================================================================

// Internal gap = space for target object + fabric
internal_gap = target_thickness + tolerance + fabric_gap;

// Total profile width (X dimension of C-shape)
profile_width = internal_gap + 2 * wall;

// Clamped fillet (must be < wall/2 to avoid geometry collapse)
safe_fillet = min(fillet, wall / 2 - 0.1);

// =====================================================================
// MAIN RENDER
// =====================================================================

c_clip();

// =====================================================================
// MODULES
// =====================================================================

/**
 * Main clip assembly
 * Combines base geometry with texture cutouts
 */
module c_clip() {
  difference() {
    // Base clip body with rounded corners
    linear_extrude(clip_width)
      offset(r=safe_fillet)
        offset(r=-safe_fillet)
          c_profile();

    // Texture cutouts
    if (front_texture > 0 && front_texture_depth > 0)
      front_texture_cuts();
    if (back_texture > 0 && back_texture_depth > 0)
      back_texture_cuts();
  }
}

/**
 * 2D C-shaped profile
 * Origin at top-left outer corner, arms extend downward (-Y)
 */
module c_profile() {
  // Top bar
  square([profile_width, wall]);

  // Front arm (left side)
  translate([0, -front_length])
    square([wall, front_length + wall]);

  // Back arm (right side, with optional spring angle)
  translate([profile_width - wall, 0])
    back_arm_profile();
}

/**
 * Back arm profile with optional spring angle
 */
module back_arm_profile() {
  if (spring_angle == 0) {
    // Straight arm
    translate([0, -back_length])
      square([wall, back_length + wall]);
  } else {
    // Angled arm for spring pressure
    // Tip moves inward (toward front arm) as it goes down
    inward_shift = sin(spring_angle) * back_length;
    polygon(
      [
        [0, wall],
        [wall, wall],
        [wall - inward_shift, -back_length],
        [-inward_shift, -back_length],
      ]
    );
  }
}

/**
 * Texture cuts on front arm inner face
 */
module front_texture_cuts() {
  // Margin to stay clear of rounded corners
  margin = safe_fillet + 1;
  // Position at inner face of front arm, cutting inward (+X)
  translate([wall - front_texture_depth, -front_length + margin, -0.01])
    texture_pattern(
      front_texture,
      front_texture_depth,
      front_length - margin - safe_fillet,
      clip_width + 0.02
    );
}

/**
 * Texture cuts on back arm inner face
 */
module back_texture_cuts() {
  // Margin to stay clear of rounded corners
  margin = safe_fillet + 1;
  // Position at inner face of back arm, cutting into wall (+X direction)
  translate([wall + internal_gap, -back_length + margin, -0.01])
    texture_pattern(
      back_texture,
      back_texture_depth,
      back_length - margin - safe_fillet,
      clip_width + 0.02
    );
}

/**
 * Generate texture pattern geometry
 * @param type      Texture type (0=smooth, 1=ridges, 2=teeth)
 * @param depth     How deep the texture cuts into the surface
 * @param length    Length of textured area (along arm)
 * @param width     Width of textured area (clip width)
 */
module texture_pattern(type, depth, length, width) {
  if (type > 0 && depth > 0) {
    feature_count = floor(length / texture_spacing);

    for (i = [0:feature_count - 1]) {
      y_offset = i * texture_spacing;

      if (type == 1) {
        // Ridges - rectangular grooves
        translate([0, y_offset, 0])
          cube([depth + 0.01, texture_spacing * 0.5, width]);
      } else if (type == 2) {
        // Teeth - triangular serrations
        translate([0, y_offset, 0])
          linear_extrude(width)
            polygon(
              [
                [0, 0],
                [depth + 0.01, texture_spacing * 0.4],
                [0, texture_spacing * 0.8],
              ]
            );
      }
    }
  }
}

// =====================================================================
// PARAMETER REFERENCE
// =====================================================================
/*
 * Quick parameter guide:
 *
 * SIZING:
 *   target_thickness  - Measure your headboard/object thickness
 *   tolerance         - Start at 0, adjust after test print (-0.2 tighter, +0.2 looser)
 *   fabric_gap        - Thickness of fabric being held (2-3mm typical)
 *   front_length      - Visible side, can be shorter for aesthetics
 *   back_length       - Hidden side with fabric, typically same or longer
 *   clip_width        - How wide the clip spans along the edge
 *   wall              - 2-3mm for PLA, affects stiffness
 *
 * GRIP:
 *   spring_angle      - 2-3° adds spring pressure on back arm
 *   front_texture     - Usually 0 (smooth) to avoid marking visible surfaces
 *   back_texture      - 1 (ridges) or 2 (teeth) to grip fabric
 *   texture_depth     - 0.3-0.5mm for ridges, 0.5-1mm for teeth
 *   texture_spacing   - 2mm default, smaller = more aggressive
 *
 * PRINT:
 *   fillet            - 2mm rounds corners for comfort and print quality
 *   Print flat with C-opening up, no supports needed
 *   Black PLA at 0.2mm layer height works well
 */
