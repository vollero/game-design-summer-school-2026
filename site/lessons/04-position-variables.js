// STEP 04
// I numeri importanti diventano variabili.
// Ora possiamo cambiare x, y e dimensione in un solo punto.

let x = 360;
let y = 240;
let dimensione = 80;

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");

  noStroke();
  fill("#f59e0b");
  circle(x, y, dimensione);
}

