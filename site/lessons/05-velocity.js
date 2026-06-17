// STEP 05
// La velocita' dice quanto cambia la posizione a ogni frame.
// Prova a modificare velocitaX.

let x = 80;
let y = 240;
let dimensione = 70;
let velocitaX = 3;

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");

  x = x + velocitaX;

  noStroke();
  fill("#f97316");
  circle(x, y, dimensione);
}

