# SIH 2026 — Village Water Point Uptime Monitoring System

**Student:** DURKESHWARAN D | **Registration:** 411724106012 | **Institution:** PSVPEC (ECE, Year III)  
**GitHub Profile:** [@durkeshwaran-05](https://github.com/durkeshwaran-05)  
**Repository:** [https://github.com/durkeshwaran-05/village-water-monitoring](https://github.com/durkeshwaran-05/village-water-monitoring)

---

## 1. Problem Statement & Project Goal

Rural handpumps and public taps in Tamil Nadu villages often stay out of service for weeks because repairs rely on manual citizen complaints rather than objective, real-time data. 

This telemetry dashboard system automatically monitors water flow at village points across Tamil Nadu districts and provides Panchayat officials with a live uptime dashboard. It prioritizes repairs based on downtime duration, volume drawn, and telemetry hardware sensor faults.

---

## 2. Key Features

- **Tamil Nadu Telemetry Dataset**: 40 telemetry data records across 16 major districts of Tamil Nadu (Madurai, Tiruchirappalli, Dindigul, Tirunelveli, Coimbatore, Thanjavur, Salem, Erode, etc.).
- **Real-Time Instant Search & Filter**: Search instantaneously by Waterpoint ID, Habitation, District, State (`Tamil Nadu`), or Reading ID.
- **Edge Case & Fault Classification**: Automatically detects and flags missing sensor telemetry, out-of-range spikes (>1000 L), stuck hardware sensors, and unassigned habitations.
- **Prominent Derived Figures**: Displays downtime duration (Days Out of Service), total water delivered, and overall Panchayat uptime percentage.
- **Interactive Contact Us Modal**: Integrated popup form for citizens and field technicians to report broken water points with input fields (`Name :`, `Email :`, `Contact :`, `tell issue :`).
- **ESP32 Firmware Node Simulation**: Complete C++ firmware (`esp32_sensor_node.ino`) for ESP32 microcontrollers featuring non-blocking `millis()` sampling, a 5-sample moving average filter, and plausibility boundary checks (<100 L/min).

---

## 3. Project Structure

```
village-water-monitoring/
│
├── index.html               # Main Web Dashboard UI & Modals
├── app.js                   # Dashboard Logic, Filtering, Metrics & Modal Handlers
├── styles.css               # Premium Dark Glassmorphism Styling System
├── water_points_data.json   # 40 Telemetry Data Records (Tamil Nadu Locations)
├── esp32_sensor_node.ino    # ESP32 Sensing Node Firmware (C++ for Wokwi Simulator)
├── diagram.json             # Wokwi Simulator Wiring Diagram Definition
└── README.md                # System Documentation & Run Instructions
```

---

## 4. Step-by-Step Instructions to Run

### Web Dashboard
1. Open the project root directory in any web browser or local web server (`http://localhost` or double-click `index.html`).
2. The dashboard automatically fetches `water_points_data.json` and renders all 40 Tamil Nadu water point records.
3. **Search**: Type in the search bar (e.g., `Madurai`, `Tiruchirappalli`, `WP-MDU-01`, `RD-1003`) to filter records instantly on keypress.
4. **Filter**: Select status filters (`Working`, `Stopped`, `Faulty`) or habitation dropdowns. Observe the live record counter badge (`Showing X of 40 records`).
5. **Detail Modal**: Click any card to open the detail view featuring prominent top derived metrics (e.g. Days Out of Service, Total Litres, or Hardware Fault Alerts).
6. **Contact Us**: Click the **`Contact Us`** button at the top-right header to report broken taps directly to Panchayat maintenance officers.

### ESP32 Wokwi Simulator Execution
1. Open [Wokwi Simulator](https://wokwi.com/) and select an **ESP32** project.
2. Replace `sketch.ino` with the code in [`esp32_sensor_node.ino`](file:///c:/Users/durke/OneDrive/Documents/projects/village-water-monitoring/esp32_sensor_node.ino).
3. Replace `diagram.json` with the code in [`diagram.json`](file:///c:/Users/durke/OneDrive/Documents/projects/village-water-monitoring/diagram.json).
4. Click **Start Simulation**.
5. Adjust the simulated potentiometer flow sensor (0 to 120 L/min).
6. Observe:
   - **Non-blocking timing**: Sample cycle executes every 2000ms using `millis()`.
   - **Plausibility filter**: Flow > 100 L/min prints `[PLAUSIBILITY REJECTED]` and is safely filtered out.
   - **Moving average filter**: Smooths telemetry using a 5-sample sliding window buffer.
   - **Serial JSON**: Transmits JSON telemetry matching the dataset schema.

---

## 5. Telemetry Data Schema (Data Dictionary)

| Field Name | Type | Description | Valid Range / Example |
| :--- | :--- | :--- | :--- |
| `reading_id` | String | Unique telemetry reading identifier | `RD-1001`, `RD-SIM-1002` |
| `waterpoint_id` | String | Unique water tap / handpump ID | `WP-MDU-01`, `WP-TRY-01` |
| `habitation` | String | Village or hamlet name in Tamil Nadu | `Melur Rural`, `Srirangam` |
| `district` | String | District of Tamil Nadu | `Madurai`, `Tiruchirappalli` |
| `state` | String | State name | `Tamil Nadu` |
| `flow_ok` | Boolean | `true` if flow is active, `false` if stopped | `true` (Active), `false` (Down) |
| `usage_count` | Integer / Null | Litres of water drawn in sample window | `0` to `1000` (Litres) |
| `recorded_at` | String (ISO 8601) | Telemetry timestamp | `2026-07-25T08:00:00Z` |

### Edge Cases Built into Dataset:
1. **Missing Data Case (`RD-1011`)**: `usage_count: null`. Classified as `Faulty (Missing Data)`.
2. **Out-of-Range Spike Case (`RD-1012`)**: `usage_count: 999999`. Classified as `Faulty (Range Spike)`.
3. **Stuck Sensor Case (`RD-1013` & `RD-1014`)**: `flow_ok: false` with non-zero `usage_count: 42`. Classified as `Faulty (Stuck Sensor)`.
4. **Unassigned Habitation Case (`RD-1015`)**: `habitation: ""`. Flagged with missing location warning.

---

## 6. Derived Figures & Formulas

1. **Downtime Duration (Days Out of Service)**:
   $$\text{Downtime Days} = \left\lfloor \frac{\text{Current Timestamp} - \text{Recorded Timestamp}}{86,400,000 \text{ ms}} \right\rfloor$$

2. **Total Water Delivered Volume**:
   $$\text{Total Water Volume (L)} = \sum_{i=1}^{N} \text{usage\_count}_i \quad \text{where } 0 \le \text{usage\_count}_i \le 1000$$

3. **Panchayat Overall Uptime Ratio (%)**:
   $$\text{Overall Uptime \%} = \left( \frac{\text{Count of Active Points}}{\text{Total Water Points}} \right) \times 100$$

---

## 7. Author Information & Contact

- **Student Name:** DURKESHWARAN D
- **Register Number:** 411724106012
- **Department:** Electronics & Communication Engineering (Year III)
- **Institution:** PSVPEC
- **GitHub Username:** [durkeshwaran-05](https://github.com/durkeshwaran-05)
- **GitHub Profile:** [https://github.com/durkeshwaran-05](https://github.com/durkeshwaran-05)
