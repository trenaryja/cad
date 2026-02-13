/**
 * Parametric C-clip for clamping flat objects with optional grip textures.
 * Print flat on bed with C-opening facing up (no supports needed).
 */

// --- Target Object ---
target_thickness = 25; // [mm] Thickness of object being clipped
tolerance = 0; // [mm] Fit adjustment (+looser, -tighter)
fabric_gap = 2.5; // [mm] Extra gap on back arm for fabric

// --- Clip Geometry ---
front_length = 25; // [mm] Front arm length (from top down)
back_length = 25; // [mm] Back arm length (from top down)
clip_width = 50; // [mm] Width of clip (along clipped edge)
wall = 3; // [mm] Wall thickness
fillet = 1; // [mm] Corner rounding radius (must be < wall/2)

// --- Spring Action ---
spring_angle = 0; // [deg] Back arm inward tilt (0 = straight)

// --- Textures (0 = smooth, 1 = ridges, 2 = teeth) ---
front_texture = 0;
front_texture_depth = 0; // [mm]
back_texture = 1;
back_texture_depth = 0.5; // [mm]
texture_spacing = 2; // [mm] Distance between features

// --- Computed ---
internal_gap = target_thickness + tolerance + fabric_gap;
profile_width = internal_gap + 2 * wall;
safe_fillet = min(fillet, wall / 2 - 0.1);

module c_clip() {
  difference() {
    linear_extrude(clip_width)
      offset(r=safe_fillet)
        offset(r=-safe_fillet)
          c_profile();
    if (front_texture > 0 && front_texture_depth > 0)
      front_texture_cuts();
    if (back_texture > 0 && back_texture_depth > 0)
      back_texture_cuts();
  }
}

module c_profile() {
  square([profile_width, wall]);
  translate([0, -front_length])
    square([wall, front_length + wall]);
  translate([profile_width - wall, 0])
    back_arm_profile();
}

module back_arm_profile() {
  if (spring_angle == 0) {
    translate([0, -back_length])
      square([wall, back_length + wall]);
  } else {
    inward_shift = sin(spring_angle) * back_length;
    polygon([
      [0, wall],
      [wall, wall],
      [wall - inward_shift, -back_length],
      [-inward_shift, -back_length],
    ]);
  }
}

module front_texture_cuts() {
  margin = safe_fillet + 1;
  translate([wall - front_texture_depth, -front_length + margin, -0.01])
    texture_pattern(front_texture, front_texture_depth,
      front_length - margin - safe_fillet, clip_width + 0.02);
}

module back_texture_cuts() {
  margin = safe_fillet + 1;
  translate([wall + internal_gap, -back_length + margin, -0.01])
    texture_pattern(back_texture, back_texture_depth,
      back_length - margin - safe_fillet, clip_width + 0.02);
}

module texture_pattern(type, depth, length, width) {
  if (type > 0 && depth > 0) {
    feature_count = floor(length / texture_spacing);
    for (i = [0:feature_count - 1]) {
      y_offset = i * texture_spacing;
      if (type == 1) // Ridges
        translate([0, y_offset, 0])
          cube([depth + 0.01, texture_spacing * 0.5, width]);
      else if (type == 2) // Teeth
        translate([0, y_offset, 0])
          linear_extrude(width)
            polygon([
              [0, 0],
              [depth + 0.01, texture_spacing * 0.4],
              [0, texture_spacing * 0.8],
            ]);
    }
  }
}

c_clip();
