import { $, canvas } from "./dom";
import { game, mouse } from "./state";
import { pause } from "./match";

export function openManual() {
  if ($("manual").open) return;
  game.resumeAfterManual = game.state === "playing";
  if (game.resumeAfterManual) pause();
  game.keys.clear();
  mouse.leftHeld = false;
  $("manual-return").textContent = game.resumeAfterManual
    ? "Voltar à partida →"
    : "Entendi · voltar ao jogo →";
  $("manual").showModal();
  $("manual").scrollTop = 0;
}
export function closeManual() {
  if ($("manual").open) $("manual").close();
}
export function finishManual() {
  game.keys.clear();
  mouse.leftHeld = false;
  if (game.resumeAfterManual && game.state === "paused" && !document.hidden) pause();
  game.resumeAfterManual = false;
  if (game.state === "playing") canvas.focus();
  else $("manual-button").focus();
}

export function bindManual() {
  $("manual-button").onclick = openManual;
  $("manual-close").onclick = closeManual;
  $("manual-return").onclick = closeManual;
  $("manual").addEventListener("cancel", (e) => {
    e.preventDefault();
    closeManual();
  });
  $("manual").addEventListener("close", finishManual);
}
