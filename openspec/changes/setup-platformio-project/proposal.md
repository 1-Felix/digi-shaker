## Why

The digi-shaker needs firmware to drive an MG996R servo in a vigorous shaking pattern to simulate walking/running motion for a Digivice D3 V3 Japan Edition. This is the foundation for an automated shaking rig that will later support data capture for reverse engineering the device. PlatformIO on ESP32 provides fine-grained control over servo timing, motion patterns, and future extensibility (Wi-Fi control, data logging).

## What Changes

- Initialize a PlatformIO project targeting ESP32 NodeMCU (CH340, USB-C)
- Configure the build environment for the ESP32 DevKit with Arduino framework
- Implement servo control using hardware PWM on GPIO 13
- Create a configurable shake pattern: sweep angle, frequency, duration, and pause intervals
- Add serial monitor output for debugging and future data capture
- Wire the complete hardware setup: ESP32 on 400-pin breadboard, MG996R powered by 5V/2.4A wall charger via cut micro-USB cable

## Capabilities

### New Capabilities
- `servo-control`: Hardware PWM servo control for MG996R on ESP32, including initialization, angle setting, and safe detach
- `shake-patterns`: Configurable shaking motion patterns with adjustable sweep angle, frequency, duration, and rest intervals
- `serial-interface`: Serial monitor output for status reporting, shake counting, and future reverse engineering data capture

### Modified Capabilities
<!-- None — this is the first firmware in the project -->

## Impact

- New PlatformIO project structure: `platformio.ini`, `src/main.cpp`, `include/`, `lib/`
- Dependencies: Arduino framework, ESP32Servo library
- Hardware: ESP32 GPIO 13 drives servo signal; 5V/2.4A external power for servo; common GND between ESP32 and servo
- Future: serial interface becomes the data pipeline for RE work
