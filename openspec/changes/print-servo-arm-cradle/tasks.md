## 1. Project Setup

- [x] 1.1 Create `models/` directory in the project root
- [x] 1.2 Install OpenSCAD (or confirm it's available) for STL export

## 2. OpenSCAD Model

- [x] 2.1 Create `models/servo-arm-cradle.scad` with all parametric variables at the top (digivice dimensions, arm length, wall height, clearance, horn screw spacing)
- [x] 2.2 Model the arm body: flat rectangular bar, 100mm x 25mm x 4mm
- [x] 2.3 Model the servo horn mount: flat area with two 2.5mm through-holes spaced 10mm apart on one end
- [x] 2.4 Model the cradle pocket: rectangular walls (77mm x 62mm inner) rising 5mm, with one short side open for device insertion
- [x] 2.5 Model rubber band retention slots: at least two U-shaped notches (3mm wide, 3mm deep) on top edge of each long wall
- [x] 2.6 Verify the model renders correctly in OpenSCAD preview (F5)

## 3. STL Export

- [x] 3.1 Render the final model in OpenSCAD (F6) and export as `models/servo-arm-cradle.stl`
- [ ] 3.2 Verify the STL is manifold and error-free (import into a slicer to confirm)

## 4. Documentation

- [x] 4.1 Add print settings note to the models directory (PLA, 0.2mm layer height, 20-30% infill, no supports)
