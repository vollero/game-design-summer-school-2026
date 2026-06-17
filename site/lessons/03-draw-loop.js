// STEP 03
// draw() viene chiamata tante volte al secondo.
// frameCount aumenta di 1 a ogni fotogramma.

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");

  let oscillazione = Math.sin(frameCount * 0.05) * 80;

  noStroke();
  fill("#38bdf8");
  circle(360 + oscillazione, 240, 80);

  fill("#e5e7eb");
  textSize(18);
  text("frame: " + frameCount, 24, 36);
}

