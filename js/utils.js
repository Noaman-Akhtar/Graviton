import { START_RADIUS, SPIRAL_GROWTH } from './config.js';
import { gameState } from './state.js';

export function getSpiralRadius(theta) {
  return START_RADIUS + SPIRAL_GROWTH * theta;
}

export function getPlayerScreenPosition() {
  const playerScreenR = gameState.gameOver
    ? gameState.deathFallRadius
    : START_RADIUS + gameState.height;
  const playerAngle = gameState.gameOver
    ? gameState.deathFallAngle
    : gameState.distance;

  return {
    x: playerScreenR * Math.cos(playerAngle),
    y: playerScreenR * Math.sin(playerAngle)
  };
}
