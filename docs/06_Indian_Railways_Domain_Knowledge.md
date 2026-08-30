# Indian Railways Domain Knowledge
## How Block Planning Works — Context for RailSync Development
### Problem Statement ID: 26027 | SIH 2025

---

## 1. Indian Railways — Structure & Scale

### 1.1 Overview
Indian Railways (IR) is the world's 4th largest railway network operated by the Government of India under the **Ministry of Railways**. It is a single, vertically integrated entity managing:
- Infrastructure (track, bridges, stations)
- Operations (train movement)
- Traction (electric power for trains)
- Telecommunications (signalling, control)
- Passenger & freight services

### 1.2 Organizational Units

| Unit | Description | Count |
|---|---|---|
| **Railway Board** | Apex body (New Delhi) | 1 |
| **Zones** | Geographical divisions of IR | 18 |
| **Divisions** | Operational sub-units within zones | 68 |
| **Sections** | Track sections between stations | Thousands |
| **Block Sections** | Smallest unit between two signals | ~50,000 |

### 1.3 Eighteen Zones (with Abbreviations)

| Zone | Abbreviation | Headquarters |
|---|---|---|
| Central Railway | CR | Mumbai (CST) |
| Eastern Railway | ER | Kolkata |
| East Central Railway | ECR | Hajipur |
| East Coast Railway | ECoR | Bhubaneswar |
| Northern Railway | NR | New Delhi |
| North Central Railway | NCR | Prayagraj |
| North Eastern Railway | NER | Gorakhpur |
| Northeast Frontier Railway | NFR | Guwahati |
| North Western Railway | NWR | Jaipur |
| Southern Railway | SR | Chennai |
| South Central Railway | SCR | Secunderabad |
| South East Central Railway | SECR | Bilaspur |
| South Eastern Railway | SER | Kolkata (Garden Reach) |
| South Western Railway | SWR | Hubballi |
| Western Railway | WR | Mumbai (Churchgate) |
| West Central Railway | WCR | Jabalpur |
| Metro Railway | MR | Kolkata |
| South Coast Railway | SCoR | Visakhapatnam |

---

## 2. Fixed Infrastructure & Maintenance Departments

### 2.1 The Three Core Maintenance Departments

#### A. Engineering Department (ENG)
Responsible for all **civil/track infrastructure**:

| Asset | Description |
|---|---|
| **Track** | Rails, sleepers (ties), ballast, rail fastenings |
| **Bridges** | Rail-over-road, rail-over-river bridges |
| **Tunnels** | Mountain and urban tunnels |
| **Level Crossings (LC)** | Road-rail intersections |
| **Formation** | Earth embankment, cuttings, drains |
| **Retaining Walls** | Slope protection structures |
| **Station Buildings** | Platform, foot overbridge, waiting rooms |

**Key Maintenance Activities (ENG)**:
- Track tamping (using Tamping Machine / DUOMATIC)
- Rail testing (SPURT car — Speed and Roughness Ultrasonic Testing)
- Weld renewal, fishplate replacement
- Bridge inspection and painting
- Ballast profiling
- TSR (Temporary Speed Restriction) due to defects

#### B. Signal & Telecommunication Department (S&T)
Responsible for **safe train movement signalling** and **railway communication**:

| Asset | Full Form | Description |
|---|---|---|
| **Signal** | — | Colour light / semaphore signals |
| **IBS** | Intermediate Block Signal | Signal between major signals |
| **LC Gate Signal** | Level Crossing Gate Signal | Controls LC gate operation |
| **Interlocking** | — | Ensures safe route setting |
| **UFSBI** | Universal Fail-Safe Block Instrument | Token-less block working |
| **MSDAC** | Multi-Section Digital Axle Counter | Axle counting for train detection |
| **BPAC** | Block Proving Axle Counter | Train detection between blocks |
| **OFC** | Optical Fibre Cable | Communication backbone |
| **DTC** | Digital Telecommunication Controller | Voice communication |
| **EI** | Electronic Interlocking | Microprocessor-based interlocking |
| **SCADA** | Supervisory Control & Data Acquisition | Remote monitoring |
| **CCTV** | Closed-Circuit Television | Station & crossing surveillance |

#### C. Traction Distribution Department (TD / TRD)
Responsible for **electric traction power supply** to trains:

| Asset | Full Form | Description |
|---|---|---|
| **OHE** | Overhead Equipment | Catenary + contact wire supplying 25kV AC |
| **TSS** | Traction Sub-Station | 220kV/25kV transformer station |
| **SP** | Sectioning Post | Divides OHE into independently isolatable sections |
| **SSP** | Sub-Sectioning Post | Further sub-division for flexibility |
| **AT** | Auto Transformer | Reduces rail current in AT feeding system |
| **FP** | Feeding Post | Connects TSS to OHE |
| **BT** | Booster Transformer | Older traction system component |
| **PFT** | Paralleling & Feeding arrangement with Transformer | |
| **ERB** | Emergency Return Bonding | Safety earthing |
| **PTFE** | Power Transformer for Fixed Equipment | Auxiliary power supply |

---

## 3. What is a "Block"?

### 3.1 Definition
A **Block** (or **Traffic Block** / **Maintenance Block**) is an authorized period during which:
- Train movement in a section is suspended or restricted, AND/OR
- Power supply (OHE) is switched off (Power Block), AND/OR
- Signal equipment is taken out of service

This window is used by maintenance departments to carry out repair/inspection activities safely without endangering staff or trains.

### 3.2 Block Types in Detail

| Block Type | Who Requests | Power Status | Train Movement | Example Activity |
|---|---|---|---|---|
| **Traffic Block** | Engineering (via COA) | Normal | STOPPED completely | Rail renewal, bridge work |
| **Power Block** | TD Department | OHE OFF | Can continue (if non-electric) | OHE maintenance, wire replacement |
| **Signal Block** | S&T Department | Normal | Restricted (caution speed) | Signal lamp change, relay testing |
| **Combined Block** | Multi-department | OHE OFF | STOPPED | Major relay/OHE/track work together |
| **Emergency Block** | Any department | As needed | Stopped or restricted | Accident, urgent safety repair |

### 3.3 Block Request Process (Current BDMS System)

```
Step 1: Department officer identifies maintenance need
Step 2: Calculates required duration and section
Step 3: Files block request in BDMS (Block/Disconnection Management System)
Step 4: Control Office reviews against train graph
Step 5: Control Office approves/modifies/rejects
Step 6: Approved block communicated to all departments via Control Office
Step 7: Block executed in field
Step 8: Block cancelled (section restored to normal working)
```

**Problem**: Steps 1–3 are done independently by each department without coordination → overlaps, inefficiency.

---

## 4. Train Operations & Block Windows

### 4.1 Train Types and Block Impact

| Train Type | Priority | Block Impact |
|---|---|---|
| **Rajdhani Express** | Very High (P1) | Cannot be blocked — must pass unhindered |
| **Shatabdi Express** | Very High (P1) | Same as Rajdhani |
| **Duronto Express** | High (P2) | Minimal interference allowed |
| **Mail/Express** | High (P2) | Avoid blocking their window |
| **Passenger Trains** | Medium (P3) | Can be held at station for short block |
| **Goods Trains** | Low (P4) | Can be terminated/looped for blocks |
| **Light Engine (LE)** | Low | Can be held |
| **OHE/Engineering Specials** | Special | Planned around all others |

### 4.2 Train Graph (Time-Distance Diagram)
The **Train Graph** (TG) from COA is the primary input for identifying maintenance windows. It shows:
- All trains plotted on a time vs. station (km post) axis
- Gaps between trains = potential maintenance windows
- Crossing stations (loops) for single-line sections

### 4.3 Section Types

| Type | Description | Block Difficulty |
|---|---|---|
| **Single Line** | One track, bidirectional traffic | Harder to find windows |
| **Double Line** | Two tracks (Up + Down), one-direction each | Block one line, other runs |
| **Multiple Line** | 3+ tracks (suburban) | Block one line at a time |

---

## 5. Maintenance Planning Cycles

### 5.1 Annual Maintenance Plan (AMP)
- Created at the start of each financial year (April)
- Lists all major maintenance activities, their frequency, and required block durations
- Department: ENG, S&T, TD each create independently
- **RailSync should integrate all three AMPs**

### 5.2 Monthly Block Plan
- Derived from AMP
- Accounts for train timetable, festivals, special occasions
- Must be submitted to Control Office by 25th of previous month
- **RailSync generates this automatically**

### 5.3 Weekly Block Plan
- Detailed plan for the coming 7 days
- Incorporates urgent defects that arose during the month
- Final approval by Divisional Block Planning Officer
- **RailSync primary output**

### 5.4 Daily Block Plan
- Same-day emergency blocks only
- Requires DRM/senior officer approval
- **RailSync supports emergency block requests**

---

## 6. Key Maintenance Parameters

### 6.1 Track Maintenance (ENG)

| Parameter | Full Form | Description |
|---|---|---|
| **TRC** | Track Recording Car | Measures track geometry (unevenness, gauge, cross-level) |
| **SPURT** | Speed and Roughness Ultrasonic Testing car | Ultrasonic rail flaw detection at speed |
| **UT** | Ultrasonic Testing | Manual flaw detection using handheld devices |
| **TSR** | Temporary Speed Restriction | Speed limit imposed due to defect |
| **PSR** | Permanent Speed Restriction | Permanent speed limit (curves, weak bridges) |
| **BTR** | Bad Track Report | Report of track in poor condition |
| **OMS** | Output per Machine Shift | Tamping machine productivity |
| **MTR** | Modified Track Renewal | Track renewal using machines |
| **CSR** | Complete Sleeper Renewal | Replace all sleepers in a section |
| **CR** | Complete Rail renewal | Replace all rails in a section |

### 6.2 Signal Maintenance (S&T)

| Parameter | Full Form | Description |
|---|---|---|
| **RRI** | Route Relay Interlocking | Relay-based interlocking system |
| **PI** | Panel Interlocking | Control panel for route setting |
| **EI** | Electronic Interlocking | Computer-based interlocking |
| **SER** | Signal Engineering Report | Defect and maintenance record |
| **AFTC** | Audio Frequency Track Circuit | Train detection using AC audio frequency |
| **PSFTR** | Point and Signal Failure Truck Report | Field failure log |
| **SMMS** | Signalling Maintenance Management System | S&T defect tracking system |

### 6.3 Traction Maintenance (TD)

| Parameter | Full Form | Description |
|---|---|---|
| **BWO** | Block and Withdrawal Order | Formal isolation of OHE for work |
| **PEC** | Permit to Work (Electrical Certificate) | Safety certificate for OHE work |
| **TPN** | Traction Power Notification | Advance notice of power disconnection |
| **TDMS** | Traction Distribution Management System | TD defect and maintenance system |
| **OHMT** | Overhead Maintenance Tower | Vehicle for OHE maintenance |
| **BAMTC** | Ballast Attached Material Tower Car | Vehicle for OHE inspection/maintenance |

---

## 7. Asset Availability Index (AAI)

### 7.1 Definition
**AAI** = Asset Availability Index = Percentage of time the railway infrastructure is available for train operations.

```
AAI = (Total Available Time - Maintenance Downtime) / Total Available Time × 100
```

### 7.2 Why AAI Matters
- Higher AAI → More trains can run → More revenue
- Lower AAI → Delays → Passenger dissatisfaction → Revenue loss
- Combined blocks → One downtime for multiple maintenance activities → Higher AAI

### 7.3 RailSync AAI Target
- Current estimated AAI on IR: ~82–85%
- RailSync target: ≥ 90% through combined blocks and optimized scheduling

---

## 8. Current System Limitations (Why RailSync is Needed)

### 8.1 Problem with Current BDMS

| Problem | Impact |
|---|---|
| Departments request blocks independently | Two departments block same section at different times = double downtime |
| No AI prioritization | Critical safety defects may wait while low-priority work gets blocks |
| Manual scheduling | 3–5 days to prepare weekly plan; prone to errors |
| No train graph integration | Blocks are sometimes planned in busy train windows |
| No cross-department visibility | ENG doesn't know if TD is also planning work in same section |
| Reactive, not proactive | Many blocks are emergency-driven rather than planned |

### 8.2 RailSync Solution Mapping

| Problem | RailSync Solution |
|---|---|
| Independent block requests | Unified AI engine sees all three departments' needs |
| No prioritization | XGBoost classifier scores each defect by criticality |
| Manual scheduling | OR-Tools generates optimal plan in < 60 seconds |
| No train graph integration | COA data (train timetable) is a core input to AI |
| No cross-department visibility | Unified dashboard shows all departments in one Gantt |
| Reactive planning | Prophet forecasting anticipates needs 30 days ahead |

---

*Document Version: 1.0 | Date: August 2025 | SIH 2025 — MIT-WPU Internal Round*
