import { H, W, controls } from "./config";
import { $, canvas } from "./dom";
import { game, mouse } from "./state";
import {
  beginAim,
  cancelAim,
  cyclePotion,
  dashFromKeys,
  drink,
  dropThrough,
  jump,
  releaseAim,
  updateMouseAim,
} from "./player";
import { pause, start } from "./match";

export function onKeyDown(e: KeyboardEvent) {
  if (
    game.state === "upgrade" ||
    $("manual").open ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(document.activeElement?.tagName ?? "")
  )
    return;
  const gameplay = Object.values(controls).includes(e.code);
  if (gameplay || ["KeyP", "KeyR", "Escape"].includes(e.code)) e.preventDefault();
  if (e.repeat || game.keys.has(e.code)) return;
  game.keys.add(e.code);
  if (e.code === "KeyP") {
    pause();
    return;
  }
  if (e.code === "KeyR") {
    start();
    return;
  }
  if (game.state !== "playing") return;
  const p = game.players[0];
  if (e.code === "Space") {
    dashFromKeys(p);
    return;
  }
  if (["KeyW", "ArrowUp"].includes(e.code)) jump(p);
  if (e.code === "KeyE") cyclePotion(p);
  if (["KeyS", "ArrowDown"].includes(e.code)) dropThrough(p);
  if (e.code === "Escape") cancelAim(p, true);
}
export function onKeyUp(e: KeyboardEvent) {
  game.keys.delete(e.code);
}
export function updatePointer(e: MouseEvent) {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  mouse.x = ((e.clientX - bounds.left) * W) / bounds.width;
  mouse.y = ((e.clientY - bounds.top) * H) / bounds.height;
  mouse.inside = mouse.x >= 0 && mouse.x <= W && mouse.y >= 0 && mouse.y <= H;
  mouse.known = true;
  updateMouseAim(game.players[0]);
}
export function onMouseDown(e: MouseEvent) {
  if (e.button !== 0 && e.button !== 2) return;
  e.preventDefault();
  canvas.focus();
  updatePointer(e);
  if (game.state !== "playing") return;
  const p = game.players[0];
  if (e.button === 0) {
    mouse.leftHeld = true;
    beginAim(p);
  } else if (p.aiming || mouse.leftHeld) {
    cancelAim(p, true);
  } else drink(p);
}
export function onMouseUp(e: MouseEvent) {
  if (e.button !== 0) return;
  updatePointer(e);
  const held = mouse.leftHeld;
  mouse.leftHeld = false;
  if (game.state === "playing" && held) releaseAim(game.players[0]);
}

export function bindInput() {
  // Mouse events intentionally handle button chords: right-click must work while left is held.
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("mousemove", (e) => {
    if (mouse.leftHeld || e.target === canvas) updatePointer(e);
    else mouse.inside = false;
  });
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget) {
      mouse.inside = false;
      mouse.leftHeld = false;
      cancelAim(game.players[0]);
    }
  });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", () => {
    game.keys.clear();
    mouse.leftHeld = false;
    if (game.state === "playing") pause();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.state === "playing") {
      mouse.leftHeld = false;
      pause();
    }
  });
}
