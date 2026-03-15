const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioContextClass ? new AudioContextClass() : null;
const AUDIO_SETTINGS_KEY = 'gravitonAudioSettings';
const DEFAULT_AUDIO_SETTINGS = {
  musicVolume: 0.35,
  effectsEnabled: true
};
const EFFECTS_GAIN = 1.7;
const bgMusic = typeof Audio !== 'undefined'
  ? new Audio(new URL('./music.mp3', import.meta.url).href)
  : null;

let musicVolume = DEFAULT_AUDIO_SETTINGS.musicVolume;
let effectsEnabled = DEFAULT_AUDIO_SETTINGS.effectsEnabled;
let lastLowFuelWarningAt = 0;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function scaleEffectVolume(value) {
  return clamp01(value * EFFECTS_GAIN);
}

function loadAudioSettings() {
  if (typeof localStorage === 'undefined') {
    return DEFAULT_AUDIO_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_AUDIO_SETTINGS;
    }

    const parsed = JSON.parse(raw);
    const parsedMusicVolume = typeof parsed.musicVolume === 'number'
      ? clamp01(parsed.musicVolume)
      : parsed.musicEnabled === false
        ? 0
        : DEFAULT_AUDIO_SETTINGS.musicVolume;

    return {
      musicVolume: parsedMusicVolume,
      effectsEnabled: parsed.effectsEnabled !== false
    };
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

function saveAudioSettings() {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(
      AUDIO_SETTINGS_KEY,
      JSON.stringify({
        musicVolume,
        effectsEnabled
      })
    );
  } catch {
    // Ignore storage failures so the game audio can still run.
  }
}

function applyMusicVolume() {
  if (!bgMusic) {
    return;
  }

  bgMusic.volume = clamp01(musicVolume);
}

{
  const storedSettings = loadAudioSettings();
  musicVolume = storedSettings.musicVolume;
  effectsEnabled = storedSettings.effectsEnabled;
}

if (bgMusic) {
  bgMusic.loop = true;
  bgMusic.preload = 'auto';
  applyMusicVolume();
}

function resumeAudioContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
}

function ensureEffectsAudio() {
  if (!audioCtx || !effectsEnabled) {
    return false;
  }

  resumeAudioContext();
  return true;
}

function playTone(freq, type, duration, vol, startOffset = 0) {
  if (!ensureEffectsAudio()) {
    return;
  }

  const startTime = audioCtx.currentTime + startOffset;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(scaleEffectVolume(vol), startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

function playNoise(duration, vol, filterFrequency = 1000, startOffset = 0) {
  if (!ensureEffectsAudio()) {
    return;
  }

  const startTime = audioCtx.currentTime + startOffset;
  const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(scaleEffectVolume(vol), startTime);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFrequency, startTime);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  noise.start(startTime);
  noise.stop(startTime + duration);
}

export function getMusicVolume() {
  return musicVolume;
}

export function setMusicVolume(value) {
  musicVolume = clamp01(value);
  applyMusicVolume();
  saveAudioSettings();

  if (musicVolume <= 0 && bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

export function isEffectsEnabled() {
  return effectsEnabled;
}

export function setEffectsEnabled(value) {
  effectsEnabled = Boolean(value);
  saveAudioSettings();
}

export function startBackgroundMusic() {
  if (musicVolume <= 0) {
    return;
  }

  resumeAudioContext();

  if (!bgMusic) {
    return;
  }

  applyMusicVolume();

  if (bgMusic.paused) {
    bgMusic.play().catch(() => {});
  }
}

export function stopBackgroundMusic() {
  if (!bgMusic) {
    return;
  }

  bgMusic.pause();
  bgMusic.currentTime = 0;
}

export function playFlapSound() {
  playTone(180, 'triangle', 0.09, 0.24);
  playTone(250, 'triangle', 0.14, 0.16, 0.04);
}

export function playTapSound() {
  playTone(520, 'square', 0.035, 0.11);
  playTone(420, 'square', 0.05, 0.08, 0.02);
}

export function playFuelSound() {
  playTone(560, 'square', 0.09, 0.08);
  playTone(760, 'square', 0.12, 0.08, 0.08);
}

export function playHealthSound() {
  playTone(360, 'sine', 0.12, 0.12);
  playTone(520, 'sine', 0.16, 0.12, 0.09);
}

export function playDiamondSound() {
  playTone(420, 'triangle', 0.12, 0.09);
  playTone(660, 'triangle', 0.16, 0.09, 0.08);
  playTone(920, 'triangle', 0.22, 0.07, 0.16);
}

export function playButtonSound() {
  playTone(740, 'sine', 0.05, 0.14);
  playTone(980, 'sine', 0.06, 0.08, 0.03);
}

export function playCollisionSound() {
  playNoise(0.12, 0.22, 1400);
  playTone(120, 'sawtooth', 0.16, 0.12);
}

export function playLowFuelWarning() {
  if (!effectsEnabled) {
    return;
  }

  const now = Date.now();

  if (now - lastLowFuelWarningAt < 850) {
    return;
  }

  lastLowFuelWarningAt = now;
  playTone(260, 'sawtooth', 0.11, 0.2);
  playTone(205, 'square', 0.14, 0.15, 0.08);
  playTone(160, 'square', 0.16, 0.13, 0.18);
}

export function playDeathSound() {
  playNoise(0.8, 0.55, 900);
  playTone(110, 'sawtooth', 0.65, 0.22);
  playTone(70, 'triangle', 0.8, 0.14, 0.08);
}
