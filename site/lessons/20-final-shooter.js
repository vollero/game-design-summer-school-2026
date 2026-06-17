// STEP 20
// Mini shooter completo.
// Freccia sinistra/destra: ruota.
// Freccia su/giu: avanti e indietro.
// Lo sparo e' automatico. Prendi i bonus per cambiare arma.
// Dopo il game over premi SPAZIO per ricominciare.

const CANVAS_WIDTH = 1440;
const CANVAS_HEIGHT = 960;
const TRIPLE_SPREAD = 20 * Math.PI / 180;

let player;
let bullets;
let enemies;
let particles;
let powerUps;
let score;
let gameOver;

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  resetGame();
}

function draw() {
  background("#101827");
  drawGrid();

  if (!gameOver) {
    controlPlayer();
    if (frameCount % getFireDelay() === 0) shoot();
    if (frameCount % 30 === 0) spawnEnemy();
    if (frameCount % 360 === 0) spawnPowerUp();

    updateBullets();
    updateEnemies();
    updatePowerUps();
    checkBulletEnemyCollisions();
    checkPlayerEnemyCollisions();
    checkPlayerPowerUpCollisions();

    if (player.invulnerabile > 0) player.invulnerabile -= 1;
    if (player.weaponTimer > 0) {
      player.weaponTimer -= 1;
      if (player.weaponTimer === 0) player.weapon = "single";
    }
  } else if (keyIsDown(SPACE)) {
    resetGame();
  }

  updateParticles();
  drawPowerUps();
  drawBullets();
  drawEnemies();
  drawParticles();
  drawPlayer();
  drawUi();
}

function resetGame() {
  player = {
    x: width / 2,
    y: height / 2,
    raggio: 34,
    velocitaAvanti: 7.6,
    velocitaIndietro: 4.3,
    rotazione: 0.07,
    angle: -Math.PI / 2,
    lives: 3,
    maxLives: 4,
    invulnerabile: 0,
    weapon: "single",
    weaponTimer: 0,
  };
  bullets = [];
  enemies = [];
  particles = [];
  powerUps = [];
  score = 0;
  gameOver = false;
  clearLog();
}

function drawGrid() {
  stroke("#1f2a44");
  strokeWeight(1);
  for (let x = 0; x <= width; x += 80) line(x, 0, x, height);
  for (let y = 0; y <= height; y += 80) line(0, y, width, y);
}

function controlPlayer() {
  if (keyIsDown(LEFT_ARROW) || keyIsDown("a")) player.angle -= player.rotazione;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown("d")) player.angle += player.rotazione;

  let dirX = Math.cos(player.angle);
  let dirY = Math.sin(player.angle);

  if (keyIsDown(UP_ARROW) || keyIsDown("w")) {
    player.x += dirX * player.velocitaAvanti;
    player.y += dirY * player.velocitaAvanti;
  }

  if (keyIsDown(DOWN_ARROW) || keyIsDown("s")) {
    player.x -= dirX * player.velocitaIndietro;
    player.y -= dirY * player.velocitaIndietro;
  }

  player.x = constrain(player.x, player.raggio, width - player.raggio);
  player.y = constrain(player.y, player.raggio, height - player.raggio);
}

function getFireDelay() {
  return player.weapon === "triple" ? 18 : 14;
}

function shoot() {
  let angles = player.weapon === "triple"
    ? [player.angle - TRIPLE_SPREAD / 2, player.angle, player.angle + TRIPLE_SPREAD / 2]
    : [player.angle];

  for (let angle of angles) {
    let dirX = Math.cos(angle);
    let dirY = Math.sin(angle);
    bullets.push({
      x: player.x + dirX * player.raggio,
      y: player.y + dirY * player.raggio,
      vx: dirX * 16,
      vy: dirY * 16,
      raggio: 7,
    });
  }
}

function spawnEnemy() {
  let side = Math.floor(random(4));
  let fast = random(1) < 0.25;
  let enemy = {
    x: 0,
    y: 0,
    raggio: fast ? random(22, 30) : random(32, 48),
    velocita: fast ? random(4.0, 5.3) : random(2.2, 3.4),
    color: fast ? "#a855f7" : "#ef4444",
    eye: fast ? "#4c1d95" : "#7f1d1d",
    scoreValue: fast ? 15 : 10,
  };

  enemy.velocita += score * 0.0015;

  if (side === 0) { enemy.x = random(width); enemy.y = -enemy.raggio; }
  if (side === 1) { enemy.x = width + enemy.raggio; enemy.y = random(height); }
  if (side === 2) { enemy.x = random(width); enemy.y = height + enemy.raggio; }
  if (side === 3) { enemy.x = -enemy.raggio; enemy.y = random(height); }

  enemies.push(enemy);
}

function spawnPowerUp() {
  if (powerUps.length >= 3) return;

  let type = random(1) < 0.75 ? "triple" : "repair";
  powerUps.push({
    x: random(120, width - 120),
    y: random(120, height - 120),
    raggio: 28,
    type,
    life: 900,
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    if (bullet.x < -40 || bullet.x > width + 40 || bullet.y < -40 || bullet.y > height + 40) {
      bullets.splice(i, 1);
    }
  }
}

function updateEnemies() {
  for (let enemy of enemies) {
    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;
    let lunghezza = Math.max(0.001, Math.hypot(dx, dy));
    enemy.x += (dx / lunghezza) * enemy.velocita;
    enemy.y += (dy / lunghezza) * enemy.velocita;
  }
}

function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].life -= 1;
    if (powerUps[i].life <= 0) powerUps.splice(i, 1);
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= 1;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function checkBulletEnemyCollisions() {
  for (let b = bullets.length - 1; b >= 0; b--) {
    for (let e = enemies.length - 1; e >= 0; e--) {
      let bullet = bullets[b];
      let enemy = enemies[e];
      if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < bullet.raggio + enemy.raggio) {
        burst(enemy.x, enemy.y, "#facc15", 14);
        bullets.splice(b, 1);
        enemies.splice(e, 1);
        score += enemy.scoreValue;
        break;
      }
    }
  }
}

function checkPlayerEnemyCollisions() {
  if (player.invulnerabile > 0) return;

  for (let i = enemies.length - 1; i >= 0; i--) {
    let enemy = enemies[i];
    if (dist(player.x, player.y, enemy.x, enemy.y) < player.raggio + enemy.raggio) {
      burst(player.x, player.y, "#93c5fd", 22);
      player.lives -= 1;
      player.invulnerabile = 90;
      enemies.splice(i, 1);
      log("Impatto! vite rimaste: " + player.lives);
      if (player.lives <= 0) {
        gameOver = true;
        log("Game over. Premi SPAZIO per ricominciare.");
      }
    }
  }
}

function checkPlayerPowerUpCollisions() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    let powerUp = powerUps[i];
    if (dist(player.x, player.y, powerUp.x, powerUp.y) < player.raggio + powerUp.raggio) {
      if (powerUp.type === "triple") {
        player.weapon = "triple";
        player.weaponTimer = 720;
        burst(powerUp.x, powerUp.y, "#38bdf8", 18);
        log("Bonus arma: triplo colpo per 12 secondi.");
      } else {
        player.lives = Math.min(player.maxLives, player.lives + 1);
        burst(powerUp.x, powerUp.y, "#22c55e", 18);
        log("Bonus riparazione: vite " + player.lives + "/" + player.maxLives + ".");
      }

      powerUps.splice(i, 1);
    }
  }
}

function burst(x, y, color, amount) {
  for (let i = 0; i < amount; i++) {
    let angle = random(Math.PI * 2);
    let speed = random(1.8, 6.2);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: random(18, 34),
      color,
    });
  }
}

function drawPlayer() {
  let dirX = Math.cos(player.angle);
  let dirY = Math.sin(player.angle);
  let perpX = -dirY;
  let perpY = dirX;

  let noseX = player.x + dirX * 58;
  let noseY = player.y + dirY * 58;
  let tailX = player.x - dirX * 34;
  let tailY = player.y - dirY * 34;

  stroke(player.weapon === "triple" ? "#38bdf8" : "#e5e7eb");
  strokeWeight(7);
  line(player.x, player.y, noseX, noseY);

  noStroke();
  fill(player.invulnerabile > 0 ? "#93c5fd" : "#22c55e");
  triangle(
    noseX,
    noseY,
    tailX + perpX * 30,
    tailY + perpY * 30,
    tailX - perpX * 30,
    tailY - perpY * 30
  );

  fill("#052e16");
  circle(player.x + dirX * 14, player.y + dirY * 14, 11);

  if (player.invulnerabile > 0) {
    noFill();
    stroke("#93c5fd");
    strokeWeight(4);
    circle(player.x, player.y, player.raggio * 2.8);
  }
}

function drawBullets() {
  noStroke();
  fill("#facc15");
  for (let bullet of bullets) {
    circle(bullet.x, bullet.y, bullet.raggio * 2);
  }
}

function drawEnemies() {
  noStroke();
  for (let enemy of enemies) {
    fill(enemy.color);
    circle(enemy.x, enemy.y, enemy.raggio * 2);
    fill(enemy.eye);
    circle(enemy.x + enemy.raggio * 0.25, enemy.y - enemy.raggio * 0.18, enemy.raggio * 0.35);
  }
}

function drawPowerUps() {
  for (let powerUp of powerUps) {
    let pulse = Math.sin(frameCount * 0.12) * 5;
    let color = powerUp.type === "triple" ? "#38bdf8" : "#22c55e";

    fill(powerUp.type === "triple" ? "rgba(56, 189, 248, 0.22)" : "rgba(34, 197, 94, 0.22)");
    stroke(color);
    strokeWeight(4);
    circle(powerUp.x, powerUp.y, powerUp.raggio * 2 + pulse);

    noStroke();
    fill(color);
    if (powerUp.type === "triple") {
      circle(powerUp.x, powerUp.y, 8);
      circle(powerUp.x - 16, powerUp.y + 12, 8);
      circle(powerUp.x + 16, powerUp.y + 12, 8);
    } else {
      rect(powerUp.x - 5, powerUp.y - 20, 10, 40);
      rect(powerUp.x - 20, powerUp.y - 5, 40, 10);
    }
  }
}

function drawParticles() {
  noStroke();
  for (let p of particles) {
    fill(p.color);
    circle(p.x, p.y, p.life * 0.5);
  }
}

function drawUi() {
  noStroke();
  fill("#e5e7eb");
  textSize(28);
  text("score: " + score, 32, 44);
  text("vite: " + player.lives + "/" + player.maxLives, 32, 84);
  text("nemici: " + enemies.length, 32, 124);

  let weaponText = player.weapon === "triple"
    ? "arma: triplo " + Math.ceil(player.weaponTimer / 60) + "s"
    : "arma: singola";
  text(weaponText, 32, 164);

  textSize(20);
  fill("#94a3b8");
  text("sinistra/destra: ruota  |  su/giu: avanti/indietro", 32, height - 30);

  if (gameOver) {
    fill("rgba(15, 23, 42, 0.78)");
    rect(width / 2 - 280, height / 2 - 125, 560, 250);
    fill("#facc15");
    textSize(58);
    text("GAME OVER", width / 2 - 185, height / 2 - 24);
    fill("#e5e7eb");
    textSize(26);
    text("Premi SPAZIO per ripartire", width / 2 - 170, height / 2 + 40);
  }
}

