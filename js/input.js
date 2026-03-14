import { FLAP_FUEL_COST, FLAP_STRENGTH } from './config.js';
import { gameState, resetGameState } from './state.js';
import { initializeObstacles } from './obstacles.js';
import { playFlapSound } from './audio.js';

let inputInitialized = false;

function getMenuElements() {
  return {
    menu: document.getElementById('main-menu'),
    gameOverMenu: document.getElementById('game-over-menu'),
    playBtn: document.getElementById('play-btn'),
    restartBtn: document.getElementById('restart-btn'),
    backMenuBtn: document.getElementById('back-menu-btn'),
    prevBtn: document.getElementById('prev-ship'),
    nextBtn: document.getElementById('next-ship'),
    shipDisplay: document.getElementById('ship-display'),
    finalScore: document.getElementById('final-score'),
    finalBest: document.getElementById('final-best')
  };
}

function isMainMenuVisible() {
  const { menu } = getMenuElements();
  return Boolean(menu && !menu.classList.contains('hidden'));
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

function restartFromOverlay() {
  resetGame();
  hideMenu();
  hideGameOverMenu();
  flap();
}

function returnToMainMenu() {
  resetGame();
  hideGameOverMenu();
  showMenu();
}

export function resetGame() {
  resetGameState();
  initializeObstacles();
  updateShipUI();
  hideGameOverMenu();
}

export function flap() {
  if (isMainMenuVisible() || isGameOverMenuVisible()) {
    return;
  }

  if (gameState.gameStarted && !gameState.gameOver && gameState.slowBuffTimer > 0) {
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
    gameState.gameStarted = true;
    gameState.hasStartedOnce = true;
  }

  gameState.fuel -= FLAP_FUEL_COST;
  gameState.flapCount++;
  gameState.velocity = FLAP_STRENGTH;
  playFlapSound();
}

export function setupInput() {
  if (inputInitialized) {
    return;
  }

  inputInitialized = true;

  const { playBtn, prevBtn, nextBtn } = getMenuElements();
  updateShipUI();
  updateGameOverUI();

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
    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }
    if (isGameOverMenuVisible()) {
      return;
    }
    flap();
  });

  window.addEventListener('touchstart', (event) => {
    if (event.target instanceof Element && event.target.closest('button')) {
      return;
    }
    if (isGameOverMenuVisible()) {
      return;
    }
    event.preventDefault();
    flap();
  }, { passive: false });

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      hideMenu();
      flap();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      gameState.selectedShipIndex =
        (gameState.selectedShipIndex - 1 + gameState.shipColors.length) % gameState.shipColors.length;
      updateShipUI();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      gameState.selectedShipIndex = (gameState.selectedShipIndex + 1) % gameState.shipColors.length;
      updateShipUI();
    });
  }

  const { restartBtn, backMenuBtn } = getMenuElements();

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
