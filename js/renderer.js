import {
  PLAYER_AURA_RADIUS,
  PLAYER_RADIUS,
  SLOW_BUFF_DURATION,
  SPIRAL_GROWTH,
  TUNNEL_WIDTH
} from './config.js';
import { drawTrailSparkles } from './particles.js';
import { drawPickups } from './pickups.js';
import { gameState } from './state.js';
import { getPlayerScreenPosition, getSpiralRadius } from './utils.js';

let meteors = [];
let backgroundWidth = 0;
let backgroundHeight = 0;
let starfieldCanvas = null;
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

let starData = [];

function initSpaceBackground(canvas) {
  backgroundWidth = canvas.width;
  backgroundHeight = canvas.height;

  starfieldCanvas = document.createElement('canvas');
  starfieldCanvas.width = canvas.width;
  starfieldCanvas.height = canvas.height;

  starData = [];
  const starCtx = starfieldCanvas.getContext('2d');
  if (starCtx) {
    for (let i = 0; i < 280; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 2.5 + 0.6;
      const alpha = 0.35 + Math.random() * 0.65;
      const twinkleSpeed = 0.002 + Math.random() * 0.006;
      const twinklePhase = Math.random() * Math.PI * 2;

      starData.push({ x, y, size, alpha, twinkleSpeed, twinklePhase });

      starCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      starCtx.shadowBlur = size * 3;
      starCtx.shadowColor = 'rgba(200, 220, 255, 0.8)';
      starCtx.beginPath();
      starCtx.arc(x, y, size, 0, Math.PI * 2);
      starCtx.fill();
    }
    starCtx.shadowBlur = 0;
  }

  meteors = [];
}

function updateSpaceBackground(canvas) {
  if (backgroundWidth !== canvas.width || backgroundHeight !== canvas.height || !starfieldCanvas) {
    initSpaceBackground(canvas);
  }

  if (Math.random() < 0.04 && meteors.length < 5) {
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

function drawSpaceBackground(ctx, canvas) {
  updateSpaceBackground(canvas);

  if (starfieldCanvas) {
    ctx.drawImage(starfieldCanvas, 0, 0);
  }

  const now = Date.now();
  for (const star of starData) {
    const twinkle = 0.4 + 0.6 * Math.sin(now * star.twinkleSpeed + star.twinklePhase);
    if (twinkle > 0.7) {
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillStyle = 'rgba(220, 235, 255, 1)';
      ctx.shadowBlur = star.size * 4;
      ctx.shadowColor = 'rgba(180, 210, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * twinkle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

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
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Health: ${gameState.health} / ${gameState.maxHealth}`, 40, 50);

  const bubbleRadius = 8;
  const bubbleSpacing = 24;
  for (let i = 0; i < gameState.maxHealth; i++) {
    ctx.beginPath();
    ctx.arc(40 + i * bubbleSpacing, 70, bubbleRadius, 0, Math.PI * 2);
    if (i < gameState.health) {
      ctx.fillStyle = "#ffb6c1";
    } else {
      ctx.fillStyle = "#331a1f";
    }
    ctx.fill();
  }

  ctx.fillStyle = "white";
  ctx.fillText("Fuel", 40, 110);

  const barWidth = 120;
  const barHeight = 14;
  const fuelRatio = Math.max(0, gameState.fuel / gameState.maxFuel);

  ctx.fillStyle = "#333333";
  ctx.fillRect(40, 120, barWidth, barHeight);

  if (fuelRatio > 0.5) {
    ctx.fillStyle = "#00ff00";
  } else if (fuelRatio > 0.25) {
    ctx.fillStyle = "#ffff00";
  } else {
    ctx.fillStyle = "#ff0000";
  }
  ctx.fillRect(40, 120, barWidth * fuelRatio, barHeight);

  if (gameState.slowBuffTimer > 0) {
    const buffRatio = Math.max(0, gameState.slowBuffTimer / SLOW_BUFF_DURATION);
    const buffSeconds = (gameState.slowBuffTimer / 60).toFixed(1);

    ctx.fillStyle = "white";
    ctx.fillText("Boost", 40, 160);
    ctx.textAlign = "right";
    ctx.fillText(`${buffSeconds}s`, 40 + barWidth, 160);
    ctx.textAlign = "left";

    ctx.fillStyle = "#333333";
    ctx.fillRect(40, 170, barWidth, barHeight);

    ctx.fillStyle = "#33bbff";
    ctx.fillRect(40, 170, barWidth * buffRatio, barHeight);
  }
}

export function draw(ctx, canvas) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const time = Date.now() * 0.001;
  drawSpaceBackground(ctx, canvas);

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.save();
  ctx.translate(cx, cy);

  if (gameState.shakeAmount > 0) {
    ctx.translate(
      (Math.random() - 0.5) * gameState.shakeAmount,
      (Math.random() - 0.5) * gameState.shakeAmount
    );
    gameState.shakeAmount *= 0.9;
    if (gameState.shakeAmount < 0.5) gameState.shakeAmount = 0;
  }

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
      const sides = 14 + Math.floor(((Math.sin(seed * 7.3) + 1) * 0.5) * 4);
      const angleStep = (Math.PI * 2) / sides;
      const vertices = [];

      for (let i = 0; i < sides; i++) {
        const a = angleStep * i;
        const n1 = Math.sin(seed * 1.3 + i * 0.7) * 0.14;
        const n2 = Math.cos(seed * 2.5 + i * 1.1) * 0.09;
        const n3 = Math.sin(seed * 4.1 + i * 1.6) * 0.05;
        const r = thickness * (0.72 + n1 + n2 + n3);
        vertices.push({
          x: Math.cos(a) * r,
          y: Math.sin(a) * r
        });
      }

      // Dark grey body
      ctx.fillStyle = "#4a4a4a";
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 0.03;
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i++) {
        const prev = vertices[i - 1];
        const curr = vertices[i];
        ctx.quadraticCurveTo(
          (prev.x + curr.x) / 2 + Math.sin(seed + i) * thickness * 0.03,
          (prev.y + curr.y) / 2 + Math.cos(seed + i) * thickness * 0.03,
          curr.x, curr.y
        );
      }
      ctx.quadraticCurveTo(
        (vertices[vertices.length - 1].x + vertices[0].x) / 2,
        (vertices[vertices.length - 1].y + vertices[0].y) / 2,
        vertices[0].x, vertices[0].y
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Lighter highlight edge
      ctx.fillStyle = "#5a5a5a";
      ctx.beginPath();
      for (let i = 0; i < Math.floor(sides * 0.4); i++) {
        const v = vertices[i];
        if (i === 0) ctx.moveTo(v.x * 0.92, v.y * 0.92);
        else ctx.lineTo(v.x * 0.92, v.y * 0.92);
      }
      ctx.closePath();
      ctx.fill();

      // Darker inner shading
      ctx.fillStyle = "#383838";
      ctx.beginPath();
      ctx.moveTo(vertices[0].x * 0.5, vertices[0].y * 0.5);
      for (let i = 1; i < vertices.length; i++) {
        ctx.lineTo(vertices[i].x * 0.5, vertices[i].y * 0.5);
      }
      ctx.closePath();
      ctx.fill();

      // Craters
      const craterCount = 2 + Math.floor(Math.abs(Math.sin(seed * 3.7)) * 2);
      for (let c = 0; c < craterCount; c++) {
        const ca = (c / craterCount) * Math.PI * 2 + seed * 1.5;
        const cd = thickness * (0.22 + Math.abs(Math.sin(seed * 2.1 + c * 1.9)) * 0.2);
        const crX = Math.cos(ca) * cd;
        const crY = Math.sin(ca) * cd;
        const crR = thickness * (0.07 + Math.abs(Math.cos(seed * 2.8 + c)) * 0.06);
        ctx.fillStyle = "#2a2a2a";
        ctx.beginPath();
        ctx.arc(crX, crY, crR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#333333";
        ctx.beginPath();
        ctx.arc(crX + crR * 0.15, crY + crR * 0.15, crR * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
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

      // Place round meteors along the wall
      const meteorCount = Math.max(4, layers + 3);

      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(obs.angle - Math.PI / 2);

      for (let i = 0; i < meteorCount; i++) {
        const pieceSeed = seed + i * 1.71;
        const t = meteorCount === 1 ? 0.5 : i / (meteorCount - 1);

        // Spread along radial direction
        const yPos = (t - 0.5) * radialSpan * 0.85 +
          Math.sin(pieceSeed * 2.3) * radialSpan * 0.08;
        const xPos = Math.cos(pieceSeed * 1.8 + ridgePhase) * radialSpan * 0.15 +
          Math.sin(pieceSeed * 3.5) * radialSpan * 0.06;

        // Uniform round size — each rock looks like an individual meteor
        const rockSize = radialSpan * (0.38 + Math.abs(Math.sin(pieceSeed * 1.4)) * 0.18
          + layers * 0.05 + roughness * 0.06);
        const aspect = 1.0 + Math.sin(pieceSeed * 3.1) * 0.08;
        const thickness = 1.0 + roughness * 0.2 + Math.abs(Math.sin(pieceSeed * 1.7)) * 0.3;

        ctx.save();
        ctx.translate(xPos, yPos);
        ctx.rotate(pieceSeed * 0.8 + ridgePhase * 0.3);
        ctx.scale(rockSize, rockSize * aspect);
        drawAsteroid(pieceSeed, thickness);
        ctx.restore();
      }
      ctx.restore();
    };

    drawAsteroidWall(rInner, gapStart, -1, true);
    drawAsteroidWall(gapEnd, rOuter, 1, false);
  }

  const bhGradient = ctx.createRadialGradient(0, 0, 10, 0, 0, 130);
  bhGradient.addColorStop(0, "rgba(0, 0, 0, 1)");
  bhGradient.addColorStop(0.25, "rgba(0, 0, 0, 0.95)");
  bhGradient.addColorStop(0.5, "rgba(5, 5, 8, 0.7)");
  bhGradient.addColorStop(0.75, "rgba(3, 3, 5, 0.3)");
  bhGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bhGradient;
  ctx.beginPath();
  ctx.arc(0, 0, 130, 0, Math.PI * 2);
  ctx.fill();

  const outerDiskRadius = 55 + Math.sin(time * 2) * 5;
  ctx.beginPath();
  ctx.arc(0, 0, outerDiskRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(120, 0, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const diskRadius = 40 + Math.sin(time * 3) * 4;
  ctx.beginPath();
  ctx.arc(0, 0, diskRadius, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(160, 0, 255, 0.45)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 28, 0, Math.PI * 2);
  ctx.fillStyle = "#000000";
  ctx.shadowBlur = 40;
  ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
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
  } else if (gameState.gameStarted) {
    ctx.fillStyle = "white";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(gameState.score, canvas.width - 40, 50);
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`Best: ${gameState.highScore}`, canvas.width - 40, 85);
    drawHud(ctx);
  }
}
