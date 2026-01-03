// Parametric Door Hook Generator
// Units: mm

// ---------- Variables ----------
door_gap = 3;               // space between door and trim (the "drop")
door_thickness = 15.18;     // thickness of the door itself
hanger_tail_thickness = 3;  // thickness of the hanger walls

hook_count = 5;             // number of hooks
hook_depth = 25;            // how far the hook sticks out
hook_offset = 40;           // vertical distance between hooks

hanger_width = 20;          // how wide the object is (extrusion)
hanger_tail_length = 30;    // length of the backside drop

// --- Extra hook params ---
hook_thickness = 4;         // thickness of the hook arm
hook_up_height = 12;        // height of the hook's vertical "lip"

// ---------- Logic ----------

// Calculate spine length so it ends exactly at the bottom of the last hook
spine_length = (hook_count * hook_offset) + (hook_thickness / 2);

module door_hook() {
    // We create the side profile as a 2D shape, then extrude it.
    linear_extrude(height = hanger_width) {
        
        // 1. Main Hanger Body (The "U" over the door)
        // Coordinates: x=0 is the back of the door.
        // y=0 is the top surface of the door gap.
        
        polygon(points = [
            // Back tail outer
            [-hanger_tail_thickness, spine_length], 
            [-hanger_tail_thickness, -door_gap - hanger_tail_thickness],
            // Top bridge outer
            [door_thickness + hanger_tail_thickness, -door_gap - hanger_tail_thickness],
            // Front spine outer
            [door_thickness + hanger_tail_thickness, spine_length],
            // Front spine inner
            [door_thickness, spine_length],
            // Top bridge inner (underside)
            [door_thickness, -door_gap],
            [-0.01, -door_gap], // -.01 to ensure overlap
            // Back tail inner
            [-0.01, hanger_tail_length],
            [0, hanger_tail_length],
            [0, spine_length]
        ]);

        // 2. The Hooks
        // Position hooks along the front spine
        for (i = [1 : hook_count]) {
            translate([door_thickness + hanger_tail_thickness, i * hook_offset]) {
                // Hook arm
                translate([0, -hook_thickness/2]) 
                    square([hook_depth, hook_thickness]);
                
                // Hook lip (The "U" turn)
                translate([hook_depth - hook_thickness, -hook_up_height]) 
                    square([hook_thickness, hook_up_height]);
            }
        }
    }
}

// Render
door_hook();