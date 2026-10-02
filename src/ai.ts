import type { Point, Player } from "./types";
import { mixKey } from "./recipes";
import { SHOT_GRAVITY } from "./config";
import { game } from "./state";
import { closedGates } from "./arenas";
import { available } from "./progression";
import { clamp } from "./geometry";
import { activePotion, beginAim, beginDash, drink, dropThrough, jump, releaseAim } from "./player";

export function bot(p: Player, dt: number) {
  if (game.mode === "tutorial") return 0;
  const enemy = game.players[0];
  p.ai -= dt;
  if (p.kind === "chaser") {
    p.aiTrack += dt;
    const dx = enemy.x - p.x,
      dy = enemy.y - p.y;
    if (p.aiTrack > 0.35) {
      p.aiTrack = 0;
      if (dy < -38 && p.jumps < 2) jump(p);
      else if (dy > 65) dropThrough(p);
      if (Math.abs(dx) > 45 && p.dashCooldown <= 0 && Math.random() < 0.22)
        beginDash(p, Math.sign(dx), dy < -70 ? -0.18 : 0);
    }
    return Math.abs(dx) > 8 ? Math.sign(dx) : 0;
  }
  let target: Point = enemy;
  const loot = game.items.filter((i) => !p.bag.length || available(mixKey(p.bag[0], i.t)));
  if (game.mode !== "horde" && p.superjump > 0) {
    target = game.stars.find((s) => s.owner === null && s.side === game.gate.openSide) ?? enemy;
  } else if (!activePotion(p) && loot.length) {
    target = loot.reduce((a, b) =>
      Math.abs(a.x - p.x) + Math.abs(a.y - p.y) * 1.3 < Math.abs(b.x - p.x) + Math.abs(b.y - p.y) * 1.3
        ? a
        : b,
    );
  }
  if (p.aiming) {
    p.aiCharge -= dt;
    if (p.aiCharge <= 0) releaseAim(p);
    return 0;
  }
  if (p.ai <= 0) {
    p.ai = 0.4 + Math.random() * 0.25;
    const lunar = p.potions.indexOf("12"),
      heal = p.potions.indexOf("22");
    if (lunar >= 0 && p.superjump === 0 && game.stars.some((s) => s.owner === null)) {
      p.selected = lunar;
      drink(p);
    } else if (heal >= 0 && p.hp < p.maxHp) {
      p.selected = heal;
      drink(p);
    } else if (p.attackCooldown <= 0 && activePotion(p) && Math.abs(enemy.x - p.x) < 500 && !enemy.dead) {
      if (
        (activePotion(p) === "11" && p.hp < 3) ||
        (activePotion(p) === "02" && p.reflect === 0 && Math.random() < 0.25)
      )
        drink(p);
      else {
        beginAim(p);
        const dx = enemy.x - p.x,
          dy = enemy.y - p.y,
          flight = clamp(Math.abs(dx) / 500, 0.35, 1.1);
        const vx = dx / flight,
          vy = (dy - 0.5 * SHOT_GRAVITY * flight * flight) / flight;
        p.angle = Math.atan2(vy, vx);
        p.power = clamp(Math.hypot(vx, vy), 180, 800);
        p.aiCharge = 0.75;
        p.attackCooldown = 2;
      }
    }
    if (target.y > p.y + 55) {
      dropThrough(p);
      const floor = game.masonry.find((b) => p.x > b.x && p.x < b.x + b.w && Math.abs(p.y + 18 - b.y) < 5);
      if (floor) {
        const left = floor.x - 24,
          right = floor.x + floor.w + 24;
        target = { x: Math.abs(p.x - left) < Math.abs(p.x - right) ? left : right, y: p.y };
      }
    }
    const obstacle = [...game.masonry, ...game.walls, ...closedGates()].some(
      (b) => Math.abs(b.x + b.w / 2 - p.x) < 55 && p.y + 18 > b.y && p.y - 22 < b.y + b.h,
    );
    if (!p.aiming && (target.y < p.y - 35 || obstacle) && (p.jumps === 0 || (p.jumps === 1 && p.vy > -70)))
      jump(p);
  }
  p.aiTrack += dt;
  if (p.aiTrack >= 0.45) {
    const lx = p.aiLastX ?? p.x,
      ly = p.aiLastY ?? p.y,
      moved = Math.hypot(p.x - lx, p.y - ly),
      far = Math.hypot(target.x - p.x, target.y - p.y) > 55;
    p.aiStuck = far && moved < 4 ? p.aiStuck + p.aiTrack : 0;
    p.aiLastX = p.x;
    p.aiLastY = p.y;
    p.aiTrack = 0;
    if (p.aiStuck > 1.15) {
      const dx = Math.sign(target.x - p.x) || p.face;
      jump(p);
      if (p.dashCooldown <= 0) beginDash(p, dx, target.y < p.y - 55 ? -0.2 : 0);
      p.aiStuck = 0;
    }
  }
  return Math.abs(target.x - p.x) > 16 ? Math.sign(target.x - p.x) : 0;
}
