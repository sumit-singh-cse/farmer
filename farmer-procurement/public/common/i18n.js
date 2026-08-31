/**
 * Lightweight client-side i18n for the FARMER side (English <-> Hindi).
 * 100% free, no API keys. Translates static + dynamically-injected text
 * by exact phrase match, and remembers the choice in localStorage.
 * Values/IDs are never touched, so booking/login/register flows stay intact.
 */
(function () {
  'use strict';

  // Exact-match dictionary: English phrase -> Hindi
  var DICT = {
    // ---- Navbar ----
    "Dashboard": "डैशबोर्ड",
    "Profile": "प्रोफ़ाइल",
    "Support": "सहायता",
    "Home": "होम",
    "Farmer Login": "किसान लॉगिन",
    "Track Status": "स्थिति देखें",
    "Admin": "एडमिन",
    // ---- Footer ----
    "🌾 Farmer Procurement Hub": "🌾 किसान खरीद केंद्र",
    "Streamlining crop procurement process, reducing waiting times, and facilitating fast, transparent payments for farmers.": "फसल खरीद प्रक्रिया को सरल बनाना, प्रतीक्षा समय घटाना, और किसानों के लिए तेज़, पारदर्शी भुगतान सुनिश्चित करना।",
    "Quick Links": "त्वरित लिंक",
    "Help & Support": "मदद और सहायता",
    "Contact Support": "संपर्क करें",
    "Ministry of Consumer Affairs, Food & Public Distribution": "उपभोक्ता मामले, खाद्य एवं सार्वजनिक वितरण मंत्रालय",
    // ---- Login page ----
    "Access your dashboard to book slots and track status.": "स्लॉट बुक करने और स्थिति देखने के लिए अपने डैशबोर्ड में जाएँ।",
    "Mobile Number": "मोबाइल नंबर",
    "Send OTP": "OTP भेजें",
    "Password": "पासवर्ड",
    "One-Time Password (OTP)": "वन-टाइम पासवर्ड (OTP)",
    "For demo mode, use OTP: 123456": "डेमो मोड के लिए OTP इस्तेमाल करें: 123456",
    "Login": "लॉगिन",
    "Account nahi hai?": "खाता नहीं है?",
    "New Registration": "नया पंजीकरण",
    "10-digit mobile number": "10 अंकों का मोबाइल नंबर",
    "Enter password": "पासवर्ड दर्ज करें",
    "Enter 6-digit OTP code": "6 अंकों का OTP कोड दर्ज करें",
    // ---- Register page ----
    "Farmer Registration": "किसान पंजीकरण",
    "Register your account to access digital Mandi slot booking.": "डिजिटल मंडी स्लॉट बुकिंग के लिए अपना खाता पंजीकृत करें।",
    "First Name": "पहला नाम",
    "Last Name": "अंतिम नाम",
    "Enter Mobile OTP": "मोबाइल OTP दर्ज करें",
    "Aadhaar / Reference Number": "आधार / संदर्भ संख्या",
    "We store Aadhaar references securely and mask values.": "हम आधार संदर्भ सुरक्षित रूप से संग्रहित करते हैं और मान छिपाते हैं।",
    "Full Address": "पूरा पता",
    "State": "राज्य",
    "District": "ज़िला",
    "-- Select State --": "-- राज्य चुनें --",
    "-- Select District --": "-- ज़िला चुनें --",
    "-- Loading Districts --": "-- ज़िले लोड हो रहे हैं --",
    "No districts found": "कोई ज़िला नहीं मिला",
    "Create Password": "पासवर्ड बनाएं",
    "Confirm Password": "पासवर्ड की पुष्टि करें",
    "Register Account": "खाता पंजीकृत करें",
    "Already registered?": "पहले से पंजीकृत हैं?",
    "Login here": "यहाँ लॉगिन करें",
    "Enter first name": "पहला नाम दर्ज करें",
    "Enter last name": "अंतिम नाम दर्ज करें",
    "6-digit verification code": "6 अंकों का सत्यापन कोड",
    "12-digit Aadhaar number": "12 अंकों का आधार नंबर",
    "House/Village, Street, Post Office": "घर/गाँव, गली, डाकघर",
    "Choose a strong password": "एक मज़बूत पासवर्ड चुनें",
    "Retype password": "पासवर्ड दोबारा लिखें",
    // ---- Dashboard ----
    "Manage your crop delivery bookings and check real-time statuses.": "अपनी फसल डिलीवरी बुकिंग प्रबंधित करें और रीयल-टाइम स्थिति देखें।",
    "📅 Book New Slot": "📅 नया स्लॉट बुक करें",
    "🎫 Active Slot Booking": "🎫 सक्रिय स्लॉट बुकिंग",
    "Token Number": "टोकन नंबर",
    "Procurement Centre": "खरीद केंद्र",
    "Scheduled Date & Time": "निर्धारित दिनांक और समय",
    "Queue Position": "कतार स्थिति",
    "Crop Type:": "फसल प्रकार:",
    "Booked Quantity:": "बुक की गई मात्रा:",
    "Capacity Load:": "क्षमता भार:",
    "Status:": "स्थिति:",
    "🌾 My Verified Land Holdings": "🌾 मेरी सत्यापित भूमि",
    "Khasra No.": "खसरा नं.",
    "Area (Ha)": "क्षेत्र (हे.)",
    "Crop Type": "फसल प्रकार",
    "Quota Limit": "कोटा सीमा",
    "Booked Qty": "बुक मात्रा",
    "⚙️ Register New Land": "⚙️ नई भूमि पंजीकृत करें",
    "Khasra Number": "खसरा संख्या",
    "Area (in Hectares)": "क्षेत्र (हेक्टेयर में)",
    "Allowed Crop Type": "अनुमत फसल प्रकार",
    "Wheat": "गेहूँ",
    "Rice": "चावल",
    "Allowed Yield Quota (Quintals)": "अनुमत उपज कोटा (क्विंटल)",
    "Standard estimation: ~15 Qtl per Hectare.": "मानक अनुमान: लगभग 15 क्विंटल प्रति हेक्टेयर।",
    "Register Land Record": "भूमि रिकॉर्ड पंजीकृत करें",
    "Previous Bookings & Payments": "पिछली बुकिंग और भुगतान",
    "Token": "टोकन",
    "Centre": "केंद्र",
    "Date": "दिनांक",
    "Accepted Qty": "स्वीकृत मात्रा",
    "Total Payout": "कुल भुगतान",
    "Payment Status": "भुगतान स्थिति",
    "Status": "स्थिति",
    "No active slot booking found. Register your land crop details and book an available delivery slot.": "कोई सक्रिय स्लॉट बुकिंग नहीं मिली। अपनी भूमि फसल विवरण पंजीकृत करें और उपलब्ध डिलीवरी स्लॉट बुक करें।",
    "📅 Book New Slot Now": "📅 अभी नया स्लॉट बुक करें",
    "❌ Cancel This Booking": "❌ यह बुकिंग रद्द करें",
    "You can cancel while the status is still \"Booked\".": "जब तक स्थिति \"Booked\" है, आप रद्द कर सकते हैं।",
    "No land records registered. Manually add a land record on the right.": "कोई भूमि रिकॉर्ड पंजीकृत नहीं। दाईं ओर मैन्युअली भूमि रिकॉर्ड जोड़ें।",
    "No past transactions or procurements found.": "कोई पिछला लेन-देन या खरीद नहीं मिली।",
    // ---- Booking page ----
    "Book Delivery Slot": "डिलीवरी स्लॉट बुक करें",
    "Select your land record, produce type, destination centre, and scheduled time window.": "अपना भूमि रिकॉर्ड, उपज प्रकार, गंतव्य केंद्र और निर्धारित समय स्लॉट चुनें।",
    "1. Land & Crop Details": "1. भूमि और फसल विवरण",
    "Select Registered Land Record": "पंजीकृत भूमि रिकॉर्ड चुनें",
    "-- Select Land Account --": "-- भूमि खाता चुनें --",
    "Select Crop Produce": "फसल उपज चुनें",
    "-- Select Crop --": "-- फसल चुनें --",
    "Wheat (Kharif)": "गेहूँ (खरीफ)",
    "Rice (Rabi)": "चावल (रबी)",
    "Delivery Quantity (in Quintals)": "डिलीवरी मात्रा (क्विंटल में)",
    "Enter quantity to book": "बुक करने की मात्रा दर्ज करें",
    "Select a land record to view your permissible booking quota.": "अपना अनुमत बुकिंग कोटा देखने के लिए भूमि रिकॉर्ड चुनें।",
    "2. Delivery Schedule": "2. डिलीवरी अनुसूची",
    "Select District": "ज़िला चुनें",
    "Select Procurement Centre": "खरीद केंद्र चुनें",
    "-- Select Centre --": "-- केंद्र चुनें --",
    "Select Date": "दिनांक चुनें",
    "Available One-Hour Slots": "उपलब्ध एक-घंटा स्लॉट",
    "12:00 - 01:00 (Full)": "12:00 - 01:00 (भरा)",
    "Confirm & Generate Token": "पुष्टि करें और टोकन बनाएं",
    "Booking Summary": "बुकिंग सारांश",
    "Land Selected:": "चयनित भूमि:",
    "Requested Quantity:": "अनुरोधित मात्रा:",
    "Capacity Units:": "क्षमता इकाइयाँ:",
    "Procurement Centre:": "खरीद केंद्र:",
    "Date & Time Slot:": "दिनांक और समय स्लॉट:",
    "Formula Rule": "फॉर्मूला नियम",
    "Confirm Your Booking": "अपनी बुकिंग की पुष्टि करें",
    "Please review the details before generating your token.": "टोकन बनाने से पहले कृपया विवरण की समीक्षा करें।",
    "Land Record": "भूमि रिकॉर्ड",
    "Quantity": "मात्रा",
    "Enter OTP sent to your mobile": "अपने मोबाइल पर भेजा गया OTP दर्ज करें",
    "6-digit OTP": "6 अंकों का OTP",
    "Cancel": "रद्द करें",
    "Confirm Booking": "बुकिंग की पुष्टि करें",
    "Sending...": "भेजा जा रहा है...",
    "Booking...": "बुकिंग हो रही है...",
    "Resend": "फिर से भेजें",
    // ---- Profile page ----
    "Farmer Profile": "किसान प्रोफ़ाइल",
    "Change Image": "छवि बदलें",
    "Registered Farmer": "पंजीकृत किसान",
    "Masked Aadhaar Number": "छिपा हुआ आधार नंबर",
    "Edit Personal Details": "व्यक्तिगत विवरण संपादित करें",
    "Registered Mobile": "पंजीकृत मोबाइल",
    "Mobile numbers cannot be changed directly online.": "मोबाइल नंबर सीधे ऑनलाइन नहीं बदले जा सकते।",
    "Save Profile Changes": "प्रोफ़ाइल परिवर्तन सहेजें",
    "🔑 Change Password": "🔑 पासवर्ड बदलें",
    "Current Password": "वर्तमान पासवर्ड",
    "New Password": "नया पासवर्ड",
    "At least 6 characters.": "कम से कम 6 अक्षर।",
    "Confirm New Password": "नए पासवर्ड की पुष्टि करें",
    "Update Password": "पासवर्ड अपडेट करें",
    // ---- Status words (with icons + standalone) ----
    "✅ Completed": "✅ पूर्ण",
    "❌ Absent": "❌ अनुपस्थित",
    "Booked": "बुक किया गया",
    "Arrived": "पहुँच गए",
    "Processing": "प्रक्रियाधीन",
    "Completed": "पूर्ण",
    "Absent": "अनुपस्थित",
    "Released": "जारी",
    "Pending": "लंबित",
    // ---- Toast / status messages ----
    "Please enter a valid 10-digit mobile number first!": "कृपया पहले एक मान्य 10 अंकों का मोबाइल नंबर दर्ज करें!",
    "Please enter a valid 10-digit mobile number!": "कृपया एक मान्य 10 अंकों का मोबाइल नंबर दर्ज करें!",
    "Please request and enter your OTP!": "कृपया अपना OTP अनुरोध करें और दर्ज करें!",
    "Login successful! Redirecting to dashboard...": "लॉगिन सफल! डैशबोर्ड पर ले जाया जा रहा है...",
    "Passwords do not match!": "पासवर्ड मेल नहीं खाते!",
    "Registration successful! Redirecting to login...": "पंजीकरण सफल! लॉगिन पर ले जाया जा रहा है...",
    "Failed to load states. Please refresh.": "राज्य लोड करने में विफल। कृपया रिफ्रेश करें।",
    "Failed to load districts": "ज़िले लोड करने में विफल",
    "Land record registered successfully!": "भूमि रिकॉर्ड सफलतापूर्वक पंजीकृत!",
    "Authentication required! Please login first.": "प्रमाणीकरण आवश्यक! कृपया पहले लॉगिन करें।",
    "Please select an available delivery hour slot!": "कृपया एक उपलब्ध डिलीवरी घंटा स्लॉट चुनें!",
    "Please fill in all required fields!": "कृपया सभी आवश्यक फ़ील्ड भरें!",
    "No land records found. Please add land details on your Dashboard first.": "कोई भूमि रिकॉर्ड नहीं मिला। कृपया पहले अपने डैशबोर्ड पर भूमि विवरण जोड़ें।",
    "Failed to load land records. Please refresh the page.": "भूमि रिकॉर्ड लोड करने में विफल। कृपया पेज रिफ्रेश करें।",
    "Failed to load districts. Please refresh the page.": "ज़िले लोड करने में विफल। कृपया पेज रिफ्रेश करें।",
    "No centres available in this district.": "इस ज़िले में कोई केंद्र उपलब्ध नहीं है।",
    "Failed to load centres. Please try again.": "केंद्र लोड करने में विफल। कृपया पुनः प्रयास करें।",
    "Please enter the 6-digit OTP.": "कृपया 6 अंकों का OTP दर्ज करें।",
    "Incorrect OTP. Please try again.": "गलत OTP। कृपया पुनः प्रयास करें।",
    "Profile updated successfully!": "प्रोफ़ाइल सफलतापूर्वक अपडेट हुई!",
    "Profile image uploaded successfully!": "प्रोफ़ाइल छवि सफलतापूर्वक अपलोड हुई!",
    "File size must be under 2MB!": "फ़ाइल का आकार 2MB से कम होना चाहिए!",
    "Image upload failed": "छवि अपलोड विफल",
    "Failed to load profile details from server": "सर्वर से प्रोफ़ाइल विवरण लोड करने में विफल",
    "New passwords do not match": "नए पासवर्ड मेल नहीं खाते",
    "Password changed successfully": "पासवर्ड सफलतापूर्वक बदला गया",
    "Logged out successfully!": "सफलतापूर्वक लॉगआउट हुआ!",
    "Booking cancelled successfully": "बुकिंग सफलतापूर्वक रद्द की गई",
    "Failed to load bookings. Please refresh the page.": "बुकिंग लोड करने में विफल। कृपया पेज रिफ्रेश करें।",
    "Something went wrong": "कुछ गलत हो गया"
  };
  window.__PH_DICT = DICT;

  // Dynamic pattern rules: [regex, function(matchGroups) -> Hindi]
  // Used for strings that contain a variable part (name, year, etc.).
  var RULES = [
    [/^Namaste,\s*(.+)!$/i, function (m) { return "नमस्ते, " + m[1] + "!"; }],
    [/^Logout\s*\((.+)\)$/i, function (m) { return "लॉगआउट (" + m[1] + ")"; }],
    [/^Welcome,\s*(.+)!$/i, function (m) { return "स्वागत है, " + m[1] + "!"; }]
  ];

  var LS_KEY = 'ph_lang';

  function getLang() {
    try { return localStorage.getItem(LS_KEY) === 'hi' ? 'hi' : 'en'; }
    catch (e) { return 'en'; }
  }
  function setLang(lang) {
    try { localStorage.setItem(LS_KEY, lang === 'hi' ? 'hi' : 'en'); } catch (e) {}
  }

  // Translate a single English string -> Hindi (exact match, then rules). null if no translation.
  function toHindi(en) {
    if (en == null) return null;
    var trimmed = en.trim();
    if (!trimmed) return null;
    if (Object.prototype.hasOwnProperty.call(DICT, trimmed)) {
      // Preserve leading/trailing whitespace of the original node
      return en.replace(trimmed, DICT[trimmed]);
    }
    for (var i = 0; i < RULES.length; i++) {
      var mm = trimmed.match(RULES[i][0]);
      if (mm) return en.replace(trimmed, RULES[i][1](mm));
    }
    return null;
  }

  // Translate or restore one text node. Original English cached on node._i18nEn.
  function procTextNode(node) {
    var lang = getLang();
    if (lang === 'hi') {
      if (node._i18nEn == null) {
        var hi = toHindi(node.nodeValue);
        if (hi != null) {
          node._i18nEn = node.nodeValue;
          node.nodeValue = hi;
        }
      }
    } else {
      // Restore English if we previously translated
      if (node._i18nEn != null) {
        node.nodeValue = node._i18nEn;
        node._i18nEn = null;
      }
    }
  }

  // Translate/restore placeholder & title attributes on an element.
  function procAttr(el, attr, cacheKey) {
    var lang = getLang();
    var cur = el.getAttribute(attr);
    if (lang === 'hi') {
      if (el[cacheKey] == null && cur != null) {
        var hi = toHindi(cur);
        if (hi != null) { el[cacheKey] = cur; el.setAttribute(attr, hi); }
      }
    } else {
      if (el[cacheKey] != null) {
        el.setAttribute(attr, el[cacheKey]);
        el[cacheKey] = null;
      }
    }
  }

  var suspend = false; // guard so our own DOM writes don't re-trigger the observer

  // Walk a root: translate all text nodes + placeholder/title attributes.
  function walk(root) {
    if (!root) return;
    suspend = true;
    try {
      // Text nodes
      var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
      var textNodes = [];
      var n;
      while ((n = tw.nextNode())) {
        // Skip inside script/style
        var p = n.parentNode;
        if (p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE')) continue;
        textNodes.push(n);
      }
      for (var i = 0; i < textNodes.length; i++) procTextNode(textNodes[i]);

      // Placeholder + title attributes
      var els = (root.querySelectorAll ? root.querySelectorAll('[placeholder],[title]') : []);
      for (var j = 0; j < els.length; j++) {
        if (els[j].hasAttribute('placeholder')) procAttr(els[j], 'placeholder', '_i18nPh');
        if (els[j].hasAttribute('title')) procAttr(els[j], 'title', '_i18nTitle');
      }
      // If root itself is an element with these attrs
      if (root.nodeType === 1) {
        if (root.hasAttribute && root.hasAttribute('placeholder')) procAttr(root, 'placeholder', '_i18nPh');
        if (root.hasAttribute && root.hasAttribute('title')) procAttr(root, 'title', '_i18nTitle');
      }
    } finally {
      suspend = false;
    }
  }

  // Observe dynamically-injected content (navbar, footer, toasts, tables).
  function startObserver() {
    var observer = new MutationObserver(function (mutations) {
      if (suspend) return;
      for (var i = 0; i < mutations.length; i++) {
        var mut = mutations[i];
        for (var j = 0; j < mut.addedNodes.length; j++) {
          var node = mut.addedNodes[j];
          if (node.nodeType === 3) {
            procTextNode(node); // stray text node
          } else if (node.nodeType === 1) {
            walk(node);
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Floating EN/HI toggle button (bottom-left).
  function buildToggle() {
    if (document.getElementById('ph-lang-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'ph-lang-toggle';
    btn.type = 'button';
    btn.style.cssText = [
      'position:fixed', 'bottom:20px', 'left:20px', 'z-index:9999',
      'background:#15803d', 'color:#fff', 'border:none', 'border-radius:30px',
      'padding:10px 18px', 'font-size:14px', 'font-weight:700', 'cursor:pointer',
      'box-shadow:0 4px 12px rgba(0,0,0,0.25)', 'font-family:inherit'
    ].join(';');
    function label() { btn.textContent = getLang() === 'hi' ? 'English' : 'हिंदी'; }
    label();
    btn.addEventListener('click', function () {
      var next = getLang() === 'hi' ? 'en' : 'hi';
      setLang(next);
      label();
      walk(document.body); // re-translate current DOM in place
    });
    document.body.appendChild(btn);
  }

  function init() {
    buildToggle();
    walk(document.body);
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



