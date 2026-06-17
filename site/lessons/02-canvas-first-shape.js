// STEP 02
// Un videogioco ha bisogno di uno spazio dove disegnare.
// Le coordinate partono dall'angolo in alto a sinistra.

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");

  noStroke();
  fill("#22c55e");
  circle(360, 240, 80);
}

