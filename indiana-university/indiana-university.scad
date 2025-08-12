
file = "indiana-university.svg"; 
original_height = 341; 
target_height = 50;       
thickness = 19;            
scale_factor = target_height / original_height;

linear_extrude(height = thickness)
    scale([scale_factor, scale_factor, 1])
        import(file = file, center = true);