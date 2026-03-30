## ADDED Requirements

### Requirement: Parametric OpenSCAD model
The project SHALL include an OpenSCAD file at `models/servo-arm-cradle.scad` that generates a 3D-printable servo arm with integrated Digivice cradle. All key dimensions SHALL be defined as parameters at the top of the file.

#### Scenario: Adjustable parameters
- **WHEN** a user opens the .scad file
- **THEN** the following parameters SHALL be editable at the top of the file: `digivice_length` (default 75), `digivice_width` (default 60), `digivice_depth` (default 20), `arm_length` (default 100), `arm_width` (default 25), `arm_thickness` (default 4), `wall_height` (default 5), `wall_thickness` (default 5), `clearance` (default 1), `horn_screw_spacing` (default 10), `horn_screw_diameter` (default 2.5)

#### Scenario: Preview renders correctly
- **WHEN** a user presses F5 (preview) in OpenSCAD
- **THEN** the model SHALL render a single solid body showing the arm, cradle walls, and servo horn mount holes

### Requirement: Servo horn mount
The arm SHALL include a flat mounting area on one end with two through-holes spaced to match the MG996R stock servo horn screw pattern. The holes SHALL have a diameter of 2.5mm (for M2 screws with clearance).

#### Scenario: Horn screw holes are present
- **WHEN** the STL is sliced in a slicer
- **THEN** two cylindrical through-holes SHALL be visible on the servo end, spaced 10mm apart (center to center), each 2.5mm in diameter

### Requirement: Digivice cradle pocket
The arm SHALL include a rectangular pocket on the opposite end from the servo mount. The pocket inner dimensions SHALL be `digivice_length + 2*clearance` by `digivice_width + 2*clearance`. Walls SHALL rise `wall_height` mm above the arm surface on three sides, with one short side open for sliding the device in.

#### Scenario: Digivice fits in pocket
- **WHEN** a Digivice D3 V3 (75 x 60 mm) is placed into the printed cradle
- **THEN** it SHALL fit with approximately 1mm clearance on each side

#### Scenario: One open side for insertion
- **WHEN** viewing the cradle from above
- **THEN** one of the short sides (60mm side) SHALL have no wall, allowing the Digivice to slide in

### Requirement: Rubber band retention slots
The cradle walls SHALL include notches/slots to allow rubber bands to be wrapped around the cradle to secure the Digivice. There SHALL be at least two slots on each long wall.

#### Scenario: Rubber band slots present
- **WHEN** examining the printed cradle walls
- **THEN** each long wall SHALL have at least two U-shaped notches (approximately 3mm wide, 3mm deep) cut into the top edge of the wall

### Requirement: Print-friendly geometry
The model SHALL be designed to print flat on a build plate without supports. All surfaces SHALL be flat-bottomed. No overhangs SHALL exceed 45 degrees.

#### Scenario: No supports needed in slicer
- **WHEN** the STL is imported into a slicer (e.g., Cura, PrusaSlicer) with the flat bottom on the build plate
- **THEN** the slicer SHALL report no support material needed at default overhang settings (45°)

### Requirement: STL export
The project SHALL include a pre-exported STL file at `models/servo-arm-cradle.stl` ready for direct slicing and printing.

#### Scenario: STL file is valid
- **WHEN** the STL file is opened in a slicer
- **THEN** it SHALL be a valid, manifold mesh with no errors
