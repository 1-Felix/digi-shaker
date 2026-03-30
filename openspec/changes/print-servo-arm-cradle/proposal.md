## Why

The digi-shaker project needs a mechanical arm and cradle to hold a Digivice D3 V3 Japan Edition (7.5 x 6 cm) and attach it to an MG996R servo for vigorous shaking. The stock servo horn is only 3.5 cm — too small to securely hold the device. A custom 3D-printed arm with an integrated cradle solves this, providing a proper mount point and secure pocket for the Digivice.

## What Changes

- Add an OpenSCAD parametric 3D model for the servo arm + cradle
- The model produces a single printable part: arm body with servo horn mount on one end and a Digivice pocket on the other
- Export-ready STL file for direct slicing and printing
- Parametric design allows adjusting dimensions if measurements need tweaking

## Capabilities

### New Capabilities
- `servo-arm-model`: Parametric OpenSCAD 3D model for the MG996R servo arm with integrated Digivice D3 cradle. Generates an STL file ready for 3D printing.

### Modified Capabilities
<!-- None — this is the first change in the project -->

## Impact

- New files: `models/servo-arm-cradle.scad` (source), `models/servo-arm-cradle.stl` (export)
- No code dependencies — this is a standalone 3D model
- Required for physical assembly of the digi-shaker hardware
