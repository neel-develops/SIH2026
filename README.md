<div align="center">

<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Indian_Railways_Official_Logo.svg/200px-Indian_Railways_Official_Logo.svg.png" alt="Indian Railways Logo" width="90"/>

# 🚆 AABPS — AI-Powered Automatic Block Planning System

### Smart India Hackathon 2026 · Problem Statement #26027
### Ministry of Railways, Government of India

---

[![SIH 2026](https://img.shields.io/badge/SIH-2025-orange?style=for-the-badge&logo=data:image/svg+xml;base64,)](https://sih.gov.in)
[![MIT-WPU](https://img.shields.io/badge/MIT--WPU-Internal%20Round-blue?style=for-the-badge)](https://mitwpu.edu.in)
[![Ministry of Railways](https://img.shields.io/badge/Ministry%20of-Railways-darkgreen?style=for-the-badge)](https://indianrailways.gov.in)
[![PWA Ready](https://img.shields.io/badge/PWA-3G%2F4G%2F5G%20Ready-purple?style=for-the-badge)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

> **Transforming Indian Railways' decentralised, manual block planning into a data-driven, AI-optimised, multi-department scheduling engine — maximising asset availability and ensuring uninterrupted train operations across 68,000+ km of network.**

<br/>

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   BEFORE AABPS                        AFTER AABPS                           │
│   ─────────────                       ───────────                           │
│   ENG Block ████░░░░░░░░░░            Combined Block ██████░░░░░░           │
│   S&T Block ░░░░████░░░░░░            (All depts)                           │
│   TD  Block ░░░░░░░░████░░                                                  │
│   Trains    ░░░░░░░░░░░░██            Trains         ░░░░░░██████           │
│                                                                              │
│   3 blocks = 3× downtime             1 combined block = 1× downtime         │
│   AAI ≈ 82%                          AAI ≥ 91%                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

</div>

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Impact Numbers](#-key-impact-numbers)
- [System Architecture](#-system-architecture)
- [AI/ML Engine](#-aiml-engine)
- [Tech Stack](#-tech-stack)
- [Feature Modules](#-feature-modules)
- [Network Compatibility](#-network-compatibility-3g--4g--5g)
- [RBAC & Security](#-rbac--security)
- [Indian Railways Integration](#-indian-railways-integration)
- [Available Datasets & APIs](#-available-datasets--apis)
- [Project Documents](#-project-documents)
- [Getting Started](#-getting-started)
- [Repository Structure](#-repository-structure)
- [Team](#-team)

---

## 🎯 Problem Statement

Indian Railways operates **13,500+ trains daily** across **68,000 km** of network serving **24 million passengers** every day. Maintaining this infrastructure requires three departments to coordinate maintenance windows:

| Department | System | Manages |
|---|---|---|
| **Engineering (ENG)** | TMS — Track Management System | Tracks, bridges, tunnels, level crossings |
| **Signal & Telecom (S&T)** | SMMS — Signalling Maintenance & Management System | Signals, interlocking, OFC, communication |
| **Traction Distribution (TD)** | TDMS — Traction Distribution Management System | OHE, PSI, TSS — electric traction infrastructure |

### The Problem

These three departments file maintenance block requests **independently** through **BDMS** (Block/Disconnection Management System) — without integration, without AI prioritisation, and without visibility into each other's schedules. This results in:

- 🔴 **Triple downtime** — Same section blocked 3 separate times instead of once
- 🔴 **Poor prioritisation** — Critical safety defects may wait while low-risk tasks get blocks
- 🔴 **Wasted windows** — Maintenance scheduled in high-traffic periods
- 🔴 **Manual delays** — Block plan takes 3–5 days to prepare manually
- 🔴 **No forecasting** — Reactive repair instead of proactive planning

---

## 💡 Our Solution

**AABPS** is a unified, AI-powered block planning system that:

1. **Integrates** TMS + SMMS + TDMS + COA + FOIS + PRS into a single data layer
2. **Classifies** every defect by criticality using an **XGBoost** ML classifier
3. **Optimises** block scheduling using **Google OR-Tools** constraint programming (CP-SAT solver)
4. **Clusters** geographically adjacent cross-department tasks into **combined blocks**
5. **Publishes** automated **weekly and monthly** block plans for review & approval
6. **Delivers** everything via a **PWA** that works on 3G, 4G, and 5G networks

```
TMS ──┐
SMMS ─┼──▶  Data Hub  ──▶  AI Engine  ──▶  Block Plan  ──▶  Approval  ──▶  COA
TDMS ─┘        ▲                                                    │
COA ───────────┘                                              Field Teams
NTES/FOIS ─────┘                                              (Mobile PWA)
```

---

## 📊 Key Impact Numbers

<div align="center">

| Metric | Before AABPS | After AABPS | Improvement |
|---|---|---|---|
| **Asset Availability Index (AAI)** | ~82% | ≥ 91% | **+9 percentage points** |
| **Block Planning Time** | 3–5 days | < 45 seconds | **99.4% faster** |
| **Combined Block Rate** | ~8% | ≥ 43% | **5× increase** |
| **Block Utilisation Efficiency** | ~65% | ≥ 85% | **+20 points** |
| **Overdue Maintenance Backlog** | ~18% of tasks | ≤ 5% | **72% reduction** |
| **Critical Defect Scheduling** | Days to weeks | < 24 hours | **Emergency-ready** |

</div>

---

## 🏗️ System Architecture

```
═══════════════════════════════════════════════════════════════════════
                         CLIENT TIER
═══════════════════════════════════════════════════════════════════════
  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐
  │  Web Dashboard   │  │  Mobile PWA      │  │  Admin Panel      │
  │  Next.js 14      │  │  Offline-First   │  │  (Internal)       │
  │  Desktop/Tablet  │  │  3G/4G/5G Ready  │  │                   │
  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────────┘
═══════════════════════════════════════════════════════════════════════
                      GATEWAY TIER
═══════════════════════════════════════════════════════════════════════
           Cloudflare CDN/WAF → Kong API Gateway → Nginx
═══════════════════════════════════════════════════════════════════════
                   MICROSERVICES TIER
═══════════════════════════════════════════════════════════════════════
  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  Auth   │ │  Block   │ │   AI     │ │  Data    │ │ Notify   │
  │ Service │ │Planning  │ │ Engine   │ │ Ingest   │ │ Service  │
  │Node.js  │ │ FastAPI  │ │ FastAPI  │ │ FastAPI  │ │ Node.js  │
  └─────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
═══════════════════════════════════════════════════════════════════════
                       DATA TIER
═══════════════════════════════════════════════════════════════════════
  PostgreSQL+PostGIS   Redis    Apache Kafka   Elasticsearch   MinIO
═══════════════════════════════════════════════════════════════════════
                   EXTERNAL INTEGRATIONS
═══════════════════════════════════════════════════════════════════════
     TMS    SMMS    TDMS    COA    FOIS   Indian Rail API   NTES
═══════════════════════════════════════════════════════════════════════
```

> **Full architecture details →** [`03_System_Architecture.md`](docs/03_System_Architecture.md)

---

## 🤖 AI/ML Engine

The heart of AABPS is a four-stage AI pipeline:

### Stage 1 — Defect Criticality Classifier
```
Model: XGBoost (multi-class)
Classes: Critical | High | Medium | Low
Features: days_overdue, component_age, traffic_density,
          failure_frequency_30d, TSR_imposed, last_inspection_gap
Target accuracy: > 85%
```

### Stage 2 — Maintenance Window Forecaster
```
Model: Meta Prophet (time-series)
Input: Historical train run density, past block patterns
Output: Scored low-traffic windows per section (30-day horizon)
```

### Stage 3 — OR-Tools CP-SAT Scheduler ⭐
```
Solver: Google OR-Tools CP-SAT (Constraint Programming — Satisfiability)
Variables: task → window assignment (binary)
Constraints:
  ✓ No section overlap between blocks
  ✓ Must fit within train-free windows (from COA/NTES)
  ✓ Rajdhani/Shatabdi windows are inviolable
  ✓ Department resource availability
  ✓ Critical tasks must be scheduled within 24 hours
Objective: Maximise Σ(priority_score × assigned) — i.e., highest-risk tasks first
Solve time: < 60 seconds for 200 defects / 7-day horizon
```

### Stage 4 — Combined Block Clustering
```
Algorithm: DBSCAN spatial clustering
Features: km_post, block_type, time_window
Goal: Merge cross-department tasks into a single combined block
Output: 1 block downtime instead of 3 separate downtimes
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js_14-black?logo=nextdotjs) ![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white) |
| **PWA / Offline** | ![Workbox](https://img.shields.io/badge/Workbox-FF6D00?logo=googlechrome&logoColor=white) Dexie.js (IndexedDB) · Background Sync API |
| **Visualisation** | Recharts · Leaflet.js · Custom Gantt (virtualised) |
| **Backend** | ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white) ![Python](https://img.shields.io/badge/Python_3.11-3776AB?logo=python&logoColor=white) |
| **AI / ML** | XGBoost · Google OR-Tools (CP-SAT) · Meta Prophet · scikit-learn · NetworkX |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-4169E1?logo=postgresql&logoColor=white) + PostGIS + TimescaleDB |
| **Cache / Queue** | ![Redis](https://img.shields.io/badge/Redis_7-DC382D?logo=redis&logoColor=white) · ![Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?logo=apachekafka&logoColor=white) · Celery |
| **Search** | ![Elasticsearch](https://img.shields.io/badge/Elasticsearch_8-005571?logo=elasticsearch&logoColor=white) |
| **Notifications** | Firebase FCM · MSG91 SMS · Socket.io (WebSocket) |
| **DevOps** | ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white) ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white) ArgoCD |
| **Security** | JWT · TOTP MFA · Kong · TLS 1.3 · AES-256 · HashiCorp Vault |
| **Monitoring** | Prometheus · Grafana · Sentry · ELK Stack |
| **Cloud Target** | NIC MeghRaj (Production) · AWS ap-south-1 (Prototype) |

</div>

> **Full tech stack details →** [`02_Tech_Stack.md`](docs/02_Tech_Stack.md)

---

## 🧩 Feature Modules

### Module 1 — Data Integration Hub
- Ingests defect data from TMS, SMMS, TDMS every 4 hours
- Pulls corridor block availability from COA in real-time
- Integrates goods train forecast (FOIS) and passenger timetable (PRS/NTES)
- Data validation, deduplication, and normalization on ingest

### Module 2 — AI Scheduling Engine
- XGBoost criticality classification → priority score 0–100
- OR-Tools CP-SAT optimal schedule generation (< 60 sec)
- DBSCAN combined block clustering across departments
- Prophet 30-day maintenance demand forecasting
- Dynamic re-optimisation when urgent defects arrive

### Module 3 — Block Plan Dashboard
- 📊 **Gantt chart** — Weekly/monthly block plan, colour-coded by department
- 🗺️ **Network map** — Leaflet.js map showing block sections (red/yellow/green)
- 📋 **Defect manager** — Prioritised defect queue with AI scores
- ✅ **Approval workflow** — One-click approve/reject with mandatory reason logging
- ✏️ **Manual override** — Drag-and-drop override with audit trail

### Module 4 — Notification & Alerts
- Push notifications: Block approved, urgent defect escalated
- SMS fallback (MSG91) for field staff on 2G/GSM-R
- In-app WebSocket alerts (real-time, zero delay on 4G/5G)
- Configurable thresholds: T-24h, T-6h, T-1h pre-block reminders

### Module 5 — Analytics & Reporting
- **AAI Dashboard** — Division-level and section-level asset availability trend
- **Block utilisation** — Planned vs. actual efficiency
- **Compliance reports** — Overdue task aging, department-wise performance
- **Export** — PDF and Excel, auto-generated weekly/monthly

### Module 6 — Mobile PWA
- Installable on Android & iOS (home screen icon, splash screen)
- **Offline mode** — Last 7-day block plan cached via IndexedDB
- Field defect submission with photo upload
- QR code asset scanning
- Works on 3G with < 5 second load time

---

## 📶 Network Compatibility (3G / 4G / 5G)

Indian Railways field engineers operate from remote track sections to mountain tunnels. AABPS is built for every network condition:

| Feature | Offline | 3G | 4G | 5G / LAN |
|---|---|---|---|---|
| Today's block schedule | ✅ Cached | ✅ | ✅ | ✅ |
| Submit defect (queued offline) | ✅ Queue | ✅ Live | ✅ | ✅ |
| KPI dashboard | Cached | ✅ | ✅ | ✅ |
| Gantt / charts | Cached | ✅ Lazy | ✅ | ✅ |
| Railway map | ❌ | ✅ Low-res | ✅ HD | ✅ Vector |
| Real-time block status | ❌ | ❌ | ✅ WebSocket | ✅ |
| AI plan generation | ❌ | ✅ Async | ✅ | ✅ |
| Push notifications | ❌ | ✅ | ✅ | ✅ |
| SMS fallback (2G) | ✅ | ✅ | ✅ | ✅ |

**Network detection** → automatic adaptive loading using `navigator.connection.effectiveType`  
**Service Worker** → Workbox with NetworkFirst/CacheFirst/StaleWhileRevalidate strategies  
**Estimated 3G load** → App shell: ~10 sec (first install), < 3 sec (repeat visits with cache)

> **Full connectivity plan →** [`05_Connectivity_and_Network_Plan.md`](docs/05_Connectivity_and_Network_Plan.md)

---

## 🔐 RBAC & Security

Nine roles mapped to actual Indian Railways designations:

| Role | Designation | Key Capability |
|---|---|---|
| `SUPER_ADMIN` | IT Administrator | Full system access |
| `ZONAL_ADMIN` | Zonal IT Officer | Zone-level oversight |
| `DIVISIONAL_BLOCK_PLANNER` | Control Room Supervisor | Generate & approve plans |
| `SENIOR_OFFICER` | DRM / DEN / DSTE / DTDE | Final approval, KPI view |
| `SSE_ENGINEERING` | SSE — Engineering | Submit track defects, view ENG tasks |
| `SSE_SIGNAL_TELECOM` | SSE — S&T | Submit signal defects, view S&T tasks |
| `SSE_TRACTION_DISTRIBUTION` | SSE — TD | Submit OHE defects, view TD tasks |
| `JUNIOR_ENGINEER` | JE — Any dept | Mobile PWA, field task update |
| `READ_ONLY_VIEWER` | Analyst / Auditor | Reports only |

**Security highlights:**
- JWT (RS256) with 15-min access token + 7-day refresh
- TOTP MFA mandatory for all officer-level roles
- All data scoped by zone → division → section (automatic query filtering)
- TLS 1.3 in transit · AES-256 at rest · Full audit log with before/after JSON
- Rate limiting via Kong · CORS · Secrets in HashiCorp Vault

> **Full RBAC details →** [`04_RBAC_Roles_and_Permissions.md`](docs/04_RBAC_Roles_and_Permissions.md)

---

## 🚂 Indian Railways Integration

### Legacy Systems Integrated

| Acronym | Full Form | Department | Role in AABPS |
|---|---|---|---|
| **TMS** | Track Management System | Engineering | Source of track defects |
| **SMMS** | Signalling Maintenance & Management System | S&T | Source of signal defects |
| **TDMS** | Traction Distribution Management System | TD | Source of OHE/PSI defects |
| **BDMS** | Block/Disconnection Management System | Multi-dept | Existing block request system |
| **COA** | Control Office Application | Operations | Block corridor availability |
| **FOIS** | Freight Operations Information System | Freight | Goods train scheduling |
| **NTES** | National Train Enquiry System | Operations | Live train positions |
| **PRS** | Passenger Reservation System | Commercial | Passenger timetable |
| **OHE** | Overhead Equipment | TD | 25kV AC catenary system |
| **TSS** | Traction Sub-Station | TD | Power supply point |
| **AAI** | Asset Availability Index | All | Primary success KPI |

> **Full domain knowledge →** [`06_Indian_Railways_Domain_Knowledge.md`](docs/06_Indian_Railways_Domain_Knowledge.md)

---

## 📡 Available Datasets & APIs

| Source | Data | Integration |
|---|---|---|
| [indianrailapi.com](https://indianrailapi.com/api-collection) | Train schedules, live status, stations | REST API — block window calculation |
| [IRCTC API (RapidAPI)](https://rapidapi.com/IRCTCAPI/api/irctc1) | Live train position, timetable | REST API — corridor safety check |
| [Apify IRCTC Scraper](https://apify.com/scrapingshark/irctc-train-data-scraper) | Batch timetable data | Weekly scrape — timetable refresh |
| [data.gov.in](https://data.gov.in/catalog/indian-railway-train-time-table) | Complete train timetable CSV | Monthly batch — offline timetable DB |
| [data.gov.in](https://data.gov.in) | Station master, zone/division data | Reference master tables |
| OpenStreetMap / GeoJSON | Railway network geometry | Leaflet.js map rendering |

Mock data generators are included for all three maintenance systems (TMS/SMMS/TDMS) to enable full prototype demonstration without production data access.

> **Full API guide →** [`07_API_Integration_and_Datasets.md`](docs/07_API_Integration_and_Datasets.md)

---

## 📄 Project Documents

All documentation is in the `/docs` folder:

| # | Document | Description |
|---|---|---|
| 01 | [`PRD — Project Requirements Document`](docs/01_PRD_Project_Requirements_Document.md) | Full functional & non-functional requirements, stakeholders, KPIs |
| 02 | [`Tech Stack`](docs/02_Tech_Stack.md) | Layer-by-layer technology choices with rationale |
| 03 | [`System Architecture`](docs/03_System_Architecture.md) | Architecture diagrams, microservice specs, DB schema, AI pipeline |
| 04 | [`RBAC Roles & Permissions`](docs/04_RBAC_Roles_and_Permissions.md) | 9 roles, full permission matrix, approval workflows |
| 05 | [`Connectivity & Network Plan`](docs/05_Connectivity_and_Network_Plan.md) | 3G/4G/5G strategy, PWA offline, service worker config |
| 06 | [`Indian Railways Domain Knowledge`](docs/06_Indian_Railways_Domain_Knowledge.md) | Block types, maintenance cycles, full form glossary |
| 07 | [`API Integration & Datasets`](docs/07_API_Integration_and_Datasets.md) | External APIs, mock data generators, ingestion pipeline |
| 08 | [`Prototype Guide & Winning Strategy`](docs/08_Prototype_Guide_and_Winning_Strategy.md) | 10-minute demo script, build plan, SIH judge Q&A prep |

---

## 🚀 Getting Started

### Prerequisites
- Docker 24+ and Docker Compose 2+
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)
- Git

### Quick Start (Full Stack with Mock Data)

```bash
# 1. Clone the repository
git clone https://github.com/neel-develops/SIH2026.git
cd SIH2026

# 2. Copy environment template
cp .env.example .env
# Edit .env with your API keys (Indian Rail API, Firebase, MSG91)

# 3. Start all services
docker-compose up --build

# 4. Seed the database with realistic mock data
docker-compose exec backend python scripts/db/seed_mock_data.py

# 5. Open the application
open http://localhost:3000
```

### Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@indianrailways.gov.in` | `demo1234` |
| Divisional Planner | `planner@cr.railways.gov.in` | `demo1234` |
| SSE Engineering | `sse.eng@cr.railways.gov.in` | `demo1234` |
| Junior Engineer (Mobile) | `je001@cr.railways.gov.in` | `demo1234` |

### Mobile PWA Install

1. Open `http://localhost:3000` on your phone's Chrome/Safari
2. Tap **"Add to Home Screen"** from browser menu
3. App installs with railway icon — works offline!

---

## 📁 Repository Structure

```
SIH2026/
├── README.md                          ← You are here
├── docs/                              ← All project documents
│   ├── 01_PRD_Project_Requirements_Document.md
│   ├── 02_Tech_Stack.md
│   ├── 03_System_Architecture.md
│   ├── 04_RBAC_Roles_and_Permissions.md
│   ├── 05_Connectivity_and_Network_Plan.md
│   ├── 06_Indian_Railways_Domain_Knowledge.md
│   ├── 07_API_Integration_and_Datasets.md
│   └── 08_Prototype_Guide_and_Winning_Strategy.md
├── frontend/                          ← Next.js 14 PWA
│   ├── app/                           ← App Router pages
│   │   ├── dashboard/
│   │   ├── block-plans/
│   │   ├── defects/
│   │   ├── map/
│   │   └── reports/
│   ├── components/                    ← Reusable components
│   │   ├── GanttChart/
│   │   ├── RailwayMap/
│   │   ├── KPITiles/
│   │   └── ApprovalFlow/
│   ├── lib/                           ← API clients, hooks
│   └── public/                        ← PWA manifest, icons
├── services/
│   ├── auth-service/                  ← Node.js · JWT · MFA
│   ├── block-planning-service/        ← Python FastAPI · CRUD
│   ├── ai-engine-service/             ← OR-Tools · XGBoost · Prophet
│   ├── data-ingestion-service/        ← ETL · API polling
│   └── notification-service/          ← FCM · SMS · WebSocket
├── scripts/
│   ├── mock_data/                     ← TMS / SMMS / TDMS generators
│   └── db/                            ← Migrations · Seeds
├── k8s/                               ← Kubernetes manifests
│   ├── deployments/
│   ├── services/
│   └── configmaps/
├── docker-compose.yml                 ← Local dev environment
├── docker-compose.prod.yml            ← Production stack
├── .env.example                       ← Environment template
└── .github/
    └── workflows/
        └── ci-cd.yml                  ← GitHub Actions pipeline
```

---

## 👥 Team

**Institute:** MIT World Peace University (MIT-WPU), Pune
**Hackathon:** Smart India Hackathon 2025 — Internal Round

| Name | Role |
|---|---|
| Neel | Team Lead · Full Stack & AI/ML |
| *(Add teammates)* | *(Add roles)* |

---

## 📜 Abbreviations Glossary

<details>
<summary>Click to expand full glossary</summary>

| Acronym | Full Form |
|---|---|
| AABPS | AI-Powered Automatic Block Planning System |
| AAI | Asset Availability Index |
| ADEN | Assistant Divisional Engineer |
| BDMS | Block/Disconnection Management System |
| BWO | Block and Withdrawal Order |
| COA | Control Office Application |
| CRIS | Centre for Railway Information Systems |
| DEN | Divisional Engineer |
| DRM | Divisional Railway Manager |
| DSTE | Divisional Signal & Telecommunication Engineer |
| DTDE | Divisional Traction Distribution Engineer |
| EI | Electronic Interlocking |
| ENG | Engineering Department |
| FOIS | Freight Operations Information System |
| GSM-R | Global System for Mobile Communications — Railway |
| IBS | Intermediate Block Signal |
| JE | Junior Engineer |
| LTE | Long Term Evolution (4G) |
| MFA | Multi-Factor Authentication |
| MSDAC | Multi-Section Digital Axle Counter |
| NIC | National Informatics Centre |
| NTES | National Train Enquiry System |
| OFC | Optical Fibre Cable |
| OHE | Overhead Equipment |
| PEC | Permit to Work (Electrical Certificate) |
| PSI | Power Supply Installation |
| PSR | Permanent Speed Restriction |
| PRS | Passenger Reservation System |
| PWA | Progressive Web Application |
| RBAC | Role-Based Access Control |
| RCIL | RailTel Corporation of India Limited |
| RRI | Route Relay Interlocking |
| SCADA | Supervisory Control & Data Acquisition |
| SIH | Smart India Hackathon |
| SMMS | Signalling Maintenance & Management System |
| SP | Sectioning Post |
| SPURT | Speed and Roughness Ultrasonic Testing |
| SSE | Senior Section Engineer |
| SSP | Sub-Sectioning Post |
| S&T | Signal & Telecommunication Department |
| TD | Traction Distribution Department |
| TDMS | Traction Distribution Management System |
| TMS | Track Management System |
| TOTP | Time-Based One-Time Password |
| TPN | Traction Power Notification |
| TRC | Track Recording Car |
| TSR | Temporary Speed Restriction |
| TSS | Traction Sub-Station |
| UTS | Unreserved Ticketing System |

</details>

---

<div align="center">

**Built with ❤️ for Indian Railways · SIH 2025 · MIT-WPU**

*"Transforming maintenance planning — one optimised block at a time."*

[![GitHub stars](https://img.shields.io/github/stars/neel-develops/SIH2026?style=social)](https://github.com/neel-develops/SIH2026)
[![GitHub forks](https://img.shields.io/github/forks/neel-develops/SIH2026?style=social)](https://github.com/neel-develops/SIH2026/fork)

</div>
