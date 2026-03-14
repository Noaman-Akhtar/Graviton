import {
  FLAPS_PER_SPEED_LEVEL,
  INITIAL_OBSTACLE_COUNT,
  MIN_OBSTACLE_SPACING,
  OBSTACLE_CLEANUP_DISTANCE,
  OBSTACLE_LOOKAHEAD,
  OBSTACLE_SPACING_STEP,
  OBSTACLE_START_ANGLE,
  SLOW_BUFF_AUTOPILOT_LOOKAHEAD,
  SLOW_BUFF_AUTOPILOT_PADDING,
  SPIRAL_GROWTH,
  START_OBSTACLE_SPACING,
  START_RADIUS,
  TUNNEL_WIDTH
} from './config.js';
import { applyDamage, gameState, incrementScore } from './state.js';

function getCurrentObstacleSpacing() {
  const spawnLevels = Math.floor(gameState.flapCount / FLAPS_PER_SPEED_LEVEL);
  return Math.max(
    MIN_OBSTACLE_SPACING,
    START_OBSTACLE_SPACING - spawnLevels * OBSTACLE_SPACING_STEP
  );
}

export function initializeObstacles() {
  const spacing = getCurrentObstacleSpacing();
  for (let i = 0; i < INITIAL_OBSTACLE_COUNT; i++) {
    addObstacle(OBSTACLE_START_ANGLE + i * spacing);
  }
}

export function addObstacle(angle) {
  let gapSize = 135;

  if (gameState.score < 30) {
    if (gameState.score >= 5) {
      const difficultyLevel = Math.floor(gameState.score / 5);
      gapSize = 135 - difficultyLevel * 5;
    }
  } else if (gameState.score < 70) {
    if (gameState.score < 40) {
      gapSize = 100;
    } else if (gameState.score < 55) {
      gapSize = 90;
    } else {
      gapSize = 80;
    }
  } else {
    const levelsAfter70 = Math.floor((gameState.score - 70) / 15);
    gapSize = Math.max(80 - levelsAfter70, 50);
  }

  gameState.obstacles.push({
    angle: angle,
    gapSize: gapSize,
    gapPos: Math.random() * (TUNNEL_WIDTH - gapSize - 10) + 5,
    width: 0.1,
    passed: false,
    failed: false,
    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
    complexity: Math.floor(Math.random() * 3) + 1,
    roughness: 0.85 + Math.random() * 1.15,
    ridgePhase: Math.random() * Math.PI * 2,
    clusterSkew: (Math.random() - 0.5) * 1.2,
    notchDepth: 0.7 + Math.random() * 0.9
  });
}

export function getSlowBuffTargetHeight() {
  let targetHeight = TUNNEL_WIDTH / 2;
  let bestDistance = Infinity;

  for (const obs of gameState.obstacles) {
    const distToObs = obs.angle - gameState.distance;

    if (distToObs < -0.08 || distToObs > SLOW_BUFF_AUTOPILOT_LOOKAHEAD) {
      continue;
    }

    if (distToObs < bestDistance) {
      bestDistance = distToObs;
      targetHeight = obs.gapPos + obs.gapSize * 0.5;
    }
  }

  return Math.max(
    SLOW_BUFF_AUTOPILOT_PADDING,
    Math.min(TUNNEL_WIDTH - SLOW_BUFF_AUTOPILOT_PADDING, targetHeight)
  );
}

export function updateObstacles() {
  const centerCleanupDistance = Math.max(
    OBSTACLE_CLEANUP_DISTANCE,
    (START_RADIUS + TUNNEL_WIDTH) / SPIRAL_GROWTH
  );

  while (
    gameState.obstacles.length > 0 &&
    gameState.obstacles[0].angle < gameState.distance - centerCleanupDistance
  ) {
    gameState.obstacles.shift();
  }

  const lastObstacle = gameState.obstacles[gameState.obstacles.length - 1];

  if (lastObstacle && lastObstacle.angle < gameState.distance + OBSTACLE_LOOKAHEAD) {
    const spacing = getCurrentObstacleSpacing();
    addObstacle(lastObstacle.angle + spacing + Math.random() * 0.2);
  }

  for (const obs of gameState.obstacles) {
    const distToObs = obs.angle - gameState.distance;

    if (distToObs < 0.05 && distToObs > -0.05) {
      const pBottom = gameState.height - 8;
      const pTop = gameState.height + 8;
      const gBottom = obs.gapPos;
      const gTop = obs.gapPos + obs.gapSize;

      if (pBottom < gBottom || pTop > gTop) {
        if (!obs.failed) {
          obs.failed = true;
          applyDamage();
        }
      }
    }

    if (!obs.passed && !obs.failed && distToObs < -0.08) {
      obs.passed = true;
      incrementScore();
    }
  }
}
