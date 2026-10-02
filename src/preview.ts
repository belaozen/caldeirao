import { game } from "./state";
import { configureArena } from "./arenas";
import { beginWave, spawnBatch } from "./horde";
import { start } from "./match";
import { updateHUD } from "./hud";

/** Layout check: `?preview=forest|frost` freezes a populated wave-5 horde on screen. */
export function showPreview(map: string) {
  configureArena(map === "frost" ? "frost" : "forest");
  game.mode = "horde";
  start();
  beginWave(5);
  spawnBatch();
  for (const p of game.players) p.inv = 0;
  game.state = "fixture";
  updateHUD();
}
