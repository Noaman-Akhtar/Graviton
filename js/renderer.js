import {
  PLAYER_AURA_RADIUS,
  PLAYER_RADIUS,
  SPIRAL_GROWTH,
  TUNNEL_WIDTH
} from './config.js';
import { drawTrailSparkles } from './particles.js';
import { drawPickups } from './pickups.js';
import { gameState } from './state.js';
import { getPlayerScreenPosition, getSpiralRadius } from './utils.js';

function drawHud(ctx) {
  ctx.fillStyle = "white";
  ctx.font = "bold 40px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(gameState.score, 40, 50);

  ctx.font = "bold 16px sans-serif";
  ctx.fillText(`Health: ${gameState.health} / ${gameState.maxHealth}`, 40, 85);

  const bubbleRadius = 8;
  const bubbleSpacing = 24;
  for (let i = 0; i < gameState.maxHealth; i++) {
    ctx.beginPath();
    ctx.arc(40 + i * bubbleSpacing, 105, bubbleRadius, 0, Math.PI * 2);
    if (i < gameState.health) {
      ctx.fillStyle = "#ffb6c1";
    } else {
      ctx.fillStyle = "#331a1f";
    }
    ctx.fill();
  }

  ctx.fillStyle = "white";
  ctx.fillText("Fuel", 40, 145);

  const barWidth = 120;
  const barHeight = 14;
  const fuelRatio = Math.max(0, gameState.fuel / gameState.maxFuel);

  ctx.fillStyle = "#333333";
  ctx.fillRect(40, 155, barWidth, barHeight);

  if (fuelRatio > 0.5) {
    ctx.fillStyle = "#00ff00";
  } else if (fuelRatio > 0.25) {
    ctx.fillStyle = "#ffff00";
  } else {
    ctx.fillStyle = "#ff0000";
  }
  ctx.fillRect(40, 155, barWidth * fuelRatio, barHeight);
}

export function draw(ctx, canvas) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const time = Date.now() * 0.001;

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(0.8, 0.8);

  const renderOffsetR = SPIRAL_GROWTH * gameState.distance;
  const startTheta = gameState.distance - Math.PI;
  const endTheta = gameState.distance + 4 * Math.PI;
  const step = 0.05;
  const neonHue = (Date.now() / 80) % 360;
  const neonColor = `hsl(${neonHue}, 100%, 50%)`;

  ctx.lineWidth = 3;
  ctx.strokeStyle = neonColor;
  ctx.shadowBlur = 15;
  ctx.shadowColor = neonColor;

  ctx.beginPath();
  let first = true;
  for (let t = startTheta; t < endTheta; t += step) {
    const r = getSpiralRadius(t) - renderOffsetR;
    if (r < 0) continue;
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    if (first) { ctx.moveTo(x, y); first = false; }
    else { ctx.lineTo(x, y); }
  }
  ctx.stroke();

  ctx.beginPath();
  first = true;
  for (let t = startTheta; t < endTheta; t += step) {
    const r = getSpiralRadius(t) + TUNNEL_WIDTH - renderOffsetR;
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    if (first) { ctx.moveTo(x, y); first = false; }
    else { ctx.lineTo(x, y); }
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  for (let obs of gameState.obstacles) {
    const rInner = getSpiralRadius(obs.angle) - renderOffsetR;
    const rOuter = rInner + TUNNEL_WIDTH;
    if (obs.angle > endTheta || rOuter <= 0) continue;

    const gapStart = rInner + obs.gapPos;
    const gapEnd = gapStart + obs.gapSize;
    const layers = obs.complexity || 1;

    const drawAsteroid = (seed, thickness) => {
      const bulgeA = thickness * (0.62 + Math.sin(seed * 1.2) * 0.12);
      const bulgeB = thickness * (0.72 + Math.cos(seed * 1.7) * 0.12);
      const bulgeC = thickness * (0.68 + Math.sin(seed * 2.1) * 0.1);
      const bulgeD = thickness * (0.58 + Math.cos(seed * 2.8) * 0.1);
      const bulgeE = thickness * (0.7 + Math.sin(seed * 1.5) * 0.12);
      const bulgeF = thickness * (0.64 + Math.cos(seed * 2.4) * 0.1);
      const bulgeG = thickness * (0.74 + Math.sin(seed * 1.9) * 0.1);

      ctx.fillStyle = "#555";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 0.05;
      ctx.beginPath();
      ctx.moveTo(-0.22 * bulgeA, -1.48);
      ctx.lineTo(0.2 * bulgeB, -1.56);
      ctx.lineTo(0.68 * bulgeC, -0.88);
      ctx.lineTo(0.82 * bulgeD, -0.02);
      ctx.lineTo(0.34 * bulgeE, 1.34);
      ctx.lineTo(-0.3 * bulgeF, 1.26);
      ctx.lineTo(-0.82 * bulgeG, 0.36);
      ctx.lineTo(-0.66 * bulgeC, -0.84);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#404040";
      ctx.beginPath();
      ctx.moveTo(0.02 * bulgeA, -1.16);
      ctx.lineTo(0.52 * bulgeB, -0.48);
      ctx.lineTo(0.38 * bulgeD, 1.02);
      ctx.lineTo(-0.04 * bulgeF, 1.12);
      ctx.lineTo(-0.12 * bulgeA, 0.08);
      ctx.closePath();
      ctx.fill();
    };

    const drawAsteroidWall = (segmentStart, segmentEnd, sideSeed, isInner) => {
      const visibleStart = Math.max(0, segmentStart + (isInner ? 2 : 5));
      const visibleEnd = Math.max(0, segmentEnd - (isInner ? 5 : 2));
      const radialSpan = visibleEnd - visibleStart;
      if (radialSpan <= 5) return;

      const midR = (visibleStart + visibleEnd) * 0.5;
      const midX = midR * Math.cos(obs.angle);
      const midY = midR * Math.sin(obs.angle);
      const seed = obs.angle * 5.8 + sideSeed * 2.7 + layers * 0.93;
      
      const wallHalfWidth = Math.max(
        25,
        Math.min(60, radialSpan * 0.15 + 20 + layers * 6)
      );
      const clusterCount = layers >= 2 ? 3 : 2;

      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(obs.angle - Math.PI / 2);

      ctx.beginPath();
      ctx.rect(-wallHalfWidth * 1.5, -radialSpan / 2 - 10, wallHalfWidth * 3, radialSpan + 20);
      ctx.clip();

      for (let i = 0; i < clusterCount; i++) {
        const pieceSeed = seed + i * 1.71;
        const t = clusterCount === 1 ? 0.5 : i / (clusterCount - 1);
        const yOffset = (t - 0.5) * radialSpan * 0.4;
        const xOffset = Math.cos(pieceSeed * 1.8) * wallHalfWidth * 0.15;
        
        const rockWidth = wallHalfWidth * (1.3 + Math.sin(pieceSeed * 1.1) * 0.2 + layers * 0.4);
        const rockHeight = radialSpan * 1.15; 
        const thickness = 1.4 + Math.abs(Math.sin(pieceSeed * 1.4)) * 0.5;

        ctx.save();
        ctx.translate(xOffset, yOffset);
        ctx.rotate(Math.sin(pieceSeed * 2.4) * 0.1);
        ctx.scale(rockWidth, rockHeight); 
        drawAsteroid(pieceSeed, thickness);
        ctx.restore();
      }
      ctx.restore();
    };

    drawAsteroidWall(rInner, gapStart, -1, true);
    drawAsteroidWall(gapEnd, rOuter, 1, false);
  }

  const bhGradient = ctx.createRadialGradient(0, 0, 15, 0, 0, 90);
  bhGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
  bhGradient.addColorStop(0.5, "rgba(20, 0, 40, 0.9)");
  bhGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bhGradient;
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, Math.PI * 2);
  ctx.fill();

  const diskRadius = 40 + Math.sin(time * 3) * 4;
  ctx.beginPath();
  ctx.arc(0, 0, diskRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(120, 0, 255, 0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 25, 0, Math.PI * 2);
  ctx.fillStyle = "#000000";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#9900ff";
  ctx.fill();
  ctx.shadowBlur = 0;

  drawPickups(ctx, renderOffsetR, startTheta, endTheta);
  drawTrailSparkles(ctx);

  const playerPos = getPlayerScreenPosition();
  ctx.fillStyle = '#fff';
  if (gameState.gameOver) ctx.fillStyle = '#ff4444';
  ctx.beginPath();
  ctx.arc(playerPos.x, playerPos.y, PLAYER_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(playerPos.x, playerPos.y, PLAYER_AURA_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (gameState.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", cx, cy - 40);
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(`Score: ${gameState.score}`, cx, cy + 10);
    ctx.fillText(`Best: ${gameState.highScore}`, cx, cy + 40);
    ctx.font = "20px sans-serif";
    ctx.fillText("Space or Tap to Restart", cx, cy + 90);
  } else if (!gameState.gameStarted) {
    ctx.fillStyle = "white";
    ctx.font = "bold 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Tap / Space to Start", cx, cy);
    ctx.font = "20px sans-serif";
    ctx.fillText(`Top Score: ${gameState.highScore}`, cx, cy + 40);
  } else {
    ctx.fillStyle = "white";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(gameState.score, canvas.width - 40, 50);
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`Best: ${gameState.highScore}`, canvas.width - 40, 85);
    drawHud(ctx);
  }
}