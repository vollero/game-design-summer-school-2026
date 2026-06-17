// STEP 09
// Aggiungiamo il movimento verticale.
// Ora il giocatore si muove in quattro direzioni.

let player = {
  x: 360,
  y: 240,
  raggio: 28,
  velocita: 5,
};

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");

  if (keyIsDown(LEFT_ARROW) || keyIsDown("a")) player.x -= player.velocita;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown("d")) player.x += player.velocita;
  if (keyIsDown(UP_ARROW) || keyIsDown("w")) player.y -= player.velocita;
  if (keyIsDown(DOWN_ARROW) || keyIsDown("s")) player.y += player.velocita;

  noStroke();
  fill("#22c55e");
  circle(player.x, player.y, player.raggio * 2);
}

