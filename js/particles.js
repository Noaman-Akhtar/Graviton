import {
  TRAIL_SPARKLE_MAX,
  TRAIL_SPARKLE_MAX_LIFE,
  TRAIL_SPARKLE_MIN_LIFE
} from './config.js';
import { gameState, lastPlayerPos, setLastPlayerPos } from './state.js';
import { getPlayerScreenPosition } from './utils.js';

export function createBurst(x, y, hue, count = 15, speedMultiplier = 1) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (0.5 + Math.random() * 2) * speedMultiplier;
    const life = TRAIL_SPARKLE_MIN_LIFE + Math.random() * 20;

    gameState.trailSparkles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: 2 + Math.random() * 4,
      hue,
      twinkleOffset: Math.random() * Math.PI * 2
    });
  }
}

export function updateTrailSparkles(spawnNew = false) {
  const playerPos = getPlayerScreenPosition();
  const previousPlayerPos = lastPlayerPos ?? playerPos;

  if (!lastPlayerPos) {
    setLastPlayerPos(playerPos);
  }

  if (spawnNew) {
    const dx = playerPos.x - previousPlayerPos.x;
    const dy = playerPos.y - previousPlayerPos.y;
    const distanceMoved = Math.hypot(dx, dy);

    if (distanceMoved > 0.01) {
      const trailDirX = -dx / distanceMoved;
      const trailDirY = -dy / distanceMoved;
      const sideX = -trailDirY;
      const sideY = trailDirX;
      const sparkleCount = 2 + (Math.random() < 0.55 ? 1 : 0);

      for (let i = 0; i < sparkleCount; i++) {
        const spread = (Math.random() - 0.5) * 8;
        const tailOffset = 5 + Math.random() * 6;
        const life = TRAIL_SPARKLE_MIN_LIFE + Math.random() * (TRAIL_SPARKLE_MAX_LIFE - TRAIL_SPARKLE_MIN_LIFE);

        gameState.trailSparkles.push({
          x: playerPos.x + trailDirX * tailOffset + sideX * spread,
          y: playerPos.y + trailDirY * tailOffset + sideY * spread,
          vx: trailDirX * (0.08 + Math.random() * 0.14) + (Math.random() - 0.5) * 0.14,
          vy: trailDirY * (0.08 + Math.random() * 0.14) + (Math.random() - 0.5) * 0.14,
          life,
          maxLife: life,
          size: 1 + Math.random() * 2,
          hue: 16 + Math.random() * 24,
          twinkleOffset: Math.random() * Math.PI * 2
        });
      }
    }
  }

  let writeIndex = 0;
  for (let i = 0; i < gameState.trailSparkles.length; i++) {
    const sparkle = gameState.trailSparkles[i];
    sparkle.x += sparkle.vx;
    sparkle.y += sparkle.vy;
    sparkle.vx *= 0.985;
    sparkle.vy *= 0.985;
    sparkle.life -= 1;

    if (sparkle.life > 0) {
      gameState.trailSparkles[writeIndex++] = sparkle;
    }
  }
  gameState.trailSparkles.length = Math.min(writeIndex, TRAIL_SPARKLE_MAX);

  setLastPlayerPos(playerPos);
}

export function drawTrailSparkles(ctx) {
  const now = Date.now();
  ctx.save();

  for (const sparkle of gameState.trailSparkles) {
    const lifeRatio = sparkle.life / sparkle.maxLife;
    const twinkle = 0.65 + 0.35 * Math.sin(now * 0.03 + sparkle.twinkleOffset);
    const radius = Math.max(0.1, sparkle.size * lifeRatio * twinkle);

    ctx.globalAlpha = Math.max(0, lifeRatio * 0.95);
    ctx.fillStyle = `hsla(${sparkle.hue}, 100%, 82%, 1)`;
    ctx.shadowBlur = 12;
    ctx.shadowColor = `hsla(${sparkle.hue}, 100%, 75%, ${lifeRatio})`;

    ctx.beginPath();
    ctx.arc(sparkle.x, sparkle.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (sparkle.size > 1.4) {
      const crossSize = radius * 2.4;
      ctx.strokeStyle = `hsla(${sparkle.hue}, 100%, 92%, ${lifeRatio * 0.9})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sparkle.x - crossSize, sparkle.y);
      ctx.lineTo(sparkle.x + crossSize, sparkle.y);
      ctx.moveTo(sparkle.x, sparkle.y - crossSize);
      ctx.lineTo(sparkle.x, sparkle.y + crossSize);
      ctx.stroke();
    }
  }

  ctx.restore();
}
