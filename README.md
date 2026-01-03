- [Fusion Gridfinity Generator](#fusion-gridfinity-generator)
  - [Bin settings:](#bin-settings)
  - [Plate settings:](#plate-settings)

## Fusion Gridfinity Generator

### Bin settings:

`~/Library/Application Support/Autodesk/ApplicationPlugins/GridfinityGenerator.bundle/Contents/commands/commandCreateBin/commandConfig/ui_input_defaults.json`

```json
{
  "static_ui": {
    "info_group": {
      "id": "info_group",
      "value": true,
      "type": "adsk::core::GroupCommandInput"
    },
    "bin_basic_sizes_group": {
      "id": "bin_basic_sizes_group",
      "value": true,
      "type": "adsk::core::GroupCommandInput"
    },
    "bin_dimensions_group": {
      "id": "bin_dimensions_group",
      "value": true,
      "type": "adsk::core::GroupCommandInput"
    },
    "bin_features_group": {
      "id": "bin_features_group",
      "value": true,
      "type": "adsk::core::GroupCommandInput"
    },
    "compartments_group": {
      "id": "compartments_group",
      "value": true,
      "type": "adsk::core::GroupCommandInput"
    },
    "bin_scoop_group": {
      "id": "bin_scoop_group",
      "value": true,
      "type": "adsk::core::GroupCommandInput"
    },
    "bin_tab_features_group": {
      "id": "bin_tab_features_group",
      "value": true,
      "type": "adsk::core::GroupCommandInput"
    },
    "bin_base_features_group": {
      "id": "bin_base_features_group",
      "value": true,
      "type": "adsk::core::GroupCommandInput"
    },
    "user_changes_group": {
      "id": "user_changes_group",
      "value": true,
      "type": "adsk::core::GroupCommandInput"
    },
    "preview_group": {
      "id": "preview_group",
      "value": true,
      "type": "adsk::core::GroupCommandInput"
    },
    "base_width_unit": {
      "id": "base_width_unit",
      "value": 4.2,
      "type": "adsk::core::ValueCommandInput"
    },
    "base_length_unit": {
      "id": "base_length_unit",
      "value": 4.2,
      "type": "adsk::core::ValueCommandInput"
    },
    "height_unit": {
      "id": "height_unit",
      "value": 0.7,
      "type": "adsk::core::ValueCommandInput"
    },
    "bin_xy_tolerance": {
      "id": "bin_xy_tolerance",
      "value": 0.025,
      "type": "adsk::core::ValueCommandInput"
    },
    "bin_width": {
      "id": "bin_width",
      "value": 2,
      "type": "adsk::core::IntegerSpinnerCommandInput"
    },
    "bin_length": {
      "id": "bin_length",
      "value": 2,
      "type": "adsk::core::IntegerSpinnerCommandInput"
    },
    "bin_height": {
      "id": "bin_height",
      "value": 6.0,
      "type": "adsk::core::ValueCommandInput"
    },
    "bin_generate_body": {
      "id": "bin_generate_body",
      "value": true,
      "type": "adsk::core::BoolValueCommandInput"
    },
    "bin_type": {
      "id": "bin_type",
      "value": "Hollow",
      "type": "adsk::core::DropDownCommandInput"
    },
    "bin_wall_thickness": {
      "id": "bin_wall_thickness",
      "value": 0.1,
      "type": "adsk::core::ValueCommandInput"
    },
    "with_lip": {
      "id": "with_lip",
      "value": true,
      "type": "adsk::core::BoolValueCommandInput"
    },
    "with_lip_notches": {
      "id": "with_lip_notches",
      "value": false,
      "type": "adsk::core::BoolValueCommandInput"
    },
    "compartments_grid_w": {
      "id": "compartments_grid_w",
      "value": 1,
      "type": "adsk::core::IntegerSpinnerCommandInput"
    },
    "compartments_grid_l": {
      "id": "compartments_grid_l",
      "value": 1,
      "type": "adsk::core::IntegerSpinnerCommandInput"
    },
    "compartments_grid_type": {
      "id": "compartments_grid_type",
      "value": "Uniform",
      "type": "adsk::core::DropDownCommandInput"
    },
    "bin_has_scoop": {
      "id": "bin_has_scoop",
      "value": false,
      "type": "adsk::core::BoolValueCommandInput"
    },
    "bin_scoop_max_radius": {
      "id": "bin_scoop_max_radius",
      "value": 2.5,
      "type": "adsk::core::ValueCommandInput"
    },
    "bin_has_tab": {
      "id": "bin_has_tab",
      "value": false,
      "type": "adsk::core::BoolValueCommandInput"
    },
    "bin_tab_length": {
      "id": "bin_tab_length",
      "value": 1,
      "type": "adsk::core::ValueCommandInput"
    },
    "bin_tab_width": {
      "id": "bin_tab_width",
      "value": 1.3,
      "type": "adsk::core::ValueCommandInput"
    },
    "bin_tab_position": {
      "id": "bin_tab_position",
      "value": 0,
      "type": "adsk::core::ValueCommandInput"
    },
    "bin_tab_angle": {
      "id": "bin_tab_angle",
      "value": "45 deg",
      "type": "adsk::core::ValueCommandInput"
    },
    "bin_generate_base": {
      "id": "bin_generate_base",
      "value": true,
      "type": "adsk::core::BoolValueCommandInput"
    },
    "bin_screw_holes": {
      "id": "bin_screw_holes",
      "value": false,
      "type": "adsk::core::BoolValueCommandInput"
    },
    "screw_diameter": {
      "id": "screw_diameter",
      "value": 0.3,
      "type": "adsk::core::ValueCommandInput"
    },
    "bin_magnet_cutouts": {
      "id": "bin_magnet_cutouts",
      "value": true,
      "type": "adsk::core::BoolValueCommandInput"
    },
    "bin_magnet_cutouts_tabs": {
      "id": "bin_magnet_cutouts_tabs",
      "value": true,
      "type": "adsk::core::BoolValueCommandInput"
    },
    "magnet_diameter": {
      "id": "magnet_diameter",
      "value": 0.6000000000000001,
      "type": "adsk::core::ValueCommandInput"
    },
    "magnet_height": {
      "id": "magnet_height",
      "value": 0.2,
      "type": "adsk::core::ValueCommandInput"
    },
    "compartment_length_u": {
      "id": "compartment_length_u",
      "value": "Grid cell length: 62.0mm",
      "type": "adsk::core::TextBoxCommandInput"
    }
  },
  "compartments_table": []
}
```

### Plate settings:

`~/Library/Application Support/Autodesk/ApplicationPlugins/GridfinityGenerator.bundle/Contents/commands/commandCreateBaseplate/commandConfig/ui_input_defaults.json`

```json
{
  "info_group": {
    "id": "info_group",
    "value": true,
    "type": "adsk::core::GroupCommandInput"
  },
  "basic_sizes": {
    "id": "basic_sizes",
    "value": true,
    "type": "adsk::core::GroupCommandInput"
  },
  "xy_dimensions": {
    "id": "xy_dimensions",
    "value": true,
    "type": "adsk::core::GroupCommandInput"
  },
  "plate_features": {
    "id": "plate_features",
    "value": true,
    "type": "adsk::core::GroupCommandInput"
  },
  "magnet_cutout_group": {
    "id": "magnet_cutout_group",
    "value": true,
    "type": "adsk::core::GroupCommandInput"
  },
  "screw_hole_group": {
    "id": "screw_hole_group",
    "value": true,
    "type": "adsk::core::GroupCommandInput"
  },
  "advanced_plate_size_group": {
    "id": "advanced_plate_size_group",
    "value": true,
    "type": "adsk::core::GroupCommandInput"
  },
  "input_changes_group": {
    "id": "input_changes_group",
    "value": true,
    "type": "adsk::core::GroupCommandInput"
  },
  "side_padding_group": {
    "id": "side_padding_group",
    "value": true,
    "type": "adsk::core::GroupCommandInput"
  },
  "preview_group": {
    "id": "preview_group",
    "value": true,
    "type": "adsk::core::GroupCommandInput"
  },
  "base_width_unit": {
    "id": "base_width_unit",
    "value": 4.2,
    "type": "adsk::core::ValueCommandInput"
  },
  "base_length_unit": {
    "id": "base_length_unit",
    "value": 4.2,
    "type": "adsk::core::ValueCommandInput"
  },
  "bin_xy_clearance": {
    "id": "bin_xy_clearance",
    "value": 0.025,
    "type": "adsk::core::ValueCommandInput"
  },
  "plate_width": {
    "id": "plate_width",
    "value": 2,
    "type": "adsk::core::IntegerSpinnerCommandInput"
  },
  "plate_length": {
    "id": "plate_length",
    "value": 2,
    "type": "adsk::core::IntegerSpinnerCommandInput"
  },
  "plate_type_dropdown": {
    "id": "plate_type_dropdown",
    "value": "Skeletonized",
    "type": "adsk::core::DropDownCommandInput"
  },
  "with_magnet_cutouts": {
    "id": "with_magnet_cutouts",
    "value": true,
    "type": "adsk::core::BoolValueCommandInput"
  },
  "magnet_diameter": {
    "id": "magnet_diameter",
    "value": 0.6000000000000001,
    "type": "adsk::core::ValueCommandInput"
  },
  "magnet_height": {
    "id": "magnet_height",
    "value": 0.2,
    "type": "adsk::core::ValueCommandInput"
  },
  "with_screw_holes": {
    "id": "with_screw_holes",
    "value": false,
    "type": "adsk::core::BoolValueCommandInput"
  },
  "with_side_padding": {
    "id": "with_side_padding",
    "value": false,
    "type": "adsk::core::BoolValueCommandInput"
  },
  "side_padding_left": {
    "id": "side_padding_left",
    "value": 0,
    "type": "adsk::core::BoolValueCommandInput"
  },
  "side_padding_top": {
    "id": "side_padding_top",
    "value": 0,
    "type": "adsk::core::BoolValueCommandInput"
  },
  "side_padding_right": {
    "id": "side_padding_right",
    "value": 0,
    "type": "adsk::core::BoolValueCommandInput"
  },
  "side_padding_bottom": {
    "id": "side_padding_bottom",
    "value": 0,
    "type": "adsk::core::BoolValueCommandInput"
  },
  "screw_diameter": {
    "id": "screw_diameter",
    "value": 0.30000000000000004,
    "type": "adsk::core::ValueCommandInput"
  },
  "screw_head_diameter": {
    "id": "screw_head_diameter",
    "value": 0.6,
    "type": "adsk::core::ValueCommandInput"
  },
  "extra_bottom_thickness": {
    "id": "extra_bottom_thickness",
    "value": 0.25,
    "type": "adsk::core::ValueCommandInput"
  },
  "bin_z_clearance": {
    "id": "bin_z_clearance",
    "value": 0.05,
    "type": "adsk::core::ValueCommandInput"
  },
  "has_connection_hole": {
    "id": "has_connection_hole",
    "value": false,
    "type": "adsk::core::BoolValueCommandInput"
  },
  "connection_hole_diameter": {
    "id": "connection_hole_diameter",
    "value": 0.32,
    "type": "adsk::core::ValueCommandInput"
  },
  "show_preview": {
    "id": "show_preview",
    "value": true,
    "type": "adsk::core::BoolValueCommandInput"
  }
}
```
