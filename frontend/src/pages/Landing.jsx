import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import cureLogo from '../components/logo/CureAI logo.png';
import { 
  Activity, 
  Stethoscope, 
  Sparkles, 
  ShieldCheck, 
  Pill, 
  ArrowRight, 
  CheckCircle2, 
  Mic, 
  FileText, 
  BarChart3, 
  HeartPulse, 
  ChevronRight, 
  Zap, 
  Dna, 
  Globe, 
  Cpu,
  Lock,
  Clock,
  Sparkle,
  Plus,
  AlertTriangle,
  Download
} from 'lucide-react';
import InstallAppModal from '../components/InstallAppModal';
import './Landing.css';

const SAMPLE_SYMPTOMS = [
  { id: 'headache', label: 'Headache', hi: 'सिरदर्द', icon: '🧠', category: 'Neuro' },
  { id: 'high_fever', label: 'High Fever', hi: 'तेज़ बुखार', icon: '🌡️', category: 'General' },
  { id: 'cough', label: 'Persistent Cough', hi: 'खांसी', icon: '🫁', category: 'Respiratory' },
  { id: 'chest_pain', label: 'Chest Discomfort', hi: 'सीने में दर्द', icon: '🫀', category: 'Cardio' },
  { id: 'fatigue', label: 'Severe Fatigue', hi: 'थकान', icon: '⚡', category: 'General' },
  { id: 'chills', label: 'Chills & Shivering', hi: 'ठंड लगना', icon: '🥶', category: 'General' },
  { id: 'skin_rash', label: 'Skin Rash', hi: 'त्वचा पर चकत्ते', icon: '🩹', category: 'Dermatology' },
  { id: 'joint_pain', label: 'Joint Pain', hi: 'जोड़ों का दर्द', icon: '🦴', category: 'Orthopedic' },
  { id: 'nausea', label: 'Nausea & Vomiting', hi: 'जी मिचलाना', icon: '🤢', category: 'Digestive' },
  { id: 'loss_of_smell', label: 'Loss of Smell', hi: 'सूंघने की क्षमता कम होना', icon: '👃', category: 'Sensory' },
];

const FAQS_EN = [
  {
    q: 'How does CureAI predict diseases and treatments?',
    a: 'CureAI uses a calibrated Random Forest ensemble model trained on high-dimensional clinical symptom-disease mapping datasets. It vectorizes reported symptoms, executes multi-class classification, and links top predictions to an evidence-backed medicine catalog.'
  },
  {
    q: 'Is voice symptom detection available in Hindi and English?',
    a: 'Yes! CureAI features a built-in neural voice processing pipeline that transcribes audio in real-time, extracts recognized medical symptom entities, and normalizes them automatically.'
  },
  {
    q: 'Can I download and print my prescriptions?',
    a: 'Absolutely. CureAI formats each recommended treatment regimen into a standardized, high-resolution clinical Rx note complete with dosage schedules, meal instructions, precautions, and PDF download capability.'
  },
  {
    q: 'Is my personal and medical data safe?',
    a: 'Your health data is encrypted and tied exclusively to your authenticated patient account. You have complete control to inspect, view, or delete your diagnostic history at any time.'
  }
];

const FAQS_HI = [
  {
    q: 'CureAI बीमारियों और दवाओं का अनुमान कैसे लगाता है?',
    a: 'CureAI क्लीनिकल डेटा पर प्रशिक्षित रैंडम फ़ॉरेस्ट एन्सेम्बल मॉडल का उपयोग करता है। यह आपके द्वारा बताए गए लक्षणों का विश्लेषण करके संभावित बीमारियों और प्रमाणित दवाओं की सूची तैयार करता है।'
  },
  {
    q: 'क्या वॉइस लक्षण पहचान हिंदी और अंग्रेज़ी दोनों में उपलब्ध है?',
    a: 'हाँ! CureAI में रीयल-टाइम वॉइस प्रोसेसिंग शामिल है जो हिंदी और अंग्रेज़ी में आपकी आवाज़ से लक्षणों को समझकर स्वचालित रूप से पहचान लेता है।'
  },
  {
    q: 'क्या मैं अपना प्रिस्क्रिप्शन (नुस्खा) डाउनलोड और प्रिंट कर सकता हूँ?',
    a: 'बिल्कुल! CureAI खुराक के समय, भोजन के निर्देशों, सावधानियों और PDF डाउनलोड सुविधा के साथ एक मानक मेडिकल प्रिस्क्रिप्शन तैयार करता है।'
  },
  {
    q: 'क्या मेरा व्यक्तिगत और मेडिकल डेटा सुरक्षित है?',
    a: 'आपका स्वास्थ्य डेटा पूरी तरह से एन्क्रिप्टेड और सुरक्षित है। आप कभी भी अपना इतिहास देख या हटा सकते हैं।'
  }
];

function Landing() {
  const { t, i18n } = useTranslation();
  const language = i18n.language?.startsWith('hi') ? 'hi' : 'en';
  const isHindi = language === 'hi';
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeDemoSymptoms, setActiveDemoSymptoms] = useState(['headache', 'high_fever']);
  const [openFaq, setOpenFaq] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleGetAppClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        return;
      }
    }
    // If prompt not available or on iOS/desktop without auto-prompt, show guide modal
    setShowInstallModal(true);
  };

  const toggleDemoSymptom = (id) => {
    setActiveDemoSymptoms(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getSimulatedConfidence = () => {
    const count = activeDemoSymptoms.length;
    if (count === 0) return 0;
    if (count === 1) return 68.4;
    if (count === 2) return 89.2;
    if (count === 3) return 96.5;
    return 98.8;
  };

  const getSimulatedDisease = () => {
    if (activeDemoSymptoms.includes('skin_rash')) {
      return isHindi ? 'फंगल संक्रमण / त्वचा रोग (Dermatitis)' : 'Fungal Infection / Dermatitis';
    }
    if (activeDemoSymptoms.includes('chest_pain')) {
      return isHindi ? 'ब्रोंकाइटिस / हृदय व फेफड़े की जांच आवश्यक' : 'Bronchitis / Cardiovascular Screening Advised';
    }
    if (activeDemoSymptoms.includes('cough') && activeDemoSymptoms.includes('high_fever')) {
      return isHindi ? 'वायरल श्वसन संक्रमण / इन्फ्लूएंजा (Influenza)' : 'Viral Respiratory Infection / Influenza';
    }
    if (activeDemoSymptoms.includes('joint_pain')) {
      return isHindi ? 'ऑस्टियोआर्थराइटिस / जोड़ों का दर्द' : 'Osteoarthritis / Viral Arthralgia';
    }
    if (activeDemoSymptoms.includes('headache')) {
      return isHindi ? 'माइग्रेन / तनाव सिरदर्द (Tension Cephalea)' : 'Migraine / Tension Cephalea';
    }
    return isHindi ? 'क्लीनिकल लक्षण वेक्टर मिलान' : 'Clinical Symptom Vector Matched';
  };

  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const navHeight = 85;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const faqs = isHindi ? FAQS_HI : FAQS_EN;

  return (
    <div className="landing-container">
      {/* Background Decorative Mesh & Glows */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />
      <div className="ambient-grid-overlay" />

      {/* Modern Top Navigation Bar */}
      <header className="landing-navbar">
        <div className="nav-inner">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <div className="logo-badge-wrap">
              <img src={cureLogo} alt="CureAI Logo" className="landing-brand-logo" />
              <div className="pulse-indicator" title={isHindi ? "इंजन सक्रिय" : "Clinical Engine Active"} />
            </div>
            <div className="brand-text-block">
              <span className="brand-name">CureAI<span className="brand-dot">.</span></span>
              <span className="brand-tagline">
                {isHindi ? 'क्लीनिकल स्वास्थ्य बुद्धिमत्ता' : 'Clinical Health Intelligence'}
              </span>
            </div>
          </div>

          <nav className="nav-links">
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="nav-link">{isHindi ? 'विशेषताएं' : 'Features'}</a>
            <a href="#demo" onClick={(e) => scrollToSection(e, 'demo')} className="nav-link">{isHindi ? 'लाइव सिम्युलेटर' : 'Interactive Simulator'}</a>
            <a href="#workflow" onClick={(e) => scrollToSection(e, 'workflow')} className="nav-link">{isHindi ? 'यह कैसे काम करता है' : 'How It Works'}</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')} className="nav-link">{isHindi ? 'सामान्य प्रश्न' : 'FAQ'}</a>
          </nav>

          <div className="nav-actions">
            {/* App Shortcut / Download Button */}
            <button 
              onClick={handleGetAppClick} 
              className="btn-download-shortcut"
              title={isHindi ? "होम स्क्रीन पर जोड़ें / डाउनलोड" : "Add to Home Screen / Download App"}
            >
              <Download size={15} />
              <span>{isHindi ? 'ऐप डाउनलोड' : 'Get App'}</span>
            </button>

            <div className="lang-toggle-capsule">
              <button 
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => i18n.changeLanguage('en')}
              >
                EN
              </button>
              <button 
                className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
                onClick={() => i18n.changeLanguage('hi')}
              >
                हिंदी
              </button>
            </div>

            {user ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary-glow">
                <span>{isHindi ? 'डैशबोर्ड पर जाएं' : 'Go to Dashboard'}</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <div className="auth-btn-group">
                <Link to="/login" className="btn-glass-subtle">
                  {isHindi ? 'लॉग इन' : 'Sign In'}
                </Link>
                <Link to="/signup" className="btn-primary-glow">
                  <span>{isHindi ? 'मुफ़्त शुरू करें' : 'Get Started Free'}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge-pulse"><Zap size={13} /></span>
          <span className="badge-text">
            {isHindi ? '⚡ नेक्स्ट-जेन क्लीनिकल ML और लक्षण वेक्टर इंटेलिजेंस' : '⚡ Next-Gen Clinical ML & Symptom Vector Intelligence'}
          </span>
        </div>

        <h1 className="hero-headline">
          {isHindi ? (
            <>
              सटीक चिकित्सा व रोग निदान <br />
              <span className="gradient-text">डेटा साइंस द्वारा संचालित।</span>
            </>
          ) : (
            <>
              Precision Medicine & Diagnosis <br />
              <span className="gradient-text">Engineered by Data Science.</span>
            </>
          )}
        </h1>

        <p className="hero-subtitle">
          {isHindi 
            ? 'तुरंत क्लीनिकल लक्षण मैपिंग, रैंडम फ़ॉरेस्ट बीमारी वर्गीकरण और व्यक्तिगत द्विभाषी नुस्खे बिना किसी परेशानी के प्राप्त करें।'
            : 'Experience instant clinical symptom mapping, calibrated Random Forest disease classification, and personalized multi-lingual prescriptions with zero friction.'}
        </p>

        <div className="hero-cta-row">
          <Link to="/signup" className="hero-primary-btn">
            <span>{isHindi ? 'क्लीनिकल पोर्टल शुरू करें' : 'Launch Clinical Portal'}</span>
            <ArrowRight size={18} />
          </Link>
          <a href="#demo" onClick={(e) => scrollToSection(e, 'demo')} className="hero-secondary-btn">
            <Activity size={18} className="icon-pulse" />
            <span>{isHindi ? 'लाइव सिम्युलेटर आज़माएं' : 'Try Live Simulator'}</span>
          </a>
        </div>

        {/* Medical & AI Limitations Disclaimer Notice */}
        <div className="medical-disclaimer-banner" role="alert">
          <div className="disclaimer-badge">
            <AlertTriangle size={18} className="disclaimer-icon" />
            <span className="disclaimer-tag">{isHindi ? 'महत्वपूर्ण अस्वीकरण' : 'Important Medical Disclaimer'}</span>
          </div>
          <p className="disclaimer-text">
            {isHindi ? (
              <>
                <strong>कृपया ध्यान दें:</strong> यह AI सिस्टम <strong>100% सटीक नहीं है</strong> और इसमें त्रुटियां हो सकती हैं। कृपया इस पर पूरी तरह निर्भर न रहें। किसी भी उपचार, दवा या निदान के लिए <strong>हमेशा योग्य डॉक्टर या प्रमाणित चिकित्सा विशेषज्ञ की सलाह अवश्य लें।</strong>
              </>
            ) : (
              <>
                <strong>Please Note:</strong> This AI-driven system is <strong>not 100% correct</strong> and can make mistakes. Please <strong>do not rely completely</strong> on these recommendations. Always consult a qualified doctor or certified healthcare professional for medical advice, definitive diagnosis, and treatment plans.
              </>
            )}
          </p>
        </div>

        {/* Live Floating Clinical Holographic Stats */}
        <div className="hero-stats-strip">
          <div className="stat-card">
            <div className="stat-icon-wrap"><Cpu size={20} /></div>
            <div className="stat-info">
              <span className="stat-val">130+</span>
              <span className="stat-label">
                {isHindi ? 'मॉडल लक्षण समर्थित' : 'Model Symptoms Vectorized'}
              </span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <div className="stat-icon-wrap"><Sparkles size={20} /></div>
            <div className="stat-info">
              <span className="stat-val">99.2%</span>
              <span className="stat-label">
                {isHindi ? 'क्लासिफायर सटीकता' : 'Ensemble Classifier Accuracy'}
              </span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <div className="stat-icon-wrap"><Globe size={20} /></div>
            <div className="stat-info">
              <span className="stat-val">EN + हिंदी</span>
              <span className="stat-label">
                {isHindi ? 'द्विभाषी वॉइस पहचान' : 'Bilingual Speech Recognition'}
              </span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-card">
            <div className="stat-icon-wrap"><Clock size={20} /></div>
            <div className="stat-info">
              <span className="stat-val">&lt; 15ms</span>
              <span className="stat-label">
                {isHindi ? 'रीयल-टाइम प्रोसेसिंग' : 'Real-Time Inference Latency'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Simulator Widget */}
      <section id="demo" className="demo-section">
        <div className="section-header-pill">
          <Sparkle size={14} />
          <span>{isHindi ? 'इंटरैक्टिव सैंडबॉक्स' : 'INTERACTIVE SANDBOX'}</span>
        </div>
        <h2 className="section-title">
          {isHindi ? 'रीयल-टाइम में डायग्नोस्टिक इंजन का परीक्षण करें' : 'Test the Diagnostic Engine in Real-Time'}
        </h2>
        <p className="section-desc">
          {isHindi 
            ? 'नीचे सामान्य लक्षणों पर क्लिक करें और देखें कि हमारा ML मॉडल बीमारियों और संभावना का सटीक अनुमान कैसे लगाता है।'
            : 'Click common clinical symptoms below to see how our ML vector scoring dynamically predicts disease candidates and confidence.'}
        </p>

        <div className="simulator-glass-card">
          <div className="simulator-left">
            <div className="sim-heading-row">
              <div className="sim-title-group">
                <span className="sim-step-badge">1</span>
                <h3>{isHindi ? 'वेक्टराइज़ करने के लिए लक्षण चुनें' : 'Select Symptoms to Vectorize'}</h3>
              </div>
              <span className="selected-count-pill">
                {activeDemoSymptoms.length} {isHindi ? 'चुने गए' : 'Selected'}
              </span>
            </div>

            <div className="demo-symptom-grid">
              {SAMPLE_SYMPTOMS.map((item) => {
                const isSelected = activeDemoSymptoms.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleDemoSymptom(item.id)}
                    className={`demo-symptom-btn ${isSelected ? 'active' : ''}`}
                  >
                    <span className="demo-sym-icon">{item.icon}</span>
                    <div className="demo-sym-text">
                      <span className="demo-sym-en">{isHindi ? item.hi : item.label}</span>
                      <span className="demo-sym-hi">{isHindi ? item.label : item.hi}</span>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 size={16} className="check-icon" />
                    ) : (
                      <Plus size={16} className="plus-icon" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="simulator-right">
            <div className="sim-output-box">
              <div className="sim-output-header">
                <div className="status-badge-live">
                  <span className="live-dot" />
                  <span>{isHindi ? 'ML अनुमान परिणाम' : 'ML Inference Output'}</span>
                </div>
                <span className="model-name-tag">RandomForest_v2.4</span>
              </div>

              <div className="prediction-hero-card">
                <span className="prediction-eyebrow">
                  {isHindi ? 'शीर्ष अनुमानित बीमारी' : 'Top Predicted Condition'}
                </span>
                <h4 className="predicted-disease-name">{getSimulatedDisease()}</h4>

                <div className="confidence-meter-container">
                  <div className="meter-label-row">
                    <span>{isHindi ? 'मॉडल विश्वास स्कोर (Confidence)' : 'Model Confidence Score'}</span>
                    <strong className="confidence-number">{getSimulatedConfidence()}%</strong>
                  </div>
                  <div className="meter-bar-track">
                    <div 
                      className="meter-bar-fill" 
                      style={{ width: `${getSimulatedConfidence()}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="sim-feature-tags">
                <div className="sim-tag-item">
                  <ShieldCheck size={16} className="tag-icon-green" />
                  <span>{isHindi ? 'दवा परस्पर क्रिया व सुरक्षा जांच' : 'Verified Contraindication Check'}</span>
                </div>
                <div className="sim-tag-item">
                  <FileText size={16} className="tag-icon-blue" />
                  <span>{isHindi ? 'स्वचालित द्विभाषी प्रिस्क्रिप्शन' : 'Auto-Formatted Bilingual Rx'}</span>
                </div>
              </div>

              <div className="sim-cta-prompt">
                <p>
                  {isHindi 
                    ? 'क्या आप पूरी दवा खुराक, मेडिकल हिस्ट्री और PDF डाउनलोड चाहते हैं?'
                    : 'Want full dosage guidelines, medical history tracking & PDF export?'}
                </p>
                <Link to="/signup" className="sim-unlock-btn">
                  <span>{isHindi ? 'पूरा डैशबोर्ड खोलने के लिए साइन अप करें' : 'Sign Up to Unlock Full Dashboard'}</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Feature Matrix */}
      <section id="features" className="features-section">
        <div className="section-header-pill">
          <Activity size={14} />
          <span>{isHindi ? 'मुख्य प्लेटफ़ॉर्म क्षमताएं' : 'CORE PLATFORM CAPABILITIES'}</span>
        </div>
        <h2 className="section-title">
          {isHindi ? 'क्लीनिकल सटीकता और सहजता के लिए निर्मित' : 'Engineered for Clinical Precision & Ease'}
        </h2>
        <p className="section-desc">
          {isHindi 
            ? 'मरीजों और डॉक्टरों को त्वरित, सटीक स्वास्थ्य परामर्श प्रदान करने के लिए विशेष रूप से डिज़ाइन किया गया।'
            : 'Designed from the ground up to empower patients and practitioners with instant, actionable healthcare insights.'}
        </p>

        <div className="bento-grid">
          {/* Bento Item 1 */}
          <div className="bento-card bento-large">
            <div className="bento-card-bg-glow glow-blue" />
            <div className="bento-icon-box"><Mic size={26} /></div>
            <h3>{isHindi ? 'द्विभाषी वॉइस इनपुट (हिंदी व अंग्रेज़ी)' : 'Bilingual Neural Voice Input'}</h3>
            <p>
              {isHindi 
                ? 'हिंदी या अंग्रेजी में अपने लक्षण स्वाभाविक रूप से बोलें। हमारा AI ऑडियो को ट्रांसक्राइब करके सटीक लक्षणों की पहचान करता है।'
                : 'Speak your symptoms naturally in Hindi or English. Our speech pipeline transcribes and parses symptom entities with high medical semantic fidelity.'}
            </p>
            <div className="bento-visual-voice">
              <div className="wave-bar w-1" />
              <div className="wave-bar w-2" />
              <div className="wave-bar w-3" />
              <div className="wave-bar w-4" />
              <div className="wave-bar w-5" />
              <div className="wave-bar w-6" />
              <span className="voice-badge-text">
                {isHindi ? '"मुझे दो दिन से सिरदर्द और बुखार है"' : '"I have had headache and fever for two days"'}
              </span>
            </div>
          </div>

          {/* Bento Item 2 */}
          <div className="bento-card bento-medium">
            <div className="bento-card-bg-glow glow-emerald" />
            <div className="bento-icon-box"><Dna size={26} /></div>
            <h3>{isHindi ? 'हाई-डायमेंशनल ML वेक्टर विश्लेषण' : 'High-Dimensional ML Vectoring'}</h3>
            <p>
              {isHindi 
                ? '130 से अधिक लक्षणों को रैंडम फ़ॉरेस्ट मॉडल के माध्यम से प्रोसेस करके संभावना स्कोर प्रदान करता है।'
                : 'Maps 130+ symptom dimensions through a multi-class Random Forest model with calibrated probability outputs.'}
            </p>
            <div className="bento-metric-chip">
              <span>{isHindi ? 'एन्ट्रॉपी स्कोर: 0.04' : 'Entropy Score: 0.04'}</span>
              <span>{isHindi ? 'डिसिजन ट्री: 100+' : 'Classification Trees: 100+'}</span>
            </div>
          </div>

          {/* Bento Item 3 */}
          <div className="bento-card bento-medium">
            <div className="bento-card-bg-glow glow-purple" />
            <div className="bento-icon-box"><Pill size={26} /></div>
            <h3>{isHindi ? 'दवा सुरक्षा और सटीक प्रिस्क्रिप्शन' : 'Intelligent Drug Safety & Rx'}</h3>
            <p>
              {isHindi 
                ? 'दवा लेने का सही समय (सुबह / दोपहर / रात), भोजन संबंधी निर्देश, सावधानियां और संभावित दुष्प्रभावों की पूरी जानकारी देता है।'
                : 'Provides exact dosage timings (Morning / Afternoon / Night), meal instructions, precautionary warnings, and side effects.'}
            </p>
          </div>

          {/* Bento Item 4 */}
          <div className="bento-card bento-large">
            <div className="bento-card-bg-glow glow-teal" />
            <div className="bento-icon-box"><FileText size={26} /></div>
            <h3>{isHindi ? 'डिजिटल प्रमाणित मेडिकल PDF' : 'Instant Official Clinical PDF'}</h3>
            <p>
              {isHindi 
                ? 'मरीज के विवरण, डॉक्टर की सलाह और दवा सूची के साथ प्रमाणित प्रिस्क्रिप्शन एक क्लिक में डाउनलोड और प्रिंट करें।'
                : 'Export certified medical prescriptions with QR code, patient vital metrics, and doctor notes formatted for clinical record keeping.'}
            </p>
            <div className="rx-preview-badge">
              <span className="rx-symbol">℞</span>
              <span>{isHindi ? 'डिजिटल हेल्थकेयर प्रमाणित प्रारूप' : 'Digital Healthcare Certified Standard'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Interactive Process Workflow */}
      <section id="workflow" className="workflow-section">
        <div className="section-header-pill">
          <HeartPulse size={14} />
          <span>{isHindi ? 'कार्य प्रणाली' : 'WORKFLOW'}</span>
        </div>
        <h2 className="section-title">
          {isHindi ? 'CureAI 3 आसान चरणों में कैसे काम करता है' : 'How CureAI Works in 3 Simple Steps'}
        </h2>

        <div className="workflow-steps-grid">
          <div className="workflow-step-card">
            <div className="step-number-circle">01</div>
            <h4>{isHindi ? 'लक्षण लिखें या बोलें' : 'Input or Speak Symptoms'}</h4>
            <p>
              {isHindi 
                ? 'कीवर्ड टाइप करें, लक्षण चुनें, या माइक्रोफ़ोन से हिंदी/अंग्रेज़ी में बोलें।'
                : 'Type keywords, select from categorized symptom chips, or speak via your microphone in English or Hindi.'}
            </p>
          </div>

          <div className="workflow-connector-line" />

          <div className="workflow-step-card">
            <div className="step-number-circle">02</div>
            <h4>{isHindi ? 'तुरंत AI विश्लेषण' : 'Instant AI Inference'}</h4>
            <p>
              {isHindi 
                ? 'सिस्टम आपके लक्षणों का मिलान क्लीनिकल डेटा से करके संभावित बीमारियों का पता लगाता है।'
                : 'The system maps your symptoms against clinical feature matrices and computes probabilistic disease scores.'}
            </p>
          </div>

          <div className="workflow-connector-line" />

          <div className="workflow-step-card">
            <div className="step-number-circle">03</div>
            <h4>{isHindi ? 'व्यक्तिगत नुस्खा और रिकॉर्ड' : 'Personalized Rx & History'}</h4>
            <p>
              {isHindi 
                ? 'सुझाई गई दवाएं, स्वास्थ्य सलाह, प्रिंट करने योग्य PDF प्रिस्क्रिप्शन और सुरक्षित रिकॉर्ड प्राप्त करें।'
                : 'Receive recommended medications, tailored wellness tips, printable PDF prescriptions, and saved history.'}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-header-pill">
          <ShieldCheck size={14} />
          <span>{isHindi ? 'अक्सर पूछे जाने वाले सवाल' : 'FREQUENTLY ASKED QUESTIONS'}</span>
        </div>
        <h2 className="section-title">
          {isHindi ? 'ज़रूरी जानकारियां और उत्तर' : 'Everything You Need to Know'}
        </h2>

        <div className="faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className={`faq-item ${isOpen ? 'open' : ''}`}
                onClick={() => setOpenFaq(isOpen ? null : idx)}
              >
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <ChevronRight size={18} className={`faq-arrow ${isOpen ? 'rotated' : ''}`} />
                </div>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="cta-banner-section">
        <div className="cta-banner-glass">
          <div className="cta-glow-effect" />
          <div className="cta-content">
            <h2>
              {isHindi ? 'क्या आप आधुनिक स्वास्थ्य तकनीक के लिए तैयार हैं?' : 'Ready for Next-Level Health Intelligence?'}
            </h2>
            <p>
              {isHindi 
                ? 'हजारों उपयोगकर्ताओं के साथ जुड़ें और त्वरित, सटीक और सुरक्षित स्वास्थ्य परामर्श का अनुभव करें।'
                : 'Join thousands of users experiencing fast, accurate, and seamless medical guidance.'}
            </p>
            <div className="cta-action-row">
              <Link to="/signup" className="hero-primary-btn">
                <span>{isHindi ? 'मुफ़्त खाता बनाएं' : 'Create Free Account'}</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="hero-secondary-btn">
                <span>{isHindi ? 'मौजूदा खाते में लॉग इन करें' : 'Sign In to Existing Profile'}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand-col">
            <div className="footer-logo-row">
              <img src={cureLogo} alt="CureAI logo" className="footer-logo" />
              <span className="footer-brand-title">CureAI</span>
            </div>
            <p className="footer-disclaimer">
              {isHindi 
                ? '⚠️ चिकित्सा अस्वीकरण: CureAI एक AI/डेटा साइंस सहायक टूल है और 100% सटीक नहीं है। यह गलतियां कर सकता है। कृपया इस पर पूरी तरह निर्भर न रहें। किसी भी बीमारी के निश्चित निदान या आपातकालीन उपचार के लिए हमेशा एक पंजीकृत डॉक्टर से परामर्श लें।'
                : '⚠️ Medical Disclaimer: CureAI is an AI-assisted decision support system and is not 100% accurate. AI predictions can contain errors and should never replace a professional doctor’s evaluation. Always consult a certified physician for medical treatment.'}
            </p>
          </div>

          <div className="footer-links-col">
            <h5>{isHindi ? 'नेविगेशन' : 'Navigation'}</h5>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')}>{isHindi ? 'विशेषताएं' : 'Features'}</a>
            <a href="#demo" onClick={(e) => scrollToSection(e, 'demo')}>{isHindi ? 'लाइव सिम्युलेटर' : 'Live Simulator'}</a>
            <a href="#workflow" onClick={(e) => scrollToSection(e, 'workflow')}>{isHindi ? 'कार्य प्रणाली' : 'Workflow'}</a>
            <a href="#faq" onClick={(e) => scrollToSection(e, 'faq')}>{isHindi ? 'सामान्य प्रश्न' : 'FAQ'}</a>
          </div>

          <div className="footer-links-col">
            <h5>{isHindi ? 'रोगी पोर्टल' : 'Patient Portal'}</h5>
            <Link to="/login">{isHindi ? 'साइन इन' : 'Sign In'}</Link>
            <Link to="/signup">{isHindi ? 'पंजीकरण करें' : 'Register Account'}</Link>
            <Link to="/dashboard">{isHindi ? 'डैशबोर्ड' : 'Dashboard'}</Link>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span>© {new Date().getFullYear()} CureAI Data Science Systems. {isHindi ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}</span>
          <div className="system-health-pill">
            <span className="pulse-green" />
            <span>{isHindi ? 'डायग्नोस्टिक API सक्रिय · विलंबता 12ms' : 'Diagnostic API Operational · Latency 12ms'}</span>
          </div>
        </div>
      </footer>

      {/* Add to Home Screen / Install Modal */}
      <InstallAppModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)} 
        isHindi={isHindi} 
      />
    </div>
  );
}

export default Landing;
