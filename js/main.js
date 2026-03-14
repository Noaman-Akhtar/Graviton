import {
  FLAPS_PER_SPEED_LEVEL,
  FLAP_SCROLL_SPEED_STEP,
  FUEL_DRAIN_RATE,
  GAME_OVER_FALL_ACCELERATION,
  GRAVITY,
  MAX_SCROLL_SPEED,
  SLOW_BUFF_AUTOPILOT_BASE_STEP,
  SLOW_BUFF_AUTOPILOT_MAX_STEP,
  SLOW_BUFF_GRAVITY_MULTIPLIER,
  SLOW_BUFF_SPEED_MULTIPLIER,
  START_SCROLL_SPEED,
  TUNNEL_WIDTH
} from './config.js';
import { playDeathSound } from './audio.js';
import { resetGame, setupInput, syncUiOverlays } from './input.js';
import { getSlowBuffTargetHeight, updateObstacles } from './obstacles.js';
import { createBurst, updateTrailSparkles } from './particles.js';
import { updatePickups } from './pickups.js';
import { draw } from './renderer.js';
import { applyDamage, gameState, setGameOver } from './state.js';
import { getPlayerScreenPosition } from './utils.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function update() {
  if (gameState.gameOver) {
    if (gameState.deathFallActive) {
      gameState.deathFallVelocity += GAME_OVER_FALL_ACCELERATION;
      gameState.deathFallRadius = Math.max(0, gameState.deathFallRadius - gameState.deathFallVelocity);

      if (gameState.deathFallRadius <= 0) {
        gameState.deathFallActive = false;
      }
    }

    updateTrailSparkles(false);
    return;
  }

  if (!gameState.gameStarted) {
    gameState.height = TUNNEL_WIDTH / 2 + Math.sin(Date.now() / 300) * 10;
    updateTrailSparkles(false);
    return;
  }

  if (gameState.slowBuffTimer <= 0) {
    gameState.fuel -= FUEL_DRAIN_RATE;
  }

  if (gameState.fuel <= 0) {
    gameState.fuel = 0;
    const pos = getPlayerScreenPosition();
    playDeathSound();
    createBurst(pos.x, pos.y, 15, 50, 4);
    setGameOver(true);
    updateTrailSparkles(false);
    return;
  }

  if (gameState.invincibleTimer > 0) {
    gameState.invincibleTimer--;
  }

  const speedLevels = Math.floor(gameState.flapCount / FLAPS_PER_SPEED_LEVEL);
  const speedIncrease = speedLevels * FLAP_SCROLL_SPEED_STEP;
  let currentScrollSpeed = Math.min(START_SCROLL_SPEED + speedIncrease, MAX_SCROLL_SPEED);
  let currentGravity = GRAVITY;
  let autoPilotActive = false;

  if (gameState.slowBuffTimer > 0) {
    gameState.slowBuffTimer--;
    currentScrollSpeed *= SLOW_BUFF_SPEED_MULTIPLIER;
    currentGravity *= SLOW_BUFF_GRAVITY_MULTIPLIER;
    autoPilotActive = true;
  }

  if (autoPilotActive) {
    const targetHeight = getSlowBuffTargetHeight();
    const heightError = targetHeight - gameState.height;
    const steerStep = Math.min(
      SLOW_BUFF_AUTOPILOT_MAX_STEP,
      SLOW_BUFF_AUTOPILOT_BASE_STEP + Math.abs(heightError) * 0.16
    );
    const steerAmount = Math.sign(heightError) * Math.min(Math.abs(heightError), steerStep);
    gameState.velocity = steerAmount;
    gameState.height += steerAmount;
  } else {
    gameState.velocity -= currentGravity;
    gameState.height += gameState.velocity;
  }

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
  syncUiOverlays();
  draw(ctx, canvas);
  requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', resize);
resize();
setupInput();
resetGame();
requestAnimationFrame(gameLoop);
