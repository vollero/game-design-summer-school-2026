// STEP 14
// I nemici nascono ai bordi.
// Per ora restano fermi: prima creiamo la lista, poi la faremo muovere.

let player = {
  x: 360,
  y: 240,
  raggio: 28,
  velocita: 5,
  dirX: 1,
  dirY: 0,
};

let enemies = [];

function setup() {
  createCanvas(720, 480);
}

function draw() {
  background("#172033");
  movePlayer();

  if (frameCount % 45 === 0) {
    spawnEnemy();
  }

  drawPlayer();
  drawEnemies();
}

function spawnEnemy() {
  let side = Math.floor(random(4));
  let enemy = { x: 0, y: 0, raggio: 22 };

  if (side === 0) {
    enemy.x = random(width);
    enemy.y = -enemy.raggio;
  } else if (side === 1) {
    enemy.x = width + enemy.raggio;
    enemy.y = random(height);
  } else if (side === 2) {
    enemy.x = random(width);
    enemy.y = height + enemy.raggio;
  } else {
    enemy.x = -enemy.raggio;
    enemy.y = random(height);
  }

  enemies.push(enemy);
}

function movePlayer() {
  if (keyIsDown(LEFT_ARROW) || keyIsDown("a")) player.x -= player.velocita;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown("d")) player.x += player.velocita;
  if (keyIsDown(UP_ARROW) || keyIsDown("w")) player.y -= player.velocita;
  if (keyIsDown(DOWN_ARROW) || keyIsDown("s")) player.y += player.velocita;
  player.x = constrain(player.x, player.raggio, width - player.raggio);
  player.y = constrain(player.y, player.raggio, height - player.raggio);
}

function drawPlayer() {
  noStroke();
  fill("#22c55e");
  circle(player.x, player.y, player.raggio * 2);
}

function drawEnemies() {
  noStroke();
  fill("#ef4444");
  for (let enemy of enemies) {
    circle(enemy.x, enemy.y, enemy.raggio * 2);
  }
}

