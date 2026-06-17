// STEP 10
// constrain tiene un numero dentro un minimo e un massimo.
// Il giocatore resta nello schermo.

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

  player.x = constrain(player.x, player.raggio, width - player.raggio);
  player.y = constrain(player.y, player.raggio, height - player.raggio);

  noStroke();
  fill("#22c55e");
  circle(player.x, player.y, player.raggio * 2);
}

