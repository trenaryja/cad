/**
 * Mickey Ears Fridge Magnet
 *
 * Mickey head silhouette with optional embossed text.
 */

// --- Face ---
face_diameter = 50; // [mm] Diameter of the main circle
face_extrusion_height = 2; // [mm] Thickness of the base

// --- Text ---
add_text = true;
text_input = "Disney";
text_extrusion_height = 1; // [mm] Height of raised text
font = "Waltograph"; // https://www.dafont.com/waltograph.font
font_size = 13.5; // [mm]

// --- Global ---
model_scale = 1; // Overall scale multiplier
$fn = 50;

module mickey_ears() {
  ear_width = face_diameter * 0.625;
  ear_height = face_diameter * 0.542;
  ear_offset_x = face_diameter * 0.483;
  ear_offset_y = face_diameter * 0.559;
  ear_rotation = 325;

  circle(d=face_diameter);

  translate([-ear_offset_x, ear_offset_y, 0])
    rotate([0, 0, -ear_rotation])
      scale([1, ear_height / ear_width])
        circle(d=ear_width);

  translate([ear_offset_x, ear_offset_y, 0])
    rotate([0, 0, ear_rotation])
      scale([1, ear_height / ear_width])
        circle(d=ear_width);
}

module add_text(input) {
  linear_extrude(text_extrusion_height)
    text(input, size=font_size, font=font, valign="center", halign="center");
}

scale([model_scale, model_scale]) {
  linear_extrude(face_extrusion_height)
    mickey_ears();
  if (add_text)
    translate([0, 0, face_extrusion_height - 0.0001])
      color("black")
        add_text(text_input);
}
