/* [Face Variables] */
face_diameter = 50; 
face_extrusion_height = 2;

/* [Text Variables] */
add_text = true;
text_input = "Disney";
text_extrusion_height = 1;
font = "Waltograph"; // https://www.dafont.com/waltograph.font
font_size = 14;

/* [Global Variables] */
scale = 1; 
$fn = 200;

module mickey_ears() {
    ear_width = face_diameter * 0.625;
    ear_height = face_diameter * 0.542;
    ear_offset_x = face_diameter * 0.483;
    ear_offset_y = face_diameter * 0.559;
    ear_rotation = 325; 

    // Face
    circle(d = face_diameter);

    // Left Ear
    translate([-ear_offset_x, ear_offset_y, 0])
        rotate([0, 0, -ear_rotation])
            scale([1, ear_height / ear_width])
                circle(d = ear_width);

    // Right Ear
    translate([ear_offset_x, ear_offset_y, 0])
        rotate([0, 0, ear_rotation])
            scale([1, ear_height / ear_width])
                circle(d = ear_width);
}

module add_text(input) {
    linear_extrude(text_extrusion_height)
        text(
            input,
            size = font_size,
            font = font,
            valign = "center",
            halign = "center" 
        );
}

scale([scale, scale]) {
    linear_extrude(face_extrusion_height)
        mickey_ears();
    if (add_text)
      translate([0, 0, face_extrusion_height])
          color("black")
              add_text(text_input);
}

