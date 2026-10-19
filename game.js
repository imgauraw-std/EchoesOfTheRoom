"use strict";
// Legend: # wall, . floor, P player start, K key, E exit, H moving hazard
const TILE = 40;
const ECHO_RADIUS = 5; // tiles
const ECHO_SPEED = 9; // tiles per second
const VISIBLE_FOR = 2; // seconds an echoed tile stays lit
const FADE_FOR = 0.6; // seconds to fade out
const ECHO_COOLDOWN = 1.2; // seconds between echoes
const HAZARD_STEP = 0.4; // seconds per hazard move
let levels = [];

const cv = document.getElementById("c");
const ctx = cv.getContext("2d");
const $ = (id) => document.getElementById(id);
const now = () => performance.now() / 1000;

let levelIdx = 0,
  grid,
  W,
  H,
  player,
  key,
  exit,
  hasKey,
  hazards;
let moves, charges, reveal, pulses, lastEcho, startT, lastHazard;
let state = "menu"; // menu | play | over

// ---------- sound ----------
let ac = null;
function beep(f1, f2, dur, type = "sine", vol = 0.12) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(),
      g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + dur);
  } catch (e) {
    /* audio is optional */
  }
}

// ---------- level setup ----------
function load(lv, i) {
  levelIdx = i;
  grid = lv.map.map((r) => [...r]);
  H = grid.length;
  W = grid[0].length;
  cv.width = W * TILE;
  cv.height = H * TILE;
  hazards = [];
  hasKey = false;
  key = exit = player = null;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = grid[y][x];
      if (c === "P") player = { x, y };
      else if (c === "K") key = { x, y };
      else if (c === "E") exit = { x, y };
      else if (c === "H") hazards.push({ x, y, dx: 0, dy: 1 });
      if ("PKEH".includes(c)) grid[y][x] = ".";
    }
  hazards.forEach((h) => {
    if (grid[h.y + 1][h.x] === "#") {
      h.dx = 1;
      h.dy = 0;
    }
  });
  reveal = Array.from({ length: H }, () => Array(W).fill(-1e9));
  pulses = [];
  moves = 0;
  charges = lv.charges === "Infinity" ? Infinity : Number(lv.charges);
  lastEcho = -1e9;
  startT = now();
  lastHazard = now();
  $("hLevel").textContent = i + 1;
  updateHud();
}

function updateHud() {
  $("hMoves").textContent = moves;
  $("hEcho").textContent = charges === Infinity ? "∞" : charges;
  $("hKey").textContent = hasKey ? "✓" : "✗";
  if (state === "play") $("hTime").textContent = (now() - startT).toFixed(1);
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("on");
  clearTimeout(toast.id);
  toast.id = setTimeout(() => t.classList.remove("on"), 1400);
}

function overlay(title, text, btn, onClick) {
  $("ovT").textContent = title;
  $("ovP").textContent = text;
  $("ovB").textContent = btn;
  $("ovB").onclick = onClick;
  $("ov").classList.remove("off");
}

// ---------- actions ----------
function walkable(x, y) {
  return x >= 0 && y >= 0 && x < W && y < H && grid[y][x] !== "#";
}

function move(dx, dy) {
  if (state !== "play") return;
  const nx = player.x + dx,
    ny = player.y + dy;
  if (!walkable(nx, ny)) return;
  if (exit.x === nx && exit.y === ny && !hasKey) {
    toast("The exit is locked. Find the key.");
    beep(120, 80, 0.15, "square", 0.06);
    return;
  }
  player.x = nx;
  player.y = ny;
  moves++;
  beep(220, 200, 0.04, "triangle", 0.04);
  if (!hasKey && key.x === nx && key.y === ny) {
    hasKey = true;
    toast("Key found. Now reach the exit.");
    beep(500, 1000, 0.25, "sine", 0.15);
  }
  if (hasKey && exit.x === nx && exit.y === ny) return win();
  checkHazards();
  updateHud();
}

function echo() {
  if (state !== "play") return;
  const t = now();
  if (t - lastEcho < ECHO_COOLDOWN) return;
  if (charges <= 0) {
    toast("No echoes left. Press R to restart.");
    return;
  }
  if (charges !== Infinity) charges--;
  lastEcho = t;
  pulses.push({ x: player.x + 0.5, y: player.y + 0.5, t0: t });
  beep(700, 140, 0.6, "sine", 0.14);
  updateHud();
}

function checkHazards() {
  if (hazards.some((h) => h.x === player.x && h.y === player.y)) {
    beep(200, 40, 0.4, "sawtooth", 0.12);
    toast("Caught! Restarting...");
    const keep = state;
    state = "over";
    setTimeout(() => {
      load(levels[levelIdx], levelIdx);
      state = keep;
    }, 700);
  }
}

function stepHazards(t) {
  if (t - lastHazard < HAZARD_STEP) return;
  lastHazard = t;
  hazards.forEach((h) => {
    if (!walkable(h.x + h.dx, h.y + h.dy)) {
      h.dx = -h.dx;
      h.dy = -h.dy;
    }
    h.x += h.dx;
    h.y += h.dy;
  });
  checkHazards();
}

function win() {
  state = "over";

  const secs = (now() - startT).toFixed(1);

  beep(400, 900, 0.5, "sine", 0.15);

  if (levelIdx + 1 < levels.length) {
    overlay(
      "ESCAPED",
      `Level ${levelIdx + 1} cleared\n${moves} moves · ${secs}s`,
      "Next level",
      () => {
        $("ov").classList.add("off");
        load(levels[levelIdx + 1], levelIdx + 1);
        state = "play";
      },
    );
  } else {
    overlay(
      "YOU ESCAPED EVERY ROOM",
      `Final room: ${moves} moves · ${secs}s`,
      "Play again",
      () => {
        $("ov").classList.add("off");
        load(levels[0], 0);
        state = "play";
      },
    );
  }
}

function restart() {
  if (state === "menu") return;
  $("ov").classList.add("off");
  load(levels[levelIdx], levelIdx);
  state = "play";
}

// ---------- input ----------
const KEYS = {
  ArrowUp: [0, -1],
  w: [0, -1],
  W: [0, -1],
  ArrowDown: [0, 1],
  s: [0, 1],
  S: [0, 1],
  ArrowLeft: [-1, 0],
  a: [-1, 0],
  A: [-1, 0],
  ArrowRight: [1, 0],
  d: [1, 0],
  D: [1, 0],
};
addEventListener("keydown", (e) => {
  if (KEYS[e.key]) {
    e.preventDefault();
    move(...KEYS[e.key]);
  } else if (e.key === " ") {
    e.preventDefault();
    echo();
  } else if (e.key === "r" || e.key === "R") restart();
});
$("echoBtn").onclick = echo;
$("restartBtn").onclick = restart;

// ---------- drawing ----------
function echoAlpha(t, rv) {
  const age = t - rv;
  if (age < 0) return 0;
  if (age < VISIBLE_FOR) return 1;
  return Math.max(0, 1 - (age - VISIBLE_FOR) / FADE_FOR);
}

function draw(t) {
  if (!Array.isArray(pulses)) {
    console.error("Invalid pulses value:", pulses);
    return;
  }
  ctx.fillStyle = "#020306";
  ctx.fillRect(0, 0, cv.width, cv.height);

  // expand pulses and mark tiles as revealed when the ring reaches them
  pulses = pulses.filter(
    (p) => t - p.t0 < ECHO_RADIUS / ECHO_SPEED + VISIBLE_FOR + FADE_FOR,
  );
  for (const p of pulses) {
    const r = Math.min((t - p.t0) * ECHO_SPEED, ECHO_RADIUS);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const d = Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y);
        if (d <= r && reveal[y][x] < p.t0) reveal[y][x] = p.t0 + d / ECHO_SPEED;
      }
  }

  const alphaAt = (x, y) => {
    const d = Math.hypot(
      x + 0.5 - (player.x + 0.5),
      y + 0.5 - (player.y + 0.5),
    );
    const near = Math.max(0, Math.min(1, (1.9 - d) / 0.9)) * 0.85; // small permanent light
    return Math.max(near, echoAlpha(t, reveal[y][x]));
  };

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const a = alphaAt(x, y);
      if (a <= 0.01) continue;
      const px = x * TILE,
        py = y * TILE;
      if (grid[y][x] === "#") {
        ctx.fillStyle = `rgba(60,110,165,${a})`;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = `rgba(150,215,255,${a * 0.7})`;
        ctx.strokeRect(px + 1.5, py + 1.5, TILE - 3, TILE - 3);
      } else {
        ctx.fillStyle = `rgba(22,38,64,${a})`;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = `rgba(60,90,130,${a * 0.5})`;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
      }
      if (!hasKey && key.x === x && key.y === y) {
        ctx.fillStyle = `rgba(255,209,102,${a})`;
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 9, 0, 7);
        ctx.fill();
        ctx.fillRect(px + TILE / 2 - 2, py + TILE / 2, 4, 14);
      }
      if (exit.x === x && exit.y === y) {
        ctx.fillStyle = hasKey
          ? `rgba(90,255,160,${a})`
          : `rgba(160,70,90,${a})`;
        ctx.fillRect(px + 6, py + 4, TILE - 12, TILE - 8);
        ctx.fillStyle = `rgba(0,0,0,${a * 0.6})`;
        ctx.fillRect(px + TILE - 15, py + TILE / 2 - 2, 4, 4);
      }
      for (const h of hazards)
        if (h.x === x && h.y === y) {
          ctx.fillStyle = `rgba(255,93,115,${a})`;
          ctx.beginPath();
          ctx.arc(px + TILE / 2, py + TILE / 2, 12, 0, 7);
          ctx.fill();
        }
    }

  // echo rings
  for (const p of pulses) {
    const r = Math.min((t - p.t0) * ECHO_SPEED, ECHO_RADIUS);
    const fade = Math.max(0, 1 - r / ECHO_RADIUS);
    if (fade <= 0) continue;
    ctx.strokeStyle = `rgba(95,212,255,${fade})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x * TILE, p.y * TILE, r * TILE, 0, 7);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // player
  const cx = player.x * TILE + TILE / 2,
    cy = player.y * TILE + TILE / 2;
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
  g.addColorStop(0, "rgba(255,255,255,.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, 7);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, 7);
  ctx.fill();
}

function loop() {
  const t = now();
  if (state === "play") {
    stepHazards(t);
    updateHud();
  }
  draw(t);
  requestAnimationFrame(loop);
}

// ---------- boot ----------

async function startGame() {
  try {
    const response = await fetch("http://localhost:3000/api/levels");

    if (!response.ok) {
      throw new Error("Failed to load levels from backend");
    }

    levels = await response.json();

    if (!Array.isArray(levels) || levels.length === 0) {
      throw new Error("No levels received from backend");
    }

    load(levels[0], 0);

    overlay(
      "ECHOES OF THE ROOM",
      "You wake up in a dark room.\nSend echoes to reveal walls, the key and the exit. Remember what you see.",
      "Start",
      () => {
        $("ov").classList.add("off");
        load(levels[0], 0);
        state = "play";
      },
    );
    loop();
  } catch (error) {
    console.error("Failed to start game:", error);
    overlay(
      "CONNECTION ERROR",
      "Could not load levels. Make sure the backend is running on port 3000, then refresh the page.",
      "Retry",
      () => {
        startGame();
      },
    );
  }
}

startGame();
