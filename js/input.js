import { FLAP_FUEL_COST, FLAP_STRENGTH } from './config.js';
import { gameState, resetGameState } from './state.js';
import { initializeObstacles } from './obstacles.js';
import {
  getMusicVolume,
  isEffectsEnabled,
  playButtonSound,
  playFlapSound,
  playTapSound,
  setEffectsEnabled,
  setMusicVolume,
  startBackgroundMusic,
  stopBackgroundMusic
} from './audio.js';

let inputInitialized = false;

function getMenuElements() {
  return {
    menu: document.getElementById('main-menu'),
    musicMenu: document.getElementById('music-menu'),
    gameOverMenu: document.getElementById('game-over-menu'),
    playBtn: document.getElementById('play-btn'),
    musicBtn: document.getElementById('music-btn'),
    musicBackBtn: document.getElementById('music-back-btn'),
    restartBtn: document.getElementById('restart-btn'),
    backMenuBtn: document.getElementById('back-menu-btn'),
    prevBtn: document.getElementById('prev-ship'),
    nextBtn: document.getElementById('next-ship'),
    effectsToggle: document.getElementById('effects-toggle'),
    musicVolume: document.getElementById('music-volume'),
    musicVolumeValue: document.getElementById('music-volume-value'),
    shipDisplay: document.getElementById('ship-display'),
    finalScore: document.getElementById('final-score'),
    finalBest: document.getElementById('final-best')
  };
}

function isMainMenuVisible() {
  const { menu } = getMenuElements();
  return Boolean(menu && !menu.classList.contains('hidden'));
}

function isMusicMenuVisible() {
  const { musicMenu } = getMenuElements();
  return Boolean(musicMenu && !musicMenu.classList.contains('hidden'));
}

function isGameOverMenuVisible() {
  const { gameOverMenu } = getMenuElements();
  return Boolean(gameOverMenu && !gameOverMenu.classList.contains('hidden'));
}

function hideMenu() {
  const { menu } = getMenuElements();
  if (menu) {
    menu.classList.add('hidden');
  }
}

function showMenu() {
  const { menu } = getMenuElements();
  if (menu) {
    menu.classList.remove('hidden');
  }
}

function hideMusicMenu() {
  const { musicMenu } = getMenuElements();
  if (musicMenu) {
    musicMenu.classList.add('hidden');
  }
}

function showMusicMenu() {
  const { musicMenu } = getMenuElements();
  if (musicMenu) {
    musicMenu.classList.remove('hidden');
  }
}

function hideGameOverMenu() {
  const { gameOverMenu } = getMenuElements();
  if (gameOverMenu) {
    gameOverMenu.classList.add('hidden');
  }
}

function showGameOverMenu() {
  const { gameOverMenu } = getMenuElements();
  if (gameOverMenu) {
    gameOverMenu.classList.remove('hidden');
  }
}

function updateShipUI() {
  const { shipDisplay } = getMenuElements();
  if (shipDisplay) {
    shipDisplay.style.setProperty('--ship-color', gameState.shipColors[gameState.selectedShipIndex]);
  }
}

function updateGameOverUI() {
  const { finalScore, finalBest } = getMenuElements();
  if (finalScore) {
    finalScore.textContent = `${gameState.score}`;
  }
  if (finalBest) {
    finalBest.textContent = `${gameState.highScore}`;
  }
}

function updateEffectsToggle(button, enabled) {
  if (!button) {
    return;
  }

  button.textContent = enabled ? 'ON' : 'OFF';
  button.setAttribute('aria-pressed', String(enabled));
  button.classList.toggle('off', !enabled);
}

function updateAudioUi() {
  const { effectsToggle, musicVolume, musicVolumeValue } = getMenuElements();
  const musicPercent = Math.round(getMusicVolume() * 100);

  updateEffectsToggle(effectsToggle, isEffectsEnabled());

  if (musicVolume) {
    musicVolume.value = `${musicPercent}`;
  }

  if (musicVolumeValue) {
    musicVolumeValue.textContent = `${musicPercent}%`;
  }
}

function openMusicMenu() {
  playButtonSound();
  updateAudioUi();
  hideMenu();
  showMusicMenu();
}

function closeMusicMenu() {
  playButtonSound();
  hideMusicMenu();
  showMenu();
}

function restartFromOverlay() {
  playButtonSound();
  resetGame();
  hideMenu();
  hideGameOverMenu();
  flap();
}

function returnToMainMenu() {
  playButtonSound();
  resetGame();
  hideGameOverMenu();
  showMenu();
}

export function resetGame() {
  stopBackgroundMusic();
  resetGameState();
  initializeObstacles();
  updateShipUI();
  updateAudioUi();
  hideMusicMenu();
  hideGameOverMenu();
}

export function flap() {
  if (isMainMenuVisible() || isMusicMenuVisible() || isGameOverMenuVisible()) {
    return;
  }

  if (gameState.gameStarted && !gameState.gameOver && gameState.slowBuffTimer > 0) {
    playTapSound();
    return;
  }

  if (gameState.gameOver) {
    if (gameState.deathFallActive) {
      return;
    }

    const shouldAutoRestart = gameState.hasStartedOnce;
    resetGame();
    if (!shouldAutoRestart) {
      return;
    }
  }

  if (gameState.fuel < FLAP_FUEL_COST) {
    return;
  }

  if (!gameState.gameStarted) {
    startBackgroundMusic();
    gameState.gameStarted = true;
    gameState.hasStartedOnce = true;
  }

  gameState.fuel -= FLAP_FUEL_COST;
  gameState.flapCount++;
  gameState.velocity = FLAP_STRENGTH;
  playTapSound();
  playFlapSound();
}

export function setupInput() {
  if (inputInitialized) {
    return;
  }

  inputInitialized = true;

  const {
    playBtn,
    musicBtn,
    musicBackBtn,
    prevBtn,
    nextBtn,
    effectsToggle,
    musicVolume,
    restartBtn,
    backMenuBtn
  } = getMenuElements();

  updateShipUI();
  updateGameOverUI();
  updateAudioUi();

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') {
      return;
    }

    event.preventDefault();
    if (isGameOverMenuVisible()) {
      restartFromOverlay();
      return;
    }
    flap();
  });

  window.addEventListener('mousedown', (event) => {
    if (event.target instanceof Element && event.target.closest('button, input')) {
      return;
    }
    if (isGameOverMenuVisible() || isMusicMenuVisible()) {
      return;
    }
    flap();
  });

  window.addEventListener('touchstart', (event) => {
    if (event.target instanceof Element && event.target.closest('button, input')) {
      return;
    }
    if (isGameOverMenuVisible() || isMusicMenuVisible()) {
      return;
    }
    event.preventDefault();
    flap();
  }, { passive: false });

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      playButtonSound();
      hideMenu();
      flap();
    });
  }

  if (musicBtn) {
    musicBtn.addEventListener('click', openMusicMenu);
  }

  if (musicBackBtn) {
    musicBackBtn.addEventListener('click', closeMusicMenu);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      playButtonSound();
      gameState.selectedShipIndex =
        (gameState.selectedShipIndex - 1 + gameState.shipColors.length) % gameState.shipColors.length;
      updateShipUI();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      playButtonSound();
      gameState.selectedShipIndex = (gameState.selectedShipIndex + 1) % gameState.shipColors.length;
      updateShipUI();
    });
  }

  if (effectsToggle) {
    effectsToggle.addEventListener('click', () => {
      const nextEnabled = !isEffectsEnabled();

      if (nextEnabled) {
        setEffectsEnabled(true);
        playButtonSound();
      } else {
        playButtonSound();
        setEffectsEnabled(false);
      }

      updateAudioUi();
    });
  }

  if (musicVolume) {
    musicVolume.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      setMusicVolume(Number(target.value) / 100);
      updateAudioUi();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', restartFromOverlay);
  }

  if (backMenuBtn) {
    backMenuBtn.addEventListener('click', returnToMainMenu);
  }
}

export function syncUiOverlays() {
  if (gameState.gameOver && !gameState.deathFallActive) {
    updateGameOverUI();
    showGameOverMenu();
    return;
  }

  hideGameOverMenu();
}
