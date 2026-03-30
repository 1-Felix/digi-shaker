## Context

The digi-shaker counts sine wave oscillations on the ESP32 and reports them as `stepCount`. The encounter tracker uses this count to predict monster encounters at 400/450/500/550 step thresholds. However, the Digivice's physical pendulum doesn't register every oscillation -- the actual registration rate varies by shake parameters.

## Goals / Non-Goals

**Goals:**
- Calibration workflow: start shaking, enter actual Digivice steps, derive ratio
- Store multiple calibration samples per parameter configuration
- Hierarchical ratio lookup: exact config match → global average → 1.0
- Apply ratio to encounter predictions
- Settings efficiency comparison from calibration data

**Non-Goals:**
- Automatic step detection from the Digivice (requires IR reverse engineering, separate future work)
- Firmware changes (calibration is entirely backend + UI)

## Decisions

### 1. Calibration data model
**Choice:** Store each calibration sample individually with the active parameters at the time.
```sql
calibrations (
  id, created_at,
  oscillation_count, actual_steps, ratio,
  center_angle, amplitude, frequency
)
```
**Rationale:** Individual samples allow averaging, variance analysis, and per-config grouping. The ratio is stored redundantly (could be computed) for query convenience.

### 2. Ratio lookup hierarchy
**Choice:** Three-tier fallback:
1. Exact config match (center + amplitude + frequency) → average ratio from matching samples
2. No match → global average across all calibration samples
3. No calibrations → ratio = 1.0 (raw oscillation count used as-is)

**Rationale:** Users will tune parameters and then calibrate at their preferred settings. When they try new settings, the global average is a reasonable estimate until they calibrate the new config. Shake/rest duration are excluded from the config key since they don't affect step registration rate.

### 3. Calibration flow uses stepCount delta
**Choice:** Record `stepCount` at calibration start, compute delta at stop. No firmware changes.
**Rationale:** The ESP32 already tracks oscillations in `stepCount`. The browser records the value when "Start Calibration" is pressed and computes `oscillations = currentStepCount - startStepCount` when stopped. This keeps calibration entirely in the UI + backend.

### 4. Calibration state via WebSocket
**Choice:** Calibration start/stop/submit messages go through the existing WebSocket protocol. The backend stores calibrations and broadcasts updated ratio data.
**Rationale:** Consistent with the existing command relay architecture. No new HTTP endpoints needed.

### 5. Encounter tracker displays both raw and calibrated
**Choice:** Show `~87 / 120 steps` where 87 is calibrated and 120 is raw oscillations.
**Rationale:** The raw count is still useful for debugging. Showing both builds trust in the calibration and makes it obvious when the ratio is way off.

## Risks / Trade-offs

- **Calibration accuracy depends on user reading the Digivice correctly** → Show clear instructions in the UI. Multiple samples average out reading errors.
- **Config match is exact** → If the user changes center by 1 degree, it won't match previous calibrations. Acceptable because small parameter changes could genuinely affect registration rate. The global fallback handles this gracefully.
- **No auto-detection of stale calibrations** → If the physical setup changes (new cradle, different mounting), old calibrations may be wrong. User can see the history and delete bad samples if needed.
