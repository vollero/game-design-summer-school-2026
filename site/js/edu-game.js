(function () {
  const state = {
    canvas: null,
    ctx: null,
    width: 720,
    height: 480,
    fillStyle: "#f8fafc",
    strokeStyle: "#f8fafc",
    lineWidth: 2,
    doFill: true,
    doStroke: true,
    fontSize: 18,
    keys: new Set(),
    mouseX: 0,
    mouseY: 0,
    frameCount: 0,
    deltaTime: 0,
    lastTime: 0,
    started: false,
  };

  const keyAliases = {
    ArrowLeft: ["LEFT_ARROW", "LEFT", "left"],
    ArrowRight: ["RIGHT_ARROW", "RIGHT", "right"],
    ArrowUp: ["UP_ARROW", "UP", "up"],
    ArrowDown: ["DOWN_ARROW", "DOWN", "down"],
    Space: ["SPACE", "space", " "],
    KeyW: ["W", "w"],
    KeyA: ["A", "a"],
    KeyS: ["S", "s"],
    KeyD: ["D", "d"],
  };

  defineGetter("width", () => state.width);
  defineGetter("height", () => state.height);
  defineGetter("mouseX", () => state.mouseX);
  defineGetter("mouseY", () => state.mouseY);
  defineGetter("frameCount", () => state.frameCount);
  defineGetter("deltaTime", () => state.deltaTime);

  window.LEFT_ARROW = "ArrowLeft";
  window.RIGHT_ARROW = "ArrowRight";
  window.UP_ARROW = "ArrowUp";
  window.DOWN_ARROW = "ArrowDown";
  window.SPACE = "Space";

  window.createCanvas = function createCanvas(width, height) {
    state.canvas = document.querySelector("#gameCanvas");
    state.ctx = state.canvas.getContext("2d");
    state.width = width;
    state.height = height;
    state.canvas.width = width;
    state.canvas.height = height;
    state.canvas.focus();
    return state.canvas;
  };

  window.background = function background(...args) {
    ensureCanvas();
    state.ctx.save();
    state.ctx.fillStyle = colorFromArgs(args, "#0f172a");
    state.ctx.fillRect(0, 0, state.width, state.height);
    state.ctx.restore();
  };

  window.fill = function fill(...args) {
    state.fillStyle = colorFromArgs(args, state.fillStyle);
    state.doFill = true;
  };

  window.noFill = function noFill() {
    state.doFill = false;
  };

  window.stroke = function stroke(...args) {
    state.strokeStyle = colorFromArgs(args, state.strokeStyle);
    state.doStroke = true;
  };

  window.noStroke = function noStroke() {
    state.doStroke = false;
  };

  window.strokeWeight = function strokeWeight(value) {
    state.lineWidth = value;
  };

  window.circle = function circle(x, y, diameter) {
    ensureCanvas();
    state.ctx.beginPath();
    state.ctx.arc(x, y, diameter / 2, 0, Math.PI * 2);
    paint();
  };

  window.rect = function rect(x, y, width, height) {
    ensureCanvas();
    state.ctx.beginPath();
    state.ctx.rect(x, y, width, height);
    paint();
  };

  window.line = function line(x1, y1, x2, y2) {
    ensureCanvas();
    state.ctx.save();
    state.ctx.strokeStyle = state.strokeStyle;
    state.ctx.lineWidth = state.lineWidth;
    state.ctx.beginPath();
    state.ctx.moveTo(x1, y1);
    state.ctx.lineTo(x2, y2);
    state.ctx.stroke();
    state.ctx.restore();
  };

  window.triangle = function triangle(x1, y1, x2, y2, x3, y3) {
    ensureCanvas();
    state.ctx.beginPath();
    state.ctx.moveTo(x1, y1);
    state.ctx.lineTo(x2, y2);
    state.ctx.lineTo(x3, y3);
    state.ctx.closePath();
    paint();
  };

  window.textSize = function textSize(size) {
    state.fontSize = size;
  };

  window.textAlign = function textAlign() {
    // Kept for compatibility with classroom snippets.
  };

  window.text = function text(value, x, y) {
    ensureCanvas();
    state.ctx.save();
    state.ctx.fillStyle = state.fillStyle;
    state.ctx.font = `${state.fontSize}px system-ui, sans-serif`;
    state.ctx.fillText(String(value), x, y);
    state.ctx.restore();
  };

  window.keyIsDown = function keyIsDown(key) {
    if (state.keys.has(key)) return true;
    for (const [code, aliases] of Object.entries(keyAliases)) {
      if (aliases.includes(key) && state.keys.has(code)) return true;
    }
    if (typeof key === "string" && key.length === 1) {
      return state.keys.has(`Key${key.toUpperCase()}`);
    }
    return false;
  };

  window.random = function random(min, max) {
    if (max === undefined) {
      return Math.random() * min;
    }
    return min + Math.random() * (max - min);
  };

  window.constrain = function constrain(value, min, max) {
    return Math.max(min, Math.min(max, value));
  };

  window.dist = function dist(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  };

  window.log = function log(message) {
    const consoleEl = document.querySelector("#console");
    const line = document.createElement("div");
    line.textContent = String(message);
    consoleEl.append(line);
    while (consoleEl.children.length > 80) {
      consoleEl.firstElementChild.remove();
    }
    consoleEl.scrollTop = consoleEl.scrollHeight;
  };

  window.clearLog = function clearLog() {
    document.querySelector("#console").innerHTML = "";
  };

  window.EduGame = {
    start() {
      if (state.started) return;
      state.started = true;
      createCanvas(state.width, state.height);
      wireInput();

      if (typeof window.setup === "function") {
        window.setup();
      }

      if (typeof window.draw === "function") {
        requestAnimationFrame(tick);
      }
    },
  };

  function tick(time) {
    state.deltaTime = state.lastTime ? time - state.lastTime : 16.67;
    state.lastTime = time;
    state.frameCount += 1;

    try {
      window.draw();
    } catch (error) {
      log(`Errore: ${error.message}`);
      throw error;
    }

    requestAnimationFrame(tick);
  }

  function wireInput() {
    window.addEventListener("keydown", (event) => {
      state.keys.add(event.code);
      state.keys.add(event.key);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
    });

    window.addEventListener("keyup", (event) => {
      state.keys.delete(event.code);
      state.keys.delete(event.key);
    });

    state.canvas.addEventListener("pointermove", updatePointer);
    state.canvas.addEventListener("pointerdown", (event) => {
      state.canvas.focus();
      updatePointer(event);
    });
  }

  function updatePointer(event) {
    const rect = state.canvas.getBoundingClientRect();
    state.mouseX = ((event.clientX - rect.left) / rect.width) * state.width;
    state.mouseY = ((event.clientY - rect.top) / rect.height) * state.height;
  }

  function paint() {
    state.ctx.save();
    if (state.doFill) {
      state.ctx.fillStyle = state.fillStyle;
      state.ctx.fill();
    }
    if (state.doStroke) {
      state.ctx.strokeStyle = state.strokeStyle;
      state.ctx.lineWidth = state.lineWidth;
      state.ctx.stroke();
    }
    state.ctx.restore();
  }

  function colorFromArgs(args, fallback) {
    if (args.length === 0) return fallback;
    if (typeof args[0] === "string") return args[0];
    if (args.length === 1) {
      const value = args[0];
      return `rgb(${value}, ${value}, ${value})`;
    }
    const [r, g, b, a = 1] = args;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  function ensureCanvas() {
    if (!state.ctx) {
      createCanvas(state.width, state.height);
    }
  }

  function defineGetter(name, getter) {
    Object.defineProperty(window, name, {
      configurable: true,
      get: getter,
    });
  }
})();

