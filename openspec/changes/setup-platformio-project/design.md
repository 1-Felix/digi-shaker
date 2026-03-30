## Context

The digi-shaker is a new ESP32 project that drives an MG996R servo to vigorously shake a Digivice D3 V3 Japan Edition. The hardware setup consists of:
- ESP32 NodeMCU (CH340, USB-C) on a 400-pin breadboard
- MG996R servo powered externally via 5V/2.4A wall charger through a cut micro-USB cable
- Servo signal on GPIO 13, common GND between ESP32 and servo
- 3D-printed arm+cradle to hold the Digivice (separate change: `print-servo-arm-cradle`)

The user chose PlatformIO over ESPHome for fine-grained control over servo motion and future reverse engineering data capture.

## Goals / Non-Goals

**Goals:**
- Working PlatformIO project that compiles and uploads to ESP32 NodeMCU
- Smooth, configurable servo shake pattern (angle, speed, frequency, duration)
- Serial output for monitoring shake state and future data capture
- Clean code structure that's easy to extend later (Wi-Fi control, data logging, IR capture)

**Non-Goals:**
- Wi-Fi or web interface (future change)
- Data capture from the Digivice (future RE work)
- OTA updates (not needed yet)
- Home Assistant integration (this isn't ESPHome)

## Decisions

### 1. Arduino framework on PlatformIO
**Choice:** Use `framework = arduino` in platformio.ini
**Rationale:** Arduino framework provides `ESP32Servo` library which handles the ESP32's LEDC PWM hardware for servo control. PlatformIO manages toolchains and dependencies cleanly. The user is familiar with this from the Enviro+ project context.
**Alternative considered:** ESP-IDF native — more control but significantly more boilerplate for a simple servo project. Not worth the complexity.

### 2. ESP32Servo library over raw LEDC PWM
**Choice:** Use the `ESP32Servo` library for servo control.
**Rationale:** ESP32 doesn't have a native Arduino `Servo.h` compatible PWM. `ESP32Servo` wraps the LEDC peripheral correctly, handles channel allocation, and provides a clean `write(angle)` API. Avoids manual microsecond pulse math.
**Alternative considered:** Raw LEDC — full control but requires manual pulse width calculation (500-2400µs mapping) and channel management. Unnecessary complexity.

### 3. GPIO 13 for servo signal
**Choice:** Use GPIO 13 for the servo PWM signal.
**Rationale:** GPIO 13 is PWM-capable, has no boot-mode side effects (unlike GPIO 0, 2, 12, 15), and is easily accessible on the NodeMCU DevKit. It doesn't conflict with I2C (21/22), SPI, or UART pins that might be used for future sensor additions.

### 4. Shake pattern as configurable constants
**Choice:** Define shake parameters as `constexpr` values in a config header, not hardcoded in the loop.
**Rationale:** Easy to tune without reading through motion logic. Parameters: sweep angle (degrees), shake frequency (Hz), shake duration (seconds), rest duration (seconds). Later these become Wi-Fi-configurable.

### 5. Non-blocking motion with millis()
**Choice:** Use `millis()`-based timing instead of `delay()` for shake motion.
**Rationale:** `delay()` blocks the entire loop — no serial processing, no future button handling, no Wi-Fi. A non-blocking approach using millis() allows the shake pattern to run while still processing serial input and future features.

### 6. Project structure
```
digi-shaker/
├── platformio.ini          # Build config
├── include/
│   └── config.h            # Shake parameters
├── src/
│   └── main.cpp            # Entry point, setup/loop
├── lib/                    # Future local libraries
├── models/                 # 3D print files (other change)
└── openspec/               # Specs (existing)
```

## Risks / Trade-offs

- **Servo jitter at extreme speeds** → The MG996R is analog, not digital. At very high oscillation frequencies (>5Hz), it may not reach target angles before reversing. Mitigation: start with conservative 3Hz, tune up based on Digivice response.
- **ESP32 brownout from shared USB power** → If the servo draws a spike through shared ground, the ESP32 may brownout-reset. Mitigation: separate power supplies (wall charger for servo, USB for ESP32). Add a 100µF capacitor across servo power if resets occur.
- **MG996R pulse range varies by unit** → Not all MG996R servos have identical pulse ranges. The ESP32Servo library defaults may not map to full 0-180° range. Mitigation: expose `min_pulse_us` and `max_pulse_us` as config parameters for calibration.
