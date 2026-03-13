// PICKUPS
import { gameState } from './state.js';
import {
  TUNNEL_WIDTH, START_RADIUS, SPIRAL_GROWTH,
  PICKUP_TYPES, PICKUP_SPAWN_CHANCE, PICKUP_MAX_ONSCREEN,
  PICKUP_RADIUS, PICKUP_BOB_SPEED, PICKUP_BOB_AMPLITUDE,
  SHIELD_DURATION, PLAYER_RADIUS, MAX_HEALTH
} from './config.js';
import { getSpiralRadius, getRenderOffsetR } from './renderer.js';
import { spawnCollectEffect } from './particles.js';
import { showPickupNotification } from './ui.js';

export function trySpawnPickup() {
  if (gameState.pickups.length >= PICKUP_MAX_ONSCREEN) return;
  if (Math.random() > PICKUP_SPAWN_CHANCE) return;

  // Decide type: 70% heal, 30% shield
  const type = Math.random() < 0.7 ? PICKUP_TYPES.HEAL : PICKUP_TYPES.SHIELD;

  // Don't spawn heal if at full health
  if (type === PICKUP_TYPES.HEAL && gameState.health >= gameState.maxHealth) {
    // Try shield instead
    if (gameState.shieldTimer > 0) return; // already shielded
  }

  // Place it ahead of player
  const angle = gameState.distance + Math.PI + Math.random() * Math.PI * 2;
  const pos = 20 + Math.random() * (TUNNEL_WIDTH - 40); // position inside tunnel

  gameState.pickups.push({
    angle,
    pos,
    type,
    collected: false,
    spawnTime: Date.now()
  });
}

export function updatePickups() {
  // Remove pickups that are behind the player
  for (let i = gameState.pickups.length - 1; i >= 0; i--) {
    const pickup = gameState.pickups[i];

    if (pickup.angle < gameState.distance - Math.PI) {
      gameState.pickups.splice(i, 1);
      continue;
    }

    if (pickup.collected) {
      gameState.pickups.splice(i, 1);
      continue;
    }
  }
}

export function checkPickupCollisions() {
  const renderOffsetR = getRenderOffsetR();

  for (const pickup of gameState.pickups) {
    if (pickup.collected) continue;

    const distToPickup = pickup.angle - gameState.distance;

    // Broader collision range for pickups (easier to collect)
    if (Math.abs(distToPickup) < 0.12) {
      const playerPos = gameState.height;
      const pickupPos = pickup.pos;

      if (Math.abs(playerPos - pickupPos) < PLAYER_RADIUS + PICKUP_RADIUS) {
        collectPickup(pickup);
      }
    }
  }
}

function collectPickup(pickup) {
  pickup.collected = true;

  // Get screen coordinates for particle effect
  const renderOffsetR = getRenderOffsetR();
  const r = getSpiralRadius(pickup.angle) - renderOffsetR + pickup.pos;
  const px = r * Math.cos(pickup.angle);
  const py = r * Math.sin(pickup.angle);

  spawnCollectEffect(px, py, pickup.type);

  if (pickup.type === PICKUP_TYPES.HEAL) {
    gameState.health = Math.min(gameState.health + 1, gameState.maxHealth);
    showPickupNotification('+1 HEALTH', '#ff4466');
  } else if (pickup.type === PICKUP_TYPES.SHIELD) {
    gameState.shieldTimer = SHIELD_DURATION;
    showPickupNotification('SHIELD ACTIVE', '#50b4ff');
  }
}

export function drawPickups(ctx) {
  const renderOffsetR = getRenderOffsetR();
  const startTheta = gameState.distance - Math.PI;
  const endTheta = gameState.distance + 4 * Math.PI;

  for (const pickup of gameState.pickups) {
    if (pickup.collected) continue;
    if (pickup.angle < startTheta || pickup.angle > endTheta) continue;

    const rInner = getSpiralRadius(pickup.angle) - renderOffsetR;

    // Apply bobbing animation
    const bob = Math.sin(Date.now() * PICKUP_BOB_SPEED + pickup.angle) * PICKUP_BOB_AMPLITUDE;
    const r = rInner + pickup.pos + bob;

    const x = r * Math.cos(pickup.angle);
    const y = r * Math.sin(pickup.angle);

    ctx.save();

    if (pickup.type === PICKUP_TYPES.HEAL) {
      // Glowing heart shape
      ctx.shadowBlur = 18;
      ctx.shadowColor = '#ff4466';

      // Outer glow
      ctx.fillStyle = 'rgba(255, 68, 102, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, PICKUP_RADIUS + 6, 0, Math.PI * 2);
      ctx.fill();

      // Heart shape
      const s = PICKUP_RADIUS * 0.9;
      ctx.fillStyle = '#ff4466';
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.4);
      ctx.bezierCurveTo(x - s, y - s * 0.2, x - s, y - s * 0.9, x, y - s * 0.5);
      ctx.bezierCurveTo(x + s, y - s * 0.9, x + s, y - s * 0.2, x, y + s * 0.4);
      ctx.closePath();
      ctx.fill();

    } else if (pickup.type === PICKUP_TYPES.SHIELD) {
      // Blue glowing orb
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#50b4ff';

      // Outer glow
      ctx.fillStyle = 'rgba(80, 180, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, PICKUP_RADIUS + 6, 0, Math.PI * 2);
      ctx.fill();

      // Main orb
      ctx.fillStyle = '#50b4ff';
      ctx.beginPath();
      ctx.arc(x, y, PICKUP_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Shield icon (diamond shape)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 5);
      ctx.lineTo(x + 4, y);
      ctx.lineTo(x, y + 5);
      ctx.lineTo(x - 4, y);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
  }
}
