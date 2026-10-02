import type { Point, Player, Shot, Impact } from "./types";
import { H, RULES, SHOT_GRAVITY, STEP, TRAIL_SAFE_RADIUS, W } from "./config";
import { $ } from "./dom";
import { game } from "./state";
import { ARENAS } from "./arenaLayouts";
import { closedGates } from "./arenas";
import { potionSfx, sfx } from "./audio";
import { finishHorde } from "./horde";
import { effectStats } from "./progression";
import { clamp, distanceSegment, overlaps, segmentBox } from "./geometry";
import { bodyBox } from "./player";
import { burst, float } from "./effects";
import { updateHUD } from "./hud";

export const foes = (a: number, b: number) => (game.mode === "horde" ? (a === 0) !== (b === 0) : a !== b);
// Keep an actual gap in the trail, rather than relying only on a short immunity timer.
// Clip both outbound and returning segments so no lingering fire is drawn at the launch position.
export function addSafeTrail(s: Shot, oldX: number, oldY: number) {
  const dx = s.x - oldX,
    dy = s.y - oldY,
    ox = oldX - s.originX,
    oy = oldY - s.originY,
    a = dx * dx + dy * dy;
  if (a < 1e-9) return;
  const b = 2 * (ox * dx + oy * dy),
    c = ox * ox + oy * oy - TRAIL_SAFE_RADIUS * TRAIL_SAFE_RADIUS,
    disc = b * b - 4 * a * c,
    cuts = [0, 1];
  if (disc >= 0) {
    for (const t of [(-b - Math.sqrt(disc)) / (2 * a), (-b + Math.sqrt(disc)) / (2 * a)])
      if (t > 0 && t < 1) cuts.push(t);
  }
  cuts.sort((a, b) => a - b);
  for (let i = 0; i < cuts.length - 1; i++) {
    const lo = cuts[i],
      hi = cuts[i + 1],
      mid = (lo + hi) / 2;
    if (Math.hypot(ox + dx * mid, oy + dy * mid) < TRAIL_SAFE_RADIUS) continue;
    game.zones.push({
      type: "trail",
      x: oldX + dx * lo,
      y: oldY + dy * lo,
      nx: oldX + dx * hi,
      ny: oldY + dy * hi,
      life: effectStats(s.owner).trail,
      initialLife: effectStats(s.owner).trail,
      color: s.r.color,
      owner: s.owner,
    });
  }
}
export function win(id: number, reason: string) {
  if (game.state !== "playing") return;
  game.state = "over";
  game.roundWins[id]++;
  game.keys.clear();
  for (const p of game.players) p.aiming = false;
  $("overlay").classList.remove("hidden");
  $("overlay-tag").textContent = `ROUND ${game.round} CONCLUÍDO · ${reason}`;
  $("overlay-title").textContent = (id ? "Malva" : "Íris") + " venceu o round!";
  $("overlay-copy").textContent =
    `Rounds: Íris ${game.roundWins[0]} × ${game.roundWins[1]} Malva. Vença o próximo com 3 eliminações ou 2 estrelas.`;
  $("start").textContent = "Próximo round →";
  $("status").textContent = "ROUND ENCERRADO";
  updateHUD();
}
export function eliminate(p: Player, owner: number) {
  if (game.mode === "tutorial") {
    p.hp = p.maxHp;
    p.inv = 1.2;
    p.vx = 0;
    p.vy = 0;
    p.x = ARENAS[game.arenaId].spawns[p.id ? 1 : 0].x;
    p.y = ARENAS[game.arenaId].spawns[p.id ? 1 : 0].y;
    p.aiming = false;
    if (p.id === 0) {
      p.bag = [];
      p.potions = [];
      p.potionUses = [];
      p.selected = 0;
    }
    float(p, p.id === 0 ? "Tente novamente" : "Alvo restaurado", p.color);
    return;
  }
  if (game.mode === "horde") {
    if (p.dead) return;
    p.hp = 0;
    p.aiming = false;
    p.bag = [];
    p.potions = [];
    p.potionUses = [];
    p.selected = 0;
    if (p.id > 0) {
      p.dead = Infinity;
      game.horde.kills++;
      game.players[0].score++;
      float(p, "Eliminado!");
      sfx("enemyDown");
    } else {
      game.horde.lives--;
      p.dead = 1.6;
      sfx("playerDown");
      if (game.horde.lives <= 0) finishHorde();
    }
    return;
  }
  p.hp = 0;
  p.dead = 1.6;
  p.aiming = false;
  p.bag = [];
  p.potions = [];
  p.potionUses = [];
  p.selected = 0;
  for (const s of game.stars) if (s.owner === p.id) s.owner = null;
  p.stars = 0;
  const killer = owner === p.id ? 1 - p.id : owner;
  game.players[killer].score++;
  float(p, "Eliminado!");
  if (game.players[killer].score >= RULES.kills) win(killer, "3 ELIMINAÇÕES");
}
export function hit(
  p: Player | undefined,
  owner: number,
  damage: number,
  { lethal = false, reflected = false, dx = 0 } = {},
): boolean {
  if (
    !p ||
    game.state !== "playing" ||
    p.dead ||
    p.inv > 0 ||
    p.dashTime > 0 ||
    (game.mode === "horde" && owner > 0 && p.id > 0 && owner !== p.id)
  )
    return false;
  if (p.shield > 0) {
    burst(p.x, p.y, "#ffffff", 4);
    p.inv = 0.2;
    sfx("shield");
    return false;
  }
  const actual = lethal ? p.hp : Math.min(p.hp, damage),
    retaliate = p.reflect > 0 && !reflected && owner !== p.id;
  p.hp -= actual;
  p.vx += dx;
  p.inv = 0.6;
  game.shake = 5;
  burst(p.x, p.y, p.color, 12);
  sfx("hit");
  if (p.hp <= 0) eliminate(p, owner);
  if (retaliate) hit(game.players[owner], p.id, actual, { reflected: true });
  return true;
}
export function freeze(p: Player, duration = RULES.freeze) {
  if (p.dead || p.inv > 0 || p.shield > 0 || p.dashTime > 0) return;
  p.frozen = duration;
  p.aiming = false;
  p.vx = 0;
  float(p, "❄ Congelado · " + duration + "s", "#81ddef");
  sfx("freeze");
}
export function traceShot(s: Shot, dt = STEP): { x: number; y: number; vy: number; impact: Impact | null } {
  const nx = s.x + s.vx * dt,
    ny = s.y + s.vy * dt + 0.5 * SHOT_GRAVITY * dt * dt;
  let t = 1,
    target: Impact | null = null;
  const obstacles = [...game.platforms, ...game.masonry, ...game.walls, ...closedGates()];
  for (const b of obstacles) {
    const q = segmentBox(s.x, s.y, nx, ny, b, 4);
    if (q !== null && q <= t) {
      t = q;
      target = { kind: "terrain", body: b };
    }
  }
  for (const p of game.players)
    if (foes(p.id, s.owner) && !p.dead && s.r?.type !== "haste") {
      const q = segmentBox(s.x, s.y, nx, ny, bodyBox(p), 4);
      if (q !== null && q < t) {
        t = q;
        target = { kind: "player", body: p };
      }
    }
  if (nx < 4 || nx > W - 4 || ny > H - 4) {
    const candidates = [];
    if (nx < 4) candidates.push((4 - s.x) / (nx - s.x));
    if (nx > W - 4) candidates.push((W - 4 - s.x) / (nx - s.x));
    if (ny > H - 4) candidates.push((H - 4 - s.y) / (ny - s.y));
    const q = Math.max(0, Math.min(...candidates));
    if (q <= t) {
      t = q;
      target = { kind: "boundary" };
    }
  }
  return { x: s.x + (nx - s.x) * t, y: s.y + (ny - s.y) * t, vy: s.vy + SHOT_GRAVITY * dt, impact: target };
}
export function addWall(s: Point & { owner: number }) {
  const floors = [...game.platforms, ...game.masonry, ...game.walls]
    .filter((b) => s.x >= b.x - 8 && s.x <= b.x + b.w + 8 && b.y >= s.y - 8)
    .sort((a, b) => a.y - b.y);
  const base = floors[0]?.y ?? Math.min(505, s.y),
    h = Math.min(110, base - 4);
  if (h < 25) return;
  for (const offset of [0, -35, 35, -65, 65]) {
    const w = {
      x: clamp(s.x - 13 + offset, 2, W - 28),
      y: base - h,
      w: 26,
      h,
      life: effectStats(s.owner).wall,
      owner: s.owner,
    };
    if (
      [...game.masonry, ...game.walls, ...closedGates()].some((b) => overlaps(w.x, w.y, w.w, w.h, b)) ||
      game.players.some((p) => !p.dead && overlaps(p.x - 13, p.y - 23, 26, 42, w))
    )
      continue;
    game.walls.push(w);
    return;
  }
  float({ x: s.x, y: s.y, color: "#b2b0ff" }, "Sem espaço para a parede");
}
export function explode(s: Shot, impact: Impact | null) {
  burst(s.x, s.y, s.r.color, 25);
  game.shake = 3;
  const type = s.r.type;
  potionSfx(type);
  if (type === "ice") {
    const stats = effectStats(s.owner);
    for (const p of game.players)
      if (foes(p.id, s.owner) && Math.hypot(p.x - s.x, p.y - s.y) < stats.frostRadius)
        freeze(p, stats.freeze);
    game.zones.push({
      type: "frostFlash",
      x: s.x,
      y: s.y,
      radius: stats.frostRadius,
      life: 0.45,
      color: s.r.color,
      owner: s.owner,
    });
  } else if (type === "jump") addWall(s);
  else if (type === "poison") {
    const stats = effectStats(s.owner);
    game.zones.push({
      type,
      x: s.x,
      y: s.y,
      radius: stats.poisonRadius,
      life: stats.poison,
      color: s.r.color,
      owner: s.owner,
    });
  } else if (type === "steam") {
    game.zones.push({
      type,
      x: s.x,
      y: 0,
      w: effectStats(s.owner).width,
      life: 0.7,
      color: s.r.color,
      owner: s.owner,
      victims: [],
    });
  } else if (type === "fire") {
    for (const p of game.players)
      if (Math.hypot(p.x - s.x, p.y - s.y) < effectStats(s.owner).radius)
        hit(p, s.owner, 2, { dx: Math.sign(p.x - s.x) * 150 });
    const floor = [...game.platforms, ...game.masonry, ...game.walls]
      .filter((b) => s.x >= b.x && s.x <= b.x + b.w && b.y >= s.y - 10)
      .sort((a, b) => a.y - b.y)[0];
    if (floor)
      game.zones.push({
        type,
        x: clamp(s.x, floor.x, floor.x + floor.w),
        y: floor.y,
        w: Math.min(130, floor.w),
        left: Math.max(floor.x, s.x - 65),
        right: Math.min(floor.x + floor.w, s.x + 65),
        life: 5,
        color: s.r.color,
        owner: s.owner,
      });
  } else if (type === "haste" && impact?.kind === "player") hit(impact.body, s.owner, 5, { lethal: true });
}
export function applyZones() {
  for (const z of game.zones) {
    if (z.type === "frostFlash") continue;
    for (const p of game.players) {
      if (p.dead) continue;
      if (z.type === "poison" && Math.hypot(p.x - z.x, p.y - z.y) < z.radius + 12)
        hit(p, z.owner, 5, { lethal: true });
      if (
        z.type === "trail" &&
        (p.id !== z.owner || z.life < (z.initialLife ?? RULES.trail) - 0.4) &&
        distanceSegment(p.x, p.y, z.x, z.y, z.nx, z.ny) < 21
      )
        hit(p, z.owner, 5, { lethal: true });
      if (z.type === "fire" && p.x + 12 > z.left && p.x - 12 < z.right && Math.abs(p.y + 18 - z.y) < 24)
        hit(p, z.owner, 1);
      if (
        z.type === "steam" &&
        p.id !== z.owner &&
        Math.abs(p.x - z.x) < z.w / 2 + 12 &&
        !z.victims.includes(p.id)
      ) {
        if (hit(p, z.owner, 2)) z.victims.push(p.id);
      }
    }
  }
}
