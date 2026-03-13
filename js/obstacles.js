import {
  INITIAL_OBSTACLE_COUNT,
  OBSTACLE_CLEANUP_DISTANCE,
  OBSTACLE_LOOKAHEAD,
  OBSTACLE_SPACING,
  OBSTACLE_START_ANGLE,
  SPIRAL_GROWTH,
  START_RADIUS,
  TUNNEL_WIDTH
} from './config.js';
import { gameState, setGameOver } from './state.js';

export function initializeObstacles() {
  for (let i = 0; i < INITIAL_OBSTACLE_COUNT; i++) {
    addObstacle(OBSTACLE_START_ANGLE + i * OBSTACLE_SPACING);
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
    color: `hsl(${Math.random() * 360}, 100%, 60%)`,
    complexity: Math.floor(Math.random() * 3) + 1
  });
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
    addObstacle(lastObstacle.angle + OBSTACLE_SPACING + Math.random() * 0.3);
  }

  for (const obs of gameState.obstacles) {
    const distToObs = obs.angle - gameState.distance;

    if (distToObs < 0.05 && distToObs > -0.05) {
      const pBottom = gameState.height - 8;
      const pTop = gameState.height + 8;
      const gBottom = obs.gapPos;
      const gTop = obs.gapPos + obs.gapSize;

      if (pBottom < gBottom || pTop > gTop) {
        if (gameState.invincibleTimer <= 0) {
          gameState.health--;
          gameState.invincibleTimer = 60;
          if (gameState.health <= 0) setGameOver();
        }
      } else if (!obs.passed) {
        obs.passed = true;
        gameState.score++;
        if (gameState.score > gameState.highScore) {
          gameState.highScore = gameState.score;
          localStorage.setItem('spiralFlappyHighScore', gameState.highScore);
        }
      }
    }
  }
}
