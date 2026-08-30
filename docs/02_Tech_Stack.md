# Tech Stack Document
## AI-Powered Automatic Block Planning System (RailSync)
### Problem Statement ID: 26027 | SIH 2025

---

## Design Philosophy

The tech stack is chosen to satisfy four key constraints:
1. **3G/4G/5G compatibility** — Progressive enhancement, offline-first PWA
2. **Scalability** — From one division to all 68 divisions of Indian Railways
3. **AI/ML capability** — Real scheduling intelligence, not rule-based heuristics
4. **Deployable on Indian infrastructure** — NIC Cloud / MeitY empaneled providers

---

## Full Stack Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                          │
│  React 18 + TypeScript  |  Next.js 14 (PWA)  |  Tailwind CSS  │
├─────────────────────────────────────────────────────────────────┤
│                         API GATEWAY                            │
│              Kong API Gateway  |  Nginx Reverse Proxy          │
├─────────────────────────────────────────────────────────────────┤
│                      BACKEND SERVICES                          │
│  FastAPI (Python)  |  Node.js (Express)  |  Microservices      │
├─────────────────────────────────────────────────────────────────┤
│                    AI/ML ENGINE                                │
│  Python  |  scikit-learn  |  OR-Tools (Google)  |  Celery     │
├─────────────────────────────────────────────────────────────────┤
│                   DATA & INTEGRATION                           │
│  PostgreSQL  |  Redis  |  Apache Kafka  |  Elasticsearch       │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                              │
│  Docker  |  Kubernetes  |  GitHub Actions CI/CD  |  NIC Cloud  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Frontend

### 1.1 Core Framework

| Technology | Version | Purpose | Why Chosen |
|---|---|---|---|
| **React** | 18.x | UI component library | Industry standard, large ecosystem |
| **Next.js** | 14.x | SSR/SSG + PWA framework | SEO, fast load, App Router, built-in PWA |
| **TypeScript** | 5.x | Type-safe JavaScript | Prevents runtime errors, better IDE support |
| **Tailwind CSS** | 3.x | Utility-first styling | Rapid UI development, tiny CSS bundle |

### 1.2 UI Component Libraries

| Library | Purpose |
|---|---|
| **Shadcn/UI** | Pre-built accessible components (modals, tables, alerts) |
| **Radix UI** | Headless accessible primitives |
| **Lucide React** | Icon library (MIT license, consistent style) |

### 1.3 Data Visualization

| Library | Purpose | Network Optimization |
|---|---|---|
| **Recharts** | KPI charts, bar/line graphs | Lightweight, tree-shakeable |
| **React-Gantt** (custom) | Gantt chart for block schedules | Virtualized rendering |
| **Leaflet.js + React-Leaflet** | Railway network map | Tile caching, offline map tiles |
| **Mapbox GL JS** (free tier) | High-res railway route rendering | Vector tiles (smaller than raster) |

### 1.4 PWA & Offline Capabilities

| Technology | Configuration | 3G Impact |
|---|---|---|
| **Workbox** (via next-pwa) | Service worker for caching | 70% faster repeat loads on 3G |
| **IndexedDB** (via Dexie.js) | Offline block schedule storage | Works with zero connectivity |
| **Background Sync API** | Queue defect submissions offline | Submits when back online |
| **Web App Manifest** | Install to home screen | Native-app feel |

### 1.5 State Management & Data Fetching

| Library | Purpose |
|---|---|
| **Zustand** | Lightweight global state (user, division, filters) |
| **React Query (TanStack Query)** | Server state, caching, background refetch |
| **Axios** | HTTP client with interceptors |

### 1.6 Network Adaptive Loading (3G/4G/5G)

```javascript
// Network-aware component loading
const connection = navigator.connection;
const effectiveType = connection?.effectiveType; // 'slow-2g' | '2g' | '3g' | '4g'

// Strategy:
// 3G → Load skeleton + text only, defer charts
// 4G → Load standard dashboard
// 5G → Load real-time map + live updates via WebSocket
```

| Network | Strategy |
|---|---|
| **3G (slow)** | Skeleton screens, no auto-refresh, compressed JSON (gzip), no map tiles |
| **3G (fast)** | Lazy-load charts, 60s auto-refresh, low-res tiles |
| **4G** | Full dashboard, 30s refresh, standard tile resolution |
| **5G** | Real-time WebSocket updates, high-res map, live video conferencing |

---

## Layer 2: API Gateway

| Technology | Role |
|---|---|
| **Kong API Gateway** | Rate limiting, auth, routing, logging |
| **Nginx** | Reverse proxy, SSL termination, static file serving |
| **Cloudflare (CDN)** | Global CDN for static assets, DDoS protection |

### API Standards
- **RESTful APIs** with OpenAPI 3.0 specification
- **WebSocket** for real-time block status updates
- **GraphQL** (optional) for flexible reporting queries
- All APIs versioned: `/api/v1/...`

---

## Layer 3: Backend Services (Microservices)

### 3.1 Service Architecture

| Service | Language/Framework | Port | Responsibility |
|---|---|---|---|
| **Auth Service** | Node.js + Express | 3001 | JWT auth, RBAC, MFA |
| **Block Planning Service** | Python + FastAPI | 8001 | Block plan CRUD, approvals |
| **AI Engine Service** | Python + FastAPI | 8002 | Scheduling optimization |
| **Data Ingestion Service** | Python + FastAPI | 8003 | TMS/SMMS/TDMS ETL |
| **Notification Service** | Node.js + Express | 3002 | SMS, push, email alerts |
| **Report Service** | Python + FastAPI | 8004 | PDF/Excel report generation |
| **Gateway Service** | Kong | 8000 | API routing & security |

### 3.2 Backend Framework Details

| Framework | Version | Use Case |
|---|---|---|
| **FastAPI** (Python) | 0.104+ | AI service, data APIs — high performance async |
| **Express.js** (Node.js) | 4.x | Auth, notifications — JavaScript ecosystem |
| **Pydantic** | 2.x | Data validation in FastAPI |
| **SQLAlchemy** | 2.x | ORM for PostgreSQL |
| **Celery** | 5.x | Async task queue for AI scheduling jobs |

---

## Layer 4: AI/ML Engine

### 4.1 Core Libraries

| Library | Version | Purpose |
|---|---|---|
| **Python** | 3.11 | Primary AI/ML language |
| **scikit-learn** | 1.3+ | Classification, clustering, anomaly detection |
| **Google OR-Tools** | 9.x | Constraint programming for scheduling optimization |
| **NumPy** | 1.26+ | Numerical computations |
| **Pandas** | 2.x | Data manipulation & ETL |
| **XGBoost / LightGBM** | Latest | Defect criticality prediction |
| **Prophet (Meta)** | 1.1+ | Time-series forecasting for maintenance demand |
| **NetworkX** | 3.x | Railway network graph representation |

### 4.2 AI Algorithm Design

#### A. Defect Criticality Classification
```python
# Multi-class classification: Critical / High / Medium / Low
# Features:
# - defect_type, days_overdue, speed_restriction_imposed
# - location_traffic_density, last_inspection_date
# - component_age, failure_history
# Model: XGBoost Classifier
```

#### B. Scheduling Optimization (OR-Tools CSP)
```python
# Constraint Satisfaction Problem:
# Variables: block_start_time, block_duration, block_section
# Constraints:
# - Must not overlap with passenger train windows (from PRS/NTES)
# - Must not overlap with other blocks in same section
# - Respect required maintenance window per task
# - Respect department resource availability
# Objective: Maximize asset availability + minimize delay impact
```

#### C. Window Identification (Prophet Forecasting)
```python
# Predict optimal maintenance windows:
# Input: Historical train run density, past block patterns
# Output: Recommended low-traffic windows per section
# Model: Meta Prophet (additive time series)
```

#### D. Combined Block Clustering
```python
# Cluster co-located tasks across departments
# Using: DBSCAN or K-Means on (km_post, block_type, time_window)
# Goal: Identify combined block opportunities
```

### 4.3 AI Decision Flow

```
Input Defects (TMS + SMMS + TDMS)
        ↓
[Step 1] Criticality Classifier → Priority Score (0–100)
        ↓
[Step 2] Window Forecaster → Available Time Windows
        ↓
[Step 3] OR-Tools Optimizer → Optimal Block Schedule
        ↓
[Step 4] Combined Block Clustering → Merge Adjacent Tasks
        ↓
Output: Weekly/Monthly Block Plan (JSON)
```

---

## Layer 5: Database & Storage

### 5.1 Primary Database

| Database | Version | Purpose | Why |
|---|---|---|---|
| **PostgreSQL** | 15+ | Main relational DB | ACID, geospatial via PostGIS, JSON support |
| **PostGIS** | 3.x extension | Railway network spatial queries | Native geo-indexing for route data |
| **TimescaleDB** | Extension | Time-series defect data | 10x query speed for time-series |

### 5.2 Cache & Session

| Technology | Purpose |
|---|---|
| **Redis** 7.x | Session store, API response cache, Celery broker |
| **Redis Streams** | Real-time event streaming for block status |

### 5.3 Message Queue

| Technology | Purpose |
|---|---|
| **Apache Kafka** | Event streaming between microservices |
| **Kafka Topics**: `defects.ingested`, `blocks.created`, `blocks.approved`, `alerts.sent` |

### 5.4 Search & Analytics

| Technology | Purpose |
|---|---|
| **Elasticsearch** 8.x | Full-text search on defect descriptions, audit logs |
| **Kibana** | Log visualization, operational monitoring |

### 5.5 Object Storage

| Technology | Purpose |
|---|---|
| **MinIO** (self-hosted S3) | Report PDFs, block plan exports, attachments |

---

## Layer 6: Notification Infrastructure

| Channel | Technology | Use Case |
|---|---|---|
| **Push (Mobile/Web)** | Firebase FCM + Web Push API | Block approved, defect escalation |
| **SMS** | MSG91 / 2Factor.in | Critical defect alerts, field staff |
| **Email** | Nodemailer + SMTP / SendGrid | Weekly plan summary, reports |
| **In-App** | WebSocket (Socket.io) | Real-time block status updates |

---

## Layer 7: DevOps & Infrastructure

### 7.1 Containerization

| Technology | Version | Purpose |
|---|---|---|
| **Docker** | 24.x | Containerize each microservice |
| **Docker Compose** | 2.x | Local development environment |
| **Kubernetes (K8s)** | 1.28+ | Production orchestration |
| **Helm** | 3.x | K8s package management |

### 7.2 CI/CD Pipeline

```yaml
# GitHub Actions Pipeline
Trigger: Push to main/develop branch
Steps:
  1. Lint (ESLint, Pylint)
  2. Unit Tests (Pytest, Jest)
  3. Build Docker Images
  4. Security Scan (Trivy)
  5. Deploy to Staging
  6. Integration Tests
  7. Deploy to Production (K8s rolling update)
```

| Tool | Purpose |
|---|---|
| **GitHub Actions** | CI/CD automation |
| **Docker Hub / GitHub Container Registry** | Image registry |
| **ArgoCD** | GitOps-based K8s deployment |

### 7.3 Cloud & Hosting

| Option | Provider | For |
|---|---|---|
| **Primary (Prototype)** | AWS / Google Cloud Free Tier | Demo environment |
| **Production Target** | NIC Cloud (MeghRaj) / AWS GovCloud | Indian Railways deployment |
| **CDN** | Cloudflare (free tier) | Static assets globally |

### 7.4 Monitoring & Observability

| Tool | Purpose |
|---|---|
| **Prometheus** | Metrics collection |
| **Grafana** | Metrics dashboards (API latency, block plan gen time) |
| **Sentry** | Frontend & backend error tracking |
| **ELK Stack** (Elasticsearch + Logstash + Kibana) | Centralized logging |

---

## Layer 8: Security

| Layer | Technology | Implementation |
|---|---|---|
| **Authentication** | JWT + Refresh Tokens | 15-min access token, 7-day refresh |
| **MFA** | TOTP (Google Authenticator) via speakeasy | For admin/approver roles |
| **Authorization** | RBAC middleware | Per-endpoint role checks |
| **Transport Security** | TLS 1.3 | All HTTPS, HSTS headers |
| **Data Encryption** | AES-256-GCM | At-rest encryption in PostgreSQL |
| **API Security** | Kong rate limiting, CORS | DDoS protection |
| **Secrets** | HashiCorp Vault / K8s Secrets | No secrets in code |
| **Dependency Scanning** | Dependabot + Snyk | Auto vulnerability alerts |

---

## Development Tools

| Category | Tool |
|---|---|
| Code Editor | VS Code |
| API Testing | Postman / Insomnia |
| DB GUI | DBeaver / pgAdmin |
| Design | Figma |
| Docs | Swagger UI (auto from FastAPI) |
| Version Control | Git + GitHub |
| Project Management | GitHub Projects / Linear |

---

## Tech Stack Summary Table

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| PWA | next-pwa, Workbox, Dexie.js (IndexedDB) |
| Charts | Recharts, Leaflet.js, Custom Gantt |
| Backend | FastAPI (Python), Express.js (Node.js) |
| AI/ML | scikit-learn, OR-Tools, XGBoost, Prophet, NetworkX |
| Database | PostgreSQL + PostGIS + TimescaleDB, Redis |
| Queue | Apache Kafka, Celery |
| Search | Elasticsearch |
| Notifications | Firebase FCM, MSG91, Socket.io |
| DevOps | Docker, Kubernetes, GitHub Actions, ArgoCD |
| Security | JWT, TOTP MFA, Kong, TLS 1.3, Vault |
| Monitoring | Prometheus, Grafana, Sentry, ELK |
| Cloud | NIC MeghRaj / AWS (prototype on free tier) |

---

*All chosen technologies are open-source or have free tiers suitable for prototype development. Production licensing costs are minimal (Mapbox optional, replaceable with OSM).*

---

*Document Version: 1.0 | Date: August 2025 | SIH 2025 — MIT-WPU Internal Round*
