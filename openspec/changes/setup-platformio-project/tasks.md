## 1. PlatformIO Project Setup

- [x] 1.1 Initialize PlatformIO project with `platformio.ini` targeting `esp32dev` board with Arduino framework
- [x] 1.2 Add `ESP32Servo` library dependency to `platformio.ini`
- [x] 1.3 Set serial monitor speed to 115200 in `platformio.ini`
- [x] 1.4 Add `.gitignore` for PlatformIO build artifacts (`.pio/`, `.vscode/`)

## 2. Configuration

- [x] 2.1 Create `include/config.h` with all shake parameters (center angle, amplitude, frequency, duration, rest time)
- [x] 2.2 Add servo pulse width config (min_pulse_us, max_pulse_us) with MG996R defaults
- [x] 2.3 Add GPIO pin definition (SERVO_PIN = 13)

## 3. Servo Control

- [x] 3.1 Implement servo initialization in `src/main.cpp` setup() — attach to GPIO 13 with configurable pulse range, move to center
- [x] 3.2 Implement angle-setting function with clamping to 0-180° range
- [x] 3.3 Implement servo detach for rest periods

## 4. Shake Pattern

- [x] 4.1 Implement non-blocking shake oscillation using millis() and sinusoidal wave for smooth motion
- [x] 4.2 Implement shake/rest cycle state machine (SHAKING → RESTING → SHAKING)
- [x] 4.3 Implement shake cycle counter

## 5. Serial Interface

- [x] 5.1 Print startup message with project name and all configured parameters
- [x] 5.2 Print status messages on shake start and rest start with cycle count
- [x] 5.3 Print total shake count on each rest transition

## 6. Hardware Wiring & Testing

- [ ] 6.1 Wire ESP32 on breadboard: servo signal (GPIO 13), common GND, external 5V from cut micro-USB cable to servo power
- [ ] 6.2 Upload firmware, verify servo sweeps correctly via serial monitor
- [ ] 6.3 Tune shake parameters (amplitude, frequency) based on Digivice response
