import { User, Defect, BlockWindow, BlockPlan, KPISnapshot, Department } from '../../types';

export const SEEDED_USERS: User[] = [
  {
    id: 'usr-01',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@railnet.gov.in',
    role: 'DIVISIONAL_BLOCK_PLANNER',
    department: 'ENG',
    scope: { zone: 'Central Railway', division: 'Mumbai', sections: ['CSTM-PUNE', 'KYN-KSRA'] },
    designation: 'Divisional Block Planning Officer, Kalyan'
  },
  {
    id: 'usr-02',
    name: 'Anil Deshmukh',
    email: 'anil.deshmukh@railnet.gov.in',
    role: 'SENIOR_OFFICER',
    scope: { zone: 'Central Railway', division: 'Mumbai', sections: ['CSTM-PUNE', 'KYN-KSRA', 'KYN-PNE'] },
    designation: 'Divisional Railway Manager (DRM), Mumbai'
  },
  {
    id: 'usr-03',
    name: 'Vikram Singh',
    email: 'vikram.singh@railnet.gov.in',
    role: 'SSE_ENGINEERING',
    department: 'ENG',
    scope: { zone: 'Central Railway', division: 'Mumbai', sections: ['KYN-KSRA'] },
    designation: 'Senior Section Engineer (Track), Kalyan'
  },
  {
    id: 'usr-04',
    name: 'Priya Kulkarni',
    email: 'priya.kulkarni@railnet.gov.in',
    role: 'SSE_SIGNAL_TELECOM',
    department: 'SNT',
    scope: { zone: 'Central Railway', division: 'Mumbai', sections: ['BY-DR', 'DR-KYN'] },
    designation: 'Senior Section Engineer (Signal), Dadar'
  },
  {
    id: 'usr-05',
    name: 'Manoj Verma',
    email: 'manoj.verma@railnet.gov.in',
    role: 'SSE_TRACTION_DISTRIBUTION',
    department: 'TD',
    scope: { zone: 'Central Railway', division: 'Mumbai', sections: ['KSRA-LNL'] },
    designation: 'Senior Section Engineer (OHE/TD), Igatpuri'
  },
  {
    id: 'usr-06',
    name: 'Sandeep Patil',
    email: 'sandeep.patil@railnet.gov.in',
    role: 'JUNIOR_ENGINEER',
    department: 'SNT',
    scope: { zone: 'Central Railway', division: 'Mumbai', sections: ['KYN-KSRA'] },
    designation: 'Junior Engineer (Field PWA), Kasara'
  },
  {
    id: 'usr-07',
    name: 'Dr. Alok Chatterjee',
    email: 'alok.chatterjee@railnet.gov.in',
    role: 'SUPER_ADMIN',
    scope: { zone: 'Indian Railways', division: 'All Divisions', sections: ['All Zones'] },
    designation: 'Director General (Infrastructure), Railway Board'
  },
  {
    id: 'usr-08',
    name: 'Sunita Rao',
    email: 'sunita.rao@railnet.gov.in',
    role: 'ZONAL_ADMIN',
    scope: { zone: 'Central Railway', division: 'All Divisions', sections: ['CR Zone Corridor'] },
    designation: 'Chief Operations Manager (COM), Central Railway'
  },
  {
    id: 'usr-09',
    name: 'Inspector K. S. Nair',
    email: 'ks.nair@railnet.gov.in',
    role: 'READ_ONLY_VIEWER',
    scope: { zone: 'Central Railway', division: 'Mumbai', sections: ['CSTM-PUNE'] },
    designation: 'Safety Audit Inspector, Central Control Room'
  }
];


// CSTM-PUNE Corridor Stations & Coordinates
export const STATIONS = [
  { code: 'CSTM', name: 'Chhatrapati Shivaji Maharaj Terminus', km: 0.0, lat: 18.9400, lng: 72.8353 },
  { code: 'BY', name: 'Byculla', km: 4.0, lat: 18.9744, lng: 72.8331 },
  { code: 'DR', name: 'Dadar', km: 9.0, lat: 19.0180, lng: 72.8430 },
  { code: 'KYN', name: 'Kalyan Junction', km: 54.0, lat: 19.2437, lng: 73.1355 },
  { code: 'KSRA', name: 'Kasara', km: 121.0, lat: 19.6457, lng: 73.4839 },
  { code: 'LNL', name: 'Lonavala', km: 128.0, lat: 18.7548, lng: 73.4063 },
  { code: 'PUNE', name: 'Pune Junction', km: 192.0, lat: 18.5289, lng: 73.8744 },
];

export const BLOCK_SECTIONS = [
  'CSTM-BY',
  'BY-DR',
  'DR-KYN',
  'KYN-KSRA',
  'KSRA-LNL',
  'LNL-PUNE'
];

// Helper to generate 290 realistic defects
function generateDefects(): Defect[] {
  const defects: Defect[] = [];
  const depts: Department[] = ['ENG', 'SNT', 'TD'];
  const assetTypes = {
    ENG: ['Rail fracture', 'Worn out turnout switch', 'Sleepers ballast distress', 'Track alignment defect', 'Bridge expansion joint wear'],
    SNT: ['Point machine failure', 'Track circuit malfunction', 'Axle counter error', 'Signal LED unit fault', 'OFC line cable degradation'],
    TD: ['OHE dropper snap', 'Catenary wire wear', 'Substation transformer isolation', 'Neutral section flashover', 'Isolator contact oxidation']
  };

  const sections = [
    { name: 'CSTM-BY', kmStart: 0, kmEnd: 4, lat: 18.95, lng: 72.83 },
    { name: 'BY-DR', kmStart: 4, kmEnd: 9, lat: 18.99, lng: 72.84 },
    { name: 'DR-KYN', kmStart: 9, kmEnd: 54, lat: 19.12, lng: 72.98 },
    { name: 'KYN-KSRA', kmStart: 54, kmEnd: 121, lat: 19.44, lng: 73.31 },
    { name: 'KSRA-LNL', kmStart: 121, kmEnd: 128, lat: 19.20, lng: 73.44 },
    { name: 'LNL-PUNE', kmStart: 128, kmEnd: 192, lat: 18.64, lng: 73.64 },
  ];

  let idCounter = 4000;
  for (let i = 0; i < 290; i++) {
    idCounter++;
    const dept = depts[i % 3];
    const source = dept === 'ENG' ? 'TMS' : dept === 'SNT' ? 'SMMS' : 'TDMS';
    const sec = sections[i % sections.length];
    const kmPost = +(sec.kmStart + Math.random() * (sec.kmEnd - sec.kmStart)).toFixed(3);
    const asset = assetTypes[dept][Math.floor(Math.random() * assetTypes[dept].length)];
    
    // Criticality logic
    let criticality: Defect['criticality'] = 'LOW';
    let priorityScore = Math.floor(Math.random() * 45) + 30;
    let tsrImposed = false;
    let daysOverdue = 0;

    if (i < 25) { // 25 critical
      criticality = 'CRITICAL';
      priorityScore = Math.floor(Math.random() * 15) + 85;
      tsrImposed = true;
      daysOverdue = Math.floor(Math.random() * 8) + 2;
    } else if (i < 80) { // 55 high
      criticality = 'HIGH';
      priorityScore = Math.floor(Math.random() * 15) + 70;
      daysOverdue = Math.floor(Math.random() * 5);
      if (Math.random() > 0.5) tsrImposed = true;
    } else if (i < 180) { // 100 medium
      criticality = 'MEDIUM';
      priorityScore = Math.floor(Math.random() * 20) + 50;
    }

    let status: Defect['status'] = 'OPEN';
    if (i >= 148 && i < 240) status = 'SCHEDULED';
    else if (i >= 240 && i < 275) status = 'COMPLETED';
    else if (i >= 275) status = 'IN_PROGRESS';

    const reportedDate = new Date(Date.now() - (Math.floor(Math.random() * 15) + 1) * 86400000).toISOString();
    const dueByDate = new Date(Date.now() + (Math.floor(Math.random() * 10) - 2) * 86400000).toISOString();

    defects.push({
      id: `${source}-2026-${idCounter}`,
      source,
      department: dept,
      assetType: asset,
      description: `${asset} detected at KM ${kmPost} on line 1 requiring urgent maintenance block window.`,
      sectionId: 'CSTM-PUNE',
      blockSection: sec.name,
      kmPost,
      lat: sec.lat + (Math.random() - 0.5) * 0.08,
      lng: sec.lng + (Math.random() - 0.5) * 0.08,
      reportedAt: reportedDate,
      dueBy: dueByDate,
      daysOverdue,
      estimatedDurationMin: (Math.floor(Math.random() * 4) + 2) * 30, // 60 to 180 mins
      criticality,
      priorityScore,
      tsrImposed,
      status,
      reportedBy: `SSE/${dept}/${sec.name.split('-')[0]}`
    });
  }

  return defects;
}

export const SEEDED_DEFECTS: Defect[] = generateDefects();

// Helper to generate 30 days of train-free Block Windows from COA timetable
export const SEEDED_BLOCK_WINDOWS: BlockWindow[] = Array.from({ length: 30 }).flatMap((_, dayIdx) => {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + dayIdx);
  baseDate.setHours(1, 0, 0, 0); // Night block window 01:00 to 04:30

  return BLOCK_SECTIONS.map((sec, secIdx) => {
    const start = new Date(baseDate.getTime() + secIdx * 1800000);
    const end = new Date(start.getTime() + 12600000); // 3.5 hours window
    return {
      id: `WIN-2026-D${dayIdx + 1}-S${secIdx}`,
      blockSection: sec,
      start: start.toISOString(),
      end: end.toISOString(),
      trafficDensityScore: Math.floor(Math.random() * 20) + 10,
      conflictingTrains: [
        { trainNo: '12127', name: 'Intercity Express', scheduledAt: new Date(end.getTime() + 900000).toISOString() }
      ]
    };
  });
});

// Draft & Approved Plans
export const SEEDED_PLANS: BlockPlan[] = [
  {
    id: 'BLK-2026-WK12',
    horizon: 'WEEKLY',
    sectionId: 'CSTM-PUNE',
    generatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    solveTimeSec: 38.2,
    status: 'APPROVED',
    metrics: {
      defectsScheduled: 42,
      defectsTotal: 45,
      combinedBlockRatePct: 45,
      downtimeReductionPct: 38,
      utilisationPct: 88,
      projectedAAI: 91.5
    },
    approvals: [
      { role: 'SSE_ENGINEERING', user: 'Vikram Singh', action: 'APPROVED', at: new Date(Date.now() - 6.5 * 86400000).toISOString() },
      { role: 'DIVISIONAL_BLOCK_PLANNER', user: 'Rajesh Sharma', action: 'APPROVED', at: new Date(Date.now() - 6 * 86400000).toISOString() },
      { role: 'SENIOR_OFFICER', user: 'Anil Deshmukh', action: 'APPROVED', reason: 'Verified zero disruption to express corridor.', at: new Date(Date.now() - 5.5 * 86400000).toISOString() }
    ],
    blocks: [
      {
        id: 'BLK-2026-0325-01',
        planId: 'BLK-2026-WK12',
        blockType: 'COMBINED',
        departments: ['ENG', 'SNT', 'TD'],
        blockSection: 'KYN-KSRA',
        kmFrom: 54.0,
        kmTo: 68.5,
        start: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString(),
        end: new Date(Date.now() - 2 * 86400000 + 14400000).toISOString(),
        defectIds: ['TMS-2026-4001', 'SMMS-2026-4002', 'TDMS-2026-4003'],
        status: 'COMPLETED',
        utilisationPct: 92,
        aiConfidence: 0.96,
        aiRationale: 'Clustered 3 critical defects within 14.5 km; shared power isolation reduced downtime by 2.5 hours.',
        manuallyOverridden: false
      },
      {
        id: 'BLK-2026-0325-02',
        planId: 'BLK-2026-WK12',
        blockType: 'ENGINEERING',
        departments: ['ENG'],
        blockSection: 'DR-KYN',
        kmFrom: 12.0,
        kmTo: 22.0,
        start: new Date(Date.now() - 1 * 86400000 + 7200000).toISOString(),
        end: new Date(Date.now() - 1 * 86400000 + 14400000).toISOString(),
        defectIds: ['TMS-2026-4004'],
        status: 'COMPLETED',
        utilisationPct: 85,
        aiConfidence: 0.91,
        aiRationale: 'Night track tamping window allocated during freight clearance.',
        manuallyOverridden: false
      }
    ]
  },
  {
    id: 'BLK-2026-WK13',
    horizon: 'WEEKLY',
    sectionId: 'CSTM-PUNE',
    generatedAt: new Date().toISOString(),
    solveTimeSec: 41.5,
    status: 'PENDING_APPROVAL',
    metrics: {
      defectsScheduled: 48,
      defectsTotal: 52,
      combinedBlockRatePct: 43,
      downtimeReductionPct: 37,
      utilisationPct: 85,
      projectedAAI: 91.2
    },
    approvals: [
      { role: 'DIVISIONAL_BLOCK_PLANNER', user: 'Rajesh Sharma', action: 'APPROVED', at: new Date().toISOString() }
    ],
    blocks: [
      {
        id: 'BLK-2026-0331-01',
        planId: 'BLK-2026-WK13',
        blockType: 'COMBINED',
        departments: ['ENG', 'TD', 'SNT'],
        blockSection: 'KYN-KSRA',
        kmFrom: 42.0,
        kmTo: 58.0,
        start: new Date(Date.now() + 86400000 + 3600000).toISOString(),
        end: new Date(Date.now() + 86400000 + 14400000).toISOString(),
        defectIds: ['TMS-2026-4005', 'TDMS-2026-4006', 'SMMS-2026-4007'],
        status: 'PENDING_APPROVAL',
        utilisationPct: 94,
        aiConfidence: 0.98,
        aiRationale: 'Combined 3 cross-department tasks within 16 km during midnight 3.5h freight pause.',
        manuallyOverridden: false
      },
      {
        id: 'BLK-2026-0331-02',
        planId: 'BLK-2026-WK13',
        blockType: 'SIGNAL',
        departments: ['SNT'],
        blockSection: 'BY-DR',
        kmFrom: 5.0,
        kmTo: 8.5,
        start: new Date(Date.now() + 2 * 86400000 + 7200000).toISOString(),
        end: new Date(Date.now() + 2 * 86400000 + 12600000).toISOString(),
        defectIds: ['SMMS-2026-4008'],
        status: 'PENDING_APPROVAL',
        utilisationPct: 80,
        aiConfidence: 0.88,
        aiRationale: 'Point machine replacement scheduled prior to morning suburban peak.',
        manuallyOverridden: true,
        overrideReason: 'Shifted start by 30 mins to allow late running Deccan Queen to clear section.'
      },
      {
        id: 'BLK-2026-0331-03',
        planId: 'BLK-2026-WK13',
        blockType: 'POWER',
        departments: ['TD'],
        blockSection: 'LNL-PUNE',
        kmFrom: 130.0,
        kmTo: 145.0,
        start: new Date(Date.now() + 3 * 86400000 + 3600000).toISOString(),
        end: new Date(Date.now() + 3 * 86400000 + 10800000).toISOString(),
        defectIds: ['TDMS-2026-4009'],
        status: 'PENDING_APPROVAL',
        utilisationPct: 86,
        aiConfidence: 0.94,
        aiRationale: 'Substation OHE isolator maintenance window.',
        manuallyOverridden: false
      }
    ]
  }
];

// KPI Data
export const SEEDED_KPI: KPISnapshot = {
  aaiCurrent: 91.2,
  aaiBaseline: 82.0,
  aaiTarget: 91.0,
  blocksToday: 4,
  blocksThisWeek: 28,
  openDefects: 148,
  overdueDefects: 23,
  criticalDefects: 9,
  pendingApprovals: 2,
  utilisationPct: 85,
  combinedBlockRatePct: 43,
  aaiTrend: Array.from({ length: 90 }).map((_, idx) => {
    const d = new Date(Date.now() - (89 - idx) * 86400000);
    // Smooth transition from 82.0 to 91.2 with slight realistic noise
    const progress = idx / 89;
    const base = 82.0 + progress * 9.2;
    const noise = (Math.sin(idx * 0.5) * 0.4) + (Math.random() * 0.3 - 0.15);
    return {
      date: d.toISOString().split('T')[0],
      value: +(Math.min(93.5, Math.max(81.5, base + noise))).toFixed(1)
    };
  }),
  defectsByDept: [
    { department: 'ENG', open: 74, overdue: 12 },
    { department: 'SNT', open: 42, overdue: 7 },
    { department: 'TD', open: 32, overdue: 4 }
  ]
};
