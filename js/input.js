import { FLAP_FUEL_COST, FLAP_STRENGTH } from './config.js';
import { gameState, resetGameState } from './state.js';
import { initializeObstacles } from './obstacles.js';

let inputInitialized = false;

export function resetGame() {
  resetGameState();
  initializeObstacles();
}

export function flap() {
  if (gameState.gameOver) {
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
  gameState.velocity = FLAP_STRENGTH;
}

export function setupInput() {
  if (inputInitialized) {
    return;
  }

  inputInitialized = true;

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') {
      return;
    }

    event.preventDefault();
    flap();
  });

  window.addEventListener('mousedown', flap);

  window.addEventListener('touchstart', (event) => {
    event.preventDefault();
    flap();
  }, { passive: false });
}
