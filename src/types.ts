// Shared game types. Static data lives in config.ts, recipes.ts and arenaLayouts.ts;
// mutable match state lives in state.ts.

export type Mode = "duel" | "horde" | "tutorial";
export type GameState = "menu" | "playing" | "paused" | "over" | "upgrade" | "fixture";

export interface Point {
  x: number;
  y: number;
}
export interface Box extends Point {
  w: number;
  h: number;
}
/** Passable from below; `star` marks the observatory platform. */
export interface Platform extends Box {
  star?: boolean;
}
/** Temporary lunar wall created by the Salto lunar potion. */
export interface Wall extends Box {
  life: number;
  owner: number;
}

// 0 Brasa · 1 Gelo · 2 Seiva · 3 Corrupção (CORRUPT_TYPE)
export type Ingredient = number;
export type RecipeKey = "00" | "11" | "22" | "01" | "02" | "12";
export type PotionType = "fire" | "ice" | "poison" | "steam" | "haste" | "jump";
export interface Recipe {
  name: string;
  icon: string;
  color: string;
  throw: string;
  drink: string;
  type: PotionType;
}

export type ArenaId = "classic" | "forest" | "frost";
export interface Arena {
  name: string;
  /** Vertical band [top, bottom] where the side edges wrap around. */
  portal: [number, number];
  returnX: number;
  returnY?: number;
  spawns: [Point, Point];
  stars: [Point, Point];
  gates: [Box, Box];
  platforms: Platform[];
  masonry: Box[];
  /** Only the classic arena has fixed sites; the others derive them from platforms. */
  spawnSites?: Point[];
}

export type EnemyKind = "normal" | "fast" | "tank" | "chaser";
export interface EnemyType {
  name: string;
  hp: number;
  speed: number;
  color: string;
  mark: string;
}

export interface Player {
  id: number;
  name: string;
  kind?: EnemyKind;
  maxHp: number;
  speedFactor: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  face: number;
  hp: number;
  score: number;
  stars: number;
  bag: Ingredient[];
  potions: RecipeKey[];
  potionUses: number[];
  selected: number;
  jumps: number;
  // Timers in seconds (0 = inactive); `dead` is Infinity for eliminated horde enemies.
  inv: number;
  shield: number;
  superjump: number;
  speed: number;
  burn: number;
  reflect: number;
  frozen: number;
  dead: number;
  dropTimer: number;
  dashTime: number;
  dashCooldown: number;
  attackCooldown: number;
  aiming: boolean;
  dashDir: number;
  dashY: number;
  lastTapDir: number;
  lastTapTime: number;
  taps: Record<string, number>;
  angle: number;
  power: number;
  ai: number;
  aiCharge: number;
  aiTrack: number;
  aiLastX: number | null;
  aiLastY: number | null;
  aiStuck: number;
}
export type TimerKey =
  | "inv"
  | "shield"
  | "superjump"
  | "speed"
  | "burn"
  | "reflect"
  | "frozen"
  | "dropTimer"
  | "dashTime"
  | "dashCooldown"
  | "attackCooldown";

export interface Item extends Point {
  t: Ingredient;
  life: number;
  site?: number;
  falling?: boolean;
  vy?: number;
}

export interface Shot extends Point {
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  owner: number;
  r: Recipe;
  life: number;
}
export type Impact = { kind: "terrain"; body: Box } | { kind: "player"; body: Player } | { kind: "boundary" };

interface ZoneBase {
  life: number;
  color: string;
  owner: number;
}
export type Zone =
  | (ZoneBase & { type: "poison" | "frostFlash"; x: number; y: number; radius: number })
  | (ZoneBase & { type: "trail"; x: number; y: number; nx: number; ny: number; initialLife: number })
  | (ZoneBase & { type: "steam"; x: number; y: number; w: number; victims: number[] })
  | (ZoneBase & { type: "fire"; x: number; y: number; w: number; left: number; right: number });

export interface Star extends Point {
  side: number;
  owner: number | null;
}
export interface Particle extends Point {
  vx: number;
  vy: number;
  color: string;
  life: number;
}
export interface FloatText extends Point {
  s: string;
  color: string;
  life: number;
}

export type EventType = "lava" | "lasers" | "rain";
export interface ArenaEventState {
  phase: "countdown" | "active";
  remaining: number;
  pending: EventType | null;
  type: EventType | null;
  last: EventType | null;
  spawnClock: number;
}

export interface PendingEnemy extends Point {
  kind: EnemyKind;
}
export interface HordeState {
  stage: number;
  wave: number;
  globalWave: number;
  batch: number;
  groups: number[];
  pending: PendingEnemy[];
  timer: number;
  phase: "spawn" | "combat" | "rest" | "upgrade";
  lives: number;
  kills: number;
  chaserUsed: boolean;
  advanceStage: boolean;
}

export type PlayerUpgradeKey = "speed" | "maxHp" | "dispersion";
export interface Evolution {
  levels: Record<RecipeKey, number>;
  unlocked: RecipeKey[];
  player: Record<PlayerUpgradeKey, number>;
}

export type TutorialTrigger =
  "move" | "jump" | "dash" | "pickup" | "mix" | "aim" | "throw" | "mix2" | "drink";
export interface TutorialState {
  step: number;
  flags: Partial<Record<TutorialTrigger, boolean>>;
  mixes: number;
  startX: number;
}
