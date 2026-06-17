// STEP 20
// Mini shooter completo.
// Muovi con WASD o frecce. Lo sparo e' automatico.
// Dopo il game over premi SPAZIO per ricominciare.

let player;
let bullets;
let enemies;
let particles;
let score;
let gameOver;

function setup() {
  createCanvas(720, 480);
  resetGame();
}

function draw() {
  background("#101827");
  drawGrid();

  if (!gameOver) {
    movePlayer();
    if (frameCount % 14 === 0) shoot();
    if (frameCount % 34 === 0) spawnEnemy();
    updateBullets();
    updateEnemies();
    checkBulletEnemyCollisions();
    checkPlayerEnemyCollisions();
    if (player.invulnerabile > 0) player.invulnerabile -= 1;
  } else if (keyIsDown(SPACE)) {
    resetGame();
  }

  updateParticles();
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
    raggio: 26,
    velocita: 5.2,
    dirX: 1,
    dirY: 0,
    lives: 3,
    invulnerabile: 0,
  };
  bullets = [];
  enemies = [];
  particles = [];
  score = 0;
  gameOver = false;
  clearLog();
}

function drawGrid() {
  stroke("#1f2a44");
  strokeWeight(1);
  for (let x = 0; x <= width; x += 40) line(x, 0, x, height);
  for (let y = 0; y <= height; y += 40) line(0, y, width, y);
}

function movePlayer() {
  let moveX = 0;
  let moveY = 0;

  if (keyIsDown(LEFT_ARROW) || keyIsDown("a")) moveX -= 1;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown("d")) moveX += 1;
  if (keyIsDown(UP_ARROW) || keyIsDown("w")) moveY -= 1;
  if (keyIsDown(DOWN_ARROW) || keyIsDown("s")) moveY += 1;

  if (moveX !== 0 || moveY !== 0) {
    let lunghezza = Math.hypot(moveX, moveY);
    player.dirX = moveX / lunghezza;
    player.dirY = moveY / lunghezza;
    player.x += player.dirX * player.velocita;
    player.y += player.dirY * player.velocita;
  }

  player.x = constrain(player.x, player.raggio, width - player.raggio);
  player.y = constrain(player.y, player.raggio, height - player.raggio);
}

function shoot() {
  bullets.push({
    x: player.x + player.dirX * player.raggio,
    y: player.y + player.dirY * player.raggio,
    vx: player.dirX * 10,
    vy: player.dirY * 10,
    raggio: 6,
  });
}

function spawnEnemy() {
  let side = Math.floor(random(4));
  let enemy = {
    x: 0,
    y: 0,
    raggio: random(18, 28),
    velocita: random(1.5, 2.7) + score * 0.002,
  };

  if (side === 0) { enemy.x = random(width); enemy.y = -enemy.raggio; }
  if (side === 1) { enemy.x = width + enemy.raggio; enemy.y = random(height); }
  if (side === 2) { enemy.x = random(width); enemy.y = height + enemy.raggio; }
  if (side === 3) { enemy.x = -enemy.raggio; enemy.y = random(height); }

  enemies.push(enemy);
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    if (bullet.x < -30 || bullet.x > width + 30 || bullet.y < -30 || bullet.y > height + 30) {
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
        burst(enemy.x, enemy.y, "#facc15", 12);
        bullets.splice(b, 1);
        enemies.splice(e, 1);
        score += 10;
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
      burst(player.x, player.y, "#93c5fd", 18);
      player.lives -= 1;
      player.invulnerabile = 75;
      enemies.splice(i, 1);
      log("Impatto! vite rimaste: " + player.lives);
      if (player.lives <= 0) {
        gameOver = true;
        log("Game over. Premi SPAZIO per ricominciare.");
      }
    }
  }
}

function burst(x, y, color, amount) {
  for (let i = 0; i < amount; i++) {
    let angle = random(Math.PI * 2);
    let speed = random(1.2, 4.2);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: random(16, 28),
      color,
    });
  }
}

function drawPlayer() {
  let noseX = player.x + player.dirX * 48;
  let noseY = player.y + player.dirY * 48;

  stroke("#e5e7eb");
  strokeWeight(6);
  line(player.x, player.y, noseX, noseY);

  noStroke();
  fill(player.invulnerabile > 0 ? "#93c5fd" : "#22c55e");
  circle(player.x, player.y, player.raggio * 2);

  fill("#052e16");
  circle(player.x + player.dirX * 12, player.y + player.dirY * 12, 9);
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
    fill("#ef4444");
    circle(enemy.x, enemy.y, enemy.raggio * 2);
    fill("#7f1d1d");
    circle(enemy.x + enemy.raggio * 0.25, enemy.y - enemy.raggio * 0.18, enemy.raggio * 0.35);
  }
}

function drawParticles() {
  noStroke();
  for (let p of particles) {
    fill(p.color);
    circle(p.x, p.y, p.life * 0.45);
  }
}

function drawUi() {
  noStroke();
  fill("#e5e7eb");
  textSize(22);
  text("score: " + score, 24, 34);
  text("vite: " + player.lives, 24, 64);
  text("nemici: " + enemies.length, 24, 94);

  if (gameOver) {
    fill("rgba(15, 23, 42, 0.75)");
    rect(165, 150, 390, 170);
    fill("#facc15");
    textSize(42);
    text("GAME OVER", 232, 218);
    fill("#e5e7eb");
    textSize(20);
    text("Premi SPAZIO per ripartire", 238, 264);
  }
}

