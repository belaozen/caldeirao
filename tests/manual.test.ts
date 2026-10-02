import { afterEach, expect, test } from "vitest";
import { hero, press } from "./helpers";
import { $ } from "../src/dom";
import { game, mouse } from "../src/state";
import { closeManual, openManual } from "../src/manual";
import { beginAim } from "../src/player";
import { startArenaEvent } from "../src/events";
import { pause, start, update } from "../src/match";

const setHidden = (hidden: boolean) => Object.assign(document, { hidden });
afterEach(() => setHidden(false));

test("manual opens from the menu and returns to it", () => {
  openManual();
  expect(game.state).toBe("menu");
  expect($("manual").open).toBe(true);
  closeManual();
  expect(game.state).toBe("menu");
});

test("manual pauses the match, blocks shortcuts and keeps potions", () => {
  start();
  hero().potions = ["11"];
  beginAim(hero());
  mouse.leftHeld = true;
  openManual();
  const before = game.time;
  update(5);
  press("KeyR");
  press("KeyP");
  expect(game.state).toBe("paused");
  expect(game.time).toBe(before);
  expect(hero().aiming).toBe(false);
  expect(mouse.leftHeld).toBe(false);
  expect(hero().potions).toHaveLength(1);
  closeManual();
  expect(game.state).toBe("playing");
});

test("manual keeps an explicit pause and a finished round as they were", () => {
  start();
  pause();
  openManual();
  closeManual();
  expect(game.state).toBe("paused");
  game.state = "over";
  openManual();
  closeManual();
  expect(game.state).toBe("over");
});

test("closing the manual on a hidden tab stays paused", () => {
  start();
  openManual();
  setHidden(true);
  closeManual();
  expect(game.state).toBe("paused");
});

test("manual lists the six recipes", () => {
  expect($("manual-recipes").innerHTML.match(/class="manual-potion"/g)).toHaveLength(6);
});

test("arena events freeze while the manual is open", () => {
  start();
  startArenaEvent("lava");
  openManual();
  update(20);
  expect(game.arenaEvent.remaining).toBe(8);
  closeManual();
  expect(game.state).toBe("playing");
});
