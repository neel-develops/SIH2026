# Project Requirements Document (PRD)
## AI-Powered Automatic Block Planning System
### Problem Statement ID: 26027 | Smart India Hackathon (SIH) 2025
### Organization: Ministry of Railways, Government of India

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Background & Indian Railways Context](#2-background--indian-railways-context)
3. [Problem Analysis](#3-problem-analysis)
4. [Stakeholders](#4-stakeholders)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Data Requirements](#7-data-requirements)
8. [Integration Requirements](#8-integration-requirements)
9. [UI/UX Requirements](#9-uiux-requirements)
10. [Compliance & Safety Requirements](#10-compliance--safety-requirements)
11. [Success Metrics & KPIs](#11-success-metrics--kpis)
12. [Assumptions & Constraints](#12-assumptions--constraints)

---

## 1. Executive Summary

The **AI-Powered Automatic Block Planning System** (AABPS) is a unified, data-driven solution designed for Indian Railways to automate and optimize maintenance block scheduling across three critical departments:

- **Engineering (ENG)** — Track & Civil Infrastructure
- **Traction Distribution (TD)** — Overhead Equipment & Power Supply
- **Signal & Telecommunication (S&T)** — Signalling and Communication Systems

The system integrates siloed maintenance management systems into one intelligent scheduling engine that maximizes **asset availability**, reduces **train delays due to maintenance**, and supports **safe, uninterrupted train operations** on Indian Railways' 68,000+ route kilometers of network.

---

## 2. Background & Indian Railways Context

### 2.1 Indian Railways at a Glance

| Parameter | Value |
|---|---|
| Total Route Length | ~68,000 km |
| Track Length | ~1,35,000 km |
| Zones | 18 Railway Zones |
| Divisions | 68 Divisions |
| Daily Train Runs | ~13,500 trains |
| Daily Passenger Traffic | ~24 million passengers |
| Annual Freight | ~1.5 billion tonnes |

### 2.2 Organizational Hierarchy (Relevant to Block Planning)

```
Railway Board (HQ, New Delhi)
    └── Zonal Railways (e.g., Central Railway, Northern Railway...)
            └── Divisions (e.g., Mumbai Division, Delhi Division...)
                    └── Sections (e.g., CSTM–Pune Section)
                            └── Block Sections (e.g., Stations A to B)
```

### 2.3 Key Departments Involved

| Department | Full Form | Responsibility |
|---|---|---|
| ENG | Engineering Department | Track, Bridges, Tunnels, Level Crossings |
| TD / OHE | Traction Distribution / Overhead Equipment | Electric traction infrastructure, substations |
| S&T | Signal & Telecommunication | Signalling equipment, interlocking, OFC, communication |
| TRD | Traction Rolling Stock Division | Support for power supply planning |
| COM | Commercial Department | Passenger & Freight scheduling |
| OPS | Operations Department | Train movement, Control Office |

### 2.4 Existing Systems (Legacy) — Full Forms

| Acronym | Full Form | Department | Purpose |
|---|---|---|---|
| **BDMS** | Block/Disconnection Management System | Multi-dept | Block requests & approvals |
| **TMS** | Track Management System | Engineering | Track defects, maintenance records |
| **SMMS** | Signalling Maintenance & Management System | S&T | Signal defect tracking, maintenance schedules |
| **TDMS** | Traction Distribution Management System | TD | OHE/PSI maintenance, defects |
| **COA** | Control Office Application | Operations | Train graph, real-time movement, block corridors |
| **IRFC** | Indian Railways Finance Corporation | Finance | Funding & financial tracking |
| **NTES** | National Train Enquiry System | Operations | Train running information |
| **FOIS** | Freight Operations Information System | Freight Ops | Goods train scheduling & planning |
| **UTS** | Unreserved Ticketing System | Commercial | Unreserved passenger tickets |
| **PRS** | Passenger Reservation System | Commercial | Reserved train ticketing |
| **CMS** | Crew Management System | Operations | Loco pilot & guard scheduling |
| **RCIL** | RailTel Corporation of India Limited | Telecom | Network & OFC infrastructure |
| **RailNet** | Indian Railways Intranet | IT | Internal communication network |
| **COIS** | Coaching Operations Information System | Operations | Coaching maintenance |
| **OFC** | Optical Fibre Cable | S&T | Backbone telecom network |
| **PSI** | Power Supply Installation | TD | 25 kV AC traction power |
| **SP** | Sectioning Post | TD | Power distribution point |
| **SSP** | Sub-Sectioning Post | TD | Sub-sectioning of OHE |
| **TSS** | Traction Sub-Station | TD | 25 kV AC supply point |
| **OHE** | Overhead Equipment | TD | Catenary & contact wire |
| **IBS** | Intermediate Block Signal | S&T | Block signalling |
| **ASM** | Assistant Station Master | Operations | Station operations |
| **SM** | Station Master | Operations | Station-level control |
| **TPC** | Traffic Planning Cell | Operations | Long-term planning |
| **ADEN** | Assistant Divisional Engineer | Engineering | Track maintenance supervisor |
| **AEN** | Assistant Engineer | Engineering | Track section engineer |
| **JE** | Junior Engineer | Multi-dept | Field maintenance officer |
| **SSE** | Senior Section Engineer | Multi-dept | Section maintenance head |
| **DEN** | Divisional Engineer | Engineering | Divisional engineering head |
| **DSTE** | Divisional Signal & Telecom Engineer | S&T | S&T divisional head |
| **DTDE** | Divisional Traction Distribution Engineer | TD | TD divisional head |
| **DCM** | Divisional Commercial Manager | Commercial | Commercial operations |
| **DRM** | Divisional Railway Manager | Management | Divisional head |

### 2.5 Block Types in Indian Railways

| Block Type | Full Form / Description | Typical Duration |
|---|---|---|
| **Traffic Block** | Complete cessation of train movement | 1–4 hours |
| **Engineering Block** | Block for ENG maintenance | 1–6 hours |
| **Power Block** | OHE power disconnected (TD maintenance) | 1–4 hours |
| **Signal Block** | S&T equipment maintenance | 30 min–3 hours |
| **Combined Block** | Multi-department simultaneous block | 2–8 hours |
| **Caution Order** | Speed restriction without full block | Ongoing |
| **TSR** | Temporary Speed Restriction | Ongoing |
| **PWB** | Permanent Way Block (Engineering) | Scheduled |

---

## 3. Problem Analysis

### 3.1 Current Pain Points

1. **Siloed Systems**: TMS, SMMS, TDMS operate independently with no data sharing
2. **Manual Coordination**: Block requests filed manually on BDMS without cross-department visibility
3. **Underutilization of Blocks**: Departments request blocks that overlap, causing wasted maintenance windows
4. **Suboptimal Scheduling**: No AI-driven prioritization of critical vs. routine maintenance
5. **No Corridor-Level View**: COA block availability is not fed back into maintenance planning
6. **Reactive Planning**: Maintenance often planned reactively after failures rather than proactively
7. **Poor Multi-Horizon Planning**: No weekly/monthly integrated block planning across departments

### 3.2 Impact of Current Gaps

- Increased train delays (non-punctuality)
- Safety risks from deferred critical maintenance
- Asset degradation due to suboptimal scheduling
- Higher maintenance costs (emergency repairs vs. planned)
- Low asset availability index (AAI)

---

## 4. Stakeholders

### 4.1 Primary Users

| Role | Department | Usage |
|---|---|---|
| Divisional Block Planning Officer | Operations/Control | View, approve, override block plans |
| SSE (Engineering) | ENG | Submit defects, view block schedule |
| SSE (S&T) | S&T | Submit signal defects, view plan |
| SSE (TD) | TD | Submit OHE defects, view plan |
| ADEN / AEN | ENG | View assigned maintenance windows |
| Control Room Supervisor | OPS/COA | Monitor real-time block status |
| DRM Dashboard User | Management | KPI monitoring, approval workflows |

### 4.2 Secondary Users

| Role | Usage |
|---|---|
| Railway Board / Zonal HQ | Analytics & policy decisions |
| IT Administrators | System configuration, RBAC |
| Data Analysts | Reporting & forecasting |

---

## 5. Functional Requirements

### 5.1 Module 1: Data Integration Hub

| Req ID | Requirement |
|---|---|
| FR-1.1 | Ingest defect data from TMS (track defects, overdue maintenance) via secure API/ETL |
| FR-1.2 | Ingest signal defect data from SMMS via API/CSV batch |
| FR-1.3 | Ingest OHE/PSI defect data from TDMS via API/CSV batch |
| FR-1.4 | Pull corridor block availability windows from COA |
| FR-1.5 | Integrate goods train forecast from FOIS for freight window identification |
| FR-1.6 | Integrate passenger train timetable from PRS/NTES for optimal block windows |
| FR-1.7 | Support real-time and batch ingestion modes |
| FR-1.8 | Data validation, deduplication, and normalization on ingest |

### 5.2 Module 2: AI/ML Scheduling Engine

| Req ID | Requirement |
|---|---|
| FR-2.1 | Classify maintenance tasks by criticality (Critical / High / Medium / Low) |
| FR-2.2 | Auto-prioritize defects based on safety risk, failure probability, and overdue status |
| FR-2.3 | Apply constraint satisfaction to fit tasks within available block windows |
| FR-2.4 | Optimize for minimal train delay impact using train timetable data |
| FR-2.5 | Cluster geographically adjacent tasks to combine department blocks |
| FR-2.6 | Generate combined (multi-department) block plans where feasible |
| FR-2.7 | Produce weekly block plans (7-day horizon) |
| FR-2.8 | Produce monthly block plans (30-day horizon) |
| FR-2.9 | Re-optimize dynamically when new urgent defects arrive |
| FR-2.10 | Predict maintenance windows using historical block data (ML forecasting) |

### 5.3 Module 3: Block Plan Dashboard

| Req ID | Requirement |
|---|---|
| FR-3.1 | Visual Gantt chart of block plans per section/division |
| FR-3.2 | Map view showing block locations on railway network |
| FR-3.3 | Filter by department, block type, date range, section |
| FR-3.4 | Department-wise workload heatmap |
| FR-3.5 | Conflict detection and visual alerts for overlapping blocks |
| FR-3.6 | One-click approval/rejection of AI-generated block plans |
| FR-3.7 | Manual override capability with reason logging |

### 5.4 Module 4: Notification & Alerts

| Req ID | Requirement |
|---|---|
| FR-4.1 | Push notifications to mobile app for block approvals/changes |
| FR-4.2 | SMS/Email alerts for critical defect escalations |
| FR-4.3 | In-app alerts for upcoming blocks (T-24h, T-6h, T-1h) |
| FR-4.4 | Alert for overdue maintenance tasks not yet scheduled |

### 5.5 Module 5: Reporting & Analytics

| Req ID | Requirement |
|---|---|
| FR-5.1 | Asset Availability Index (AAI) dashboard per section/division |
| FR-5.2 | Block utilization efficiency reports |
| FR-5.3 | Maintenance compliance reports (planned vs. completed) |
| FR-5.4 | Department-wise delay contribution analysis |
| FR-5.5 | Export reports to PDF and Excel |
| FR-5.6 | Historical trend analysis of defect patterns |

### 5.6 Module 6: Mobile PWA

| Req ID | Requirement |
|---|---|
| FR-6.1 | Progressive Web App (PWA) for Android and iOS |
| FR-6.2 | Offline capability for viewing scheduled blocks without connectivity |
| FR-6.3 | Field staff can submit defect updates from mobile |
| FR-6.4 | Works on 3G/4G/5G networks with adaptive data loading |
| FR-6.5 | QR code scanning for asset identification in field |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| NFR ID | Requirement |
|---|---|
| NFR-1.1 | Dashboard load time < 3 seconds on 4G |
| NFR-1.2 | AI scheduling engine to generate weekly block plan in < 60 seconds |
| NFR-1.3 | API response time < 500ms for 95th percentile |
| NFR-1.4 | Support 500+ concurrent users across a division |
| NFR-1.5 | Mobile PWA initial load < 5 seconds on 3G (with service worker caching) |

### 6.2 Reliability & Availability

| NFR ID | Requirement |
|---|---|
| NFR-2.1 | System uptime: 99.5% (excluding planned maintenance) |
| NFR-2.2 | Data backup every 6 hours |
| NFR-2.3 | Disaster recovery RTO (Recovery Time Objective): < 4 hours |
| NFR-2.4 | Offline mode for mobile: last 7-day block plan cached locally |

### 6.3 Security

| NFR ID | Requirement |
|---|---|
| NFR-3.1 | Role-Based Access Control (RBAC) with least privilege |
| NFR-3.2 | All data encrypted in transit (TLS 1.3) and at rest (AES-256) |
| NFR-3.3 | JWT-based authentication with refresh tokens |
| NFR-3.4 | Multi-Factor Authentication (MFA) for admin roles |
| NFR-3.5 | Compliance with Indian Railways IT Security Policy |
| NFR-3.6 | Audit logs for all actions (create/update/approve/reject) |

### 6.4 Scalability

| NFR ID | Requirement |
|---|---|
| NFR-4.1 | Horizontally scalable microservices architecture |
| NFR-4.2 | Designed to scale from single division to all 68 divisions |
| NFR-4.3 | Database partitioning by zone/division for performance |

### 6.5 Network Compatibility

| Network | Optimization Strategy |
|---|---|
| **3G** (384 kbps–2 Mbps) | Skeleton UI, lazy loading, compressed assets, offline cache |
| **4G** (10–50 Mbps) | Standard full features, background sync |
| **5G** (100 Mbps+) | Real-time map rendering, live video briefings, rich analytics |

---

## 7. Data Requirements

### 7.1 Input Data Sources

| Source | Data Type | Format | Frequency |
|---|---|---|---|
| TMS | Track defects, overdue tasks, TSR list | JSON/CSV | Every 4 hours |
| SMMS | Signal defects, inspection records | JSON/CSV | Every 4 hours |
| TDMS | OHE defects, PSI inspection data | JSON/CSV | Every 4 hours |
| COA | Block corridor availability windows | REST API | Real-time |
| FOIS | Goods train forecast, path availability | REST API | Daily |
| NTES/PRS | Passenger train timetable | REST API | Daily |
| BDMS | Existing block requests | REST API | Real-time |
| Indian Rail API | Station, train, route data | REST API | On demand |

### 7.2 Output Data

| Output | Consumer | Format |
|---|---|---|
| Weekly Block Plan | Control Office, SSEs | PDF, JSON, Calendar |
| Monthly Block Plan | DRM, Zonal HQ | PDF, Excel |
| Real-time Block Status | COA, Field Staff | REST API, Push |
| KPI Reports | Management | PDF, Dashboard |

### 7.3 Available Public Datasets

| Dataset | Source | Use |
|---|---|---|
| Train timetable data | indianrailapi.com | Block window optimization |
| Station master data | IRCTC API (RapidAPI) | Location mapping |
| Train running status | IRCTC Scraper (Apify) | Real-time corridor availability |
| Railway zone/division data | data.gov.in | Reference master data |
| Track geometry data (sample) | Open Government Data | ML model training |

---

## 8. Integration Requirements

### 8.1 External API Integration

| API | Purpose | Auth Method |
|---|---|---|
| `indianrailapi.com` | Train/station data | API Key |
| IRCTC API (RapidAPI) | Live train data | RapidAPI Key |
| Apify IRCTC Scraper | Train schedule scraping | Apify Token |
| SMS Gateway (MSG91/2Factor) | Alert notifications | API Key |
| Firebase FCM | Push notifications (mobile) | Service Account |

### 8.2 Internal System Integration

| System | Method | Protocol |
|---|---|---|
| TMS | REST API / SFTP batch | HTTPS / SFTP |
| SMMS | REST API / CSV export | HTTPS |
| TDMS | REST API / CSV export | HTTPS |
| COA | REST API (real-time) | HTTPS/WebSocket |
| BDMS | REST API (read/write) | HTTPS |
| FOIS | REST API | HTTPS |

---

## 9. UI/UX Requirements

### 9.1 Design Principles

- **Responsive First**: Works on desktop (1920px), tablet (768px), mobile (375px)
- **Offline First**: PWA with service worker for offline block viewing
- **Low Bandwidth Friendly**: Skeleton screens, compressed images, lazy loading
- **Accessibility**: WCAG 2.1 AA compliance
- **Language**: English + Hindi toggle

### 9.2 Key Screens

1. **Landing Dashboard** — KPI tiles (AAI, blocks today, pending approvals)
2. **Block Calendar** — Weekly/Monthly Gantt view with filter panel
3. **Network Map View** — Geographic block visualization
4. **Defect Manager** — List of pending defects to be scheduled
5. **AI Plan Generator** — Trigger AI scheduling with parameters
6. **Approval Workflow** — Review and approve/reject block plans
7. **Reports Center** — Generate and download reports
8. **Mobile Field View** — Simplified PWA for field engineers

---

## 10. Compliance & Safety Requirements

| Requirement | Standard/Reference |
|---|---|
| Block planning must not conflict with passenger train safety windows | Indian Railways General Rules (GR) |
| Critical safety defects must be scheduled within 24 hours | Indian Railways Permanent Way Manual |
| All block plans must go through authorized approval chain | Railway Board Circular on Block Management |
| Signal & electrical isolation procedures must be validated | S&T and Electrical Department Safety Manuals |
| Data residency within India | Government of India Data Localization Policy |
| Compliance with CERT-In guidelines | CERT-In IT Security Framework |

---

## 11. Success Metrics & KPIs

| KPI | Baseline (Current) | Target |
|---|---|---|
| Asset Availability Index (AAI) | ~82% | ≥ 90% |
| Block Utilization Efficiency | ~65% | ≥ 85% |
| Combined Block Rate (multi-dept) | ~10% | ≥ 40% |
| Overdue Maintenance Tasks (%) | ~18% | ≤ 5% |
| Block Planning Time | 3–5 days manual | < 1 hour automated |
| Train Delay due to Maintenance | Baseline TBD | -25% reduction |
| Critical Defect Response Time | Varies | < 24 hours scheduled |

---

## 12. Assumptions & Constraints

### Assumptions
- TMS, SMMS, TDMS have or can expose REST APIs for data access
- Railway IT infrastructure supports RailNet connectivity for internal integrations
- Field staff have access to basic smartphones with 3G/4G connectivity
- Demonstration/prototype uses mock data where real system APIs are restricted

### Constraints
- Access to production BDMS/COA data is restricted; prototype uses mock datasets
- Timeline: Prototype for SIH internal round at MIT-WPU
- Budget: Open-source and free-tier cloud services preferred
- Deployment: Must work on NIC (National Informatics Centre) cloud or Indian cloud providers

---

*Document Version: 1.0 | Date: August 2025 | Prepared for: SIH 2025 — MIT-WPU Internal Round*
