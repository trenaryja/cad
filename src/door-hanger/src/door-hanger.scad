/**
 * Parametric Door Hanger Generator
 *
 * Over-door hook hanger with configurable hooks on both front and back spines.
 * All back_hook_* params accept -1 to mirror the corresponding front param.
 * Set back_hook_count = 0 for tail-only mode (no back hooks).
 */

// --- Hanger & Door ---
door_thickness = 34; // [mm] Thickness of the door
door_gap = 3; // [mm] Gap above the door
hanger_width = 30; // [mm] Width of extrusion (Z)

// --- Front Spine ---
front_thickness = 3; // [mm] Front spine wall thickness
front_length = 30; // [mm] Minimum front spine length (grip when no front hooks)
front_drop = 30; // [mm] Top of door to top of first front hook

// --- Back Spine ---
back_thickness = 3; // [mm] Back spine wall thickness
back_length = 30; // [mm] Minimum back spine length (grip when no back hooks)
back_drop = -1; // [mm] Top of door to top of first back hook (-1 = match front)

// --- Front Hooks ---
front_hook_count = 2;
front_hook_offset = 40; // [mm] Spacing between hook tops
front_hook_depth = 25; // [mm] Horizontal reach of the hook
front_hook_tip_height = 10; // [mm] Height of the vertical tip
front_hook_tip_thickness = 3; // [mm] Thickness of the vertical tip
front_hook_basin_thickness = 0; // [mm] Thickness of the horizontal basin arm
front_hook_angle = 0; // [deg] Tilt angle of hook
front_hook_scoop_radius = 100; // [mm] Scoop curve radius (clamped to fit)

// --- Front Brace ---
front_hook_brace_thickness = 3; // [mm] Wall thickness for hollow braces
front_hook_brace_height = 25; // [mm] Vertical length of brace down spine
front_hook_brace_depth = 25; // [mm] Horizontal reach of brace under hook
front_hook_brace_hollow = true;

// --- Back Hooks ---
back_hook_count = -1; // -1 = match front; 0 = no back hooks (tail-only)
back_hook_offset = -1; // [mm] -1 = match front
back_hook_depth = -1; // [mm] -1 = match front
back_hook_tip_height = -1; // [mm] -1 = match front
back_hook_tip_thickness = -1; // [mm] -1 = match front
back_hook_basin_thickness = -1; // [mm] -1 = match front
back_hook_angle = -1; // [deg] -1 = match front
back_hook_scoop_radius = -1; // [mm] -1 = match front

// --- Back Brace ---
back_hook_brace_thickness = -1; // [mm] -1 = match front
back_hook_brace_height = -1; // [mm] -1 = match front
back_hook_brace_depth = -1; // [mm] -1 = match front
back_hook_brace_hollow = -1; // -1 = match front; 0 = false; 1 = true

// --- Styling ---
fillet_radius = 1; // [mm] Corner rounding radius
$fn = 100;

// --- Computed ---
safe_fillet = min(fillet_radius, front_thickness / 2 - 0.1, back_thickness / 2 - 0.1);

front_basin_v_thick = front_hook_basin_thickness / cos(front_hook_angle);
front_spine_length_raw = front_drop + ((front_hook_count - 1) * front_hook_offset) + front_basin_v_thick + front_hook_brace_height;
front_spine_length = front_hook_count > 0 ? max(front_length, front_spine_length_raw) : front_length;

eff_back_hook_count = back_hook_count < 0 ? front_hook_count : back_hook_count;
eff_back_drop = back_drop < 0 ? front_drop : back_drop;
eff_back_hook_offset = back_hook_offset < 0 ? front_hook_offset : back_hook_offset;
eff_back_hook_depth = back_hook_depth < 0 ? front_hook_depth : back_hook_depth;
eff_back_hook_tip_height = back_hook_tip_height < 0 ? front_hook_tip_height : back_hook_tip_height;
eff_back_hook_tip_thickness = back_hook_tip_thickness < 0 ? front_hook_tip_thickness : back_hook_tip_thickness;
eff_back_hook_basin_thickness = back_hook_basin_thickness < 0 ? front_hook_basin_thickness : back_hook_basin_thickness;
eff_back_hook_angle = back_hook_angle < 0 ? front_hook_angle : back_hook_angle;
eff_back_hook_scoop_radius = back_hook_scoop_radius < 0 ? front_hook_scoop_radius : back_hook_scoop_radius;
eff_back_hook_brace_thickness = back_hook_brace_thickness < 0 ? front_hook_brace_thickness : back_hook_brace_thickness;
eff_back_hook_brace_height = back_hook_brace_height < 0 ? front_hook_brace_height : back_hook_brace_height;
eff_back_hook_brace_depth = back_hook_brace_depth < 0 ? front_hook_brace_depth : back_hook_brace_depth;
eff_back_hook_brace_hollow = back_hook_brace_hollow < 0 ? front_hook_brace_hollow : (back_hook_brace_hollow > 0);

back_basin_v_thick = eff_back_hook_basin_thickness / cos(eff_back_hook_angle);
back_spine_length_raw = eff_back_drop + ((eff_back_hook_count - 1) * eff_back_hook_offset) + back_basin_v_thick + eff_back_hook_brace_height;
eff_back_spine_length = eff_back_hook_count > 0 ? max(back_length, back_spine_length_raw) : back_length;

module hook_unit(depth, tip_height, tip_thickness, basin_thickness, angle, scoop_radius, brace_thickness, brace_height, brace_depth, brace_hollow) {
  basin_v_thick = basin_thickness / cos(angle);
  max_s = min(scoop_radius, depth - tip_thickness - 1, tip_height - 1);
  s_r = max(0, max_s);

  union() {
    rotate([0, 0, -angle]) {
      // Basin
      translate([0, -basin_thickness])
        square([depth, basin_thickness]);
      // Tip
      translate([depth - tip_thickness, -basin_thickness])
        square([tip_thickness, tip_height + basin_thickness]);
      // Scoop
      if (s_r > 0)
        translate([depth - tip_thickness - s_r, 0])
          difference() {
            square([s_r, s_r]);
            translate([0, s_r]) circle(r=s_r);
          }
    }

    if (brace_height > 0 && brace_depth > 0) {
      y_top = -basin_v_thick;
      brace_pts = [
        [0, y_top],
        [0, y_top - brace_height],
        [brace_depth * cos(angle), y_top - brace_depth * sin(angle)],
      ];
      difference() {
        polygon(brace_pts);
        if (brace_hollow && brace_thickness > 0)
          offset(delta=-brace_thickness) polygon(brace_pts);
      }
    }
  }
}

module hanger_bracket_profile() {
  polygon(points=[
    [-back_thickness, -eff_back_spine_length],
    [-back_thickness, door_gap],
    [door_thickness + front_thickness, door_gap],
    [door_thickness + front_thickness, -front_spine_length],
    [door_thickness, -front_spine_length],
    [door_thickness, 0],
    [0, 0],
    [0, -eff_back_spine_length],
  ]);
}

module iterate_front_hooks() {
  spawn_x = door_thickness + front_thickness;
  for (i = [0:front_hook_count - 1])
    translate([spawn_x, -front_drop - (i * front_hook_offset)])
      hook_unit(front_hook_depth, front_hook_tip_height, front_hook_tip_thickness,
                front_hook_basin_thickness, front_hook_angle, front_hook_scoop_radius,
                front_hook_brace_thickness, front_hook_brace_height, front_hook_brace_depth,
                front_hook_brace_hollow);
}

module iterate_back_hooks() {
  if (eff_back_hook_count > 0)
    for (i = [0:eff_back_hook_count - 1])
      translate([-back_thickness, -eff_back_drop - (i * eff_back_hook_offset)])
        mirror([1, 0, 0])
          hook_unit(eff_back_hook_depth, eff_back_hook_tip_height, eff_back_hook_tip_thickness,
                    eff_back_hook_basin_thickness, eff_back_hook_angle, eff_back_hook_scoop_radius,
                    eff_back_hook_brace_thickness, eff_back_hook_brace_height, eff_back_hook_brace_depth,
                    eff_back_hook_brace_hollow);
}

module assemble_hanger() {
  linear_extrude(height=hanger_width)
    offset(r=safe_fillet)
      offset(r=-safe_fillet * 2)
        offset(r=safe_fillet)
          union() {
            hanger_bracket_profile();
            iterate_front_hooks();
            iterate_back_hooks();
          }
}

assemble_hanger();
