import {
  FUEL_PICKUP_START_ANGLE,
  GAME_OVER_FALL_START_SPEED,
  HIT_STOP_DURATION,
  INVINCIBLE_DURATION,
  MAX_FUEL,
  MAX_HEALTH,
  SHAKE_INTENSITY_DAMAGE,
  SHAKE_INTENSITY_DEATH,
  START_HEALTH,
  START_RADIUS,
  TUNNEL_WIDTH
} from './config.js';
import { playCollisionSound, playDeathSound, stopBackgroundMusic } from './audio.js';
import { createBurst } from './particles.js';
import { getPlayerScreenPosition } from './utils.js';

const DEFAULT_SHIP_COLORS = [
  '#00ffcc',
  '#ff3366',
  '#ffcc00',
  '#cc33ff',
  '#33ccff',
  '#7cff4f',
  '#ff7a18',
  '#ff5f7a',
  '#7df9ff',
  '#ffd166',
  '#9b8cff',
  '#ffffff'
];

function createGameState(
  highScore = Number(localStorage.getItem('spiralFlappyHighScore')) || 0,
  hasStartedOnce = false,
  selectedShipIndex = 0,
  shipColors = DEFAULT_SHIP_COLORS
) {
  return {
    distance: 0,
    height: TUNNEL_WIDTH / 2,
    velocity: 0,
    obstacles: [],
    healthPickups: [],
    fuelPickups: [],
    slowBuffPickups: [],
    nextFuelPickupAngle: FUEL_PICKUP_START_ANGLE,
    trailSparkles: [],
    score: 0,
    flapCount: 0,
    health: START_HEALTH,
    maxHealth: MAX_HEALTH,
    fuel: MAX_FUEL,
    maxFuel: MAX_FUEL,
    invincibleTimer: 0,
    slowBuffTimer: 0,
    hitStopTimer: 0,
    shakeAmount: 0,
    aiStressLevel: 0,
    deathFallActive: false,
    deathFallRadius: START_RADIUS + TUNNEL_WIDTH / 2,
    deathFallAngle: 0,
    deathFallVelocity: GAME_OVER_FALL_START_SPEED,
    gameOver: false,
    gameStarted: false,
    hasStartedOnce,
    highScore,
    shipColors: [...shipColors],
    selectedShipIndex
  };
}

export let gameState = createGameState();
export let lastPlayerPos = null;

export function resetGameState() {
  gameState = createGameState(
    gameState.highScore,
    gameState.hasStartedOnce,
    gameState.selectedShipIndex,
    gameState.shipColors
  );
  lastPlayerPos = null;
}

export function setGameOver(value = true) {
  if (value && !gameState.gameOver) {
    gameState.deathFallActive = true;
    gameState.deathFallRadius = START_RADIUS + gameState.height;
    gameState.deathFallAngle = gameState.distance;
    gameState.deathFallVelocity = GAME_OVER_FALL_START_SPEED;
    stopBackgroundMusic();
  }

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
  gameState.hitStopTimer = HIT_STOP_DURATION;
  gameState.aiStressLevel = Math.max(0, gameState.aiStressLevel - 0.4);
  const pos = getPlayerScreenPosition();

  if (gameState.health <= 0) {
    gameState.health = 0;
    gameState.shakeAmount = SHAKE_INTENSITY_DEATH;
    playDeathSound();
    createBurst(pos.x, pos.y, 15, 50, 4);
    setGameOver(true);
  } else {
    gameState.shakeAmount = SHAKE_INTENSITY_DAMAGE;
    playCollisionSound();
    createBurst(pos.x, pos.y, 0, 25, 2.5);
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
