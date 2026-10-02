import type { EnemyKind, EnemyType, EventType, PlayerUpgradeKey, TutorialTrigger } from "./types";

export const W = 960,
  H = 540,
  STEP = 1 / 120,
  GRAVITY = 1150,
  SHOT_GRAVITY = 620;
export const DASH = { tapWindow: 0.25, duration: 0.18, cooldown: 0.85, speed: 760 };
export const GATE_PERIOD = 12,
  MIN_ITEMS = 2;
export const TRAIL_SAFE_RADIUS = 52,
  EVENT_INTERVAL = 30,
  EVENT_WARNING = 3;
export const EVENT_TYPES: Record<EventType, { name: string; duration: number; color: string }> = {
  lava: { name: "Lava no piso inferior", duration: 8, color: "#ffac72" },
  lasers: { name: "Lasers nas laterais", duration: 6, color: "#ff9fce" },
  rain: { name: "Chuva de insumos", duration: 10, color: "#b9eea1" },
};
export const RULES = {
  kills: 3,
  stars: 2,
  hp: 5,
  freeze: 5,
  shield: 10,
  lunar: 10,
  burn: 5,
  speed: 10,
  reflect: 10,
  wall: 10,
  poison: 6,
  trail: 5,
  maxItems: 4,
};
export const colors = ["#ffab70", "#81ddef", "#c6ec80", "#111318"],
  names = ["Brasa", "Gelo", "Seiva", "Corrupção"];
export const CORRUPT_TYPE = 3,
  CORRUPT_CHANCE = 0.12,
  CORRUPT_RAIN_CHANCE = 0.15;
export const controls = {
  left: "KeyA",
  right: "KeyD",
  up: "KeyW",
  down: "KeyS",
  dash: "Space",
  cycle: "KeyE",
  leftAlt: "ArrowLeft",
  rightAlt: "ArrowRight",
  upAlt: "ArrowUp",
  downAlt: "ArrowDown",
};
export const SFX_VOLUME = 0.16;
export const ENEMY_TYPES: Record<EnemyKind, EnemyType> = {
  normal: { name: "Normal", hp: 3, speed: 0.65, color: "#f8a2bd", mark: "◆" },
  fast: { name: "Veloz", hp: 2, speed: 1.1, color: "#8ff0cc", mark: "»" },
  tank: { name: "Grandão", hp: 8, speed: 0.55, color: "#ffc37a", mark: "▣" },
  chaser: { name: "Incendiário", hp: 1, speed: 1.18, color: "#ff7657", mark: "☄" },
};
export const MAX_EFFECT_LEVEL = 5,
  UPGRADE_CHOICES = 3,
  PHASE_WAVES = [5, 7, 10],
  HORDE_BASE_HP = 4,
  HORDE_BASE_SPEED = 0.9,
  PLAYER_SPEED_STEP = 0.08,
  MAX_PLAYER_SPEED_LEVEL = 5,
  MAX_PLAYER_HP_LEVEL = 5,
  MAX_DISPERSION_LEVEL = 9;
export const TUTORIAL_STEPS: { trigger: TutorialTrigger | null; title: string; text: string }[] = [
  {
    trigger: "move",
    title: "01 · Movimento",
    text: "Use A/D ou ←/→ para andar pela arena. Mova Íris alguns passos.",
  },
  {
    trigger: "jump",
    title: "02 · Pulo",
    text: "Pressione W ou ↑ para pular. Você pode pular duas vezes antes de tocar o chão.",
  },
  {
    trigger: "dash",
    title: "03 · Dash",
    text: "Pressione Espaço para dar um dash. Segure uma direção para escolher para onde avançar.",
  },
  {
    trigger: "pickup",
    title: "04 · Primeiro insumo",
    text: "Encoste em um insumo colorido. Laranja é Brasa, azul é Gelo e verde é Seiva.",
  },
  {
    trigger: "mix",
    title: "05 · Prepare uma poção",
    text: "Colete um segundo insumo. Os dois se misturam automaticamente e viram uma poção.",
  },
  {
    trigger: "aim",
    title: "06 · Mire",
    text: "Mova o mouse e segure o botão esquerdo. A parábola mostra a trajetória e a distância controla a força.",
  },
  {
    trigger: "throw",
    title: "07 · Arremesse",
    text: "Solte o botão esquerdo para lançar a poção no boneco-alvo.",
  },
  {
    trigger: "mix2",
    title: "08 · Prepare outra",
    text: "Colete mais dois insumos para criar outra poção. Você pode guardar até três.",
  },
  {
    trigger: "drink",
    title: "09 · Beba a poção",
    text: "Com uma poção pronta e sem estar mirando, clique com o botão direito para beber e ativar o efeito.",
  },
  {
    trigger: null,
    title: "Tutorial concluído",
    text: "Você já sabe mover, misturar, lançar e beber poções. No jogo normal, use E para trocar a poção ativa e colete duas metades de coração nas Hordas para ganhar uma vida.",
  },
];
export const PLAYER_UPGRADES: Record<PlayerUpgradeKey, { name: string; icon: string; color: string }> = {
  speed: { name: "Mais velocidade", icon: "»", color: "#80d9e8" },
  maxHp: { name: "Mais vida máxima", icon: "♥", color: "#ff8fa8" },
  dispersion: { name: "Dispersão", icon: "✦", color: "#ffe291" },
};
