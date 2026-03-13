// RENDERER
import { gameState, starfield } from './state.js';
import {
  TUNNEL_WIDTH, START_RADIUS, SPIRAL_GROWTH,
  SPIRAL_RENDER_BEHIND, SPIRAL_RENDER_AHEAD, SPIRAL_STEP,
  TUNNEL_GLOW_BLUR, TUNNEL_LINE_WIDTH,
  STAR_ROTATION_SPEED
} from './config.js';

export function getSpiralRadius(theta) {
  return START_RADIUS + SPIRAL_GROWTH * theta;
}

export function getRenderOffsetR() {
  return SPIRAL_GROWTH * gameState.distance;
}

export function drawBackground(ctx, canvas) {
  // Dark gradient background
  const grd = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  grd.addColorStop(0, '#0d1117');
  grd.addColorStop(0.5, '#080c12');
  grd.addColorStop(1, '#020408');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawStarfield(ctx) {
  const rotation = Date.now() * STAR_ROTATION_SPEED;

  for (const star of starfield) {
    const angle = star.angle + rotation;
    const x = star.radius * Math.cos(angle);
    const y = star.radius * Math.sin(angle);

    // Twinkle effect
    const twinkle = 0.5 + 0.5 * Math.sin(Date.now() * 0.002 + star.angle * 10);
    const alpha = star.brightness * twinkle;

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawTunnel(ctx) {
  const renderOffsetR = getRenderOffsetR();
  const startTheta = gameState.distance - SPIRAL_RENDER_BEHIND;
  const endTheta = gameState.distance + SPIRAL_RENDER_AHEAD;

  // Dynamic neon color cycle
  const neonHue = (Date.now() / 80) % 360;
  const neonColor = `hsl(${neonHue}, 100%, 50%)`;
  const neonColorDim = `hsl(${neonHue}, 80%, 35%)`;

  // Inner wall
  ctx.save();
  ctx.lineWidth = TUNNEL_LINE_WIDTH;
  ctx.strokeStyle = neonColor;
  ctx.shadowBlur = TUNNEL_GLOW_BLUR;
  ctx.shadowColor = neonColor;

  ctx.beginPath();
  let first = true;
  for (let t = startTheta; t < endTheta; t += SPIRAL_STEP) {
    const r = getSpiralRadius(t) - renderOffsetR;
    if (r < 10) continue;

    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    if (first) { ctx.moveTo(x, y); first = false; }
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Outer wall
  ctx.beginPath();
  first = true;
  for (let t = startTheta; t < endTheta; t += SPIRAL_STEP) {
    const r = getSpiralRadius(t) + TUNNEL_WIDTH - renderOffsetR;
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    if (first) { ctx.moveTo(x, y); first = false; }
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Inner dim guide line (middle of tunnel for visual depth)
  ctx.lineWidth = 1;
  ctx.strokeStyle = `hsla(${neonHue}, 60%, 30%, 0.15)`;
  ctx.shadowBlur = 0;
  ctx.beginPath();
  first = true;
  for (let t = startTheta; t < endTheta; t += SPIRAL_STEP * 2) {
    const r = getSpiralRadius(t) + TUNNEL_WIDTH / 2 - renderOffsetR;
    if (r < 10) continue;
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    if (first) { ctx.moveTo(x, y); first = false; }
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.restore();
}

export function drawVignette(ctx, canvas) {
  const grd = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.width * 0.25,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.7
  );
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
