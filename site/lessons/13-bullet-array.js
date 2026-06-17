// STEP 13
// Un array contiene molti oggetti dello stesso tipo.
// Qui ogni proiettile e' un elemento della lista bullets.

let player = {
  x: 360,
  y: 240,
  raggio: 28,
  velocita: 5,
  dirX: 1,
  dirY: 0,
};

let bullets = [];

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");
  movePlayer();

  if (frameCount % 18 === 0) {
    bullets.push({
      x: player.x,
      y: player.y,
      vx: player.dirX * 9,
      vy: player.dirY * 9,
      raggio: 7,
    });
  }

  updateBullets();
  drawPlayer();
  drawBullets();
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

    let fuori = bullet.x < -20 || bullet.x > width + 20 || bullet.y < -20 || bullet.y > height + 20;
    if (fuori) {
      bullets.splice(i, 1);
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
  for (let bullet of bullets) {
    circle(bullet.x, bullet.y, bullet.raggio * 2);
  }
}

