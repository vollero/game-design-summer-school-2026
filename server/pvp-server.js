const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3002);
const TICK_RATE = 60;
const SNAPSHOT_RATE = 20;
const WORLD = { width: 2880, height: 1920 };
const VIEWPORT = { width: 1440, height: 960 };
const MAX_PLAYERS = 5;
const MIN_PLAYERS = 2;
const PLAYER_RADIUS = 32;
const PLAYER_SPEED = 6.2;
const PLAYER_BACK_SPEED = 3.8;
const TOUCH_SPEED = 6.4;
const BULLET_SPEED = 17;
const COLORS = ["#22c55e", "#38bdf8", "#f97316", "#a855f7", "#facc15"];
const SPAWNS = [
  { x: 220, y: 220, angle: Math.PI / 4 },
  { x: WORLD.width - 220, y: WORLD.height - 220, angle: -Math.PI * 0.75 },
  { x: WORLD.width - 220, y: 220, angle: Math.PI * 0.75 },
  { x: 220, y: WORLD.height - 220, angle: -Math.PI / 4 },
  { x: WORLD.width / 2, y: 210, angle: Math.PI / 2 },
];
const WALLS = [
  { id: "w1", x: 640, y: 300, width: 360, height: 76 },
  { id: "w2", x: 1880, y: 300, width: 360, height: 76 },
  { id: "w3", x: 640, y: 1544, width: 360, height: 76 },
  { id: "w4", x: 1880, y: 1544, width: 360, height: 76 },
  { id: "w5", x: 1310, y: 520, width: 260, height: 86 },
  { id: "w6", x: 1310, y: 1314, width: 260, height: 86 },
  { id: "w7", x: 1040, y: 850, width: 220, height: 220 },
  { id: "w8", x: 1620, y: 850, width: 220, height: 220 },
  { id: "w9", x: 520, y: 820, width: 86, height: 360 },
  { id: "w10", x: 2274, y: 820, width: 86, height: 360 },
  { id: "w11", x: 1355, y: 860, width: 170, height: 200 },
];

const clients = new Map();
const players = new Map();
const bullets = [];

let nextId = 1;
let frame = 0;
let phase = "lobby";
let winner = null;
let resetTimeout = null;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    sendJson(res, {
      ok: true,
      world: WORLD,
      phase,
      players: players.size,
      spectators: countSpectators(),
      winner,
    });
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

server.on("upgrade", (req, socket) => {
  if (req.url !== "/ws") {
    socket.destroy();
    return;
  }

  const key = req.headers["sec-websocket-key"];
  if (!key) {
    socket.destroy();
    return;
  }

  const accept = crypto
    .createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");

  socket.write([
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${accept}`,
    "",
    "",
  ].join("\r\n"));

  createClient(socket);
});

server.listen(PORT, () => {
  console.log(`pvp server listening on ${PORT}`);
});

setInterval(tick, 1000 / TICK_RATE);
setInterval(broadcastSnapshot, 1000 / SNAPSHOT_RATE);
setInterval(cleanupInactiveClients, 5000);

function createClient(socket) {
  const id = `p${nextId++}`;
  const client = {
    id,
    socket,
    buffer: Buffer.alloc(0),
    joined: false,
    role: "visitor",
    input: createEmptyInput(),
    lastSeen: Date.now(),
  };

  clients.set(id, client);

  socket.on("data", (chunk) => {
    client.buffer = Buffer.concat([client.buffer, chunk]);
    const decoded = decodeFrames(client.buffer);
    client.buffer = decoded.remaining;

    if (decoded.closed) {
      removeClient(id);
      return;
    }

    for (const message of decoded.messages) {
      handleMessage(client, message);
    }
  });

  socket.on("close", () => removeClient(id));
  socket.on("error", () => removeClient(id));

  send(client, {
    type: "hello",
    id,
    world: WORLD,
    maxPlayers: MAX_PLAYERS,
    minPlayers: MIN_PLAYERS,
  });
}

function handleMessage(client, rawMessage) {
  client.lastSeen = Date.now();

  let message;
  try {
    message = JSON.parse(rawMessage);
  } catch {
    return;
  }

  if (message.type === "join") {
    const name = sanitizeName(message.name);
    client.joined = true;

    if (client.role === "player" && players.has(client.id)) {
      players.get(client.id).name = name;
    } else if (phase === "lobby" && players.size < MAX_PLAYERS) {
      client.role = "player";
      createPlayer(client.id, name);
    } else {
      client.role = "visitor";
    }

    send(client, {
      type: "joined",
      id: client.id,
      role: client.role,
      name,
      maxPlayers: MAX_PLAYERS,
    });
    return;
  }

  if (message.type === "ready" && client.role === "player" && phase === "lobby") {
    const player = players.get(client.id);
    if (!player) return;
    player.ready = Boolean(message.ready);
    tryStartRound();
    return;
  }

  if (message.type === "input" && client.role === "player") {
    client.input = {
      left: Boolean(message.input?.left),
      right: Boolean(message.input?.right),
      forward: Boolean(message.input?.forward),
      back: Boolean(message.input?.back),
      touchActive: Boolean(message.input?.touchActive),
      touchAngle: sanitizeAngle(message.input?.touchAngle),
    };
  }
}

function createPlayer(id, name) {
  const index = players.size;
  const spawn = SPAWNS[index % SPAWNS.length];
  players.set(id, {
    id,
    name,
    color: COLORS[index % COLORS.length],
    x: spawn.x,
    y: spawn.y,
    angle: spawn.angle,
    radius: PLAYER_RADIUS,
    lives: 5,
    maxLives: 5,
    alive: true,
    ready: false,
    invulnerable: 0,
    fireCooldown: 28,
    score: 0,
    kills: 0,
  });
}

function removeClient(id) {
  const client = clients.get(id);
  if (client) {
    client.socket.destroy();
  }
  clients.delete(id);
  players.delete(id);

  if (phase === "running") checkWinner();
}

function tick() {
  frame += 1;

  if (phase !== "running") return;

  for (const [id, player] of players) {
    updatePlayer(player, clients.get(id)?.input);
  }

  updateBullets();
  checkBulletPlayerCollisions();
}

function updatePlayer(player, input = {}) {
  if (!player.alive) return;

  if (input.touchActive && Number.isFinite(input.touchAngle)) {
    player.angle = input.touchAngle;
    movePlayer(player, Math.cos(player.angle) * TOUCH_SPEED, Math.sin(player.angle) * TOUCH_SPEED);
  } else {
    if (input.left) player.angle -= 0.075;
    if (input.right) player.angle += 0.075;

    const dirX = Math.cos(player.angle);
    const dirY = Math.sin(player.angle);

    if (input.forward) movePlayer(player, dirX * PLAYER_SPEED, dirY * PLAYER_SPEED);
    if (input.back) movePlayer(player, -dirX * PLAYER_BACK_SPEED, -dirY * PLAYER_BACK_SPEED);
  }

  if (player.invulnerable > 0) player.invulnerable -= 1;
  player.fireCooldown -= 1;
  if (player.fireCooldown <= 0) {
    shoot(player);
    player.fireCooldown = 18;
  }
}

function movePlayer(player, dx, dy) {
  const originalX = player.x;
  const originalY = player.y;

  player.x = clamp(player.x + dx, player.radius, WORLD.width - player.radius);
  if (collidesWithWall(player)) player.x = originalX;

  player.y = clamp(player.y + dy, player.radius, WORLD.height - player.radius);
  if (collidesWithWall(player)) player.y = originalY;
}

function shoot(player) {
  const dirX = Math.cos(player.angle);
  const dirY = Math.sin(player.angle);
  bullets.push({
    id: `b${nextId++}`,
    ownerId: player.id,
    x: player.x + dirX * (player.radius + 12),
    y: player.y + dirY * (player.radius + 12),
    vx: dirX * BULLET_SPEED,
    vy: dirY * BULLET_SPEED,
    radius: 6,
    life: 90,
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.life -= 1;

    const outside = bullet.x < -60 || bullet.x > WORLD.width + 60 || bullet.y < -60 || bullet.y > WORLD.height + 60;
    if (outside || bullet.life <= 0 || bulletHitsWall(bullet)) {
      bullets.splice(i, 1);
    }
  }
}

function checkBulletPlayerCollisions() {
  for (let b = bullets.length - 1; b >= 0; b--) {
    const bullet = bullets[b];
    for (const player of players.values()) {
      if (!player.alive || player.id === bullet.ownerId || player.invulnerable > 0) continue;
      if (distanceBetween(bullet, player) >= bullet.radius + player.radius) continue;

      bullets.splice(b, 1);
      damagePlayer(player, players.get(bullet.ownerId));
      break;
    }
  }
}

function damagePlayer(player, attacker) {
  player.lives = Math.max(0, player.lives - 1);

  if (attacker && attacker.id !== player.id) {
    attacker.score += player.lives === 0 ? 100 : 20;
    if (player.lives === 0) attacker.kills += 1;
  }

  if (player.lives === 0) {
    player.alive = false;
    player.invulnerable = 0;
    checkWinner();
    return;
  }

  respawnPlayer(player);
}

function respawnPlayer(player) {
  const living = [...players.values()].filter((candidate) => candidate.alive);
  const spawn = findSafestSpawn(living);
  player.x = spawn.x;
  player.y = spawn.y;
  player.angle = spawn.angle;
  player.invulnerable = 110;
}

function findSafestSpawn(livingPlayers) {
  let bestSpawn = SPAWNS[0];
  let bestDistance = -1;

  for (const spawn of SPAWNS) {
    let closest = Infinity;
    for (const player of livingPlayers) {
      closest = Math.min(closest, distanceBetween(spawn, player));
    }
    if (closest > bestDistance) {
      bestDistance = closest;
      bestSpawn = spawn;
    }
  }

  return bestSpawn;
}

function tryStartRound() {
  if (phase !== "lobby") return;
  if (players.size < MIN_PLAYERS) return;
  if (![...players.values()].every((player) => player.ready)) return;

  phase = "running";
  winner = null;
  bullets.length = 0;

  let index = 0;
  for (const player of players.values()) {
    const spawn = SPAWNS[index % SPAWNS.length];
    player.x = spawn.x;
    player.y = spawn.y;
    player.angle = spawn.angle;
    player.lives = player.maxLives;
    player.alive = true;
    player.ready = true;
    player.invulnerable = 110;
    player.fireCooldown = 20 + index * 3;
    player.score = 0;
    player.kills = 0;
    index += 1;
  }
}

function checkWinner() {
  if (phase !== "running") return;
  const alivePlayers = [...players.values()].filter((player) => player.alive);
  if (alivePlayers.length > 1) return;

  phase = "finished";
  bullets.length = 0;
  winner = alivePlayers.length === 1 ? alivePlayers[0].name : "Nessuno";

  if (resetTimeout) clearTimeout(resetTimeout);
  resetTimeout = setTimeout(resetLobby, 8000);
}

function resetLobby() {
  phase = "lobby";
  winner = null;
  resetTimeout = null;
  bullets.length = 0;

  let index = 0;
  for (const player of players.values()) {
    const spawn = SPAWNS[index % SPAWNS.length];
    player.x = spawn.x;
    player.y = spawn.y;
    player.angle = spawn.angle;
    player.lives = player.maxLives;
    player.alive = true;
    player.ready = false;
    player.invulnerable = 0;
    player.fireCooldown = 24;
    player.score = 0;
    player.kills = 0;
    index += 1;
  }
}

function broadcastSnapshot() {
  const snapshot = {
    type: "snapshot",
    phase,
    world: WORLD,
    viewport: VIEWPORT,
    minPlayers: MIN_PLAYERS,
    maxPlayers: MAX_PLAYERS,
    frame,
    winner,
    players: [...players.values()].map(publicPlayer),
    bullets: bullets.map((bullet) => ({
      id: bullet.id,
      ownerId: bullet.ownerId,
      x: round(bullet.x),
      y: round(bullet.y),
      radius: bullet.radius,
    })),
    walls: WALLS,
    spectators: countSpectators(),
  };

  for (const client of clients.values()) {
    if (client.joined) send(client, snapshot);
  }
}

function publicPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    color: player.color,
    x: round(player.x),
    y: round(player.y),
    angle: round(player.angle),
    radius: player.radius,
    lives: player.lives,
    maxLives: player.maxLives,
    alive: player.alive,
    ready: player.ready,
    invulnerable: player.invulnerable,
    score: player.score,
    kills: player.kills,
  };
}

function countSpectators() {
  return [...clients.values()].filter((client) => client.joined && client.role !== "player").length;
}

function collidesWithWall(circle) {
  return WALLS.some((wall) => circleIntersectsRect(circle, wall));
}

function bulletHitsWall(bullet) {
  return WALLS.some((wall) => circleIntersectsRect(bullet, wall));
}

function circleIntersectsRect(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  return Math.hypot(circle.x - closestX, circle.y - closestY) < circle.radius;
}

function send(client, payload) {
  if (client.socket.destroyed) return;
  client.socket.write(encodeFrame(JSON.stringify(payload)));
}

function cleanupInactiveClients() {
  const now = Date.now();
  for (const client of clients.values()) {
    if (now - client.lastSeen > 60000) {
      removeClient(client.id);
    }
  }
}

function encodeFrame(message) {
  const payload = Buffer.from(message);
  const length = payload.length;

  if (length < 126) {
    return Buffer.concat([Buffer.from([0x81, length]), payload]);
  }

  if (length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(length), 2);
  return Buffer.concat([header, payload]);
}

function decodeFrames(buffer) {
  const messages = [];
  let offset = 0;

  while (offset + 2 <= buffer.length) {
    const first = buffer[offset];
    const second = buffer[offset + 1];
    const opcode = first & 0x0f;
    const masked = (second & 0x80) !== 0;
    let length = second & 0x7f;
    let headerLength = 2;

    if (length === 126) {
      if (offset + 4 > buffer.length) break;
      length = buffer.readUInt16BE(offset + 2);
      headerLength = 4;
    } else if (length === 127) {
      if (offset + 10 > buffer.length) break;
      const bigLength = buffer.readBigUInt64BE(offset + 2);
      if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) break;
      length = Number(bigLength);
      headerLength = 10;
    }

    const maskLength = masked ? 4 : 0;
    const frameLength = headerLength + maskLength + length;
    if (offset + frameLength > buffer.length) break;

    if (opcode === 0x8) {
      return { messages, remaining: Buffer.alloc(0), closed: true };
    }

    if (opcode === 0x1) {
      const payloadStart = offset + headerLength + maskLength;
      const payload = Buffer.from(buffer.slice(payloadStart, payloadStart + length));

      if (masked) {
        const mask = buffer.slice(offset + headerLength, offset + headerLength + 4);
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= mask[i % 4];
        }
      }

      messages.push(payload.toString("utf8"));
    }

    offset += frameLength;
  }

  return { messages, remaining: buffer.slice(offset), closed: false };
}

function sendJson(res, data) {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

function sanitizeName(name) {
  return String(name || "Player")
    .replace(/[^\p{L}\p{N} _.-]/gu, "")
    .trim()
    .slice(0, 18) || "Player";
}

function sanitizeAngle(value) {
  const angle = Number(value);
  if (!Number.isFinite(angle)) return null;
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function createEmptyInput() {
  return {
    left: false,
    right: false,
    forward: false,
    back: false,
    touchActive: false,
    touchAngle: null,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function round(value) {
  return Math.round(value * 10) / 10;
}
