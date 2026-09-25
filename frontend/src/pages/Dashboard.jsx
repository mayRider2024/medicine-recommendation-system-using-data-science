import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { diagnosisAPI, prescriptionsAPI } from '../api';
import { voiceService } from '../voiceService';
import cureLogo from '../components/logo/CureAI logo.png';
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

  const [step, setStep] = useState('symptoms');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [symptomText, setSymptomText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [clarificationAnswers, setClarificationAnswers] = useState({});
  const [inputHistory, setInputHistory] = useState([]);
  const recorderRef = useRef(null);
  const lastTypedSymptomsRef = useRef([]);

  const commonSymptoms = [
    'fever', 'cough', 'sore_throat', 'body_ache', 'runny_nose', 'headache',
    'fatigue', 'sneezing', 'nausea', 'dizziness', 'chills', 'chest_pain',
    'shortness_of_breath', 'loss_of_taste', 'loss_of_smell', 'diarrhea',
    'constipation', 'abdominal_pain', 'back_pain', 'joint_pain', 'rash',
    'sweating', 'insomnia'
  ];

  const medicinesByDisease = {
    cold: ['paracetamol', 'cetirizine'],
    fever: ['paracetamol'],
    flu: ['oseltamivir', 'paracetamol'],
    cough: ['cough_syrup'],
    headache: ['paracetamol'],
    allergy: ['cetirizine'],
    asthma: ['cough_syrup'],
  };

  const clarificationQuestions = [
    { id: 'onset', labelKey: 'onset_question', options: [['sudden', 'onset_sudden'], ['gradual', 'onset_gradual']] },
    { id: 'fever_level', labelKey: 'fever_question', options: [['high', 'fever_high'], ['low', 'fever_low']] },
    { id: 'breathing', labelKey: 'breathing_question', options: [['yes', 'yes'], ['no', 'no']] },
    { id: 'nasal', labelKey: 'nasal_question', options: [['yes', 'yes'], ['no', 'no']] },
  ];

  const recordInputEvent = (event) => {
    const newEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    setInputHistory(current => [...current, newEvent].slice(-40));
  };

  const toggleSymptom = (symptom) => {
    const selected = !symptoms.includes(symptom);
    setSymptoms(current => selected ? [...current, symptom] : current.filter(x => x !== symptom));
    recordInputEvent({
      type: selected ? 'selected' : 'removed',
      source: 'Option',
      symptoms: [symptom],
      text: `${selected ? 'Selected' : 'Removed'} ${t(symptom) || symptom.replace(/_/g, ' ')}`,
    });
  };

  const addSymptomsFromText = (text, strictMode = true, source = 'Typed') => {
    setSymptomText(text);
    const detectedSymptoms = voiceService.extractSymptoms(text, strictMode);
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
    }
  };

  const handleTextChange = (event) => {
    addSymptomsFromText(event.target.value, true, 'Typed');
  };

  const handleRecordingStop = async (audioBlob) => {
    setIsRecording(false);
    setIsTranscribing(true);
    setError('');
    try {
      const result = await voiceService.transcribeAudio(audioBlob, language);
      addSymptomsFromText(result.text || '', false, 'Voice');
      if (!voiceService.extractSymptoms(result.text || '', false).length) {
        setError('No supported symptoms were detected. Try saying symptoms such as fever, cough, or headache.');
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
      const medicineIds = medicinesByDisease[diagnosis.disease_id] || ['paracetamol'];
      const diseaseNames = {
        flu: ['इन्फ्लूएंजा (फ्लू)', 'Influenza (Flu)'],
        cold: ['सामान्य सर्दी', 'Common Cold'],
        fever: ['बुखार', 'Fever'],
        cough: ['खांसी', 'Cough'],
        headache: ['सिरदर्द', 'Headache'],
        allergy: ['एलर्जी', 'Allergy'],
        asthma: ['अस्थमा', 'Asthma'],
        gastroenteritis: ['आंत्रशोथ', 'Gastroenteritis'],
      };
      const diseaseName = diseaseNames[diagnosis.disease_id] || [diagnosis.disease_name, diagnosis.disease_name];
      const nameForRequest = nextLanguage === 'hi'
        ? `${diseaseName[0]} / ${diseaseName[1]}`
        : diseaseName[1];
      const response = await prescriptionsAPI.generatePrescription(
        diagnosis.disease_id,
        nameForRequest,
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

  const handleDiagnose = async () => {
    if (symptoms.length === 0) return;
    if (step === 'symptoms') {
      setStep('questions');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await diagnosisAPI.diagnose(symptoms, language, clarificationAnswers);
      setDiagnosis(res.data);

      // Create the history record and persist the final diagnosis for this session.
      try {
        const historyRes = await api.post('/medical-history', {
          symptoms,
          patient_inputs: [{
            type: 'text',
            text: `${symptoms.join(', ')} | Clarification answers: ${JSON.stringify(clarificationAnswers)}`,
            timestamp: new Date().toISOString()
          }],
          language
        });
        const historyId = historyRes.data?.id || historyRes.data?._id;
        if (historyId) {
          setActiveHistoryId(historyId);
          await api.put(`/medical-history/${historyId}/diagnosis`, {
            diagnosis: res.data
          });
        }
      } catch (e) {
        console.warn('Failed to save diagnosis history', e);
      }

      setStep('diagnosis');
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'Diagnosis failed');
    }
    setLoading(false);
  };

  const handleGeneratePrescription = async () => {
    if (!diagnosis) return;
    setLoading(true);
    setError('');
    try {
      const res = await prescriptionsAPI.generatePrescription(
        diagnosis.disease_id,
        diagnosis.disease_name,
        medicinesByDisease[diagnosis.disease_id] || ['paracetamol'],
        language
      );
      setPrescription(res.data);
      setStep('prescription');

      // Update history with prescription
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
    setClarificationAnswers({});
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

  // Format date helper
  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="brand-lockup">
            <img src={cureLogo} alt="CureAI logo" className="brand-logo" />
            <div>
              <h1>CureAI</h1>
              <p className="brand-subtitle">Medicine Recommendation System</p>
              <p className="welcome-text">{t('welcome')}, <strong>{user?.full_name}</strong></p>
            </div>
          </div>
          <div className="header-actions">
            <div className="language-switcher" aria-label="Language selector">
              <button className={language === 'en' ? 'language-btn active' : 'language-btn'} onClick={() => switchLanguage('en')}>EN</button>
              <button className={language === 'hi' ? 'language-btn active' : 'language-btn'} onClick={() => switchLanguage('hi')}>हिंदी</button>
            </div>
            <span className="user-email">{user?.email}</span>
            <button onClick={() => navigate('/analytics')} className="analytics-link">📊 Analytics</button>
            <button onClick={handleLogout} className="logout-btn">{t('logout')}</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {error && <div className="dashboard-error">{error}</div>}

        {/* ========== SYMPTOMS STEP ========== */}
        {step === 'symptoms' && (
          <div className="dashboard-card">
            <h2>{t('select_symptoms')}</h2>
            <div className="symptom-count">
              {symptoms.length > 0 && (
                <span>{t('symptoms_selected', { count: symptoms.length })}
                  <button onClick={handleClearSymptoms} className="clear-btn">{t('clear')}</button>
                </span>
              )}
            </div>
            <div className="symptom-input-area">
              <label htmlFor="symptom-text">{t('describe_symptoms')}</label>
              <div className="symptom-input-row">
                <input
                  id="symptom-text"
                  type="text"
                  value={symptomText}
                  onChange={handleTextChange}
                  placeholder={language === 'hi' ? 'लक्षण लिखें, जैसे बुखार और खांसी' : 'Type symptoms, e.g. fever and cough'}
                  disabled={isRecording || isTranscribing}
                />
                <button
                  type="button"
                  onClick={handleVoiceToggle}
                  className={`voice-btn ${isRecording ? 'recording' : ''}`}
                  disabled={isTranscribing}
                  aria-label={isRecording ? 'Stop recording / रिकॉर्डिंग रोकें' : 'Speak symptoms / लक्षण बोलें'}
                >
                  {isTranscribing ? '⏳' : isRecording ? '⏹ Stop' : `🎙️ ${t('voice')}`}
                </button>
              </div>
              <p className="input-hint">
                {isTranscribing ? (language === 'hi' ? 'आपकी रिकॉर्डिंग लिखी जा रही है…' : 'Transcribing your recording…') : isRecording ? (language === 'hi' ? 'सुन रहे हैं… समाप्त होने पर रोकें' : 'Listening… click Stop when finished') : t('type_symptoms_hint')}
              </p>
            </div>
            <div className="input-history" aria-live="polite">
              <div className="input-history-header">
                <strong>{t('input_history')}</strong>
                <span>{inputHistory.length ? `${inputHistory.length} recent event(s)` : t('symptom_activity_hint')}</span>
              </div>
              {inputHistory.length > 0 && (
                <div className="input-history-list">
                  {[...inputHistory].reverse().map(event => (
                    <div className="input-history-item" key={event.id}>
                      <span className={`history-source ${event.type}`}>{event.source}</span>
                      <div className="history-event-content">
                        <strong>{event.text}</strong>
                        {event.symptoms?.length > 0 && <small>{event.symptoms.map(symptom => t(symptom) || symptom.replace(/_/g, ' ')).join(', ')}</small>}
                      </div>
                      <time>{formatTime(event.timestamp)}</time>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="symptoms-grid">
              {commonSymptoms.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`symptom-btn ${symptoms.includes(symptom) ? 'active' : ''}`}
                >
                  {t(symptom) || symptom.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <button
              onClick={handleDiagnose}
              disabled={symptoms.length === 0 || loading}
              className="primary-btn"
            >
              {loading ? 'Diagnosing...' : t('diagnose')}
            </button>
          </div>
        )}

        {/* ========== CLARIFICATION QUESTIONS ========== */}
        {step === 'questions' && (
          <div className="dashboard-card clarification-card">
            <div className="question-header">
              <div><span className="eyebrow">{t('clarifying_questions')}</span><h2>{t('narrow_possibilities')}</h2></div>
              <span className="question-count">{t('questions_answered', { answered: Object.keys(clarificationAnswers).length, total: clarificationQuestions.length })}</span>
            </div>
            <p className="question-intro">{t('clarification_intro')}</p>
            <div className="question-list">
              {clarificationQuestions.map(question => (
                <div className="question-item" key={question.id}>
                  <strong>{t(question.labelKey)}</strong>
                  <div className="question-options">
                    {question.options.map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        className={clarificationAnswers[question.id] === value ? 'question-option active' : 'question-option'}
                        onClick={() => setClarificationAnswers(current => ({ ...current, [question.id]: value }))}
                      >{t(label)}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleDiagnose} disabled={loading} className="primary-btn">
              {loading ? t('submitting') : t('analyze_final')}
            </button>
            <button onClick={() => setStep('symptoms')} className="secondary-btn">← {t('back_symptoms')}</button>
          </div>
        )}

        {/* ========== DIAGNOSIS STEP ========== */}
        {step === 'diagnosis' && diagnosis && (
          <div className="dashboard-card">
            <h2>{t('diagnosis_result')}</h2>
            <div className="diagnosis-card">
              <div className="diagnosis-row">
                <span className="label">{t('disease')}</span>
                <span className="value disease-name">{diagnosis.disease_name}</span>
              </div>
              <div className="diagnosis-row">
                <span className="label">{t('confidence')}</span>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${(diagnosis.confidence * 100).toFixed(1)}%` }}
                  />
                  <span className="confidence-text">{(diagnosis.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="diagnosis-row">
                <span className="label">{t('description')}</span>
                <p className="description">{diagnosis.recommendations}</p>
              </div>
              {diagnosis.possible_diseases?.length > 1 && (
                <div className="possible-diagnoses">
                  <strong>{language === 'hi' ? 'अन्य संभावित स्थितियां / Other possible conditions' : 'Other possible conditions'}</strong>
                  {diagnosis.possible_diseases.map(candidate => (
                    <div className="possible-diagnosis-row" key={candidate.disease_id}>
                      <span>{candidate.disease_name}</span>
                      <span>{candidate.score} {language === 'hi' ? 'स्कोर / score' : 'score'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleGeneratePrescription}
              disabled={loading}
              className="primary-btn"
            >
              {loading ? 'Generating...' : t('generate_prescription')}
            </button>
            <button onClick={handleReset} className="secondary-btn">{t('reset') || 'Start Over'}</button>
          </div>
        )}

        {/* ========== PRESCRIPTION STEP ========== */}
        {step === 'prescription' && prescription && (
          <div className="dashboard-card">
            <h2>{refreshingPrescription ? (language === 'hi' ? 'नुस्खे का अनुवाद हो रहा है…' : 'Updating prescription language…') : t('prescription')}</h2>
            <div className="prescription-note">
              <div className="note-heading">
                <div className="note-brand">
                  <img src={cureLogo} alt="CureAI logo" className="prescription-logo" />
                  <div><span className="note-kicker">CUREAI</span><h3>CureAI: Medicine Recommendation System using Data Science</h3></div>
                </div>
                <span className="note-date">{formatDate(prescription.date_generated)}</span>
              </div>
              <div className="patient-note-details">
                <span><b>Patient / रोगी:</b> {user?.full_name || '—'}</span>
                <span><b>Age / आयु:</b> {calculateAge(user?.date_of_birth)}</span>
                <span><b>Gender / लिंग:</b> {user?.gender || '—'}</span>
              </div>
              <div className="prescription-meta">
                <span>Prescription ID / प्रिस्क्रिप्शन आईडी: {prescription.prescription_id}</span>
                <span className="predicted-condition">Predicted disease / अनुमानित बीमारी: <b>{prescription.disease}</b></span>
              </div>
              <div className="note-symptoms"><b>Symptoms reported / बताए गए लक्षण:</b> {symptoms.map(symptom => t(symptom) || symptom.replace(/_/g, ' ')).join(', ') || 'Not recorded / दर्ज नहीं'}</div>
            </div>
            <h3>{t('medicines')}</h3>
            <div className="medicines-list">
              {(prescription.medicines || []).map((med, idx) => (
                <div key={idx} className="medicine-card">
                  <h4>{med.medicine_name}</h4>
                  <p className="medicine-hi">{med.medicine_name_hi}</p>
                  <div className="medicine-details">
                    <p><strong>Dosage / मात्रा:</strong> {med.dosage}</p>
                    <p><strong>When / कब:</strong> {med.frequency}</p>
                    <p><strong>How to take / लेने का तरीका:</strong> {med.meal_instruction || med.instructions || 'Follow package instructions / पैकेज निर्देश देखें'}</p>
                    <p><strong>Duration / अवधि:</strong> {med.duration_days} days / दिन</p>
                    {med.precautions?.length > 0 && <p><strong>Precautions / सावधानियां:</strong> {med.precautions.join('; ')}</p>}
                    {med.side_effects?.length > 0 && <p><strong>Possible side effects / संभावित दुष्प्रभाव:</strong> {med.side_effects.join(', ')}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="doctor-notes"><strong>Doctor / system notes / डॉक्टर की टिप्पणी:</strong> {prescription.doctor_notes}</div>
            <h3>{t('wellness_tips')}</h3>
            <div className="wellness-grid">
              {(prescription.wellness_tips || []).map((tip, idx) => (
                <div key={idx} className="tip-card">{tip}</div>
              ))}
            </div>
            <button onClick={handlePrintPrescription} className="print-btn" disabled={refreshingPrescription}>🖨️ Print / Save as PDF / प्रिंट करें या PDF सेव करें</button>
            {prescription.pdf_generated_at && <p className="pdf-status">PDF note recorded in patient history at {formatTime(prescription.pdf_generated_at)}</p>}
            <button onClick={handleReset} className="primary-btn reset-btn">{t('reset') || 'Start Over'}</button>
          </div>
        )}

        {/* ========== PATIENT HISTORY ========== */}
        <section className="dashboard-card history-section">
          <h2>📋 {t('patient_history')}</h2>
          {history.length === 0 ? (
            <p className="empty-history">{t('no_history')}</p>
          ) : (
            <div className="history-list">
              {history.map((session) => (
                <div key={session.id || session._id} className="history-card">
                  <div className="history-header">
                    <span className="history-date">{formatDate(session.created_at)}</span>
                    {session.diagnosis && (
                      <span className={`severity-badge ${session.diagnosis.severity || ''}`}>
                        {session.diagnosis.severity || '—'}
                      </span>
                    )}
                  </div>
                  <div className="history-body">
                    {session.symptoms && session.symptoms.length > 0 && (
                      <div className="history-symptoms">
                        <strong>{t('symptoms')}:</strong>{' '}
                        {session.symptoms.join(', ')}
                      </div>
                    )}
                    {session.diagnosis && (
                      <div className="history-diagnosis">
                        <strong>{t('disease')}:</strong> {session.diagnosis.disease_name}
                        {session.diagnosis.confidence && (
                          <span> ({(session.diagnosis.confidence * 100).toFixed(1)}%)</span>
                        )}
                      </div>
                    )}
                    {session.prescription && (
                      <div className="history-prescription">
                        <strong>{t('prescription')}:</strong> {session.prescription.prescription_id}
                        {session.prescription.medicines && (
                          <div className="history-meds">
                            {session.prescription.medicines.map((m, i) => (
                              <span key={i} className="med-tag">{m.medicine_name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="history-actions">
                    {session.symptoms && session.symptoms.length > 0 && (
                      <button onClick={() => handleViewSession(session)} className="view-btn">
                        {t('view_details')}
                      </button>
                    )}
                    <button onClick={() => handleDeleteHistory(session.id || session._id)} className="delete-history-btn">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
