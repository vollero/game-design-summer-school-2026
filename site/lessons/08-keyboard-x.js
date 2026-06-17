// STEP 08
// keyIsDown controlla se un tasto e' premuto.
// Freccia sinistra/destra oppure A/D.

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

  if (keyIsDown(LEFT_ARROW) || keyIsDown("a")) {
    player.x = player.x - player.velocita;
  }

  if (keyIsDown(RIGHT_ARROW) || keyIsDown("d")) {
    player.x = player.x + player.velocita;
  }

  noStroke();
  fill("#22c55e");
  circle(player.x, player.y, player.raggio * 2);
}

