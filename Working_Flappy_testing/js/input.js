// INPUT
import { gameState } from './state.js';
import { playerFlap } from './player.js';

let resetGameFn = null;

export function setResetGameFn(fn) {
  resetGameFn = fn;
}

export function setupInput() {
  window.addEventListener("keydown", e => {
    if (e.code === "Space") {
      e.preventDefault();
      handleFlap();
    }
  });

  window.addEventListener("mousedown", () => {
    handleFlap();
  });

  window.addEventListener("touchstart", (e) => {
    e.preventDefault();
    handleFlap();
  }, { passive: false });
}

function handleFlap() {
  if (gameState.gameOver) {
    if (resetGameFn) resetGameFn();
    return;
  }
  if (!gameState.gameStarted) {
    gameState.gameStarted = true;
    playerFlap();
    return;
  }
  playerFlap();
}
