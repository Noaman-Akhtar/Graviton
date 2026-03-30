import {
  EMERGENCY_FUEL_COLLISION_BONUS,
  EMERGENCY_FUEL_LOOKAHEAD,
  EMERGENCY_FUEL_MIN_RESERVE,
  FUEL_PICKUP_INTERVAL,
  FUEL_PICKUP_RADIUS,
  FUEL_PICKUP_VALUE,
  HEALTH_PICKUP_MAX_ONSCREEN,
  HEALTH_PICKUP_RADIUS,
  HEALTH_PICKUP_SPAWN_CHANCE,
  HEALTH_PICKUP_VALUE,
  OBSTACLE_LOOKAHEAD,
  PICKUP_BOB_AMOUNT,
  PICKUP_BOB_SPEED,
  PICKUP_COLLISION_WINDOW,
  PLAYER_RADIUS,
  SLOW_BUFF_DURATION,
  SLOW_BUFF_MAX_ONSCREEN,
  SLOW_BUFF_RADIUS,
  SLOW_BUFF_SPAWN_CHANCE,
  TUNNEL_WIDTH
} from './config.js';
import { gameState } from './state.js';
import { getPlayerScreenPosition, getSpiralRadius } from './utils.js';
import { playDiamondSound, playFuelSound, playHealthSound } from './audio.js';
import { createBurst } from './particles.js';

function calculateFuelPickupPosition(angle, emergency = false) {
  let bestObstacle = null;
  let bestDistance = Infinity;

  for (const obstacle of gameState.obstacles) {
    const angleDistance = Math.abs(obstacle.angle - angle);

    if (angleDistance < bestDistance && angleDistance < 0.45) {
      bestDistance = angleDistance;
      bestObstacle = obstacle;
    }
  }

  if (bestObstacle) {
    const innerPadding = emergency
      ? Math.min(20, Math.max(10, bestObstacle.gapSize * 0.14))
      : Math.min(26, Math.max(14, bestObstacle.gapSize * 0.2));
    const minPos = bestObstacle.gapPos + innerPadding;
    const maxPos = bestObstacle.gapPos + bestObstacle.gapSize - innerPadding;
    const centerPos = (minPos + maxPos) * 0.5;

    if (emergency) {
      return centerPos;
    }

    const offsetSpan = Math.max(10, (maxPos - minPos) * 0.32);
    const offsetDirection = Math.sin(angle * 2.1) > 0 ? 1 : -1;
    const targetPos = centerPos + offsetDirection * offsetSpan;
    return Math.max(minPos, Math.min(maxPos, targetPos));
  }

  if (emergency) {
    return TUNNEL_WIDTH / 2;
  }

  const centerOffset = Math.sin(angle * 1.9) * 32;
  return Math.max(28, Math.min(TUNNEL_WIDTH - 28, TUNNEL_WIDTH / 2 + centerOffset));
}

function collectHealthPickup(index) {
  gameState.health = Math.min(gameState.maxHealth, gameState.health + HEALTH_PICKUP_VALUE);
  gameState.healthPickups.splice(index, 1);
  const pos = getPlayerScreenPosition();
  createBurst(pos.x, pos.y, 330, 20, 1.5);
  playHealthSound();
}

function collectFuelPickup(index) {
  gameState.fuel = Math.min(gameState.maxFuel, gameState.fuel + FUEL_PICKUP_VALUE);
  gameState.fuelPickups.splice(index, 1);
  const pos = getPlayerScreenPosition();
  createBurst(pos.x, pos.y, 120, 20, 1.5);
  playFuelSound();
}

function hasPendingEmergencyFuel() {
  return gameState.fuelPickups.some((pickup) => pickup.emergency && pickup.angle >= gameState.distance);
}

function spawnEmergencyFuelPickup(missedPickup) {
  if (hasPendingEmergencyFuel()) {
    return;
  }

  const emergencyAngle = Math.max(
    gameState.distance + EMERGENCY_FUEL_LOOKAHEAD,
    missedPickup.angle + EMERGENCY_FUEL_LOOKAHEAD * 0.55
  );

  gameState.fuel = Math.max(gameState.fuel, EMERGENCY_FUEL_MIN_RESERVE);
  gameState.fuelPickups.push({
    angle: emergencyAngle,
    pos: calculateFuelPickupPosition(emergencyAngle, true),
    emergency: true
  });
}

function collectSlowBuff(index) {
  gameState.slowBuffTimer = SLOW_BUFF_DURATION;
  gameState.slowBuffPickups.splice(index, 1);
  const pos = getPlayerScreenPosition();
  createBurst(pos.x, pos.y, 200, 30, 2);
  playDiamondSound();
}

function updateHealthPickups() {
  for (let i = gameState.healthPickups.length - 1; i >= 0; i--) {
    const pickup = gameState.healthPickups[i];

    if (pickup.angle < gameState.distance - Math.PI) {
      gameState.healthPickups.splice(i, 1);
      continue;
    }

    const distanceToPickup = pickup.angle - gameState.distance;

    if (
      Math.abs(distanceToPickup) < PICKUP_COLLISION_WINDOW &&
      Math.abs(gameState.height - pickup.pos) < PLAYER_RADIUS + HEALTH_PICKUP_RADIUS
    ) {
      collectHealthPickup(i);
    }
  }

  if (gameState.health >= gameState.maxHealth) {
    return;
  }

  if (gameState.healthPickups.length >= HEALTH_PICKUP_MAX_ONSCREEN) {
    return;
  }

  if (Math.random() >= HEALTH_PICKUP_SPAWN_CHANCE) {
    return;
  }

  const spawnAngle = gameState.distance + Math.PI + Math.random() * Math.PI * 2;
  gameState.healthPickups.push({
    angle: spawnAngle,
    pos: calculateFuelPickupPosition(spawnAngle)
  });
}

function updateFuelPickups() {
  while (gameState.nextFuelPickupAngle < gameState.distance + OBSTACLE_LOOKAHEAD) {
    const angle = gameState.nextFuelPickupAngle;

    gameState.fuelPickups.push({
      angle,
      pos: calculateFuelPickupPosition(angle),
      emergency: false
    });

    gameState.nextFuelPickupAngle += FUEL_PICKUP_INTERVAL;
  }

  for (let i = gameState.fuelPickups.length - 1; i >= 0; i--) {
    const pickup = gameState.fuelPickups[i];
    const distanceToPickup = pickup.angle - gameState.distance;
    const collisionWindow = pickup.emergency ? PICKUP_COLLISION_WINDOW : PICKUP_COLLISION_WINDOW * 0.7;
    const heightAllowance = pickup.emergency
      ? PLAYER_RADIUS + FUEL_PICKUP_RADIUS + EMERGENCY_FUEL_COLLISION_BONUS
      : PLAYER_RADIUS + FUEL_PICKUP_RADIUS - 2;

    if (
      Math.abs(distanceToPickup) < collisionWindow &&
      Math.abs(gameState.height - pickup.pos) < heightAllowance
    ) {
      collectFuelPickup(i);
      continue;
    }

    if (distanceToPickup < -collisionWindow * 1.15) {
      if (!pickup.emergency) {
        spawnEmergencyFuelPickup(pickup);
      }

      gameState.fuelPickups.splice(i, 1);
    }
  }
}

function updateSlowBuffPickups() {
  for (let i = gameState.slowBuffPickups.length - 1; i >= 0; i--) {
    const pickup = gameState.slowBuffPickups[i];

    if (pickup.angle < gameState.distance - Math.PI) {
      gameState.slowBuffPickups.splice(i, 1);
      continue;
    }

    const distanceToPickup = pickup.angle - gameState.distance;

    if (
      Math.abs(distanceToPickup) < PICKUP_COLLISION_WINDOW &&
      Math.abs(gameState.height - pickup.pos) < PLAYER_RADIUS + SLOW_BUFF_RADIUS
    ) {
      collectSlowBuff(i);
    }
  }

  if (gameState.slowBuffTimer > 0) {
    return;
  }

  if (gameState.slowBuffPickups.length >= SLOW_BUFF_MAX_ONSCREEN) {
    return;
  }

  if (Math.random() >= SLOW_BUFF_SPAWN_CHANCE) {
    return;
  }

  gameState.slowBuffPickups.push({
    angle: gameState.distance + Math.PI + Math.random() * Math.PI * 2,
    pos: 24 + Math.random() * (TUNNEL_WIDTH - 48)
  });
}

function drawHeartIcon(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(x - size, y - size * 0.15, x - size, y - size * 0.85, x, y - size * 0.45);
  ctx.bezierCurveTo(x + size, y - size * 0.85, x + size, y - size * 0.15, x, y + size * 0.35);
  ctx.closePath();
  ctx.fill();
}

function drawHealthPickup(ctx, x, y) {
  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(255, 176, 204, 0.95)';

  ctx.fillStyle = 'rgba(255, 176, 204, 0.25)';
  ctx.beginPath();
  ctx.arc(x, y, HEALTH_PICKUP_RADIUS + 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 193, 214, 0.95)';
  ctx.beginPath();
  ctx.arc(x, y, HEALTH_PICKUP_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  drawHeartIcon(ctx, x, y + 1, 4.8);
  ctx.restore();
}

function drawFuelPickup(ctx, x, y) {
  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(120, 255, 150, 0.95)';

  ctx.fillStyle = 'rgba(80, 255, 120, 0.22)';
  ctx.beginPath();
  ctx.arc(x, y, FUEL_PICKUP_RADIUS + 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(60, 235, 100, 0.95)';
  ctx.beginPath();
  ctx.arc(x, y, FUEL_PICKUP_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(x - 4, y - 4, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 4.5, y);
  ctx.lineTo(x + 4.5, y);
  ctx.moveTo(x, y - 4.5);
  ctx.lineTo(x, y + 4.5);
  ctx.stroke();
  ctx.restore();
}

function drawSlowBuff(ctx, x, y) {
  ctx.save();
  ctx.shadowBlur = 20;
  ctx.shadowColor = 'rgba(50, 200, 255, 0.95)';

  ctx.fillStyle = 'rgba(50, 200, 255, 0.25)';
  ctx.beginPath();
  ctx.arc(x, y, SLOW_BUFF_RADIUS + 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(50, 200, 255, 0.95)';
  ctx.beginPath();
  ctx.moveTo(x, y - SLOW_BUFF_RADIUS);
  ctx.lineTo(x + SLOW_BUFF_RADIUS, y);
  ctx.lineTo(x, y + SLOW_BUFF_RADIUS);
  ctx.lineTo(x - SLOW_BUFF_RADIUS, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPickupSet(ctx, pickups, drawIcon, renderOffsetR, startTheta, endTheta) {
  for (const pickup of pickups) {
    if (pickup.angle < startTheta || pickup.angle > endTheta) {
      continue;
    }

    const rInner = getSpiralRadius(pickup.angle) - renderOffsetR;
    const bob = Math.sin(Date.now() * PICKUP_BOB_SPEED + pickup.angle * 3) * PICKUP_BOB_AMOUNT;
    const r = rInner + pickup.pos + bob;
    const x = r * Math.cos(pickup.angle);
    const y = r * Math.sin(pickup.angle);

    drawIcon(ctx, x, y);
  }
}

export function updatePickups() {
  updateHealthPickups();
  updateFuelPickups();
  updateSlowBuffPickups();
}

export function drawPickups(ctx, renderOffsetR, startTheta, endTheta) {
  drawPickupSet(ctx, gameState.healthPickups, drawHealthPickup, renderOffsetR, startTheta, endTheta);
  drawPickupSet(ctx, gameState.fuelPickups, drawFuelPickup, renderOffsetR, startTheta, endTheta);
  drawPickupSet(ctx, gameState.slowBuffPickups, drawSlowBuff, renderOffsetR, startTheta, endTheta);
}
