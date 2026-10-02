import { expect, test } from "vitest";
import { hero, press, release } from "./helpers";
import { STEP, TUTORIAL_STEPS } from "../src/config";
import { game } from "../src/state";
import { selectMode, start, update } from "../src/match";

test("tutorial advances through move, jump and dash", () => {
  selectMode("tutorial");
  start();
  press("KeyD");
  update(STEP);
  release("KeyD");
  expect(TUTORIAL_STEPS[game.tutorial.step].trigger).toBe("jump");
  press("KeyW");
  release("KeyW");
  expect(TUTORIAL_STEPS[game.tutorial.step].trigger).toBe("dash");
  hero().dashCooldown = 0;
  press("Space");
  expect(TUTORIAL_STEPS[game.tutorial.step].trigger).toBe("pickup");
});
