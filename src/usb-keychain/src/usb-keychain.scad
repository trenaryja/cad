/**
 * USB-C Cable Keychain Holder
 *
 * Accepts both ends of a USB-C male-male cable for keychain carry.
 */

// --- USB-C Plug (measure with calipers) ---
usbc_width = 8.34; // [mm] Metal tip across the wide face
usbc_height = 2.56; // [mm] Metal tip across the thin face
usbc_depth = 7; // [mm] How deep the tip inserts into the slot
usbc_corner_r = 0.7; // [mm] Corner radius of the metal tip

// --- Fit ---
tip_tolerance = 0.05; // [mm] Per-side clearance at slot entry
taper_angle = 1; // [deg] Slot narrows toward back for friction fit (0=parallel)

// --- Body ---
wall = 3; // [mm] Material thickness around each slot
port_spacing = 4.5; // [mm] Edge-to-edge gap between the two slots
corner_radius = 4; // [mm] Body corner rounding (0=sharp)

// --- Cap ---
cap_enabled = false;
cap_thickness = 1.2; // [mm] Cap thickness

// --- Keyring ---
keyring_enabled = true;
keyring_hole_dia = 5; // [mm] Ring wire diameter
keyring_wall = 1; // [mm] Wall around hole

// --- Fillets ---
fillet_r = 0.5; // [mm] Entry chamfer radius

// --- Texture ---
texture_enabled = true;
texture_depth = .5; // [mm] Groove depth
texture_count = 5; // Number of ridges

// --- Print ---
$fn = 50;

// --- Computed ---
tip_w = usbc_width + 2 * tip_tolerance;
tip_h = usbc_height + 2 * tip_tolerance;
body_w = tip_w + 2 * wall;
body_h = 2 * tip_h + port_spacing + 2 * wall;
body_d = usbc_depth + (cap_enabled ? cap_thickness : 0);
slot_y1 = (tip_h + port_spacing) / 2;
slot_y2 = -(tip_h + port_spacing) / 2;
safe_r = max(0, min(corner_radius, body_w / 2 - 0.1, body_h / 2 - 0.1));
safe_usbc_r = max(0, min(usbc_corner_r, tip_h / 2 - 0.1));
ring_r = keyring_hole_dia / 2 + keyring_wall;
lug_w = body_w / 3;
safe_fillet = max(0, min(fillet_r, wall, body_d / 4));
taper_offset = usbc_depth * tan(taper_angle);

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
  back_w = max(0.1, tip_w - 2 * taper_offset);
  back_h = max(0.1, tip_h - 2 * taper_offset);
  back_r = max(0, min(safe_usbc_r, back_w / 2 - 0.1, back_h / 2 - 0.1));
  cavity_depth = cap_enabled ? usbc_depth + 0.01 : body_d + 0.02;
  fillet_w = tip_w + 2 * safe_fillet;
  fillet_h = tip_h + 2 * safe_fillet;
  fillet_r = max(0, min(safe_usbc_r + safe_fillet, fillet_w / 2 - 0.1, fillet_h / 2 - 0.1));
  if (safe_fillet > 0) {
    hull() {
      translate([0, 0, -0.01])
        linear_extrude(0.01)
          rounded_rect(fillet_w, fillet_h, fillet_r);
      translate([0, 0, safe_fillet])
        linear_extrude(0.01)
          rounded_rect(tip_w, tip_h, safe_usbc_r);
    }
    hull() {
      translate([0, 0, safe_fillet])
        linear_extrude(0.01)
          rounded_rect(tip_w, tip_h, safe_usbc_r);
      translate([0, 0, cavity_depth])
        linear_extrude(0.01)
          rounded_rect(back_w, back_h, back_r);
    }
  } else if (taper_angle > 0) {
    hull() {
      translate([0, 0, -0.01])
        linear_extrude(0.01)
          rounded_rect(tip_w, tip_h, safe_usbc_r);
      translate([0, 0, cavity_depth])
        linear_extrude(0.01)
          rounded_rect(back_w, back_h, back_r);
    }
  } else {
    translate([0, 0, -0.01])
      linear_extrude(cavity_depth)
        rounded_rect(tip_w, tip_h, safe_usbc_r);
  }
}

module keyring_hole() {
  if (keyring_enabled)
    translate([0, 0, body_d + ring_r])
      rotate([0, 90, 0])
        cylinder(h=body_w + 0.02, d=keyring_hole_dia, center=true);
}

module cap_fillet() {
  if (cap_enabled && cap_thickness > 0 && safe_fillet > 0) {
    cf = min(safe_fillet, cap_thickness);
    translate([0, 0, usbc_depth - cf])
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
      keyring_hole();
    }
    translate([0, slot_y1, 0]) cap_fillet();
    translate([0, slot_y2, 0]) cap_fillet();
  }
}

assembly();
