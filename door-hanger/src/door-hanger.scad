/**
 * Parametric Door Hanger Generator
 *
 * Over-door hook hanger with configurable hooks, braces, and spring geometry.
 */

// --- Hanger & Door ---
door_thickness = 34; // [mm] Thickness of the door
door_gap = 3; // [mm] Gap above the door
hanger_width = 30; // [mm] Width of extrusion (Z)

// --- Tail & Spine ---
tail_length = 30; // [mm] Length of the tail behind the door
tail_thickness = 3; // [mm] Tail wall thickness
spine_thickness = 3; // [mm] Spine wall thickness
drop = 30; // [mm] Top of door to top of first hook

// --- Hook Geometry ---
hook_count = 2;
hook_offset = 40; // [mm] Spacing between hook tops
hook_depth = 25; // [mm] Horizontal reach of the hook
hook_tip_height = 10; // [mm] Height of the vertical tip
hook_tip_thickness = 3; // [mm] Thickness of the vertical tip
hook_basin_thickness = 0; // [mm] Thickness of the horizontal basin arm
hook_angle = 0; // [deg] Tilt angle of hook
hook_scoop_radius = 100; // [mm] Scoop curve radius (clamped to fit)

// --- Brace ---
hook_brace_thickness = 3; // [mm] Wall thickness for hollow braces
hook_brace_height = 25; // [mm] Vertical length of brace down spine
hook_brace_depth = 25; // [mm] Horizontal reach of brace under hook
hook_brace_hollow = true;

// --- Styling ---
fillet_radius = 1; // [mm] Corner rounding radius
$fn = 100;

// --- Computed ---
safe_fillet = min(fillet_radius, tail_thickness / 2 - 0.1, spine_thickness / 2 - 0.1);
basin_vertical_thickness = hook_basin_thickness / cos(hook_angle);
spine_length = drop + ((hook_count - 1) * hook_offset) + basin_vertical_thickness + hook_brace_height;

module hook_unit() {
  max_s = min(hook_scoop_radius, hook_depth - hook_tip_thickness - 1, hook_tip_height - 1);
  s_r = max(0, max_s);

  union() {
    rotate([0, 0, -hook_angle]) {
      // Basin
      translate([0, -hook_basin_thickness])
        square([hook_depth, hook_basin_thickness]);
      // Tip
      translate([hook_depth - hook_tip_thickness, -hook_basin_thickness])
        square([hook_tip_thickness, hook_tip_height + hook_basin_thickness]);
      // Scoop
      if (s_r > 0) {
        translate([hook_depth - hook_tip_thickness - s_r, 0])
          difference() {
            square([s_r, s_r]);
            translate([0, s_r]) circle(r=s_r);
          }
      }
    }

    if (hook_brace_height > 0 && hook_brace_depth > 0) {
      y_top = -basin_vertical_thickness;
      brace_pts = [
        [0, y_top],
        [0, y_top - hook_brace_height],
        [hook_brace_depth * cos(hook_angle), y_top - hook_brace_depth * sin(hook_angle)],
      ];
      difference() {
        polygon(brace_pts);
        if (hook_brace_hollow && hook_brace_thickness > 0)
          offset(delta=-hook_brace_thickness) polygon(brace_pts);
      }
    }
  }
}

module hanger_bracket_profile() {
  back_x = -tail_thickness;
  front_x = door_thickness;
  spine_x_outer = door_thickness + spine_thickness;
  top_y_outer = door_gap;

  polygon(points=[
    [back_x, -tail_length],
    [back_x, top_y_outer],
    [spine_x_outer, top_y_outer],
    [spine_x_outer, -spine_length],
    [front_x, -spine_length],
    [front_x, 0],
    [0, 0],
    [0, -tail_length],
  ]);
}

module iterate_hooks() {
  spawn_x = door_thickness + spine_thickness;
  for (i = [0:hook_count - 1])
    translate([spawn_x, -drop - (i * hook_offset)])
      hook_unit();
}

module assemble_hanger() {
  linear_extrude(height=hanger_width)
    offset(r=safe_fillet)
      offset(r=-safe_fillet * 2)
        offset(r=safe_fillet)
          union() {
            hanger_bracket_profile();
            iterate_hooks();
          }
}

assemble_hanger();
