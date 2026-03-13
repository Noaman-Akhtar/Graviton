import { START_RADIUS, SPIRAL_GROWTH } from './config.js';
import { gameState } from './state.js';

export function getSpiralRadius(theta) {
  return START_RADIUS + SPIRAL_GROWTH * theta;
}

export function getPlayerScreenPosition() {
  const playerScreenR = START_RADIUS + gameState.height;

  return {
    x: playerScreenR * Math.cos(gameState.distance),
    y: playerScreenR * Math.sin(gameState.distance)
  };
}
