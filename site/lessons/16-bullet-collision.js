// STEP 16
// Una collisione puo' essere un controllo sulla distanza.
// Se distanza < somma dei raggi, gli oggetti si toccano.

let player = {
  x: 360,
  y: 240,
  raggio: 28,
  velocita: 5,
  dirX: 1,
  dirY: 0,
};

let bullets = [];
let enemies = [];

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");
  movePlayer();

  if (frameCount % 18 === 0) shoot();
  if (frameCount % 45 === 0) spawnEnemy();

  updateBullets();
  updateEnemies();
  checkBulletEnemyCollisions();

  drawPlayer();
  drawBullets();
  drawEnemies();
}

function shoot() {
  bullets.push({
    x: player.x,
    y: player.y,
    vx: player.dirX * 9,
    vy: player.dirY * 9,
    raggio: 7,
  });
}

function spawnEnemy() {
  let side = Math.floor(random(4));
  let enemy = { x: 0, y: 0, raggio: 22, velocita: 1.8 };
  if (side === 0) { enemy.x = random(width); enemy.y = -enemy.raggio; }
  if (side === 1) { enemy.x = width + enemy.raggio; enemy.y = random(height); }
  if (side === 2) { enemy.x = random(width); enemy.y = height + enemy.raggio; }
  if (side === 3) { enemy.x = -enemy.raggio; enemy.y = random(height); }
  enemies.push(enemy);
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

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let bullet = bullets[i];
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    if (bullet.x < -20 || bullet.x > width + 20 || bullet.y < -20 || bullet.y > height + 20) {
      bullets.splice(i, 1);
    }
  }
}

function updateEnemies() {
  for (let enemy of enemies) {
    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;
    let lunghezza = Math.hypot(dx, dy);
    enemy.x += (dx / lunghezza) * enemy.velocita;
    enemy.y += (dy / lunghezza) * enemy.velocita;
  }
}

function checkBulletEnemyCollisions() {
  for (let b = bullets.length - 1; b >= 0; b--) {
    for (let e = enemies.length - 1; e >= 0; e--) {
      let bullet = bullets[b];
      let enemy = enemies[e];
      if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < bullet.raggio + enemy.raggio) {
        bullets.splice(b, 1);
        enemies.splice(e, 1);
        break;
      }
    }
  }
}

function drawPlayer() {
  stroke("#e5e7eb");
  strokeWeight(5);
  line(player.x, player.y, player.x + player.dirX * 48, player.y + player.dirY * 48);
  noStroke();
  fill("#22c55e");
  circle(player.x, player.y, player.raggio * 2);
}

function drawBullets() {
  noStroke();
  fill("#facc15");
  for (let bullet of bullets) circle(bullet.x, bullet.y, bullet.raggio * 2);
}

function drawEnemies() {
  noStroke();
  fill("#ef4444");
  for (let enemy of enemies) circle(enemy.x, enemy.y, enemy.raggio * 2);
}

