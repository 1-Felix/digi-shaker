## Context

The digi-shaker project requires a custom mechanical arm to connect an MG996R servo to a Digivice D3 V3 Japan Edition (7.5 x 6 cm). The stock servo horn is 3.5 cm — too small to hold the device securely. A 3D-printed arm with integrated cradle is needed.

The user is new to 3D printing and will use a brother's printer. The design must be simple to print (no supports, flat on bed) and easy to assemble.

Hardware constraints:
- MG996R servo with 25-tooth spline shaft
- Digivice D3 V3: approximately 75 mm x 60 mm x 20 mm
- Vigorous shaking motion: ~60-90° sweep at 3-5 Hz
- Servo torque: 10 kg·cm — Digivice weighs ~50-80g, well within limits at 10cm arm

## Goals / Non-Goals

**Goals:**
- Parametric OpenSCAD model that generates a printable STL
- Single-piece design: arm body + cradle pocket (no assembly of printed parts)
- Mounts to MG996R via stock plastic servo horn (screwed into the arm)
- Secure pocket for Digivice with raised walls and rubber band slots
- Print-friendly: flat on bed, no supports needed, PLA compatible

**Non-Goals:**
- Servo mount/base (servo will be clamped or taped to desk/board separately)
- Electronics enclosure (ESP32 stays on breadboard)
- Printed spline fitting (too fragile in PLA — use stock horn as adapter)

## Decisions

### 1. OpenSCAD over TinkerCAD/Fusion 360
**Choice:** OpenSCAD (code-based parametric CAD)
**Rationale:** Can be generated and version-controlled as a text file. Parameters (Digivice dimensions, arm length, wall height) are easily adjustable. No GUI needed — the user's brother just opens and exports STL.
**Alternative considered:** TinkerCAD — simpler GUI but not parametric, can't version control, requires manual adjustments.

### 2. Stock servo horn as adapter
**Choice:** Screw the stock MG996R plastic servo horn to the underside of the printed arm.
**Rationale:** The 25-tooth spline is difficult to print accurately in PLA at consumer tolerances. The stock horn fits perfectly and is designed for the load. Two M2 screw holes in the arm align with the horn.
**Alternative considered:** Print spline directly — rejected due to tolerance issues and PLA brittleness at small feature sizes.

### 3. Arm length: 100mm total
**Choice:** 100mm from servo center to cradle center.
**Rationale:** At 100mm, the MG996R's 10 kg·cm torque supports ~1 kg at the tip. The Digivice weighs ~70g — this gives >10x safety margin for dynamic loads during fast shaking. Shorter arm = less leverage = more violent shake per degree of sweep.

### 4. Rubber band retention
**Choice:** Slots/notches on the cradle walls for rubber bands to hold the Digivice down.
**Rationale:** Simplest retention method. No clips or latches to design/print. Rubber bands are universally available and accommodate slight size variations. Easy to put on and remove for the user.

### 5. Dimensions with clearance
**Choice:** Cradle pocket inner dimensions: 77mm x 62mm (1mm clearance per side).
**Rationale:** 3D printers slightly over-extrude, so 1mm clearance ensures the Digivice slides in without forcing. If too loose, rubber bands handle it.

## Risks / Trade-offs

- **PLA arm flex at high frequency** → At 4mm thickness and 100mm length, PLA may flex slightly during vigorous shaking. Mitigation: user can increase infill to 40% or arm thickness parameter to 5mm if needed.
- **Servo horn screw holes misalignment** → If the printed holes don't line up perfectly with the stock horn. Mitigation: holes are slightly oversized (2.5mm for M2 screws) to allow adjustment. Can also self-tap through PLA.
- **Digivice pocket fit** → Actual device dimensions may differ slightly from spec. Mitigation: parametric design — user can adjust `digivice_width` and `digivice_length` in the .scad file and re-export.
