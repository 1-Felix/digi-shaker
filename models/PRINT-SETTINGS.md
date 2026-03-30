# Print Settings for servo-arm-cradle.stl

## Recommended Settings

| Setting | Value |
|---------|-------|
| Material | PLA |
| Layer height | 0.2mm |
| Infill | 20-30% |
| Supports | None needed |
| Bed adhesion | Brim (optional, helps with long flat parts) |
| Orientation | Flat side down (as exported) |

## Estimated print time
30-45 minutes depending on printer speed.

## Assembly

1. Screw the stock MG996R servo horn onto the servo shaft
2. Place the printed arm on top of the horn, aligning the two screw holes
3. Screw through the arm into the horn using the small screws from the MG996R kit
4. Slide the Digivice into the cradle from the open end
5. Wrap rubber bands through the wall notches to secure the device

## Adjustments

If the fit is too tight or too loose, edit `servo-arm-cradle.scad` in OpenSCAD:
- `clearance` — increase for looser fit, decrease for tighter (default: 1mm)
- `wall_height` — increase if the device bounces out during shaking
- `arm_thickness` — increase to 5mm if the arm flexes too much
