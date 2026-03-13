import { gameState } from './state.js';
import {
  TUNNEL_WIDTH, START_RADIUS, SPIRAL_GROWTH,
  OBSTACLE_TYPES, STARTING_GAP, MINIMUM_GAP,
  OBSTACLE_SPAWN_SPACING, OBSTACLE_LOOKAHEAD, OBSTACLE_CLEANUP_BEHIND,
  PULSE_SPEED, PULSE_AMPLITUDE,
  MOVING_SPEED,
  DOUBLE_GATE_SPACING,
  INVINCIBLE_DURATION, PLAYER_RADIUS,
  COMBO_MULTIPLIER_STEP, MAX_COMBO_MULTIPLIER
} from './config.js';
import { spawnExplosion, spawnScorePop } from './particles.js';
import { getSpiralRadius, getRenderOffsetR } from './renderer.js';

// Determine what obstacle type to spawn based on score
function pickObstacleType() {
  const passed = gameState.obstaclesPassed;

  if (passed < 8) return OBSTACLE_TYPES.GATE;

  const weights = { gate: 40, pulse: 0, moving: 0, double: 0 };

  if (passed >= 8)  weights.pulse = 25;
  if (passed >= 18) weights.moving = 25;
  if (passed >= 30) weights.double = 15;

  weights.gate = Math.max(20, 40 - Math.floor(passed / 10) * 5);

  const total = weights.gate + weights.pulse + weights.moving + weights.double;
  let roll = Math.random() * total;

  if (roll < weights.gate) return OBSTACLE_TYPES.GATE;
  roll -= weights.gate;
  if (roll < weights.pulse) return OBSTACLE_TYPES.PULSE;
  roll -= weights.pulse;
  if (roll < weights.moving) return OBSTACLE_TYPES.MOVING;
  return OBSTACLE_TYPES.DOUBLE;
}

// Calculate gap size based on current score
function calculateGapSize() {
  let gapSize = STARTING_GAP;
  const passed = gameState.obstaclesPassed;

  if (passed < 30) {
    if (passed >= 5) {
      const difficultyLevel = Math.floor(passed / 5);
      gapSize = STARTING_GAP - (difficultyLevel * 5);
    }
  } else if (passed < 70) {
    if (passed < 40) gapSize = 100;
    else if (passed < 55) gapSize = 90;
    else gapSize = 80;
  } else {
    const levelsAfter70 = Math.floor((passed - 70) / 15);
    gapSize = 80 - levelsAfter70;
    gapSize = Math.max(gapSize, MINIMUM_GAP);
  }

  return gapSize;
}

export function addObstacle(angle) {
  const type = pickObstacleType();
  const gapSize = calculateGapSize();

  const baseObs = {
    angle,
    gapSize,
    baseGapSize: gapSize,
    gapPos: Math.random() * (TUNNEL_WIDTH - gapSize - 10) + 5,
    baseGapPos: 0,
    width: 0.1,
    passed: false,
    hit: false,
    type,
    color: getObstacleColor(type),
    phase: Math.random() * Math.PI * 2 // random starting phase for animations
  };

  baseObs.baseGapPos = baseObs.gapPos;

  if (type === OBSTACLE_TYPES.DOUBLE) {
    // Spawn two gates close together
    gameState.obstacles.push(baseObs);
    gameState.obstacles.push({
      ...baseObs,
      angle: angle + DOUBLE_GATE_SPACING,
      gapPos: Math.random() * (TUNNEL_WIDTH - gapSize - 10) + 5,
      color: getObstacleColor(type),
      isSecondGate: true // marker for the paired gate
    });
  } else {
    gameState.obstacles.push(baseObs);
  }
}

function getObstacleColor(type) {
  switch (type) {
    case OBSTACLE_TYPES.GATE:
      return `hsl(${Math.random() * 360}, 100%, 60%)`;
    case OBSTACLE_TYPES.PULSE:
      return `hsl(${280 + Math.random() * 40}, 100%, 65%)`; // purple-pink
    case OBSTACLE_TYPES.MOVING:
      return `hsl(${30 + Math.random() * 30}, 100%, 55%)`;  // orange-gold
    case OBSTACLE_TYPES.DOUBLE:
      return `hsl(${0 + Math.random() * 20}, 100%, 55%)`;   // red
    default:
      return '#fff';
  }
}

export function updateObstacles() {
  // Clean up old obstacles behind the player
  while (
    gameState.obstacles.length > 0 &&
    gameState.obstacles[0].angle < gameState.distance - OBSTACLE_CLEANUP_BEHIND
  ) {
    gameState.obstacles.shift();
  }

  // Spawn new obstacles ahead
  if (gameState.obstacles.length > 0) {
    const lastObs = gameState.obstacles[gameState.obstacles.length - 1];
    if (lastObs.angle < gameState.distance + OBSTACLE_LOOKAHEAD) {
      addObstacle(lastObs.angle + OBSTACLE_SPAWN_SPACING + Math.random() * 0.3);
    }
  }

  // Animate certain obstacle types
  for (const obs of gameState.obstacles) {
    if (obs.type === OBSTACLE_TYPES.PULSE) {
      // Oscillate gap size
      const oscillation = Math.sin(Date.now() * PULSE_SPEED + obs.phase);
      obs.gapSize = obs.baseGapSize + oscillation * PULSE_AMPLITUDE;
      obs.gapSize = Math.max(obs.gapSize, 40); // minimum safety
    }

    if (obs.type === OBSTACLE_TYPES.MOVING) {
      // Slide gap position up and down
      const slide = Math.sin(Date.now() * 0.003 + obs.phase);
      const margin = 15;
      const maxPos = TUNNEL_WIDTH - obs.gapSize - margin;
      obs.gapPos = margin + ((slide + 1) / 2) * (maxPos - margin);
    }
  }
}

export function checkObstacleCollisions() {
  const renderOffsetR = getRenderOffsetR();

  for (const obs of gameState.obstacles) {
    const distToObs = obs.angle - gameState.distance;

    if (distToObs < 0.05 && distToObs > -0.05) {
      const pBottom = gameState.height - PLAYER_RADIUS;
      const pTop = gameState.height + PLAYER_RADIUS;
      const gBottom = obs.gapPos;
      const gTop = obs.gapPos + obs.gapSize;

      if (pBottom < gBottom || pTop > gTop) {
        // Hit obstacle!
        if (!obs.hit) {
          obs.hit = true;
          dealDamage(obs);
        }
      } else if (!obs.passed) {
        obs.passed = true;
        scorePoint(obs);
      }
    }
  }
}

function dealDamage(obs) {
  // Skip if invincible or shielded
  if (gameState.invincibleTimer > 0) return;
  if (gameState.shieldTimer > 0) {
    gameState.shieldTimer = 0; // shield breaks
    gameState.invincibleTimer = INVINCIBLE_DURATION / 2;
    // Explosion effect at player position
    const r = START_RADIUS + gameState.height;
    const px = r * Math.cos(gameState.distance);
    const py = r * Math.sin(gameState.distance);
    spawnExplosion(px, py);
    return;
  }

  gameState.health--;
  gameState.combo = 0;
  gameState.comboMultiplier = 1;
  gameState.invincibleTimer = INVINCIBLE_DURATION;

  // Explosion effect
  const r = START_RADIUS + gameState.height;
  const px = r * Math.cos(gameState.distance);
  const py = r * Math.sin(gameState.distance);
  spawnExplosion(px, py);

  if (gameState.health <= 0) {
    gameState.health = 0;
    gameState.gameOver = true;
  }
}

function scorePoint(obs) {
  gameState.obstaclesPassed++;
  gameState.combo++;

  gameState.comboMultiplier = Math.min(
    MAX_COMBO_MULTIPLIER,
    1 + Math.floor(gameState.combo / COMBO_MULTIPLIER_STEP)
  );

  // Score pop particle showing combo (only when combo multiplier is active)
  if (gameState.comboMultiplier > 1) {
    const r = START_RADIUS + gameState.height;
    const px = r * Math.cos(gameState.distance);
    const py = r * Math.sin(gameState.distance);
    spawnScorePop(px, py - 20, `x${gameState.comboMultiplier}`, '#ffdd44');
  }
}

export function drawObstacles(ctx) {
  const renderOffsetR = getRenderOffsetR();
  const startTheta = gameState.distance - Math.PI;
  const endTheta = gameState.distance + 4 * Math.PI;

  for (const obs of gameState.obstacles) {
    if (obs.angle < startTheta || obs.angle > endTheta) continue;

    const rInner = getSpiralRadius(obs.angle) - renderOffsetR;
    const rOuter = rInner + TUNNEL_WIDTH;

    const gapStart = rInner + obs.gapPos;
    const gapEnd = gapStart + obs.gapSize;

    const barPadding = 1;

    // Glow effect based on type
    ctx.save();
    ctx.strokeStyle = obs.color;
    ctx.lineWidth = 20;
    ctx.lineCap = 'butt';

    if (obs.type === OBSTACLE_TYPES.PULSE) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() * PULSE_SPEED + obs.phase);
      ctx.shadowBlur = 10 + pulse * 15;
      ctx.shadowColor = obs.color;
      ctx.lineWidth = 16 + pulse * 8;
    } else if (obs.type === OBSTACLE_TYPES.MOVING) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = obs.color;
    } else if (obs.type === OBSTACLE_TYPES.DOUBLE) {
      ctx.lineWidth = 14;
      ctx.shadowBlur = 6;
      ctx.shadowColor = obs.color;
    } else {
      ctx.lineWidth = 20;
    }

    // Bottom bar (inner wall to gap start)
    ctx.beginPath();
    ctx.moveTo(
      (rInner + barPadding) * Math.cos(obs.angle),
      (rInner + barPadding) * Math.sin(obs.angle)
    );
    ctx.lineTo(
      (gapStart - barPadding) * Math.cos(obs.angle),
      (gapStart - barPadding) * Math.sin(obs.angle)
    );
    ctx.stroke();

    // Top bar (gap end to outer wall)
    ctx.beginPath();
    ctx.moveTo(
      (gapEnd + barPadding) * Math.cos(obs.angle),
      (gapEnd + barPadding) * Math.sin(obs.angle)
    );
    ctx.lineTo(
      (rOuter - barPadding) * Math.cos(obs.angle),
      (rOuter - barPadding) * Math.sin(obs.angle)
    );
    ctx.stroke();

    ctx.restore();
  }
}
