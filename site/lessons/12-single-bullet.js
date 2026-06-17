// STEP 12
// Il gioco spara automaticamente ogni pochi frame.
// Per ora esiste un solo proiettile alla volta.

let player = {
  x: 360,
  y: 240,
  raggio: 28,
  velocita: 5,
  dirX: 1,
  dirY: 0,
};

let bullet = null;

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");
  movePlayer();

  if (frameCount % 35 === 0) {
    bullet = {
      x: player.x,
      y: player.y,
      vx: player.dirX * 9,
      vy: player.dirY * 9,
      raggio: 7,
    };
  }

  if (bullet !== null) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
  }

  drawPlayer();
  drawBullet();
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

function drawPlayer() {
  stroke("#e5e7eb");
  strokeWeight(5);
  line(player.x, player.y, player.x + player.dirX * 48, player.y + player.dirY * 48);
  noStroke();
  fill("#22c55e");
  circle(player.x, player.y, player.raggio * 2);
}

function drawBullet() {
  if (bullet === null) return;
  noStroke();
  fill("#facc15");
  circle(bullet.x, bullet.y, bullet.raggio * 2);
}

