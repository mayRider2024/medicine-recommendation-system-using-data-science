import { transcriptionAPI } from './api';

// Enhanced symptom mappings with variations, slangs, prefixes, and synonyms
const symptomMappings = {
  fever: {
    keywords: ['fever', 'बुखार', 'high temperature', 'temperature', 'temp', 'hot body', 'feeling hot', 'burning up', 'feverish'],
    patterns: [/\b(fever|temperature|temp|feverish)\b/i, /\bhigh\s+temp/i, /\bfeeling\s+hot/i, /\bburning\s+up/i]
  },
  cough: {
    keywords: ['cough', 'खांसी', 'coughing', 'continuous cough', 'dry cough', 'wet cough', 'hacking cough'],
    patterns: [/\bcough(ing)?\b/i, /\bkhans[iy]/i]
  },
  sore_throat: {
    keywords: ['sore throat', 'गले में खराश', 'throat pain', 'throat ache', 'pain in throat', 'throat hurts', 'hurting throat', 'throat is paining', 'throat irritation'],
    patterns: [/\b(sore|pain|ache|hurt|paining|irritat\w*)\s+(in\s+)?(my\s+)?throat/i, /\bthroat\s+(pain|ache|hurt|is\s+paining|paining|irritat\w*)/i]
  },
  body_ache: {
    keywords: ['body ache', 'शरीर में दर्द', 'body pain', 'muscle pain', 'muscles hurt', 'body hurts', 'aching body', 'pain in body', 'body is paining', 'aches and pains'],
    patterns: [/\b(body|muscle)\s+(ache|pain|hurt|paining|sore)/i, /\b(ache|pain|hurt|paining)\s+(in\s+)?(my\s+)?(body|muscles?)/i, /\b(body|muscles?)\s+(is\s+)?(paining|hurting)/i]
  },
  runny_nose: {
    keywords: ['runny nose', 'बहती नाक', 'running nose', 'nose running', 'nasal discharge', 'blocked nose', 'stuffy nose', 'congested nose', 'nose is blocked', 'nasal congestion'],
    patterns: [/\b(runny|running|blocked|stuffy|congested)\s+nose/i, /\bnose\s+(running|runny|blocked|stuffy|is\s+blocked|is\s+running)/i]
  },
  headache: {
    keywords: ['headache', 'सिरदर्द', 'head ache', 'head pain', 'pain in head', 'pain in my head', 'head hurts', 'hurting head', 'migraine', 'head is paining', 'head paining'],
    patterns: [/\bhead\s*ache/i, /\b(pain|ache|hurt|paining)\s+(in\s+)?(my\s+)?head/i, /\bhead\s+(pain|hurt|is\s+paining|paining)/i, /\bmigraine/i, /\b(my\s+)?head\s+is\s+paining/i]
  },
  fatigue: {
    keywords: ['fatigue', 'थकान', 'tired', 'weakness', 'feeling weak', 'no energy', 'exhausted', 'exhaustion', 'tiredness', 'lethargic', 'drowsy', 'extreme tiredness', 'feeling drained'],
    patterns: [/\b(fatigue|tired|weak|exhausted|exhaustion|lethargic|drowsy|drained)/i, /\bno\s+energy/i, /\bfeeling\s+(weak|tired|drained)/i]
  },
  sneezing: {
    keywords: ['sneezing', 'छींक', 'sneeze', 'continuous sneezing', 'frequent sneezing'],
    patterns: [/\bsneez(e|ing)/i]
  },
  nausea: {
    keywords: ['nausea', 'मतली', 'feeling sick', 'vomiting', 'throw up', 'throwing up', 'feel like vomiting', 'want to vomit', 'queasy'],
    patterns: [/\b(nausea|vomit(ing)?|throwing\s+up|throw\s+up|queasy)/i, /\bfeel(ing)?\s+(sick|like\s+vomiting)/i]
  },
  dizziness: {
    keywords: ['dizziness', 'चक्कर', 'dizzy', 'lightheaded', 'vertigo', 'spinning', 'feeling dizzy'],
    patterns: [/\b(dizz(y|iness)|lightheaded|vertigo|spinning)/i, /\bfeeling\s+dizzy/i]
  },
  chills: {
    keywords: ['chills', 'ठंड लगना', 'shivering', 'shaking', 'cold sweats', 'feeling cold', 'rigors'],
    patterns: [/\b(chills?|shiver(ing)?|shaking|cold\s+sweats?|rigors?)/i, /\bfeeling\s+cold/i]
  },
  chest_pain: {
    keywords: ['chest pain', 'सीने में दर्द', 'pain in chest', 'chest hurts', 'chest ache', 'chest is paining', 'chest tightness'],
    patterns: [/\b(pain|ache|hurt|paining|tightness)\s+(in\s+)?(my\s+)?chest/i, /\bchest\s+(pain|ache|hurt|is\s+paining|paining|tightness)/i]
  },
  shortness_of_breath: {
    keywords: ['shortness of breath', 'सांस की तकलीफ', 'breathing difficulty', 'difficulty breathing', 'cant breathe', 'hard to breathe', 'breathless', 'breathlessness'],
    patterns: [/\bshortness\s+of\s+breath/i, /\b(breathing\s+difficulty|difficulty\s+breathing)/i, /\b(cant|cannot|can't)\s+breathe/i, /\bhard\s+to\s+breathe/i, /\bbreathless(ness)?/i]
  },
  loss_of_taste: {
    keywords: ['loss of taste', 'स्वाद की कमी', 'cant taste', 'no taste', 'taste loss'],
    patterns: [/\bloss\s+of\s+taste/i, /\b(cant|cannot|can't)\s+taste/i, /\bno\s+taste/i]
  },
  loss_of_smell: {
    keywords: ['loss of smell', 'गंध की कमी', 'cant smell', 'no smell', 'smell loss'],
    patterns: [/\bloss\s+of\s+smell/i, /\b(cant|cannot|can't)\s+smell/i, /\bno\s+smell/i]
  },
  diarrhea: {
    keywords: ['diarrhea', 'दस्त', 'loose motions', 'stomach upset', 'upset stomach', 'watery stool'],
    patterns: [/\b(diarr[hoe]ea|loose\s+motions?|stomach\s+upset|upset\s+stomach|watery\s+stool)/i]
  },
  constipation: {
    keywords: ['constipation', 'कब्ज़', 'cant pass stool', 'difficulty in passing stool'],
    patterns: [/\bconstipation/i, /\b(cant|cannot|can't)\s+pass\s+stool/i, /\bdifficulty\s+(in\s+)?passing\s+stool/i]
  },
  abdominal_pain: {
    keywords: ['abdominal pain', 'पेट दर्द', 'stomach pain', 'belly pain', 'pain in stomach', 'stomach ache', 'stomach is paining', 'cramps in stomach'],
    patterns: [/\b(abdominal|stomach|belly)\s+(pain|ache|hurt|paining|cramps?)/i, /\b(pain|ache|hurt|paining|cramps?)\s+(in\s+)?(my\s+)?(stomach|belly|abdomen)/i]
  },
  back_pain: {
    keywords: ['back pain', 'पीठ दर्द', 'backache', 'pain in back', 'back hurts', 'back is paining', 'lower back pain'],
    patterns: [/\b(lower\s+)?back\s*(pain|ache|hurt|paining)/i, /\b(pain|ache|hurt|paining)\s+(in\s+)?(my\s+)?(lower\s+)?back/i]
  },
  joint_pain: {
    keywords: ['joint pain', 'जोड़ों में दर्द', 'joints hurt', 'pain in joints', 'aching joints', 'joint stiffness'],
    patterns: [/\bjoint\s+(pain|ache|hurt|stiffness)/i, /\b(pain|ache|hurt)\s+(in\s+)?(my\s+)?joints/i, /\bjoints\s+(hurt|aching)/i]
  },
  rash: {
    keywords: ['rash', 'दाने', 'skin rash', 'red spots', 'itchy skin', 'skin irritation', 'weird rash', 'strange rash', 'red rash', 'rashes', 'skin eruption', 'bumps on skin'],
    patterns: [/\b(\w+\s+)?rash(es)?\b/i, /\b(skin\s+)?rash(es)?/i, /\bred\s+spots/i, /\bitchy\s+skin/i, /\bskin\s+eruption/i]
  },
  sweating: {
    keywords: ['sweating', 'पसीना', 'excessive sweating', 'night sweats', 'profuse sweating', 'perspiration'],
    patterns: [/\bsweat(ing|s)?/i, /\b(excessive|night|profuse)\s+sweat(ing|s)?/i]
  },
  insomnia: {
    keywords: ['insomnia', 'अनिद्रा', 'cant sleep', 'difficulty sleeping', 'sleepless', 'trouble sleeping', 'poor sleep', 'sleeplessness'],
    patterns: [/\binsomnia/i, /\b(cant|cannot|can't)\s+sleep/i, /\bdifficulty\s+sleeping/i, /\btrouble\s+sleeping/i, /\bsleepless(ness)?/i]
  }
};

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  return matrix[len2][len1];
}

// Calculate similarity ratio between two strings
function similarityRatio(str1, str2) {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

export const voiceService = {
  isSupported: () => !!navigator.mediaDevices?.getUserMedia,

  startRecording: async (onRecordingStart, onRecordingStop) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        onRecordingStop(audioBlob);
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      onRecordingStart();

      return mediaRecorder;
    } catch (error) {
      throw new Error(`Microphone access denied: ${error.message}`);
    }
  },

  stopRecording: (mediaRecorder) => {
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
  },

  transcribeAudio: async (audioBlob, language = 'en') => {
    try {
      const response = await transcriptionAPI.transcribeAudio(audioBlob, language);
      return response.data;
    } catch (error) {
      throw new Error(`Transcription failed: ${error.response?.data?.detail || error.message}`);
    }
  },

  speak: (text, language = 'en') => {
    if (!window.speechSynthesis) {
      console.error('Text-to-speech not supported');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  },

  extractSymptoms: (transcript, strictMode = false) => {
    if (!transcript || typeof transcript !== 'string') return [];

    const foundSymptoms = new Set();
    // Normalize string: replace underscores and hyphens with spaces for robust phrase matching
    let normalizedTranscript = transcript.toLowerCase().replace(/[_-]/g, ' ').trim();

    // Whisper corrections for voice input
    if (!strictMode) {
      normalizedTranscript = normalizedTranscript
        .replace(/\bcuff\b/g, 'cough')
        .replace(/\bspaining\b/g, 'paining')
        .replace(/\b(body|head|chest|back|stomach|throat)\s+(?:is\s+)?spinning\b/g, '$1 is paining');
    }

    // Iterate through each symptom and its matching rules
    Object.entries(symptomMappings).forEach(([symptomKey, rules]) => {
      let matched = false;

      // 1. Pattern matching (regex-based) - highest priority
      for (const pattern of rules.patterns) {
        if (pattern.test(normalizedTranscript)) {
          foundSymptoms.add(symptomKey);
          matched = true;
          break;
        }
      }

      // 2. Exact keyword matching
      if (!matched) {
        for (const keyword of rules.keywords) {
          if (normalizedTranscript.includes(keyword.toLowerCase())) {
            foundSymptoms.add(symptomKey);
            matched = true;
            break;
          }
        }
      }

      // 3. Fuzzy matching - ONLY for voice input (when strictMode is false)
      if (!matched && !strictMode) {
        for (const keyword of rules.keywords) {
          const words = normalizedTranscript.split(/\s+/);

          // Check single words against single-word keywords
          for (const word of words) {
            if (word.length >= 4 && keyword.length >= 4) {
              const similarity = similarityRatio(word, keyword);
              if (similarity >= 0.8) { // 80% similarity threshold
                foundSymptoms.add(symptomKey);
                matched = true;
                break;
              }
            }
          }

          if (matched) break;

          // Check n-grams (word sequences) against multi-word keywords
          if (keyword.includes(' ')) {
            const keywordWords = keyword.split(/\s+/).length;
            for (let i = 0; i <= words.length - keywordWords; i++) {
              const ngram = words.slice(i, i + keywordWords).join(' ');
              const similarity = similarityRatio(ngram, keyword);
              if (similarity >= 0.75) { // 75% similarity for phrases
                foundSymptoms.add(symptomKey);
                matched = true;
                break;
              }
            }
          }

          if (matched) break;
        }
      }
    });

    return Array.from(foundSymptoms);
  },

  // Extract potential custom symptoms from unrecognized text
  extractCustomSymptoms: (transcript) => {
    if (!transcript || typeof transcript !== 'string') return [];

    const normalizedTranscript = transcript.toLowerCase().trim();
    const customSymptoms = [];

    // 1. First, extract standalone medical conditions (most specific)
    const medicalConditions = /\b(unconscious|semiconscious|dizzy|nauseous|feverish|faint|weak|drowsy|lethargic|restless|anxious|confused|disoriented)\b/gi;
    const conditionMatches = normalizedTranscript.match(medicalConditions);
    if (conditionMatches) {
      conditionMatches.forEach(condition => {
        customSymptoms.push(condition.toLowerCase());
      });
    }

    // 2. Extract body part + descriptor combinations
    const bodyParts = new Set([
      'eye', 'eyes', 'ear', 'ears', 'nose', 'mouth', 'tooth', 'teeth', 'tongue',
      'neck', 'shoulder', 'shoulders', 'arm', 'arms', 'elbow', 'elbows', 'wrist', 'wrists',
      'hand', 'hands', 'finger', 'fingers', 'chest', 'stomach', 'abdomen', 'belly',
      'back', 'hip', 'hips', 'leg', 'legs', 'knee', 'knees', 'ankle', 'ankles',
      'foot', 'feet', 'toe', 'toes', 'skin', 'throat', 'head', 'face', 'jaw', 'gum', 'gums'
    ]);

    const descriptors = new Set([
      'pain', 'paining', 'ache', 'aching', 'hurt', 'hurting', 'sore',
      'swelling', 'swollen', 'burning', 'itching', 'bleeding', 'numb', 'numbness',
      'tingling', 'cramping', 'stiff', 'tender', 'inflamed'
    ]);

    // Look for patterns like "body_part + descriptor" or "descriptor + body_part"
    const bodyPartPatterns = [
      /\b(eye|eyes|ear|ears|nose|mouth|tooth|teeth|tongue|neck|shoulder|shoulders|arm|arms|elbow|elbows|wrist|wrists|hand|hands|finger|fingers|chest|stomach|abdomen|belly|back|hip|hips|leg|legs|knee|knees|ankle|ankles|foot|feet|toe|toes|skin|throat|head|face|jaw|gum|gums)\s+(is\s+|are\s+)?(pain|paining|ache|aching|hurt|hurting|sore|swelling|swollen|burning|itching|bleeding|numb|numbness|tingling|cramping|stiff|tender|inflamed)/gi,
      /\b(pain|paining|ache|aching|hurt|hurting|sore|swelling|swollen|burning|itching|bleeding|numb|numbness|tingling|cramping|stiff|tender|inflamed)\s+(in\s+|on\s+)?(my\s+)?(eye|eyes|ear|ears|nose|mouth|tooth|teeth|tongue|neck|shoulder|shoulders|arm|arms|elbow|elbows|wrist|wrists|hand|hands|finger|fingers|chest|stomach|abdomen|belly|back|hip|hips|leg|legs|knee|knees|ankle|ankles|foot|feet|toe|toes|skin|throat|head|face|jaw|gum|gums)/gi
    ];

    bodyPartPatterns.forEach(pattern => {
      const matches = normalizedTranscript.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Clean up the match
          const cleaned = match.replace(/\b(is|are|in|on|my)\b/g, '').trim().replace(/\s+/g, ' ');
          if (cleaned.length > 3 && !customSymptoms.some(s => s.includes(cleaned) || cleaned.includes(s))) {
            customSymptoms.push(cleaned);
          }
        });
      }
    });

    // 3. Remove duplicates and substrings (keep the shortest unique match)
    const uniqueSymptoms = [];
    const sortedSymptoms = customSymptoms.sort((a, b) => a.length - b.length);

    for (const symptom of sortedSymptoms) {
      // Check if this symptom is not a substring or superstring of existing ones
      const isDuplicate = uniqueSymptoms.some(existing => {
        // If one contains the other, they're related
        if (existing.includes(symptom) || symptom.includes(existing)) {
          // Keep the one with body part + descriptor combination
          const symptomHasBodyPart = Array.from(bodyParts).some(bp => symptom.includes(bp));
          const symptomHasDescriptor = Array.from(descriptors).some(d => symptom.includes(d));
          const existingHasBodyPart = Array.from(bodyParts).some(bp => existing.includes(bp));
          const existingHasDescriptor = Array.from(descriptors).some(d => existing.includes(d));

          // If current symptom is just a standalone condition and existing has body part combo, skip current
          if (existingHasBodyPart && existingHasDescriptor && !(symptomHasBodyPart && symptomHasDescriptor)) {
            return true;
          }
          // If they're the same type, keep the shorter one
          if ((symptomHasBodyPart === existingHasBodyPart) && (symptomHasDescriptor === existingHasDescriptor)) {
            return existing.length <= symptom.length;
          }
        }
        return false;
      });

      if (!isDuplicate) {
        uniqueSymptoms.push(symptom);
      }
    }

    return uniqueSymptoms;
  },
};
