#pragma once

// --- GPIO ---
constexpr int SERVO_PIN = 13;

// --- Servo pulse width (MG996R defaults) ---
constexpr int MIN_PULSE_US = 500;
constexpr int MAX_PULSE_US = 2400;

// --- Shake parameter defaults (overridable at runtime via WebSocket) ---
constexpr int DEFAULT_CENTER_ANGLE = 60;
constexpr int DEFAULT_AMPLITUDE = 60;
constexpr float DEFAULT_FREQUENCY_HZ = 4.0f;
constexpr int DEFAULT_SHAKE_DURATION_S = 30;
constexpr int DEFAULT_REST_DURATION_S = 5;

// --- WebSocket ---
constexpr int WS_PORT = 81;
constexpr unsigned long STATUS_INTERVAL_MS = 500;

// --- Tuning ---
constexpr unsigned long TUNE_STEP_MS = 20;
