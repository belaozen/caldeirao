import type { ArenaId, Arena } from "./types";

// Platforms are passable from below for players. Masonry and lunar walls are solid on every side.
export const isArenaId = (id: string): id is ArenaId => Object.hasOwn(ARENAS, id);

export const ARENAS: Record<ArenaId, Arena> = {
  classic: {
    name: "Estufa da Lua",
    portal: [350, 480],
    returnX: 480,
    spawns: [
      { x: 95, y: 393 },
      { x: 865, y: 393 },
    ],
    stars: [
      { x: 205, y: 55 },
      { x: 755, y: 55 },
    ],
    gates: [
      { x: 141, y: 4, w: 128, h: 103 },
      { x: 691, y: 4, w: 128, h: 103 },
    ],
    platforms: [
      { x: 0, y: 505, w: 425, h: 35 },
      { x: 535, y: 505, w: 425, h: 35 },
      { x: 25, y: 435, w: 140, h: 16 },
      { x: 795, y: 435, w: 140, h: 16 },
      { x: 90, y: 345, w: 185, h: 18 },
      { x: 685, y: 345, w: 185, h: 18 },
      { x: 350, y: 335, w: 260, h: 18 },
      { x: 150, y: 85, w: 110, h: 18, star: true },
      { x: 700, y: 85, w: 110, h: 18, star: true },
    ],
    masonry: [
      { x: 287, y: 410, w: 28, h: 95 },
      { x: 645, y: 410, w: 28, h: 95 },
      { x: 408, y: 0, w: 22, h: 245 },
      { x: 530, y: 0, w: 22, h: 245 },
    ],
    spawnSites: [
      { x: 60, y: 416 },
      { x: 130, y: 416 },
      { x: 830, y: 416 },
      { x: 900, y: 416 },
      { x: 125, y: 326 },
      { x: 235, y: 326 },
      { x: 725, y: 326 },
      { x: 835, y: 326 },
      { x: 380, y: 316 },
      { x: 480, y: 316 },
      { x: 580, y: 316 },
      { x: 200, y: 486 },
      { x: 355, y: 486 },
      { x: 605, y: 486 },
      { x: 760, y: 486 },
    ],
  },
  forest: {
    name: "Bosque dos Corredores",
    portal: [350, 480],
    returnX: 220,
    returnY: 60,
    spawns: [
      { x: 265, y: 222 },
      { x: 710, y: 487 },
    ],
    stars: [
      { x: 330, y: 102 },
      { x: 640, y: 102 },
    ],
    gates: [
      { x: 287, y: 45, w: 86, h: 85 },
      { x: 597, y: 45, w: 86, h: 85 },
    ],
    platforms: [
      { x: 285, y: 130, w: 90, h: 14, star: true },
      { x: 595, y: 130, w: 90, h: 14, star: true },
      { x: 230, y: 395, w: 65, h: 14 },
      { x: 440, y: 395, w: 90, h: 14 },
      { x: 875, y: 235, w: 85, h: 14 },
      { x: 0, y: 235, w: 60, h: 14 },
    ],
    masonry: [
      { x: 0, y: 0, w: 120, h: 30 },
      { x: 190, y: 0, w: 590, h: 30 },
      { x: 850, y: 0, w: 110, h: 30 },
      { x: 120, y: 30, w: 70, h: 125 },
      { x: 780, y: 30, w: 60, h: 365 },
      { x: 120, y: 240, w: 660, h: 55 },
      { x: 120, y: 295, w: 65, h: 150 },
      { x: 0, y: 505, w: 120, h: 35 },
      { x: 190, y: 505, w: 590, h: 35 },
      { x: 850, y: 505, w: 110, h: 35 },
    ],
  },
  frost: {
    name: "Ruínas de Cristal",
    portal: [365, 470],
    returnX: 480,
    spawns: [
      { x: 205, y: 487 },
      { x: 750, y: 487 },
    ],
    stars: [
      { x: 315, y: 120 },
      { x: 645, y: 120 },
    ],
    gates: [
      { x: 272, y: 55, w: 86, h: 95 },
      { x: 602, y: 55, w: 86, h: 95 },
    ],
    platforms: [
      { x: 25, y: 350, w: 85, h: 16 },
      { x: 180, y: 350, w: 70, h: 16 },
      { x: 710, y: 350, w: 70, h: 16 },
      { x: 850, y: 350, w: 85, h: 16 },
    ],
    masonry: [
      { x: 0, y: 0, w: 30, h: 350 },
      { x: 930, y: 0, w: 30, h: 350 },
      { x: 120, y: 0, w: 65, h: 275 },
      { x: 775, y: 0, w: 65, h: 275 },
      { x: 185, y: 0, w: 245, h: 40 },
      { x: 530, y: 0, w: 245, h: 40 },
      { x: 270, y: 150, w: 420, h: 55 },
      { x: 270, y: 205, w: 60, h: 80 },
      { x: 630, y: 205, w: 60, h: 80 },
      { x: 435, y: 290, w: 90, h: 65 },
      { x: 120, y: 505, w: 310, h: 35 },
      { x: 530, y: 505, w: 310, h: 35 },
    ],
  },
};
