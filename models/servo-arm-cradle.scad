// ============================================================
// Digi-Shaker: Servo Arm + Digivice Cradle
// ============================================================
// Parametric 3D model for MG996R servo arm with integrated
// cradle for Digivice D3 V3 Japan Edition.
//
// The Digivice lies FLAT in the cradle, rotated so its long
// axis (top-to-bottom) runs ACROSS the arm. This way, the
// up-and-down servo swing applies force along the device's
// length, matching how a pedometer detects steps.
//
// Usage:
//   1. Adjust parameters below to fit your device
//   2. Press F5 to preview
//   3. Press F6 to render
//   4. Export as STL (File > Export as STL)
//
// Print settings: PLA, 0.2mm layer height, 20-30% infill,
// no supports needed (prints flat on bed)
// ============================================================

// --- Digivice dimensions (mm) ---
digivice_height    = 80;   // Top-to-bottom (long axis) → becomes cradle WIDTH
digivice_width     = 64;   // Left-to-right (short axis) → becomes cradle LENGTH (along arm)

// --- Clearance ---
clearance = 1;             // Gap per side for easy fit

// --- Arm dimensions ---
arm_length    = 100;       // Servo center to cradle center
arm_width     = 25;        // Width of the arm beam
arm_thickness = 4;         // Thickness of the base plate

// --- Cradle walls ---
wall_height    = 5;        // How high walls rise above arm surface
wall_thickness = 5;        // Wall thickness

// --- Servo horn mount ---
horn_center_hole = 8.0;    // Center hole for servo center screw clearance

// --- Rubber band slots ---
band_slot_width = 3;       // Width of each U-notch
band_slot_depth = 3;       // Depth of each U-notch

// ============================================================
// Derived dimensions
// ============================================================

e = 0.01;  // Epsilon for clean boolean operations

// Cradle pocket: Digivice rotated 90° so height runs across arm (Y)
// and width runs along arm (X)
pocket_along_arm = digivice_width + 2 * clearance;   // 65mm (along X)
pocket_across_arm = digivice_height + 2 * clearance;  // 77mm (along Y)

cradle_outer_length = pocket_along_arm + 2 * wall_thickness;   // X direction
cradle_outer_width  = pocket_across_arm + 2 * wall_thickness;  // Y direction

total_height = arm_thickness + wall_height;

servo_mount_length = arm_width;
beam_length = arm_length - servo_mount_length / 2 - cradle_outer_length / 2;

// Where the cradle starts on the X axis
cradle_x = servo_mount_length + beam_length;
// Y offset to center the cradle on the arm
cradle_y = (arm_width - cradle_outer_width) / 2;

// ============================================================
// Dimension readout (printed to console on F5/F6)
// ============================================================

echo(str("=== Dimensions ==="));
echo(str("Total length (along arm): ", cradle_x + cradle_outer_length, " mm"));
echo(str("Cradle outer width (across arm): ", cradle_outer_width, " mm"));
echo(str("Cradle pocket: ", pocket_along_arm, " x ", pocket_across_arm, " mm"));
echo(str("Total height: ", total_height, " mm"));
echo(str("Arm beam length: ", beam_length, " mm"));

// ============================================================
// Single solid body with all cuts applied at once
// ============================================================

difference() {
    // --- Positive geometry ---
    union() {
        // Servo mount plate + arm beam as one continuous slab
        cube([cradle_x + e, arm_width, arm_thickness]);

        // Cradle solid block (overlaps beam by epsilon)
        translate([cradle_x - e, cradle_y, 0])
            cube([cradle_outer_length + e, cradle_outer_width, total_height]);
    }

    // --- Negative geometry (all cuts) ---

    // Center hole for servo center screw clearance
    translate([servo_mount_length/2, arm_width/2, -e])
        cylinder(h = arm_thickness + 2*e, d = horn_center_hole, $fn = 36);

    // Cradle pocket interior (open on one short side for device insertion)
    // Open on the X-min side (toward servo) so device slides in from the arm side
    translate([cradle_x - 2*e, cradle_y + wall_thickness, arm_thickness])
        cube([cradle_outer_length - wall_thickness + 3*e,
              pocket_across_arm,
              wall_height + e]);

    // --- Rubber band slots on long walls (Y-min and Y-max) ---
    // These walls run along the Digivice's height (the long axis)

    // Left long wall (Y-min side)
    for (i = [0 : 1]) {
        slot_x = cradle_x + cradle_outer_length * (i + 1) / 3 - band_slot_width / 2;
        translate([slot_x, cradle_y - e, total_height - band_slot_depth])
            cube([band_slot_width, wall_thickness + 2*e, band_slot_depth + e]);
    }

    // Right long wall (Y-max side)
    for (i = [0 : 1]) {
        slot_x = cradle_x + cradle_outer_length * (i + 1) / 3 - band_slot_width / 2;
        translate([slot_x, cradle_y + cradle_outer_width - wall_thickness - e, total_height - band_slot_depth])
            cube([band_slot_width, wall_thickness + 2*e, band_slot_depth + e]);
    }
}
