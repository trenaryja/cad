/**
 * USB-C Cable Keychain Holder
 *
 * Accepts both ends of a USB-C male-male cable for keychain carry.
 */

// --- USB-C Plug ---
usbc_width = 8.34; // [mm] Metal tip width
usbc_height = 2.56; // [mm] Metal tip height
usbc_depth = 7; // [mm] Tip insertion depth
usbc_corner_r = 0.7; // [mm] USB-C plug corner radius

// --- Overmold ---
overmold_enabled = true;
overmold_width = 12.35; // [mm] Housing width
overmold_height = 6.5; // [mm] Housing height
overmold_depth = 3; // [mm] Housing pocket depth
overmold_corner_r = 1; // [mm] Overmold pocket corner rounding

// --- Fit ---
tip_tolerance = 0.1; // [mm] Per-side clearance for metal tip
overmold_tolerance = 0.3; // [mm] Per-side clearance for overmold

// --- Port Layout ---
port_spacing = 0; // [mm] Edge-to-edge gap between overmolds (0=touching)

// --- Body ---
wall = 1; // [mm] Outer wall thickness
corner_radius = 2; // [mm] Body corner rounding (0=sharp)

// --- Cap ---
cap_enabled = false;
cap_thickness = 1.2; // [mm] Cap thickness

// --- Keyring ---
keyring_enabled = true;
keyring_hole_dia = 5; // [mm] Ring wire diameter
keyring_wall = 1; // [mm] Wall around hole

// --- Grip Nubs ---
grip_nubs_enabled = true;
grip_nub_height = 0.3; // [mm] Protrusion into slot
grip_nub_count = 2; // Per side per slot

// --- Fillets ---
fillet_r = 0.5; // [mm] Internal fillet/chamfer radius

// --- Texture ---
texture_enabled = true;
texture_depth = .5; // [mm] Groove depth
texture_count = 5; // Number of ridges

// --- Print ---
$fn = 100;

// --- Computed ---
tip_w = usbc_width + 2 * tip_tolerance;
tip_h = usbc_height + 2 * tip_tolerance;
mold_w = overmold_width + 2 * overmold_tolerance;
mold_h = overmold_height + 2 * overmold_tolerance;
slot_w = overmold_enabled ? max(tip_w, mold_w) : tip_w;
slot_h = overmold_enabled ? max(tip_h, mold_h) : tip_h;
body_w = slot_w + 2 * wall;
body_h = 2 * slot_h + port_spacing + 2 * wall;
slot_total_depth = usbc_depth + (overmold_enabled ? overmold_depth : 0);
body_d = slot_total_depth + (cap_enabled ? cap_thickness : 0);
slot_y1 = (slot_h + port_spacing) / 2;
slot_y2 = -(slot_h + port_spacing) / 2;
safe_r = max(0, min(corner_radius, body_w / 2 - 0.1, body_h / 2 - 0.1));
safe_usbc_r = max(0, min(usbc_corner_r, tip_h / 2 - 0.1));
merged_mold_h = 2 * mold_h + port_spacing;
safe_mold_r = max(0, min(overmold_corner_r, mold_w / 2 - 0.1, mold_h / 2 - 0.1));
ring_r = keyring_hole_dia / 2 + keyring_wall;
lug_w = body_w * 1/3;
safe_fillet = max(0, min(fillet_r, wall, body_d / 4));

module rounded_rect(w, h, r) {
  cr = max(0, min(r, w / 2 - 0.1, h / 2 - 0.1));
  if (cr > 0)
    offset(r=cr) offset(r=-cr) square([w, h], center=true);
  else
    square([w, h], center=true);
}

module body_profile() {
  rounded_rect(body_w, body_h, safe_r);
}

module body_shell() {
  if (texture_enabled && texture_depth > 0 && texture_count > 0) {
    divisions = 2 * texture_count + 1;
    segment = body_d / divisions;
    linear_extrude(body_d)
      offset(delta=-texture_depth) body_profile();
    for (i = [0:texture_count])
      translate([0, 0, 2 * i * segment])
        linear_extrude(segment)
          body_profile();
  } else {
    linear_extrude(body_d)
      body_profile();
  }
  if (keyring_enabled)
    hull() {
      translate([0, 0, body_d - 0.01])
        linear_extrude(0.01)
          body_profile();
      translate([0, 0, body_d + ring_r])
        rotate([0, 90, 0])
          cylinder(h=lug_w, d=ring_r * 2, center=true);
    }
}

module usbc_cavity() {
  cavity_depth = cap_enabled ? slot_total_depth + 0.01 : body_d + 0.02;
  translate([0, 0, -0.01])
    linear_extrude(cavity_depth)
      rounded_rect(tip_w, tip_h, safe_usbc_r);
  if (!overmold_enabled && safe_fillet > 0)
    hull() {
      translate([0, 0, -0.01])
        linear_extrude(0.01)
          offset(delta=safe_fillet) rounded_rect(tip_w, tip_h, safe_usbc_r);
      translate([0, 0, safe_fillet])
        linear_extrude(0.01)
          rounded_rect(tip_w, tip_h, safe_usbc_r);
    }
}

module overmold_cavity() {
  if (overmold_enabled) {
    translate([0, 0, -0.01])
      linear_extrude(overmold_depth + 0.01)
        rounded_rect(mold_w, merged_mold_h, safe_mold_r);
    if (safe_fillet > 0) {
      hull() {
        translate([0, 0, -0.01])
          linear_extrude(0.01)
            offset(delta=safe_fillet) rounded_rect(mold_w, merged_mold_h, safe_mold_r);
        translate([0, 0, safe_fillet])
          linear_extrude(0.01)
            rounded_rect(mold_w, merged_mold_h, safe_mold_r);
      }
      for (sy = [slot_y1, slot_y2])
        translate([0, sy, overmold_depth])
          hull() {
            linear_extrude(0.01)
              rounded_rect(mold_w, mold_h, safe_mold_r);
            translate([0, 0, safe_fillet])
              linear_extrude(0.01)
                rounded_rect(tip_w, tip_h, safe_usbc_r);
          }
    }
  }
}

module keyring_hole() {
  if (keyring_enabled)
    translate([0, 0, body_d + ring_r])
      rotate([0, 90, 0])
        cylinder(h=body_w + 0.02, d=keyring_hole_dia, center=true);
}

module grip_nubs_for_slot() {
  if (grip_nubs_enabled && grip_nub_count > 0 && grip_nub_height > 0) {
    nub_start = overmold_enabled ? overmold_depth + 1 : 1;
    nub_end = max(nub_start + 1, slot_total_depth - 1);
    spacing = (nub_end - nub_start) / (grip_nub_count + 1);
    nub_r = grip_nub_height;
    for (i = [1:grip_nub_count])
      for (y_dir = [-1, 1])
        translate([0, y_dir * tip_h / 2, nub_start + i * spacing])
          scale([tip_w * 0.3 / nub_r, 1, 0.8 / nub_r])
            sphere(r=nub_r);
  }
}

module cap_fillet() {
  if (cap_enabled && cap_thickness > 0 && safe_fillet > 0) {
    cf = min(safe_fillet, cap_thickness);
    translate([0, 0, slot_total_depth - cf])
      difference() {
        linear_extrude(cf + 0.01)
          rounded_rect(tip_w, tip_h, safe_usbc_r);
        translate([0, 0, -0.01])
          hull() {
            linear_extrude(0.01)
              rounded_rect(tip_w, tip_h, safe_usbc_r);
            translate([0, 0, cf + 0.02])
              linear_extrude(0.01)
                rounded_rect(max(0.01, tip_w - 2 * cf), max(0.01, tip_h - 2 * cf), max(0, safe_usbc_r - cf));
          }
      }
  }
}

module assembly() {
  union() {
    difference() {
      body_shell();
      translate([0, slot_y1, 0]) usbc_cavity();
      translate([0, slot_y2, 0]) usbc_cavity();
      overmold_cavity();
      keyring_hole();
    }
    translate([0, slot_y1, 0]) grip_nubs_for_slot();
    translate([0, slot_y2, 0]) grip_nubs_for_slot();
    translate([0, slot_y1, 0]) cap_fillet();
    translate([0, slot_y2, 0]) cap_fillet();
  }
}

assembly();
