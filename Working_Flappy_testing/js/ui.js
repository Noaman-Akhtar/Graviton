// UI
import { gameState } from './state.js';
import {
  FONT_FAMILY, HUD_HEART_SIZE, HUD_HEART_SPACING,
  MAX_HEALTH, MAX_COMBO_MULTIPLIER
} from './config.js';

// Pickup notification state
let pickupNotification = null;

export function showPickupNotification(text, color) {
  pickupNotification = {
    text,
    color,
    startTime: Date.now(),
    duration: 1500 // 1.5 seconds
  };
}

// Draw a heart shape at (x, y)
function drawHeart(ctx, x, y, size, filled, color) {
  ctx.save();
  ctx.translate(x, y);

  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.4);
  ctx.bezierCurveTo(-s, -s * 0.2, -s, -s * 0.9, 0, -s * 0.5);
  ctx.bezierCurveTo(s, -s * 0.9, s, -s * 0.2, 0, s * 0.4);
  ctx.closePath();

  if (filled) {
    ctx.fillStyle = color || '#ff4466';
    ctx.shadowBlur = 8;
    ctx.shadowColor = color || '#ff4466';
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255, 68, 102, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawHUD(ctx, canvas) {
  const padding = 20;

  // === SCORE (top-left) ===
  ctx.save();

  // Score number
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 42px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText(gameState.score, padding, padding);

  // Combo multiplier
  if (gameState.comboMultiplier > 1) {
    const comboColor = getComboColor(gameState.comboMultiplier);
    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillStyle = comboColor;
    ctx.shadowColor = comboColor;
    ctx.fillText(`x${gameState.comboMultiplier}`, padding + 80, padding + 8);

    // Combo bar (small)
    const barWidth = 60;
    const barHeight = 4;
    const barX = padding + 80;
    const barY = padding + 30;
    const nextComboThreshold = gameState.comboMultiplier * 5;
    const progress = (gameState.combo % 5) / 5;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = comboColor;
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
  }

  ctx.restore();

  // === HEALTH (top-right) ===
  ctx.save();
  const heartsStartX = canvas.width - padding - (gameState.maxHealth * HUD_HEART_SPACING);

  for (let i = 0; i < gameState.maxHealth; i++) {
    const hx = heartsStartX + i * HUD_HEART_SPACING;
    const hy = padding + HUD_HEART_SIZE / 2;
    const filled = i < gameState.health;
    drawHeart(ctx, hx, hy, HUD_HEART_SIZE, filled);
  }

  // Shield indicator
  if (gameState.shieldTimer > 0) {
    ctx.font = `12px ${FONT_FAMILY}`;
    ctx.fillStyle = '#50b4ff';
    ctx.textAlign = 'right';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#50b4ff';
    const seconds = Math.ceil(gameState.shieldTimer / 60);
    ctx.fillText(`🛡 ${seconds}s`, canvas.width - padding, padding + HUD_HEART_SIZE + 15);
  }

  ctx.restore();

  // === PICKUP NOTIFICATION (center) ===
  if (pickupNotification) {
    const elapsed = Date.now() - pickupNotification.startTime;
    if (elapsed < pickupNotification.duration) {
      const alpha = 1 - (elapsed / pickupNotification.duration);
      const yOffset = -elapsed * 0.02; // float upward
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pickupNotification.color;
      ctx.font = `bold 18px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 10;
      ctx.shadowColor = pickupNotification.color;
      ctx.fillText(pickupNotification.text, canvas.width / 2, canvas.height * 0.35 + yOffset);
      ctx.restore();
    } else {
      pickupNotification = null;
    }
  }
}

function getComboColor(multiplier) {
  const colors = ['#fff', '#88ff88', '#ffdd44', '#ff8844', '#ff44ff'];
  return colors[Math.min(multiplier - 1, colors.length - 1)];
}

export function drawStartScreen(ctx, canvas) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Title with glow
  ctx.save();
  const titleHue = (Date.now() / 50) % 360;
  ctx.shadowBlur = 30;
  ctx.shadowColor = `hsl(${titleHue}, 100%, 50%)`;
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 48px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GRAVITON', cx, cy - 60);
  ctx.restore();

  // Subtitle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = `16px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText('Spiral Survival', cx, cy - 20);

  // Pulsing start prompt
  const pulse = 0.6 + 0.4 * Math.sin(Date.now() / 400);
  ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.font = `bold 22px ${FONT_FAMILY}`;
  ctx.fillText('Tap / Space to Start', cx, cy + 40);

  // High score
  if (gameState.highScore > 0) {
    ctx.fillStyle = 'rgba(255, 221, 68, 0.7)';
    ctx.font = `16px ${FONT_FAMILY}`;
    ctx.fillText(`Best: ${gameState.highScore}`, cx, cy + 80);
  }

  // Controls hint
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = `12px ${FONT_FAMILY}`;
  ctx.fillText('Space / Click / Tap to Flap', cx, cy + 120);
  ctx.fillText('Collect ● to heal, ◆ for shield', cx, cy + 140);
}

export function drawGameOverScreen(ctx, canvas) {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Game Over title with red glow
  ctx.save();
  ctx.shadowBlur = 25;
  ctx.shadowColor = '#ff4444';
  ctx.fillStyle = '#ff4444';
  ctx.font = `bold 52px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', cx, cy - 60);
  ctx.restore();

  // Score
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold 36px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  ctx.fillText(gameState.score, cx, cy);

  // High score
  const isNewBest = gameState.score >= gameState.highScore && gameState.score > 0;
  if (isNewBest) {
    ctx.fillStyle = '#ffdd44';
    ctx.font = `bold 18px ${FONT_FAMILY}`;
    ctx.fillText('★ NEW BEST! ★', cx, cy + 35);
  } else {
    ctx.fillStyle = 'rgba(255, 221, 68, 0.7)';
    ctx.font = `16px ${FONT_FAMILY}`;
    ctx.fillText(`Best: ${gameState.highScore}`, cx, cy + 35);
  }

  // Restart prompt
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 400);
  ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
  ctx.font = `bold 20px ${FONT_FAMILY}`;
  ctx.fillText('Tap / Space to Retry', cx, cy + 80);
}
