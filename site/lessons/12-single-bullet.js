// STEP 12
// Il gioco spara automaticamente ogni pochi frame.
// Per ora esiste un solo proiettile alla volta.
// La direzione del proiettile viene dall'angolo del giocatore.

let player = {
  x: 360,
  y: 240,
  raggio: 28,
  velocitaAvanti: 4.8,
  velocitaIndietro: 2.8,
  rotazione: 0.07,
  angle: -Math.PI / 2,
};

let bullet = null;

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");
  controlPlayer();

  if (frameCount % 35 === 0) {
    shoot();
  }

  if (bullet !== null) {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
  }

  drawPlayer();
  drawBullet();
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
  bullet = {
    x: player.x + dirX * player.raggio,
    y: player.y + dirY * player.raggio,
    vx: dirX * 9,
    vy: dirY * 9,
    raggio: 7,
  };
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

function drawBullet() {
  if (bullet === null) return;
  noStroke();
  fill("#facc15");
  circle(bullet.x, bullet.y, bullet.raggio * 2);
}

