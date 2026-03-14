const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioContextClass ? new AudioContextClass() : null;

function ensureAudio() {
  if (!audioCtx) {
    return false;
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return true;
}

function playTone(freq, type, duration, vol) {
  if (!ensureAudio()) {
    return;
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, vol) {
  if (!ensureAudio()) {
    return;
  }

  const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1000;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start();
}

export function playFlapSound() {
  playTone(150, 'sine', 0.15, 0.3);
}

export function playPickupSound() {
  playTone(600, 'square', 0.1, 0.1);
  setTimeout(() => playTone(800, 'square', 0.15, 0.1), 100);
}

export function playSlowBuffSound() {
  playTone(300, 'sine', 0.5, 0.2);
}

export function playDamageSound() {
  playNoise(0.3, 0.5);
}

export function playDeathSound() {
  playNoise(0.8, 0.8);
  playTone(100, 'sawtooth', 0.8, 0.5);
}
