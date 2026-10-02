import type { Mode, TimerKey } from "./types";
import { mixKey } from "./recipes";
import { CORRUPT_TYPE, GATE_PERIOD, RULES, colors, controls } from "./config";
import { $, canvas } from "./dom";
import { game, mouse, newArenaEvent, newEvolution, newHorde } from "./state";
import { arenaStars, updateGates } from "./arenas";
import { applyArenaHazards, updateArenaEvent, updateFallingItems } from "./events";
import { beep, ensureAudio, sfx } from "./audio";
import { tutorialMark, updateTutorialHUD } from "./tutorial";
import { beginWave, updateHorde } from "./horde";
import { available, refreshGrimoire } from "./progression";
import { clamp } from "./geometry";
import { autoMix, corruptPickup, makePlayer, movePlayer, updateMouseAim } from "./player";
import { ensureMinimumItems, randomSpawn } from "./items";
import { burst, float } from "./effects";
import { addSafeTrail, applyZones, explode, foes, hit, traceShot, win } from "./combat";
import { bot } from "./ai";
import { updateHUD } from "./hud";

export function selectMode(next: Mode) {
  game.mode = next;
  game.state = "menu";
  game.round = 1;
  game.roundWins = [0, 0];
  reset();
  $("overlay").classList.remove("hidden");
  const tutorialMode = game.mode === "tutorial";
  $("status").textContent =
    game.mode === "horde"
      ? "HORDA · 3 VIDAS"
      : tutorialMode
        ? "TUTORIAL · PASSO A PASSO"
        : "3 ELIMINAÇÕES OU 2 ★";
  $("overlay-tag").textContent =
    game.mode === "horde" ? "SOBREVIVA ÀS ONDAS" : tutorialMode ? "TREINO ALQUÍMICO" : "DUELO CLÁSSICO";
  $("overlay-title").textContent =
    game.mode === "horde"
      ? "O laboratório foi invadido."
      : tutorialMode
        ? "Aprenda fazendo."
        : "Uma boa receita. Uma péssima intenção.";
  $("overlay-copy").textContent =
    game.mode === "horde"
      ? "Três fases: 5, 7 e 10 hordas. Grupos de até 3 inimigos, dificuldade crescente e 2s de aviso antes de cada chegada."
      : tutorialMode
        ? "Um treino guiado sem inimigo agressivo nem eventos da arena. O texto avança conforme você executa cada comando."
        : "Você contra Malva: 3 eliminações ou 2 estrelas vencem o round.";
  $("start").textContent =
    game.mode === "horde" ? "Enfrentar a horda →" : tutorialMode ? "Começar tutorial →" : "Entrar no duelo →";
  $("mode-duel").setAttribute("aria-pressed", String(game.mode === "duel"));
  $("mode-horde").setAttribute("aria-pressed", String(game.mode === "horde"));
  $("mode-tutorial").setAttribute("aria-pressed", String(tutorialMode));
  updateTutorialHUD();
}
export function reset() {
  if ($("upgrade-dialog").open) $("upgrade-dialog").close();
  game.evolution = newEvolution();
  game.players = [makePlayer(0), makePlayer(1)];
  game.items = [];
  game.shots = [];
  game.zones = [];
  game.walls = [];
  game.particles = [];
  game.texts = [];
  game.stars = arenaStars();
  game.gate = { openSide: (game.round - 1) % 2, remaining: GATE_PERIOD };
  game.arenaEvent = newArenaEvent();
  game.time = 0;
  game.shake = 0;
  game.accumulator = 0;
  mouse.leftHeld = false;
  mouse.known = false;
  game.keys.clear();
  for (let i = 0; i < 4; i++) randomSpawn();
  ensureMinimumItems();
  game.nextSpawn = 3.5 + Math.random() * 3;
  refreshGrimoire();
  if (game.mode === "horde") {
    game.horde = newHorde();
    beginWave(1);
  }
  updateHUD();
}
export function start(next = false) {
  ensureAudio();
  if (game.mode === "horde") next = false;
  if (next) {
    game.round++;
  } else {
    game.round = 1;
    game.roundWins = [0, 0];
  }
  reset();
  game.state = "playing";
  $("overlay").classList.add("hidden");
  $("status").textContent = `ROUND ${game.round} · 3 ELIMINAÇÕES OU 2 ★`;
  updateHUD();
  canvas.focus();
}
export function update(dt: number) {
  if (game.state !== "playing") return;
  game.time += dt;
  updateGates(dt);
  if (game.mode !== "tutorial") updateArenaEvent(dt);
  updateFallingItems(dt);
  game.shake = Math.max(0, game.shake - dt * 25);
  game.nextSpawn -= dt;
  game.items = game.items.filter((i) => (i.life -= dt) > 0);
  if (game.nextSpawn <= 0) {
    randomSpawn();
    game.nextSpawn = 3.5 + Math.random() * 3;
  }
  game.walls = game.walls.filter((w) => (w.life -= dt) > 0);
  ensureMinimumItems();
  game.zones = game.zones.filter((z) => (z.life -= dt) > 0);
  for (const p of game.players) {
    if (p.dead === Infinity) continue;
    if (p.dead > 0) {
      p.dead -= dt;
      if (p.dead <= 0) {
        const score = p.score;
        Object.assign(p, makePlayer(p.id));
        p.score = score;
        p.inv = 2;
      }
      continue;
    }
    const wasDashing = p.dashTime > 0;
    for (const k of [
      "inv",
      "shield",
      "superjump",
      "speed",
      "burn",
      "reflect",
      "frozen",
      "dropTimer",
      "dashTime",
      "dashCooldown",
      "attackCooldown",
    ] as TimerKey[])
      p[k] = Math.max(0, p[k] - dt);
    if (wasDashing && p.dashTime === 0) {
      p.vx = clamp(p.vx, -(p.speed > 0 ? 360 : 230), p.speed > 0 ? 360 : 230);
      p.vy = 0;
    }
    let dir = 0;
    if (p.id > 0 && !p.frozen) dir = bot(p, dt);
    else if (!p.frozen)
      dir =
        (game.keys.has(controls.right) || game.keys.has(controls.rightAlt) ? 1 : 0) -
        (game.keys.has(controls.left) || game.keys.has(controls.leftAlt) ? 1 : 0);
    if (p.aiming) dir = 0;
    if (dir) {
      p.face = dir;
      if (p.id === 0) tutorialMark("move");
    }
    movePlayer(p, dt, dir);
    updateMouseAim(p);
    if (p.kind !== "chaser" && !p.frozen) {
      for (let j = game.items.length - 1; j >= 0; j--) {
        const item = game.items[j];
        if (Math.hypot(item.x - p.x, item.y - p.y) >= 27) continue;
        if (item.t === CORRUPT_TYPE) {
          game.items.splice(j, 1);
          corruptPickup(p, item);
          break;
        }
        if (p.potions.length >= 3 || p.bag.length >= 2) continue;
        if (!p.bag.length || available(mixKey(p.bag[0], item.t))) {
          p.bag.push(item.t);
          game.items.splice(j, 1);
          burst(item.x, item.y, colors[item.t], 8);
          if (p.id === 0) {
            sfx("pickup");
            tutorialMark("pickup");
          }
          autoMix(p);
          if (p.potions.length >= 3 || p.bag.length >= 2) break;
        }
      }
      ensureMinimumItems();
    }
    for (const s of game.stars)
      if (
        game.mode !== "tutorial" &&
        s.side === game.gate.openSide &&
        s.owner === null &&
        Math.hypot(p.x - s.x, p.y - s.y) < 25
      ) {
        if (game.mode === "horde") {
          if (p.id !== 0) continue;
          s.owner = 0;
          p.stars++;
          game.gate.remaining = GATE_PERIOD;
          burst(s.x, s.y, "#ff829d", 30);
          if (p.stars >= 2) {
            p.stars = 0;
            game.horde.lives++;
            float(p, "♥ +1 vida extra", "#ff9caf");
            sfx("fullHeart");
          } else {
            float(p, "♥ 1/2 · pegue a outra metade", "#ff9caf");
            sfx("halfHeart");
          }
          continue;
        }
        s.owner = p.id;
        p.stars++;
        game.gate.remaining = GATE_PERIOD;
        burst(s.x, s.y, "#ffe291", 30);
        float(p, "★ " + p.stars + "/2 · outra porta em 12s", "#ffe291");
        beep(1050);
        if (p.stars >= RULES.stars) {
          win(p.id, "2 ESTRELAS");
          return;
        }
      }
  }
  if (game.mode === "horde") {
    const hero = game.players[0];
    for (const hunter of game.players)
      if (
        hunter.kind === "chaser" &&
        !hunter.dead &&
        !hero.dead &&
        Math.hypot(hunter.x - hero.x, hunter.y - hero.y) < 34
      ) {
        hit(hero, hunter.id, hero.hp, { lethal: true });
        break;
      }
  }
  for (const p of game.players)
    if (p.kind !== "chaser" && !p.dead && p.burn > 0)
      for (const enemy of game.players)
        if (
          foes(p.id, enemy.id) &&
          !enemy.dead &&
          Math.hypot(p.x - enemy.x, p.y - enemy.y) < (p.kind === "tank" || enemy.kind === "tank" ? 46 : 39)
        )
          hit(enemy, p.id, 1);
  for (let i = game.shots.length - 1; i >= 0; i--) {
    const s = game.shots[i],
      oldX = s.x,
      oldY = s.y,
      r = traceShot(s);
    s.x = r.x;
    s.y = r.y;
    s.vy = r.vy;
    s.life -= dt;
    if (s.r.type === "haste") addSafeTrail(s, oldX, oldY);
    if (r.impact || s.life <= 0) {
      explode(s, r.impact);
      game.shots.splice(i, 1);
    }
    if (game.state !== "playing") break;
  }
  if (game.state === "playing") applyZones();
  if (game.state === "playing") applyArenaHazards();
  updateHorde(dt);
  game.particles = game.particles.filter((p) => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 220 * dt;
    return p.life > 0;
  });
  game.texts = game.texts.filter((t) => {
    t.life -= dt;
    t.y -= dt * 22;
    return t.life > 0;
  });
  game.hudClock -= dt;
  if (game.hudClock <= 0) {
    updateHUD();
    game.hudClock = 0.1;
  }
}
export function pause() {
  if (game.state === "playing") {
    game.state = "paused";
    game.keys.clear();
    for (const p of game.players) {
      p.aiming = false;
      p.lastTapDir = 0;
      p.lastTapTime = -Infinity;
      p.taps = {};
    }
    $("overlay").classList.remove("hidden");
    $("overlay-tag").textContent = "EXPERIMENTO EM PAUSA";
    $("overlay-title").textContent = "O caldeirão pode esperar.";
    $("overlay-copy").textContent =
      "A mira foi cancelada e sua poção foi preservada. Pressione P ou continue abaixo.";
    $("start").textContent = "Continuar →";
  } else if (game.state === "paused") {
    game.state = "playing";
    $("overlay").classList.add("hidden");
    canvas.focus();
  }
}
