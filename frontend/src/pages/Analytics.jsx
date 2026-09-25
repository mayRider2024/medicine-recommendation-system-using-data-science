import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import cureLogo from '../components/logo/CureAI logo.png';
import './Analytics.css';


const diseaseNamesHi = {
  fever: 'बुखार', flu: 'इन्फ्लूएंजा (फ्लू)', cold: 'सामान्य सर्दी', gastroenteritis: 'आंत्रशोथ',
  cough: 'ब्रोंकाइटिस/खांसी', asthma: 'अस्थमा अटैक', bronchitis: 'ब्रोंकाइटिस', allergy: 'एलर्जी',
  headache: 'सिरदर्द/माइग्रेन', hypertension: 'उच्च रक्तचाप'
};

const diseaseNames = {
  fever: 'Fever',
  flu: 'Influenza (Flu)',
  cold: 'Common Cold',
  gastroenteritis: 'Gastroenteritis',
  cough: 'Bronchitis/Cough',
  asthma: 'Asthma Attack',
  bronchitis: 'Bronchitis',
  allergy: 'Allergic Reaction',
  headache: 'Headache/Migraine',
  hypertension: 'High Blood Pressure',
};

const symptomNames = {
  fever: 'Fever', cough: 'Cough', sore_throat: 'Sore Throat', body_ache: 'Body Ache',
  runny_nose: 'Runny Nose', headache: 'Headache', fatigue: 'Fatigue', sneezing: 'Sneezing',
  shortness_of_breath: 'Shortness of Breath', chest_pain: 'Chest Pain',
};

// Small, transparent benchmark for demonstrating the evaluation workflow.
// It is synthetic and must not be treated as clinical model validation.
const benchmarkCases = [
  { symptoms: ['fever'], expected: 'fever' },
  { symptoms: ['cough'], expected: 'cough' },
  { symptoms: ['fever', 'body_ache'], expected: 'flu' },
  { symptoms: ['cough', 'sore_throat'], expected: 'cold' },
  { symptoms: ['runny_nose', 'sneezing'], expected: 'cold' },
  { symptoms: ['headache'], expected: 'headache' },
  { symptoms: ['fatigue', 'shortness_of_breath'], expected: 'asthma' },
  { symptoms: ['fever', 'cough', 'sore_throat'], expected: 'cold' },
  { symptoms: ['chest_pain', 'shortness_of_breath'], expected: 'asthma' },
  { symptoms: ['runny_nose', 'sneezing', 'headache'], expected: 'cold' },
];

function rankRules(symptoms, answers = {}) {
  const symptomSet = new Set(symptoms);
  const scores = {};
  const respiratory = ['cough', 'sore_throat', 'runny_nose', 'sneezing'].filter(symptom => symptomSet.has(symptom));
  const fluSupport = ['fever', 'body_ache', 'fatigue', 'cough', 'sore_throat'].filter(symptom => symptomSet.has(symptom));
  const giSupport = ['nausea', 'diarrhea', 'abdominal_pain'].filter(symptom => symptomSet.has(symptom));

  if (symptomSet.has('fever')) scores.fever = 1;
  if (respiratory.length >= 2 || (symptomSet.has('fever') && respiratory.length && answers.nasal === 'yes')) {
    scores.cold = respiratory.length + Number(symptomSet.has('fever')) + Number(answers.nasal === 'yes') + Number(symptomSet.has('runny_nose') && symptomSet.has('sneezing'));
  }
  if (symptomSet.has('fever') && (symptomSet.has('body_ache') || symptomSet.has('fatigue')) && fluSupport.length >= 2) {
    scores.flu = fluSupport.length + Number(answers.fever_level === 'high') + Number(answers.onset === 'sudden');
  }
  if (symptomSet.has('cough')) scores.cough = 1;
  if (symptomSet.has('runny_nose') && symptomSet.has('sneezing')) scores.allergy = 2;
  if (symptomSet.has('shortness_of_breath')) scores.asthma = 1 + Number(symptomSet.has('chest_pain')) + Number(answers.breathing === 'yes');
  if (giSupport.length >= 2) scores.gastroenteritis = giSupport.length + Number(symptomSet.has('fever'));
  if (symptomSet.has('headache')) scores.headache = 1;

  if (!Object.keys(scores).length) scores.common_ailment = 1;
  return Object.entries(scores).map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function predictFromRules(symptoms) {
  return rankRules(symptoms)[0]?.id || 'common_ailment';
}

function calculateBenchmarkMetrics() {
  const results = benchmarkCases.map(test => ({
    expected: test.expected,
    predicted: predictFromRules(test.symptoms),
  }));
  const labels = [...new Set(results.flatMap(result => [result.expected, result.predicted]))];
  const perClass = labels.map(label => {
    const truePositive = results.filter(result => result.expected === label && result.predicted === label).length;
    const falsePositive = results.filter(result => result.expected !== label && result.predicted === label).length;
    const falseNegative = results.filter(result => result.expected === label && result.predicted !== label).length;
    const precision = truePositive + falsePositive ? truePositive / (truePositive + falsePositive) : 0;
    const recall = truePositive + falseNegative ? truePositive / (truePositive + falseNegative) : 0;
    const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
    return { precision, recall, f1 };
  });
  const mean = key => perClass.reduce((sum, item) => sum + item[key], 0) / perClass.length;
  return {
    accuracy: results.filter(result => result.expected === result.predicted).length / results.length,
    precision: mean('precision'),
    recall: mean('recall'),
    f1: mean('f1'),
  };
}

const benchmarkMetrics = calculateBenchmarkMetrics();

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
  const diseaseLabel = (id) => language === 'hi' ? `${diseaseNamesHi[id] || id} / ${diseaseNames[id] || id}` : (diseaseNames[id] || id);
  const symptomLabel = (id) => language === 'hi' ? `${i18n.getFixedT('hi')(id)} / ${symptomNames[id] || id}` : (symptomNames[id] || id);
  const saved = loadSavedSession();
  const session = location.state || saved;
  const symptoms = session.symptoms || [];
  const diagnosis = session.diagnosis || null;
  const prescription = session.prescription || null;

  const analysis = useMemo(() => {
    if (diagnosis?.possible_diseases?.length) {
      const candidates = diagnosis.possible_diseases.map(candidate => ({
        id: candidate.disease_id,
        score: candidate.score,
        percentage: Math.round((candidate.confidence || 0) * 100),
      }));
      return { scores: Object.fromEntries(candidates.map(candidate => [candidate.id, candidate.score])), candidates };
    }

    const candidates = rankRules(symptoms).map(candidate => ({
      ...candidate,
      percentage: symptoms.length ? Math.min(Math.round((candidate.score / symptoms.length) * 100), 100) : 0,
    }));
    return { scores, candidates };
  }, [symptoms, diagnosis]);

  const hasQualifiedCandidates = Boolean(diagnosis?.possible_diseases?.length);
  const selectedId = hasQualifiedCandidates ? diagnosis.disease_id : (analysis.candidates[0]?.id || diagnosis?.disease_id);
  const selectedCandidate = analysis.candidates.find(candidate => candidate.id === selectedId);
  const displayDiagnosis = hasQualifiedCandidates ? diagnosis : (selectedCandidate ? {
    disease_id: selectedCandidate.id,
    disease_name: diseaseLabel(selectedCandidate.id),
    confidence: selectedCandidate.percentage / 100,
  } : diagnosis);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <div className="analytics-brand">
          <img src={cureLogo} alt="CureAI logo" className="analytics-logo" />
          <div><h1>{bilingual('CureAI Diagnostic Analytics', 'CureAI डायग्नोस्टिक विश्लेषण')}</h1><p>{bilingual('Understand how the recommendation was produced', 'सिफारिश कैसे तैयार हुई, इसे समझें')}</p></div>
        </div>
        <div className="analytics-actions">
          <div className="language-switcher" aria-label="Language selector">
            <button className={language === 'en' ? 'language-btn active' : 'language-btn'} onClick={() => i18n.changeLanguage('en')}>EN</button>
            <button className={language === 'hi' ? 'language-btn active' : 'language-btn'} onClick={() => i18n.changeLanguage('hi')}>हिंदी</button>
          </div>
          <button className="analytics-nav-btn" onClick={() => navigate('/dashboard')}>← {bilingual('Dashboard', 'डैशबोर्ड')}</button>
          <span>{user?.email}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="analytics-main">
        <section className="analytics-card overview-card">
          <div>
            <span className="eyebrow">{bilingual('CURRENT SESSION', 'वर्तमान सत्र')}</span>
            <h2>{displayDiagnosis ? displayDiagnosis.disease_name : 'No diagnosis generated yet'}</h2>
            <p>{displayDiagnosis && !diagnosis ? bilingual('Derived from the current symptom scoring rules.', 'वर्तमान लक्षण स्कोरिंग नियमों से निकाला गया।') : symptoms.length ? bilingual(`${symptoms.length} symptom(s) analyzed`, `${symptoms.length} लक्षणों का विश्लेषण किया गया`) : bilingual('Select symptoms and run Get Diagnosis first.', 'पहले लक्षण चुनें और निदान प्राप्त करें।')}</p>
          </div>
          {displayDiagnosis && (
            <div className="confidence-summary">
              <strong>{Math.round((displayDiagnosis.confidence || 0) * 100)}%</strong>
              <span>{bilingual('system confidence', 'सिस्टम का भरोसा')}</span>
            </div>
          )}
        </section>

        <section className="analytics-card">
          <div className="section-heading">
            <div><span className="eyebrow">{bilingual('EXPLAINABLE PIPELINE', 'समझाने योग्य प्रक्रिया')}</span><h2>{bilingual('From symptoms to prescription', 'लक्षणों से नुस्खे तक')}</h2></div>
            <span className="method-pill">{bilingual('Rule-based scoring', 'नियम-आधारित स्कोरिंग')}</span>
          </div>
          <div className="flow-diagram">
            <div className="flow-node blue"><span>1</span><b>{bilingual('Input', 'इनपुट')}</b><small>{symptoms.length ? symptoms.map(s => symptomLabel(s)).join(', ') : bilingual('No symptoms yet', 'अभी कोई लक्षण नहीं')}</small></div>
            <div className="flow-arrow">→</div>
            <div className="flow-node purple"><span>2</span><b>{bilingual('Feature matching', 'फीचर मिलान')}</b><small>{bilingual('Each symptom is compared with the symptom–disease mapping.', 'हर लक्षण की तुलना लक्षण-बीमारी मैपिंग से की जाती है।')}</small></div>
            <div className="flow-arrow">→</div>
            <div className="flow-node orange"><span>3</span><b>{bilingual('Candidate scoring', 'उम्मीदवार स्कोरिंग')}</b><small>{bilingual('Every matching disease receives one vote.', 'हर मेल खाती बीमारी को एक अंक मिलता है।')}</small></div>
            <div className="flow-arrow">→</div>
            <div className="flow-node green"><span>4</span><b>{bilingual('Final selection', 'अंतिम चयन')}</b><small>{bilingual('Highest score becomes the recommended disease.', 'सबसे अधिक स्कोर वाली बीमारी चुनी जाती है।')}</small></div>
            <div className="flow-arrow">→</div>
            <div className="flow-node pink"><span>5</span><b>{bilingual('Prescription', 'नुस्खा')}</b><small>{bilingual('Disease ID selects medicine and wellness rules.', 'बीमारी आईडी दवा और स्वास्थ्य नियम चुनती है।')}</small></div>
          </div>
        </section>

        <div className="analytics-grid">
          <section className="analytics-card">
            <div className="section-heading"><div><span className="eyebrow">{bilingual('MODEL OUTPUT', 'मॉडल परिणाम')}</span><h2>{bilingual('Possible diseases', 'संभावित बीमारियां')}</h2></div></div>
            {analysis.candidates.length === 0 ? (
              <p className="muted-text">{bilingual('No candidate diseases yet. Return to the dashboard and select symptoms.', 'अभी कोई संभावित बीमारी नहीं है। डैशबोर्ड पर लौटकर लक्षण चुनें।')}</p>
            ) : (
              <div className="candidate-list">
                {analysis.candidates.slice(0, 7).map((candidate, index) => (
                  <div className={`candidate ${candidate.id === selectedId ? 'selected' : ''}`} key={candidate.id}>
                    <div className="candidate-top"><span>{index === 0 ? '★ ' : ''}{diseaseLabel(candidate.id)}</span><b>{candidate.score} {bilingual(candidate.score === 1 ? 'vote' : 'votes', candidate.score === 1 ? 'अंक' : 'अंक')}</b></div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(candidate.percentage, 4)}%` }} /></div>
                    <small>{candidate.percentage}% {bilingual('symptom coverage', 'लक्षण कवरेज')} {candidate.id === selectedId ? `· ${bilingual('selected', 'चयनित')}` : `· ${bilingual('alternative', 'विकल्प')}`}</small>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="analytics-card">
            <div className="section-heading"><div><span className="eyebrow">{bilingual('DECISION RULE', 'निर्णय नियम')}</span><h2>{bilingual('Why this disease?', 'यह बीमारी क्यों?')}</h2></div></div>
            <div className="decision-box">
              <div className="decision-number">{selectedCandidate?.score || 0}</div>
              <div><b>{selectedId ? diseaseLabel(selectedId) : bilingual('Awaiting input', 'इनपुट की प्रतीक्षा')}</b><p>{bilingual('highest matching disease score', 'सबसे अधिक मेल वाला बीमारी स्कोर')}</p></div>
            </div>
            <ul className="explanation-list">
              <li>{bilingual('Input symptoms are normalized into known symptom IDs.', 'इनपुट लक्षणों को ज्ञात लक्षण आईडी में बदला जाता है।')}</li>
              <li>{bilingual('Mapped diseases receive one point per matching symptom.', 'हर मेल खाते लक्षण पर बीमारी को एक अंक मिलता है।')}</li>
              <li>{bilingual('Confidence = top disease points ÷ total symptoms.', 'भरोसा = सबसे अधिक बीमारी अंक ÷ कुल लक्षण।')}</li>
              <li>{bilingual('Other candidates remain visible instead of being hidden.', 'अन्य संभावित बीमारियां भी दिखाई जाती हैं।')}</li>
            </ul>
          </section>
        </div>

        <section className="analytics-card">
          <div className="section-heading"><div><span className="eyebrow">{bilingual('RECOMMENDATION TRACE', 'सिफारिश का विवरण')}</span><h2>{bilingual('How medicines are derived', 'दवाएं कैसे चुनी जाती हैं')}</h2></div></div>
          <div className="prescription-flow">
            <div><b>{bilingual('Selected disease', 'चयनित बीमारी')}</b><span>{displayDiagnosis?.disease_name || bilingual('Awaiting diagnosis', 'निदान की प्रतीक्षा')}</span></div><b className="mini-arrow">→</b>
            <div><b>{bilingual('Medicine catalogue', 'दवा सूची')}</b><span>{bilingual('Disease-specific medicine rules', 'बीमारी के अनुसार दवा नियम')}</span></div><b className="mini-arrow">→</b>
            <div><b>{bilingual('Prescription', 'नुस्खा')}</b><span>{prescription ? `${prescription.medicines?.length || 0} ${bilingual('medicine(s) generated', 'दवाएं तैयार')}` : bilingual('Generate prescription from dashboard', 'डैशबोर्ड से नुस्खा बनाएं')}</span></div>
          </div>
          <p className="safety-note">⚕️ {bilingual('This is an educational prototype. Recommendations must be reviewed by a qualified medical professional.', 'यह एक शैक्षिक प्रोटोटाइप है। सिफारिशों की समीक्षा योग्य डॉक्टर से कराएं।')}</p>
          {prescription && (
            <button
              className="open-prescription-btn"
              onClick={() => navigate('/dashboard', {
                state: {
                  ...session,
                  symptoms,
                  diagnosis: displayDiagnosis,
                  prescription,
                  openPrescription: true,
                },
              })}
            >
              {bilingual('Open Prescription / PDF', 'नुस्खा / PDF खोलें')}
              <span aria-hidden="true"> →</span>
            </button>
          )}
        </section>

        <section className="analytics-card metrics-card">
          <div className="section-heading"><div><span className="eyebrow">{bilingual('MODEL EVALUATION', 'मॉडल मूल्यांकन')}</span><h2>{bilingual('Method and performance metrics', 'विधि और प्रदर्शन मेट्रिक्स')}</h2></div><span className="status-pill benchmark-status">{bilingual('Prototype benchmark', 'प्रोटोटाइप बेंचमार्क')}</span></div>
          <div className="method-description"><b>{bilingual('Method used: deterministic rule-based classifier', 'उपयोग की गई विधि: निश्चित नियम-आधारित वर्गीकरण')}</b><p>{bilingual(`Metrics below are calculated from ${benchmarkCases.length} synthetic, manually labeled demonstration cases using macro-averaging. They demonstrate the evaluation workflow; they are not clinical accuracy claims.`, `नीचे दिए गए मेट्रिक्स ${benchmarkCases.length} कृत्रिम, मैन्युअल रूप से लेबल किए गए उदाहरणों के मैक्रो-औसत से निकाले गए हैं। ये क्लिनिकल सटीकता का दावा नहीं हैं।`)}</p></div>
          <div className="metric-grid">
            {[
              [bilingual('Accuracy', 'सटीकता'), benchmarkMetrics.accuracy],
              [bilingual('Precision', 'प्रिसीजन'), benchmarkMetrics.precision],
              [bilingual('Recall', 'रिकॉल'), benchmarkMetrics.recall],
              [bilingual('F1 score', 'F1 स्कोर'), benchmarkMetrics.f1],
            ].map(([metric, value]) => <div className="metric-box" key={metric}><strong>{(value * 100).toFixed(1)}%</strong><span>{metric}</span><small>{bilingual('Synthetic benchmark', 'कृत्रिम बेंचमार्क')}</small></div>)}
          </div>
          <div className="formula-row"><span>{bilingual('Accuracy = correct predictions / all predictions', 'सटीकता = सही अनुमान / कुल अनुमान')}</span><span>{bilingual('Precision = true positives / predicted positives', 'प्रिसीजन = सही सकारात्मक / अनुमानित सकारात्मक')}</span><span>{bilingual('Recall = true positives / actual positives', 'रिकॉल = सही सकारात्मक / वास्तविक सकारात्मक')}</span><span>{bilingual('F1 = harmonic mean of precision and recall', 'F1 = प्रिसीजन और रिकॉल का हार्मोनिक माध्य')}</span></div>
        </section>
      </main>
    </div>
  );
}

export default Analytics;
