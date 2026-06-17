const canvas = document.querySelector("#arenaCanvas");
const ctx = canvas.getContext("2d");
const joinForm = document.querySelector("#joinForm");
const nameInput = document.querySelector("#nameInput");
const connectionStatus = document.querySelector("#connectionStatus");
const teamScore = document.querySelector("#teamScore");
const selfStatus = document.querySelector("#selfStatus");
const playerList = document.querySelector("#playerList");

const VIEWPORT = { width: 1440, height: 960 };

const state = {
  socket: null,
  selfId: null,
  name: localStorage.getItem("coopName") || "",
  connected: false,
  joined: false,
  snapshot: {
    world: { width: 2880, height: 1920 },
    teamScore: 0,
    players: [],
    bullets: [],
    enemies: [],
    powerUps: [],
  },
  input: {
    left: false,
    right: false,
    forward: false,
    back: false,
  },
};

nameInput.value = state.name;
connect();
requestAnimationFrame(render);
setInterval(sendInput, 50);

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim() || "Player";
  state.name = name;
  localStorage.setItem("coopName", name);
  join();
});

window.addEventListener("keydown", (event) => updateInput(event, true));
window.addEventListener("keyup", (event) => updateInput(event, false));

function connect() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${location.host}/ws`);
  state.socket = socket;
  setStatus("connessione");

  socket.addEventListener("open", () => {
    state.connected = true;
    setStatus("online");
    if (state.name) join();
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "hello") {
      state.selfId = message.id;
    } else if (message.type === "joined") {
      state.joined = true;
      state.selfId = message.id;
      joinForm.hidden = true;
    } else if (message.type === "snapshot") {
      state.snapshot = message;
      updateHud();
    }
  });

  socket.addEventListener("close", () => {
    state.connected = false;
    state.joined = false;
    joinForm.hidden = false;
    setStatus("offline");
    setTimeout(connect, 1200);
  });

  socket.addEventListener("error", () => {
    setStatus("errore");
  });
}

function join() {
  if (!state.connected || !state.socket || state.socket.readyState !== WebSocket.OPEN) return;
  state.socket.send(JSON.stringify({ type: "join", name: state.name }));
}

function updateInput(event, pressed) {
  const key = event.key.toLowerCase();
  let handled = true;

  if (event.key === "ArrowLeft" || key === "a") state.input.left = pressed;
  else if (event.key === "ArrowRight" || key === "d") state.input.right = pressed;
  else if (event.key === "ArrowUp" || key === "w") state.input.forward = pressed;
  else if (event.key === "ArrowDown" || key === "s") state.input.back = pressed;
  else handled = false;

  if (handled) {
    event.preventDefault();
    sendInput();
  }
}

function sendInput() {
  if (!state.joined || !state.socket || state.socket.readyState !== WebSocket.OPEN) return;
  state.socket.send(JSON.stringify({ type: "input", input: state.input }));
}

function updateHud() {
  teamScore.textContent = `score ${state.snapshot.teamScore}`;
  const self = state.snapshot.players.find((player) => player.id === state.selfId);
  if (self) {
    const weapon = self.weapon === "triple" ? `triplo ${Math.ceil(self.weaponTimer / 60)}s` : "singola";
    const respawn = self.respawnTimer > 0 ? ` rientro ${Math.ceil(self.respawnTimer / 60)}s` : "";
    selfStatus.textContent = `${self.name} · vite ${self.lives}/${self.maxLives} · arma ${weapon}${respawn}`;
  }

  playerList.innerHTML = "";
  for (const player of [...state.snapshot.players].sort((a, b) => b.score - a.score)) {
    const card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML = `
      <span class="player-dot" style="background:${player.color}"></span>
      <span>
        <strong>${escapeHtml(player.name)}</strong>
        <small>vite ${player.lives}/${player.maxLives} · ${player.weapon}</small>
      </span>
      <em>${player.score}</em>
    `;
    playerList.append(card);
  }
}

function setStatus(value) {
  connectionStatus.textContent = value;
}

function render() {
  const snapshot = state.snapshot;
  if (canvas.width !== VIEWPORT.width || canvas.height !== VIEWPORT.height) {
    canvas.width = VIEWPORT.width;
    canvas.height = VIEWPORT.height;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const camera = getCamera(snapshot);

  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  drawBackground(snapshot.world);
  drawPowerUps(snapshot.powerUps);
  drawBullets(snapshot.bullets);
  drawEnemies(snapshot.enemies);
  drawPlayers(snapshot.players);
  ctx.restore();

  drawMinimap(snapshot, camera);

  if (!state.joined) {
    drawCenterText("Arena cooperativa", "inserisci il nome e premi Entra");
  } else if (snapshot.players.length === 0) {
    drawCenterText("Connessione attiva", "in attesa della squadra");
  }

  requestAnimationFrame(render);
}

function getCamera(snapshot) {
  const world = snapshot.world;
  const focus = snapshot.players.find((player) => player.id === state.selfId) || {
    x: world.width / 2,
    y: world.height / 2,
  };

  return {
    x: clamp(focus.x - VIEWPORT.width / 2, 0, Math.max(0, world.width - VIEWPORT.width)),
    y: clamp(focus.y - VIEWPORT.height / 2, 0, Math.max(0, world.height - VIEWPORT.height)),
  };
}

function drawBackground(world) {
  ctx.fillStyle = "#101827";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.strokeStyle = "#1f2a44";
  ctx.lineWidth = 1;
  for (let x = 0; x <= world.width; x += 80) {
    line(x, 0, x, world.height);
  }
  for (let y = 0; y <= world.height; y += 80) {
    line(0, y, world.width, y);
  }

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, world.width, world.height);
}

function drawPlayers(players) {
  for (const player of players) {
    const dirX = Math.cos(player.angle);
    const dirY = Math.sin(player.angle);
    const perpX = -dirY;
    const perpY = dirX;
    const noseX = player.x + dirX * 58;
    const noseY = player.y + dirY * 58;
    const tailX = player.x - dirX * 34;
    const tailY = player.y - dirY * 34;

    ctx.globalAlpha = player.respawnTimer > 0 ? 0.35 : 1;
    ctx.strokeStyle = player.weapon === "triple" ? "#38bdf8" : "#e5e7eb";
    ctx.lineWidth = 7;
    line(player.x, player.y, noseX, noseY);

    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(noseX, noseY);
    ctx.lineTo(tailX + perpX * 30, tailY + perpY * 30);
    ctx.lineTo(tailX - perpX * 30, tailY - perpY * 30);
    ctx.closePath();
    ctx.fill();

    if (player.invulnerable > 0) {
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius * 1.45, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = player.id === state.selfId ? "#facc15" : "#e5e7eb";
    ctx.font = "24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(player.name, player.x, player.y - player.radius - 18);
  }
}

function drawBullets(bullets) {
  ctx.fillStyle = "#facc15";
  for (const bullet of bullets) {
    circle(bullet.x, bullet.y, bullet.radius);
  }
}

function drawEnemies(enemies) {
  for (const enemy of enemies) {
    const color = enemy.type === "fast" ? "#a855f7" : enemy.type === "tank" ? "#f97316" : "#ef4444";
    const eye = enemy.type === "fast" ? "#4c1d95" : enemy.type === "tank" ? "#7c2d12" : "#7f1d1d";

    ctx.fillStyle = color;
    circle(enemy.x, enemy.y, enemy.radius);
    ctx.fillStyle = eye;
    circle(enemy.x + enemy.radius * 0.25, enemy.y - enemy.radius * 0.18, enemy.radius * 0.18);

    if (enemy.hp > 1) {
      ctx.fillStyle = "#fff7ed";
      ctx.font = "20px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(enemy.hp, enemy.x, enemy.y + 7);
    }
  }
}

function drawPowerUps(powerUps) {
  for (const powerUp of powerUps) {
    const color = powerUp.type === "triple" ? "#38bdf8" : powerUp.type === "repair" ? "#22c55e" : "#93c5fd";
    const glow = powerUp.type === "triple" ? "rgba(56,189,248,0.22)" : powerUp.type === "repair" ? "rgba(34,197,94,0.22)" : "rgba(147,197,253,0.22)";
    const pulse = Math.sin(performance.now() / 140) * 5;

    ctx.fillStyle = glow;
    circle(powerUp.x, powerUp.y, powerUp.radius + pulse);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, powerUp.radius + pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = color;
    if (powerUp.type === "triple") {
      circle(powerUp.x, powerUp.y, 4);
      circle(powerUp.x - 16, powerUp.y + 12, 4);
      circle(powerUp.x + 16, powerUp.y + 12, 4);
    } else if (powerUp.type === "repair") {
      ctx.fillRect(powerUp.x - 5, powerUp.y - 20, 10, 40);
      ctx.fillRect(powerUp.x - 20, powerUp.y - 5, 40, 10);
    } else {
      ctx.beginPath();
      ctx.moveTo(powerUp.x, powerUp.y - 22);
      ctx.lineTo(powerUp.x + 20, powerUp.y - 6);
      ctx.lineTo(powerUp.x + 10, powerUp.y + 20);
      ctx.lineTo(powerUp.x - 10, powerUp.y + 20);
      ctx.lineTo(powerUp.x - 20, powerUp.y - 6);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawCenterText(title, subtitle) {
  ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
  ctx.fillRect(canvas.width / 2 - 320, canvas.height / 2 - 90, 640, 180);
  ctx.fillStyle = "#facc15";
  ctx.font = "54px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 14);
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "24px system-ui, sans-serif";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 38);
}

function drawMinimap(snapshot, camera) {
  const world = snapshot.world;
  const mapWidth = 220;
  const mapHeight = 147;
  const x = canvas.width - mapWidth - 22;
  const y = 22;
  const scaleX = mapWidth / world.width;
  const scaleY = mapHeight / world.height;

  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
  ctx.fillRect(x, y, mapWidth, mapHeight);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, mapWidth, mapHeight);

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    x + camera.x * scaleX,
    y + camera.y * scaleY,
    VIEWPORT.width * scaleX,
    VIEWPORT.height * scaleY
  );

  for (const player of snapshot.players) {
    ctx.fillStyle = player.id === state.selfId ? "#facc15" : player.color;
    ctx.beginPath();
    ctx.arc(x + player.x * scaleX, y + player.y * scaleY, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ef4444";
  for (const enemy of snapshot.enemies) {
    ctx.fillRect(x + enemy.x * scaleX - 1, y + enemy.y * scaleY - 1, 2, 2);
  }

  ctx.fillStyle = "#38bdf8";
  for (const powerUp of snapshot.powerUps) {
    ctx.fillRect(x + powerUp.x * scaleX - 2, y + powerUp.y * scaleY - 2, 4, 4);
  }

  ctx.restore();
}

function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
