import { FUEL_PICKUP_START_ANGLE, INVINCIBLE_DURATION, MAX_FUEL, MAX_HEALTH, START_HEALTH, TUNNEL_WIDTH } from './config.js';

function createGameState(
  highScore = Number(localStorage.getItem('spiralFlappyHighScore')) || 0,
  hasStartedOnce = false
) {
  return {
    distance: 0,
    height: TUNNEL_WIDTH / 2,
    velocity: 0,
    obstacles: [],
    healthPickups: [],
    fuelPickups: [],
    nextFuelPickupAngle: FUEL_PICKUP_START_ANGLE,
    trailSparkles: [],
    score: 0,
    health: START_HEALTH,
    maxHealth: MAX_HEALTH,
    fuel: MAX_FUEL,
    maxFuel: MAX_FUEL,
    invincibleTimer: 0,
    gameOver: false,
    gameStarted: false,
    hasStartedOnce,
    highScore
  };
}

export let gameState = createGameState();
export let lastPlayerPos = null;

export function resetGameState() {
  gameState = createGameState(gameState.highScore, gameState.hasStartedOnce);
  lastPlayerPos = null;
}

export function setGameOver(value = true) {
  gameState.gameOver = value;
}

export function setLastPlayerPos(position) {
  lastPlayerPos = position ? { ...position } : null;
}

export function applyDamage() {
  if (gameState.invincibleTimer > 0) {
    return false;
  }

  gameState.health--;
  gameState.invincibleTimer = INVINCIBLE_DURATION;

  if (gameState.health <= 0) {
    gameState.health = 0;
    setGameOver(true);
  }

  return true;
}

export function incrementScore() {
  gameState.score++;

  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('spiralFlappyHighScore', gameState.highScore);
  }
}
