// STEP 13
// Un array contiene molti oggetti dello stesso tipo.
// Qui ogni proiettile e' un elemento della lista bullets.

let player = {
  x: 360,
  y: 240,
  raggio: 28,
  velocitaAvanti: 4.8,
  velocitaIndietro: 2.8,
  rotazione: 0.07,
  angle: -Math.PI / 2,
};

let bullets = [];

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");
  controlPlayer();

  if (frameCount % 18 === 0) {
    shoot();
  }

  updateBullets();
  drawPlayer();
  drawBullets();
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

function shoot() {
  let dirX = Math.cos(player.angle);
  let dirY = Math.sin(player.angle);
  bullets.push({
    x: player.x + dirX * player.raggio,
    y: player.y + dirY * player.raggio,
    vx: dirX * 9,
    vy: dirY * 9,
    raggio: 7,
  });
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
  let dirX = Math.cos(player.angle);
  let dirY = Math.sin(player.angle);

  stroke("#e5e7eb");
  strokeWeight(5);
  line(player.x, player.y, player.x + dirX * 48, player.y + dirY * 48);

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

