#include <Arduino.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <ESP32Servo.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include "config.h"
#include "wifi_credentials.h"

// --- State machine ---
enum ShakeState { IDLE, SHAKING, RESTING, TUNING };

ShakeState state = IDLE;
unsigned long stateStartMs = 0;
unsigned long stepCount = 0;
unsigned long cycleCount = 0;
int lastSinSign = 0; // tracks zero-crossings for step counting

// --- Runtime parameters (defaults from config.h) ---
int centerAngle = DEFAULT_CENTER_ANGLE;
int amplitude = DEFAULT_AMPLITUDE;
float frequencyHz = DEFAULT_FREQUENCY_HZ;
int shakeDurationS = DEFAULT_SHAKE_DURATION_S;
int restDurationS = DEFAULT_REST_DURATION_S;

// --- Servo ---
Servo servo;
int currentAngle = 0;

// --- Tuning ---
int tuneTargetAngle = DEFAULT_CENTER_ANGLE;
int tuneCurrentAngle = DEFAULT_CENTER_ANGLE;
unsigned long lastTuneStepMs = 0;

// --- WebSocket ---
WebSocketsServer ws(WS_PORT);
unsigned long lastStatusMs = 0;

// --- Wi-Fi ---
unsigned long lastWifiCheckMs = 0;
constexpr unsigned long WIFI_RETRY_MS = 5000;

// ============================================================
// Servo helpers
// ============================================================

void setServoAngle(int angle) {
    if (angle < 0) angle = 0;
    if (angle > 180) angle = 180;
    currentAngle = angle;
    servo.write(angle);
}

void attachServo() {
    servo.attach(SERVO_PIN, MIN_PULSE_US, MAX_PULSE_US);
}

void detachServo() {
    servo.detach();
}

// ============================================================
// State transitions
// ============================================================

void enterIdle() {
    state = IDLE;
    setServoAngle(centerAngle);
    delay(50);
    detachServo();
    Serial.println("[STATE] IDLE");
}

void enterShaking() {
    state = SHAKING;
    stateStartMs = millis();
    attachServo();
    lastSinSign = 0;
    cycleCount++;
    Serial.print("[SHAKE] Cycle #");
    Serial.print(cycleCount);
    Serial.print(" (steps: ");
    Serial.print(stepCount);
    Serial.print(") started at ");
    Serial.print(millis() / 1000);
    Serial.println("s");
}

void enterResting() {
    state = RESTING;
    stateStartMs = millis();
    setServoAngle(centerAngle);
    delay(50);
    detachServo();
    Serial.print("[REST] Resting. Steps: ");
    Serial.print(stepCount);
    Serial.print(" Cycles: ");
    Serial.println(cycleCount);
}

void enterTuning() {
    state = TUNING;
    attachServo();
    tuneCurrentAngle = currentAngle;
    tuneTargetAngle = currentAngle;
    lastTuneStepMs = millis();
    Serial.println("[STATE] TUNING");
}

// ============================================================
// WebSocket: build & send status JSON
// ============================================================

void broadcastStatus() {
    JsonDocument doc;
    doc["type"] = "status";

    switch (state) {
        case IDLE:    doc["state"] = "idle"; break;
        case SHAKING: doc["state"] = "shaking"; break;
        case RESTING: doc["state"] = "resting"; break;
        case TUNING:  doc["state"] = "tuning"; break;
    }

    doc["stepCount"] = stepCount;
    doc["cycleCount"] = cycleCount;
    doc["angle"] = currentAngle;
    doc["uptimeMs"] = millis();

    JsonObject params = doc["params"].to<JsonObject>();
    params["center"] = centerAngle;
    params["amplitude"] = amplitude;
    params["frequency"] = frequencyHz;
    params["shakeDuration"] = shakeDurationS;
    params["restDuration"] = restDurationS;

    String json;
    serializeJson(doc, json);
    ws.broadcastTXT(json);
}

// ============================================================
// WebSocket: handle incoming messages
// ============================================================

void handleMessage(uint8_t clientNum, const String& payload) {
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, payload);
    if (err) {
        Serial.print("[WS] Bad JSON: ");
        Serial.println(err.c_str());
        return;
    }

    const char* type = doc["type"];
    if (!type) return;

    if (strcmp(type, "command") == 0) {
        const char* action = doc["action"];
        if (!action) return;

        Serial.print("[WS] Command: ");
        Serial.println(action);

        if (strcmp(action, "start") == 0) {
            enterShaking();
        } else if (strcmp(action, "stop") == 0) {
            enterIdle();
        } else if (strcmp(action, "tune") == 0) {
            enterTuning();
        } else if (strcmp(action, "resetCount") == 0) {
            stepCount = 0;
            cycleCount = 0;
            Serial.println("[WS] Counters reset");
        }

    } else if (strcmp(type, "config") == 0) {
        JsonObject params = doc["params"];
        if (params.isNull()) return;

        if (params["center"].is<int>())        centerAngle    = params["center"];
        if (params["amplitude"].is<int>())     amplitude      = params["amplitude"];
        if (params["frequency"].is<float>())   frequencyHz    = params["frequency"];
        if (params["shakeDuration"].is<int>()) shakeDurationS = params["shakeDuration"];
        if (params["restDuration"].is<int>())  restDurationS  = params["restDuration"];

        Serial.print("[WS] Config updated: center=");
        Serial.print(centerAngle);
        Serial.print(" amp=");
        Serial.print(amplitude);
        Serial.print(" freq=");
        Serial.println(frequencyHz);

    } else if (strcmp(type, "tune") == 0) {
        if (state == TUNING && doc["angle"].is<int>()) {
            tuneTargetAngle = doc["angle"];
            if (tuneTargetAngle < 0) tuneTargetAngle = 0;
            if (tuneTargetAngle > 180) tuneTargetAngle = 180;
            Serial.print("[TUNE] Target: ");
            Serial.println(tuneTargetAngle);
        }
    }
}

void onWebSocketEvent(uint8_t clientNum, WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_CONNECTED:
            Serial.print("[WS] Client #");
            Serial.print(clientNum);
            Serial.println(" connected");
            break;
        case WStype_DISCONNECTED:
            Serial.print("[WS] Client #");
            Serial.print(clientNum);
            Serial.println(" disconnected");
            break;
        case WStype_TEXT:
            handleMessage(clientNum, String((char*)payload));
            break;
        default:
            break;
    }
}

// ============================================================
// Wi-Fi
// ============================================================

void connectWifi() {
    Serial.print("[WIFI] Connecting to ");
    Serial.println(WIFI_SSID);

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
        delay(250);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.print("[WIFI] Connected! IP: ");
        Serial.println(WiFi.localIP());

        if (MDNS.begin("digi-shaker")) {
            Serial.println("[MDNS] Registered as digi-shaker.local");
        }
    } else {
        Serial.println("[WIFI] Connection failed, will retry");
    }
}

// ============================================================
// Setup & Loop
// ============================================================

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("=== Digi-Shaker ===");
    Serial.print("Servo pin: GPIO ");
    Serial.println(SERVO_PIN);
    Serial.print("Default center: ");
    Serial.print(DEFAULT_CENTER_ANGLE);
    Serial.print(" amp: ");
    Serial.print(DEFAULT_AMPLITUDE);
    Serial.print(" freq: ");
    Serial.println(DEFAULT_FREQUENCY_HZ);
    Serial.println("===================");

    // Init servo to center then detach (start IDLE)
    attachServo();
    setServoAngle(centerAngle);
    delay(500);
    detachServo();

    connectWifi();

    ws.begin();
    ws.onEvent(onWebSocketEvent);
    Serial.print("[WS] Server started on port ");
    Serial.println(WS_PORT);
}

void loop() {
    unsigned long now = millis();

    // Wi-Fi reconnection
    if (WiFi.status() != WL_CONNECTED && now - lastWifiCheckMs >= WIFI_RETRY_MS) {
        lastWifiCheckMs = now;
        Serial.println("[WIFI] Reconnecting...");
        WiFi.reconnect();
    }

    // WebSocket tick
    ws.loop();

    // Periodic status broadcast
    if (now - lastStatusMs >= STATUS_INTERVAL_MS) {
        lastStatusMs = now;
        broadcastStatus();
    }

    // State machine
    unsigned long elapsed = now - stateStartMs;

    switch (state) {
        case IDLE:
            // Do nothing, wait for commands
            break;

        case SHAKING: {
            if (elapsed >= (unsigned long)shakeDurationS * 1000UL) {
                enterResting();
                break;
            }
            float t = elapsed / 1000.0f;
            float sinVal = sin(2.0f * PI * frequencyHz * t);
            float angle = centerAngle + amplitude * sinVal;
            setServoAngle((int)angle);

            // Count steps: each positive zero-crossing = 1 oscillation = 1 step
            int sinSign = (sinVal >= 0) ? 1 : -1;
            if (lastSinSign < 0 && sinSign >= 0) {
                stepCount++;
            }
            lastSinSign = sinSign;
            break;
        }

        case RESTING:
            if (elapsed >= (unsigned long)restDurationS * 1000UL) {
                enterShaking();
            }
            break;

        case TUNING:
            if (tuneCurrentAngle != tuneTargetAngle && now - lastTuneStepMs >= TUNE_STEP_MS) {
                lastTuneStepMs = now;
                if (tuneCurrentAngle < tuneTargetAngle) tuneCurrentAngle++;
                else tuneCurrentAngle--;
                setServoAngle(tuneCurrentAngle);
            }
            break;
    }
}
