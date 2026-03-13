// PARTICLES
import { gameState } from './state.js';
import {
  TRAIL_SPAWN_RATE, TRAIL_LIFETIME,
  EXPLOSION_PARTICLE_COUNT, EXPLOSION_LIFETIME,
  COLLECT_PARTICLE_COUNT, COLLECT_LIFETIME,
  SCORE_POP_LIFETIME
} from './config.js';

// Particle types: 'trail', 'explosion', 'collect', 'scorePop'

export function spawnTrail(x, y, color = 'rgba(255,255,255,0.6)') {
  for (let i = 0; i < TRAIL_SPAWN_RATE; i++) {
    gameState.particles.push({
      type: 'trail',
      x, y,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      life: TRAIL_LIFETIME,
      maxLife: TRAIL_LIFETIME,
      size: Math.random() * 3 + 1,
      color
    });
  }
}

export function spawnExplosion(x, y) {
  for (let i = 0; i < EXPLOSION_PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    gameState.particles.push({
      type: 'explosion',
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: EXPLOSION_LIFETIME,
      maxLife: EXPLOSION_LIFETIME,
      size: Math.random() * 4 + 2,
      color: `hsl(${Math.random() * 60}, 100%, 60%)` // red-orange-yellow
    });
  }
}

export function spawnCollectEffect(x, y, type) {
  const hue = type === 'heal' ? 120 : 200; // green for heal, blue for shield
  for (let i = 0; i < COLLECT_PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 0.5;
    gameState.particles.push({
      type: 'collect',
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: COLLECT_LIFETIME,
      maxLife: COLLECT_LIFETIME,
      size: Math.random() * 3 + 2,
      color: `hsl(${hue}, 100%, ${60 + Math.random() * 20}%)`
    });
  }
}

export function spawnScorePop(x, y, text, color = '#fff') {
  gameState.particles.push({
    type: 'scorePop',
    x, y,
    vx: 0,
    vy: -1.5,
    life: SCORE_POP_LIFETIME,
    maxLife: SCORE_POP_LIFETIME,
    text,
    color
  });
}

export function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;

    if (p.type === 'explosion' || p.type === 'collect') {
      p.vx *= 0.96;
      p.vy *= 0.96;
    }

    if (p.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}

export function drawParticles(ctx) {
  for (const p of gameState.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);

    if (p.type === 'scorePop') {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.font = `bold 16px 'Orbitron', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();

      if (p.type === 'collect') {
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
