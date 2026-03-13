// STATE
import {
  TUNNEL_WIDTH, START_HEALTH, MAX_HEALTH,
  INITIAL_OBSTACLE_COUNT, OBSTACLE_SPAWN_START,
  OBSTACLE_SPAWN_SPACING, STAR_COUNT, STAR_MAX_RADIUS
} from './config.js';

// Generate a static starfield (random dots for background)
function generateStarfield() {
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      angle: Math.random() * Math.PI * 2,
      radius: 50 + Math.random() * 600,
      size: Math.random() * STAR_MAX_RADIUS + 0.5,
      brightness: Math.random() * 0.6 + 0.2
    });
  }
  return stars;
}

export const starfield = generateStarfield();

export let gameState = {
  distance: 0,
  height: TUNNEL_WIDTH / 2,
  velocity: 0,
  obstacles: [],
  pickups: [],
  particles: [],
  score: 0,
  rawDistance: 0,
  obstaclesPassed: 0,
  health: START_HEALTH,
  maxHealth: MAX_HEALTH,
  combo: 0,
  comboMultiplier: 1,
  invincibleTimer: 0,
  shieldTimer: 0,
  gameOver: false,
  gameStarted: false,
  highScore: parseInt(localStorage.getItem('spiralFlappyHighScore')) || 0
};

export function resetGameState() {
  const hs = gameState.highScore;
  gameState.distance = 0;
  gameState.height = TUNNEL_WIDTH / 2;
  gameState.velocity = 0;
  gameState.obstacles = [];
  gameState.pickups = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.rawDistance = 0;
  gameState.obstaclesPassed = 0;
  gameState.health = START_HEALTH;
  gameState.maxHealth = MAX_HEALTH;
  gameState.combo = 0;
  gameState.comboMultiplier = 1;
  gameState.invincibleTimer = 0;
  gameState.shieldTimer = 0;
  gameState.gameOver = false;
  gameState.gameStarted = false;
  gameState.highScore = hs;
}
