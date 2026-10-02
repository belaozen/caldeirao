import type { Box, Player } from "./types";
import { CORRUPT_TYPE, ENEMY_TYPES, EVENT_TYPES, EVENT_WARNING, H, W, colors } from "./config";
import { recipeOf } from "./recipes";
import { ctx } from "./dom";
import { game, mouse } from "./state";
import { ARENAS } from "./arenaLayouts";
import { gateBox } from "./arenas";
import { clamp } from "./geometry";
import { activePotion, shotFrom } from "./player";
import { previewRecipe } from "./items";
import { traceShot } from "./combat";

export function drawNewArena() {
  const forest = game.arenaId === "forest",
    top = forest ? "#274735" : "#263b70",
    bottom = forest ? "#638664" : "#6586b0",
    soil = forest ? "#253035" : "#383047",
    rim = forest ? "#9ccf77" : "#8ce8ee";
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 12; i++) {
    const x = i * 93 + 15;
    rect(x, 70, 14, 470, forest ? "#28493955" : "#21356844");
    for (let j = 0; j < 4; j++) {
      circle(x + 6, 80 + j * 66, 42, forest ? "#81aa7330" : "#81b9d525");
    }
  }
  for (const b of [...game.masonry, ...game.platforms]) {
    rect(b.x, b.y, b.w, b.h, soil);
    rect(b.x, b.y, b.w, 5, rim);
    for (let x = b.x + 6; x < b.x + b.w; x += 17) {
      rect(x, b.y + 5, 5, 5, forest ? "#618953" : "#507f9a");
      for (let y = b.y + 18; y < b.y + b.h; y += 22) rect(x, y, 8, 4, forest ? "#3a4743" : "#524059");
    }
  }
  for (const b of game.platforms)
    if (!b.star) {
      rect(b.x + 15, b.y - 7, 3, 7, rim);
      circle(b.x + 17, b.y - 8, 5, rim);
    }
  for (const w of game.walls) drawStone(w, true);
  ctx.fillStyle = "#dcdef7";
  ctx.textAlign = "center";
  ctx.font = "bold 10px system-ui";
  ctx.fillText("↓ PASSAGEM PARA O TOPO", ARENAS[game.arenaId].returnX, H - 13);
}
export function drawSidePortals() {
  const [top, bottom] = ARENAS[game.arenaId].portal;
  for (const x of [2, W - 5]) {
    rect(x, top, 3, bottom - top, "#bcb4ff88");
    ctx.fillStyle = "#e0d9ff";
    ctx.font = "bold 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(x < 100 ? "«" : "»", x < 100 ? 17 : W - 17, (top + bottom) / 2);
  }
}
export function drawSpawnWarnings() {
  if (game.mode !== "horde" || game.horde.phase !== "spawn") return;
  ctx.save();
  ctx.textAlign = "center";
  for (const q of game.horde.pending) {
    const t = ENEMY_TYPES[q.kind];
    ctx.strokeStyle = t.color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.ellipse(q.x, q.y + 17, 24, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = t.color;
    ctx.font = "bold 11px system-ui";
    ctx.fillText(t.mark + " " + t.name + " · " + Math.ceil(game.horde.timer) + "s", q.x, q.y - 36);
  }
  ctx.restore();
}
export function rect(x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}
export function circle(x: number, y: number, r: number, c: string) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
export function starShape(x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5,
      rad = i % 2 ? r * 0.45 : r;
    const px = x + Math.cos(a) * rad,
      py = y + Math.sin(a) * rad;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}
export function halfHeartShape(x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, r * 0.8);
  ctx.bezierCurveTo(-r * 1.25, r * 0.05, -r * 1.05, -r * 0.85, -r * 0.48, -r * 0.88);
  ctx.bezierCurveTo(-r * 0.12, -r * 0.9, 0, -r * 0.58, 0, -r * 0.42);
  ctx.bezierCurveTo(0, -r * 0.58, r * 0.12, -r * 0.9, r * 0.48, -r * 0.88);
  ctx.bezierCurveTo(r * 1.05, -r * 0.85, r * 1.25, r * 0.05, 0, r * 0.8);
  ctx.closePath();
  ctx.fillStyle = "#4f3440";
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#ff829d";
  ctx.fillRect(-r * 1.3, -r * 1.1, r * 1.3, r * 2.2);
  ctx.restore();
  ctx.strokeStyle = "#ffd2dc";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}
export function drawStone(b: Box & { life?: number }, lunar = false) {
  rect(b.x, b.y, b.w, b.h, lunar ? "#585575" : "#34464d");
  rect(b.x, b.y, 3, b.h, lunar ? "#b2b0ff" : "#6b8783");
  for (let y = b.y + 10; y < b.y + b.h; y += 18) {
    rect(b.x + 3, y, b.w - 4, 1, lunar ? "#9290be" : "#4d6568");
    rect(b.x + b.w / 2, y - 9, 1, 9, "#263640");
  }
  if (lunar) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#e3ddff";
    ctx.font = "bold 10px system-ui";
    ctx.fillText(Math.ceil(b.life!) + "s", b.x + b.w / 2, b.y - 8);
  }
}
export function drawBackground() {
  if (game.arenaId !== "classic") {
    drawNewArena();
    return;
  }
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#142330");
  grad.addColorStop(1, "#23363a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  circle(480, 112, 61, "#bcc5a318");
  circle(480, 112, 29, "#dce3b554");
  circle(490, 104, 26, "#21303a");
  ctx.strokeStyle = "#3b5153";
  ctx.lineWidth = 3;
  for (let x = 0; x <= W; x += 120) {
    ctx.beginPath();
    ctx.moveTo(x, 505);
    ctx.lineTo(x, 90 + Math.abs(x - 480) * 0.2);
    ctx.lineTo(480, 25);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 275);
  ctx.lineTo(W, 275);
  ctx.moveTo(0, 455);
  ctx.lineTo(W, 455);
  ctx.stroke();
  for (let i = 0; i < 38; i++) circle((i * 127 + 23) % 960, (i * 83) % 460, 1.3, "#c8d7ad30");
  for (const x of [25, 935]) {
    rect(x - 3, 225, 6, 280, "#35564b");
    for (let j = 0; j < 9; j++) {
      ctx.fillStyle = j % 2 ? "#3a5e51" : "#466b55";
      ctx.beginPath();
      ctx.ellipse(x + (j % 2 ? 11 : -11), 295 + j * 23, 18, 6, j % 2 ? -0.5 : 0.5, 0, 7);
      ctx.fill();
    }
  }
  for (const p of game.platforms) {
    rect(p.x, p.y, p.w, p.h, "#3e5056");
    rect(p.x, p.y, p.w, 4, p.star ? "#d8c281" : "#91a884");
    rect(p.x, p.y + 5, p.w, 3, "#5c7170");
    for (let x = p.x + 8; x < p.x + p.w - 10; x += 32) rect(x, p.y + 12, 20, 2, "#2d3b43");
  }
  for (const b of game.masonry) drawStone(b);
  ctx.textAlign = "center";
  ctx.font = "bold 10px system-ui";
  ctx.fillStyle = "#d5c598";
  ctx.fillText("OBSERVATÓRIO", 205, 117);
  ctx.fillText("OBSERVATÓRIO", 755, 117);
  ctx.fillStyle = "#a8b4d5";
  ctx.fillText("☾ SUPERPULO", 205, 133);
  ctx.fillText("☾ SUPERPULO", 755, 133);
  rect(433, 0, 94, 10, "#b2b0ff66");
  rect(428, 529, 104, 11, "#b2b0ff88");
  for (let i = 0; i < 4; i++) {
    const y = (game.time * 30 + i * 38) % 145;
    ctx.fillStyle = "#b2b0ff44";
    ctx.fillText("⌄", 480, y + 18);
  }
  ctx.fillStyle = "#c5c1f4";
  ctx.fillText("↓ VOLTA AO TOPO ↓", 480, 500);
  for (const w of game.walls) drawStone(w, true);
}
export function drawDashTrail(p: Player) {
  if (p.dashTime <= 0) return;
  ctx.save();
  for (let i = 3; i >= 1; i--) {
    ctx.globalAlpha = (0.32 - i * 0.065) * Math.min(1, p.dashTime / 0.07);
    const x = -p.dashDir * i * 18,
      y = -p.dashY * i * 18;
    rect(x - 10, y - 23, 20, 13, p.color);
    rect(x - 12, y - 7, 24, 21, p.color);
  }
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = "#e2fff8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -3, 22, 28, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.7;
  for (let i = 0; i < 3; i++)
    rect(-p.dashDir * (25 + i * 10) - (p.dashDir > 0 ? 15 : 0), -16 + i * 13, 15, 2, p.color);
  ctx.restore();
}
export function drawPlayer(p: Player) {
  if (p.dead > 0) return;
  ctx.save();
  ctx.translate(Math.round(p.x), Math.round(p.y));
  if (p.kind === "chaser") ctx.globalAlpha = 0.38 + 0.62 * (0.5 + 0.5 * Math.sin(game.time * 14));
  if (p.kind === "tank") {
    ctx.translate(0, -5.4);
    ctx.scale(1.4, 1.3);
  }
  drawDashTrail(p);
  if (p.inv > 0 && Math.floor(game.time * 14) % 2) ctx.globalAlpha = 0.5;
  if (p.burn > 0) {
    circle(0, -2, 28, "#ff995333");
    for (let i = 0; i < 7; i++)
      circle(Math.sin(game.time * 8 + i) * 20, 10 - ((game.time * 50 + i * 8) % 44), 4, "#ffba72");
  }
  if (p.reflect > 0) {
    ctx.strokeStyle = "#ffd97f";
    ctx.lineWidth = 2;
    ctx.strokeRect(-20, -29, 40, 53);
  }
  if (p.superjump > 0) circle(0, 17, 15, "#b2b0ff44");
  if (p.shield > 0) {
    ctx.strokeStyle = "#dcfff3";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -3, 28, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (p.speed > 0) rect(-p.face * 27, -5, 13, 3, "#e2dcff");
  rect(-8, 9, 6, 11, "#131f2c");
  rect(3, 9, 6, 11, "#131f2c");
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.moveTo(-10, -9);
  ctx.lineTo(9, -9);
  ctx.lineTo(15, 13);
  ctx.lineTo(-15, 13);
  ctx.closePath();
  ctx.fill();
  rect(-10, 7, 20, 4, "#394356");
  rect(-8, -23, 16, 17, "#e4cdb0");
  rect(-11, -25, 22, 8, p.color);
  rect(-13, -19, 6, 15, p.color);
  rect(7, -19, 6, 15, p.color);
  const look = p.id === 0 ? p.angle : p.face < 0 ? Math.PI : 0;
  rect(Math.cos(look) * 4 - 2, -17 + Math.sin(look) * 2, 4, 4, "#202738");
  const handX = Math.cos(look) * 18,
    handY = -8 + Math.sin(look) * 18;
  circle(handX * 0.7, handY, 4, "#e4cdb0");
  const held = recipeOf(activePotion(p));
  if (held) {
    circle(handX, handY, 6, held.color);
    rect(handX - 2, handY - 9, 4, 5, "#dfded0");
  }
  if (p.id === 0 && mouse.known) circle(Math.cos(look) * 31, -8 + Math.sin(look) * 31, 2, p.color);
  if (p.frozen > 0) {
    rect(-18, -29, 36, 51, "#81ddef66");
    ctx.strokeStyle = "#b5f2ff";
    ctx.strokeRect(-18, -29, 36, 51);
    ctx.fillStyle = "#efffff";
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(Math.ceil(p.frozen) + "s", 0, 5);
  }
  ctx.restore();
  ctx.fillStyle = p.color;
  ctx.textAlign = "center";
  ctx.font = "bold 10px monospace";
  ctx.fillText(
    p.name.toUpperCase() + (p.stars ? (game.mode === "horde" ? " ♥½" : " ★") : ""),
    p.x,
    p.y - (p.kind === "tank" ? 49 : 39),
  );
  for (let i = 0; i < p.hp; i++) rect(p.x - (p.maxHp * 6 - 2) / 2 + i * 6, p.y - 32, 4, 3, p.color);
}
export function aimPath(p: Player) {
  let s = shotFrom(p);
  const points = [{ x: s.x, y: s.y }];
  for (let i = 0; i < 540; i++) {
    const next = traceShot(s);
    s.x = next.x;
    s.y = next.y;
    s.vy = next.vy;
    if (i % 6 === 0 || next.impact) points.push({ x: s.x, y: s.y });
    if (next.impact) break;
  }
  return points;
}
export function drawAim(p: Player) {
  if (!p.aiming || !activePotion(p) || p.dead) return;
  const path = aimPath(p),
    r = recipeOf(activePotion(p))!;
  ctx.save();
  ctx.strokeStyle = r.color;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 7]);
  ctx.beginPath();
  path.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)));
  ctx.stroke();
  ctx.setLineDash([]);
  const end = path[path.length - 1];
  ctx.beginPath();
  ctx.arc(end.x, end.y, 9, 0, 7);
  ctx.stroke();
  rect(end.x - 13, end.y, 26, 1, r.color);
  rect(end.x, end.y - 13, 1, 26, r.color);
  const x = clamp(p.x, 65, W - 65),
    y = Math.max(40, p.y - 66);
  rect(x - 43, y, 86, 5, "#0a1527");
  rect(x - 43, y, (86 * (p.power - 180)) / 620, 5, r.color);
  ctx.textAlign = "center";
  ctx.font = "bold 10px system-ui";
  ctx.fillStyle = r.color;
  ctx.fillText("FORÇA " + Math.round(((p.power - 180) / 620) * 100) + "%", x, y - 6);
  ctx.restore();
}
export function drawGates() {
  for (let side = 0; side < 2; side++) {
    const b = gateBox(side),
      open = side === game.gate.openSide;
    ctx.save();
    ctx.strokeStyle = open ? "#c6ec80" : "#c599a8";
    ctx.lineWidth = 2;
    if (!open) {
      rect(b.x, b.y, b.w, b.h, "#292b40aa");
      for (let x = b.x + 5; x < b.x + b.w; x += 13) {
        rect(x, b.y, 3, b.h, "#b298b6aa");
      }
      rect(b.x, b.y + b.h - 5, b.w, 5, "#b298b6");
    }
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    ctx.textAlign = "center";
    ctx.fillStyle = open ? "#d6f79d" : "#e7bdce";
    ctx.font = "bold 10px system-ui";
    ctx.fillText(
      open
        ? "ABERTA · " + Math.ceil(game.gate.remaining) + "s"
        : "ABRE EM " + Math.ceil(game.gate.remaining) + "s",
      b.x + b.w / 2,
      b.y + b.h + 45,
    );
    ctx.restore();
  }
}
export function drawArenaEvent() {
  if (game.mode === "tutorial") return;
  const type = game.arenaEvent.type ?? game.arenaEvent.pending,
    active = game.arenaEvent.phase === "active",
    warning = !active && game.arenaEvent.remaining <= EVENT_WARNING;
  if (type && (active || warning)) {
    ctx.save();
    const pulse = 0.35 + Math.sin(game.time * 10) * 0.15;
    ctx.globalAlpha = active ? 0.85 : pulse;
    if (type === "lava") {
      for (const [x, w] of [...game.platforms, ...game.masonry]
        .filter((b) => b.y >= 500)
        .map((b) => [b.x, b.w])) {
        rect(x, 480, w, 60, active ? "#dc4931" : "#e98850");
        if (active) {
          for (let px = x; px < x + w; px += 12)
            circle(px, 482 + Math.sin(game.time * 5 + px * 0.05) * 3, 5, "#ffd77f");
          rect(x, 500, w, 7, "#ffb964");
        } else {
          ctx.strokeStyle = "#ffe39d";
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 8]);
          ctx.beginPath();
          ctx.moveTo(x, 480);
          ctx.lineTo(x + w, 480);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    } else if (type === "lasers") {
      for (const x of [0, W - 38]) {
        rect(x, 0, 38, H, active ? "#eb5eaa" : "#e495c2");
        if (active) {
          rect(x + 15, 0, 8, H, "#ffeafa");
          for (let y = 0; y < H; y += 32) rect(x + 7, y + ((game.time * 100) % 32), 24, 3, "#fff6fc");
        }
      }
    } else if (type === "rain") {
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "#c6ec80";
      ctx.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        const x = (i * 113 + 25) % W,
          y = (game.time * 150 + i * 67) % H;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y + 10);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  ctx.save();
  rect(W / 2 - 100, 12, 200, 32, "#101b2aeb");
  ctx.strokeStyle = (type && EVENT_TYPES[type].color) || "#6f829a";
  ctx.strokeRect(W / 2 - 100, 12, 200, 32);
  ctx.fillStyle = (type && EVENT_TYPES[type].color) || "#d1deed";
  ctx.font = "bold 12px system-ui";
  ctx.textAlign = "center";
  const name =
    type === "lava" ? "LAVA" : type === "lasers" ? "LASERS" : type === "rain" ? "CHUVA DE INSUMOS" : "EVENTO";
  ctx.fillText(name + " · " + Math.ceil(game.arenaEvent.remaining) + "s", W / 2, 33);
  ctx.restore();
}
export function draw() {
  ctx.save();
  if (game.shake) ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  drawBackground();
  drawSidePortals();
  drawGates();
  drawArenaEvent();
  drawSpawnWarnings();
  for (const z of game.zones) {
    ctx.globalAlpha = Math.min(1, z.life);
    if (z.type === "poison") {
      circle(z.x, z.y, z.radius, "#c6ec8033");
      ctx.strokeStyle = "#d5f394";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius, 0, 7);
      ctx.stroke();
      ctx.setLineDash([]);
      for (let i = 0; i < 10; i++)
        circle(
          z.x + Math.cos(i * 2.4 + game.time) * z.radius * 0.7,
          z.y + Math.sin(i * 2.4 + game.time) * z.radius * 0.7,
          8,
          "#c6ec8038",
        );
      ctx.textAlign = "center";
      ctx.fillStyle = "#eeffba";
      ctx.font = "bold 11px system-ui";
      ctx.fillText("☠ " + Math.ceil(z.life) + "s", z.x, z.y + 4);
    } else if (z.type === "trail") {
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(z.x, z.y);
      ctx.lineTo(z.nx, z.ny);
      ctx.stroke();
      ctx.lineCap = "butt";
    } else if (z.type === "steam") {
      rect(z.x - z.w / 2, 0, z.w, H, "#e2dcff77");
      rect(z.x - 5, 0, 10, H, "#ffffffcc");
    } else if (z.type === "frostFlash") {
      circle(z.x, z.y, z.radius, "#81ddef44");
    } else if (z.type === "fire") {
      rect(z.left, z.y - 10, z.right - z.left, 10, z.color);
      for (let x = z.left + 4; x < z.right; x += 12)
        circle(x, z.y - 12 - Math.sin(game.time * 9 + x) * 5, 4, "#ffd67b");
    }
    ctx.globalAlpha = 1;
  }
  for (const s of game.stars) {
    if (s.owner !== null) continue;
    const y = s.y + Math.sin(game.time * 2) * 3;
    if (game.mode === "horde") {
      circle(s.x, y, 23, "#ff829d18");
      halfHeartShape(s.x, y, 13);
    } else {
      circle(s.x, y, 23, "#ffe29115");
      starShape(s.x, y, 13, "#ffe291");
    }
  }
  for (const item of game.items) {
    ctx.globalAlpha = item.life < 3 ? 0.65 + Math.sin(game.time * 12) * 0.2 : 1;
    const y = item.y + Math.sin(game.time * 2 + item.x) * 3;
    if (item.t === CORRUPT_TYPE) {
      circle(item.x, y, 19, "#8d58b629");
      ctx.strokeStyle = "#9b69be";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(item.x, y, 16 + Math.sin(game.time * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.save();
      ctx.translate(item.x, y);
      ctx.rotate(Math.PI / 4);
      rect(-7, -7, 14, 14, "#090a0d");
      rect(-4, -4, 3, 3, "#6d527d");
      ctx.restore();
      ctx.fillStyle = "#d5b9e7";
      ctx.textAlign = "center";
      ctx.font = "bold 10px system-ui";
      ctx.fillText("!", item.x, y + 4);
      ctx.globalAlpha = 1;
      continue;
    }
    const r = previewRecipe(item);
    if (r) {
      circle(item.x, y, 17, "#101b2a");
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(item.x, y, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = r.color;
      ctx.textAlign = "center";
      ctx.font = "bold 23px system-ui";
      ctx.fillText(r.icon, item.x, y + 8);
      circle(item.x + 12, y + 12, 5, "#101b2a");
      circle(item.x + 12, y + 12, 3, colors[item.t]);
    } else {
      circle(item.x, y, 14, colors[item.t] + "18");
      ctx.save();
      ctx.translate(item.x, y);
      ctx.rotate(Math.PI / 4);
      rect(-5, -5, 10, 10, colors[item.t]);
      rect(-3, -3, 3, 3, "#ffffff99");
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  for (const p of game.players) drawPlayer(p);
  for (const p of game.players) drawAim(p);
  for (const s of game.shots) {
    circle(s.x, s.y, 7, s.r.color);
    rect(s.x - 2, s.y - 10, 4, 5, "#eae8d3");
  }
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    rect(p.x, p.y, 3, 3, p.color);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";
  ctx.font = "bold 12px system-ui";
  for (const t of game.texts) {
    ctx.globalAlpha = Math.min(1, t.life * 2);
    ctx.fillStyle = t.color;
    ctx.fillText(t.s, clamp(t.x, 95, W - 95), Math.max(20, t.y));
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
