import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import cureLogo from '../components/logo/CureAI logo.png';
import './Analytics.css';

function loadSavedSession() {
  try {
    return JSON.parse(localStorage.getItem('medicineAnalyticsSession') || '{}');
  } catch {
    return {};
  }
}

function Analytics() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const language = i18n.language?.startsWith('hi') ? 'hi' : 'en';
  const bilingual = (english, hindi) => language === 'hi' ? `${hindi} / ${english}` : english;
  const session = location.state || loadSavedSession();
  const symptoms = session.symptoms || [];
  const savedDiagnosis = session.diagnosis || null;
  const diagnosis = savedDiagnosis?.model === 'random_forest' ? savedDiagnosis : null;
  const prescription = session.prescription || null;
  const candidates = diagnosis?.possible_diseases || [];
  const selectedId = diagnosis?.disease_id;
  const selectedCandidate = candidates.find(candidate => candidate.disease_id === selectedId);
  const selectedProbability = Number(selectedCandidate?.score ?? selectedCandidate?.confidence ?? diagnosis?.confidence ?? 0);
  const symptomLabel = id => {
    const translated = i18n.getFixedT(language)(id);
    return translated !== id ? translated : id.replace(/_/g, ' ');
  };
  const formatProbability = value => `${(Math.max(0, Math.min(Number(value) || 0, 1)) * 100).toFixed(1)}%`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div className="analytics-brand">
          <img src={cureLogo} alt="CureAI logo" className="analytics-logo" />
          <div>
            <h1>{bilingual('CureAI Diagnostic Analytics', 'CureAI डायग्नोस्टिक विश्लेषण')}</h1>
            <p>{bilingual('Review the diagnosis returned by the backend model', 'बैकएंड मॉडल से मिले निदान की समीक्षा करें')}</p>
          </div>
        </div>
        <div className="analytics-actions">
          <div className="language-switcher" aria-label="Language selector">
            <button className={language === 'en' ? 'language-btn active' : 'language-btn'} onClick={() => i18n.changeLanguage('en')}>EN</button>
            <button className={language === 'hi' ? 'language-btn active' : 'language-btn'} onClick={() => i18n.changeLanguage('hi')}>हिंदी</button>
          </div>
          <button className="analytics-nav-btn" onClick={() => navigate('/dashboard')}>← {bilingual('Dashboard', 'डैशबोर्ड')}</button>
          <span>{user?.email}</span>
          <button className="logout-btn" onClick={handleLogout}>{bilingual('Logout', 'लॉगआउट')}</button>
        </div>
      </header>

      <main className="analytics-main">
        <section className="analytics-card overview-card">
          <div>
            <span className="eyebrow">{bilingual('CURRENT SESSION', 'वर्तमान सत्र')}</span>
            <h2>{diagnosis?.disease_name || bilingual('No diagnosis generated yet', 'अभी निदान नहीं मिला')}</h2>
            <p>{symptoms.length
              ? bilingual(`${symptoms.length} selected symptom(s)`, `${symptoms.length} चुने गए लक्षण`)
              : bilingual('Select symptoms and run diagnosis from the dashboard.', 'डैशबोर्ड में लक्षण चुनकर निदान चलाएं।')}</p>
          </div>
          {diagnosis && (
            <div className="confidence-summary">
              <strong>{formatProbability(diagnosis.confidence)}</strong>
              <span>{bilingual('model probability · not clinically calibrated', 'मॉडल संभावना · चिकित्सकीय रूप से कैलिब्रेटेड नहीं')}</span>
            </div>
          )}
        </section>

        <section className="analytics-card">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{bilingual('INFERENCE FLOW', 'अनुमान प्रक्रिया')}</span>
              <h2>{bilingual('From selected symptoms to model output', 'चुने गए लक्षणों से मॉडल परिणाम तक')}</h2>
            </div>
            {diagnosis?.model && <span className="method-pill">{diagnosis.model.replace(/_/g, ' ')}</span>}
          </div>
          <div className="flow-diagram">
            <div className="flow-node blue"><span>1</span><b>{bilingual('Input', 'इनपुट')}</b><small>{symptoms.length ? symptoms.map(symptomLabel).join(', ') : bilingual('No symptoms yet', 'अभी कोई लक्षण नहीं')}</small></div>
            <div className="flow-arrow">→</div>
            <div className="flow-node purple"><span>2</span><b>{bilingual('Feature mapping', 'फीचर मैपिंग')}</b><small>{bilingual('The backend maps supported CureAI symptom IDs to model features.', 'बैकएंड समर्थित CureAI लक्षण IDs को मॉडल फीचर्स से जोड़ता है।')}</small></div>
            <div className="flow-arrow">→</div>
            <div className="flow-node orange"><span>3</span><b>{bilingual('Model inference', 'मॉडल अनुमान')}</b><small>{bilingual('The backend Random Forest returns its top disease predictions.', 'बैकएंड Random Forest बीमारी के शीर्ष अनुमान देता है।')}</small></div>
            <div className="flow-arrow">→</div>
            <div className="flow-node green"><span>4</span><b>{bilingual('API response', 'API परिणाम')}</b><small>{bilingual('The dashboard displays the response without re-ranking predictions.', 'डैशबोर्ड अनुमान को फिर से क्रमबद्ध किए बिना API परिणाम दिखाता है।')}</small></div>
            <div className="flow-arrow">→</div>
            <div className="flow-node pink"><span>5</span><b>{bilingual('Medicine catalog', 'दवा सूची')}</b><small>{bilingual('A separate catalog is queried by the returned disease ID.', 'लौटाए गए disease ID से अलग दवा सूची पूछी जाती है।')}</small></div>
          </div>
        </section>

        <div className="analytics-grid">
          <section className="analytics-card">
            <div className="section-heading">
              <div><span className="eyebrow">{bilingual('BACKEND MODEL OUTPUT', 'बैकएंड मॉडल परिणाम')}</span><h2>{bilingual('Top predictions', 'शीर्ष अनुमान')}</h2></div>
            </div>
            {candidates.length === 0 ? (
              <p className="muted-text">{bilingual('No backend predictions are available for this session.', 'इस सत्र के लिए बैकएंड अनुमान उपलब्ध नहीं हैं।')}</p>
            ) : (
              <div className="candidate-list">
                {candidates.map((candidate, index) => {
                  const probability = Number(candidate.score ?? candidate.confidence ?? 0);
                  const percentage = Math.max(0, Math.min(probability * 100, 100));
                  return (
                    <div className={`candidate ${candidate.disease_id === selectedId ? 'selected' : ''}`} key={candidate.disease_id}>
                      <div className="candidate-top">
                        <span>{index === 0 ? '★ ' : ''}{candidate.disease_name}</span>
                        <b>{formatProbability(probability)}</b>
                      </div>
                      <div className="bar-track"><div className="bar-fill" style={{ width: `${percentage}%` }} /></div>
                      <small>{bilingual('model probability', 'मॉडल संभावना')}{candidate.disease_id === selectedId ? ` · ${bilingual('selected', 'चयनित')}` : ''}</small>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="analytics-card">
            <div className="section-heading">
              <div><span className="eyebrow">{bilingual('MODEL DETAILS', 'मॉडल विवरण')}</span><h2>{bilingual('Recognized input', 'पहचाना गया इनपुट')}</h2></div>
            </div>
            {diagnosis?.recognized_symptoms?.length > 0 && (
              <p><b>{bilingual('Recognized:', 'पहचाने गए:')}</b> {diagnosis.recognized_symptoms.map(symptomLabel).join(', ')}</p>
            )}
            {diagnosis?.unsupported_symptoms?.length > 0 && (
              <div className="unsupported-warning" role="status">
                <b>{bilingual('Some selected symptoms were not supported by the model:', 'चुने गए कुछ लक्षण मॉडल द्वारा समर्थित नहीं थे:')}</b>
                <p>{diagnosis.unsupported_symptoms.map(symptomLabel).join(', ')}</p>
              </div>
            )}
            {diagnosis?.needs_clarification && (
              <p className="clarification-notice">{bilingual('The backend marked this result as needing clarification.', 'बैकएंड ने इस परिणाम के लिए अतिरिक्त स्पष्टीकरण आवश्यक बताया है।')}</p>
            )}
            <div className="decision-box">
              <div className="decision-number">{diagnosis ? formatProbability(selectedProbability) : '—'}</div>
              <div>
                <b>{diagnosis?.disease_name || bilingual('Awaiting model output', 'मॉडल परिणाम की प्रतीक्षा')}</b>
                <p>{bilingual('probability returned by the model; not clinical confidence', 'मॉडल द्वारा दी गई संभावना; चिकित्सकीय भरोसा नहीं')}</p>
              </div>
            </div>
            <p className="probability-note">{bilingual('Model probabilities are not clinically calibrated and do not establish a diagnosis.', 'मॉडल संभावनाएं चिकित्सकीय रूप से कैलिब्रेटेड नहीं हैं और निदान स्थापित नहीं करतीं।')}</p>
          </section>
        </div>

        <section className="analytics-card">
          <div className="section-heading"><div><span className="eyebrow">{bilingual('RECOMMENDATION TRACE', 'सिफारिश का विवरण')}</span><h2>{bilingual('Medicine catalog and prescription', 'दवा सूची और नुस्खा')}</h2></div></div>
          <div className="prescription-flow">
            <div><b>{bilingual('Predicted disease', 'अनुमानित बीमारी')}</b><span>{diagnosis?.disease_name || bilingual('Awaiting diagnosis', 'निदान की प्रतीक्षा')}</span></div><b className="mini-arrow">→</b>
            <div><b>{bilingual('Medicine catalog', 'दवा सूची')}</b><span>{bilingual('Separate disease-ID lookup; not part of the ML model.', 'अलग disease-ID lookup; ML मॉडल का हिस्सा नहीं।')}</span></div><b className="mini-arrow">→</b>
            <div><b>{bilingual('Prescription', 'नुस्खा')}</b><span>{prescription ? `${prescription.medicines?.length || 0} ${bilingual('medicine(s) generated', 'दवाएं तैयार')}` : bilingual('Generate from the dashboard.', 'डैशबोर्ड से तैयार करें।')}</span></div>
          </div>
          <p className="safety-note">⚕️ {bilingual('This is a college Data Science prototype, not a clinically validated system. Recommendations must be reviewed by a qualified medical professional.', 'यह कॉलेज का Data Science प्रोटोटाइप है, चिकित्सकीय रूप से प्रमाणित प्रणाली नहीं। सुझावों की समीक्षा योग्य डॉक्टर से कराएं।')}</p>
          {prescription && (
            <button className="open-prescription-btn" onClick={() => navigate('/dashboard', {
              state: { ...session, symptoms, diagnosis, prescription, openPrescription: true },
            })}>
              {bilingual('Open Prescription / PDF', 'नुस्खा / PDF खोलें')}<span aria-hidden="true"> →</span>
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

export default Analytics;
