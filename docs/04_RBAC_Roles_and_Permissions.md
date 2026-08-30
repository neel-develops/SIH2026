# RBAC (Role-Based Access Control) Document
## AI-Powered Automatic Block Planning System (RailSync)
### Problem Statement ID: 26027 | SIH 2025

---

## RBAC Full Form
**RBAC** = **Role-Based Access Control**
A security model where system access rights are granted based on the user's role within the organization, following the principle of **least privilege**.

---

## 1. Organizational Hierarchy Mapping

Indian Railways follows a strict hierarchical command structure. RBAC mirrors this:

```
Railway Board / Zonal HQ Level
        ↓ (highest authority)
Divisional Railway Manager (DRM)
        ↓
Additional Divisional Railway Manager (ADRM)
        ↓
Senior Divisional Officers (DEN / DSTE / DTDE)
        ↓
Assistant Divisional Officers (ADEN / ADSTE / ADTDE)
        ↓
Senior Section Engineer (SSE) / Section Engineer (SE)
        ↓
Junior Engineer (JE) / Field Staff
        ↓ (lowest access)
IT Administrator / Read-Only Viewer
```

---

## 2. System Roles Definition

### Role 1: SUPER_ADMIN
**Designation**: IT Administrator / System Administrator
**Description**: Full system access including system configuration, user management, and all data.

| Permission | Access |
|---|---|
| User Management | Create, Read, Update, Delete all users |
| Role Assignment | Assign/revoke any role |
| System Configuration | Edit AI parameters, thresholds, integration settings |
| All Modules | Full read/write access |
| Audit Logs | Full access to all audit logs |
| Reports | All reports across all zones/divisions |
| Data Management | Import/export bulk data |
| API Key Management | View and rotate API keys |

**Use Case**: NIC IT team managing deployment; Railway IT cell

---

### Role 2: ZONAL_ADMIN
**Designation**: Zonal Railway IT Officer / Zonal Planning Officer
**Description**: Zone-level oversight across all divisions within a zone (e.g., Central Railway, Northern Railway).

| Permission | Access |
|---|---|
| User Management | Create/manage users within own zone |
| Block Plans | Read all plans across zone; cannot create/approve |
| Analytics | View zone-level KPIs and reports |
| Defects | View all defects across zone (read-only) |
| Configurations | View only |
| Audit Logs | View within own zone |

**Scope**: Limited to own zone (e.g., cannot see Western Railway data if zoned for Central Railway)

---

### Role 3: DIVISIONAL_BLOCK_PLANNER (Control Office)
**Designation**: Divisional Block Planning Officer / Control Room Supervisor
**Description**: Primary power user — reviews and approves AI-generated block plans, manages the block approval workflow.

| Permission | Access |
|---|---|
| View AI Block Plans | ✅ Full view (weekly + monthly) |
| Approve Block Plans | ✅ Can approve plans for own division |
| Reject Block Plans | ✅ Can reject with reason |
| Override Block Plans | ✅ Can manually override tasks (with mandatory reason) |
| Trigger AI Re-run | ✅ Can trigger fresh AI optimization |
| View All Defects | ✅ Own division |
| View Gantt Chart | ✅ Full Gantt with filters |
| View Network Map | ✅ Own division map |
| Export Reports | ✅ PDF/Excel |
| Notifications | ✅ Receive + configure alert preferences |
| User Management | ❌ No access |
| System Config | ❌ No access |

**Scope**: Limited to own division (e.g., Mumbai Division of CR)

---

### Role 4: SENIOR_OFFICER (DRM / DEN / DSTE / DTDE)
**Designation**: DRM (Divisional Railway Manager), DEN (Divisional Engineer), DSTE (Divisional Signal & Telecom Engineer), DTDE (Divisional Traction Distribution Engineer)
**Description**: Senior management view with final approval authority for high-priority or emergency blocks.

| Permission | Access |
|---|---|
| View Block Plans | ✅ Own division |
| Final Approve (Emergency) | ✅ Emergency/critical blocks only |
| View KPI Dashboard | ✅ Division-level KPIs |
| View Defect Reports | ✅ Own division |
| Generate Reports | ✅ Monthly summary reports |
| Override Blocks | ✅ With mandatory reason |
| Manage Teams | ❌ No user management |
| System Config | ❌ No access |

**Full Forms**:
- **DRM** = Divisional Railway Manager
- **DEN** = Divisional Engineer (Head of Engineering Dept in division)
- **DSTE** = Divisional Signal & Telecommunication Engineer
- **DTDE** = Divisional Traction Distribution Engineer

---

### Role 5: SSE_ENGINEERING
**Designation**: SSE (Senior Section Engineer) — Engineering Department
**Full Form**: **SSE** = Senior Section Engineer
**Description**: Field maintenance team lead for track and civil infrastructure.

| Permission | Access |
|---|---|
| View Block Plans | ✅ Own section only |
| Submit Defects | ✅ Track, bridge, level crossing defects |
| Update Defect Status | ✅ Own submitted defects |
| View Assigned Tasks | ✅ ENG tasks in current block plan |
| Mark Task Complete | ✅ After execution |
| Request Emergency Block | ✅ (goes to planner for approval) |
| View Team Schedule | ✅ Own team only |
| Approve Plans | ❌ No approval authority |
| Cross-dept View | ❌ Cannot see S&T or TD defects |
| Export Reports | ✅ Section-level only |

**Scope**: Own section under ADEN/AEN jurisdiction

---

### Role 6: SSE_SIGNAL_TELECOM
**Designation**: SSE — Signal & Telecommunication Department
**Description**: Field maintenance lead for signalling and telecom infrastructure.

| Permission | Access |
|---|---|
| View Block Plans | ✅ Own section only |
| Submit Defects | ✅ Signalling, interlocking, OFC, telecom defects |
| Update Defect Status | ✅ Own defects |
| View Assigned S&T Tasks | ✅ S&T tasks in block plan |
| Mark Task Complete | ✅ |
| Request Signal Block | ✅ (goes to planner for approval) |
| Cross-dept View | ❌ Cannot see ENG or TD defects |
| Export Reports | ✅ Section-level |

**Relevant Abbreviations**:
- **OFC** = Optical Fibre Cable
- **IBS** = Intermediate Block Signal
- **AFTC** = Audio Frequency Track Circuit
- **UFSBI** = Universal Fail-Safe Block Instrument

---

### Role 7: SSE_TRACTION_DISTRIBUTION
**Designation**: SSE — Traction Distribution (TD) Department
**Description**: Field maintenance lead for OHE and power supply infrastructure.

| Permission | Access |
|---|---|
| View Block Plans | ✅ Own section only |
| Submit Defects | ✅ OHE, PSI, TSS, SP/SSP defects |
| Update Defect Status | ✅ Own defects |
| View Assigned TD Tasks | ✅ TD tasks in block plan |
| Mark Task Complete | ✅ |
| Request Power Block | ✅ (goes to planner for approval) |
| Cross-dept View | ❌ Cannot see ENG or S&T defects |

**Relevant Abbreviations**:
- **OHE** = Overhead Equipment (catenary + contact wire)
- **TSS** = Traction Sub-Station
- **SP** = Sectioning Post
- **SSP** = Sub-Sectioning Post
- **PSI** = Power Supply Installation
- **AT** = Auto Transformer (in AT feeding system)

---

### Role 8: JUNIOR_ENGINEER (Field Staff)
**Designation**: JE (Junior Engineer) — Any department
**Full Form**: **JE** = Junior Engineer
**Description**: Field-level execution officer. Mobile-centric PWA user.

| Permission | Access |
|---|---|
| View Assigned Tasks | ✅ Only tasks assigned to own team |
| View Block Plan (Today) | ✅ Today's block plan for own section |
| Submit Defect Report | ✅ (after supervisor review) |
| Update Task Status | ✅ Real-time status update |
| Upload Field Photos | ✅ Evidence for completed tasks |
| Offline Access | ✅ Last 7-day block plan cached |
| View Historical Data | ❌ No historical access |
| Approve/Reject Plans | ❌ No approval rights |

**Access Channel**: Mobile PWA primarily; desktop login possible

---

### Role 9: READ_ONLY_VIEWER
**Designation**: Statistical Analyst, IRTS Officer (Indian Railway Traffic Service), External Auditor
**Description**: View-only access for reporting and analysis purposes.

| Permission | Access |
|---|---|
| View Block Plans | ✅ Approved plans only |
| View KPI Dashboard | ✅ Division-assigned |
| Download Reports | ✅ Published reports only |
| View Defects | ❌ No access |
| Create/Edit Anything | ❌ No write access |

---

## 3. Permission Matrix

| Permission | SUPER_ADMIN | ZONAL_ADMIN | DIV_PLANNER | SR_OFFICER | SSE_ENG | SSE_S&T | SSE_TD | JE | READ_ONLY |
|---|---|---|---|---|---|---|---|---|---|
| **User Management** | ✅ | Own Zone | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Create Block Plan (AI)** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Approve Block Plan** | ✅ | ❌ | ✅ | Emergency | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Override Block Plan** | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Submit Defect** | ✅ | ❌ | ❌ | ❌ | ENG Only | S&T Only | TD Only | ✅ | ❌ |
| **View All Defects** | ✅ | Zone | Division | Division | Section | Section | Section | Assigned | ❌ |
| **View Block Plans** | ✅ | Zone | Division | Division | Section | Section | Section | Today | Approved |
| **View Map** | ✅ | Zone | Division | Division | Section | Section | Section | Section | Division |
| **View KPI Dashboard** | ✅ | Zone | Division | Division | ❌ | ❌ | ❌ | ❌ | Division |
| **Generate Reports** | ✅ | Zone | Division | Division | Section | Section | Section | ❌ | ❌ |
| **System Config** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit Logs** | ✅ | Zone | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Trigger AI Engine** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Export Data** | ✅ | Zone | Division | Division | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Mobile/Offline Access** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 4. Data Scoping Rules

Beyond role-level access, all queries are **automatically filtered by organizational scope**:

```python
# Pseudo-code for data scoping middleware
def apply_data_scope(user, query):
    if user.role == 'SUPER_ADMIN':
        return query  # No filter
    
    elif user.role == 'ZONAL_ADMIN':
        return query.filter(zone_id=user.zone_id)
    
    elif user.role in ['DIVISIONAL_BLOCK_PLANNER', 'SENIOR_OFFICER']:
        return query.filter(division_id=user.division_id)
    
    elif user.role in ['SSE_ENGINEERING', 'SSE_SIGNAL_TELECOM', 'SSE_TD']:
        return query.filter(
            section_id__in=user.assigned_sections,
            department=user.department
        )
    
    elif user.role == 'JUNIOR_ENGINEER':
        return query.filter(
            task_assigned_to=user.id
        )
```

---

## 5. Special Approval Workflows

### 5.1 Routine Block Plan Approval Chain

```
AI Plan Generated (Draft)
        ↓
SSE reviews & acknowledges (within 24 hrs)
        ↓
DIVISIONAL_BLOCK_PLANNER approves (within 48 hrs)
        ↓ [If weekly plan]
Plan goes ACTIVE — pushed to field teams
```

### 5.2 Emergency Block Approval (Critical Defect)

```
Critical Defect submitted by SSE / JE
        ↓ (within 1 hr)
DIVISIONAL_BLOCK_PLANNER notified — immediate review
        ↓
If approved → Emergency block activated in COA
If escalated → SENIOR_OFFICER (DEN/DSTE/DTDE) for final approval
        ↓
Field team notified via SMS + Push notification
```

### 5.3 Monthly Plan Approval Chain

```
AI generates Monthly Plan (by 25th of each month for next month)
        ↓
All SSEs review (3 days)
        ↓
DIVISIONAL_BLOCK_PLANNER approves
        ↓
SENIOR_OFFICER (DRM) gives final sign-off
        ↓
Plan locked & published
```

---

## 6. MFA (Multi-Factor Authentication) Policy

| Role | MFA Required | Method |
|---|---|---|
| SUPER_ADMIN | ✅ Mandatory | TOTP (Google Authenticator) |
| ZONAL_ADMIN | ✅ Mandatory | TOTP |
| DIVISIONAL_BLOCK_PLANNER | ✅ Mandatory | TOTP or SMS OTP |
| SENIOR_OFFICER | ✅ Mandatory | TOTP or SMS OTP |
| SSE_* | ⚠️ Recommended | SMS OTP |
| JUNIOR_ENGINEER | ❌ Optional | SMS OTP only |
| READ_ONLY_VIEWER | ❌ Optional | — |

**Full Form**: **MFA** = Multi-Factor Authentication | **TOTP** = Time-based One-Time Password | **OTP** = One-Time Password

---

## 7. Session & Token Policy

| Parameter | Value |
|---|---|
| Access Token (JWT) Expiry | 15 minutes |
| Refresh Token Expiry | 7 days |
| Session Invalidated On | Password change, role change, admin force-logout |
| Concurrent Sessions | Max 3 per user (desktop + 2 mobile) |
| Idle Timeout (sensitive roles) | 30 minutes |

---

## 8. Audit Trail Requirements

Every action logged with:
- `user_id`, `role`, `action_type`
- `entity_type` (block_plan, defect, user...)
- `entity_id`
- `before_state` (JSON)
- `after_state` (JSON)
- `timestamp`, `ip_address`, `device_type`
- `reason` (mandatory for overrides and rejections)

Audit logs retained for: **5 years** (per Indian Railways record retention policy)

---

*Document Version: 1.0 | Date: August 2025 | SIH 2025 — MIT-WPU Internal Round*
