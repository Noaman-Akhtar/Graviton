import { gameState, resetGameState } from './state.js';
import {
  TUNNEL_WIDTH,
  BASE_SCROLL_SPEED, MAX_SCROLL_SPEED,
  SPEED_INCREASE_INTERVAL, SPEED_INCREASE_AMOUNT,
  INITIAL_OBSTACLE_COUNT, OBSTACLE_SPAWN_START, OBSTACLE_SPAWN_SPACING,
  SCORE_PER_FRAME
} from './config.js';
import { setupInput, setResetGameFn } from './input.js';
import { updatePlayer, drawPlayer, resetPlayerTrail } from './player.js';
import { addObstacle, updateObstacles, checkObstacleCollisions, drawObstacles } from './obstacles.js';
import { trySpawnPickup, updatePickups, checkPickupCollisions, drawPickups } from './pickups.js';
import { updateParticles, drawParticles } from './particles.js';
import { drawBackground, drawStarfield, drawTunnel, drawVignette } from './renderer.js';
import { drawHUD, drawStartScreen, drawGameOverScreen } from './ui.js';

// Canvas setup
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Reset & initialize a new game
export function resetGame() {
  resetGameState();
  resetPlayerTrail();

  for (let i = 0; i < INITIAL_OBSTACLE_COUNT; i++) {
    addObstacle(OBSTACLE_SPAWN_START + i * OBSTACLE_SPAWN_SPACING);
  }
}

// Calculate dynamic scroll speed — gets faster as score climbs
function getCurrentSpeed() {
  let speed = BASE_SCROLL_SPEED;
  const scoreThousands = Math.floor(gameState.score / 1000);
  if (scoreThousands > 0) {
    speed += scoreThousands * SPEED_INCREASE_AMOUNT;
    speed = Math.min(speed, MAX_SCROLL_SPEED);
  }
  return speed;
}

// Distance-based scoring — ticks up fast like Subway Surfers
function updateScore(speed) {
  gameState.rawDistance += speed;
  const newScore = Math.floor(gameState.rawDistance * SCORE_PER_FRAME * gameState.comboMultiplier);
  gameState.score = newScore;

  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('spiralFlappyHighScore', gameState.highScore);
  }
}

// Wall collision check
function checkWallCollision() {
  if (gameState.height < 5 || gameState.height > TUNNEL_WIDTH - 5) {
    if (gameState.invincibleTimer <= 0 && gameState.shieldTimer <= 0) {
      gameState.health--;
      gameState.combo = 0;
      gameState.comboMultiplier = 1;
      gameState.invincibleTimer = 60;

      if (gameState.height < 5) {
        gameState.height = 10;
        gameState.velocity = 2;
      } else {
        gameState.height = TUNNEL_WIDTH - 10;
        gameState.velocity = -2;
      }

      if (gameState.health <= 0) {
        gameState.health = 0;
        gameState.gameOver = true;
      }
    } else {
      if (gameState.height < 5) {
        gameState.height = 10;
        gameState.velocity = 2;
      } else {
        gameState.height = TUNNEL_WIDTH - 10;
        gameState.velocity = -2;
      }
    }
  }
}

// === GAME LOOP ===
function update() {
  if (gameState.gameOver) return;
  if (!gameState.gameStarted) {
    updatePlayer(0);
    return;
  }

  const speed = getCurrentSpeed();
  updatePlayer(speed);
  checkWallCollision();
  updateObstacles();
  checkObstacleCollisions();
  updatePickups();
  checkPickupCollisions();
  updateParticles();
  updateScore(speed);

  if (Math.random() < 0.02) {
    trySpawnPickup();
  }
}

function draw() {
  drawBackground(ctx, canvas);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.8, 0.8);

  drawStarfield(ctx);
  drawTunnel(ctx);
  drawObstacles(ctx);
  drawPickups(ctx);
  drawPlayer(ctx);
  drawParticles(ctx);

  ctx.restore();

  drawVignette(ctx, canvas);

  if (gameState.gameOver) {
    drawGameOverScreen(ctx, canvas);
  } else if (!gameState.gameStarted) {
    drawStartScreen(ctx, canvas);
  } else {
    drawHUD(ctx, canvas);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// === INIT ===
setResetGameFn(resetGame);
setupInput();
resetGame();
requestAnimationFrame(gameLoop);
