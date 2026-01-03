/**
 * Parametric Door Hanger Generator v2.2.0
 *
 * NOMENCLATURE:
 * - door: The thing the hanger hangs on.
 * - hanger: The entire assembly.
 * - tail: The part touching the back of the door.
 * - spine: The part touching the front of the door (carries the hooks).
 * - drop: Distance from top of door to the top (tip) of the first hook.
 * - hook: The individual hanger units.
 * - brace: Support material under the hook arm.
 * - notch: The U-shaped opening where things hang.
 * - basin: The bottom surface of the notch (the hook's arm).
 * - tip: The outermost vertical part of the hook.
 */

// --- Hanger & Door Settings ---
door_thickness = 34;
door_gap = 3;               // Total thickness of the bridge above the door
hanger_width = 30;          // Width of extrusion (Z)

// --- Tail & Spine Settings ---
tail_length = 30;
tail_thickness = 3;
spine_thickness = 3;
drop = 30;                  // Top of door to top of first hook

// --- Hook Geometry ---
hook_count = 2;
hook_offset = 40;           // Spacing between hook tops
hook_depth = 25;
hook_tip_height = 10;
hook_tip_thickness = 3;     // Thickness of the vertical tip
hook_basin_thickness = 0;   // Thickness of the horizontal basin arm
hook_angle = 0;             // Degrees to tilt hook
hook_scoop_radius = 100;    // Radius of the "scoop" curve (clamped to fit)

// --- Brace (Support) Settings ---
hook_brace_thickness = 3;   // Wall thickness for hollow braces
hook_brace_height = 25;     // Vertical length of brace down spine
hook_brace_depth = 25;      // Horizontal reach of brace under hook
hook_brace_hollow = true;

// --- Styling & Print Prep ---
fillet_radius = 1;          // Global border radius (inner and outer)
$fn = 100;

// --- Calculated Logic ---
v_thick = hook_basin_thickness / cos(hook_angle);
spine_length = drop + ((hook_count - 1) * hook_offset) + v_thick + hook_brace_height;

module hook_unit() {
    // SAFEGUARDS: Clamp scoop so it doesn't exceed hook height/depth
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
                    translate([0, s_r]) circle(r = s_r);
                }
            }
        }

        // Brace (Render only if dimensions exist)
        if (hook_brace_height > 0 && hook_brace_depth > 0) {
            y_top = -v_thick;
            brace_pts = [
                [0, y_top],
                [0, y_top - hook_brace_height],
                [hook_brace_depth * cos(hook_angle), y_top - hook_brace_depth * sin(hook_angle)]
            ];
            difference() {
                polygon(brace_pts);
                if (hook_brace_hollow && hook_brace_thickness > 0) 
                    offset(delta = -hook_brace_thickness) polygon(brace_pts);
            }
        }
    }
}

module hanger_bracket_profile() {
    back_x = -tail_thickness;
    front_x = door_thickness;
    spine_x_outer = door_thickness + spine_thickness;
    top_y_outer = door_gap;

    polygon(points = [
        [back_x, -tail_length],
        [back_x, top_y_outer],
        [spine_x_outer, top_y_outer],
        [spine_x_outer, -spine_length],
        [front_x, -spine_length],
        [front_x, 0],
        [0, 0],
        [0, -tail_length]
    ]);
}

module iterate_hooks() {
    spawn_x = door_thickness + spine_thickness;
    for (i = [0 : hook_count - 1]) {
        translate([spawn_x, -drop - (i * hook_offset)])
            hook_unit();
    }
}

module assemble_hanger() {
    linear_extrude(height = hanger_width) {
        offset(r = fillet_radius)
        offset(r = -fillet_radius * 2)
        offset(r = fillet_radius)
        union() {
            hanger_bracket_profile();
            iterate_hooks();
        }
    }
}

assemble_hanger();