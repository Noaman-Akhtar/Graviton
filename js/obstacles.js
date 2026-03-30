import {
  INITIAL_OBSTACLE_COUNT,
  MIN_OBSTACLE_SPACING,
  OBSTACLE_CLEANUP_DISTANCE,
  OBSTACLE_COLLISION_WINDOW,
  OBSTACLE_LOOKAHEAD,
  OBSTACLE_SPACING_STEP,
  OBSTACLE_START_ANGLE,
  SHIP_COLLISION_RADIUS,
  SLOW_BUFF_AUTOPILOT_LOOKAHEAD,
  SLOW_BUFF_AUTOPILOT_PADDING,
  SPIRAL_GROWTH,
  START_OBSTACLE_SPACING,
  START_RADIUS,
  TUNNEL_WIDTH
} from './config.js';
import { applyDamage, gameState, incrementScore } from './state.js';
import { getDifficultyMultiplier, getDifficultyStage } from './utils.js';

function getCurrentObstacleSpacing() {
  return Math.max(
    MIN_OBSTACLE_SPACING,
    START_OBSTACLE_SPACING - getDifficultyStage() * OBSTACLE_SPACING_STEP
  );
}

export function initializeObstacles() {
  const spacing = getCurrentObstacleSpacing();
  for (let i = 0; i < INITIAL_OBSTACLE_COUNT; i++) {
    addObstacle(OBSTACLE_START_ANGLE + i * spacing);
  }
}

export function addObstacle(angle) {
  const difficultyMultiplier = getDifficultyMultiplier();
  const difficultyStage = getDifficultyStage();
  const baseGap = Math.max(68, 135 / difficultyMultiplier);
  const minGap = 55;
  const gapSize = baseGap - (gameState.aiStressLevel * (baseGap - minGap));

  const baseGapPos = Math.random() * (TUNNEL_WIDTH - gapSize - 10) + 5;
  const isFloater = Math.random() < (gameState.aiStressLevel * 0.85);
  const floatSpeed = isFloater ? (Math.random() * 0.002 + 0.001) + (gameState.aiStressLevel * 0.003) : 0;
  const floatRange = isFloater ? (Math.random() * 15 + 10) + (gameState.aiStressLevel * 20) : 0;

  gameState.obstacles.push({
    angle: angle,
    gapSize: gapSize,
    baseGapPos: baseGapPos,
    gapPos: baseGapPos,
    floatSpeed: floatSpeed,
    floatRange: floatRange,
    floatPhase: Math.random() * Math.PI * 2,
    floatOffset: 0,
    width: 0.1,
    passed: false,
    failed: false,
    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
    complexity: Math.min(4, Math.floor(Math.random() * 3) + 1 + Math.floor(difficultyStage / 2)),
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
    const baseSpacing = getCurrentObstacleSpacing();
    const stressSpacing = baseSpacing * (1 - gameState.aiStressLevel * 0.3);
    const spacing = Math.max(MIN_OBSTACLE_SPACING, stressSpacing);
    addObstacle(lastObstacle.angle + spacing + Math.random() * 0.15);
  }

  for (const obs of gameState.obstacles) {
    // Float the entire obstacle up/down
    if (obs.floatSpeed > 0) {
      obs.floatOffset = Math.sin(Date.now() * obs.floatSpeed + obs.floatPhase) * obs.floatRange;
      obs.gapPos = obs.baseGapPos + obs.floatOffset;
      obs.gapPos = Math.max(5, Math.min(TUNNEL_WIDTH - obs.gapSize - 5, obs.gapPos));
    }

    const distToObs = obs.angle - gameState.distance;

    if (distToObs < OBSTACLE_COLLISION_WINDOW && distToObs > -OBSTACLE_COLLISION_WINDOW) {
      const playerCenter = gameState.height;
      const gBottom = obs.gapPos;
      const gTop = obs.gapPos + obs.gapSize;

      // Distance from player center to each wall edge
      // Negative means the player center is already past the wall (inside the rock)
      const distToBottomWall = playerCenter - gBottom;
      const distToTopWall = gTop - playerCenter;

      // Collision: ship circle overlaps with either wall
      const hitsBottom = distToBottomWall < SHIP_COLLISION_RADIUS;
      const hitsTop = distToTopWall < SHIP_COLLISION_RADIUS;

      if (hitsBottom || hitsTop) {
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
