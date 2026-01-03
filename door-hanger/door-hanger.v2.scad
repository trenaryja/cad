/**
 * Parametric Door Hanger Generator
 * 
 * NOMENCLATURE:
 * - hanger: The whole assembly.
 * - tail: Part touching the back of the door.
 * - spine: Part touching the front of the door (carries the hooks).
 * - hook: The individual hanger units.
 * - brace: Support material under/inside the hook for weight.
 * - notch: The U-shaped opening of the hook.
 * - basin: The bottom surface of the notch where items rest.
 * - tip: The outermost vertical part of the hook.
 */

// --- Hanger Configuration ---
door_gap = 3;               
door_thickness = 15.18;     
hanger_tail_thickness = 3;  
hanger_width = 20;          
hanger_tail_length = 30;    

// --- Hook Configuration ---
hook_count = 3;             
hook_depth = 25;            
hook_offset = 40;           
hook_thickness = 5;         
hook_up_height = 12;        

// --- Branding & Styling ---
hook_inner_radius = 3;      // Rounds the 'basin' and 'notch'
fillet_radius = 0.8;        // Softens 'tip' and 'spine' edges
$fn = 32;

// --- 1. Hook Component ---
module hook_unit() {
    // We construct the hook so the "basin" is at Y=0
    // To prevent the hook from vanishing, we only offset the 'notch' area
    difference() {
        // The raw hook material (Brace + Basin + Tip)
        union() {
            // Main horizontal body (Basin/Brace area)
            translate([0, -hook_thickness])
                square([hook_depth, hook_thickness]);
            
            // Outer vertical part (Tip)
            translate([hook_depth - hook_thickness, -hook_thickness])
                square([hook_thickness, hook_up_height + hook_thickness]);
        }
        
        // The Notch (the void where things hang)
        // We round the notch by applying an offset to the SUBTRACTED shape
        offset(r = hook_inner_radius)
        offset(r = -hook_inner_radius)
        translate([0, 0])
            square([hook_depth - hook_thickness, hook_up_height + 1]);
    }
}

// --- 2. Spine & Tail (The Bracket) ---
module bracket_profile() {
    // Y=0 is the top of the door.
    // Negative Y goes down the door.
    
    back_x = -hanger_tail_thickness;
    front_x = door_thickness;
    spine_x_outer = door_thickness + hanger_tail_thickness;
    
    // The top cap sits above the door gap
    top_y_outer = door_gap + hanger_tail_thickness;
    top_y_inner = door_gap;
    
    // Spine length covers all hooks
    spine_bottom_y = -(hook_count * hook_offset) - 10;

    polygon(points = [
        [back_x, -hanger_tail_length], // Bottom of tail
        [back_x, top_y_outer],         // Top back corner (outer)
        [spine_x_outer, top_y_outer],  // Top front corner (outer)
        [spine_x_outer, spine_bottom_y], // Bottom of spine (outer)
        [front_x, spine_bottom_y],     // Bottom of spine (inner)
        [front_x, 0],                  // Under top cap (front)
        [0, 0],                        // Under top cap (back)
        [0, -hanger_tail_length]       // Bottom of tail (inner)
    ]);
}

// --- 3. Hook Iterator ---
module hook_generator() {
    spawn_x = door_thickness + hanger_tail_thickness;
    for (i = [1 : hook_count]) {
        // Move each hook down the spine
        translate([spawn_x, -i * hook_offset])
            hook_unit();
    }
}

// --- 4. Main Assembly ---
module assembly() {
    linear_extrude(height = hanger_width) {
        // Global fillet softened to ensure no parts vanish
        offset(r = fillet_radius) 
        offset(r = -fillet_radius) 
        union() {
            bracket_profile();
            hook_generator();
        }
    }
}

assembly();