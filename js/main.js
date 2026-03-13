import {
  BASE_SCROLL_SPEED,
  FUEL_DRAIN_RATE,
  GRAVITY,
  MAX_SCROLL_SPEED,
  TUNNEL_WIDTH
} from './config.js';
import { resetGame, setupInput } from './input.js';
import { updateObstacles } from './obstacles.js';
import { updateTrailSparkles } from './particles.js';
import { updatePickups } from './pickups.js';
import { draw } from './renderer.js';
import { applyDamage, gameState, setGameOver } from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function update() {
  if (gameState.gameOver) {
    updateTrailSparkles(false);
    return;
  }

  if (!gameState.gameStarted) {
    gameState.height = TUNNEL_WIDTH / 2 + Math.sin(Date.now() / 300) * 10;
    updateTrailSparkles(false);
    return;
  }

  gameState.fuel -= FUEL_DRAIN_RATE;

  if (gameState.fuel <= 0) {
    gameState.fuel = 0;
    setGameOver(true);
    updateTrailSparkles(false);
    return;
  }

  if (gameState.invincibleTimer > 0) {
    gameState.invincibleTimer--;
  }

  let currentScrollSpeed = BASE_SCROLL_SPEED;

  if (gameState.score >= 15) {
    const speedLevels = Math.floor(gameState.score / 15);
    const speedIncrease = speedLevels * 0.005;
    currentScrollSpeed = Math.min(BASE_SCROLL_SPEED + speedIncrease, MAX_SCROLL_SPEED);
  }

  gameState.velocity -= GRAVITY;
  gameState.height += gameState.velocity;
  gameState.distance += currentScrollSpeed;

  if (gameState.height < 5) {
    gameState.height = 5;
    gameState.velocity = Math.max(0, gameState.velocity);
    applyDamage();
  } else if (gameState.height > TUNNEL_WIDTH - 5) {
    gameState.height = TUNNEL_WIDTH - 5;
    gameState.velocity = Math.min(0, gameState.velocity);
    applyDamage();
  }

  if (gameState.gameOver) {
    updateTrailSparkles(false);
    return;
  }

  updateObstacles();

  if (gameState.gameOver) {
    updateTrailSparkles(false);
    return;
  }

  updatePickups();
  updateTrailSparkles(true);
}

function gameLoop() {
  update();
  draw(ctx, canvas);
  requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', resize);
resize();
setupInput();
resetGame();
requestAnimationFrame(gameLoop);
