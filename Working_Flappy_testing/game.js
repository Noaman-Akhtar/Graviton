const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const TUNNEL_WIDTH = 180;
const SPIRAL_GROWTH = 28.65;
const FLAP_STRENGTH = 4.5;
const GRAVITY = 0.2;
const BASE_SCROLL_SPEED = 0.012;
const MAX_SCROLL_SPEED = 0.045;
const START_RADIUS = 150;

let gameState = {
  distance: 0,
  height: TUNNEL_WIDTH / 2,
  velocity: 0,
  obstacles: [],
  score: 0,
  gameOver: false,
  gameStarted: false,
  highScore: localStorage.getItem('spiralFlappyHighScore') || 0
};

function flap() {
  if (gameState.gameOver) {
    resetGame();
    return;
  }
  if (!gameState.gameStarted) {
    gameState.gameStarted = true;
    gameState.velocity = FLAP_STRENGTH;
    return;
  }
  gameState.velocity = FLAP_STRENGTH;
}

window.addEventListener("keydown", e => {
  if (e.code === "Space") flap();
});
window.addEventListener("mousedown", flap);
window.addEventListener("touchstart", (e) => {
  e.preventDefault();
  flap();
}, { passive: false });

function resetGame() {
  gameState = {
    distance: 0,
    height: TUNNEL_WIDTH / 2,
    velocity: 0,
    obstacles: [],
    score: 0,
    gameOver: false,
    gameStarted: false,
    highScore: gameState.highScore
  };
  
  for (let i = 0; i < 5; i++) {
    addObstacle(Math.PI / 2 + i * Math.PI / 2.5);
  }
}

function addObstacle(angle) {
  let gapSize = 135;

  if (gameState.score < 30) {
    if (gameState.score >= 5) {
      const difficultyLevel = Math.floor(gameState.score / 5);
      gapSize = 135 - (difficultyLevel * 5);
    }
  } else if (gameState.score < 70) {
    if (gameState.score < 40) {
      gapSize = 100;
    } else if (gameState.score < 55) {
      gapSize = 90;
    } else {
      gapSize = 80;
    }
  } else {
    const levelsAfter70 = Math.floor((gameState.score - 70) / 15);
    gapSize = 80 - levelsAfter70;
    gapSize = Math.max(gapSize, 50);
  }

  gameState.obstacles.push({
    angle: angle,
    gapSize: gapSize,
    gapPos: Math.random() * (TUNNEL_WIDTH - gapSize - 10) + 5,
    width: 0.1,
    passed: false,
    color: `hsl(${Math.random() * 360}, 100%, 60%)`
  });
}

function update() {
  if (gameState.gameOver) return;
  if (!gameState.gameStarted) {
    gameState.height = TUNNEL_WIDTH / 2 + Math.sin(Date.now() / 300) * 10;
    return;
  }

  let currentScrollSpeed = BASE_SCROLL_SPEED;
  if (gameState.score >= 15) {
    const speedLevels = Math.floor(gameState.score / 15);
    const speedIncrease = speedLevels * 0.005;
    currentScrollSpeed = BASE_SCROLL_SPEED + speedIncrease;
    currentScrollSpeed = Math.min(currentScrollSpeed, MAX_SCROLL_SPEED);
  }

  gameState.velocity -= GRAVITY;
  gameState.height += gameState.velocity;
  gameState.distance += currentScrollSpeed;

  if (gameState.height < 5 || gameState.height > TUNNEL_WIDTH - 5) {
    gameOver();
  }

  if (gameState.obstacles.length > 0 && gameState.obstacles[0].angle < gameState.distance - Math.PI) {
    gameState.obstacles.shift();
  }

  const lastObs = gameState.obstacles[gameState.obstacles.length - 1];
  if (lastObs.angle < gameState.distance + Math.PI * 3) {
    addObstacle(lastObs.angle + Math.PI / 2.5 + Math.random() * 0.3);
  }

  gameState.obstacles.forEach(obs => {
    const distToObs = obs.angle - gameState.distance;

    if (distToObs < 0.05 && distToObs > -0.05) {
      const pBottom = gameState.height - 8;
      const pTop = gameState.height + 8;
      const gBottom = obs.gapPos;
      const gTop = obs.gapPos + obs.gapSize;

      if (pBottom < gBottom || pTop > gTop) {
        gameOver();
      } else if (!obs.passed) {
        obs.passed = true;
        gameState.score++;
        if (gameState.score > gameState.highScore) {
          gameState.highScore = gameState.score;
          localStorage.setItem('spiralFlappyHighScore', gameState.highScore);
        }
      }
    }
  });
}

function gameOver() {
  gameState.gameOver = true;
  console.log("Dead");
}

function getSpiralRadius(theta) {
  return START_RADIUS + SPIRAL_GROWTH * theta;
}

function draw() {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
    if (r < 10) continue;

    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    if (first) { ctx.moveTo(x, y); first = false; }
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.beginPath();
  first = true;
  for (let t = startTheta; t < endTheta; t += step) {
    const r = getSpiralRadius(t) + TUNNEL_WIDTH - renderOffsetR;
    const x = r * Math.cos(t);
    const y = r * Math.sin(t);
    if (first) { ctx.moveTo(x, y); first = false; }
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.shadowBlur = 0;

  for (let obs of gameState.obstacles) {
    if (obs.angle < startTheta || obs.angle > endTheta) continue;

    const rInner = getSpiralRadius(obs.angle) - renderOffsetR;
    const rOuter = rInner + TUNNEL_WIDTH;

    const gapStart = rInner + obs.gapPos;
    const gapEnd = gapStart + obs.gapSize;

    ctx.strokeStyle = obs.color;
    ctx.lineWidth = 25;
    ctx.lineCap = 'butt';

    const barPadding = 1;

    ctx.beginPath();
    ctx.moveTo((rInner + barPadding) * Math.cos(obs.angle), (rInner + barPadding) * Math.sin(obs.angle));
    ctx.lineTo((gapStart - barPadding) * Math.cos(obs.angle), (gapStart - barPadding) * Math.sin(obs.angle));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo((gapEnd + barPadding) * Math.cos(obs.angle), (gapEnd + barPadding) * Math.sin(obs.angle));
    ctx.lineTo((rOuter - barPadding) * Math.cos(obs.angle), (rOuter - barPadding) * Math.sin(obs.angle));
    ctx.stroke();
  }

  const playerScreenR = START_RADIUS + gameState.height;
  const px = playerScreenR * Math.cos(gameState.distance);
  const py = playerScreenR * Math.sin(gameState.distance);

  ctx.fillStyle = '#fff';
  if (gameState.gameOver) ctx.fillStyle = '#ff4444';

  ctx.beginPath();
  ctx.arc(px, py, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(px, py, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (gameState.gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", cx, cy - 20);
    ctx.font = "20px sans-serif";
    ctx.fillText("Space or Tap to Restart", cx, cy + 30);
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
    ctx.fillText(gameState.score, 40, 50);
  }

  requestAnimationFrame(update);
  requestAnimationFrame(draw);
}

resetGame();
requestAnimationFrame(update);
requestAnimationFrame(draw);