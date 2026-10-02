import type { Point, EnemyKind, EnemyType } from "./types";
import { ENEMY_TYPES, PHASE_WAVES } from "./config";
import { $ } from "./dom";
import { game, mouse } from "./state";
import { arenaStars, closedGates } from "./arenas";
import { sfx } from "./audio";
import { offerUpgrade } from "./progression";
import { overlaps } from "./geometry";
import { makePlayer } from "./player";
import { burst } from "./effects";
import { updateHUD } from "./hud";

export function waveGroups(n: number) {
  const groups = [];
  let total = Math.max(1, n);
  while (total > 0) {
    const count = total === 4 ? 2 : Math.min(3, total);
    groups.push(count);
    total -= count;
  }
  return groups;
}
export function completedBeforeStage(stage: number) {
  return PHASE_WAVES.slice(0, stage - 1).reduce((a, b) => a + b, 0);
}
export function stageWaveEnemyCount(stage: number, wave: number) {
  return wave + stage - 1;
}
export function enemyKindFor(wave: number, ordinal: number): EnemyKind {
  if (wave <= 2) return "normal";
  if (wave <= 4) return ordinal % 3 === 2 ? "fast" : "normal";
  const pool: EnemyKind[] =
    wave < 8 ? ["normal", "fast", "tank"] : ["fast", "normal", "tank", "fast", "tank"];
  return pool[(ordinal + wave) % pool.length];
}
export function maybeChaserKind(baseKind: EnemyKind): EnemyKind {
  if (game.horde.chaserUsed || game.horde.globalWave < 3) return baseKind;
  const chance = Math.min(0.22, 0.07 + game.horde.stage * 0.035 + game.horde.globalWave * 0.004);
  if (Math.random() < chance) {
    game.horde.chaserUsed = true;
    return "chaser";
  }
  return baseKind;
}
export function enemyScale(wave: number, type: EnemyType) {
  if (type === ENEMY_TYPES.chaser)
    return { hp: 1, speed: type.speed * (1 + Math.min(0.18, (wave - 1) * 0.01)) };
  const hpBonus = Math.floor((wave - 1) / 5),
    speedBoost = Math.min(0.28, (wave - 1) * 0.015);
  return { hp: type.hp + hpBonus, speed: type.speed * (1 + speedBoost) };
}
export function beginWave(n: number) {
  game.stars = arenaStars();
  sfx("wave");
  game.horde.wave = n;
  game.horde.globalWave = completedBeforeStage(game.horde.stage) + n;
  game.horde.batch = 0;
  game.horde.chaserUsed = false;
  game.horde.groups = waveGroups(stageWaveEnemyCount(game.horde.stage, n));
  game.players = [game.players[0]];
  game.shots = [];
  game.zones = [];
  game.walls = [];
  queueBatch();
}
export function queueBatch() {
  game.horde.phase = "spawn";
  game.horde.timer = 2;
  game.horde.pending = [];
  const count = game.horde.groups[game.horde.batch];
  for (let i = 0; i < count; i++) {
    const ordinal = game.horde.groups.slice(0, game.horde.batch).reduce((a, b) => a + b, 0) + i;
    const base = enemyKindFor(game.horde.globalWave, ordinal);
    game.horde.pending.push({ kind: maybeChaserKind(base), x: 0, y: 0 });
  }
  chooseSpawnPoints();
}
export function chooseSpawnPoints() {
  const candidates =
    game.arenaId === "classic"
      ? [
          { x: 70, y: 417 },
          { x: 890, y: 417 },
          { x: 200, y: 327 },
          { x: 760, y: 327 },
          { x: 375, y: 317 },
          { x: 585, y: 317 },
        ]
      : game.spawnSites.map((q) => ({ x: q.x, y: q.y + 1 }));
  const used: Point[] = [];
  for (const pending of game.horde.pending) {
    const legal = candidates.filter(
      (q) =>
        ![...game.masonry, ...game.walls, ...closedGates()].some((b) =>
          overlaps(q.x - 19, q.y - 33, 38, 51, b),
        ) && !used.some((s) => Math.abs(q.x - s.x) < 60),
    );
    legal.sort(
      (a, b) =>
        Math.hypot(b.x - game.players[0].x, b.y - game.players[0].y) -
        Math.hypot(a.x - game.players[0].x, a.y - game.players[0].y),
    );
    const spot = legal[0];
    if (!spot) return false;
    Object.assign(pending, spot);
    used.push(spot);
  }
  return true;
}
export function spawnBatch() {
  if (
    game.horde.pending.some(
      (q) =>
        Math.hypot(q.x - game.players[0].x, q.y - game.players[0].y) < 70 ||
        [...game.walls, ...closedGates()].some((b) => overlaps(q.x - 19, q.y - 33, 38, 51, b)),
    )
  ) {
    chooseSpawnPoints();
    game.horde.timer = 2;
    return;
  }
  for (const q of game.horde.pending) {
    const p = makePlayer(game.players.length),
      type = ENEMY_TYPES[q.kind],
      scale = enemyScale(game.horde.globalWave, type);
    Object.assign(p, {
      kind: q.kind,
      name: type.name,
      x: q.x,
      y: q.y,
      hp: scale.hp,
      maxHp: scale.hp,
      speedFactor: scale.speed,
      color: type.color,
      inv: 1.2,
      burn: q.kind === "chaser" ? 999999 : 0,
    });
    if (q.kind === "chaser") {
      p.bag = [];
      p.potions = [];
      p.potionUses = [];
      p.selected = 0;
    }
    game.players.push(p);
    burst(p.x, p.y, p.color, 20);
    if (q.kind === "chaser") sfx("chaser");
  }
  game.horde.pending = [];
  game.horde.phase = "combat";
}
export function updateHorde(dt: number) {
  if (game.mode !== "horde" || game.state !== "playing") return;
  if (game.horde.phase === "combat" && !game.players.some((p) => p.id > 0 && !p.dead)) {
    if (game.horde.batch + 1 < game.horde.groups.length) {
      game.horde.batch++;
      queueBatch();
    } else {
      game.players[0].hp = Math.min(game.players[0].maxHp, game.players[0].hp + 1);
      const limit = PHASE_WAVES[game.horde.stage - 1];
      if (game.horde.wave >= limit && game.horde.stage >= PHASE_WAVES.length) {
        finishHorde(true);
        return;
      }
      game.horde.advanceStage = game.horde.wave >= limit;
      offerUpgrade();
    }
  } else if (game.horde.phase !== "combat") {
    game.horde.timer -= dt;
    if (game.horde.timer <= 0) {
      if (game.horde.phase === "rest") {
        if (game.horde.advanceStage) {
          game.horde.stage++;
          game.horde.wave = 1;
          game.horde.advanceStage = false;
          beginWave(1);
        } else beginWave(game.horde.wave + 1);
      } else spawnBatch();
    }
  }
}
export function finishHorde(victory = false) {
  game.state = "over";
  if (victory) sfx("victory");
  else sfx("playerDown");
  game.keys.clear();
  mouse.leftHeld = false;
  for (const p of game.players) p.aiming = false;
  $("overlay").classList.remove("hidden");
  $("overlay-tag").textContent = victory ? "EXPERIMENTO CONCLUÍDO" : "HORDA ENCERRADA";
  $("overlay-title").textContent = victory
    ? "As três fases foram vencidas."
    : "O laboratório caiu na Fase " + game.horde.stage + ", horda " + game.horde.wave;
  $("overlay-copy").textContent = victory
    ? game.horde.kills + " inimigos eliminados ao longo de 22 hordas."
    : game.horde.kills + " inimigos eliminados. Tente novas combinações para sobreviver mais longe.";
  $("start").textContent = victory ? "Jogar novamente →" : "Tentar outra horda →";
  $("status").textContent = victory ? "VITÓRIA · 3 FASES CONCLUÍDAS" : "FIM DA HORDA";
  updateHUD();
}
