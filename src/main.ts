import "./style.css";
import { STEP } from "./config";
import { $, canvas } from "./dom";
import { game } from "./state";
import { changeArena } from "./arenas";
import { ensureAudio, sfx } from "./audio";
import { chooseUpgrade } from "./progression";
import { pause, reset, selectMode, start, update } from "./match";
import { draw } from "./render";
import { bindInput } from "./input";
import { bindManual } from "./manual";
import { showPreview } from "./preview";

$("upgrade-options").addEventListener("click", (e) => {
  const choice = (e.target as HTMLElement).closest<HTMLElement>("[data-upgrade]");
  if (choice) chooseUpgrade(choice.dataset.upgrade!);
});
$("upgrade-dialog").addEventListener("cancel", (e) => e.preventDefault());
$("arena-select").addEventListener("change", (e) => changeArena((e.target as HTMLSelectElement).value));
$("mode-duel").onclick = () => selectMode("duel");
$("mode-horde").onclick = () => selectMode("horde");
$("mode-tutorial").onclick = () => selectMode("tutorial");
$("tutorial-finish").onclick = () => selectMode("horde");
$("start").onclick = () => (game.state === "paused" ? pause() : start(game.state === "over"));
$("restart").onclick = () => start();
$("sound").onclick = () => {
  game.sound = !game.sound;
  $("sound").textContent = "Som: " + (game.sound ? "ligado" : "desligado");
  if (game.sound) {
    ensureAudio();
    sfx("upgradePick");
  }
  canvas.focus();
};
canvas.onclick = () => canvas.focus();
export function frame(t: number) {
  const dt = Math.min((t - game.last) / 1000, 0.05);
  game.last = t;
  if (game.state === "playing") {
    game.accumulator += dt;
    while (game.accumulator >= STEP && game.state === "playing") {
      update(STEP);
      game.accumulator -= STEP;
    }
  } else game.accumulator = 0;
  draw();
  requestAnimationFrame(frame);
}
bindInput();
bindManual();
reset();
const preview = new URLSearchParams(location.search).get("preview");
if (preview) showPreview(preview);
requestAnimationFrame(frame);
