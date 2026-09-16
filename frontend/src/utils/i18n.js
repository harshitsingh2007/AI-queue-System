/**
 * i18n.js
 * -------
 * Multi-Language UI Translation Dictionary & Text-to-Speech Language Configurations.
 * Supports: English ('en') and Hindi ('hi')
 */

export const TRANSLATIONS = {
  en: {
    systemTitle: "Hospital Queue System",
    patientPortal: "Patient Check-In Portal",
    staffDashboard: "Doctor & Staff Desk Dashboard",
    mlStudio: "Hospital ML Analytics Studio",
    dbInspector: "SQL Database Inspector",
    kioskMonitor: "Waiting Room Kiosk Monitor",
    
    // Patient Portal Tabs & Quick Actions
    instantWalkin: "Instant Walk-In Ticket",
    getTokenNow: "Get Token Now",
    bookSlot: "Book Time Slot",
    scheduleVisit: "Schedule Visit",
    myAppointments: "My Appointments",
    viewAndManage: "View & Manage",
    appointmentHistory: "Appointment History",
    pastRecords: "Past Records",
    
    // Intake Form Labels
    patientNameLabel: "Patient Full Name",
    patientAgeGenderLabel: "Patient Age & Gender",
    medicalDeptLabel: "Medical Department",
    serviceDeptLabel: "Service Department",
    primarySymptomLabel: "Primary Symptom / Medical Reason",
    symptomLabel: "Primary Symptom / Medical Reason",
    customSymptomLabel: "Describe Your Symptom / Health Concern",
    customSymptomPlaceholder: "Describe your symptom / reason (e.g. Swelling in ankle, severe earache)",
    preExistingLabel: "Pre-Existing Chronic Conditions / Risk Factors",
    urgencyLabel: "Urgency / Triage Level",
    priorityTriageLabel: "Priority & Triage Level",
    
    // Form Options & Buttons
    routineCase: "Routine Consultation",
    routineCheckup: "Routine Checkup",
    standardOrder: "Standard Queue Order",
    emergencyCase: "Emergency Case",
    priorityJump: "Priority Queue Jump",
    getTicketBtn: "Get Digital Walk-In Ticket",
    bookSlotBtn: "Reserve Appointment Slot",
    
    // Symptoms
    symptomGeneral: "General Checkup & Consultation",
    symptomCardiac: "Severe Chest Pain / Heart Discomfort",
    symptomFever: "High Fever, Viral Flu & Chills",
    symptomTrauma: "Fracture, Sprain & Physical Trauma",
    symptomAsthma: "Shortness of Breath / Asthma Attack",
    symptomFollowup: "Prescription Refill & Follow-up Visit",
    symptomLab: "Pathology Blood & Diagnostic Tests",
    symptom_general_checkup: "General Checkup & Consultation",
    symptom_fever_flu: "High Fever, Viral Flu & Chills",
    symptom_cough_cold: "Cough, Cold & Sore Throat",
    symptom_chest_pain_severe: "Severe Chest Pain / Heart Discomfort",
    symptom_breathing_difficulty: "Shortness of Breath / Asthma Attack",
    symptom_headache_migraine: "Severe Headache & Migraine",
    symptom_stomach_pain: "Abdominal Pain, Acidity & Vomiting",
    symptom_fracture_trauma: "Fracture, Sprain & Physical Trauma",
    symptom_skin_allergy: "Skin Rash, Allergy & Itching",
    symptom_pediatric_care: "Pediatric & Child Health Care",
    symptom_ortho_joint_pain: "Back Pain & Joint Stiffness",
    symptom_eye_infection: "Eye Infection, Redness & Vision Issue",
    symptom_ent_issue: "Ear, Nose & Throat (ENT) Pain",
    symptom_dental_pain: "Dental Pain & Toothache",
    symptom_diabetes_care: "Diabetes & Blood Sugar Checkup",
    symptom_bp_hypertension: "High Blood Pressure & Dizziness",
    symptom_urinary_issue: "Urinary Infection & Kidney Discomfort",
    symptom_women_health: "Women's Health & Gynecology",
    symptom_followup_refill: "Prescription Refill & Follow-up Visit",
    symptom_lab_blood_test: "Pathology Blood & Diagnostic Tests",
    symptom_other_custom: "✏️ Other Symptom (Type Your Own)",

    // Risk Factors
    riskNone: "None / Healthy Baseline",
    riskDiabetes: "Diabetes Mellitus",
    riskBP: "High Blood Pressure / Hypertension",
    riskHeart: "Heart Disease / Cardiac History",
    riskLung: "Asthma / Chronic Lung Disease",
    risk_none: "None / Healthy Baseline",
    risk_diabetes: "Diabetes Mellitus",
    risk_hypertension: "High Blood Pressure / Hypertension",
    risk_cardiac_history: "Heart Disease / Cardiac History",
    risk_asthma_copd: "Asthma / Chronic Lung Disease",
    risk_kidney_disease: "Chronic Kidney Disease",
    risk_elderly: "Senior Citizen (65+ years)",
    risk_pregnancy: "Pregnancy / Maternity",
    
    // Ticket Pass & Kiosk Labels
    livePassTitle: "Live Queue Token Pass",
    nowServing: "NOW SERVING AT DESKS",
    waitingQueue: "WAITING QUEUE",
    pos: "Pos",
    tokenId: "Token ID",
    patientDemographics: "Patient Demographics",
    deptCategory: "Department & Category",
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
    accountLogin: "Account Login",

    // Feature Cards
    feature1Title: "Live Queue Status",
    feature1Desc: "Track your token in real-time and plan your time better.",
    feature2Title: "Smart Notifications",
    feature2Desc: "Get notified when your turn is near or it is your turn.",
    feature3Title: "Transparent System",
    feature3Desc: "Fair queue management with real-time updates for everyone.",
    feature4Title: "Your Data is Safe",
    feature4Desc: "We ensure complete privacy and security of your information.",

    // Gender
    male: "Male",
    female: "Female",
    other: "Other",

    // Family & Dependent Member Switcher
    bookingFor: "Patient / Family Member:",
    addMember: "+ Add Member",
    manageFamily: "Manage Family",
    relation_self: "Self",
    relation_child: "Child",
    relation_spouse: "Spouse",
    relation_parent: "Parent",
    relation_sibling: "Sibling",
    relation_other: "Dependent",
    addMemberTitle: "Add Family Member / Dependent",
    addMemberDesc: "Register family members to easily take walk-in tickets and book appointments on their behalf.",
    relationshipLabel: "Relationship",
    memberNameLabel: "Full Legal Name",
    memberAgeLabel: "Age",
    memberGenderLabel: "Gender",
    saveMemberBtn: "Save Member",
    removeMemberBtn: "Remove",
    switchMemberHint: "Switch profile to take tickets or view passes for each family member",
    activePassFor: "Pass for",
    allMembers: "All Profiles",
    profileSwitchedMsg: "Switched active profile to",
    familyProfiles: "Family Profiles",
    familyTabTitle: "Family Profiles",
    familyTabSub: "Manage Dependents",
    familyHeaderTitle: "Family Member & Dependent Profiles",
    familyHeaderDesc: "Easily register children, spouse, or elderly parents for one-tap queue tickets and scheduled clinic visits.",
    addNewProfileCard: "Add Family Member",
    addNewProfileCardDesc: "Register a dependent to book appointments and take hospital tokens on their behalf.",
    primaryAccountHolder: "Primary Account Holder",
    quickBookWalkin: "Book Walk-In",
    quickBookAppointment: "Book Appointment",
    memberCardSubtitle: "Registered Family Dependent",
    deleteMemberConfirm: "Are you sure you want to remove this family member profile?",

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

    // Live Queue Stepper Journey
    stepQueueTracker: "Live Queue Journey",
    stepOf: "Step",
    stepCheckedIn: "Checked In",
    stepInLine: "In Line",
    stepConsultation: "Consultation Ready",
    stepCompleted: "Visit Complete",
    stepTokenIssued: "Token Issued",
    stepAhead: "ahead",
    stepNextInLine: "Next in Line",
    stepProceedToDesk: "Proceed to Desk",
    stepEstimatedWait: "est.",
    stepFinished: "Consultation Done",

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
    expired: "Expired",
    no_show: "No-Show",
    scheduled: "Scheduled",
    waiting: "Waiting",
  },
  hi: {
    systemTitle: "अस्पताल कतार प्रणाली",
    patientPortal: "मरीज़ चेक-इन पोर्टल",
    staffDashboard: "डॉक्टर एवं स्टाफ डेस्क",
    mlStudio: "अस्पताल एमएल स्टूडियो",
    dbInspector: "डेटाबेस निरीक्षक",
    kioskMonitor: "प्रतीक्षा कक्ष कियोस्क टीवी",
    
    // Patient Portal Tabs & Quick Actions
    instantWalkin: "तत्काल वॉक-इन टोकन",
    getTokenNow: "टोकन अभी लें",
    bookSlot: "समय स्लॉट बुक करें",
    scheduleVisit: "विज़िट तय करें",
    myAppointments: "मेरे अपॉइंटमेंट्स",
    viewAndManage: "देखें और प्रबंधित करें",
    appointmentHistory: "अपॉइंटमेंट इतिहास",
    pastRecords: "पुराने रिकॉर्ड",
    
    // Intake Form Labels
    patientNameLabel: "मरीज़ का पूरा नाम",
    patientAgeGenderLabel: "मरीज़ की आयु एवं लिंग",
    medicalDeptLabel: "चिकित्सा विभाग",
    serviceDeptLabel: "सेवा विभाग (डिपार्टमेंट)",
    primarySymptomLabel: "मुख्य लक्षण / बीमारी का कारण",
    symptomLabel: "मुख्य लक्षण / बीमारी का कारण",
    customSymptomLabel: "अपना लक्षण / स्वास्थ्य समस्या लिखें",
    customSymptomPlaceholder: "अपना लक्षण विस्तार से लिखें (जैसे: टखने में सूजन, कान का गंभीर दर्द)",
    preExistingLabel: "पूर्व-विद्यमान पुरानी बीमारियाँ / जोखिम",
    urgencyLabel: "आपातकालीन स्तर (Triage)",
    priorityTriageLabel: "प्राथमिकता एवं आपातकालीन स्तर (Triage)",
    
    // Form Options & Buttons
    routineCase: "सामान्य परामर्श (Routine)",
    routineCheckup: "सामान्य जांच",
    standardOrder: "सामान्य क्रम",
    emergencyCase: "आपातकालीन स्थिति",
    priorityJump: "प्राथमिकता कूद (Emergency Jump)",
    getTicketBtn: "डिजिटल वॉक-इन टोकन प्राप्त करें",
    bookSlotBtn: "अपॉइंटमेंट स्लॉट बुक करें",
    
    // Symptoms
    symptomGeneral: "सामान्य परामर्श एवं जांच",
    symptomCardiac: "सीने में गंभीर दर्द / हृदय संबंधित लक्षण",
    symptomFever: "तेज़ बुखार, वायरल फ्लू और ठंड लगना",
    symptomTrauma: "फ्रैक्चर, मोच और शारीरिक चोट",
    symptomAsthma: "सांस लेने में तकलीफ / अस्थमा",
    symptomFollowup: "दवा रीफिल एवं फॉलो-अप जांच",
    symptomLab: "पैथोलॉजी रक्त एवं नैदानिक जांच",
    symptom_general_checkup: "सामान्य परामर्श एवं नियमित जांच",
    symptom_fever_flu: "तेज़ बुखार, वायरल फ्लू और ठंड लगना",
    symptom_cough_cold: "खांसी, जुकाम और गले में खराश",
    symptom_chest_pain_severe: "सीने में गंभीर दर्द / हृदय संबंधित लक्षण",
    symptom_breathing_difficulty: "सांस लेने में तकलीफ / अस्थमा का दौरा",
    symptom_headache_migraine: "गंभीर सिरदर्द एवं माइग्रेन",
    symptom_stomach_pain: "पेट में दर्द, एसिडिटी और उल्टी",
    symptom_fracture_trauma: "फ्रैक्चर, मोच और शारीरिक चोट",
    symptom_skin_allergy: "त्वचा एलर्जी, दाने और खुजली",
    symptom_pediatric_care: "बाल चिकित्सा एवं शिशु स्वास्थ्य",
    symptom_ortho_joint_pain: "कमर और जोड़ों का पुराना दर्द",
    symptom_eye_infection: "आंखों में संक्रमण, लाली और दृष्टि समस्या",
    symptom_ent_issue: "कान, नाक और गले की समस्या (ENT)",
    symptom_dental_pain: "दांत और मसूड़ों का दर्द",
    symptom_diabetes_care: "मधुमेह एवं ब्लड शुगर जांच",
    symptom_bp_hypertension: "उच्च रक्तचाप एवं चक्कर आना",
    symptom_urinary_issue: "मूत्र संक्रमण एवं गुर्दे की तकलीफ",
    symptom_women_health: "महिला स्वास्थ्य एवं स्त्री रोग",
    symptom_followup_refill: "दवा रीफिल एवं फॉलो-अप परामर्श",
    symptom_lab_blood_test: "पैथोलॉजी रक्त एवं नैदानिक जांच",
    symptom_other_custom: "✏️ अन्य लक्षण (अपना लक्षण लिखें)",

    // Risk Factors
    riskNone: "कोई नहीं / सामान्य",
    riskDiabetes: "मधुमेह (शुगर)",
    riskBP: "उच्च रक्तचाप (बीपी)",
    riskHeart: "हृदय रोग इतिहास",
    riskLung: "अस्थमा / फेफड़ों की बीमारी",
    risk_none: "कोई नहीं / सामान्य",
    risk_diabetes: "मधुमेह (डायबिटीज)",
    risk_hypertension: "उच्च रक्तचाप (हाइपरटेंशन)",
    risk_cardiac_history: "हृदय रोग का इतिहास",
    risk_asthma_copd: "अस्थमा / फेफड़ों की बीमारी",
    risk_kidney_disease: "गुर्दे की पुरानी बीमारी",
    risk_elderly: "वरिष्ठ नागरिक (65+ वर्ष)",
    risk_pregnancy: "गर्भावस्था",
    
    // Ticket Pass & Kiosk Labels
    livePassTitle: "लाइव कतार टोकन पास",
    nowServing: "डेस्क पर सेवारत टोकन",
    waitingQueue: "प्रतीक्षारत कतार",
    pos: "स्थान",
    tokenId: "टोकन संख्या",
    patientDemographics: "मरीज़ विवरण",
    deptCategory: "विभाग एवं श्रेणी",
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
    accountLogin: "खाता साइन इन",

    // Feature Cards
    feature1Title: "लाइव कतार स्थिति",
    feature1Desc: "वास्तविक समय में अपने टोकन को ट्रैक करें और बेहतर योजना बनाएं।",
    feature2Title: "स्मार्ट सूचनाएं",
    feature2Desc: "जब आपकी बारी निकट हो या आपकी बारी हो तो तुरंत सूचना प्राप्त करें।",
    feature3Title: "पारदर्शी प्रणाली",
    feature3Desc: "सभी के लिए रीयल-टाइम अपडेट के साथ निष्पक्ष कतार प्रबंधन।",
    feature4Title: "आपका डेटा सुरक्षित है",
    feature4Desc: "हम आपकी जानकारी की पूर्ण गोपनीयता और सुरक्षा सुनिश्चित करते हैं।",

    // Gender
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",

    // Family & Dependent Member Switcher
    bookingFor: "मरीज़ / परिवार सदस्य:",
    addMember: "+ सदस्य जोड़ें",
    manageFamily: "परिवार प्रबंधित करें",
    relation_self: "स्वयं",
    relation_child: "बच्चा",
    relation_spouse: "पति/पत्नी",
    relation_parent: "माता/पिता",
    relation_sibling: "भाई/बहन",
    relation_other: "आश्रित",
    addMemberTitle: "परिवार सदस्य / आश्रित जोड़ें",
    addMemberDesc: "परिवार के सदस्यों को जोड़ें ताकि आप उनके लिए आसानी से वॉक-इन टोकन और अपॉइंटमेंट बुक कर सकें।",
    relationshipLabel: "संबंध",
    memberNameLabel: "पूरा नाम",
    memberAgeLabel: "आयु",
    memberGenderLabel: "लिंग",
    saveMemberBtn: "सदस्य सहेजें",
    removeMemberBtn: "हटाएं",
    switchMemberHint: "परिवार के प्रत्येक सदस्य के लिए टोकन लेने या पास देखने हेतु प्रोफ़ाइल बदलें",
    activePassFor: "पास धारक",
    allMembers: "सभी प्रोफ़ाइल",
    profileSwitchedMsg: "सक्रिय प्रोफ़ाइल बदली गई:",
    familyProfiles: "परिवार प्रोफ़ाइल",
    familyTabTitle: "परिवार प्रोफ़ाइल",
    familyTabSub: "आश्रित प्रबंधित करें",
    familyHeaderTitle: "परिवार सदस्य एवं आश्रित प्रोफ़ाइल",
    familyHeaderDesc: "एक-क्लिक टोकन एवं क्लिनिक अपॉइंटमेंट के लिए अपने बच्चों, जीवनसाथी या बुजुर्ग माता-पिता को जोड़ें।",
    addNewProfileCard: "परिवार सदस्य जोड़ें",
    addNewProfileCardDesc: "अस्पताल में टोकन और अपॉइंटमेंट लेने के लिए आश्रित सदस्य जोड़ें।",
    primaryAccountHolder: "प्राथमिक खाता धारक",
    quickBookWalkin: "वॉक-इन टोकन लें",
    quickBookAppointment: "अपॉइंटमेंट तय करें",
    memberCardSubtitle: "पंजीकृत परिवार आश्रित",
    deleteMemberConfirm: "क्या आप वाकई इस परिवार सदस्य की प्रोफ़ाइल हटाना चाहते हैं?",

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

    // Live Queue Stepper Journey
    stepQueueTracker: "लाइव कतार प्रगति",
    stepOf: "चरण",
    stepCheckedIn: "चेक-इन पूर्ण",
    stepInLine: "कतार में",
    stepConsultation: "परामर्श हेतु तैयार",
    stepCompleted: "विज़िट संपन्न",
    stepTokenIssued: "टोकन जारी",
    stepAhead: "आगे",
    stepNextInLine: "अगला नंबर आपका",
    stepProceedToDesk: "काउंटर पर जाएं",
    stepEstimatedWait: "अनुमानित",
    stepFinished: "परामर्श संपन्न",

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
    expired: "समाप्त",
    no_show: "अनुपस्थित",
    scheduled: "निर्धारित",
    waiting: "प्रतीक्षारत",
  }
};

export const t = (key, lang = "en") => {
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || (TRANSLATIONS.en && TRANSLATIONS.en[key]) || key;
};

export const getCategoryLabel = (cat, lang = "en") => {
  const map = {
    consultation: lang === "hi" ? "सामान्य परामर्श (OPD)" : "General Consultation (OPD)",
    cardiology: lang === "hi" ? "हृदय रोग विभाग" : "Cardiology OPD",
    emergency: lang === "hi" ? "आपातकालीन ट्राइएज" : "Emergency Triage",
    orthopedics: lang === "hi" ? "हड्डी रोग विभाग" : "Orthopedics",
    pulmonology: lang === "hi" ? "श्वसन रोग विभाग" : "Pulmonology",
    followup: lang === "hi" ? "फॉलो-अप विज़िट" : "Routine Follow-up",
    pathology: lang === "hi" ? "पैथोलॉजी लैब" : "Pathology Lab",
    pharmacy: lang === "hi" ? "फार्मेसी एवं दवा" : "Pharmacy & Medicine",
    laboratory: lang === "hi" ? "पैथोलॉजी एवं लैब जांच" : "Pathology & Lab Test",
    radiology: lang === "hi" ? "रेडियोलॉजी एवं एक्स-रे" : "Radiology & X-Ray",
    billing: lang === "hi" ? "सेंट्रल बिलिंग काउंटर" : "Central Billing & Cashier",
  };
  if (!cat) return "";
  const key = String(cat).toLowerCase().trim();
  return map[key] || cat;
};

export const getStatusLabel = (status, lang = "en") => {
  const map = {
    waiting: lang === "hi" ? "कतार में प्रतीक्षारत" : "Waiting in Queue",
    serving: lang === "hi" ? "वर्तमान में सेवारत" : "Currently Serving",
    completed: lang === "hi" ? "विज़िट पूर्ण" : "Visit Completed",
    transferred: lang === "hi" ? "स्थानांतरित" : "Transferred",
    scheduled: lang === "hi" ? "निर्धारित" : "Scheduled",
    checked_in: lang === "hi" ? "चेक इन पूर्ण" : "Checked In",
    cancelled: lang === "hi" ? "रद्द" : "Cancelled",
    expired: lang === "hi" ? "समाप्त" : "Expired",
    no_show: lang === "hi" ? "अनुपस्थित" : "No-Show",
  };
  return map[status] || status;
};

export const SYMPTOM_OPTIONS = [
  { id: "general_checkup", key: "symptom_general_checkup", label: "General Checkup & Consultation", labelHi: "सामान्य परामर्श एवं नियमित जांच" },
  { id: "fever_flu", key: "symptom_fever_flu", label: "High Fever, Viral Flu & Chills", labelHi: "तेज़ बुखार, वायरल फ्लू और ठंड लगना" },
  { id: "cough_cold", key: "symptom_cough_cold", label: "Cough, Cold & Sore Throat", labelHi: "खांसी, जुकाम और गले में खराश" },
  { id: "chest_pain_severe", key: "symptom_chest_pain_severe", label: "Severe Chest Pain / Heart Discomfort", labelHi: "सीने में गंभीर दर्द / हृदय संबंधित लक्षण" },
  { id: "breathing_difficulty", key: "symptom_breathing_difficulty", label: "Shortness of Breath / Asthma Attack", labelHi: "सांस लेने में तकलीफ / अस्थमा का दौरा" },
  { id: "headache_migraine", key: "symptom_headache_migraine", label: "Severe Headache & Migraine", labelHi: "गंभीर सिरदर्द एवं माइग्रेन" },
  { id: "stomach_pain", key: "symptom_stomach_pain", label: "Abdominal Pain, Acidity & Vomiting", labelHi: "पेट में दर्द, एसिडिटी और उल्टी" },
  { id: "fracture_trauma", key: "symptom_fracture_trauma", label: "Fracture, Sprain & Physical Trauma", labelHi: "फ्रैक्चर, मोच और शारीरिक चोट" },
  { id: "skin_allergy", key: "symptom_skin_allergy", label: "Skin Rash, Allergy & Itching", labelHi: "त्वचा एलर्जी, दाने और खुजली" },
  { id: "pediatric_care", key: "symptom_pediatric_care", label: "Pediatric & Child Health Care", labelHi: "बाल चिकित्सा एवं शिशु स्वास्थ्य" },
  { id: "ortho_joint_pain", key: "symptom_ortho_joint_pain", label: "Back Pain & Joint Stiffness", labelHi: "कमर और जोड़ों का पुराना दर्द" },
  { id: "eye_infection", key: "symptom_eye_infection", label: "Eye Infection, Redness & Vision Issue", labelHi: "आंखों में संक्रमण, लाली और दृष्टि समस्या" },
  { id: "ent_issue", key: "symptom_ent_issue", label: "Ear, Nose & Throat (ENT) Pain", labelHi: "कान, नाक और गले की समस्या (ENT)" },
  { id: "dental_pain", key: "symptom_dental_pain", label: "Dental Pain & Toothache", labelHi: "दांत और मसूड़ों का दर्द" },
  { id: "diabetes_care", key: "symptom_diabetes_care", label: "Diabetes & Blood Sugar Checkup", labelHi: "मधुमेह एवं ब्लड शुगर जांच" },
  { id: "bp_hypertension", key: "symptom_bp_hypertension", label: "High Blood Pressure & Dizziness", labelHi: "उच्च रक्तचाप एवं चक्कर आना" },
  { id: "urinary_issue", key: "symptom_urinary_issue", label: "Urinary Infection & Kidney Discomfort", labelHi: "मूत्र संक्रमण एवं गुर्दे की तकलीफ" },
  { id: "women_health", key: "symptom_women_health", label: "Women's Health & Gynecology", labelHi: "महिला स्वास्थ्य एवं स्त्री रोग" },
  { id: "followup_refill", key: "symptom_followup_refill", label: "Prescription Refill & Follow-up Visit", labelHi: "दवा रीफिल एवं फॉलो-अप परामर्श" },
  { id: "lab_blood_test", key: "symptom_lab_blood_test", label: "Pathology Blood & Diagnostic Tests", labelHi: "पैथोलॉजी रक्त एवं नैदानिक जांच" },
  { id: "other_custom", key: "symptom_other_custom", label: "✏️ Other Symptom (Type Your Own)", labelHi: "✏️ अन्य लक्षण (अपना लक्षण लिखें)" },
];

export const RISK_OPTIONS = [
  { id: "none", key: "risk_none", label: "None / Healthy Baseline", labelHi: "कोई नहीं / सामान्य स्वास्थ्य" },
  { id: "diabetes", key: "risk_diabetes", label: "Diabetes Mellitus", labelHi: "मधुमेह (डायबिटीज)" },
  { id: "hypertension", key: "risk_hypertension", label: "High Blood Pressure / Hypertension", labelHi: "उच्च रक्तचाप (हाइपरटेंशन)" },
  { id: "cardiac_history", key: "risk_cardiac_history", label: "Heart Disease / Cardiac History", labelHi: "हृदय रोग का इतिहास" },
  { id: "asthma_copd", key: "risk_asthma_copd", label: "Asthma / Chronic Lung Disease", labelHi: "अस्थमा / फेफड़ों की बीमारी" },
  { id: "kidney_disease", key: "risk_kidney_disease", label: "Chronic Kidney Disease", labelHi: "गुर्दे की पुरानी बीमारी" },
  { id: "elderly", key: "risk_elderly", label: "Senior Citizen (65+ years)", labelHi: "वरिष्ठ नागरिक (65+ वर्ष)" },
  { id: "pregnancy", key: "risk_pregnancy", label: "Pregnancy / Maternity", labelHi: "गर्भावस्था" },
];

export function formatSymptomLabel(val, lang = "en") {
  if (!val) return "";
  const opt = SYMPTOM_OPTIONS.find((s) => s.id === val || s.key === val);
  if (opt) {
    return lang === "hi" ? opt.labelHi : opt.label;
  }
  const trans = t(val, lang);
  if (trans && trans !== val && !trans.startsWith("symptom_")) {
    return trans;
  }
  return String(val)
    .replace(/^symptom_/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatRiskLabel(val, lang = "en") {
  if (!val) return "";
  const opt = RISK_OPTIONS.find((r) => r.id === val || r.key === val);
  if (opt) {
    return lang === "hi" ? opt.labelHi : opt.label;
  }
  const trans = t(val, lang);
  if (trans && trans !== val && !trans.startsWith("risk_")) {
    return trans;
  }
  return String(val)
    .replace(/^risk_/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

