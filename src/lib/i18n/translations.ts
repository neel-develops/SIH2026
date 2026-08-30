export type Language = 'EN' | 'HI';

export const translations = {
  EN: {
    // Navigation & Layout
    maintenanceHub: 'Maintenance Hub',
    techOps: 'Technical Operations',
    generateAIPlan: 'Generate AI Plan',
    dashboard: 'Dashboard',
    blockPlans: 'Block Plans',
    defectsQueue: 'Defects Queue',
    gisMap: 'GIS Network Map',
    analytics: 'Analytics & Reports',
    mobilePWA: 'Mobile Field PWA',
    adminRBAC: 'Admin RBAC',
    support: 'Support',
    signOut: 'Sign Out',
    net: 'NET:',

    // Dashboard
    assetAvailability: 'Asset Availability (AAI)',
    blocksScheduledToday: 'Blocks Scheduled Today',
    totalOpenDefects: 'Total Open Defects',
    overdueMaintenance: 'Overdue Maintenance',
    pendingApprovals: 'Pending Approvals',
    blockUtilisation: 'Block Utilisation',
    next24hBlocks: 'Next 24 Hours Scheduled Blocks',
    coaSynced: 'COA Timetable Synced',
    criticalDefectQueue: 'Critical Defect Queue (XGBoost Priority)',
    viewAllDefects: 'View All',
    aaiTrendTitle: '90-Day Asset Availability Index (AAI %) Trend',
    workloadHeatmap: 'Workload Heatmap (Section × Week)',
    maintHoursDemanded: 'Maintenance hours demanded per corridor section',

    // Signature Strip
    signatureImpactTitle: 'RailSync Signature Impact — Cross-Department Block Consolidation',
    reset3Blocks: 'Reset 3 Blocks View',
    simulateAIConsolidation: 'Simulate AI Consolidation',
    beforeRailSync: 'BEFORE RailSync (Legacy BDMS)',
    beforeSub: '3 Blocks = 9.5 Hrs Total',
    afterRailSync: 'AFTER RailSync (AI Combined Block)',
    afterSub: '1 Block = 3.5 Hrs (−37%)',

    // Block Plans View
    blockScheduleTitle: 'Block Schedule & Gantt Management',
    approvalChain: 'Approval Chain',
    genNewAIPlan: '+ Generate New AI Plan',
    defectsCovered: 'Defects Covered',
    combinedBlockRate: 'Combined Block Rate',
    downtimeReduction: 'Downtime Reduction',
    projectedAAI: 'Projected AAI',
    legend: 'LEGEND:',
    export: 'Export',
    allDepts: 'All Departments',
    allSections: 'All Sections',

    // Defects View
    unifiedDefectQueue: 'Unified Defect Queue (TMS + SMMS + TDMS)',
    openDefectsSub: '148 Open Defects · 23 Overdue · Sorted by XGBoost Priority Score',
    searchPlaceholder: 'Search defect ID or asset...',
    reportDefect: 'Report Defect',
    department: 'Department:',
    severity: 'Severity:',
    includeSelectedInPlan: 'Include Selected in Plan',

    // Reports View
    analyticsTitle: 'Performance Analytics & Executive Reports',
    analyticsSub: 'Asset Availability Index (AAI), Department Compliance & Combined Block Efficiency',
    exportPDF: 'Export Official PDF',
    exportExcel: 'Export Excel (.xlsx)',
    execImpactSlide: 'Before vs. After RailSync — Executive Impact Slide',
    simulationData: '6 Months Simulation Data',
    plannedVsCompleted: 'Planned vs. Completed Maintenance Blocks by Section',
    defectDistribution: 'Defect Distribution by Department (ENG / S&T / TD)',

    // Field PWA View
    fieldPWATitle: 'RailSync FIELD PWA',
    quickReportDefect: 'Quick Report Defect (GPS + QR)',
    todaysBlocks: "Today's Scheduled Blocks (KYN–KSRA)",
    startWork: 'Start Maintenance Block Work',
    completeBlock: 'Complete Block & Log Restoration',
    assignedDefects: 'My Assigned Defects',
    offlineTray: 'Offline IndexedDB Tray',

    // Admin Users View
    rbacTitle: 'RBAC User & Access Control Management',
    rbacSub: 'Role-Based Access Control (9 Indian Railways Designations) · Scope Cascading',
    provisionUser: 'Provision New User',
    editScope: 'Edit Scope',
    totpActive: 'TOTP ACTIVE',
  },
  HI: {
    // Navigation & Layout
    maintenanceHub: 'रखरखाव केंद्र',
    techOps: 'तकनीकी संचालन',
    generateAIPlan: 'एआई योजना बनाएं',
    dashboard: 'डैशबोर्ड',
    blockPlans: 'ब्लॉक योजनाएं',
    defectsQueue: 'त्रुटि सूची',
    gisMap: 'जीआईएस नेटवर्क मानचित्र',
    analytics: 'विश्लेषण व रिपोर्ट',
    mobilePWA: 'मोबाइल क्षेत्र PWA',
    adminRBAC: 'व्यवस्थापक अधिकार (RBAC)',
    support: 'सहायता',
    signOut: 'साइन आउट',
    net: 'नेटवर्क:',

    // Dashboard
    assetAvailability: 'संपत्ति उपलब्धता सूचकांक (AAI)',
    blocksScheduledToday: 'आज निर्धारित ब्लॉक',
    totalOpenDefects: 'कुल लंबित त्रुटियां',
    overdueMaintenance: 'अतिदेय रखरखाव',
    pendingApprovals: 'लंबित स्वीकृतियां',
    blockUtilisation: 'ब्लॉक उपयोगिता',
    next24hBlocks: 'अगले 24 घंटों के निर्धारित ब्लॉक',
    coaSynced: 'COA समय सारणी सिंक',
    criticalDefectQueue: 'गंभीर त्रुटि प्राथमिकता सूची (XGBoost)',
    viewAllDefects: 'सभी देखें',
    aaiTrendTitle: '90-दिवसीय संपत्ति उपलब्धता ट्रेंड (AAI %)',
    workloadHeatmap: 'कार्यभार हीटमैप (खंड × सप्ताह)',
    maintHoursDemanded: 'प्रति कॉरिडोर अनुभाग आवश्यक रखरखाव घंटे',

    // Signature Strip
    signatureImpactTitle: 'RailSync हस्ताक्षर प्रभाव — अंतर-विभागीय ब्लॉक समेकन',
    reset3Blocks: '3 पृथक ब्लॉक देखें',
    simulateAIConsolidation: 'एआई समेकन का अनुकरण करें',
    beforeRailSync: 'RailSync से पहले (पुराना तंत्र)',
    beforeSub: '3 ब्लॉक = 9.5 घंटे कुल डाउनटाइम',
    afterRailSync: 'RailSync के बाद (एआई संयुक्त ब्लॉक)',
    afterSub: '1 ब्लॉक = 3.5 घंटे (−37% डाउनटाइम)',

    // Block Plans View
    blockScheduleTitle: 'ब्लॉक अनुसूची और गैंट प्रबंधन',
    approvalChain: 'अनुमोदन श्रृंखला',
    genNewAIPlan: '+ नई एआई योजना बनाएं',
    defectsCovered: 'कवर की गई त्रुटियां',
    combinedBlockRate: 'संयुक्त ब्लॉक दर',
    downtimeReduction: 'डाउनटाइम में कमी',
    projectedAAI: 'अनुमानित AAI',
    legend: 'संकेत विवरण:',
    export: 'निर्यात करें',
    allDepts: 'सभी विभाग',
    allSections: 'सभी अनुभाग',

    // Defects View
    unifiedDefectQueue: 'एकीकृत त्रुटि सूची (TMS + SMMS + TDMS)',
    openDefectsSub: '148 खुली त्रुटियां · 23 अतिदेय · XGBoost प्राथमिकता क्रमबद्ध',
    searchPlaceholder: 'त्रुटि आईडी या संपत्ति खोजें...',
    reportDefect: 'त्रुटि दर्ज करें',
    department: 'विभाग:',
    severity: 'गंभीरता:',
    includeSelectedInPlan: 'चयनित त्रुटियों को योजना में शामिल करें',

    // Reports View
    analyticsTitle: 'प्रदर्शन विश्लेषण और कार्यकारी रिपोर्ट',
    analyticsSub: 'संपत्ति उपलब्धता (AAI), विभागीय अनुपालन और संयुक्त ब्लॉक दक्षता',
    exportPDF: 'आधिकारिक पीडीएफ निर्यात',
    exportExcel: 'एक्सेल (.xlsx) निर्यात',
    execImpactSlide: 'RailSync से पहले बनाम बाद — कार्यकारी प्रभाव',
    simulationData: '6 माह सिमुलेशन डेटा',
    plannedVsCompleted: 'अनुभाग अनुसार नियोजित बनाम पूर्ण ब्लॉक',
    defectDistribution: 'विभाग अनुसार त्रुटि वितरण (ENG / S&T / TD)',

    // Field PWA View
    fieldPWATitle: 'RailSync फील्ड PWA',
    quickReportDefect: 'त्वरित त्रुटि रिपोर्ट (GPS + QR)',
    todaysBlocks: 'आज के निर्धारित ब्लॉक (KYN–KSRA)',
    startWork: 'रखरखाव ब्लॉक कार्य प्रारंभ करें',
    completeBlock: 'कार्य पूर्ण करें और पुनर्बहाली दर्ज करें',
    assignedDefects: 'मेरी सौंपी गई त्रुटियां',
    offlineTray: 'ऑफलाइन IndexedDB ट्रे',

    // Admin Users View
    rbacTitle: 'RBAC उपयोगकर्ता और पहुँच नियंत्रण',
    rbacSub: 'भूमिका आधारित पहुँच नियंत्रण (9 भारतीय रेलवे पद) · क्षेत्राधिकार संवर्धन',
    provisionUser: 'नया उपयोगकर्ता जोड़ें',
    editScope: 'क्षेत्र संपादित करें',
    totpActive: 'TOTP सक्रिय',
  }
};

export function useTranslation(lang: Language) {
  return translations[lang] || translations.EN;
}
