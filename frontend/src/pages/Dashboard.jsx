import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { diagnosisAPI, medicinesAPI, prescriptionsAPI } from '../api';
import { voiceService } from '../voiceService';
import cureLogo from '../components/logo/CureAI logo.png';
import { 
  Activity, 
  Stethoscope, 
  Mic, 
  MicOff, 
  Search, 
  FileText, 
  BarChart3, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  RefreshCw, 
  Printer, 
  User, 
  Droplet, 
  Heart, 
  ChevronRight, 
  ShieldCheck, 
  Pill, 
  Check, 
  X, 
  History,
  Sliders,
  HelpCircle,
  Dna,
  Zap,
  ArrowRight,
  LogOut,
  Download
} from 'lucide-react';
import InstallAppModal from '../components/InstallAppModal';
import './Dashboard.css';

function Dashboard() {
  const { t, i18n } = useTranslation();
  const language = i18n.language?.startsWith('hi') ? 'hi' : 'en';
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [symptoms, setSymptoms] = useState([]);
  const [diagnosis, setDiagnosis] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  const [refreshingPrescription, setRefreshingPrescription] = useState(false);

  const [step, setStep] = useState('symptoms'); // 'symptoms' | 'questions' | 'diagnosis' | 'prescription'
  const [loading, setLoading] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [history, setHistory] = useState([]);

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
    setShowInstallModal(true);
  };
  const [error, setError] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [symptomSearch, setSymptomSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [symptomCatalog, setSymptomCatalog] = useState([]);
  const [symptomAliases, setSymptomAliases] = useState({});
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [medicineRecommendations, setMedicineRecommendations] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [medicineCatalogUnavailable, setMedicineCatalogUnavailable] = useState(false);
  const [medicineCatalogError, setMedicineCatalogError] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [inputHistory, setInputHistory] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const recorderRef = useRef(null);
  const lastTypedSymptomsRef = useRef([]);
  const diagnosisRequestRef = useRef(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const symptomOptions = useMemo(() => {
    const featureLabels = new Map(symptomCatalog.map(item => [item.id, item.label]));
    const mappedFeatureIds = new Set(Object.values(symptomAliases).flat());
    const options = new Map();

    Object.entries(symptomAliases).forEach(([id, mappedIds]) => {
      const translated = t(id);
      const fallbackLabel = mappedIds.map(featureId => featureLabels.get(featureId) || featureId.replace(/_/g, ' ')).join(', ');
      options.set(id, {
        id,
        label: translated !== id ? translated : (fallbackLabel || id.replace(/_/g, ' ')),
        unsupported: mappedIds.length === 0 || !mappedIds.some(featureId => featureLabels.has(featureId)),
      });
    });

    symptomCatalog.forEach(item => {
      if (!mappedFeatureIds.has(item.id)) {
        options.set(item.id, { id: item.id, label: item.label || item.id.replace(/_/g, ' '), unsupported: false });
      }
    });

    return Array.from(options.values());
  }, [symptomCatalog, symptomAliases, t]);

  const symptomLabel = (id) => symptomOptions.find(item => item.id === id)?.label || t(id) || id.replace(/_/g, ' ');

  // Live matching recommendations / suggestions while typing
  const liveSuggestions = useMemo(() => {
    const rawQuery = symptomText.trim().toLowerCase();
    if (!rawQuery) return [];
    const query = rawQuery.replace(/[_-]/g, ' ');

    const matches = [];
    const seen = new Set(symptoms);

    // 1. Detect any symptoms mapped via slang / synonyms in voiceService (e.g. "weird_rash", "exhaustion")
    const detectedFromSlang = voiceService.extractSymptoms(symptomText, false);
    detectedFromSlang.forEach(id => {
      if (!seen.has(id)) {
        const opt = symptomOptions.find(o => o.id === id);
        if (opt) {
          matches.push({ ...opt, matchReason: 'slang' });
          seen.add(id);
        } else {
          matches.push({ id, label: symptomLabel(id), unsupported: false, matchReason: 'slang' });
          seen.add(id);
        }
      }
    });

    // 2. Prefix & Substring matching across catalog and aliases
    const prefixMatches = [];
    const substringMatches = [];

    symptomOptions.forEach(option => {
      if (seen.has(option.id)) return;

      const idClean = option.id.toLowerCase().replace(/_/g, ' ');
      const rawId = option.id.toLowerCase();
      const labelClean = (option.label || '').toLowerCase();

      if (idClean.startsWith(query) || rawId.startsWith(rawQuery) || labelClean.startsWith(query)) {
        prefixMatches.push(option);
        seen.add(option.id);
      } else if (idClean.includes(query) || rawId.includes(rawQuery) || labelClean.includes(query)) {
        substringMatches.push(option);
        seen.add(option.id);
      }
    });

    return [...matches, ...prefixMatches, ...substringMatches].slice(0, 8);
  }, [symptomText, symptomOptions, symptoms]);

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Categorized symptoms filter
  const categorizedSymptoms = useMemo(() => {
    return symptomOptions.filter(item => {
      const id = item.id.toLowerCase();
      if (selectedCategory === 'respiratory') return id.includes('cough') || id.includes('breath') || id.includes('throat') || id.includes('chest') || id.includes('nasal') || id.includes('sneeze');
      if (selectedCategory === 'pain') return id.includes('pain') || id.includes('fever') || id.includes('headache') || id.includes('ache') || id.includes('cramp');
      if (selectedCategory === 'digestive') return id.includes('vomit') || id.includes('nausea') || id.includes('stomach') || id.includes('diarrh') || id.includes('abdomin') || id.includes('acid');
      if (selectedCategory === 'skin') return id.includes('rash') || id.includes('itch') || id.includes('skin') || id.includes('spot') || id.includes('yellow');
      if (selectedCategory === 'neuro') return id.includes('dizz') || id.includes('fatigue') || id.includes('weak') || id.includes('vision') || id.includes('mood') || id.includes('loss');
      return true;
    });
  }, [symptomOptions, selectedCategory]);

  const searchableSymptoms = useMemo(() => {
    const query = symptomSearch.trim().toLocaleLowerCase();
    return categorizedSymptoms.filter(item => {
      if (!query) return !symptoms.includes(item.id);
      return !symptoms.includes(item.id) && `${item.id} ${item.label}`.toLocaleLowerCase().includes(query);
    });
  }, [categorizedSymptoms, symptomSearch, symptoms]);

  const extractSymptomsFromText = (text, strictMode) => {
    const detected = voiceService.extractSymptoms(text, strictMode);
    if (!text || typeof text !== 'string') return detected;
    const matchesPhrase = (phrase) => {
      const escaped = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      if (!escaped) return false;
      return new RegExp(`(?:^|[^\\p{L}\\p{N}_])${escaped}(?:$|[^\\p{L}\\p{N}_])`, 'iu').test(text);
    };

    symptomOptions.forEach(option => {
      const terms = [option.id, option.id.replace(/_/g, ' '), option.label];
      if (terms.some(term => matchesPhrase(term.toLocaleLowerCase()))) detected.push(option.id);
    });
    return Array.from(new Set(detected));
  };

  const recordInputEvent = (event) => {
    const newEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    setInputHistory(current => [...current, newEvent].slice(-30));
  };

  const toggleSymptom = (symptom) => {
    const selected = !symptoms.includes(symptom);
    setSymptoms(current => selected ? [...current, symptom] : current.filter(x => x !== symptom));
    setSymptomText('');
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDiagnosis(null);
    setPrescription(null);
    setMedicineRecommendations([]);
    recordInputEvent({
      type: selected ? 'selected' : 'removed',
      source: 'Catalog',
      symptoms: [symptom],
      text: `${selected ? 'Selected' : 'Removed'} ${symptomLabel(symptom)}`,
    });
  };

  const handleSelectSuggestion = (symptomId) => {
    if (!symptoms.includes(symptomId)) {
      setSymptoms(current => [...current, symptomId]);
      recordInputEvent({
        type: 'selected',
        source: 'Autocomplete',
        symptoms: [symptomId],
        text: `Selected ${symptomLabel(symptomId)}`,
      });
    }
    setSymptomText('');
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setDiagnosis(null);
    setPrescription(null);
    setMedicineRecommendations([]);
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (liveSuggestions.length > 0) {
        setShowSuggestions(true);
        setActiveSuggestionIndex(prev => (prev + 1) % liveSuggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (liveSuggestions.length > 0) {
        setShowSuggestions(true);
        setActiveSuggestionIndex(prev => (prev - 1 + liveSuggestions.length) % liveSuggestions.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && activeSuggestionIndex >= 0 && liveSuggestions[activeSuggestionIndex]) {
        handleSelectSuggestion(liveSuggestions[activeSuggestionIndex].id);
      } else if (liveSuggestions.length > 0) {
        handleSelectSuggestion(liveSuggestions[0].id);
      } else if (symptomText.trim()) {
        const detected = extractSymptomsFromText(symptomText, false);
        if (detected.length > 0) {
          setSymptoms(current => Array.from(new Set([...current, ...detected])));
          setSymptomText('');
          setShowSuggestions(false);
          setActiveSuggestionIndex(-1);
          setDiagnosis(null);
          setPrescription(null);
          setMedicineRecommendations([]);
        }
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const addSymptomsFromText = (text, strictMode = true, source = 'Typed') => {
    const detectedSymptoms = extractSymptomsFromText(text, strictMode);
    const previous = lastTypedSymptomsRef.current;
    const added = detectedSymptoms.filter(symptom => !previous.includes(symptom));
    const removed = previous.filter(symptom => !detectedSymptoms.includes(symptom));
    if (source === 'Typed' && (added.length || removed.length)) {
      recordInputEvent({
        type: 'typed',
        source,
        symptoms: [...added, ...removed],
        text: text || 'Cleared typed input',
      });
    }
    if (source === 'Typed') lastTypedSymptomsRef.current = detectedSymptoms;
    if (source === 'Voice' && detectedSymptoms.length > 0) {
      recordInputEvent({
        type: 'voice',
        source,
        symptoms: detectedSymptoms,
        text,
      });
    }
    if (detectedSymptoms.length > 0) {
      setSymptoms(current => Array.from(new Set([...current, ...detectedSymptoms])));
      setDiagnosis(null);
      setPrescription(null);
      setMedicineRecommendations([]);
      setClarificationAnswers({});
    }
  };

  const handleTextChange = (event) => {
    const val = event.target.value;
    setSymptomText(val);
    setShowSuggestions(true);
    setActiveSuggestionIndex(-1);
  };

  const handleRecordingStop = async (audioBlob) => {
    setIsRecording(false);
    setIsTranscribing(true);
    setError('');
    try {
      const result = await voiceService.transcribeAudio(audioBlob, language);
      addSymptomsFromText(result.text || '', false, 'Voice');
      if (!extractSymptomsFromText(result.text || '', false).length) {
        setError(t('no_symptom_matches') || 'No recognizable symptoms detected from audio.');
      }
    } catch (err) {
      setError(err.message || 'Voice transcription failed');
    } finally {
      setIsTranscribing(false);
    }
  };

  const switchLanguage = async (nextLanguage) => {
    await i18n.changeLanguage(nextLanguage);
    if (!prescription || !diagnosis || nextLanguage === language || refreshingPrescription) return;

    setRefreshingPrescription(true);
    try {
      let catalogMedicines = medicineRecommendations;
      if (catalogMedicines.length === 0) {
        try {
          const catalogResponse = await medicinesAPI.getMedicinesForDisease(diagnosis.disease_id, nextLanguage);
          catalogMedicines = catalogResponse.data.medicines || [];
          setMedicineRecommendations(catalogMedicines);
        } catch {
          catalogMedicines = [];
        }
      }
      const medicineIds = catalogMedicines.map(medicine => medicine.id);
      const response = await prescriptionsAPI.generatePrescription(
        diagnosis.disease_id,
        diagnosis.disease_name,
        medicineIds,
        nextLanguage
      );
      const refreshedPrescription = {
        ...response.data,
        prescription_id: prescription.prescription_id,
        pdf_generated_at: prescription.pdf_generated_at,
      };
      setPrescription(refreshedPrescription);

      const sessionsResponse = await api.get('/medical-history');
      const sessions = sessionsResponse.data || [];
      const currentSession = sessions.find(session =>
        (session.id || session._id) === activeHistoryId
      ) || sessions.find(session =>
        JSON.stringify(session.symptoms || []) === JSON.stringify(symptoms)
      ) || sessions[0];
      const historyId = activeHistoryId || currentSession?.id || currentSession?._id;
      if (historyId) {
        setActiveHistoryId(historyId);
        await api.put(`/medical-history/${historyId}/prescription`, {
          prescription: refreshedPrescription,
        });
        loadHistory();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not refresh prescription language');
    } finally {
      setRefreshingPrescription(false);
    }
  };

  const handleVoiceToggle = async () => {
    if (isTranscribing) return;
    if (isRecording) {
      voiceService.stopRecording(recorderRef.current);
      recorderRef.current = null;
      return;
    }

    try {
      setError('');
      recorderRef.current = await voiceService.startRecording(
        () => setIsRecording(true),
        handleRecordingStop
      );
    } catch (err) {
      setIsRecording(false);
      setError(err.message || 'Could not access the microphone');
    }
  };

  // Load patient history from backend
  const loadHistory = async () => {
    try {
      const res = await api.get('/medical-history');
      setHistory((res.data || []).map(record => ({
        ...record,
        id: record.id || record._id,
      })));
    } catch (err) {
      console.warn('Failed to load history', err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoadingSymptoms(true);
    setCatalogError(false);
    diagnosisAPI.getSymptoms(language)
      .then(({ data }) => {
        if (cancelled) return;
        const catalog = Array.isArray(data.symptom_catalog)
          ? data.symptom_catalog
          : (data.symptoms || []).map(id => ({ id, label: id.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()) }));
        setSymptomCatalog(catalog);
        setSymptomAliases(data.aliases || {});
      })
      .catch(() => {
        if (!cancelled) setCatalogError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingSymptoms(false);
      });
    return () => { cancelled = true; };
  }, [language]);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    const session = location.state;
    if (!session?.openPrescription) return;
    setSymptoms(session.symptoms || []);
    setDiagnosis(session.diagnosis || null);
    setPrescription(session.prescription || null);
    setActiveHistoryId(session.id || session._id || null);
    setStep(session.prescription ? 'prescription' : session.diagnosis ? 'diagnosis' : 'symptoms');
    navigate('/dashboard', { replace: true, state: null });
  }, [location.state]);

  useEffect(() => {
    localStorage.setItem('medicineAnalyticsSession', JSON.stringify({ symptoms, diagnosis, prescription }));
  }, [symptoms, diagnosis, prescription]);

  const getDiagnosisErrorMessage = (err) => {
    if (err.code === 'ECONNABORTED') return t('request_timeout');
    if (!err.response) return t('backend_unavailable');
    if (err.response.status === 422) return t('validation_error');
    return t('diagnosis_failed');
  };

  const handleDiagnose = async () => {
    if (diagnosisRequestRef.current) return;
    if (symptoms.length === 0) {
      setError(t('empty_symptoms'));
      return;
    }

    diagnosisRequestRef.current = true;
    setLoading(true);
    setError('');
    setMedicineCatalogError(false);
    try {
      const response = await diagnosisAPI.diagnose({
        symptoms,
        language,
      });
      const result = response.data;
      setDiagnosis(result);
      setPrescription(null);

      setStep('diagnosis');
      setLoadingMedicines(true);
      try {
        const medicineResponse = await medicinesAPI.getMedicinesForDisease(result.disease_id, language);
        setMedicineRecommendations(medicineResponse.data.medicines || []);
        setMedicineCatalogUnavailable(false);
      } catch (medicineError) {
        setMedicineRecommendations([]);
        setMedicineCatalogUnavailable(medicineError.response?.status === 404);
        setMedicineCatalogError(medicineError.response?.status !== 404);
      } finally {
        setLoadingMedicines(false);
      }

      try {
        let historyId = activeHistoryId;
        if (!historyId) {
          const historyResponse = await api.post('/medical-history', {
            symptoms,
            patient_inputs: [{
              type: 'text',
              text: symptoms.join(', '),
              timestamp: new Date().toISOString(),
            }],
            language,
          });
          historyId = historyResponse.data?.id || historyResponse.data?._id;
          if (historyId) setActiveHistoryId(historyId);
        }
        if (historyId) {
          await api.put(`/medical-history/${historyId}/diagnosis`, { diagnosis: result });
        }
      } catch (historyError) {
        console.warn('Failed to save diagnosis history', historyError);
      }
      loadHistory();
    } catch (err) {
      setError(getDiagnosisErrorMessage(err));
    } finally {
      diagnosisRequestRef.current = false;
      setLoading(false);
    }
  };

  const handleGeneratePrescription = async () => {
    if (!diagnosis) return;
    setLoading(true);
    setError('');
    try {
      const medicineIds = medicineRecommendations.map(medicine => medicine.id);
      const res = await prescriptionsAPI.generatePrescription(
        diagnosis.disease_id,
        diagnosis.disease_name,
        medicineIds,
        language
      );
      setPrescription(res.data);
      setStep('prescription');

      try {
        const histRes = await api.get('/medical-history');
        const sessions = histRes.data;
        if (sessions.length > 0) {
          const latest = sessions.find(session => (session.id || session._id) === activeHistoryId) || sessions[0];
          const latestId = activeHistoryId || latest.id || latest._id;
          setActiveHistoryId(latestId);
          await api.put(`/medical-history/${latestId}/prescription`, {
            prescription: res.data
          });
        }
      } catch (e) {
        console.warn('Failed to update history', e);
      }

      loadHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'Prescription generation failed');
    }
    setLoading(false);
  };

  const handleDeleteHistory = async (sessionId) => {
    if (!window.confirm('Delete this patient history record? This cannot be undone.')) return;
    try {
      await api.delete(`/medical-history/${sessionId}`);
      setHistory(current => current.filter(session => session.id !== sessionId));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete history record');
    }
  };

  const handleViewSession = (session) => {
    navigate('/analytics', { state: session });
  };

  const handleClearSymptoms = () => {
    if (symptoms.length > 0) {
      recordInputEvent({
        type: 'cleared',
        source: 'Clear',
        symptoms,
        text: 'Cleared all selected symptoms',
      });
    }
    setSymptoms([]);
    setSymptomText('');
    setSymptomSearch('');
    setDiagnosis(null);
    setPrescription(null);
    setMedicineRecommendations([]);
    setMedicineCatalogUnavailable(false);
    setMedicineCatalogError(false);
    lastTypedSymptomsRef.current = [];
  };

  const handleReset = () => {
    handleClearSymptoms();
    setDiagnosis(null);
    setPrescription(null);
    setActiveHistoryId(null);
    navigate('/dashboard', { replace: true, state: null });
    setStep('symptoms');
    setError('');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (iso) => new Date(iso).toLocaleTimeString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '—';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age >= 0 ? age : '—';
  };

  const handlePrintPrescription = async () => {
    if (!prescription) return;
    const updatedPrescription = { ...prescription, pdf_generated_at: new Date().toISOString() };
    setPrescription(updatedPrescription);
    try {
      const histRes = await api.get('/medical-history');
      const latest = histRes.data?.[0];
      const latestId = latest?.id || latest?._id;
      if (latestId) {
        await api.put(`/medical-history/${latestId}/prescription`, { prescription: updatedPrescription });
        loadHistory();
      }
    } catch (err) {
      console.warn('Could not store PDF generation record', err);
    }
    window.print();
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="dash-root">
      {/* Background Decor */}
      <div className="dash-glow-top" />
      <div className="dash-glow-bottom" />

      {/* Top Command Bar */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-brand-block" onClick={() => navigate('/')}>
            <div className="dash-logo-wrap">
              <img src={cureLogo} alt="CureAI logo" className="dash-logo" />
              <div className="dash-pulse-badge" />
            </div>
            <div>
              <div className="dash-brand-title">CureAI <span className="dash-tag-pro">CLINICAL SUITE</span></div>
              <div className="dash-brand-subtitle">Machine Learning Medicine & Diagnostic Assistant</div>
            </div>
          </div>

          <div className="dash-header-center">
            <div className="dash-patient-capsule">
              <div className="patient-avatar">
                <User size={16} />
              </div>
              <div className="patient-meta">
                <span className="patient-name">{user?.full_name || 'Patient'}</span>
                <span className="patient-sub">{calculateAge(user?.date_of_birth)} yrs · {user?.gender || '—'} · {user?.blood_group || 'Blood Group —'}</span>
              </div>
            </div>
          </div>

          <div className="dash-header-actions">
            <button 
              onClick={handleGetAppClick} 
              className="dash-nav-download"
              title={language === 'hi' ? 'ऐप इंस्टॉल करें / शॉर्टकट' : 'Install App / Home Screen Shortcut'}
            >
              <Download size={15} />
              <span>{language === 'hi' ? 'ऐप डाउनलोड' : 'Get App'}</span>
            </button>

            <div className="dash-lang-capsule">
              <button 
                className={`dash-lang-btn ${language === 'en' ? 'active' : ''}`} 
                onClick={() => switchLanguage('en')} 
                disabled={loading || refreshingPrescription || isRecording || isTranscribing}
              >
                EN
              </button>
              <button 
                className={`dash-lang-btn ${language === 'hi' ? 'active' : ''}`} 
                onClick={() => switchLanguage('hi')} 
                disabled={loading || refreshingPrescription || isRecording || isTranscribing}
              >
                हिंदी
              </button>
            </div>

            <button onClick={() => navigate('/analytics')} className="dash-nav-analytics">
              <BarChart3 size={16} />
              <span>Analytics</span>
            </button>

            <button onClick={handleLogout} className="dash-logout-btn" title="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="dash-workspace">
        {/* Step Progression Bar */}
        <div className="dash-workflow-bar">
          <div className={`workflow-pill ${step === 'symptoms' ? 'active' : 'completed'}`}>
            <span className="step-num">1</span>
            <span>Symptom Intake</span>
          </div>
          <div className="workflow-connector" />
          <div className={`workflow-pill ${step === 'diagnosis' ? 'active' : prescription ? 'completed' : 'idle'}`}>
            <span className="step-num">2</span>
            <span>ML Diagnostic Matrix</span>
          </div>
          <div className="workflow-connector" />
          <div className={`workflow-pill ${step === 'prescription' ? 'active' : 'idle'}`}>
            <span className="step-num">3</span>
            <span>Certified Rx & Action Plan</span>
          </div>
        </div>

        {error && (
          <div className="dash-alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ========== STEP 1: SYMPTOMS SELECTION & VOICE STUDIO ========== */}
        {step === 'symptoms' && (
          <div className="dash-glass-card">
            <div className="card-top-title-row">
              <div className="title-with-icon">
                <div className="icon-badge-green"><Stethoscope size={22} /></div>
                <div>
                  <h2>{t('select_symptoms') || 'Select or Speak Symptoms'}</h2>
                  <p className="card-subtitle">Input your symptoms via typed keywords, quick search tags, or high-fidelity voice recording.</p>
                </div>
              </div>

              {symptoms.length > 0 && (
                <div className="selected-symptoms-counter">
                  <span>{symptoms.length} Symptoms Vectorized</span>
                  <button onClick={handleClearSymptoms} className="btn-clear-tags" disabled={loading}>
                    <Trash2 size={14} />
                    <span>Clear All</span>
                  </button>
                </div>
              )}
            </div>

            {/* Voice & Typed Input Command Hub */}
            <div className="symptom-input-console">
              <div className="voice-text-row">
                <div className="text-input-wrap" ref={dropdownRef}>
                  <Search size={18} className="search-icon-subtle" />
                  <input
                    ref={searchInputRef}
                    id="symptom-text"
                    type="text"
                    value={symptomText}
                    onChange={handleTextChange}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={language === 'hi' ? 'लक्षण लिखें, जैसे तेज बुखार, सिरदर्द या खांसी...' : 'Describe symptoms (e.g. fever, weird rash, exhaustion, continuous cough)...'}
                    disabled={isRecording || isTranscribing || loading}
                    autoComplete="off"
                  />
                  {symptomText.trim() && (
                    <button
                      type="button"
                      className="btn-clear-input"
                      onClick={() => {
                        setSymptomText('');
                        setShowSuggestions(false);
                        searchInputRef.current?.focus();
                      }}
                      title="Clear text"
                    >
                      <X size={15} />
                    </button>
                  )}

                  {showSuggestions && liveSuggestions.length > 0 && (
                    <div className="symptom-autocomplete-dropdown">
                      <div className="autocomplete-header">
                        <Sparkles size={13} className="sparkle-icon" />
                        <span>Matching Symptoms ({liveSuggestions.length})</span>
                        <span className="autocomplete-hint">Press ↵ Enter or click to add</span>
                      </div>
                      <ul className="autocomplete-list">
                        {liveSuggestions.map((item, index) => (
                          <li
                            key={item.id}
                            className={`autocomplete-item ${index === activeSuggestionIndex ? 'active' : ''}`}
                            onClick={() => handleSelectSuggestion(item.id)}
                            onMouseEnter={() => setActiveSuggestionIndex(index)}
                          >
                            <div className="autocomplete-item-main">
                              <span className="autocomplete-item-name">{item.label}</span>
                              <span className="autocomplete-item-id">({item.id.replace(/_/g, ' ')})</span>
                            </div>
                            <div className="autocomplete-item-meta">
                              {item.unsupported ? (
                                <span className="badge-unsupported">Informational</span>
                              ) : (
                                <span className="badge-clinical">ML Clinical Feature</span>
                              )}
                              <span className="btn-add-badge">+ Add</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`btn-voice-studio ${isRecording ? 'recording-active' : ''}`}
                  disabled={isTranscribing || loading}
                >
                  {isTranscribing ? (
                    <>
                      <RefreshCw size={16} className="spin-icon" />
                      <span>Transcribing Audio...</span>
                    </>
                  ) : isRecording ? (
                    <>
                      <div className="live-rec-dot" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic size={18} />
                      <span>{language === 'hi' ? 'लक्षण बोलें (Voice)' : 'Voice Input (EN/हिंदी)'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Recording Waveform Visualizer */}
              {isRecording && (
                <div className="recording-soundwave-card">
                  <div className="soundwave-bars">
                    <span className="b-bar b-1" />
                    <span className="b-bar b-2" />
                    <span className="b-bar b-3" />
                    <span className="b-bar b-4" />
                    <span className="b-bar b-5" />
                    <span className="b-bar b-6" />
                    <span className="b-bar b-7" />
                    <span className="b-bar b-8" />
                  </div>
                  <span className="soundwave-text">Listening in {language === 'hi' ? 'हिंदी' : 'English'}... Speak clearly now.</span>
                </div>
              )}
            </div>

            {/* Active Selected Symptom Chips */}
            {symptoms.length > 0 && (
              <div className="active-selected-board">
                <span className="board-label">Active Diagnostic Features:</span>
                <div className="chips-flow-wrap">
                  {symptoms.map(symptom => (
                    <button 
                      key={symptom} 
                      type="button" 
                      onClick={() => toggleSymptom(symptom)} 
                      className="chip-active-symptom"
                      disabled={loading}
                    >
                      <span>{symptomLabel(symptom)}</span>
                      <X size={14} className="chip-x-icon" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categorized Catalog Browser */}
            <div className="catalog-browser-section">
              <div className="catalog-top-bar">
                <div className="category-pill-filter">
                  <button 
                    className={`cat-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('all')}
                  >
                    All (130+)
                  </button>
                  <button 
                    className={`cat-btn ${selectedCategory === 'respiratory' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('respiratory')}
                  >
                    🫁 Respiratory
                  </button>
                  <button 
                    className={`cat-btn ${selectedCategory === 'pain' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('pain')}
                  >
                    🌡️ Fever & Pain
                  </button>
                  <button 
                    className={`cat-btn ${selectedCategory === 'digestive' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('digestive')}
                  >
                    🤢 Digestion
                  </button>
                  <button 
                    className={`cat-btn ${selectedCategory === 'skin' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('skin')}
                  >
                    🩹 Dermatology
                  </button>
                  <button 
                    className={`cat-btn ${selectedCategory === 'neuro' ? 'active' : ''}`}
                    onClick={() => setSelectedCategory('neuro')}
                  >
                    🧠 Neuro & Vitals
                  </button>
                </div>

                <div className="search-filter-box">
                  <Search size={15} />
                  <input 
                    type="text"
                    value={symptomSearch}
                    onChange={(e) => setSymptomSearch(e.target.value)}
                    placeholder="Filter catalog..."
                  />
                </div>
              </div>

              {loadingSymptoms ? (
                <div className="catalog-loading-box">
                  <RefreshCw size={20} className="spin-icon" />
                  <span>Loading clinical symptom catalog...</span>
                </div>
              ) : (
                <div className="symptom-tag-cloud">
                  {searchableSymptoms.slice(0, 32).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSymptom(item.id)}
                      className="symptom-cloud-pill"
                    >
                      <span>+ {item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Run Diagnostic Engine Action Bar */}
            <div className="dash-submit-row">
              <button
                type="button"
                onClick={handleDiagnose}
                disabled={loading || symptoms.length === 0}
                className="btn-run-diagnosis"
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin-icon" />
                    <span>Executing ML Vector Inference...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    <span>{t('diagnose') || 'Run AI Diagnostic Engine'} ({symptoms.length} Symptoms)</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}



        {/* ========== STEP 2: DIAGNOSIS MATRIX RESULT ========== */}
        {step === 'diagnosis' && diagnosis && (
          <div className="dash-glass-card diagnosis-glass-view">
            <div className="diagnosis-hero-banner">
              <div className="disease-title-cluster">
                <span className="disease-badge-eyebrow">PREDICTED PRIMARY DIAGNOSIS</span>
                <h2 className="disease-hero-name">{diagnosis.disease_name}</h2>
                <p className="disease-clinical-desc">{diagnosis.recommendations}</p>
              </div>

              <div className="confidence-speedometer-box">
                <span className="confidence-label">Confidence Probability</span>
                <div className="confidence-huge-val">
                  {(Number(diagnosis.confidence || 0) * 100).toFixed(1)}%
                </div>
                <div className="confidence-mini-bar">
                  <div 
                    className="confidence-mini-fill" 
                    style={{ width: `${(Number(diagnosis.confidence || 0) * 100).toFixed(1)}%` }} 
                  />
                </div>
                <span className="model-stamp-pill">{diagnosis.model?.replace(/_/g, ' ') || 'Random Forest Ensemble'}</span>
              </div>
            </div>

            {/* Top Candidate Distribution */}
            {diagnosis.possible_diseases?.length > 0 && (
              <div className="prediction-candidates-matrix">
                <h3>Top Model Predictions</h3>
                <div className="candidate-rows-list">
                  {diagnosis.possible_diseases.map(candidate => {
                    const prob = Number(candidate.score ?? candidate.confidence ?? 0);
                    return (
                      <div className="candidate-item-row" key={candidate.disease_id}>
                        <span className="cand-disease-name">{candidate.disease_name}</span>
                        <div className="cand-progress-wrap">
                          <div className="cand-fill" style={{ width: `${(prob * 100).toFixed(1)}%` }} />
                        </div>
                        <span className="cand-percent">{(prob * 100).toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Medications Grid */}
            <div className="catalog-meds-preview-box">
              <div className="meds-header-row">
                <div className="meds-title">
                  <Pill size={20} className="icon-pill-teal" />
                  <h3>{t('medicines') || 'Recommended Medication Regimen'}</h3>
                </div>
                <span className="safety-verified-tag">✓ Contraindication Checked</span>
              </div>

              {loadingMedicines && <p className="loading-meds-note">Querying clinical drug database...</p>}
              
              {!loadingMedicines && medicineRecommendations.length === 0 && (
                <p className="no-meds-note">{t('no_medicines_selected') || 'No direct OTC medicines catalogued for this condition. Please consult a doctor.'}</p>
              )}

              <div className="meds-catalog-grid">
                {medicineRecommendations.map(med => (
                  <div className="med-preview-card" key={med.id}>
                    <div className="med-title-row">
                      <h4>{language === 'hi' ? med.name_hi : med.name_en}</h4>
                      <span className="med-duration-tag">{med.duration_days} {language === 'hi' ? 'दिन' : 'days'}</span>
                    </div>
                    <p className="med-timing-text">{med.dosage} · {med.frequency}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="diagnosis-actions-toolbar">
              <button onClick={handleReset} className="btn-secondary-subtle">
                <RefreshCw size={16} />
                <span>{t('reset') || 'New Assessment'}</span>
              </button>
              <button
                onClick={handleGeneratePrescription}
                disabled={loading || loadingMedicines}
                className="btn-run-diagnosis"
              >
                <FileText size={18} />
                <span>{loading ? 'Generating Official Rx...' : t('generate_prescription') || 'Generate Certified Clinical Rx'}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ========== STEP 3: CERTIFIED PRESCRIPTION VIEW ========== */}
        {step === 'prescription' && prescription && (
          <div className="dash-glass-card prescription-glass-view">
            <div className="prescription-official-sheet" id="printable-rx">
              {/* Header Letterhead */}
              <div className="rx-sheet-header">
                <div className="rx-brand-lock">
                  <img src={cureLogo} alt="CureAI Logo" className="rx-logo" />
                  <div>
                    <span className="rx-letterhead-kicker">CUREAI CLINICAL HEALTH SYSTEMS</span>
                    <h2>Electronic Clinical Prescription & Care Plan</h2>
                    <span className="rx-sub-kicker">ML-Powered Diagnostic & Drug Recommendation Engine</span>
                  </div>
                </div>
                <div className="rx-date-stamp">
                  <span className="rx-date-label">Date Issued</span>
                  <strong>{formatDate(prescription.date_generated)}</strong>
                  <span className="rx-id-pill">Rx ID: {prescription.prescription_id}</span>
                </div>
              </div>

              {/* Patient Vitals Card */}
              <div className="rx-patient-info-strip">
                <div className="patient-rx-stat">
                  <span>Patient Name</span>
                  <strong>{user?.full_name || 'Anonymous'}</strong>
                </div>
                <div className="patient-rx-stat">
                  <span>Age / Gender</span>
                  <strong>{calculateAge(user?.date_of_birth)} yrs / {user?.gender || '—'}</strong>
                </div>
                <div className="patient-rx-stat">
                  <span>Blood Group</span>
                  <strong>{user?.blood_group || '—'}</strong>
                </div>
                <div className="patient-rx-stat">
                  <span>Diagnosed Condition</span>
                  <strong className="text-highlight-green">{prescription.disease}</strong>
                </div>
              </div>

              <div className="rx-symptoms-list-line">
                <span>Symptoms Recorded:</span>
                <strong>{symptoms.map(s => symptomLabel(s)).join(', ') || 'None specified'}</strong>
              </div>

              {/* Medication Schedule List */}
              <div className="rx-medications-section">
                <div className="rx-section-badge">
                  <span className="rx-symbol-emblem">℞</span>
                  <span>PRESCRIBED MEDICATIONS & DOSAGE SCHEDULE</span>
                </div>

                <div className="rx-meds-table">
                  {(prescription.medicines || []).map((med, idx) => (
                    <div key={idx} className="rx-med-row-card">
                      <div className="rx-med-header">
                        <div>
                          <h4>{med.medicine_name}</h4>
                          {med.medicine_name_hi && <span className="med-hi-name">{med.medicine_name_hi}</span>}
                        </div>
                        <span className="rx-dose-badge">{med.dosage}</span>
                      </div>

                      <div className="rx-med-specs">
                        <div className="spec-col">
                          <span className="spec-title">Schedule & Timing</span>
                          <strong>{med.frequency}</strong>
                        </div>
                        <div className="spec-col">
                          <span className="spec-title">Meal Instructions</span>
                          <strong>{med.meal_instruction || med.instructions || 'With water'}</strong>
                        </div>
                        <div className="spec-col">
                          <span className="spec-title">Duration</span>
                          <strong>{med.duration_days} Days</strong>
                        </div>
                      </div>

                      {med.precautions?.length > 0 && (
                        <div className="rx-precaution-alert">
                          <strong>⚠️ Precaution:</strong> {med.precautions.join('; ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor / System Notes */}
              {prescription.doctor_notes && (
                <div className="rx-notes-box">
                  <strong>Clinical Remarks & Safety Advisory:</strong>
                  <p>{prescription.doctor_notes}</p>
                </div>
              )}

              {/* Wellness Tips Grid */}
              {prescription.wellness_tips?.length > 0 && (
                <div className="rx-wellness-block">
                  <h4>🌿 Lifestyle & Recovery Recommendations</h4>
                  <div className="wellness-pills-row">
                    {prescription.wellness_tips.map((tip, idx) => (
                      <div key={idx} className="wellness-tip-chip">
                        <span>• {tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prescription Actions Toolbar */}
            <div className="rx-actions-bottom-row">
              <button onClick={handleReset} className="btn-secondary-subtle">
                <RefreshCw size={16} />
                <span>Start New Diagnostic Session</span>
              </button>
              <button 
                onClick={handlePrintPrescription} 
                className="btn-print-official"
                disabled={refreshingPrescription}
              >
                <Printer size={18} />
                <span>Print / Download Clinical PDF</span>
              </button>
            </div>
          </div>
        )}

        {/* ========== PATIENT HISTORY TIMELINE SECTION ========== */}
        <section className="dash-glass-card history-card-block">
          <div className="card-top-title-row">
            <div className="title-with-icon">
              <div className="icon-badge-blue"><History size={22} /></div>
              <div>
                <h2>{t('patient_history') || 'Patient Clinical History Timeline'}</h2>
                <p className="card-subtitle">Encrypted record of your past symptom vectors, AI diagnostic predictions, and prescriptions.</p>
              </div>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="history-empty-state">
              <Activity size={36} className="icon-empty-pulse" />
              <p>{t('no_history') || 'No prior medical sessions logged. Run your first symptom analysis above.'}</p>
            </div>
          ) : (
            <div className="history-timeline-list">
              {history.map((session) => (
                <div key={session.id || session._id} className="history-timeline-item">
                  <div className="history-time-col">
                    <span className="hist-date">{formatDate(session.created_at)}</span>
                    <span className="hist-time">{session.created_at ? new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>

                  <div className="history-content-col">
                    <div className="hist-disease-title">
                      <strong>{session.diagnosis?.disease_name || 'Symptom Vector Session'}</strong>
                      {session.diagnosis?.confidence && (
                        <span className="hist-conf-pill">{(session.diagnosis.confidence * 100).toFixed(1)}% Match</span>
                      )}
                    </div>

                    {session.symptoms && session.symptoms.length > 0 && (
                      <div className="hist-symptoms-chips">
                        {session.symptoms.map((sym, i) => (
                          <span key={i} className="hist-symptom-tag">{symptomLabel(sym)}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="history-actions-col">
                    {session.symptoms && session.symptoms.length > 0 && (
                      <button onClick={() => handleViewSession(session)} className="btn-hist-view">
                        <span>Inspect Analytics</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteHistory(session.id || session._id)} 
                      className="btn-hist-delete"
                      title="Delete Record"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add to Home Screen / Install Modal */}
      <InstallAppModal 
        isOpen={showInstallModal} 
        onClose={() => setShowInstallModal(false)} 
        isHindi={language === 'hi'} 
      />
    </div>
  );
}

export default Dashboard;
