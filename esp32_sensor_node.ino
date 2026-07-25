/* ============================================================
   SIH 2026: Village Water Point Uptime Monitoring System
   Task 4: Sensing Node Firmware (ESP32 C++ Code for Wokwi)
   ============================================================
   Features:
   1. Non-blocking timing using millis() (Zero blocking delay())
   2. Plausibility Check: Rejects impossible flow values (>100 L/min)
   3. Moving Average Filter: 5-sample buffer smoothing
   4. Structured Serial JSON Output matching dataset schema
   ============================================================ */

#include <Arduino.h>

// Pin Definitions
const int FLOW_SENSOR_PIN = 34; // Analog input for simulated water flow sensor (Potentiometer)
const int STATUS_LED_GREEN = 2; // LED for Flow OK
const int STATUS_LED_RED   = 4; // LED for Flow Stopped / Down

// Non-blocking Timing Schedule
unsigned long lastSampleTime = 0;
const unsigned long SAMPLE_INTERVAL_MS = 2000; // Sample every 2 seconds without blocking

// Moving Average Smoothing Buffer
const int FILTER_WINDOW_SIZE = 5;
float flowReadingsBuffer[FILTER_WINDOW_SIZE];
int bufferIndex = 0;
int validSampleCount = 0;

// Plausibility Check Thresholds
const float MIN_PLAUSIBLE_FLOW = 0.0;    // Min valid L/min
const float MAX_PLAUSIBLE_FLOW = 100.0;  // Max valid L/min (rejects spikes > 100 L/min)

// Telemetry Counters
unsigned int readingSequenceId = 1001;

// Function Declarations
float readRawFlowSensor();
bool applyPlausibilityCheck(float rawFlow);
float computeMovingAverage(float validFlow);
void transmitSerialTelemetryJSON(float smoothedFlow, bool flowOk);

void setup() {
  Serial.begin(115200);
  delay(500); // Initial serial port setup delay
  
  pinMode(STATUS_LED_GREEN, OUTPUT);
  pinMode(STATUS_LED_RED, OUTPUT);

  // Initialize smoothing buffer with zeros
  for (int i = 0; i < FILTER_WINDOW_SIZE; i++) {
    flowReadingsBuffer[i] = 0.0;
  }

  Serial.println("=================================================");
  Serial.println(" SIH 2026 — ESP32 Water Point Sensing Node Started");
  Serial.println(" Non-blocking millis() timer active (Interval: 2000ms)");
  Serial.println(" Plausibility boundary: 0.0 - 100.0 L/min");
  Serial.println(" Moving Average Filter Window: 5 Samples");
  Serial.println("=================================================");
}

void loop() {
  unsigned long currentMillis = millis();

  // Task 4 Core: Non-blocking schedule check using millis()
  if (currentMillis - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    lastSampleTime = currentMillis;

    // 1. Read Raw Flow Sensor Simulation
    float rawFlowRate = readRawFlowSensor();

    // 2. Task 4 Core: Apply Plausibility Check (Reject impossible values)
    if (!applyPlausibilityCheck(rawFlowRate)) {
      Serial.print("[PLAUSIBILITY REJECTED] Out-of-range spike detected: ");
      Serial.print(rawFlowRate);
      Serial.println(" L/min. Ignored by filter!");
      return; // Reject reading without updating filter or sending false alarm
    }

    // 3. Task 4 Core: Apply Moving Average Smoothing Filter
    float smoothedFlowRate = computeMovingAverage(rawFlowRate);

    // Determine Flow Status (Flow active if > 2.0 L/min)
    bool isFlowOk = (smoothedFlowRate > 2.0);

    // Update Status LEDs
    digitalWrite(STATUS_LED_GREEN, isFlowOk ? HIGH : LOW);
    digitalWrite(STATUS_LED_RED, isFlowOk ? LOW : HIGH);

    // 4. Output Serial JSON matching exact dataset schema
    transmitSerialTelemetryJSON(smoothedFlowRate, isFlowOk);
  }

  // Other non-blocking background tasks (e.g. WiFi / BLE) can run freely here
}

// -------------------------------------------------------------
// Read Sensor (Maps 0-4095 ADC to 0.0 - 120.0 L/min flow rate)
// -------------------------------------------------------------
float readRawFlowSensor() {
  int rawAdc = analogRead(FLOW_SENSOR_PIN);
  float flowRate = (rawAdc / 4095.0) * 120.0; // Simulated flow rate
  return flowRate;
}

// -------------------------------------------------------------
// Plausibility Filter Check
// -------------------------------------------------------------
bool applyPlausibilityCheck(float rawFlow) {
  if (rawFlow < MIN_PLAUSIBLE_FLOW || rawFlow > MAX_PLAUSIBLE_FLOW) {
    return false; // Rejected
  }
  return true; // Passed
}

// -------------------------------------------------------------
// Moving Average Filter Calculation
// -------------------------------------------------------------
float computeMovingAverage(float validFlow) {
  flowReadingsBuffer[bufferIndex] = validFlow;
  bufferIndex = (bufferIndex + 1) % FILTER_WINDOW_SIZE;

  if (validSampleCount < FILTER_WINDOW_SIZE) {
    validSampleCount++;
  }

  float sum = 0.0;
  for (int i = 0; i < validSampleCount; i++) {
    sum += flowReadingsBuffer[i];
  }
  return sum / validSampleCount;
}

// -------------------------------------------------------------
// Serial Output JSON matching Task 1 Dataset Schema
// -------------------------------------------------------------
void transmitSerialTelemetryJSON(float smoothedFlow, bool flowOk) {
  readingSequenceId++;
  
  Serial.print("{\"reading_id\":\"RD-SIM-");
  Serial.print(readingSequenceId);
  Serial.print("\",\"waterpoint_id\":\"WP-MDU-01\",\"habitation\":\"Melur Rural\",\"district\":\"Madurai\",\"state\":\"Tamil Nadu\",\"flow_ok\":");
  Serial.print(flowOk ? "true" : "false");
  Serial.print(",\"usage_count\":");
  Serial.print((int)smoothedFlow);
  Serial.println(",\"recorded_at\":\"2026-07-25T11:25:00Z\"}");
}
