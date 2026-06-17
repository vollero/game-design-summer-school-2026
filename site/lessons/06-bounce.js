// STEP 06
// Se l'oggetto tocca un bordo, invertiamo la velocita'.
// Questo e' il primo esempio di regola di gioco.

let x = 80;
let y = 240;
let raggio = 35;
let velocitaX = 4;

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");

  x = x + velocitaX;

  if (x > width - raggio || x < raggio) {
    velocitaX = velocitaX * -1;
  }

  noStroke();
  fill("#facc15");
  circle(x, y, raggio * 2);
}

