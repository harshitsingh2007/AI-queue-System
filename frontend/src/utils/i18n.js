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
    
    // Patient Portal Tabs
    instantWalkin: "Instant Walk-In Ticket",
    bookSlot: "Book Time Slot",
    myAppointments: "My Appointments",
    appointmentHistory: "Appointment History",
    
    // Intake Form Labels
    patientNameLabel: "Patient Full Name",
    patientAgeGenderLabel: "Patient Age & Gender",
    medicalDeptLabel: "Medical Department",
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
  },
  hi: {
    systemTitle: "अस्पताल कतार प्रणाली",
    patientPortal: "मरीज़ चेक-इन पोर्टल",
    staffDashboard: "डॉक्टर एवं स्टाफ डेस्क",
    mlStudio: "अस्पताल एमएल स्टूडियो",
    dbInspector: "डेटाबेस निरीक्षक",
    kioskMonitor: "प्रतीक्षा कक्ष कियोस्क टीवी",
    
    // Patient Portal Tabs
    instantWalkin: "तत्काल वॉक-इन टोकन",
    bookSlot: "समय स्लॉट बुक करें",
    myAppointments: "मेरे अपॉइंटमेंट्स",
    appointmentHistory: "अपॉइंटमेंट इतिहास",
    
    // Intake Form Labels
    patientNameLabel: "मरीज़ का पूरा नाम",
    patientAgeGenderLabel: "मरीज़ की आयु एवं लिंग",
    medicalDeptLabel: "चिकित्सा विभाग",
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
    symptomAsthma: "साँस लेने में दाख़िल / दमा",
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
  }
};

export const t = (key, lang = "en") => {
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || (TRANSLATIONS.en && TRANSLATIONS.en[key]) || key;
};
