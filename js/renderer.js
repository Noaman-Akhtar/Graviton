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

let stars = [];
let meteors = [];
let backgroundWidth = 0;
let backgroundHeight = 0;
let lastShipScreenPos = null;
let lastShipHeading = 0;

function createMeteor(initial = false) {
  const startX = initial ? Math.random() * backgroundWidth : backgroundWidth + Math.random() * backgroundWidth * 0.2;
  const startY = initial ? Math.random() * backgroundHeight * 0.45 : Math.random() * backgroundHeight * 0.55;
  const life = Math.random() * 35 + 45;

  meteors.push({
    x: startX,
    y: startY,
    vx: -(Math.random() * 4 + 6),
    vy: Math.random() * 3 + 2,
    size: Math.random() * 2 + 1.2,
    length: Math.random() * 90 + 70,
    life,
    maxLife: life
  });
}

function initSpaceBackground(canvas) {
  backgroundWidth = canvas.width;
  backgroundHeight = canvas.height;

  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      brightness: Math.random(),
      blinkSpeed: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2
    });
  }

  meteors = [];
}

function updateSpaceBackground(canvas) {
  if (backgroundWidth !== canvas.width || backgroundHeight !== canvas.height || stars.length === 0) {
    initSpaceBackground(canvas);
  }

  if (Math.random() < 0.012 && meteors.length < 3) {
    createMeteor();
  }

  meteors = meteors.filter((meteor) => {
    meteor.x += meteor.vx;
    meteor.y += meteor.vy;
    meteor.life -= 1;

    return (
      meteor.life > 0 &&
      meteor.x + meteor.length > 0 &&
      meteor.y - meteor.length < canvas.height + 40
    );
  });
}

function drawSpaceBackground(ctx, canvas, time) {
  updateSpaceBackground(canvas);

  for (const star of stars) {
    const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 60 * star.blinkSpeed + star.phase));
    const alpha = 0.25 + star.brightness * 0.55 + twinkle * 0.2;
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(alpha, 1)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const meteor of meteors) {
    const alpha = meteor.life / meteor.maxLife;
    const tailX = meteor.x - meteor.vx * 8;
    const tailY = meteor.y - meteor.vy * 8;
    const gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.95 * alpha})`);
    gradient.addColorStop(0.3, `rgba(173, 216, 255, ${0.7 * alpha})`);
    gradient.addColorStop(1, "rgba(173, 216, 255, 0)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = meteor.size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(meteor.x, meteor.y);
    ctx.lineTo(
      meteor.x - (meteor.vx / Math.max(Math.abs(meteor.vx), 0.1)) * meteor.length,
      meteor.y - (meteor.vy / Math.max(Math.abs(meteor.vy), 0.1)) * meteor.length
    );
    ctx.stroke();
  }

  ctx.lineCap = "butt";
}

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
  drawSpaceBackground(ctx, canvas, time);

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
    const roughness = obs.roughness || 1;
    const ridgePhase = obs.ridgePhase || 0;
    const clusterSkew = obs.clusterSkew || 0;
    const notchDepth = obs.notchDepth || 1;

    const drawAsteroid = (seed, thickness) => {
      const jagA = thickness * (0.54 + Math.sin(seed * 1.2 + ridgePhase) * (0.16 + roughness * 0.08));
      const jagB = thickness * (0.68 + Math.cos(seed * 1.8 + ridgePhase * 0.7) * (0.15 + roughness * 0.06));
      const jagC = thickness * (0.74 + Math.sin(seed * 2.3 - ridgePhase) * (0.1 + roughness * 0.05));
      const jagD = thickness * (0.6 + Math.cos(seed * 3.1 + ridgePhase * 0.5) * (0.14 + roughness * 0.05));
      const jagE = thickness * (0.82 + Math.sin(seed * 2.7 + ridgePhase) * (0.18 + roughness * 0.08));
      const jagF = thickness * (0.62 + Math.cos(seed * 2.1 - ridgePhase * 0.4) * (0.12 + roughness * 0.06));
      const jagG = thickness * (0.72 + Math.sin(seed * 1.6 + ridgePhase * 1.2) * (0.16 + roughness * 0.05));
      const jagH = thickness * (0.58 + Math.cos(seed * 2.9 + ridgePhase) * (0.13 + roughness * 0.06));
      const jagI = thickness * (0.78 + Math.sin(seed * 3.4 - ridgePhase * 0.8) * (0.12 + roughness * 0.05));
      const jagJ = thickness * (0.66 + Math.cos(seed * 1.4 + ridgePhase * 0.6) * (0.14 + roughness * 0.05));
      const jagK = thickness * (0.52 + Math.sin(seed * 2.5 - ridgePhase) * (0.16 + roughness * 0.05));
      const jagL = thickness * (0.7 + Math.cos(seed * 1.9 + ridgePhase * 1.1) * (0.15 + roughness * 0.05));

      ctx.fillStyle = "#555";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 0.05;
      ctx.beginPath();
      ctx.moveTo(-0.28 * jagA, -1.66);
      ctx.lineTo(0.08 * jagB, -1.8);
      ctx.lineTo(0.48 * jagC, -1.34);
      ctx.lineTo(0.86 * jagD, -0.76);
      ctx.lineTo(0.94 * jagE, -0.08 * notchDepth);
      ctx.lineTo(0.62 * jagF, 0.7);
      ctx.lineTo(0.26 * jagG, 1.5);
      ctx.lineTo(-0.16 * jagH, 1.68);
      ctx.lineTo(-0.56 * jagI, 1.1);
      ctx.lineTo(-0.96 * jagJ, 0.24);
      ctx.lineTo(-0.84 * jagK, -0.76);
      ctx.lineTo(-0.48 * jagL, -1.32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#3e3e3e";
      ctx.beginPath();
      ctx.moveTo(0.02 * jagA, -1.22);
      ctx.lineTo(0.46 * jagB, -0.56);
      ctx.lineTo(0.34 * jagD, 0.28);
      ctx.lineTo(0.22 * jagF, 1.18);
      ctx.lineTo(-0.12 * jagG, 1.28);
      ctx.lineTo(-0.18 * jagA, 0.08);
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
        20,
        Math.min(56, radialSpan * (0.11 + roughness * 0.015) + 15 + layers * 4.5)
      );
      const clusterCount = Math.max(2, layers + 1 + (roughness > 1.35 ? 1 : 0));

      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(obs.angle - Math.PI / 2);

      ctx.beginPath();
      ctx.rect(-wallHalfWidth * 1.65, -radialSpan / 2 - 12, wallHalfWidth * 3.3, radialSpan + 24);
      ctx.clip();

      for (let i = 0; i < clusterCount; i++) {
        const pieceSeed = seed + i * 1.71;
        const t = clusterCount === 1 ? 0.5 : i / (clusterCount - 1);
        const yOffset =
          (t - 0.5) * radialSpan * (0.34 + roughness * 0.08) +
          Math.sin(pieceSeed * 2.6 + ridgePhase) * radialSpan * 0.08 * roughness +
          clusterSkew * radialSpan * 0.08;
        const xOffset =
          Math.cos(pieceSeed * 1.8 + ridgePhase) * wallHalfWidth * (0.14 + roughness * 0.06) +
          Math.sin(pieceSeed * 4.2 - ridgePhase) * wallHalfWidth * 0.06;
        
        const rockWidth =
          wallHalfWidth *
          (1.02 + roughness * 0.24 + Math.sin(pieceSeed * 1.1 + ridgePhase) * 0.22 + layers * 0.24);
        const rockHeight =
          radialSpan * (0.82 + roughness * 0.14 + Math.cos(pieceSeed * 0.9 - ridgePhase) * 0.16);
        const thickness =
          1.02 + roughness * 0.24 + Math.abs(Math.sin(pieceSeed * 1.4 + ridgePhase)) * 0.42;

        ctx.save();
        ctx.translate(xOffset, yOffset);
        ctx.rotate(Math.sin(pieceSeed * 2.4 + ridgePhase) * 0.16 + clusterSkew * 0.08);
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
  const playerFade = gameState.deathFallActive
    ? Math.max(0, Math.min(1, (gameState.deathFallRadius - 18) / 72))
    : 1;
  ctx.restore();

  const worldScale = 0.8;
  const shipColor = gameState.shipColors
    ? gameState.shipColors[gameState.selectedShipIndex]
    : '#00ffcc';
  const screenX = cx + playerPos.x * worldScale;
  const screenY = cy + playerPos.y * worldScale;
  const shipRenderScale = worldScale * 1.18;
  const deltaX = lastShipScreenPos ? screenX - lastShipScreenPos.x : 0;
  const deltaY = lastShipScreenPos ? screenY - lastShipScreenPos.y : 0;
  const movementDistance = Math.hypot(deltaX, deltaY);
  const fallbackHeading = gameState.gameOver
    ? Math.atan2(-playerPos.y, -playerPos.x)
    : Math.atan2(playerPos.y, playerPos.x) + Math.PI / 2;
  const headingResetDistance = Math.max(canvas.width, canvas.height) * 0.18;

  if (movementDistance > 0.3 && movementDistance < headingResetDistance) {
    lastShipHeading = Math.atan2(deltaY, deltaX);
  } else {
    lastShipHeading = fallbackHeading;
  }

  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate(lastShipHeading + Math.PI / 2);
  ctx.scale(shipRenderScale, shipRenderScale);
  ctx.globalAlpha = playerFade;

  ctx.fillStyle = `rgba(255,255,255,${0.22 * playerFade})`;
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_AURA_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = shipColor;
  ctx.shadowBlur = 15;
  ctx.shadowColor = shipColor;
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_RADIUS * 1.8);
  ctx.lineTo(PLAYER_RADIUS * 1.22, PLAYER_RADIUS * 1.18);
  ctx.lineTo(PLAYER_RADIUS * 0.36, PLAYER_RADIUS * 0.42);
  ctx.lineTo(0, PLAYER_RADIUS * 0.78);
  ctx.lineTo(-PLAYER_RADIUS * 0.36, PLAYER_RADIUS * 0.42);
  ctx.lineTo(-PLAYER_RADIUS * 1.22, PLAYER_RADIUS * 1.18);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(0, -PLAYER_RADIUS * 1.25);
  ctx.lineTo(PLAYER_RADIUS * 0.44, PLAYER_RADIUS * 0.2);
  ctx.lineTo(0, -PLAYER_RADIUS * 0.08);
  ctx.lineTo(-PLAYER_RADIUS * 0.44, PLAYER_RADIUS * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(255,255,255,${0.95 * playerFade})`;
  ctx.beginPath();
  ctx.arc(0, PLAYER_RADIUS * 0.88, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  lastShipScreenPos = { x: screenX, y: screenY };

  if (gameState.slowBuffTimer > 0) {
    ctx.fillStyle = "rgba(0, 150, 255, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (gameState.gameOver && !gameState.deathFallActive) {
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
    ctx.fillText("Restart or Return to Menu", cx, cy + 90);
  } else if (!gameState.gameStarted && gameState.hasStartedOnce) {
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
