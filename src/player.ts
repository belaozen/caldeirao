import type { Box, RecipeKey, Player, Item, Shot } from "./types";
import { DASH, GRAVITY, H, W } from "./config";
import { mixKey, recipeOf, recipes } from "./recipes";
import { game, mouse } from "./state";
import { ARENAS } from "./arenaLayouts";
import { closedGates, portalMove } from "./arenas";
import { potionSfx, sfx } from "./audio";
import { tutorialMark } from "./tutorial";
import { available, effectStats, playerMaxHp, playerSpeedFactor, potionActivations } from "./progression";
import { clamp, overlaps } from "./geometry";
import { burst, float } from "./effects";
import { eliminate } from "./combat";
import { updateHUD } from "./hud";

export function bodyBox(p: Player): Box {
  const big = p.kind === "tank";
  return { x: p.x - (big ? 18 : 12), y: p.y - (big ? 32 : 22), w: big ? 36 : 24, h: big ? 50 : 40 };
}
export function makePlayer(id: number): Player {
  const maxHp = playerMaxHp(id),
    speedFactor = playerSpeedFactor(id);
  return {
    id,
    name: id ? "Malva" : "Íris",
    maxHp,
    speedFactor,
    x: ARENAS[game.arenaId].spawns[id ? 1 : 0].x,
    y: ARENAS[game.arenaId].spawns[id ? 1 : 0].y,
    vx: 0,
    vy: 0,
    color: id ? "#f8a2bd" : "#80d9e8",
    face: id ? -1 : 1,
    hp: maxHp,
    score: 0,
    stars: 0,
    bag: [],
    potions: [],
    potionUses: [],
    selected: 0,
    jumps: 0,
    inv: 1.8,
    shield: 0,
    superjump: 0,
    speed: 0,
    burn: 0,
    reflect: 0,
    frozen: 0,
    dead: 0,
    aiming: false,
    dropTimer: 0,
    dashTime: 0,
    dashCooldown: 0,
    dashDir: 0,
    dashY: 0,
    attackCooldown: 0,
    lastTapDir: 0,
    lastTapTime: -Infinity,
    taps: {},
    angle: id ? -Math.PI * 0.75 : -Math.PI * 0.25,
    power: 520,
    ai: 0,
    aiCharge: 0,
    aiTrack: 0,
    aiLastX: null,
    aiLastY: null,
    aiStuck: 0,
  };
}
export function beginDash(p: Player, dx: number, dy = 0) {
  if (game.state !== "playing" || p.dead || p.frozen || p.dashCooldown > 0 || p.dashTime > 0) return false;
  if (!dx && !dy) dx = p.face;
  const length = Math.hypot(dx, dy);
  p.aiming = false;
  p.dashTime = DASH.duration;
  p.dashCooldown = DASH.cooldown;
  p.dashDir = dx / length;
  p.dashY = dy / length;
  if (dx) p.face = Math.sign(dx);
  p.vx = p.dashDir * DASH.speed;
  p.vy = p.dashY * DASH.speed;
  burst(p.x, p.y, p.color, 10);
  sfx("dash");
  updateHUD();
  return true;
}
export function dashFromKeys(p: Player) {
  const dx =
      (game.keys.has("KeyD") || game.keys.has("ArrowRight") ? 1 : 0) -
      (game.keys.has("KeyA") || game.keys.has("ArrowLeft") ? 1 : 0),
    dy =
      (game.keys.has("KeyS") || game.keys.has("ArrowDown") ? 1 : 0) -
      (game.keys.has("KeyW") || game.keys.has("ArrowUp") ? 1 : 0);
  beginDash(p, dx, dy);
}
export function activePotion(p: Player): RecipeKey | null {
  return p.potions[p.selected] ?? null;
}
export function consumePotion(p: Player) {
  const index = p.selected,
    key = p.potions[index] ?? null;
  if (key === null) return null;
  p.potionUses ??= [];
  p.potionUses[index] = (p.potionUses[index] ?? 0) + 1;
  if (p.potionUses[index] >= potionActivations(p)) {
    p.potions.splice(index, 1);
    p.potionUses.splice(index, 1);
    p.selected = p.potions.length ? index % p.potions.length : 0;
  }
  return key;
}
export function cyclePotion(p: Player) {
  if (p.dead || p.frozen || p.potions.length < 2) return;
  p.selected = (p.selected + 1) % p.potions.length;
  sfx("cycle");
  updateHUD();
}
export function corruptPickup(p: Player, item: Item) {
  const index = p.selected ?? 0,
    hadPotion = p.potions.length > 0;
  if (hadPotion) {
    const lost = p.potions[index] ?? p.potions[0],
      lostIndex = p.potions[index] != null ? index : 0,
      r = recipeOf(lost);
    p.potions.splice(lostIndex, 1);
    p.potionUses.splice(lostIndex, 1);
    p.selected = p.potions.length ? Math.min(lostIndex, p.potions.length - 1) : 0;
    float(p, "☠ " + (r?.name ?? "Poção") + " estragada!", "#b58cff");
  } else if (p.bag.length) {
    p.bag = [];
    float(p, "☠ Mistura estragada!", "#b58cff");
  } else float(p, "☠ Insumo corrompido!", "#b58cff");
  burst(item.x, item.y, "#7f55a8", 18);
  sfx("corrupt");
  if (!p.dead) {
    p.hp -= 1;
    p.inv = Math.max(p.inv, 0.35);
    game.shake = 7;
    burst(p.x, p.y, "#31233e", 14);
    if (p.hp <= 0) eliminate(p, game.mode === "horde" ? -1 : 1 - p.id);
  }
}
export function autoMix(p: Player) {
  if (p.bag.length >= 2 && !available(mixKey(p.bag[0], p.bag[1]))) return;
  if (!p.dead && p.potions.length < 3 && p.bag.length >= 2) {
    // The bag only ever holds base ingredients (0-2), so every pair is a real recipe.
    const [a, b] = p.bag.splice(0, 2),
      key = mixKey(a, b) as RecipeKey;
    p.potions.push(key);
    p.potionUses ??= [];
    p.potionUses.push(0);
    const r = recipes[key];
    float(p, r.icon + " " + r.name + " · " + p.potions.length + "/3", r.color);
    burst(p.x, p.y, r.color);
    sfx("mix");
    if (p.id === 0) tutorialMark("mix");
  }
}
export function jump(p: Player) {
  if (!p.dead && !p.frozen && !p.aiming && p.jumps < 2) {
    p.vy = p.superjump > 0 ? -740 : -440;
    p.jumps++;
    burst(p.x, p.y + 18, p.color, 6);
    sfx("jump");
    if (p.id === 0) tutorialMark("jump");
  }
}
export function updateMouseAim(p: Player) {
  if (p.id !== 0 || !mouse.known || p.frozen || p.dead) return;
  const dx = mouse.x - p.x,
    dy = mouse.y - (p.y - 8);
  if (Math.hypot(dx, dy) > 2) {
    p.angle = Math.atan2(dy, dx);
    p.face = dx < 0 ? -1 : 1;
  }
  p.power = clamp(180 + Math.hypot(dx, dy) * 1.4, 180, 800);
}
export function beginAim(p: Player) {
  if (p.dead || p.frozen || p.dashTime > 0 || !activePotion(p) || p.aiming) return;
  p.aiming = true;
  if (p.id === 0) {
    updateMouseAim(p);
    tutorialMark("aim");
  } else p.angle = p.face < 0 ? -Math.PI * 0.75 : -Math.PI * 0.25;
  updateHUD();
}
export function cancelAim(p: Player, feedback = false) {
  const was = p.aiming;
  p.aiming = false;
  if (was && feedback) float(p, "Mira cancelada · poção guardada");
  updateHUD();
}
export function shotFrom(p: Player): Shot {
  return {
    x: p.x,
    y: p.y - 8,
    originX: p.x,
    originY: p.y - 8,
    vx: Math.cos(p.angle) * p.power,
    vy: Math.sin(p.angle) * p.power,
    owner: p.id,
    r: recipeOf(activePotion(p))!,
    life: 4.5,
  };
}
export function releaseAim(p: Player) {
  if (!p.aiming) return;
  p.aiming = false;
  if (p.dead || p.frozen || !activePotion(p)) return;
  updateMouseAim(p);
  game.shots.push(shotFrom(p));
  consumePotion(p);
  autoMix(p);
  sfx("throw");
  if (p.id === 0) tutorialMark("throw");
  updateHUD();
}
export function drink(p: Player) {
  if (p.dead || p.frozen || !activePotion(p)) return;
  p.aiming = false;
  const r = recipes[consumePotion(p)!],
    a = effectStats(p.id);
  switch (r.type) {
    case "ice":
      p.shield = a.shield;
      break;
    case "jump":
      p.superjump = a.lunar;
      break;
    case "poison":
      p.hp = Math.min(p.maxHp, p.hp + a.heal);
      break;
    case "fire":
      p.burn = a.burn;
      break;
    case "steam":
      p.speed = a.speed;
      break;
    case "haste":
      p.reflect = a.reflect;
      break;
  }
  float(p, r.drink, r.color);
  burst(p.x, p.y, r.color, 24);
  sfx("drink");
  potionSfx(r.type);
  if (p.id === 0) tutorialMark("drink");
  autoMix(p);
  updateHUD();
}
export function dropThrough(p: Player) {
  if (p.dead || p.frozen || p.aiming) return;
  const floor = game.platforms.find(
    (b) => b.y < 500 && p.x + 11 > b.x && p.x - 11 < b.x + b.w && Math.abs(p.y + 18 - b.y) < 4,
  );
  if (floor) {
    p.dropTimer = 0.3;
    p.y += 3;
    p.vy = 100;
  }
}
export function movePlayer(p: Player, dt: number, dir: number) {
  let speed = (p.speed > 0 ? 360 : 230) * p.speedFactor;
  if (p.frozen) {
    p.vx = 0;
    dir = 0;
  } else if (p.dashTime > 0) {
    p.vx = p.dashDir * DASH.speed;
    p.vy = p.dashY * DASH.speed;
  } else if (p.aiming) p.vx = 0;
  else p.vx += (dir * speed - p.vx) * Math.min(1, dt * 12);
  const hw = p.kind === "tank" ? 18 : 12,
    head = p.kind === "tank" ? 32 : 22;
  const solids = [...game.masonry, ...game.walls, ...closedGates()],
    oldX = p.x;
  p.x = portalMove(p, p.x + p.vx * dt, hw, head);
  if ((p.x === hw + 1 && p.vx < 0) || (p.x === W - hw - 1 && p.vx > 0)) {
    p.vx = 0;
    if (p.dashTime > 0) p.vy = 0;
    p.dashTime = 0;
  }
  for (const b of solids)
    if (overlaps(p.x - hw, p.y - head, hw * 2, head + 18, b)) {
      if (oldX + hw <= b.x + 0.5) p.x = b.x - hw;
      else if (oldX - hw >= b.x + b.w - 0.5) p.x = b.x + b.w + hw;
      else continue;
      p.vx = 0;
      if (p.dashTime > 0) p.vy = 0;
      p.dashTime = 0;
    }
  const oldY = p.y;
  if (p.dashTime <= 0) p.vy += GRAVITY * dt;
  p.y += p.vy * dt;
  for (const b of [...game.platforms, ...solids]) {
    if (p.x + hw - 1 <= b.x || p.x - hw + 1 >= b.x + b.w) continue;
    if (!solids.includes(b) && b.y < 500 && p.dropTimer > 0) continue;
    if (p.vy >= 0 && oldY + 18 <= b.y + 0.5 && p.y + 18 >= b.y) {
      const landingVy = p.vy;
      p.y = b.y - 18;
      p.vy = 0;
      p.jumps = 0;
      if (p.id === 0 && landingVy > 260) sfx("land");
      if (p.dashY > 0) p.dashTime = 0;
    } else if (solids.includes(b) && p.vy < 0 && oldY - head >= b.y + b.h - 0.5 && p.y - head <= b.y + b.h) {
      p.y = b.y + b.h + head;
      p.vy = 0;
      p.dashTime = 0;
    }
  }
  if (p.y < head) {
    p.y = head;
    p.vy = Math.max(0, p.vy);
    p.dashTime = 0;
  }
  if (p.y - head > H) {
    p.x = ARENAS[game.arenaId].returnX;
    p.y = ARENAS[game.arenaId].returnY ?? 23;
    p.vx = 0;
    p.vy = 120;
    p.jumps = 2;
    p.aiming = false;
    p.dashTime = 0;
    burst(p.x, p.y, p.color, 20);
    float(p, "↧ Passagem lunar");
  }
}
