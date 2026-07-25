# SIH 2026 — Village Water Point Uptime Monitoring System
**Student:** DURKESHWARAN D | **Registration:** 411724106012 | **Institution:** PSVPEC (ECE, Year III)

---

## 1. Problem Statement (2-Line Summary)
Handpumps and village public taps stay broken for weeks because repairs depend entirely on manual citizen complaints rather than objective data.
This system automatically detects water flow at village points and provides panchayat officials with a live uptime dashboard to prioritize repairs based on downtime duration.

---

## 2. Step-by-Step Instructions to Run

### Web Dashboard
1. Open the directory `village-water-monitoring/`.
2. Launch `index.html` in any web browser (Google Chrome, Edge, Firefox).
3. The dashboard automatically loads `water_points_data.json` and renders all 40 water point records.
4. **Search**: Type in the top search bar (e.g. `Rampur`, `WP-RAM-01`, `RD-1003`) to filter records instantly on keypress.
5. **Filter**: Select status filters (`Working`, `Stopped`, `Faulty`) or habitation filters. Observe the dynamic record counter badge (`Showing X of Y records`).
6. **Detail View**: Click on any card to open the Detail Drawer. Notice the **derived metric prominently displayed at the top** (e.g., Days Out of Service, Total Litres, or Fault Warning Banners).

### ESP32 Wokwi Simulation (Task 4)
1. Open [Wokwi Simulator](https://wokwi.com/) and create a new **ESP32** project.
2. Replace `sketch.ino` with the code in `esp32_sensor_node.ino`.
3. Replace `diagram.json` with the contents of `diagram.json`.
4. Click **Start Simulation**.
5. Adjust the potentiometer to simulate water flow (0 to 120 L/min).
6. Observe:
   - **Non-blocking timing**: Readings run every 2000ms using `millis()`.
   - **Plausibility filter**: Readings > 100 L/min print `[PLAUSIBILITY REJECTED]` in Serial Monitor and are ignored.
   - **Moving average filter**: Smooths readings using a 5-sample buffer.
   - **Serial JSON**: Outputs JSON formatted identically to the dashboard dataset schema.

---

## 3. Data Dictionary (Schema & Field Definitions)

| Field Name | Type | Description | Valid Range / Example |
| :--- | :--- | :--- | :--- |
| `reading_id` | String | Unique telemetry reading identifier | `RD-1001`, `RD-SIM-1002` |
| `waterpoint_id` | String | Unique water tap / handpump ID | `WP-RAM-01`, `WP-KAV-02` |
| `habitation` | String | Village, hamlet, or locality name | `Rampur North`, `Kaveri Nagar` |
| `flow_ok` | Boolean | True if water flow is active, False if stopped | `true` (Active), `false` (Down) |
| `usage_count` | Integer / Null | Litres of water drawn in sample period | `0` to `1000` (Litres) |
| `recorded_at` | String (ISO 8601) | Timestamp when telemetry was recorded | `2026-07-25T08:00:00Z` |

### Intentional Awkward / Edge Cases included in Dataset:
1. **Missing Value Case (`RD-1011`)**: `usage_count: null`. Classified as `Faulty (Missing Data)`.
2. **Out-of-Plausible-Range Case (`RD-1012`)**: `usage_count: 999999`. Classified as `Faulty (Range Spike)` due to sensor line noise.
3. **Stuck Sensor Case (`RD-1013` & `RD-1014`)**: `flow_ok: false` with static non-zero `usage_count: 42`. Classified as `Faulty (Stuck Sensor)`.
4. **Blank Location Case (`RD-1015`)**: `habitation: ""`. Flagged with missing location warning.

---

## 4. Derived Figures & Mathematical Formulas

The dashboard calculates three key derived figures presented prominently at the top of the detail view:

1. **Downtime Duration (Days Out of Service)**:
   $$\text{Downtime Days} = \lfloor \frac{\text{Current Timestamp} - \text{Recorded Timestamp}}{86,400,000 \text{ ms}} \rfloor$$
   *Logic*: Allows panchayat officials to immediately see which water tap has been broken the longest (e.g. 7 days vs 1 day) to prioritize repair work orders.

2. **Total Water Delivered Volume**:
   $$\text{Total Water Volume (L)} = \sum_{i=1}^{N} \text{usage\_count}_i \quad \text{where } 0 \le \text{usage\_count}_i \le 1000$$
   *Logic*: Filters out null values and invalid out-of-range spikes (>1000 L) to provide clean volume accounting.

3. **Panchayat Overall Uptime Ratio (%)**:
   $$\text{Overall Uptime \%} = \left( \frac{\text{Count of Active Points}}{\text{Total Water Points}} \right) \times 100$$

---

## 5. Demonstration & Test Logs

### ESP32 Firmware Execution Log (Normal, Spike, & Fault Cases)

```json
=================================================
 SIH 2026 — ESP32 Water Point Sensing Node Started
 Non-blocking millis() timer active (Interval: 2000ms)
 Plausibility boundary: 0.0 - 100.0 L/min
 Moving Average Filter Window: 5 Samples
=================================================
{"reading_id":"RD-SIM-1002","waterpoint_id":"WP-RAM-01","habitation":"Rampur North","flow_ok":true,"usage_count":48,"recorded_at":"2026-07-25T11:25:00Z"}
{"reading_id":"RD-SIM-1003","waterpoint_id":"WP-RAM-01","habitation":"Rampur North","flow_ok":true,"usage_count":52,"recorded_at":"2026-07-25T11:25:02Z"}
[PLAUSIBILITY REJECTED] Out-of-range spike detected: 114.50 L/min. Ignored by filter!
{"reading_id":"RD-SIM-1004","waterpoint_id":"WP-RAM-01","habitation":"Rampur North","flow_ok":true,"usage_count":50,"recorded_at":"2026-07-25T11:25:06Z"}
{"reading_id":"RD-SIM-1005","waterpoint_id":"WP-RAM-01","habitation":"Rampur North","flow_ok":false,"usage_count":0,"recorded_at":"2026-07-25T11:25:08Z"}
```

---

## 6. Implementation Status
All tasks requested in the assessment have been fully completed:
- [x] **Task 1: Prepare Sample Data** — 40 records with awkward edge cases created in `water_points_data.json`.
- [x] **Task 2: Build Main Screen** — Responsive grid with instant search, status/habitation filters, and record counter badge.
- [x] **Task 3: Build Detail and Summary View** — Modal view featuring prominent top derived metrics and fault alert banners.
- [x] **Task 4: Build Sensing Node** — ESP32 C++ firmware in `esp32_sensor_node.ino` with non-blocking timing, plausibility check, and moving average filter.
- [x] **Task 5: Integrate and Test** — Comprehensive loading, empty search, and error state handling.
- [x] **Task 6: Document and Demonstrate** — Fully detailed README documentation.
