/**
 * i18n.js
 * -------
 * Multi-Language UI Translation Dictionary & Text-to-Speech Language Configurations.
 * Supports: English ('en') and Hindi ('hi')
 */

export const TRANSLATIONS = {
  en: {
    systemTitle: "Hospital Queue System",
    hospitalName: "City General Hospital",
    patientPortal: "Patient Check-In Portal",
    staffDashboard: "Doctor & Staff Desk Dashboard",
    mlStudio: "Hospital ML Analytics Studio",
    dbInspector: "SQL Database Inspector",
    kioskMonitor: "Waiting Room Kiosk Monitor",
    hospitalTvDisplay: "Hospital TV Queue Display",
    
    // Hospital Departments & Locations
    cat_consultation: "General Consultation (OPD)",
    cat_pharmacy: "Pharmacy & Medicine",
    cat_laboratory: "Pathology & Lab Tests",
    cat_radiology: "Radiology & Imaging",
    cat_emergency: "Emergency Triage",
    cat_billing: "Billing & Cashier",
    cat_all: "All Hospital Departments",

    // Statuses
    status_scheduled: "SCHEDULED",
    status_checked_in: "CHECKED IN",
    status_serving: "SERVING NOW",
    status_waiting: "WAITING IN LINE",
    status_completed: "COMPLETED",
    status_transferred: "TRANSFERRED",
    status_cancelled: "CANCELLED",
    status_no_show: "NO SHOW",

    // Units
    unit_yrs: "yrs",
    unit_min: "min",

    // Roles & Auth
    adminRole: "Admin:",
    patientRole: "Patient:",
    logoutBtn: "Logout",
    accountLogin: "Account Login",
    accountSignIn: "Account Sign In",
    registerAccount: "Register Account",
    signIn: "Sign In",
    emailAddress: "Email Address",
    password: "Password",
    fullName: "Patient Full Name",
    accountRole: "Account Role & Access Level",
    patientConsumerOption: "Patient / Consumer (Check-in & View Queue)",
    staffAdminOption: "Hospital Staff / Doctor (Desk Controls)",
    assignedDept: "Assigned Department / Location",
    quickDemoPatient: "Quick Patient Login (Demo)",
    quickDemoAdmin: "Quick Staff Admin Login (Demo)",
    authRequiredTitle: "Authentication Required",
    authRequiredDesc: "Please sign in to your Staff Admin or Patient account to continue.",
    restrictedAccess: "Restricted Access",
    staffAdminRequired: "Staff Admin Required",
    consumerOnly: "Consumer View",
    accessDeniedDesc: "Access to this dashboard is strictly protected for authorized personnel.",
    switchToDesk: "Switch to Doctor Desk Dashboard",
    authenticateBtn: "Authenticate as Staff Admin",

    // Patient Portal Tabs
    instantWalkin: "Instant Walk-In Ticket",
    bookSlot: "Book Time Slot",
    myAppointments: "My Appointments",
    appointmentHistory: "Appointment History",
    
    // Intake Form Labels
    patientNameLabel: "Patient Full Name",
    patientAgeGenderLabel: "Patient Age & Gender",
    medicalDeptLabel: "Medical Department / Location",
    primarySymptomLabel: "Primary Symptom / Medical Reason",
    preExistingLabel: "Pre-Existing Chronic Conditions / Risk Factors",
    urgencyLabel: "Urgency / Triage Level",
    
    // Form Options & Buttons
    routineCheckup: "Routine Checkup",
    standardOrder: "Standard Queue Order",
    emergencyCase: "Emergency Case",
    priorityJump: "Priority Queue Jump",
    getTicketBtn: "Get Digital Walk-In Ticket",
    bookSlotBtn: "Reserve Appointment Slot",
    
    // Symptoms
    symptomGeneral: "OPD General Consultation",
    symptomCardiac: "Chest Pain / Cardiac Symptoms",
    symptomFever: "High Fever / Acute Infection",
    symptomTrauma: "Fracture / Physical Injury",
    symptomAsthma: "Shortness of Breath / Asthma",
    symptomFollowup: "Prescription Refill / Follow-up",
    symptomLab: "Pathology Blood / Sample Collection",

    // Risk Factors
    riskNone: "None / Healthy Baseline",
    riskDiabetes: "Diabetes Mellitus",
    riskBP: "High Blood Pressure / Hypertension",
    riskHeart: "Heart Disease / Cardiac History",
    riskLung: "Asthma / Chronic Lung Disease",
    
    // Ticket Pass & Kiosk Labels
    livePassTitle: "Live Queue Token Pass",
    nowServing: "NOW SERVING AT DESKS",
    waitingQueue: "WAITING QUEUE",
    pos: "Pos",
    tokenId: "Token ID",
    patientDemographics: "Patient Demographics",
    deptCategory: "Department & Location",
    symptomRisk: "Clinical Symptom & Risk",
    aiComplexity: "AI Clinical Complexity",
    estWait: "Est. Total Wait (AI Predicted)",
    scanQrHint: "Scan QR code at desk scanner when your token number is called",
    scanToJoin: "Scan to Join Line",
    
    // Header & Badges
    statusOnline: "System Online",
    statusOffline: "Offline",
    testAudioBtn: "Test Audio Announcement",
    reAnnounceBtn: "Re-Announce",

    // Gender
    male: "Male",
    female: "Female",
    other: "Other",

    // Walk-in subtitle
    walkinSubtitle: "City General Hospital — Instant Ticket Token & Real-Time Wait Tracker",

    // Book Slot Section
    bookSlotTitle: "Book Pre-Scheduled Time Slot",
    bookSlotSubtitle: "Reserve a future appointment slot. Scan code upon arrival to merge into priority queue line.",
    departmentLabel: "Department / Location",
    appointmentDateLabel: "Appointment Date",
    selectTimeSlotLabel: "Select Available Time Slot",
    appointmentConfirmed: "APPOINTMENT CONFIRMED",
    checkInJoinLiveNow: "Check In & Join Live Line Now",

    // My Appointments Section
    myActiveAppointments: "My Active Appointments",
    activeAptsSubtitle: "Upcoming and in-progress hospital visits",
    enterCodePlaceholder: "Enter Code (e.g. APT-9482)",
    checkInBtn: "Check In",
    noActiveAptsMsg: "No active or upcoming appointments found.",
    reserveTimeSlotNow: "Reserve Time Slot Now",
    checkInJoinLine: "Check In & Join Line",
    mergedToken: "Merged (Token",
    activeInLiveQueue: "Active in Live Queue",
    dateLabel: "Date",
    timeLabel: "Time",

    // Appointment History Section
    historySubtitle: "All previous, completed, transferred, or cancelled hospital visits",
    noHistoryMsg: "No past appointment history found.",
    ePrescriptionLabel: "Doctor Prescription & Clinical Notes:",
    finalVisitStatus: "Final Visit Status",
    reservedSlotLabel: "Reserved Slot",
    tokenLabel: "Token",

    // Ticket Pass Section
    currentStatus: "Current Status",
    complexityMultiplier: "Case Complexity Multiplier",
    ePrescriptionAttached: "E-Prescription Attached",
    transferredFrom: "Transferred from",
    riskLabel: "Risk",
    printPassBtn: "Print / Save PDF Pass",
    printRxBtn: "Print Prescription Slip",
    officialQueuePass: "Official Patient Queue Pass",
    officialRxSlip: "Official Doctor Prescription & Visit Slip",
    presentedAtDesk: "Please present this slip or digital QR code at your assigned counter when your token is called.",
    hospitalFooterNote: "City General Hospital • Non-transferable official patient record",

    // Kiosk TV
    kioskTitle: "Patient Queue Monitor",
    kioskSubtitle: "Hospital Waiting Room Queue & Patient Calling System",
    deskCounterAssigned: "DESK COUNTER ASSIGNED",
    allDesksAvailable: "All Desks Available",
    callingNextShortly: "Calling next ticket shortly...",
    noWaitingPatients: "No Waiting Patients",
    queueClearMsg: "Queue is clear at present.",
    patientNameCol: "Patient Name",
    deptCol: "Dept / Location",
    estWaitCol: "Est Wait",
    waitingQueueNote: "Real-time sequence order calculated by AI priority algorithm.",
    servingNote: "Please proceed to your assigned doctor desk when your number is displayed below.",
    liveTvDisplay: "LIVE TV DISPLAY",
    exitTv: "Exit TV",
    fullscreenTv: "Fullscreen TV",
    doctorDesk: "Doctor Desk",

    // Staff Page
    patientsWaiting: "Patients Waiting",
    currentlyServing: "Currently Serving",
    bookedSlotsToday: "Booked Slots Today",
    activeDoctorDesks: "Active Doctor Desks",
    deskOperations: "Desk Operations",
    departmentCallControl: "Department Call Control",
    callNextTicket: "Call Next Ticket",
    nowServingAt: "Now Serving at Desks:",
    transferPrescribe: "Transfer / Prescribe",
    completeBtn: "Complete Visit",
    reAnnounce: "Re-Announce",
    launchTvDisplayBtn: "Launch TV Display",
    scheduledAppointmentsToday: "Scheduled Appointments for Today",
    transferModalTitle: "Inter-Department Transfer & E-Prescription",
    selectTargetDept: "Select Target Destination Department",
    rxDoctorNotes: "Doctor Clinical Prescription & Routing Notes",
    confirmTransferBtn: "Confirm Transfer & Route Patient",
    cancelBtn: "Cancel",
    inDeptQueue: "In Queue",
    atDesks: "At Desks",
    todayApts: "Appointments",
    noServingTickets: "No patient currently being served at this desk.",
    noWaitingInDept: "No patients waiting in this department queue.",
  },
  hi: {
    systemTitle: "अस्पताल कतार प्रणाली",
    hospitalName: "सिटी जनरल अस्पताल",
    patientPortal: "मरीज़ चेक-इन पोर्टल",
    staffDashboard: "डॉक्टर एवं स्टाफ डेस्क",
    mlStudio: "अस्पताल एमएल स्टूडियो",
    dbInspector: "डेटाबेस निरीक्षक",
    kioskMonitor: "प्रतीक्षा कक्ष कियोस्क टीवी",
    hospitalTvDisplay: "अस्पताल टीवी कतार डिस्प्ले",

    // Hospital Departments & Locations
    cat_consultation: "सामान्य परामर्श ओपीडी (Consultation)",
    cat_pharmacy: "फार्मेसी एवं दवा वितरण (Pharmacy)",
    cat_laboratory: "पैथोलॉजी एवं रक्त जांच लैब (Lab)",
    cat_radiology: "रेडियोलॉजी एवं इमेजिंग (Radiology)",
    cat_emergency: "आपातकालीन ट्राइएज (Emergency)",
    cat_billing: "बिलिंग एवं कैश काउंटर (Billing)",
    cat_all: "सभी अस्पताल विभाग",

    // Statuses
    status_scheduled: "निर्धारित",
    status_checked_in: "चेक-इन पूर्ण",
    status_serving: "वर्तमान में सेवारत",
    status_waiting: "कतार में प्रतीक्षारत",
    status_completed: "संपन्न",
    status_transferred: "स्थानांतरित",
    status_cancelled: "रद्द",
    status_no_show: "अनुपस्थित",

    // Units
    unit_yrs: "वर्ष",
    unit_min: "मिनट",

    // Roles & Auth
    adminRole: "प्रशासक:",
    patientRole: "मरीज़:",
    logoutBtn: "लॉग आउट",
    accountLogin: "खाता साइन इन",
    accountSignIn: "खाते में साइन इन करें",
    registerAccount: "नया खाता बनाएं",
    signIn: "साइन इन करें",
    emailAddress: "ईमेल पता",
    password: "पासवर्ड",
    fullName: "मरीज़ का पूरा नाम",
    accountRole: "खाता प्रकार एवं अनुमति",
    patientConsumerOption: "मरीज़ / उपभोक्ता (टोकन लें एवं कतार देखें)",
    staffAdminOption: "अस्पताल स्टाफ / डॉक्टर (डेस्क नियंत्रण)",
    assignedDept: "आवंटित विभाग / स्थान",
    quickDemoPatient: "मरीज़ डेमो लॉगिन",
    quickDemoAdmin: "स्टाफ एडमिन डेमो लॉगिन",
    authRequiredTitle: "प्रमाणीकरण आवश्यक है",
    authRequiredDesc: "पोर्टल का उपयोग करने के लिए कृपया अपने स्टाफ या मरीज़ खाते में लॉगिन करें।",
    restrictedAccess: "प्रतिबंधित पहुंच",
    staffAdminRequired: "स्टाफ एडमिन आवश्यक है",
    consumerOnly: "मरीज़ पोर्टल",
    accessDeniedDesc: "यह अनुभाग केवल अधिकृत अस्पताल कर्मियों के लिए सुरक्षित है।",
    switchToDesk: "डॉक्टर डेस्क पर जाएं",
    authenticateBtn: "स्टाफ एडमिन के रूप में सत्यापित करें",

    // Patient Portal Tabs
    instantWalkin: "तत्काल वॉक-इन टोकन",
    bookSlot: "समय स्लॉट बुक करें",
    myAppointments: "मेरे अपॉइंटमेंट्स",
    appointmentHistory: "अपॉइंटमेंट इतिहास",
    
    // Intake Form Labels
    patientNameLabel: "मरीज़ का पूरा नाम",
    patientAgeGenderLabel: "मरीज़ की आयु एवं लिंग",
    medicalDeptLabel: "चिकित्सा विभाग / स्थान",
    primarySymptomLabel: "मुख्य लक्षण / बीमारी का कारण",
    preExistingLabel: "पूर्व-विद्यमान पुरानी बीमारियाँ / जोखिम",
    urgencyLabel: "आपातकालीन स्तर (Triage)",
    
    // Form Options & Buttons
    routineCheckup: "सामान्य जांच",
    standardOrder: "मानक कतार क्रम",
    emergencyCase: "आपातकालीन (इमरजेंसी)",
    priorityJump: "प्राथमिकता कतार",
    getTicketBtn: "डिजिटल वॉक-इन टोकन प्राप्त करें",
    bookSlotBtn: "अपॉइंटमेंट स्लॉट बुक करें",

    // Symptoms
    symptomGeneral: "ओपीडी सामान्य परामर्श",
    symptomCardiac: "सीने में दर्द / हृदय लक्षण",
    symptomFever: "तेज़ बुख़ार / संक्रमण",
    symptomTrauma: "अस्थि भंग / चोट",
    symptomAsthma: "साँस लेने में तकलीफ़ / दमा",
    symptomFollowup: "दवा रीफिल / अनुवर्ती जांच",
    symptomLab: "पैथोलॉजी रक्त एवं सैंपल जांच",

    // Risk Factors
    riskNone: "कोई नहीं / सामान्य",
    riskDiabetes: "मधुमेह (शुगर)",
    riskBP: "उच्च रक्तचाप (बीपी)",
    riskHeart: "हृदय रोग इतिहास",
    riskLung: "दमा / फेफड़ों की बीमारी",
    
    // Ticket Pass & Kiosk Labels
    livePassTitle: "लाइव कतार टोकन पास",
    nowServing: "वर्तमान में सेवारत टोकन",
    waitingQueue: "प्रतीक्षारत कतार",
    pos: "स्थान",
    tokenId: "टोकन नंबर",
    patientDemographics: "मरीज़ का विवरण",
    deptCategory: "विभाग एवं स्थान",
    symptomRisk: "लक्षण एवं जोखिम",
    aiComplexity: "एआई जटिलता गुणांक",
    estWait: "अनुमानित प्रतीक्षा समय (AI)",
    scanQrHint: "टोकन नंबर बुलाए जाने पर डेस्क स्कैनर पर क्यूआर कोड स्कैन करें",
    scanToJoin: "कतार में शामिल होने हेतु स्कैन करें",
    
    // Header & Badges
    statusOnline: "सिस्टम ऑनलाइन",
    statusOffline: "ऑफलाइन",
    testAudioBtn: "ऑडियो घोषणा परीक्षण करें",
    reAnnounceBtn: "पुनः घोषणा करें",

    // Gender
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",

    // Walk-in subtitle
    walkinSubtitle: "सिटी जनरल अस्पताल — तत्काल टोकन एवं रियल-टाइम प्रतीक्षा ट्रैकर",

    // Book Slot Section
    bookSlotTitle: "पूर्व-निर्धारित समय स्लॉट बुक करें",
    bookSlotSubtitle: "भविष्य का अपॉइंटमेंट स्लॉट रिज़र्व करें। आगमन पर कोड स्कैन करके प्राथमिकता कतार में शामिल हों।",
    departmentLabel: "विभाग / स्थान",
    appointmentDateLabel: "अपॉइंटमेंट की तारीख़",
    selectTimeSlotLabel: "उपलब्ध समय स्लॉट चुनें",
    appointmentConfirmed: "अपॉइंटमेंट कन्फ़र्म",
    checkInJoinLiveNow: "चेक इन करें एवं लाइव कतार में शामिल हों",

    // My Appointments Section
    myActiveAppointments: "मेरे सक्रिय अपॉइंटमेंट्स",
    activeAptsSubtitle: "आगामी एवं प्रगतिरत अस्पताल विज़िट",
    enterCodePlaceholder: "कोड दर्ज करें (जैसे APT-9482)",
    checkInBtn: "चेक इन",
    noActiveAptsMsg: "कोई सक्रिय या आगामी अपॉइंटमेंट नहीं मिला।",
    reserveTimeSlotNow: "अभी समय स्लॉट बुक करें",
    checkInJoinLine: "चेक इन करें एवं कतार में जुड़ें",
    mergedToken: "मर्ज (टोकन",
    activeInLiveQueue: "लाइव कतार में सक्रिय",
    dateLabel: "तारीख़",
    timeLabel: "समय",

    // Appointment History Section
    historySubtitle: "सभी पिछले, पूर्ण, स्थानांतरित या रद्द अस्पताल विज़िट",
    noHistoryMsg: "कोई पिछला अपॉइंटमेंट इतिहास नहीं मिला।",
    ePrescriptionLabel: "डॉक्टर प्रिस्क्रिप्शन एवं क्लिनिकल नोट्स:",
    finalVisitStatus: "अंतिम विज़िट स्थिति",
    reservedSlotLabel: "रिज़र्व स्लॉट",
    tokenLabel: "टोकन",

    // Ticket Pass Section
    currentStatus: "वर्तमान स्थिति",
    complexityMultiplier: "केस जटिलता गुणांक",
    ePrescriptionAttached: "ई-प्रिस्क्रिप्शन संलग्न",
    transferredFrom: "से स्थानांतरित",
    riskLabel: "जोखिम",
    printPassBtn: "पास प्रिंट करें / PDF सेव करें",
    printRxBtn: "प्रिस्क्रिप्शन पर्ची प्रिंट करें",
    officialQueuePass: "आधिकारिक मरीज़ कतार पास",
    officialRxSlip: "आधिकारिक डॉक्टर प्रिस्क्रिप्शन पर्ची",
    presentedAtDesk: "टोकन नंबर बुलाए जाने पर यह पर्ची अथवा डिजिटल क्यूआर कोड संबंधित काउंटर पर दिखाएं।",
    hospitalFooterNote: "सिटी जनरल अस्पताल • अहस्तांतरणीय आधिकारिक मरीज़ रिकॉर्ड",

    // Kiosk TV
    kioskTitle: "मरीज़ कतार मॉनिटर",
    kioskSubtitle: "अस्पताल प्रतीक्षा कक्ष कतार एवं मरीज़ कॉलिंग सिस्टम",
    deskCounterAssigned: "डेस्क काउंटर आवंटित",
    allDesksAvailable: "सभी डेस्क उपलब्ध",
    callingNextShortly: "अगला टोकन शीघ्र ही बुलाया जाएगा...",
    noWaitingPatients: "कोई प्रतीक्षारत मरीज़ नहीं",
    queueClearMsg: "कतार वर्तमान में ख़ाली है।",
    patientNameCol: "मरीज़ का नाम",
    deptCol: "विभाग / स्थान",
    estWaitCol: "अनुमानित प्रतीक्षा",
    waitingQueueNote: "AI प्राथमिकता एल्गोरिदम द्वारा गणना किया गया रीयल-टाइम क्रम।",
    servingNote: "आपका नंबर प्रदर्शित होने पर कृपया अपने आवंटित डॉक्टर डेस्क पर जाएँ।",
    liveTvDisplay: "लाइव टीवी डिस्प्ले",
    exitTv: "टीवी बंद करें",
    fullscreenTv: "फुलस्क्रीन टीवी",
    doctorDesk: "डॉक्टर डेस्क",

    // Staff Page
    patientsWaiting: "प्रतीक्षारत मरीज़",
    currentlyServing: "वर्तमान में सेवारत",
    bookedSlotsToday: "आज के बुक स्लॉट",
    activeDoctorDesks: "सक्रिय डॉक्टर डेस्क",
    deskOperations: "डेस्क संचालन",
    departmentCallControl: "विभाग कॉल नियंत्रण",
    callNextTicket: "अगला टोकन बुलाएं",
    nowServingAt: "डेस्क पर सेवारत मरीज़:",
    transferPrescribe: "अन्य विभाग में भेजें / दवा लिखें",
    completeBtn: "विज़िट संपन्न करें",
    reAnnounce: "पुनः घोषणा करें",
    launchTvDisplayBtn: "टीवी डिस्प्ले शुरू करें",
    scheduledAppointmentsToday: "आज के निर्धारित अपॉइंटमेंट्स",
    transferModalTitle: "विभाग स्थानांतरण एवं ई-प्रिस्क्रिप्शन",
    selectTargetDept: "गंतव्य विभाग चुनें",
    rxDoctorNotes: "डॉक्टर का परामर्श एवं दवा नोट्स",
    confirmTransferBtn: "स्थानांतरण की पुष्टि करें",
    cancelBtn: "रद्द करें",
    inDeptQueue: "कतार में",
    atDesks: "डेस्क पर",
    todayApts: "अपॉइंटमेंट्स",
    noServingTickets: "वर्तमान में इस डेस्क पर कोई मरीज़ सेवारत नहीं है।",
    noWaitingInDept: "इस विभाग की कतार में कोई मरीज़ प्रतीक्षारत नहीं है।",
  }
};

export const t = (key, lang = "en") => {
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || (TRANSLATIONS.en && TRANSLATIONS.en[key]) || key;
};

/**
 * Returns translated label for hospital departments / locations.
 */
export const getCategoryLabel = (catId, lang = "en") => {
  if (!catId) return "";
  const key = `cat_${String(catId).toLowerCase()}`;
  const translated = t(key, lang);
  return translated !== key ? translated : String(catId).toUpperCase();
};

/**
 * Returns translated label for ticket / appointment status.
 */
export const getStatusLabel = (status, lang = "en") => {
  if (!status) return "";
  const key = `status_${String(status).toLowerCase()}`;
  const translated = t(key, lang);
  return translated !== key ? translated : String(status).toUpperCase();
};
