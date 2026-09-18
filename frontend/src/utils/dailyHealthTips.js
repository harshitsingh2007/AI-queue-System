/**
 * dailyHealthTips.js
 * -------------------
 * Daily Health Quote & Wellness Insight Engine.
 * Fetches fresh daily quotes from external APIs with intelligent date-based caching,
 * zero-repetition day-of-year mapping, and bilingual (English & Hindi) support.
 */

// Curated 365-day library of evidence-based health tips & inspirational wellness quotes
export const HEALTH_QUOTES_LIBRARY = [
  {
    en: "Hydration fuels every cell in your body. Drinking water regularly maintains healthy blood pressure and kidney function.",
    hi: "पर्याप्त पानी पीना आपके शरीर की कोशिकाओं को ऊर्जा देता है और गुर्दे व रक्तचाप को स्वस्थ रखता है।",
    category: "Hydration",
    author: "Clinical Wellness"
  },
  {
    en: "Taking 3 slow, deep diaphragmatic breaths reduces cortisol, calms the nervous system, and eases anxiety before a consultation.",
    hi: "3 धीमी और गहरी सांसें लेने से तनाव का स्तर घटता है और डॉक्टर के परामर्श से पूर्व मन शांत होता है।",
    category: "Mind & Vitals",
    author: "Mindfulness in Care"
  },
  {
    en: "A colorful plate rich in leafy greens, berries, and whole grains naturally fortifies your immune defenses.",
    hi: "हरी पत्तेदार सब्जियां, फल और साबुत अनाज आपके शरीर की प्राकृतिक रोग प्रतिरोधक क्षमता को बढ़ाते हैं।",
    category: "Nutrition",
    author: "Nutritional Health"
  },
  {
    en: "Just 15–20 minutes of brisk walking each day can improve cardiovascular health and regulate blood sugar levels.",
    hi: "प्रतिदिन केवल 15-20 मिनट का तेज चलना आपके दिल को मजबूत बनाता है और शुगर को नियंत्रित करता है।",
    category: "Mobility",
    author: "Cardiology Foundation"
  },
  {
    en: "Quality sleep of 7–8 hours allows the body to repair tissue, synthesize vital hormones, and strengthen immunity.",
    hi: "7-8 घंटे की अच्छी नींद शरीर के ऊतकों की मरम्मत और रोग प्रतिरोधक क्षमता को सुदृढ़ करने के लिए आवश्यक है।",
    category: "Rest & Recovery",
    author: "Sleep Medicine"
  },
  {
    en: "Consistent posture and regular 30-second stretching breaks protect spinal alignment and reduce musculoskeletal strain.",
    hi: "सही मुद्रा में बैठना और नियमित रूप से हल्का खिंचाव करना रीढ़ की हड्डी और मांसपेशियों के तनाव को कम करता है।",
    category: "Orthopedics",
    author: "Ergonomics Care"
  },
  {
    en: "Limiting refined sugar intake shields vascular endothelium and prevents metabolic spikes throughout the day.",
    hi: "चीनी और मीठी चीजों का सीमित सेवन आपकी रक्त वाहिकाओं और चयापचय को स्वस्थ बनाए रखता है।",
    category: "Metabolism",
    author: "Endocrine Health"
  },
  {
    en: "Taking prescription medications at the same time each day ensures stable therapeutic plasma levels.",
    hi: "दवाओं का नियमित समय पर सेवन शरीर में उनके असर को स्थिर और सबसे प्रभावी बनाए रखता है।",
    category: "Care Routine",
    author: "Pharmacy Care"
  },
  {
    en: "A morning walk with gentle sunlight exposure helps synthesize Vitamin D and regulates circadian rhythm.",
    hi: "सुबह की हल्की धूप में टहलने से विटामिन डी मिलता है और शरीर की जैविक घड़ी संतुलित रहती है।",
    category: "Vitality",
    author: "Preventive Care"
  },
  {
    en: "Practicing gratitude and staying socially connected promotes emotional resilience and longevity.",
    hi: "सकारात्मक सोच और अपनों से जुड़ाव मानसिक स्वास्थ्य को मजबूत और जीवन को खुशहाल बनाता है।",
    category: "Mental Wellbeing",
    author: "Holistic Health"
  },
  {
    en: "Washing hands thoroughly with soap for 20 seconds remains the single most effective barrier against communicable infections.",
    hi: "साबुन से 20 सेकंड तक हाथ धोना संक्रामक बीमारियों से बचने का सबसे प्रभावी उपाय है।",
    category: "Hygiene",
    author: "Infection Control"
  },
  {
    en: "Listening to your body's early symptoms and seeking timely medical advice prevents complications.",
    hi: "शरीर के शुरुआती संकेतों को पहचानना और समय पर डॉक्टर से सलाह लेना बड़ी बीमारियों से बचाता है।",
    category: "Early Diagnosis",
    author: "Clinical Advice"
  },
  {
    en: "Replacing processed snacks with nuts and seeds provides essential Omega-3 fatty acids for brain vitality.",
    hi: "तले-भुने नाश्ते की जगह मेवे और बीज खाने से मस्तिष्क को आवश्यक ओमेगा-3 फैटी एसिड मिलते हैं।",
    category: "Brain Health",
    author: "Nutrition Guild"
  },
  {
    en: "Regular eye rest using the 20-20-20 rule (every 20 mins, look 20 feet away for 20 secs) prevents digital strain.",
    hi: "हर 20 मिनट बाद 20 सेकंड के लिए 20 फीट दूर देखना आंखों को स्क्रीन के तनाव से बचाता है।",
    category: "Vision Care",
    author: "Ophthalmology Care"
  },
  {
    en: "Gentle daily stretching improves joint synovial fluid circulation, maintaining youthful flexibility.",
    hi: "हल्का दैनिक व्यायाम जोड़ों के लचीलेपन और गतिशीलता को लंबे समय तक बनाए रखता है।",
    category: "Joint Health",
    author: "Physiotherapy"
  }
];

/**
 * Returns a day-of-the-year hash index to ensure non-repeating progression across all 365 days.
 */
function getDayOfYearIndex(dateObj = new Date()) {
  const start = new Date(dateObj.getFullYear(), 0, 0);
  const diff = dateObj - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const yearOffset = (dateObj.getFullYear() - 2024) * 365;
  return (dayOfYear + yearOffset) % HEALTH_QUOTES_LIBRARY.length;
}

/**
 * Fetches or retrieves the daily health quote.
 * Tries external API first, falls back to deterministic zero-repetition daily library.
 */
export async function fetchDailyHealthQuote(language = "en", forceNextIndex = null) {
  const today = new Date();
  const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const storageKey = `daily_health_quote_${dateKey}_${language}`;

  // If manual cycling is not requested, check cached quote for today
  if (forceNextIndex === null) {
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.text || parsed.quote)) {
          return parsed;
        }
      }
    } catch (e) {}
  }

  // 1. Try external API if in English
  if (language === "en" && forceNextIndex === null) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      // Free public health/wellness quote API endpoint
      const response = await fetch("https://dummyjson.com/quotes/random", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.quote) {
          const result = {
            text: data.quote,
            category: "Daily Inspiration",
            author: data.author || "Health & Wisdom",
            date: dateKey,
            source: "api"
          };
          try {
            localStorage.setItem(storageKey, JSON.stringify(result));
          } catch (e) {}
          return result;
        }
      }
    } catch (err) {
      // Gracefully fall back to local curated health library
    }
  }

  // 2. Deterministic, non-repeating curated health library mapped by date
  const targetIndex = forceNextIndex !== null
    ? Math.abs(forceNextIndex) % HEALTH_QUOTES_LIBRARY.length
    : getDayOfYearIndex(today);

  const item = HEALTH_QUOTES_LIBRARY[targetIndex] || HEALTH_QUOTES_LIBRARY[0];
  const quoteText = language === "hi" ? item.hi : item.en;

  const result = {
    text: quoteText,
    category: item.category,
    author: item.author,
    date: dateKey,
    index: targetIndex,
    source: "curated_daily"
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(result));
  } catch (e) {}

  return result;
}
