import type { RecipeKey, Player, PlayerUpgradeKey } from "./types";
import {
  HORDE_BASE_HP,
  HORDE_BASE_SPEED,
  MAX_DISPERSION_LEVEL,
  MAX_EFFECT_LEVEL,
  MAX_PLAYER_HP_LEVEL,
  MAX_PLAYER_SPEED_LEVEL,
  PLAYER_SPEED_STEP,
  PLAYER_UPGRADES,
  RULES,
  UPGRADE_CHOICES,
} from "./config";
import { formula, isRecipeKey, originalRecipeText, recipeEntries } from "./recipes";
import { $, canvas } from "./dom";
import { game, mouse } from "./state";
import { sfx } from "./audio";
import { shuffled } from "./geometry";
import { float } from "./effects";
import { updateHUD } from "./hud";

export function playerMaxHp(id = 0) {
  return game.mode === "horde" && id === 0 ? HORDE_BASE_HP + game.evolution.player.maxHp : RULES.hp;
}
export function playerSpeedFactor(id = 0) {
  return game.mode === "horde" && id === 0
    ? HORDE_BASE_SPEED + PLAYER_SPEED_STEP * game.evolution.player.speed
    : 1;
}
export function potionActivations(p: Player) {
  return game.mode === "horde" && p.id === 0 ? 1 + Math.floor(game.evolution.player.dispersion / 3) : 1;
}
export function potionRemaining(p: Player, index: number) {
  return Math.max(0, potionActivations(p) - (p.potionUses?.[index] ?? 0));
}
export function available(key: string) {
  return game.mode !== "horde" || game.evolution.unlocked.includes(key as RecipeKey);
}
export function effectStats(owner = 0) {
  const base = {
    freeze: 5,
    frostRadius: 82,
    shield: 10,
    wall: 10,
    poison: 6,
    poisonRadius: 65,
    heal: 1,
    radius: 78,
    burn: 5,
    width: 48,
    speed: 10,
    trail: 5,
    reflect: 10,
    lunar: 10,
  };
  if (game.mode !== "horde") return base;
  const l = owner === 0 ? game.evolution.levels : { "00": 0, 11: 0, 22: 0, "01": 0, "02": 0, 12: 0 };
  return {
    freeze: 2 + l["11"],
    frostRadius: 70,
    shield: 4 + 2 * l["11"],
    wall: 4 + 2 * l["12"],
    poison: 3,
    poisonRadius: 42 + 13 * l["22"],
    heal: Math.min(5, 1 + l["22"]),
    radius: 60 + 15 * l["00"],
    burn: 2 + l["00"],
    width: 32 + 12 * l["01"],
    speed: 4 + 2 * l["01"],
    trail: 2 + l["02"],
    reflect: 4 + 2 * l["02"],
    lunar: 6,
  };
}
export function describeUpgrade(key: RecipeKey) {
  const a = effectStats();
  game.evolution.levels[key]++;
  const b = effectStats();
  game.evolution.levels[key]--;
  return {
    11: `Congelar ${a.freeze} → ${b.freeze}s · escudo ${a.shield} → ${b.shield}s`,
    12: `Parede ${a.wall} → ${b.wall}s`,
    22: `Raio da nuvem ${a.poisonRadius} → ${b.poisonRadius}px · cura ${a.heal} → ${b.heal} HP`,
    "00": `Raio ${a.radius} → ${b.radius}px · combustão ${a.burn} → ${b.burn}s`,
    "01": `Coluna ${a.width} → ${b.width}px · velocidade ${a.speed} → ${b.speed}s`,
    "02": `Rastro ${a.trail} → ${b.trail}s · retaliação ${a.reflect} → ${b.reflect}s`,
  }[key];
}
export function refreshGrimoire() {
  const a = effectStats();
  for (const [k, r] of recipeEntries()) {
    Object.assign(r, originalRecipeText[k]);
    if (game.mode === "horde") {
      const texts = {
        11: [`Congela por ${a.freeze}s.`, `Escudo por ${a.shield}s.`],
        12: [`Parede sólida por ${a.wall}s.`, `Superpulo duplo por ${a.lunar}s.`],
        22: [`Nuvem letal: raio ${a.poisonRadius}px por ${a.poison}s.`, `Recupera ${a.heal} HP.`],
        "00": [`Explosão: raio ${a.radius}px + fogo.`, `Combustão por ${a.burn}s.`],
        "01": [`Coluna vertical de ${a.width}px.`, `Velocidade por ${a.speed}s.`],
        "02": [`Rastro letal por ${a.trail}s.`, `Retaliação por ${a.reflect}s.`],
      };
      [r.throw, r.drink] = texts[k];
    }
  }
  $("recipes").innerHTML = recipeEntries()
    .map(
      ([k, r]) =>
        `<div class="recipe"><div class="recipe-top" style="color:${available(k) ? r.color : "#82909e"}">${available(k) ? r.icon : "🔒"} ${r.name}${game.mode === "horde" && available(k) ? " · Nv " + game.evolution.levels[k] : ""}</div><p>${formula(k)}<br>${available(k) ? `Jogar: ${r.throw}<br>Beber: ${r.drink}` : "Desbloqueie ao completar uma onda."}</p></div>`,
    )
    .join("");
  $("manual-recipes").innerHTML = recipeEntries()
    .map(
      ([k, r]) =>
        `<article class="manual-potion"><h4 style="color:${r.color}">${available(k) ? r.icon : "🔒"} ${r.name}</h4><div class="manual-formula">${formula(k)}</div><p><b>Arremessar:</b> ${r.throw}<br><b>Beber:</b> ${r.drink}</p></article>`,
    )
    .join("");
}
export function playerUpgradeDescription(key: PlayerUpgradeKey) {
  const p = game.evolution.player;
  if (key === "speed") {
    const before = Math.round((HORDE_BASE_SPEED + PLAYER_SPEED_STEP * p.speed) * 230),
      after = Math.round((HORDE_BASE_SPEED + PLAYER_SPEED_STEP * (p.speed + 1)) * 230);
    return `Velocidade base ${before} → ${after}`;
  }
  if (key === "maxHp") return `Vida máxima ${HORDE_BASE_HP + p.maxHp} → ${HORDE_BASE_HP + p.maxHp + 1}`;
  const before = Math.floor(p.dispersion / 3),
    after = Math.floor((p.dispersion + 1) / 3),
    progress = (p.dispersion % 3) + 1;
  return after > before
    ? `Dispersão ${progress}/3 · completa: cada poção ganha +1 ativação`
    : `Dispersão ${progress}/3 · faltam ${3 - progress} para +1 ativação por poção`;
}
type UpgradeChoice = { name: string; icon: string; color: string } & (
  { kind: "recipe"; key: RecipeKey } | { kind: "player"; key: PlayerUpgradeKey }
);

export function upgradePool() {
  const pool: UpgradeChoice[] = recipeEntries()
    .filter(([k]) => !available(k) || game.evolution.levels[k] < MAX_EFFECT_LEVEL)
    .map(([k, r]): UpgradeChoice => ({ key: k, kind: "recipe", name: r.name, icon: r.icon, color: r.color }));
  if (game.evolution.player.speed < MAX_PLAYER_SPEED_LEVEL)
    pool.push({ key: "speed", kind: "player", ...PLAYER_UPGRADES.speed });
  if (game.evolution.player.maxHp < MAX_PLAYER_HP_LEVEL)
    pool.push({ key: "maxHp", kind: "player", ...PLAYER_UPGRADES.maxHp });
  if (game.evolution.player.dispersion < MAX_DISPERSION_LEVEL)
    pool.push({ key: "dispersion", kind: "player", ...PLAYER_UPGRADES.dispersion });
  return shuffled(pool).slice(0, UPGRADE_CHOICES);
}
export function offerUpgrade() {
  game.state = "upgrade";
  sfx("upgradeOpen");
  game.horde.phase = "upgrade";
  game.keys.clear();
  mouse.leftHeld = false;
  game.players.forEach((p) => (p.aiming = false));
  $("upgrade-title").textContent =
    "Fase " + game.horde.stage + " · horda " + game.horde.wave + " vencida · escolha 1 evolução";
  const choices = upgradePool();
  $("upgrade-options").innerHTML =
    choices
      .map((c) => {
        if (c.kind === "player")
          return `<button class="upgrade-choice" data-upgrade="${c.key}" style="--choice:${c.color}"><b>${c.icon} ${c.name}</b><span>${playerUpgradeDescription(c.key)}</span></button>`;
        const k = c.key;
        return `<button class="upgrade-choice" data-upgrade="${k}" style="--choice:${c.color}"><b>${c.icon} ${available(k) ? "Melhorar" : "Desbloquear"} ${c.name}</b><span>${available(k) ? describeUpgrade(k) : formula(k) + " · libera os dois efeitos desta mistura"}</span></button>`;
      })
      .join("") ||
    '<button class="upgrade-choice" data-upgrade="life"><b>★ Vida extra</b><span>Todos os upgrades chegaram ao máximo. Receba +1 vida de horda.</span></button>';
  $("upgrade-dialog").showModal();
}
export function chooseUpgrade(key: string) {
  if (game.state !== "upgrade") return;
  sfx("upgradePick");
  const p = game.players[0];
  if (key === "life") {
    if (upgradePool().length) return;
    game.horde.lives++;
  } else if (key === "speed") {
    if (game.evolution.player.speed >= MAX_PLAYER_SPEED_LEVEL) return;
    game.evolution.player.speed++;
    p.speedFactor = playerSpeedFactor(0);
  } else if (key === "maxHp") {
    if (game.evolution.player.maxHp >= MAX_PLAYER_HP_LEVEL) return;
    game.evolution.player.maxHp++;
    p.maxHp = playerMaxHp(0);
    p.hp = Math.min(p.maxHp, p.hp + 1);
  } else if (key === "dispersion") {
    if (game.evolution.player.dispersion >= MAX_DISPERSION_LEVEL) return;
    game.evolution.player.dispersion++;
  } else {
    if (!isRecipeKey(key)) return;
    if (!available(key)) game.evolution.unlocked.push(key);
    else if (game.evolution.levels[key] < MAX_EFFECT_LEVEL) game.evolution.levels[key]++;
    else return;
  }
  refreshGrimoire();
  $("upgrade-dialog").close();
  game.horde.phase = "rest";
  game.horde.timer = game.horde.advanceStage ? 5 : 4;
  game.state = "playing";
  if (game.horde.advanceStage) {
    float(game.players[0], "FASE " + game.horde.stage + " CONCLUÍDA", "#dafb7c");
    sfx("phase");
  }
  updateHUD();
  canvas.focus();
}
