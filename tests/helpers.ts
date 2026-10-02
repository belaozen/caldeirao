import "../src/main";
import { game } from "../src/state";
import { start } from "../src/match";
import { onKeyDown, onKeyUp } from "../src/input";

export const hero = () => game.players[0];

export function press(code: string, extra: Partial<KeyboardEvent> = {}) {
  onKeyDown({ code, preventDefault() {}, ...extra } as KeyboardEvent);
}
export function release(code: string) {
  onKeyUp({ code } as KeyboardEvent);
}

/** Fresh horde match with a vulnerable hero, like every original test began. */
export function startHorde() {
  game.mode = "horde";
  start();
  hero().inv = 0;
}
