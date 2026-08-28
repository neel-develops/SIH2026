# API Integration & Dataset Guide
## AI-Powered Automatic Block Planning System (AABPS)
### Problem Statement ID: 26027 | SIH 2025

---

## 1. Available External APIs

### 1.1 Indian Rail API (indianrailapi.com)

**Base URL**: `https://indianrailapi.com/api/v2/`
**Authentication**: API Key in header
**Free Tier**: Available

| Endpoint | Data | Use in AABPS |
|---|---|---|
| `/TrainBetweenStation/apikey/{key}/From/{from}/To/{to}` | Trains between stations | Identify trains passing through maintenance section |
| `/TrainSchedule/apikey/{key}/TrainNumber/{train_no}` | Full timetable of a train | Exact timing through each station |
| `/LiveTrainStatus/apikey/{key}/TrainNumber/{train_no}/Date/{date}` | Real-time train position | Current train position for block safety check |
| `/TrainDetails/apikey/{key}/TrainNumber/{train_no}` | Train metadata | Train type (Express, Goods, etc.) for prioritization |
| `/AllStation/apikey/{key}` | All station codes and names | Build station/section master database |

**Integration Pattern**:
```javascript
// Fetch all trains in a section for block window analysis
async function getTrainsInSection(fromStation, toStation, date) {
  const response = await axios.get(
    `https://indianrailapi.com/api/v2/TrainBetweenStation/apikey/${API_KEY}/From/${fromStation}/To/${toStation}`,
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  // Filter by date and extract timing
  return response.data.Trains.map(train => ({
    trainNumber: train.TrainNumber,
    trainName: train.TrainName,
    departureTime: train.DepartureTime,
    arrivalTime: train.ArrivalTime,
    trainType: train.TrainType, // 'Express', 'Passenger', 'Goods'
    priority: mapTrainTypeToPriority(train.TrainType)
  }));
}
```

---

### 1.2 IRCTC API via RapidAPI

**Base URL**: `https://irctc1.p.rapidapi.com/api/v3/`
**Authentication**: RapidAPI Key in headers
**Free Tier**: 100 req/month (Basic plan), upgrade available

| Endpoint | Data | Use in AABPS |
|---|---|---|
| `/trainsList` | All trains | Station-to-station train listing |
| `/getTrainRunningStatus` | Live train position | Real-time corridor availability |
| `/getTrainSchedule` | Train timetable | Station-wise timing for block windows |
| `/getFareDetail` | Train class fare | (Not used in AABPS) |
| `/getStationByName` | Station info | Station master lookup |

**Integration Pattern**:
```javascript
const options = {
  method: 'GET',
  url: 'https://irctc1.p.rapidapi.com/api/v3/getTrainRunningStatus',
  params: { trainNo: '12951', startingDj: 'MMCT' },
  headers: {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'irctc1.p.rapidapi.com'
  }
};

const response = await axios.request(options);
// Returns: current km post, delay, next station ETA
```

**Rate Limiting Strategy (for free tier)**:
```javascript
// Cache train schedules for 24 hours (they rarely change)
// Only poll live status for trains within ±2 hours of a planned block
// Use batch requests to minimize API calls
```

---

### 1.3 Apify IRCTC Train Data Scraper

**URL**: `https://apify.com/scrapingshark/irctc-train-data-scraper`
**Authentication**: Apify API Token
**Free Tier**: $5/month compute units (sufficient for periodic scraping)

**Use Case**: Batch scraping of train timetable data not available via direct API.

```javascript
// Trigger Apify actor run for section data
const run = await apifyClient.actor('scrapingshark/irctc-train-data-scraper').call({
  route: 'CSTM-PUNE',
  trainType: ['Express', 'Passenger', 'Goods'],
  outputFormat: 'JSON'
});

// Wait for completion and download dataset
const dataset = await apifyClient.dataset(run.defaultDatasetId).listItems();
// Returns train schedules for the specified route
```

**Best Practice**: Run scraper weekly (Sunday night) to refresh timetable data. Cache in PostgreSQL `train_timetable` table.

---

### 1.4 Open Government Data (data.gov.in)

**URL**: `https://data.gov.in/catalog/indian-railway-train-time-table`
**Authentication**: API Key (free registration)

| Dataset | Format | Size | Use |
|---|---|---|---|
| Indian Railway Complete Train Time Table | CSV/JSON | ~50MB | Offline timetable database |
| Railway Station List (Complete) | CSV | ~500KB | Station master data |
| Indian Railway Route Network | GeoJSON | ~5MB | Map visualization of railway lines |
| Passenger Traffic Data (Zone-wise) | CSV | ~1MB | Traffic density for block impact scoring |

**Download & Integration**:
```bash
# Download static timetable dataset (run weekly via cron)
curl "https://api.data.gov.in/resource/train-time-table?api-key=${DATAGOV_KEY}&format=json&limit=10000" \
  -o /data/train_timetable.json

# Load into PostgreSQL
python scripts/load_timetable.py --file /data/train_timetable.json
```

---

### 1.5 NTES (National Train Enquiry System)

**URL**: `https://enquiry.indianrail.gov.in/mntes/`
**Note**: NTES does not provide an official public API. Use Apify scraper or Indian Rail API for live data.

For prototype purposes, the Data Ingestion Service mocks NTES data using the static timetable from data.gov.in with a simulated delay engine.

---

### 1.6 RailYatri API (Unofficial, widely used)

**URL**: `https://www.railyatri.in/`
**Note**: No official API. Can use Indian Rail API endpoints which source similar data.

**Workaround for SIH prototype**: Use `indianrailapi.com` which has official data partnership with CRIS (Centre for Railway Information Systems).

---

## 2. Mock Data Strategy (for SIH Prototype)

Since access to TMS, SMMS, TDMS, COA, BDMS production data is restricted, the prototype uses **mock data generators** that simulate realistic data.

### 2.1 Mock TMS Data (Track Defects)

```python
# scripts/mock_data/generate_tms_defects.py

import random
from datetime import datetime, timedelta
import uuid

DEFECT_TYPES_ENG = [
    'Rail Fracture', 'Weld Joint Failure', 'Gauge Deviation > 6mm',
    'Cross Level Defect', 'Track Geometry Failure', 'Sleeper Cracking',
    'Ballast Void', 'Corrugation', 'Bridge Inspection Overdue',
    'TSR Imposed - Track Settlement', 'Drain Choked', 'Level Crossing Wear'
]

SECTIONS_CSTM_PUNE = [
    ('CSTM', 'KYN', 40.2), ('KYN', 'KJT', 22.1), ('KJT', 'IGP', 16.5),
    ('IGP', 'LNL', 25.8), ('LNL', 'PUNE', 11.2)
]

def generate_defects(count=200):
    defects = []
    for _ in range(count):
        section = random.choice(SECTIONS_CSTM_PUNE)
        km_from = random.uniform(0, section[2])
        reported = datetime.now() - timedelta(days=random.randint(0, 90))
        days_overdue = random.randint(-10, 45)  # Negative = not yet due
        
        defects.append({
            'id': str(uuid.uuid4()),
            'source_system': 'TMS',
            'section': f'{section[0]}-{section[1]}',
            'km_post': round(km_from, 3),
            'defect_type': random.choice(DEFECT_TYPES_ENG),
            'reported_date': reported.isoformat(),
            'due_date': (reported + timedelta(days=30)).isoformat(),
            'days_overdue': days_overdue,
            'department': 'ENG',
            'criticality': None,  # To be assigned by AI
            'status': random.choice(['Open', 'Open', 'Open', 'Scheduled'])  # Weighted
        })
    return defects
```

### 2.2 Mock SMMS Data (Signal Defects)

```python
DEFECT_TYPES_ST = [
    'Signal Lamp Failure', 'Point Machine Failure', 'Relay Defect',
    'Track Circuit Failure', 'OFC Cable Cut', 'Interlocking Failure',
    'Axle Counter Failure', 'CCTV Offline', 'Gate Signal Defective',
    'Phone Failure at Gate', 'Block Instrument Defect'
]
# Similar generator pattern to TMS
```

### 2.3 Mock COA Block Windows

```python
def generate_block_windows(section, date_range_days=7):
    """Generate realistic train-gap windows for a section"""
    windows = []
    for day_offset in range(date_range_days):
        date = datetime.now() + timedelta(days=day_offset)
        
        # Peak hours (avoid): 6am-10am, 4pm-10pm
        # Low-traffic windows (ideal): 11pm-4am, 10am-2pm
        
        windows.extend([
            {
                'section': section,
                'date': date.date().isoformat(),
                'window_start': f"{date.date()} 23:00",
                'window_end': f"{date.date()} 03:30",  # Next day
                'duration_hours': 4.5,
                'train_count': random.randint(2, 5),
                'window_type': 'Night Block (Primary)',
                'score': 0.85
            },
            {
                'section': section,
                'date': date.date().isoformat(),
                'window_start': f"{date.date()} 11:00",
                'window_end': f"{date.date()} 13:00",
                'duration_hours': 2.0,
                'train_count': random.randint(8, 15),
                'window_type': 'Afternoon Block (Secondary)',
                'score': 0.45
            }
        ])
    return windows
```

---

## 3. Data Pipeline Architecture

### 3.1 Ingestion Schedule

| Source | Frequency | Method | Table |
|---|---|---|---|
| Indian Rail API | Daily at 2:00 AM | Celery beat task | `train_timetable` |
| IRCTC API (Live) | Every 30 min (day), 1 hr (night) | Polling | `live_train_positions` |
| Apify Scraper | Weekly Sunday 1:00 AM | Apify trigger | `train_timetable` (refresh) |
| data.gov.in | Monthly 1st at 3:00 AM | Batch download | Reference tables |
| TMS (Mock/Live) | Every 4 hours | REST API / CSV | `defects` |
| SMMS (Mock/Live) | Every 4 hours | REST API / CSV | `defects` |
| TDMS (Mock/Live) | Every 4 hours | REST API / CSV | `defects` |
| COA (Mock/Live) | Real-time | REST API | `block_windows` |

### 3.2 Data Quality Rules

```python
# Validation applied during ingestion
VALIDATION_RULES = {
    'defect': {
        'required_fields': ['section', 'defect_type', 'reported_date', 'department'],
        'section_format': r'^[A-Z]{2,6}-[A-Z]{2,6}$',
        'km_range': (0, 5000),
        'department_values': ['ENG', 'S&T', 'TD'],
        'date_not_future': True,
        'no_duplicates_on': ['source_system', 'external_defect_id']
    },
    'block_window': {
        'required_fields': ['section', 'window_start', 'window_end'],
        'end_after_start': True,
        'max_duration_hours': 12
    }
}
```

---

## 4. API Rate Limiting & Cost Management

| API | Free Tier Limit | Strategy for SIH |
|---|---|---|
| indianrailapi.com | Check their plan | Cache all responses 24 hrs |
| IRCTC (RapidAPI) | 100 req/month basic | Use only for live block safety check |
| Apify | $5/month free | Weekly scrape only |
| data.gov.in | Generous (gov't API) | Monthly batch download |
| MSG91 (SMS) | 100 SMS free trial | Only for demo alerts |
| Firebase FCM | Free up to generous limits | Use for all push notifications |

---

## 5. Sample API Response Transformations

### 5.1 Transform Train Schedule for Block Window Calculation

```python
def extract_block_windows_from_schedule(trains: list, section_from: str, section_to: str) -> list:
    """
    Given a list of trains with their timings at section_from and section_to stations,
    identify gaps ≥ 1 hour between consecutive trains = maintenance windows.
    """
    # Get departure times from section_from for all trains
    timings = []
    for train in trains:
        schedule = train.get('Schedule', [])
        for stop in schedule:
            if stop['StationCode'] == section_from:
                timings.append({
                    'train': train['TrainNumber'],
                    'type': train.get('TrainType', 'Express'),
                    'time': parse_time(stop['DepartureTime'])
                })
    
    # Sort by time
    timings.sort(key=lambda x: x['time'])
    
    # Find gaps
    windows = []
    for i in range(len(timings) - 1):
        gap_minutes = (timings[i+1]['time'] - timings[i]['time']).seconds / 60
        if gap_minutes >= 60:  # At least 1 hour gap
            windows.append({
                'from': section_from,
                'to': section_to,
                'window_start': timings[i]['time'].strftime('%H:%M'),
                'window_end': timings[i+1]['time'].strftime('%H:%M'),
                'duration_minutes': int(gap_minutes),
                'usable_minutes': int(gap_minutes * 0.75),  # 25% safety margin
                'preceding_train': timings[i]['train'],
                'following_train': timings[i+1]['train'],
                'window_score': calculate_window_score(gap_minutes, timings[i]['type'])
            })
    
    return windows


def calculate_window_score(gap_minutes: float, following_train_type: str) -> float:
    """Score window quality: longer gap + lower priority following train = higher score"""
    duration_score = min(gap_minutes / 240, 1.0)  # Max score at 4 hours
    
    priority_factor = {
        'Rajdhani': 0.2,
        'Express': 0.5,
        'Passenger': 0.7,
        'Goods': 0.9,
        'Special': 0.6
    }.get(following_train_type, 0.5)
    
    return round(duration_score * priority_factor, 2)
```

---

## 6. GeoJSON Railway Network Data

**Source**: OpenStreetMap + data.gov.in railway GeoJSON

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "section_id": "CR-CSTM-KYN",
        "from_station": "CSTM",
        "to_station": "KYN",
        "zone": "CR",
        "division": "Mumbai",
        "track_type": "Multiple (6 lines)",
        "electrification": "25kV AC",
        "length_km": 40.2
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [72.8347, 18.9402],
          [73.1850, 19.0490]
        ]
      }
    }
  ]
}
```

Used in: Leaflet.js map component to render railway sections with block status color coding.

---

*Document Version: 1.0 | Date: August 2025 | SIH 2025 — MIT-WPU Internal Round*
