import {
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
  TUNNEL_WIDTH
} from './config.js';
import { gameState } from './state.js';
import { getSpiralRadius } from './utils.js';

function calculateFuelPickupPosition(angle) {
  const normalized = (Math.sin(angle * 1.7) + Math.cos(angle * 0.9) + 2) / 4;
  const padding = 24;
  return padding + normalized * (TUNNEL_WIDTH - padding * 2);
}

function collectHealthPickup(index) {
  gameState.health = Math.min(gameState.maxHealth, gameState.health + HEALTH_PICKUP_VALUE);
  gameState.healthPickups.splice(index, 1);
}

function collectFuelPickup(index) {
  gameState.fuel = Math.min(gameState.maxFuel, gameState.fuel + FUEL_PICKUP_VALUE);
  gameState.fuelPickups.splice(index, 1);
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

  gameState.healthPickups.push({
    angle: gameState.distance + Math.PI + Math.random() * Math.PI * 2,
    pos: 24 + Math.random() * (TUNNEL_WIDTH - 48)
  });
}

function updateFuelPickups() {
  while (gameState.nextFuelPickupAngle < gameState.distance + OBSTACLE_LOOKAHEAD) {
    const angle = gameState.nextFuelPickupAngle;

    gameState.fuelPickups.push({
      angle,
      pos: calculateFuelPickupPosition(angle)
    });

    gameState.nextFuelPickupAngle += FUEL_PICKUP_INTERVAL;
  }

  for (let i = gameState.fuelPickups.length - 1; i >= 0; i--) {
    const pickup = gameState.fuelPickups[i];

    if (pickup.angle < gameState.distance - Math.PI) {
      gameState.fuelPickups.splice(i, 1);
      continue;
    }

    const distanceToPickup = pickup.angle - gameState.distance;

    if (
      Math.abs(distanceToPickup) < PICKUP_COLLISION_WINDOW &&
      Math.abs(gameState.height - pickup.pos) < PLAYER_RADIUS + FUEL_PICKUP_RADIUS
    ) {
      collectFuelPickup(i);
    }
  }
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
}

export function drawPickups(ctx, renderOffsetR, startTheta, endTheta) {
  drawPickupSet(ctx, gameState.healthPickups, drawHealthPickup, renderOffsetR, startTheta, endTheta);
  drawPickupSet(ctx, gameState.fuelPickups, drawFuelPickup, renderOffsetR, startTheta, endTheta);
}
