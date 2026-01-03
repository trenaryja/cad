/**
 * Parametric Door Hanger Generator v2.1.1
 *
 * NOMENCLATURE:
 * - door: The thing the hanger hangs on.
 * - hanger: The entire assembly.
 * - tail: The part touching the back of the door.
 * - spine: The part touching the front of the door (carries the hooks).
 * - drop: Distance from top of door to the top (tip) of the first hook.
 * - hook: The individual hanger units.
 * - brace: Triangular support material under the hook arm.
 * - notch: The U-shaped opening where things hang.
 * - basin: The bottom surface of the notch (the hook's arm).
 * - tip: The outermost vertical part of the hook.
 */

// --- Hanger & Door Settings ---
door_thickness = 34;
door_gap = 3;               // Clearance for trim above door
hanger_width = 30;          // Width of extrusion (Z)

// --- Tail & Spine Settings ---
tail_length = 30;
tail_thickness = 3;
spine_thickness = 3;
drop = 30;                  // Top of door to top of first hook

// --- Hook Geometry ---
hook_count = 2;
hook_offset = 30;           // Spacing between hook tops
hook_depth = 30;
hook_tip_height = 10;
hook_brace_thickness = 3;   // Thickness of the horizontal basin
hook_angle = 0;             // Degrees to tilt hook upward

// --- Brace (Support) Settings ---
hook_brace_height = 20;     // Vertical length of brace down spine
hook_brace_hollow = true;
hook_brace_wall = 3;

// --- Styling & Print Prep ---
hook_inner_radius = 4;      // Rounds the 'notch' interior
fillet_radius = 1;        // Global border radius (inner and outer)
$fn = 100;

// --- Calculated Logic ---
hook_unit_h = hook_tip_height + hook_brace_thickness + hook_brace_height;
spine_length = drop + ((hook_count - 1) * hook_offset) + hook_brace_thickness + hook_brace_height;

module triangular_brace(h, d, hollow=false, wall=2) {
    difference() {
        polygon([[0,0], [d,0], [0,-h]]);
        if (hollow) {
            // Use offset(delta) for mathematically perfect wall inset
            offset(delta = -wall)
                polygon([[0,0], [d,0], [0,-h]]);
        }
    }
}

module hook_unit() {
    // Basin top is at Y=0
    difference() {
        union() {
            // Basin/Arm & Tip
            rotate([0, 0, -hook_angle]) {
                translate([0, -hook_brace_thickness])
                    square([hook_depth, hook_brace_thickness]);
                translate([hook_depth - spine_thickness, -hook_brace_thickness])
                    square([spine_thickness, hook_tip_height + hook_brace_thickness]);
            }
            // Brace (Support)
            translate([0, -hook_brace_thickness])
                triangular_brace(hook_brace_height, hook_depth * 0.7, hook_brace_hollow, hook_brace_wall);
        }

        // Notch removal with internal rounding
        offset(r = hook_inner_radius)
        offset(r = -hook_inner_radius)
        rotate([0, 0, -hook_angle])
        translate([-0.1, 0])
            square([hook_depth - spine_thickness + 0.1, hook_tip_height + 0.1]);
    }
}

module hanger_bracket_profile() {
    back_x = -tail_thickness;
    front_x = door_thickness;
    spine_x_outer = door_thickness + spine_thickness;
    top_y_outer = door_gap + tail_thickness;

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
        // Dual-Fillet: Rounds internal joints AND external corners
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