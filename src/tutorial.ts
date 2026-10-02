import type { TutorialTrigger } from "./types";
import { TUTORIAL_STEPS } from "./config";
import { $ } from "./dom";
import { game } from "./state";

export function resetTutorial() {
  game.tutorial = { step: 0, flags: {}, mixes: 0, startX: game.players[0]?.x ?? 0 };
  updateTutorialHUD();
}
export function tutorialSatisfied(trigger: TutorialTrigger | null) {
  if (!trigger) return false;
  if (trigger === "mix2") return game.tutorial.mixes >= 2;
  return !!game.tutorial.flags[trigger];
}
export function tutorialMark(trigger: TutorialTrigger) {
  if (game.mode !== "tutorial" || !trigger) return;
  game.tutorial.flags[trigger] = true;
  if (trigger === "mix") game.tutorial.mixes++;
  while (
    game.tutorial.step < TUTORIAL_STEPS.length - 1 &&
    tutorialSatisfied(TUTORIAL_STEPS[game.tutorial.step].trigger)
  )
    game.tutorial.step++;
  updateTutorialHUD();
}
export function updateTutorialHUD() {
  const panel = $("tutorial-panel");
  if (!panel) return;
  panel.hidden = game.mode !== "tutorial";
  if (game.mode !== "tutorial") return;
  const step = TUTORIAL_STEPS[game.tutorial.step];
  $("tutorial-step").textContent =
    game.tutorial.step < TUTORIAL_STEPS.length - 1
      ? `PASSO ${game.tutorial.step + 1}/${TUTORIAL_STEPS.length - 1}`
      : "PRONTO PARA JOGAR";
  $("tutorial-title").textContent = step.title;
  $("tutorial-copy").textContent = step.text;
  $("tutorial-finish").hidden = game.tutorial.step < TUTORIAL_STEPS.length - 1;
}
