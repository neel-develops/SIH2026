# Connectivity & Network Plan
## AI-Powered Automatic Block Planning System (RailSync)
### Problem Statement ID: 26027 | SIH 2025

---

## 1. Overview

Indian Railways operates across 68,000+ route kilometers spanning urban metros, semi-urban towns, and remote rural areas. Field engineers (JE/SSE) often work in areas with limited or intermittent network connectivity. The RailSync must work reliably across all network conditions from 3G to 5G.

---

## 2. Network Environment Analysis

### 2.1 Indian Railways Geography & Connectivity

| Area Type | Coverage | Typical Network | User Type |
|---|---|---|---|
| **Metro Stations** (Mumbai, Delhi, Chennai, Kolkata) | Excellent | 5G / 4G LTE | Control Office, DRM office |
| **Divisional HQ Towns** (Bhusawal, Nagpur, Jabalpur etc.) | Good | 4G LTE | Divisional planners, SSE offices |
| **Wayside Stations** (Intermediate stations) | Moderate | 3G / 4G | Station Master, field SSE |
| **Remote Track Sections** (Jungles, mountains, valleys) | Poor/Patchy | 2G / 3G | JE field staff |
| **Tunnels** (Konkan Railway, mountain sections) | None / GSM-R only | GSM-R / Offline | Field staff |
| **Railway Control Rooms** | Excellent (LAN) | Wired LAN / WiFi | Control officers |

### 2.2 Network Standards Reference

| Standard | Full Form | Typical Speed | Latency | Use in App |
|---|---|---|---|---|
| **2G** | Second Generation Mobile Network (GSM/EDGE) | 50–250 kbps | 300–1000ms | Emergency notifications only |
| **3G** | Third Generation Mobile Network (UMTS/HSPA) | 384 kbps – 7.2 Mbps | 100–500ms | Core PWA features |
| **4G LTE** | Fourth Generation / Long Term Evolution | 10–100 Mbps | 30–100ms | Full dashboard features |
| **5G** | Fifth Generation Mobile Network (NR) | 100 Mbps – 10 Gbps | 1–30ms | Real-time map, live feeds |
| **Wi-Fi** | Wireless Fidelity (IEEE 802.11) | 10–1000 Mbps | <10ms | Desktop browser |
| **LAN** | Local Area Network | 100–1000 Mbps | <1ms | Control room systems |
| **RailWire** | Indian Railways Public Wi-Fi (RailTel) | 10–100 Mbps | Variable | Station-based access |
| **GSM-R** | GSM for Railways (OFC backbone-linked) | Voice/SMS only | — | Emergency fallback |

---

## 3. Multi-Network Adaptive Strategy

### 3.1 Progressive Enhancement Architecture

```
Baseline (2G/Offline):
  → Service worker serves cached block plan
  → Text-only view of today's schedule
  → Queue defect submission for later sync

Core (3G):
  → Full block plan (compressed JSON)
  → Skeleton-loaded charts (after data)
  → Low-resolution map tiles
  → Background sync for offline data

Enhanced (4G):
  → Full dashboard with charts
  → Standard map tiles with route overlay
  → 30-second auto-refresh
  → Push notifications active

Full-Featured (5G / WiFi / LAN):
  → Real-time WebSocket block status
  → High-resolution network map
  → Instant chart rendering
  → Live AI engine status
  → WebRTC briefing (video meeting)
```

### 3.2 Network Detection Logic

```javascript
// Network Adaptive Service - railsync-network-adapter.js

class NetworkAdapter {
  constructor() {
    this.connection = navigator.connection || 
                      navigator.mozConnection || 
                      navigator.webkitConnection;
    this.effectiveType = this.connection?.effectiveType || '4g';
    this.downlink = this.connection?.downlink || 10; // Mbps
    this.rtt = this.connection?.rtt || 100; // ms
    this.saveData = this.connection?.saveData || false;
    
    this.listen();
  }

  listen() {
    this.connection?.addEventListener('change', () => {
      this.effectiveType = this.connection.effectiveType;
      this.emit('network-change', this.getProfile());
    });
  }

  getProfile() {
    // User has explicitly requested data saver
    if (this.saveData) return 'minimal';
    
    switch (this.effectiveType) {
      case 'slow-2g': return 'offline-cache';
      case '2g':      return 'minimal';
      case '3g':      return 'core';
      case '4g':      return 'enhanced';
      default:        return 'full'; // 5G or undetected
    }
  }

  shouldLoadComponent(minNetwork) {
    const profiles = ['offline-cache', 'minimal', 'core', 'enhanced', 'full'];
    return profiles.indexOf(this.getProfile()) >= profiles.indexOf(minNetwork);
  }
}

export const network = new NetworkAdapter();
```

---

## 4. Feature Matrix by Network

| Feature | Offline | 2G (Minimal) | 3G (Core) | 4G (Enhanced) | 5G/LAN (Full) |
|---|---|---|---|---|---|
| **Today's block schedule (cached)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Submit defect (queued)** | ✅ (queued) | ✅ (queued) | ✅ (live) | ✅ (live) | ✅ (live) |
| **Text-only dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **KPI tiles (numbers)** | Cached | ✅ | ✅ | ✅ | ✅ |
| **Bar/Line charts** | Cached | ❌ | ✅ (lazy) | ✅ | ✅ |
| **Gantt block chart** | Cached | ❌ | ✅ | ✅ | ✅ |
| **Low-res railway map** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **High-res vector map** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Weekly block plan** | Last cached | 7-day text | Full | Full | Full |
| **Monthly block plan** | Last cached | ❌ | PDF only | Full | Full |
| **Real-time block status** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **WebSocket live updates** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **AI engine trigger** | ❌ | ❌ | ✅ (async) | ✅ | ✅ |
| **PDF report download** | Cached | ❌ | ✅ | ✅ | ✅ |
| **Push notifications** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Background sync** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5. Performance Optimizations per Network

### 5.1 Asset Optimization

| Technique | Tool | Impact |
|---|---|---|
| **Gzip / Brotli compression** | Nginx | 60–80% smaller JSON/HTML |
| **Image optimization** | Next.js Image (WebP) | 50% smaller images |
| **Code splitting** | Next.js dynamic imports | 40% smaller initial bundle |
| **Tree shaking** | Webpack 5 (built into Next.js) | Remove unused code |
| **CSS purging** | Tailwind CSS production | <10KB CSS bundle |
| **Font subsetting** | Google Fonts (latin subset) | ~30KB vs 300KB |
| **API response compression** | FastAPI GZipMiddleware | 70% smaller API responses |
| **Map tile caching** | Workbox + Leaflet | Tiles cached for offline |

### 5.2 API Strategies

| Strategy | Description | 3G Benefit |
|---|---|---|
| **Pagination** | Max 50 records per API page | Prevents large responses |
| **Partial responses** | `?fields=id,section,status` | 60% smaller payload |
| **Conditional requests** | `If-None-Match` (ETags) | Skip unchanged data |
| **Lazy loading** | Charts load after text | Faster perceived load |
| **API response compression** | Brotli at API level | 5x smaller than uncompressed |
| **Offline-first queries** | Read from IndexedDB first | Instant display |
| **Debounced search** | 500ms debounce on search input | Fewer API calls |

### 5.3 Service Worker Cache Strategy

```javascript
// Cache strategies mapped to resource types
const cacheStrategies = {
  // HTML pages: Network first (always fresh), fallback to cache
  'document': 'NetworkFirst',

  // API: Block plans → Network first with 5s timeout (3G-safe)
  'block-plans-api': {
    strategy: 'NetworkFirst',
    networkTimeoutSeconds: 5,
    cacheName: 'block-plans-cache',
    expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 }
  },

  // API: Defects, non-critical → Stale-while-revalidate (fast display)
  'defects-api': {
    strategy: 'StaleWhileRevalidate',
    cacheName: 'defects-cache',
    expiration: { maxAgeSeconds: 4 * 60 * 60 } // 4hr (sync interval)
  },

  // Map tiles: Cache first (changes rarely)
  'map-tiles': {
    strategy: 'CacheFirst',
    cacheName: 'map-tiles-cache',
    expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 }
  },

  // Static assets (JS, CSS, fonts): Cache first, long-lived
  'static-assets': {
    strategy: 'CacheFirst',
    cacheName: 'static-assets-cache',
    expiration: { maxAgeSeconds: 365 * 24 * 60 * 60 }
  }
};
```

### 5.4 PWA Install & Preload

```
On First Install:
  1. App shell cached (HTML, CSS, JS) — ~500KB
  2. Critical API data fetched (today's block plan) — ~50KB
  3. Low-res map tiles for home section — ~2MB

On Daily Wake-up:
  1. Service worker checks network
  2. If online → Background sync all queued defects
  3. Prefetch next 24h block plan
  4. Update map tiles for scheduled block sections
```

---

## 6. Internal System Connectivity

### 6.1 Railway Network Integration

```
Control Offices & Divisional HQ:
  ├── Primary: RailNet (Indian Railways WAN — MPLS-based)
  │     Connection: 10–100 Mbps dedicated
  │     Systems: COA, BDMS, TMS, SMMS, TDMS
  │
  ├── Secondary: NIC NLD (National Long Distance Network)
  │     Backup WAN connectivity
  │
  └── Internet: RailTel/BSNL Leased Line
        For cloud API calls, external integrations

Field Sections:
  ├── Mobile Data: BSNL/Airtel 4G/3G (roaming)
  ├── RailWire WiFi (at stations only)
  └── GSM-R (emergency fallback, voice/SMS only)
```

**Full Forms**:
- **RailNet** = Indian Railways Intranet (MPLS WAN)
- **MPLS** = Multi-Protocol Label Switching
- **NIC** = National Informatics Centre
- **NLD** = National Long Distance (network)
- **GSM-R** = Global System for Mobile Communications — Railway
- **WAN** = Wide Area Network
- **OFC** = Optical Fibre Cable (Railway backbone)
- **RCIL** = RailTel Corporation of India Limited
- **BSNL** = Bharat Sanchar Nigam Limited

### 6.2 RailSync Deployment Network

```
Internet (Cloudflare CDN)
        │
        ▼ HTTPS (TLS 1.3)
NIC Cloud / AWS India Region (ap-south-1)
  ├── Load Balancer (Layer 7)
  │     │
  │     ├── Kong API Gateway Cluster
  │     │     │
  │     │     ├── Auth Service Pod(s)
  │     │     ├── Block Planning Service Pod(s)
  │     │     ├── AI Engine Service Pod(s)
  │     │     ├── Data Ingestion Service Pod(s)
  │     │     └── Notification Service Pod(s)
  │     │
  │     └── Static Assets → CDN Edge
  │
  ├── Database Cluster (Private Subnet)
  │     ├── PostgreSQL Primary
  │     ├── PostgreSQL Read Replicas (×2)
  │     └── Redis Cluster
  │
  └── Message Broker (Private Subnet)
        └── Kafka Cluster (3 brokers)

External Connections (outbound only):
  ├── → Indian Rail API (indianrailapi.com)
  ├── → IRCTC API (via RapidAPI)
  ├── → MSG91 (SMS gateway)
  ├── → Firebase FCM (push notifications)
  └── → TMS/SMMS/TDMS (RailNet MPLS tunnel)
```

### 6.3 Security Perimeter

```
Internet ──[WAF + DDoS]──▶ Cloudflare ──▶ Load Balancer
                                              │
                           [TLS Termination]  │
                                              ▼
                                    API Gateway (Kong)
                                    [Auth + Rate Limit]
                                              │
                                    [Internal mTLS] ──▶ Microservices
                                                              │
                                              [Private VPC] ──▶ Databases
```

---

## 7. SMS & Push Notification Connectivity

### 7.1 SMS Gateway (Field Staff Alerts)

| Provider | Primary | Backup |
|---|---|---|
| **MSG91** | Primary SMS gateway | — |
| **2Factor.in** | — | Backup SMS |
| **Airtel Business SMS** | — | Tertiary |

SMS is used as the last-resort notification channel for JEs in areas with no internet but 2G voice/SMS coverage.

### 7.2 Push Notification Architecture

```
Event triggered (e.g., Block Approved)
        │
        ▼
Notification Service (Node.js)
        │
        ├──▶ Firebase FCM ──▶ Android PWA / Android App
        ├──▶ Web Push API ──▶ Chrome/Edge on Desktop & iOS PWA
        └──▶ SMS (MSG91) ──▶ Feature phones / 2G users
```

### 7.3 Notification Retry Logic

```javascript
// If push notification fails (user offline):
// 1. Retry after 5 minutes (×3)
// 2. Fallback to SMS if all push retries fail
// 3. Log notification in database for in-app display on next login
// 4. Mark notification as "delivered" only on confirmed receipt

const notificationQueue = {
  maxRetries: 3,
  retryIntervals: [5 * 60, 15 * 60, 60 * 60], // seconds
  fallbackToSMS: true,
  persistInDB: true
};
```

---

## 8. RailWire Integration (Station Wi-Fi)

**RailWire** (by RailTel) provides public Wi-Fi at 6,000+ railway stations. Field staff at stations can connect to RailWire for faster data access.

```
Station Wi-Fi (RailWire) → 10–100 Mbps → Full 4G feature set
  - Auto-detects when connected
  - Triggers background sync of all cached data
  - Pre-downloads next 7-day block plan
  - Uploads any pending offline defect reports
```

---

## 9. Data Usage Estimates

| Feature | Data per Session | 3G Viability |
|---|---|---|
| App shell (first install) | ~500 KB | ✅ ~10 sec on 3G |
| Weekly block plan (JSON) | ~50 KB | ✅ < 1 sec |
| Monthly block plan (JSON) | ~200 KB | ✅ < 5 sec |
| KPI dashboard (charts) | ~100 KB | ✅ < 3 sec |
| Railway map (low-res tiles) | ~2 MB | ⚠️ ~40 sec (cache after) |
| PDF report download | ~500 KB | ✅ ~10 sec |
| Push notification | ~1 KB | ✅ |
| Defect submission | ~10 KB | ✅ |

**Target**: Full PWA usable within **< 5 seconds** on 3G for logged-in users with cached data.

---

*Document Version: 1.0 | Date: August 2025 | SIH 2025 — MIT-WPU Internal Round*
