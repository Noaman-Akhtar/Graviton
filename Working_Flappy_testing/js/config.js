
// Tunnel geometry
export const TUNNEL_WIDTH = 180;
export const SPIRAL_GROWTH = 28.65;
export const START_RADIUS = 150;

// Player physics
export const FLAP_STRENGTH = 4.5;
export const GRAVITY = 0.2;
export const PLAYER_RADIUS = 8;
export const PLAYER_AURA_RADIUS = 14;

// Scrolling / difficulty
export const BASE_SCROLL_SPEED = 0.012;
export const MAX_SCROLL_SPEED = 0.035;
export const SPEED_INCREASE_INTERVAL = 15;
export const SPEED_INCREASE_AMOUNT = 0.002;

// Health system
export const MAX_HEALTH = 5;
export const START_HEALTH = 3;
export const INVINCIBLE_DURATION = 60; // frames
export const DAMAGE_FLASH_SPEED = 8;

// Obstacle spawning
export const OBSTACLE_SPAWN_START = Math.PI / 2;
export const OBSTACLE_SPAWN_SPACING = Math.PI / 2.5;
export const INITIAL_OBSTACLE_COUNT = 5;
export const OBSTACLE_LOOKAHEAD = Math.PI * 3;
export const OBSTACLE_CLEANUP_BEHIND = Math.PI;

// Obstacle gap defaults
export const STARTING_GAP = 135;
export const MINIMUM_GAP = 50;

// Obstacle types
export const OBSTACLE_TYPES = {
  GATE: 'gate',
  PULSE: 'pulse',
  MOVING: 'moving',
  DOUBLE: 'double'
};

// Pulse gate config
export const PULSE_SPEED = 0.04;
export const PULSE_AMPLITUDE = 20;

// Moving gate config
export const MOVING_SPEED = 0.6;

// Double gate config
export const DOUBLE_GATE_SPACING = 0.15;

// Pickups
export const PICKUP_TYPES = {
  HEAL: 'heal',
  SHIELD: 'shield'
};
export const PICKUP_SPAWN_CHANCE = 0.15;
export const PICKUP_MAX_ONSCREEN = 2;
export const PICKUP_RADIUS = 10;
export const PICKUP_BOB_SPEED = 0.05;
export const PICKUP_BOB_AMPLITUDE = 5;
export const SHIELD_DURATION = 180; // frames

// Particles
export const TRAIL_SPAWN_RATE = 2;    // particles per frame
export const TRAIL_LIFETIME = 30;
export const EXPLOSION_PARTICLE_COUNT = 20;
export const EXPLOSION_LIFETIME = 40;
export const COLLECT_PARTICLE_COUNT = 15;
export const COLLECT_LIFETIME = 30;
export const SCORE_POP_LIFETIME = 45;

// Rendering
export const SPIRAL_RENDER_BEHIND = Math.PI;
export const SPIRAL_RENDER_AHEAD = 4 * Math.PI;
export const SPIRAL_STEP = 0.05;
export const TUNNEL_GLOW_BLUR = 15;
export const TUNNEL_LINE_WIDTH = 3;

// Starfield
export const STAR_COUNT = 120;
export const STAR_MAX_RADIUS = 2;
export const STAR_ROTATION_SPEED = 0.0002;

// Combo system
export const COMBO_MULTIPLIER_STEP = 5; // every 5 consecutive clears = +1 multiplier
export const MAX_COMBO_MULTIPLIER = 5;

// Distance-based scoring (Subway Surfers style)
export const SCORE_PER_FRAME = 50; // multiplied by rawDistance each frame for a smooth ticker

// UI
export const FONT_FAMILY = "'Orbitron', sans-serif";
export const HUD_HEART_SIZE = 22;
export const HUD_HEART_SPACING = 30;
