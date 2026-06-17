const http = require("http");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3001);
const TICK_RATE = 60;
const SNAPSHOT_RATE = 20;
const WORLD = { width: 1440, height: 960 };
const PLAYER_RADIUS = 34;
const COLORS = ["#22c55e", "#38bdf8", "#f97316", "#a855f7", "#facc15", "#fb7185", "#14b8a6", "#e879f9"];

const clients = new Map();
const players = new Map();
const bullets = [];
const enemies = [];
const powerUps = [];

let nextId = 1;
let frame = 0;
let teamScore = 0;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    sendJson(res, {
      ok: true,
      players: players.size,
      enemies: enemies.length,
      teamScore,
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
  console.log(`collab server listening on ${PORT}`);
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
    input: { left: false, right: false, forward: false, back: false },
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
    createOrResetPlayer(client.id, name);
    send(client, { type: "joined", id: client.id, name });
    return;
  }

  if (message.type === "input" && client.joined) {
    client.input = {
      left: Boolean(message.input?.left),
      right: Boolean(message.input?.right),
      forward: Boolean(message.input?.forward),
      back: Boolean(message.input?.back),
    };
  }
}

function createOrResetPlayer(id, name) {
  const color = COLORS[Math.abs(hashCode(id)) % COLORS.length];
  players.set(id, {
    id,
    name,
    color,
    x: WORLD.width / 2 + random(-160, 160),
    y: WORLD.height / 2 + random(-120, 120),
    angle: random(-Math.PI, Math.PI),
    radius: PLAYER_RADIUS,
    lives: 3,
    maxLives: 4,
    score: 0,
    invulnerable: 90,
    respawnTimer: 0,
    weapon: "single",
    weaponTimer: 0,
    fireCooldown: 20,
  });
}

function removeClient(id) {
  const client = clients.get(id);
  if (client) {
    client.socket.destroy();
  }
  clients.delete(id);
  players.delete(id);
}

function tick() {
  frame += 1;

  if (players.size === 0) {
    bullets.length = 0;
    enemies.length = 0;
    powerUps.length = 0;
    teamScore = 0;
    return;
  }

  for (const [id, player] of players) {
    updatePlayer(player, clients.get(id)?.input);
  }

  if (frame % getEnemySpawnDelay() === 0) spawnEnemy();
  if (frame % 360 === 0) spawnPowerUp();

  updateBullets();
  updateEnemies();
  updatePowerUps();
  checkBulletEnemyCollisions();
  checkPlayerEnemyCollisions();
  checkPlayerPowerUpCollisions();
}

function updatePlayer(player, input = {}) {
  if (player.respawnTimer > 0) {
    player.respawnTimer -= 1;
    if (player.respawnTimer === 0) {
      player.lives = 3;
      player.x = WORLD.width / 2 + random(-180, 180);
      player.y = WORLD.height / 2 + random(-140, 140);
      player.invulnerable = 120;
    }
    return;
  }

  if (input.left) player.angle -= 0.07;
  if (input.right) player.angle += 0.07;

  const dirX = Math.cos(player.angle);
  const dirY = Math.sin(player.angle);

  if (input.forward) {
    player.x += dirX * 7.6;
    player.y += dirY * 7.6;
  }

  if (input.back) {
    player.x -= dirX * 4.3;
    player.y -= dirY * 4.3;
  }

  player.x = clamp(player.x, player.radius, WORLD.width - player.radius);
  player.y = clamp(player.y, player.radius, WORLD.height - player.radius);

  if (player.invulnerable > 0) player.invulnerable -= 1;
  if (player.weaponTimer > 0) {
    player.weaponTimer -= 1;
    if (player.weaponTimer === 0) player.weapon = "single";
  }

  player.fireCooldown -= 1;
  if (player.fireCooldown <= 0) {
    shoot(player);
    player.fireCooldown = player.weapon === "triple" ? 18 : 14;
  }
}

function shoot(player) {
  const spread = 20 * Math.PI / 180;
  const angles = player.weapon === "triple"
    ? [player.angle - spread / 2, player.angle, player.angle + spread / 2]
    : [player.angle];

  for (const angle of angles) {
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    bullets.push({
      id: `b${nextId++}`,
      ownerId: player.id,
      x: player.x + dirX * player.radius,
      y: player.y + dirY * player.radius,
      vx: dirX * 16,
      vy: dirY * 16,
      radius: 7,
      life: 95,
    });
  }
}

function getEnemySpawnDelay() {
  const base = Math.max(16, 42 - Math.floor(teamScore / 120));
  const activePlayers = [...players.values()].filter((player) => player.respawnTimer <= 0).length;
  return Math.max(12, base - Math.max(0, activePlayers - 1) * 4);
}

function spawnEnemy() {
  if (enemies.length > 90) return;

  const side = Math.floor(random(0, 4));
  const fast = random(0, 1) < 0.26;
  const tank = !fast && random(0, 1) < 0.18;
  const enemy = {
    id: `e${nextId++}`,
    x: 0,
    y: 0,
    radius: tank ? random(52, 66) : fast ? random(22, 30) : random(32, 46),
    speed: tank ? random(1.4, 2.0) : fast ? random(4.0, 5.3) : random(2.2, 3.4),
    hp: tank ? 3 : 1,
    type: tank ? "tank" : fast ? "fast" : "grunt",
    scoreValue: tank ? 35 : fast ? 15 : 10,
  };

  enemy.speed += teamScore * 0.0012;

  if (side === 0) { enemy.x = random(0, WORLD.width); enemy.y = -enemy.radius; }
  if (side === 1) { enemy.x = WORLD.width + enemy.radius; enemy.y = random(0, WORLD.height); }
  if (side === 2) { enemy.x = random(0, WORLD.width); enemy.y = WORLD.height + enemy.radius; }
  if (side === 3) { enemy.x = -enemy.radius; enemy.y = random(0, WORLD.height); }

  enemies.push(enemy);
}

function spawnPowerUp() {
  if (powerUps.length >= 4) return;
  const typeRoll = random(0, 1);
  const type = typeRoll < 0.62 ? "triple" : typeRoll < 0.84 ? "repair" : "shield";
  powerUps.push({
    id: `u${nextId++}`,
    x: random(120, WORLD.width - 120),
    y: random(120, WORLD.height - 120),
    radius: 28,
    type,
    life: 900,
  });
}

function updateBullets() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.life -= 1;

    const outside = bullet.x < -60 || bullet.x > WORLD.width + 60 || bullet.y < -60 || bullet.y > WORLD.height + 60;
    if (outside || bullet.life <= 0) {
      bullets.splice(i, 1);
    }
  }
}

function updateEnemies() {
  const activePlayers = [...players.values()].filter((player) => player.respawnTimer <= 0);
  if (activePlayers.length === 0) return;

  for (const enemy of enemies) {
    let target = activePlayers[0];
    let bestDistance = Infinity;
    for (const player of activePlayers) {
      const distance = distanceBetween(enemy, player);
      if (distance < bestDistance) {
        bestDistance = distance;
        target = player;
      }
    }

    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const length = Math.max(0.001, Math.hypot(dx, dy));
    enemy.x += (dx / length) * enemy.speed;
    enemy.y += (dy / length) * enemy.speed;
  }
}

function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].life -= 1;
    if (powerUps[i].life <= 0) powerUps.splice(i, 1);
  }
}

function checkBulletEnemyCollisions() {
  for (let b = bullets.length - 1; b >= 0; b--) {
    const bullet = bullets[b];
    for (let e = enemies.length - 1; e >= 0; e--) {
      const enemy = enemies[e];
      if (distanceBetween(bullet, enemy) < bullet.radius + enemy.radius) {
        bullets.splice(b, 1);
        enemy.hp -= 1;

        if (enemy.hp <= 0) {
          enemies.splice(e, 1);
          const owner = players.get(bullet.ownerId);
          if (owner) owner.score += enemy.scoreValue;
          teamScore += enemy.scoreValue;
        }
        break;
      }
    }
  }
}

function checkPlayerEnemyCollisions() {
  for (const player of players.values()) {
    if (player.respawnTimer > 0 || player.invulnerable > 0) continue;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (distanceBetween(player, enemy) < player.radius + enemy.radius) {
        enemies.splice(i, 1);
        player.lives -= 1;
        player.invulnerable = 110;

        if (player.lives <= 0) {
          player.respawnTimer = 180;
          player.weapon = "single";
          player.weaponTimer = 0;
        }
        break;
      }
    }
  }
}

function checkPlayerPowerUpCollisions() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    for (const player of players.values()) {
      if (player.respawnTimer > 0) continue;
      if (distanceBetween(player, powerUp) < player.radius + powerUp.radius) {
        applyPowerUp(player, powerUp.type);
        powerUps.splice(i, 1);
        break;
      }
    }
  }
}

function applyPowerUp(player, type) {
  if (type === "triple") {
    player.weapon = "triple";
    player.weaponTimer = 720;
  } else if (type === "repair") {
    player.lives = Math.min(player.maxLives, player.lives + 1);
  } else if (type === "shield") {
    player.invulnerable = Math.max(player.invulnerable, 360);
  }
}

function broadcastSnapshot() {
  const snapshot = {
    type: "snapshot",
    world: WORLD,
    frame,
    teamScore,
    players: [...players.values()].map(publicPlayer),
    bullets: bullets.map((bullet) => ({
      id: bullet.id,
      ownerId: bullet.ownerId,
      x: round(bullet.x),
      y: round(bullet.y),
      radius: bullet.radius,
    })),
    enemies: enemies.map((enemy) => ({
      id: enemy.id,
      x: round(enemy.x),
      y: round(enemy.y),
      radius: round(enemy.radius),
      hp: enemy.hp,
      type: enemy.type,
    })),
    powerUps: powerUps.map((powerUp) => ({
      id: powerUp.id,
      x: round(powerUp.x),
      y: round(powerUp.y),
      radius: powerUp.radius,
      type: powerUp.type,
    })),
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
    score: player.score,
    invulnerable: player.invulnerable,
    respawnTimer: player.respawnTimer,
    weapon: player.weapon,
    weaponTimer: player.weaponTimer,
  };
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

function hashCode(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return hash;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min, max) {
  return min + Math.random() * (max - min);
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
