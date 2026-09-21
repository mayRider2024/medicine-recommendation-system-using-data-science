import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { diagnosisAPI, prescriptionsAPI } from './api';
import { voiceService } from './voiceService';
import './i18n';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [symptoms, setSymptoms] = useState([]);
  const [diagnosis, setDiagnosis] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [step, setStep] = useState('symptoms');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [symptomInput, setSymptomInput] = useState('');
  const [patientHistory, setPatientHistory] = useState([]);
  const recognitionRef = useRef(null);

  const commonSymptoms = [
    'fever', 'cough', 'sore_throat', 'body_ache', 'runny_nose', 'headache',
    'fatigue', 'sneezing', 'nausea', 'dizziness', 'chills', 'chest_pain',
    'shortness_of_breath', 'loss_of_taste', 'loss_of_smell', 'diarrhea',
    'constipation', 'abdominal_pain', 'back_pain', 'joint_pain', 'rash',
    'sweating', 'insomnia'
  ];

  const toggleSymptom = (symptom) => {
    setSymptoms(s => s.includes(symptom) ? s.filter(x => x !== symptom) : [...s, symptom]);
  };

  const handleVoiceStart = async () => {
    try {
      setVoiceTranscript('Recording...');
      setIsListening(true);

      recognitionRef.current = await voiceService.startRecording(
        () => setVoiceTranscript('🎤 Recording...'),
        async (audioBlob) => {
          try {
            setVoiceTranscript('🔄 Transcribing...');
            const result = await voiceService.transcribeAudio(audioBlob, i18n.language);
            setVoiceTranscript(`Heard: ${result.text}`);

            // Add to patient history
            setPatientHistory(prev => [...prev, {
              type: 'voice',
              text: result.text,
              timestamp: new Date().toISOString()
            }]);

            parseAndSelectSymptoms(result.text);
            setIsListening(false);
          } catch (err) {
            alert('Transcription error: ' + err.message);
            setVoiceTranscript('');
            setIsListening(false);
          }
        }
      );
    } catch (err) {
      alert('Microphone error: ' + err.message);
      setIsListening(false);
      setVoiceTranscript('');
    }
  };

  const handleVoiceStop = () => {
    voiceService.stopRecording(recognitionRef.current);
    setIsListening(false);
  };

  const parseAndSelectSymptoms = (transcript) => {
    if (!transcript) return;

    const foundSymptoms = voiceService.extractSymptoms(transcript);
    const customSymptoms = voiceService.extractCustomSymptoms(transcript);

    // Combine recognized and custom symptoms
    let allSymptoms = [...foundSymptoms];

    // Add custom symptoms as underscore-formatted keys
    if (customSymptoms.length > 0) {
      const customKeys = customSymptoms.map(cs => cs.replace(/\s+/g, '_').toLowerCase());
      allSymptoms = [...allSymptoms, ...customKeys];
    }

    if (allSymptoms.length > 0) {
      const newSymptoms = allSymptoms.filter(s => !symptoms.includes(s));
      const alreadyAdded = allSymptoms.filter(s => symptoms.includes(s));

      if (newSymptoms.length > 0) {
        setSymptoms(s => [...new Set([...s, ...allSymptoms])]);

        const recognizedCount = foundSymptoms.filter(fs => newSymptoms.includes(fs)).length;
        const customCount = newSymptoms.length - recognizedCount;

        if (customCount > 0) {
          voiceService.speak(`Added ${recognizedCount} recognized and ${customCount} custom symptom${newSymptoms.length > 1 ? 's' : ''}`, i18n.language);
        } else {
          voiceService.speak(`Added ${newSymptoms.length} symptom${newSymptoms.length > 1 ? 's' : ''}`, i18n.language);
        }
      }

      if (alreadyAdded.length > 0) {
        voiceService.speak(`${alreadyAdded.length} symptom${alreadyAdded.length > 1 ? 's' : ''} already added`, i18n.language);
      }
    } else {
      alert('No symptoms recognized. Heard: ' + transcript);
    }
  };

  const handleTextInput = (e) => {
    setSymptomInput(e.target.value);
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      const text = symptomInput.trim();
      if (!text) return;

      // Add to patient history
      setPatientHistory(prev => [...prev, {
        type: 'text',
        text: text,
        timestamp: new Date().toISOString()
      }]);

      const foundSymptoms = voiceService.extractSymptoms(text, true); // Pass true for stricter text matching
      if (foundSymptoms.length > 0) {
        const newSymptoms = foundSymptoms.filter(s => !symptoms.includes(s));
        const alreadyAdded = foundSymptoms.filter(s => symptoms.includes(s));

        if (newSymptoms.length > 0) {
          setSymptoms(s => [...new Set([...s, ...foundSymptoms])]);
        }

        if (newSymptoms.length > 0 && alreadyAdded.length > 0) {
          alert(`Added ${newSymptoms.length} symptom(s). ${alreadyAdded.length} symptom(s) already added.`);
        } else if (newSymptoms.length > 0) {
          alert(`Added ${newSymptoms.length} symptom(s)`);
        } else if (alreadyAdded.length > 0) {
          alert(`${alreadyAdded.length} symptom(s) already added`);
        }
      } else {
        // Try to extract custom symptoms
        const customSymptoms = voiceService.extractCustomSymptoms(text);
        if (customSymptoms.length > 0) {
          const customSymptomText = customSymptoms.join(', ');
          const confirmAdd = window.confirm(
            `No recognized symptoms found. Did you mean:\n"${customSymptomText}"\n\nClick OK to add this as a custom symptom, or Cancel to try again.`
          );
          if (confirmAdd) {
            // Add as custom symptom with underscore format
            const customKey = customSymptoms[0].replace(/\s+/g, '_').toLowerCase();
            setSymptoms(s => [...s, customKey]);
            alert(`Added custom symptom: ${customSymptoms[0]}`);
          }
        } else {
          alert('No symptoms recognized in: ' + text);
        }
      }
      setSymptomInput('');
    }
  };

  const handleDiagnose = async () => {
    if (symptoms.length === 0) return;
    setLoading(true);
    try {
      const res = await diagnosisAPI.diagnose(symptoms, i18n.language);
      setDiagnosis(res.data);
      setStep('diagnosis');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  const handleGeneratePrescription = async () => {
    if (!diagnosis) return;
    setLoading(true);
    try {
      const res = await prescriptionsAPI.generatePrescription(
        diagnosis.disease_id,
        diagnosis.disease_name,
        ['paracetamol', 'cetirizine'],
        i18n.language
      );
      setPrescription(res.data);
      setStep('prescription');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  const handleReset = () => {
    setSymptoms([]);
    setDiagnosis(null);
    setPrescription(null);
    setStep('symptoms');
    setPatientHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">💊 {t('app_title')}</h1>
            <p className="text-gray-600 text-sm mt-1">{t('description')}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => i18n.changeLanguage('en')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                i18n.language === 'en'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              English
            </button>
            <button
              onClick={() => i18n.changeLanguage('hi')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                i18n.language === 'hi'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {step === 'symptoms' && (
          <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('select_symptoms')}</h2>

            {voiceService.isSupported() && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="flex gap-3 mb-2">
                  <button
                    onClick={isListening ? handleVoiceStop : handleVoiceStart}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white transition-all ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-purple-600 hover:bg-purple-700'
                    }`}
                  >
                    {isListening ? '🛑 Stop Listening' : '🎤 Speak Symptoms'}
                  </button>
                </div>
                {voiceTranscript && (
                  <p className="text-sm text-gray-700 italic">Heard: {voiceTranscript}</p>
                )}
              </div>
            )}

            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type symptoms here (e.g., fever, cough, headache)"
                  value={symptomInput}
                  onChange={handleTextInput}
                  onKeyDown={handleTextSubmit}
                  className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleTextSubmit}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
                >
                  Add
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">💡 Tip: Type symptoms and press Enter or click Add button</p>
            </div>

            {/* Patient History Section */}
            {patientHistory.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 Patient Input History</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {patientHistory.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">
                          {entry.type === 'voice' ? '🎤' : '⌨️'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 font-medium">{entry.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(entry.timestamp).toLocaleTimeString()} - {entry.type === 'voice' ? 'Spoken' : 'Typed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {symptoms.length > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                Selected: {symptoms.length} symptom(s)
                <button
                  onClick={() => {
                    setSymptoms([]);
                    setSymptomInput('');
                  }}
                  className="ml-3 px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                >
                  Clear All
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {commonSymptoms.map(symptom => (
                <button
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    symptoms.includes(symptom)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <input type="checkbox" checked={symptoms.includes(symptom)} readOnly />
                  <span className="text-left font-medium text-gray-700">{t(symptom)}</span>
                </button>
              ))}
            </div>

            {/* Custom symptoms section */}
            {symptoms.filter(s => !commonSymptoms.includes(s)).length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Custom Symptoms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {symptoms.filter(s => !commonSymptoms.includes(s)).map(symptom => (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      className="flex items-center gap-3 p-4 rounded-lg border-2 border-green-500 bg-green-50 transition-all"
                    >
                      <input type="checkbox" checked={true} readOnly />
                      <span className="text-left font-medium text-gray-700 capitalize">
                        {symptom.replace(/_/g, ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleDiagnose}
              disabled={symptoms.length === 0 || loading}
              className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all ${
                symptoms.length === 0 || loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Diagnosing...' : t('diagnose')}
            </button>
          </div>
        )}

        {step === 'diagnosis' && diagnosis && (
          <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('diagnosis_result')}</h2>

            {/* Patient History Section on Diagnosis Page */}
            {patientHistory.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 What You Reported</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {patientHistory.map((entry, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">
                          {entry.type === 'voice' ? '🎤' : '⌨️'}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 font-medium">{entry.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(entry.timestamp).toLocaleTimeString()} - {entry.type === 'voice' ? 'Spoken' : 'Typed'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-sm text-gray-600">{t('disease')}</p>
                <p className="text-2xl font-bold text-blue-800">{diagnosis.disease_name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{t('confidence')}</p>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${diagnosis.confidence * 100}%` }}></div>
                </div>
                <p className="text-lg font-semibold text-gray-800 mt-2">{(diagnosis.confidence * 100).toFixed(1)}%</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <p className="text-sm text-gray-600 mb-2">Recommendations</p>
                <p className="text-gray-700">{diagnosis.recommendations}</p>
              </div>
            </div>
            <button
              onClick={handleGeneratePrescription}
              disabled={loading}
              className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all"
            >
              {loading ? 'Generating...' : t('generate_prescription')}
            </button>
          </div>
        )}

        {step === 'prescription' && prescription && (
          <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('prescription')}</h2>
            <div className="mb-8 pb-6 border-b-2 border-gray-200">
              <p className="text-gray-600">ID: {prescription.prescription_id}</p>
              <p className="text-gray-600">Date: {new Date(prescription.date_generated).toLocaleDateString()}</p>
            </div>
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-gray-600">{t('disease')}</p>
              <p className="text-2xl font-bold text-blue-800">{prescription.disease}</p>
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t('medicines')}</h3>
              {prescription.medicines.map((med, idx) => (
                <div key={idx} className="p-4 border-2 border-gray-200 rounded-lg mb-4">
                  <p className="font-bold text-lg text-gray-800">{med.medicine_name}</p>
                  <p className="text-sm text-gray-600 italic">{med.medicine_name_hi}</p>
                  <p className="text-sm mt-2"><strong>Dosage:</strong> {med.dosage}</p>
                  <p className="text-sm"><strong>Frequency:</strong> {med.frequency}</p>
                  <p className="text-sm"><strong>Duration:</strong> {med.duration_days} days</p>
                </div>
              ))}
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t('wellness_tips')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prescription.wellness_tips.map((tip, idx) => (
                  <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-800 text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleReset}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
            >
              Start Over
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
