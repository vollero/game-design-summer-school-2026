const canvas = document.querySelector("#pvpCanvas");
const ctx = canvas.getContext("2d");
const joinForm = document.querySelector("#joinForm");
const nameInput = document.querySelector("#nameInput");
const readyButton = document.querySelector("#readyButton");
const connectionStatus = document.querySelector("#connectionStatus");
const matchStatus = document.querySelector("#matchStatus");
const playerCount = document.querySelector("#playerCount");
const selfStatus = document.querySelector("#selfStatus");
const playerList = document.querySelector("#playerList");

const VIEWPORT = { width: 1440, height: 960 };

const state = {
  socket: null,
  selfId: null,
  role: "visitor",
  name: localStorage.getItem("pvpName") || "",
  connected: false,
  joined: false,
  snapshot: {
    phase: "lobby",
    world: { width: 2880, height: 1920 },
    minPlayers: 2,
    maxPlayers: 5,
    winner: null,
    players: [],
    bullets: [],
    walls: [],
    spectators: 0,
  },
  input: {
    left: false,
    right: false,
    forward: false,
    back: false,
    touchActive: false,
    touchAngle: null,
  },
  touch: {
    pointerId: null,
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
  localStorage.setItem("pvpName", name);
  join();
});

readyButton.addEventListener("click", () => {
  const self = getSelfPlayer(state.snapshot);
  if (!self || state.snapshot.phase !== "lobby") return;
  send({ type: "ready", ready: !self.ready });
});

window.addEventListener("keydown", (event) => updateInput(event, true));
window.addEventListener("keyup", (event) => updateInput(event, false));
canvas.addEventListener("pointerdown", startTouchDirection);
canvas.addEventListener("pointermove", updateTouchDirection);
canvas.addEventListener("pointerup", stopTouchDirection);
canvas.addEventListener("pointercancel", stopTouchDirection);
canvas.addEventListener("pointerleave", stopTouchDirection);

function connect() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${location.host}/arenaPVP-ws`);
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
      state.role = message.role;
      joinForm.hidden = true;
    } else if (message.type === "snapshot") {
      state.snapshot = message;
      updateHud();
    }
  });

  socket.addEventListener("close", () => {
    state.connected = false;
    state.joined = false;
    state.role = "visitor";
    joinForm.hidden = false;
    readyButton.hidden = true;
    setStatus("offline");
    setTimeout(connect, 1200);
  });

  socket.addEventListener("error", () => {
    setStatus("errore");
  });
}

function join() {
  send({ type: "join", name: state.name });
}

function send(payload) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) return;
  state.socket.send(JSON.stringify(payload));
}

function updateInput(event, pressed) {
  if (isTextInputEvent(event)) return;

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

function startTouchDirection(event) {
  if (state.role !== "player") return;
  canvas.setPointerCapture?.(event.pointerId);
  state.touch.pointerId = event.pointerId;
  applyTouchDirection(event);
}

function updateTouchDirection(event) {
  if (state.touch.pointerId !== event.pointerId) return;
  applyTouchDirection(event);
}

function stopTouchDirection(event) {
  if (state.touch.pointerId !== event.pointerId) return;
  canvas.releasePointerCapture?.(event.pointerId);
  state.touch.pointerId = null;
  state.input.touchActive = false;
  state.input.touchAngle = null;
  sendInput();
}

function applyTouchDirection(event) {
  const self = getSelfPlayer(state.snapshot);
  if (!self || !self.alive) return;

  const camera = getCamera(state.snapshot);
  const pointer = getCanvasPointer(event);
  const selfX = self.x - camera.x;
  const selfY = self.y - camera.y;
  const dx = pointer.x - selfX;
  const dy = pointer.y - selfY;

  if (Math.hypot(dx, dy) < 12) return;

  event.preventDefault();
  state.input.touchActive = true;
  state.input.touchAngle = Math.atan2(dy, dx);
  sendInput();
}

function getCanvasPointer(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function isTextInputEvent(event) {
  const target = event.target;
  if (!target) return false;

  const tagName = target.tagName;
  return target.isContentEditable || tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

function sendInput() {
  if (!state.joined || state.role !== "player") return;
  send({ type: "input", input: state.input });
}

function updateHud() {
  const snapshot = state.snapshot;
  const self = getSelfPlayer(snapshot);

  matchStatus.textContent = getPhaseLabel(snapshot);
  playerCount.textContent = `${snapshot.players.length}/${snapshot.maxPlayers} giocatori - ${snapshot.spectators} visitatori`;

  if (!state.joined) {
    selfStatus.textContent = "Scegli un nome per entrare.";
  } else if (state.role === "visitor") {
    selfStatus.textContent = "Visitatore - puoi assistere allo scontro.";
  } else if (self) {
    const status = self.alive ? `vite ${self.lives}/${self.maxLives}` : "eliminato";
    const ready = snapshot.phase === "lobby" ? (self.ready ? " - pronto" : " - non pronto") : "";
    selfStatus.textContent = `${self.name} - ${status}${ready}`;
  }

  readyButton.hidden = state.role !== "player" || snapshot.phase !== "lobby" || !self;
  if (!readyButton.hidden) {
    readyButton.textContent = self.ready ? "Annulla pronto" : "Pronto";
  }

  playerList.innerHTML = "";
  for (const player of [...snapshot.players].sort(sortPlayers)) {
    const card = document.createElement("div");
    card.className = `player-card${player.alive ? "" : " eliminated"}`;
    const stateLabel = snapshot.phase === "lobby"
      ? (player.ready ? "pronto" : "attesa")
      : (player.alive ? `vite ${player.lives}/${player.maxLives}` : "fuori");
    card.innerHTML = `
      <span class="player-dot" style="background:${player.color}"></span>
      <span>
        <strong>${escapeHtml(player.name)}</strong>
        <small>${stateLabel} - kill ${player.kills}</small>
      </span>
      <em>${player.score}</em>
    `;
    playerList.append(card);
  }
}

function sortPlayers(a, b) {
  if (a.alive !== b.alive) return a.alive ? -1 : 1;
  if (a.lives !== b.lives) return b.lives - a.lives;
  return b.score - a.score;
}

function getPhaseLabel(snapshot) {
  if (snapshot.phase === "running") return "scontro";
  if (snapshot.phase === "finished") return `vince ${snapshot.winner || "nessuno"}`;
  return "lobby";
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
  drawWalls(snapshot.walls);
  drawBullets(snapshot.bullets, snapshot.players);
  drawPlayers(snapshot.players);
  ctx.restore();

  drawMinimap(snapshot, camera);
  drawTouchDirection(snapshot, camera);
  drawCenterOverlay(snapshot);

  requestAnimationFrame(render);
}

function getCamera(snapshot) {
  const world = snapshot.world;
  const focus = getSelfPlayer(snapshot) || getPlayersFocus(snapshot.players) || {
    x: world.width / 2,
    y: world.height / 2,
  };

  return {
    x: clamp(focus.x - VIEWPORT.width / 2, 0, Math.max(0, world.width - VIEWPORT.width)),
    y: clamp(focus.y - VIEWPORT.height / 2, 0, Math.max(0, world.height - VIEWPORT.height)),
  };
}

function getPlayersFocus(players) {
  const visiblePlayers = players.filter((player) => player.alive);
  const candidates = visiblePlayers.length > 0 ? visiblePlayers : players;
  if (candidates.length === 0) return null;

  return {
    x: candidates.reduce((sum, player) => sum + player.x, 0) / candidates.length,
    y: candidates.reduce((sum, player) => sum + player.y, 0) / candidates.length,
  };
}

function getSelfPlayer(snapshot) {
  return snapshot.players.find((player) => player.id === state.selfId);
}

function drawBackground(world) {
  ctx.fillStyle = "#101827";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.strokeStyle = "#1f2a44";
  ctx.lineWidth = 1;
  for (let x = 0; x <= world.width; x += 80) line(x, 0, x, world.height);
  for (let y = 0; y <= world.height; y += 80) line(0, y, world.width, y);

  ctx.fillStyle = "rgba(34, 197, 94, 0.08)";
  ctx.fillRect(0, 0, world.width, 140);
  ctx.fillRect(0, world.height - 140, world.width, 140);

  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, world.width, world.height);
}

function drawWalls(walls) {
  for (const wall of walls) {
    ctx.fillStyle = "#334155";
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 4;
    ctx.strokeRect(wall.x + 2, wall.y + 2, wall.width - 4, wall.height - 4);

    ctx.fillStyle = "rgba(15, 23, 42, 0.38)";
    ctx.fillRect(wall.x + 10, wall.y + 10, wall.width - 20, wall.height - 20);
  }
}

function drawPlayers(players) {
  for (const player of players) {
    const dirX = Math.cos(player.angle);
    const dirY = Math.sin(player.angle);
    const perpX = -dirY;
    const perpY = dirX;
    const noseX = player.x + dirX * 52;
    const noseY = player.y + dirY * 52;
    const tailX = player.x - dirX * 32;
    const tailY = player.y - dirY * 32;

    ctx.globalAlpha = player.alive ? (player.invulnerable > 0 ? 0.56 : 1) : 0.3;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(noseX, noseY);
    ctx.lineTo(tailX + perpX * 28, tailY + perpY * 28);
    ctx.lineTo(tailX - perpX * 28, tailY - perpY * 28);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = player.id === state.selfId ? "#facc15" : "#e5e7eb";
    ctx.lineWidth = player.id === state.selfId ? 5 : 3;
    ctx.stroke();

    if (!player.alive) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 6;
      line(player.x - 28, player.y - 28, player.x + 28, player.y + 28);
      line(player.x + 28, player.y - 28, player.x - 28, player.y + 28);
    }

    drawLifePips(player);

    ctx.globalAlpha = 1;
    ctx.fillStyle = player.id === state.selfId ? "#facc15" : "#e5e7eb";
    ctx.font = "23px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(player.name, player.x, player.y - player.radius - 30);
  }
}

function drawLifePips(player) {
  const startX = player.x - 38;
  const y = player.y + player.radius + 18;

  for (let i = 0; i < player.maxLives; i++) {
    ctx.fillStyle = i < player.lives ? "#22c55e" : "rgba(148, 163, 184, 0.34)";
    ctx.fillRect(startX + i * 19, y, 13, 7);
  }
}

function drawBullets(bullets, players) {
  const colors = new Map(players.map((player) => [player.id, player.color]));
  for (const bullet of bullets) {
    ctx.fillStyle = colors.get(bullet.ownerId) || "#facc15";
    circle(bullet.x, bullet.y, bullet.radius);
  }
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
  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  ctx.fillRect(x, y, mapWidth, mapHeight);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, mapWidth, mapHeight);

  ctx.fillStyle = "rgba(148, 163, 184, 0.52)";
  for (const wall of snapshot.walls) {
    ctx.fillRect(x + wall.x * scaleX, y + wall.y * scaleY, wall.width * scaleX, wall.height * scaleY);
  }

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    x + camera.x * scaleX,
    y + camera.y * scaleY,
    VIEWPORT.width * scaleX,
    VIEWPORT.height * scaleY
  );

  for (const player of snapshot.players) {
    ctx.fillStyle = player.alive ? player.color : "#64748b";
    ctx.beginPath();
    ctx.arc(x + player.x * scaleX, y + player.y * scaleY, player.id === state.selfId ? 5 : 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTouchDirection(snapshot, camera) {
  if (!state.input.touchActive) return;
  const self = getSelfPlayer(snapshot);
  if (!self || !self.alive) return;

  const x = self.x - camera.x;
  const y = self.y - camera.y;
  const endX = x + Math.cos(state.input.touchAngle) * 118;
  const endY = y + Math.sin(state.input.touchAngle) * 118;

  ctx.save();
  ctx.strokeStyle = "rgba(250, 204, 21, 0.86)";
  ctx.fillStyle = "rgba(250, 204, 21, 0.18)";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  line(x, y, endX, endY);
  ctx.beginPath();
  ctx.arc(endX, endY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCenterOverlay(snapshot) {
  if (!state.joined) {
    drawCenterText("arenaPVP", "scegli un nome per entrare");
    return;
  }

  if (snapshot.phase === "lobby") {
    const ready = snapshot.players.filter((player) => player.ready).length;
    drawCenterText("Lobby", `${ready}/${snapshot.players.length} pronti - minimo ${snapshot.minPlayers}`);
    return;
  }

  if (snapshot.phase === "finished") {
    drawCenterText("Vince", snapshot.winner || "nessuno");
  }
}

function drawCenterText(title, subtitle) {
  ctx.save();
  ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
  ctx.fillRect(canvas.width / 2 - 300, canvas.height / 2 - 84, 600, 168);
  ctx.fillStyle = "#facc15";
  ctx.font = "52px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 12);
  ctx.fillStyle = "#e5e7eb";
  ctx.font = "23px system-ui, sans-serif";
  ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 38);
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
