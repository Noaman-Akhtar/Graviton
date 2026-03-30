import { FLAP_FUEL_COST, FLAP_STRENGTH } from './config.js';
import { gameState, resetGameState } from './state.js';
import { initializeObstacles } from './obstacles.js';
import {
  getEffectsVolume,
  getMusicVolume,
  playButtonSound,
  playFlapSound,
  playTapSound,
  setEffectsVolume,
  setMusicVolume,
  startBackgroundMusic,
  stopBackgroundMusic
} from './audio.js';

let inputInitialized = false;
let gamePaused = false;
let pauseMusicSubMenuOpen = false;

function getMenuElements() {
  return {
    menu: document.getElementById('main-menu'),
    musicMenu: document.getElementById('music-menu'),
    gameOverMenu: document.getElementById('game-over-menu'),
    pauseMenu: document.getElementById('pause-menu'),
    pauseMusicMenu: document.getElementById('pause-music-menu'),
    playBtn: document.getElementById('play-btn'),
    musicBtn: document.getElementById('music-btn'),
    musicBackBtn: document.getElementById('music-back-btn'),
    restartBtn: document.getElementById('restart-btn'),
    backMenuBtn: document.getElementById('back-menu-btn'),
    resumeBtn: document.getElementById('resume-btn'),
    pauseNewGameBtn: document.getElementById('pause-newgame-btn'),
    pauseMusicBtn: document.getElementById('pause-music-btn'),
    pauseMainMenuBtn: document.getElementById('pause-mainmenu-btn'),
    pauseMusicBackBtn: document.getElementById('pause-music-back-btn'),
    pauseMusicVolume: document.getElementById('pause-music-volume'),
    pauseMusicVolumeValue: document.getElementById('pause-music-volume-value'),
    pauseEffectsVolume: document.getElementById('pause-effects-volume'),
    pauseEffectsVolumeValue: document.getElementById('pause-effects-volume-value'),
    prevBtn: document.getElementById('prev-ship'),
    nextBtn: document.getElementById('next-ship'),
    effectsVolume: document.getElementById('effects-volume'),
    effectsVolumeValue: document.getElementById('effects-volume-value'),
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

function updateAudioUi() {
  const {
    effectsVolume, effectsVolumeValue, musicVolume, musicVolumeValue,
    pauseMusicVolume, pauseMusicVolumeValue, pauseEffectsVolume, pauseEffectsVolumeValue
  } = getMenuElements();
  const musicPercent = Math.round(getMusicVolume() * 100);
  const effectsPercent = Math.round(getEffectsVolume() * 100);

  if (effectsVolume) {
    effectsVolume.value = `${effectsPercent}`;
  }
  if (effectsVolumeValue) {
    effectsVolumeValue.textContent = `${effectsPercent}%`;
  }
  if (musicVolume) {
    musicVolume.value = `${musicPercent}`;
  }
  if (musicVolumeValue) {
    musicVolumeValue.textContent = `${musicPercent}%`;
  }
  if (pauseEffectsVolume) {
    pauseEffectsVolume.value = `${effectsPercent}`;
  }
  if (pauseEffectsVolumeValue) {
    pauseEffectsVolumeValue.textContent = `${effectsPercent}%`;
  }
  if (pauseMusicVolume) {
    pauseMusicVolume.value = `${musicPercent}`;
  }
  if (pauseMusicVolumeValue) {
    pauseMusicVolumeValue.textContent = `${musicPercent}%`;
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

function showPauseMenu() {
  const { pauseMenu } = getMenuElements();
  if (pauseMenu) pauseMenu.classList.remove('hidden');
}

function hidePauseMenu() {
  const { pauseMenu } = getMenuElements();
  if (pauseMenu) pauseMenu.classList.add('hidden');
}

function showPauseMusicMenu() {
  const { pauseMusicMenu } = getMenuElements();
  if (pauseMusicMenu) pauseMusicMenu.classList.remove('hidden');
}

function hidePauseMusicMenu() {
  const { pauseMusicMenu } = getMenuElements();
  if (pauseMusicMenu) pauseMusicMenu.classList.add('hidden');
}

export function isPaused() {
  return gamePaused;
}

function pauseGame() {
  if (!gameState.gameStarted || gameState.gameOver) return;
  gamePaused = true;
  pauseMusicSubMenuOpen = false;
  updateAudioUi();
  showPauseMenu();
}

function resumeGame() {
  gamePaused = false;
  pauseMusicSubMenuOpen = false;
  hidePauseMenu();
  hidePauseMusicMenu();
}

function togglePause() {
  if (gamePaused) {
    resumeGame();
  } else {
    pauseGame();
  }
}

export function resetGame() {
  stopBackgroundMusic();
  gamePaused = false;
  pauseMusicSubMenuOpen = false;
  resetGameState();
  initializeObstacles();
  updateShipUI();
  updateAudioUi();
  hideMusicMenu();
  hideGameOverMenu();
  hidePauseMenu();
  hidePauseMusicMenu();
}

export function flap() {
  if (isMainMenuVisible() || isMusicMenuVisible() || isGameOverMenuVisible() || gamePaused) {
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
    effectsVolume,
    musicVolume,
    restartBtn,
    backMenuBtn
  } = getMenuElements();

  updateShipUI();
  updateGameOverUI();
  updateAudioUi();

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      event.preventDefault();
      if (pauseMusicSubMenuOpen) {
        pauseMusicSubMenuOpen = false;
        hidePauseMusicMenu();
        showPauseMenu();
        return;
      }
      if (gameState.gameStarted && !gameState.gameOver) {
        togglePause();
      }
      return;
    }

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

  if (effectsVolume) {
    effectsVolume.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      setEffectsVolume(Number(target.value) / 100);
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

  // Pause menu buttons
  const {
    resumeBtn, pauseNewGameBtn, pauseMusicBtn, pauseMainMenuBtn,
    pauseMusicBackBtn, pauseMusicVolume: pmv, pauseEffectsVolume: pev
  } = getMenuElements();

  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      playButtonSound();
      resumeGame();
    });
  }

  if (pauseNewGameBtn) {
    pauseNewGameBtn.addEventListener('click', () => {
      playButtonSound();
      resumeGame();
      resetGame();
      hideMenu();
      flap();
    });
  }

  if (pauseMusicBtn) {
    pauseMusicBtn.addEventListener('click', () => {
      playButtonSound();
      pauseMusicSubMenuOpen = true;
      updateAudioUi();
      hidePauseMenu();
      showPauseMusicMenu();
    });
  }

  if (pauseMainMenuBtn) {
    pauseMainMenuBtn.addEventListener('click', () => {
      playButtonSound();
      resumeGame();
      resetGame();
      showMenu();
    });
  }

  if (pauseMusicBackBtn) {
    pauseMusicBackBtn.addEventListener('click', () => {
      playButtonSound();
      pauseMusicSubMenuOpen = false;
      hidePauseMusicMenu();
      showPauseMenu();
    });
  }

  if (pmv) {
    pmv.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      setMusicVolume(Number(target.value) / 100);
      updateAudioUi();
    });
  }

  if (pev) {
    pev.addEventListener('input', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      setEffectsVolume(Number(target.value) / 100);
      updateAudioUi();
    });
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
