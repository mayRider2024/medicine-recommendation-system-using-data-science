import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const en = {
  app_title: 'Medicine Recommendation System',
  welcome: 'Welcome to Medicine Advisor',
  description: 'Get personalized medicine recommendations based on your symptoms',
  select_symptoms: 'Select your symptoms',
  diagnose: 'Get Diagnosis',
  diagnosis_result: 'Diagnosis Result',
  disease: 'Disease',
  confidence: 'Confidence',
  medicines: 'Recommended Medicines',
  wellness_tips: 'Wellness Tips',
  generate_prescription: 'Generate Prescription',
  prescription: 'Prescription',
  fever: 'Fever',
  cough: 'Cough',
  sore_throat: 'Sore Throat',
  body_ache: 'Body Ache',
  runny_nose: 'Runny Nose',
  headache: 'Headache',
  fatigue: 'Fatigue',
  sneezing: 'Sneezing',
};

const hi = {
  app_title: 'दवा सिफारिश प्रणाली',
  welcome: 'दवा सलाहकार में आपका स्वागत है',
  description: 'अपने लक्षणों के आधार पर व्यक्तिगत दवा सिफारिशें प्राप्त करें',
  select_symptoms: 'अपने लक्षण चुनें',
  diagnose: 'निदान प्राप्त करें',
  diagnosis_result: 'निदान परिणाम',
  disease: 'बीमारी',
  confidence: 'आत्मविश्वास',
  medicines: 'अनुशंसित दवाएं',
  wellness_tips: 'स्वास्थ्य सुझाव',
  generate_prescription: 'नुस्खा उत्पन्न करें',
  prescription: 'नुस्खा',
  fever: 'बुखार',
  cough: 'खांसी',
  sore_throat: 'गले में खराश',
  body_ache: 'शरीर में दर्द',
  runny_nose: 'नाक बहना',
  headache: 'सिरदर्द',
  fatigue: 'थकान',
  sneezing: 'छींक',
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    resources: {
      en: { translation: en },
      hi: { translation: hi }
    }
  });

export default i18n;
