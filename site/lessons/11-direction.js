// STEP 11
// Direzionare non significa solo spostarsi.
// Sinistra/destra ruotano il personaggio.
// Su/giu lo fanno avanzare o arretrare lungo la direzione corrente.

let player = {
  x: 360,
  y: 240,
  raggio: 28,
  velocitaAvanti: 4.8,
  velocitaIndietro: 2.8,
  rotazione: 0.07,
  angle: -Math.PI / 2,
};

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");
  controlPlayer();
  drawPlayer();
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

function drawPlayer() {
  let dirX = Math.cos(player.angle);
  let dirY = Math.sin(player.angle);
  let noseX = player.x + dirX * 48;
  let noseY = player.y + dirY * 48;

  stroke("#e5e7eb");
  strokeWeight(5);
  line(player.x, player.y, noseX, noseY);

  noStroke();
  fill("#22c55e");
  circle(player.x, player.y, player.raggio * 2);
}

