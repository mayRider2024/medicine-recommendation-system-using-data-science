// Test script for voice transcription API
// Paste this into browser console (F12 > Console tab)

async function testVoiceTranscription() {
  console.log('🎙️ Testing voice transcription...');

  // Create a simple test audio blob (silence for now)
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 2; // 2 seconds of silence
  const numSamples = sampleRate * duration;
  const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Fill with silence (or you can add test data)
  for (let i = 0; i < numSamples; i++) {
    channelData[i] = 0;
  }

  // Convert to WAV format
  function encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let index = 44;
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(index, samples[i] * 0x7FFF, true);
      index += 2;
    }

    return buffer;
  }

  const wavData = encodeWAV(Array.from(channelData), sampleRate);
  const audioBlob = new Blob([wavData], { type: 'audio/wav' });

  console.log('📁 Created test audio blob:', audioBlob.size, 'bytes');

  // Create FormData
  const formData = new FormData();
  formData.append('audio', audioBlob, 'test_audio.wav');
  formData.append('language', 'en');

  try {
    const response = await fetch('http://localhost:8000/api/transcribe', {
      method: 'POST',
      body: formData
    });

    console.log('📊 Response status:', response.status);
    const data = await response.json();
    console.log('✅ Transcription result:', data);
    return data;
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testVoiceTranscription();
