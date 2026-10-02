import type { Player, TimerKey } from "./types";
import { ENEMY_TYPES, EVENT_TYPES, PHASE_WAVES, TUTORIAL_STEPS, colors, names } from "./config";
import { recipeOf, recipes } from "./recipes";
import { $ } from "./dom";
import { game } from "./state";
import { updateTutorialHUD } from "./tutorial";
import { potionActivations, potionRemaining } from "./progression";
import { clamp } from "./geometry";
import { activePotion } from "./player";

export function hordeHUD() {
  const alive = game.players.filter((p) => p.id > 0 && !p.dead);
  $("horde-panel").hidden = game.mode !== "horde";
  $("duel-card").hidden = game.mode === "horde";
  if (game.mode !== "horde") return;
  const limit = PHASE_WAVES[game.horde.stage - 1] ?? PHASE_WAVES.at(-1),
    phase =
      game.horde.phase === "spawn"
        ? "Reforços em " + Math.ceil(game.horde.timer) + "s"
        : game.horde.phase === "rest"
          ? (game.horde.advanceStage ? "Próxima fase em " : "Próxima horda em ") +
            Math.ceil(game.horde.timer) +
            "s"
          : "Elimine o grupo";
  $("horde-title").textContent =
    "FASE " +
    game.horde.stage +
    " · HORDA " +
    game.horde.wave +
    "/" +
    limit +
    " · GRUPO " +
    (game.horde.batch + 1) +
    "/" +
    Math.max(1, game.horde.groups.length);
  if ($("horde-phase-label")) $("horde-phase-label").textContent = "FASE " + game.horde.stage;
  if ($("horde-progress-label"))
    $("horde-progress-label").textContent = game.horde.wave + "/" + limit + " HORDAS";
  if ($("horde-progress-fill"))
    $("horde-progress-fill").style.width =
      clamp(
        ((game.horde.wave - (game.horde.phase === "combat" || game.horde.phase === "spawn" ? 1 : 0)) /
          limit) *
          100,
        0,
        100,
      ) + "%";
  $("horde-detail").textContent =
    phase +
    " · " +
    alive.length +
    " na arena · " +
    game.horde.lives +
    " vidas · " +
    game.horde.kills +
    " eliminações";
  $("horde-enemies").innerHTML =
    alive
      .map(
        (p) =>
          `<div class="enemy-line" style="color:${p.color}"><b>${ENEMY_TYPES[p.kind!].mark} ${p.name}</b><span>${p.hp}/${p.maxHp} HP · ${p.kind === "chaser" ? "TOQUE LETAL" : p.potions.map((k) => recipes[k].icon).join(" ") || "Coletando"}</span></div>`,
      )
      .join("") || "<p>Observe os círculos de chegada na arena.</p>";
  if (game.state === "playing")
    $("status").textContent =
      "FASE " +
      game.horde.stage +
      " · HORDA " +
      game.horde.wave +
      "/" +
      limit +
      " · " +
      (game.horde.phase === "combat" ? alive.length + " INIMIGOS" : phase.toUpperCase()) +
      " · " +
      game.horde.lives +
      " VIDAS";
}
export function inventorySlots(p: Player, compact = false) {
  return (
    `<div class="potion-slots ${compact ? "compact" : ""}">` +
    Array.from({ length: 3 }, (_, i) => {
      const r = recipeOf(p.potions[i]),
        selected = i === p.selected;
      return `<div class="potion-slot ${selected ? "selected" : ""} ${r ? "filled" : ""}" style="--potion:${r?.color ?? "#627181"}" aria-label="${r ? r.name : "Espaço vazio"}${selected ? " — ativa" : ""}"><span class="slot-number">${i + 1}</span><span class="slot-icon">${r?.icon ?? "·"}</span>${r && potionActivations(p) > 1 ? `<span class="slot-active">×${potionRemaining(p, i)}</span>` : selected ? '<span class="slot-active">ATIVA</span>' : ""}</div>`;
    }).join("") +
    "</div>"
  );
}
export function updateEventHUD() {
  if (game.mode === "tutorial") {
    $("event-title").textContent = "TREINO SEGURO";
    $("event-detail").textContent = "Sem eventos aleatórios durante o tutorial.";
    $("event-banner").style.borderColor = "#80d9e8";
    return;
  }
  const type = game.arenaEvent.type ?? game.arenaEvent.pending,
    info = type ? EVENT_TYPES[type] : undefined,
    seconds = Math.ceil(game.arenaEvent.remaining);
  const label =
    game.arenaEvent.phase === "active"
      ? info!.name + " · termina em " + seconds + "s"
      : info
        ? info.name + " em " + seconds + "s"
        : "Próximo evento em " + seconds + "s";
  const detail =
    type === "lava"
      ? "Suba nas plataformas. As passagens no chão continuam livres."
      : type === "lasers"
        ? "Afaste-se das bordas esquerda e direita."
        : type === "rain"
          ? "Colete os insumos que caem! Até 8 itens no cenário."
          : "Lava, lasers ou chuva de insumos · evento aleatório";
  $("event-title").textContent = label;
  $("event-detail").textContent = detail;
  $("event-banner").style.borderColor = info?.color ?? "#44586c";
}
export function updateGameHUD() {
  const p = game.players[0];
  if (!p) return;
  const r = recipeOf(activePotion(p)),
    buffs = (
      [
        ["shield", "◇"],
        ["superjump", "☾"],
        ["speed", "↟"],
        ["burn", "✹"],
        ["reflect", "ϟ"],
        ["frozen", "❄"],
      ] as [TimerKey, string][]
    )
      .filter(([k]) => p[k] > 0)
      .map(([k, i]) => `${i}${Math.ceil(p[k])}s`)
      .join(" ");
  $("game-hud-hp").innerHTML =
    `<b>VIDA</b> ${Array.from({ length: p.maxHp }, (_, i) => `<i class="hud-heart ${i < p.hp ? "on" : ""}">♥</i>`).join("")}`;
  $("game-hud-potion").innerHTML = r
    ? `<b style="color:${r.color}">${r.icon} ${r.name}</b> · ${potionRemaining(p, p.selected)}x`
    : "<b>◌ SEM POÇÃO</b>";
  $("game-hud-bag").textContent = p.bag.length
    ? `INSUMOS · ${p.bag.map((n) => names[n]).join(" + ")}`
    : "INSUMOS · vazio";
  $("game-hud-buffs").textContent = buffs || "Sem efeitos";
  $("game-hud-progress").textContent =
    game.mode === "horde"
      ? `FASE ${game.horde.stage} · ${game.horde.wave}/${PHASE_WAVES[game.horde.stage - 1]} · ${game.horde.lives} VIDAS`
      : game.mode === "tutorial"
        ? `TUTORIAL · ${Math.min(game.tutorial.step + 1, TUTORIAL_STEPS.length - 1)}/${TUTORIAL_STEPS.length - 1}`
        : `ROUND ${game.round} · ${p.score}/3 ☠ · ${p.stars}/2 ★`;
}
export function updateHUD() {
  updateEventHUD();
  hordeHUD();
  updateGameHUD();
  updateTutorialHUD();
  game.players
    .filter((p) => game.mode !== "horde" || p.id === 0)
    .forEach((p, i) => {
      const r = recipeOf(activePotion(p));
      $("score" + i).textContent =
        game.mode === "horde"
          ? `${game.horde.lives} vidas · ♥ ${p.stars}/2 · ${game.horde.kills} ☠`
          : game.mode === "tutorial"
            ? "Treino livre"
            : `${p.score}/3 ☠ · ${p.stars}/2 ★`;
      $("hp" + i).innerHTML = Array.from(
        { length: p.maxHp },
        (_, n) => `<span class="pip ${n < p.hp ? "on" : ""}"></span>`,
      ).join("");
      const bag = p.bag.map((n) => `<span style="color:${colors[n]}">◆ ${names[n]}</span>`).join(" + ");
      const buffs = (
        [
          ["frozen", "❄ Congelado"],
          ["shield", "◇ Escudo"],
          ["superjump", "☾ Superpulo"],
          ["speed", "↟ Velocidade"],
          ["burn", "✹ Combustão"],
          ["reflect", "ϟ Retaliação"],
        ] as [TimerKey, string][]
      )
        .filter(([k]) => p[k] > 0)
        .map(([k, n]) => `${n} ${Math.ceil(p[k])}s`)
        .join(" · ");
      $("inv" + i).innerHTML =
        `${inventorySlots(p, true)}<div class="potion-title" style="color:${r?.color ?? "#9aa8b7"}">${p.dead ? "Reaparecendo…" : r ? r.icon + " " + r.name : "◌ Colete dois insumos"}</div><div class="potion-effects">${r ? `<b>Jogar:</b> ${r.throw}<br><b>Beber:</b> ${r.drink}` : "As misturas são guardadas automaticamente.<br>Você pode carregar até 3 poções."}</div><div class="reserve">${p.potions.length === 3 ? "Inventário cheio · use uma poção para coletar mais" : `Insumos: ${bag || "◌ vazio"}${p.bag.length === 1 ? " + ◌" : ""}`}</div><div class="buffs">${buffs || "Sem efeitos ativos"}</div>`;
    });
  const p = game.players[0],
    r = recipeOf(activePotion(p));
  $("loadout").innerHTML =
    `<div class="loadout-label">SUAS POÇÕES · ${p.potions.length}/3</div>${inventorySlots(p)}<div class="loadout-name" style="color:${r?.color ?? "#aab6c5"}">${r?.name ?? "Coletar e misturar"}</div><div class="loadout-key">E · TROCAR</div>`;
  $("gate-status").textContent =
    (game.gate.openSide === 0 ? "ESQUERDA ABERTA" : "DIREITA ABERTA") +
    " · TROCA EM " +
    Math.ceil(game.gate.remaining) +
    "s";
  $("ingredient-help").textContent =
    p.bag.length === 1
      ? "SEGURANDO " + names[p.bag[0]].toUpperCase() + " · ÍCONES NO MAPA MOSTRAM A PRÓXIMA POÇÃO"
      : "COLETE DOIS INSUMOS · SEMPRE HÁ PELO MENOS 2 NO MAPA";
  $("dash-status").textContent =
    p.dashTime > 0
      ? "» DASH · INVENCÍVEL"
      : p.dashCooldown > 0
        ? "» DASH " + p.dashCooldown.toFixed(1) + "s"
        : "» DASH · ESPAÇO";
  $("aim-help").textContent = p.aiming
    ? "DIREITO CANCELA · SOLTE O ESQUERDO PARA LANÇAR"
    : "MOUSE MIRA · DISTÂNCIA CONTROLA A FORÇA";
}
