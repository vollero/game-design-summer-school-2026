// STEP 07
// Un oggetto raggruppa le informazioni del giocatore.
// Questo aiuta quando il gioco cresce.

let player = {
  x: 360,
  y: 240,
  raggio: 28,
  colore: "#22c55e",
};

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");
  drawPlayer();
}

function drawPlayer() {
  noStroke();
  fill(player.colore);
  circle(player.x, player.y, player.raggio * 2);

  fill("#052e16");
  circle(player.x + 9, player.y - 7, 8);
}

