# System Architecture Document
## AI-Powered Automatic Block Planning System (RailSync)
### Problem Statement ID: 26027 | SIH 2025

---

## 1. Architecture Overview

The RailSync follows a **Cloud-Native Microservices Architecture** deployed on containerized infrastructure. It uses an **event-driven** design with an **AI/ML core** for scheduling optimization.

### 1.1 High-Level Architecture Diagram

```
═══════════════════════════════════════════════════════════════════════
                         CLIENT TIER
═══════════════════════════════════════════════════════════════════════

  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────┐
  │  Web Dashboard   │  │  Mobile PWA      │  │  Admin Panel      │
  │  (Next.js 14)    │  │  (next-pwa)      │  │  (Next.js 14)     │
  │  Desktop/Tablet  │  │  3G/4G/5G Ready  │  │  Internal Only    │
  └────────┬─────────┘  └────────┬─────────┘  └────────┬──────────┘
           │                     │                      │
           └─────────────────────┼──────────────────────┘
                                 │ HTTPS / WebSocket
═══════════════════════════════════════════════════════════════════════
                         GATEWAY TIER
═══════════════════════════════════════════════════════════════════════
                    ┌────────────────────────┐
                    │   Cloudflare CDN/WAF   │
                    │  (DDoS, Static Assets) │
                    └──────────┬─────────────┘
                               │
                    ┌──────────▼─────────────┐
                    │   Kong API Gateway     │
                    │  (Auth, Rate Limit,    │
                    │   Routing, Logging)    │
                    └──────────┬─────────────┘
                               │
                    ┌──────────▼─────────────┐
                    │   Nginx Reverse Proxy  │
                    │  (SSL Termination)     │
                    └──────────┬─────────────┘
═══════════════════════════════════════════════════════════════════════
                       SERVICE TIER (Microservices)
═══════════════════════════════════════════════════════════════════════
         │           │           │           │          │
  ┌──────▼──┐  ┌─────▼───┐  ┌───▼─────┐  ┌─▼───────┐  ┌▼────────┐
  │  Auth   │  │  Block  │  │   AI    │  │  Data   │  │ Report  │
  │ Service │  │Planning │  │ Engine  │  │Ingest.  │  │ Service │
  │Node.js  │  │ FastAPI │  │ FastAPI │  │ FastAPI │  │ FastAPI │
  └──────┬──┘  └─────┬───┘  └───┬─────┘  └─┬───────┘  └┬────────┘
         │           │           │           │           │
  ┌──────▼───────────▼───────────▼───────────▼───────────▼────────┐
  │                  Notification Service (Node.js)                │
  │           SMS (MSG91) | Push (FCM) | Email | WebSocket         │
  └───────────────────────────────────────────────────────────────┘
═══════════════════════════════════════════════════════════════════════
                         DATA TIER
═══════════════════════════════════════════════════════════════════════
  ┌──────────────┐  ┌──────────┐  ┌────────────┐  ┌─────────────┐
  │ PostgreSQL   │  │  Redis   │  │   Kafka    │  │Elasticsearch│
  │ +PostGIS     │  │  Cache   │  │  Message   │  │  (Search &  │
  │ +Timescale   │  │  +Stream │  │   Queue    │  │   Logs)     │
  └──────────────┘  └──────────┘  └────────────┘  └─────────────┘
                          ┌──────────────┐
                          │  MinIO       │
                          │  (Object     │
                          │   Storage)   │
                          └──────────────┘
═══════════════════════════════════════════════════════════════════════
                     EXTERNAL INTEGRATION TIER
═══════════════════════════════════════════════════════════════════════
  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐ ┌───────────┐
  │ TMS  │ │SMMS  │ │TDMS  │ │ COA  │ │   FOIS   │ │Indian Rail│
  │(ENG) │ │(S&T) │ │ (TD) │ │(OPS) │ │ (Freight)│ │    API    │
  └──────┘ └──────┘ └──────┘ └──────┘ └──────────┘ └───────────┘
```

---

## 2. Microservices Architecture

### 2.1 Service Catalog

#### Service 1: Auth Service
```
Language:      Node.js + Express.js
Database:      PostgreSQL (users, roles, sessions)
Cache:         Redis (JWT blacklist, session)
Port:          3001
Responsibilities:
  - User registration & login
  - JWT issuance & validation
  - TOTP-based MFA
  - RBAC policy enforcement
  - Password reset & audit logging
```

#### Service 2: Block Planning Service
```
Language:      Python + FastAPI
Database:      PostgreSQL (block plans, approvals, history)
Cache:         Redis (block plan cache per division)
Port:          8001
Responsibilities:
  - CRUD for block plans
  - Approval workflow state machine
  - Conflict detection between blocks
  - Integration with AI Engine for plan generation
  - Block plan export (JSON/PDF)
```

#### Service 3: AI Engine Service
```
Language:      Python + FastAPI + Celery
Database:      PostgreSQL (ML model results, training data)
Cache:         Redis (computation cache)
Port:          8002
Queue:         Celery worker (Kafka-backed)
Responsibilities:
  - Defect criticality classification (XGBoost)
  - Scheduling optimization (OR-Tools)
  - Maintenance window forecasting (Prophet)
  - Combined block clustering (DBSCAN)
  - Model retraining pipeline
```

#### Service 4: Data Ingestion Service
```
Language:      Python + FastAPI + Celery
Database:      PostgreSQL (raw ingested data)
Queue:         Kafka producer
Port:          8003
Responsibilities:
  - ETL from TMS, SMMS, TDMS
  - External API polling (Indian Rail API, COA)
  - Data validation & normalization
  - Schedule: Every 4 hours batch + real-time events
```

#### Service 5: Notification Service
```
Language:      Node.js + Express
Integrations:  Firebase FCM, MSG91 SMS, SMTP
Queue:         Kafka consumer
Port:          3002
Responsibilities:
  - Push notifications (FCM for mobile/web)
  - SMS alerts (MSG91)
  - Email dispatch (SendGrid/SMTP)
  - Real-time WebSocket events (Socket.io)
```

#### Service 6: Report Service
```
Language:      Python + FastAPI
Storage:       MinIO (S3-compatible)
Port:          8004
Responsibilities:
  - Generate PDF reports (ReportLab/WeasyPrint)
  - Generate Excel exports (openpyxl)
  - Store in MinIO, return signed URLs
  - Scheduled weekly/monthly report generation
```

---

## 3. Database Architecture

### 3.1 PostgreSQL Schema Design

```sql
-- Zone & Division Master Data
CREATE TABLE zones (
    id UUID PRIMARY KEY,
    zone_code VARCHAR(5),         -- e.g., 'CR', 'NR', 'WR'
    zone_name VARCHAR(100),       -- e.g., 'Central Railway'
    hq_city VARCHAR(50)
);

CREATE TABLE divisions (
    id UUID PRIMARY KEY,
    zone_id UUID REFERENCES zones(id),
    division_code VARCHAR(10),    -- e.g., 'CR-CSTM', 'NR-DEL'
    division_name VARCHAR(100)
);

-- Railway Sections (between stations)
CREATE TABLE sections (
    id UUID PRIMARY KEY,
    division_id UUID REFERENCES divisions(id),
    from_station VARCHAR(10),     -- Station code e.g., 'CSTM'
    to_station VARCHAR(10),
    section_km DECIMAL(8,3),
    electrification_type VARCHAR(20), -- '25KV AC', 'DC', 'Non-Elec'
    track_type VARCHAR(20)        -- 'Double', 'Single', 'Multiple'
);

-- Defects from TMS/SMMS/TDMS
CREATE TABLE defects (
    id UUID PRIMARY KEY,
    source_system VARCHAR(10),    -- 'TMS', 'SMMS', 'TDMS'
    external_defect_id VARCHAR(50),
    section_id UUID REFERENCES sections(id),
    km_from DECIMAL(8,3),
    km_to DECIMAL(8,3),
    defect_type VARCHAR(100),
    description TEXT,
    reported_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    criticality VARCHAR(20),      -- 'Critical', 'High', 'Medium', 'Low'
    ai_priority_score DECIMAL(5,2),
    status VARCHAR(20),           -- 'Open', 'Scheduled', 'Completed'
    department VARCHAR(10),       -- 'ENG', 'S&T', 'TD'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Block Time Windows from COA
CREATE TABLE block_windows (
    id UUID PRIMARY KEY,
    section_id UUID REFERENCES sections(id),
    window_start TIMESTAMPTZ,
    window_end TIMESTAMPTZ,
    available_for VARCHAR(20),    -- 'ENG', 'S&T', 'TD', 'Combined'
    train_count_in_window INT,
    status VARCHAR(20)            -- 'Available', 'Booked', 'Cancelled'
);

-- Block Plans (AI-generated + Manual)
CREATE TABLE block_plans (
    id UUID PRIMARY KEY,
    plan_type VARCHAR(20),        -- 'Weekly', 'Monthly', 'Emergency'
    horizon_start DATE,
    horizon_end DATE,
    division_id UUID REFERENCES divisions(id),
    generated_by VARCHAR(20),     -- 'AI', 'Manual'
    status VARCHAR(20),           -- 'Draft', 'PendingApproval', 'Approved', 'Rejected'
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual Block Tasks within a Plan
CREATE TABLE block_tasks (
    id UUID PRIMARY KEY,
    plan_id UUID REFERENCES block_plans(id),
    defect_ids UUID[],            -- Array of defect IDs addressed
    section_id UUID REFERENCES sections(id),
    department VARCHAR(10),       -- 'ENG', 'S&T', 'TD', 'Combined'
    block_type VARCHAR(30),       -- 'Traffic Block', 'Power Block', etc.
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    team_leader_id UUID REFERENCES users(id),
    resources_required TEXT,
    special_instructions TEXT,
    status VARCHAR(20)            -- 'Planned', 'InProgress', 'Completed', 'Deferred'
);

-- Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100),
    entity_type VARCHAR(50),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Redis Data Structures

```
Keys:
block_plan:{division_id}:{date}     → Cached weekly plan JSON (TTL: 1hr)
session:{user_id}                   → User session data (TTL: 15min)
blacklist:{jti}                     → Invalidated JWTs (TTL: expiry time)
realtime:blocks:{section_id}        → Redis Stream for live block updates
alert_queue:{user_id}               → Pending notifications
```

### 3.3 Kafka Topic Design

```
Topics:
defects.ingested          → New defects ingested (TMS/SMMS/TDMS)
defects.prioritized       → AI-scored defects ready for scheduling
blocks.created            → New block plan generated
blocks.approved           → Block plan approved by officer
blocks.status.updated     → Real-time block execution status
alerts.triggered          → Notification events
reports.requested         → Background report generation jobs
```

---

## 4. AI Engine Architecture

### 4.1 Pipeline Design

```
                    ┌─────────────────────────────────┐
                    │     DATA PREPARATION LAYER      │
                    ├─────────────────────────────────┤
                    │ Raw Defects → Feature Extraction │
                    │ Features:                        │
                    │  - days_overdue                  │
                    │  - component_age                 │
                    │  - failure_frequency_30d         │
                    │  - traffic_density_section       │
                    │  - current_speed_restriction     │
                    │  - last_inspection_gap_days      │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   CRITICALITY CLASSIFIER        │
                    │   Model: XGBoost (4 classes)    │
                    │   Output: Priority Score 0-100  │
                    │   Accuracy target: >85%         │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   WINDOW AVAILABILITY LAYER     │
                    │   Inputs:                       │
                    │    - COA block availability     │
                    │    - Train timetable (PRS/NTES) │
                    │    - Goods forecast (FOIS)      │
                    │   Output: Scored time windows   │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   OR-TOOLS OPTIMIZER            │
                    │   Type: CP-SAT Solver           │
                    │   Variables:                    │
                    │    - task → window assignment   │
                    │   Constraints:                  │
                    │    - No section overlap         │
                    │    - Train safety windows       │
                    │    - Dept resource limits       │
                    │   Objective: Max AAI + min delay│
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │   COMBINED BLOCK CLUSTERING     │
                    │   Algorithm: DBSCAN             │
                    │   Features: location, time      │
                    │   Output: Combined block groups │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │       BLOCK PLAN OUTPUT         │
                    │  Weekly Plan: 7-day schedule    │
                    │  Monthly Plan: 30-day schedule  │
                    │  Format: JSON → PostgreSQL      │
                    └─────────────────────────────────┘
```

### 4.2 OR-Tools Constraint Model

```python
from ortools.sat.python import cp_model

model = cp_model.CpModel()

# Variables: For each (task, window) pair, is it assigned?
task_windows = {}
for task in tasks:
    for window in windows:
        task_windows[(task.id, window.id)] = model.NewBoolVar(
            f'task_{task.id}_window_{window.id}'
        )

# Constraint 1: Each critical task assigned to exactly one window
for task in critical_tasks:
    model.AddExactlyOne(
        task_windows[(task.id, w.id)] for w in windows
    )

# Constraint 2: No two tasks on same section overlap
for section in sections:
    section_tasks = [t for t in tasks if t.section_id == section.id]
    for w in windows:
        model.Add(
            sum(task_windows[(t.id, w.id)] for t in section_tasks) <= 1
        )

# Constraint 3: Respect train operation safety windows
for w in train_windows:
    for task in tasks:
        model.Add(task_windows[(task.id, w.id)] == 0)

# Objective: Maximize priority scores of scheduled tasks
model.Maximize(
    sum(
        task.priority_score * task_windows[(task.id, w.id)]
        for task in tasks
        for w in windows
    )
)
```

---

## 5. Data Flow Architecture

### 5.1 Ingestion Flow (Every 4 Hours)

```
TMS → [REST API] ──┐
SMMS → [REST API] ─┼──▶ Data Ingestion Service ──▶ Kafka (defects.ingested)
TDMS → [REST API] ─┘         │ Normalize                      │
                              │ Validate                        │
COA → [REST API] ─────────────▶ block_windows table            │
FOIS → [REST API] ─────────────▶ freight_schedule table         │
NTES → [REST API] ─────────────▶ train_timetable table          │
                                                                │
                                               AI Engine consumes│
                                               Kafka event      │
                                                                ▼
                                               XGBoost scores defects
                                                                │
                                                                ▼
                                               OR-Tools generates plan
                                                                │
                                                                ▼
                                               Kafka (blocks.created)
                                                                │
                                                                ▼
                                               Notification: "Plan ready for review"
```

### 5.2 Approval Workflow

```
AI Plan Generated (Draft)
        │
        ▼
SSE / JE notified → Reviews in Dashboard
        │
        ├─── Approve → Moves to DivisionalOfficer Review
        └─── Reject → Returns to AI Engine for re-optimization
                              │
                    DivisionalOfficer Review
                              │
                    ├─── Approve → Plan ACTIVE → COA synced
                    └─── Override → Modified plan saved with reason
                                          │
                              ACTIVE Plan pushed to:
                              - Field staff mobile app
                              - Control Office (COA)
                              - Zonal reporting system
```

---

## 6. PWA & Mobile Architecture

### 6.1 Service Worker Strategy

```javascript
// Caching Strategy per resource type

// Static assets (JS, CSS, fonts): Cache First
// API responses (block plan): Network First → fallback to cache
// Map tiles: Cache First (heavy, changes rarely)
// Real-time data: Network Only (no stale data for live status)

workbox.routing.registerRoute(
  ({request}) => request.destination === 'image',
  new workbox.strategies.CacheFirst({ cacheName: 'images' })
);

workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/blocks/weekly'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'block-plans',
    networkTimeoutSeconds: 5,  // Fallback to cache after 5s (3G timeout)
  })
);
```

### 6.2 Offline Data Sync (IndexedDB via Dexie.js)

```javascript
// Tables stored offline:
// - current_block_plan (last 7 days)
// - my_section_defects (for field staff)
// - pending_defect_submissions (queue for when back online)

const db = new Dexie('RailSyncOfflineDB');
db.version(1).stores({
  block_plans: 'id, date, section_id, department, status',
  defects: 'id, section_id, criticality, due_date',
  pending_submissions: '++id, type, payload, created_at'
});

// Background sync when connectivity restored
self.addEventListener('sync', event => {
  if (event.tag === 'sync-defect-submissions') {
    event.waitUntil(syncPendingDefects());
  }
});
```

### 6.3 Network-Adaptive Component

```javascript
// React hook for network awareness
function useNetworkType() {
  const [networkType, setNetworkType] = useState('4g');
  
  useEffect(() => {
    const conn = navigator.connection;
    setNetworkType(conn?.effectiveType || '4g');
    conn?.addEventListener('change', () => 
      setNetworkType(conn.effectiveType)
    );
  }, []);
  
  return networkType;
}

// Usage in Dashboard
function Dashboard() {
  const network = useNetworkType();
  
  return (
    <>
      <KPITiles />   {/* Always loaded */}
      {network !== 'slow-2g' && <GanttChart />}  {/* Skip on very slow */}
      {['4g', '5g'].includes(network) && <LiveMap />}  {/* 4G+ only */}
      {network === '5g' && <RealtimeUpdates />}  {/* 5G only */}
    </>
  );
}
```

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
User Login Request
        │
        ▼
Kong API Gateway → Rate limit check (5 req/min for auth)
        │
        ▼
Auth Service → Verify credentials (bcrypt password hash)
        │
        ├── [If MFA enabled] → Validate TOTP code
        │
        ▼
Issue JWT:
  - Access Token (15 min expiry, RS256 signed)
  - Refresh Token (7 days, stored in HttpOnly cookie)
  - Payload: { userId, role, divisionId, zoneId }
        │
        ▼
All subsequent requests → Kong validates JWT signature
  → Attach user context to service calls
```

### 7.2 Inter-Service Communication

```
All services communicate via:
  - Internal Kubernetes cluster network
  - mTLS (mutual TLS) via Istio service mesh
  - Each service has its own service account certificate
  - No service accepts external requests directly
```

---

## 8. Deployment Architecture

### 8.1 Kubernetes Cluster Layout

```
Kubernetes Cluster (Production)
├── Namespace: railsync-prod
│   ├── Deployment: auth-service (2 replicas)
│   ├── Deployment: block-planning-service (3 replicas)
│   ├── Deployment: ai-engine-service (2 replicas)
│   ├── Deployment: data-ingestion-service (2 replicas)
│   ├── Deployment: notification-service (2 replicas)
│   ├── Deployment: report-service (1 replica)
│   ├── Deployment: frontend (3 replicas, CDN-backed)
│   └── StatefulSet: celery-worker (3 replicas)
├── Namespace: railsync-data
│   ├── StatefulSet: postgresql-primary (1)
│   ├── StatefulSet: postgresql-replica (2)
│   ├── StatefulSet: redis-cluster (3 replicas)
│   ├── StatefulSet: kafka-cluster (3 brokers)
│   └── StatefulSet: elasticsearch (3 nodes)
└── Namespace: railsync-monitoring
    ├── Deployment: prometheus
    ├── Deployment: grafana
    └── Deployment: kibana
```

### 8.2 CI/CD Flow

```
Developer pushes code to GitHub
        │
        ▼
GitHub Actions triggered
        │
        ├── Lint & Type Check (ESLint, Pylint, mypy)
        ├── Unit Tests (Jest, Pytest) — must pass >80% coverage
        ├── Build Docker Images
        ├── Security Scan (Trivy for CVEs)
        │
        ▼
Deploy to Staging (railsync-staging namespace)
        │
        ├── Integration Tests (Postman collections)
        ├── E2E Tests (Playwright)
        │
        ▼
Manual approval gate (Tech Lead)
        │
        ▼
ArgoCD deploys to Production (rolling update, zero downtime)
```

---

## 9. Monitoring & Alerting Architecture

```
Services emit metrics → Prometheus scrapes → Grafana dashboards
Services emit logs → Logstash → Elasticsearch → Kibana
Services emit errors → Sentry (real-time error tracking)

Key Alerts (PagerDuty / Email):
  - AI Engine scheduling failure → Page on-call engineer
  - Data ingestion lag > 8 hours → Alert IT admin
  - API error rate > 5% → Alert team
  - Database CPU > 80% → Scale read replicas
```

---

*Document Version: 1.0 | Date: August 2025 | SIH 2025 — MIT-WPU Internal Round*
