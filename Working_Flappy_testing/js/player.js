// PLAYER
import { gameState } from './state.js';
import {
  FLAP_STRENGTH, GRAVITY, PLAYER_RADIUS, PLAYER_AURA_RADIUS,
  START_RADIUS, DAMAGE_FLASH_SPEED, TUNNEL_WIDTH
} from './config.js';
import { spawnTrail } from './particles.js';

// Trail history for afterimage effect
const TRAIL_LENGTH = 8;
let trailHistory = [];

export function playerFlap() {
  gameState.velocity = FLAP_STRENGTH;
}

export function updatePlayer(currentScrollSpeed) {
  // Physics
  gameState.velocity -= GRAVITY;
  gameState.height += gameState.velocity;
  gameState.distance += currentScrollSpeed;

  // Hover animation before game starts
  if (!gameState.gameStarted) {
    gameState.height = TUNNEL_WIDTH / 2 + Math.sin(Date.now() / 300) * 10;
    return;
  }

  // Update invincibility timer
  if (gameState.invincibleTimer > 0) {
    gameState.invincibleTimer--;
  }

  // Update shield timer
  if (gameState.shieldTimer > 0) {
    gameState.shieldTimer--;
  }

  // Store trail position
  const playerScreenR = START_RADIUS + gameState.height;
  const px = playerScreenR * Math.cos(gameState.distance);
  const py = playerScreenR * Math.sin(gameState.distance);

  trailHistory.unshift({ x: px, y: py });
  if (trailHistory.length > TRAIL_LENGTH) {
    trailHistory.pop();
  }

  // Spawn particle trail
  if (gameState.gameStarted) {
    const trailColor = gameState.shieldTimer > 0
      ? 'rgba(80, 180, 255, 0.6)'
      : 'rgba(255, 255, 255, 0.4)';
    spawnTrail(px, py, trailColor);
  }
}

export function drawPlayer(ctx) {
  const playerScreenR = START_RADIUS + gameState.height;
  const px = playerScreenR * Math.cos(gameState.distance);
  const py = playerScreenR * Math.sin(gameState.distance);

  // Draw afterimage trail
  for (let i = trailHistory.length - 1; i >= 1; i--) {
    const t = trailHistory[i];
    const alpha = (1 - i / trailHistory.length) * 0.25;
    const size = PLAYER_RADIUS * (1 - i / trailHistory.length) * 0.8;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Determine player color based on state
  let playerColor = '#fff';
  let auraColor = 'rgba(255, 255, 255, 0.2)';
  let glowColor = 'rgba(255, 255, 255, 0.5)';

  if (gameState.gameOver) {
    playerColor = '#ff4444';
    auraColor = 'rgba(255, 60, 60, 0.3)';
    glowColor = 'rgba(255, 60, 60, 0.5)';
  } else if (gameState.shieldTimer > 0) {
    playerColor = '#50b4ff';
    auraColor = 'rgba(80, 180, 255, 0.3)';
    glowColor = 'rgba(80, 180, 255, 0.6)';
  } else if (gameState.invincibleTimer > 0) {
    // Flashing effect during invincibility
    const flash = Math.floor(gameState.invincibleTimer / DAMAGE_FLASH_SPEED) % 2;
    if (flash === 0) {
      playerColor = '#ff8888';
      auraColor = 'rgba(255, 100, 100, 0.3)';
    }
  }

  // Outer aura (pulsing)
  const auraScale = 1 + Math.sin(Date.now() / 200) * 0.15;
  ctx.fillStyle = auraColor;
  ctx.beginPath();
  ctx.arc(px, py, PLAYER_AURA_RADIUS * auraScale, 0, Math.PI * 2);
  ctx.fill();

  // Glow
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = glowColor;

  // Main body
  ctx.fillStyle = playerColor;
  ctx.beginPath();
  ctx.arc(px, py, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // Inner highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(px - 2, py - 2, PLAYER_RADIUS * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Shield ring
  if (gameState.shieldTimer > 0) {
    ctx.save();
    ctx.strokeStyle = 'rgba(80, 180, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#50b4ff';
    const shieldRadius = PLAYER_AURA_RADIUS + 4 + Math.sin(Date.now() / 150) * 2;
    ctx.beginPath();
    ctx.arc(px, py, shieldRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export function resetPlayerTrail() {
  trailHistory = [];
}
