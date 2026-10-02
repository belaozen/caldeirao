import type { PotionType } from "./types";
import { SFX_VOLUME } from "./config";
import { game } from "./state";

type WebkitWindow = Window & { webkitAudioContext: typeof AudioContext };

export function ensureAudio() {
  if (!game.sound) return null;
  try {
    game.audio ??= new (window.AudioContext || (window as unknown as WebkitWindow).webkitAudioContext)();
    if (!game.masterGain) {
      game.masterGain = game.audio.createGain();
      game.masterGain.gain.value = SFX_VOLUME;
      game.masterGain.connect(game.audio.destination);
    }
    if (game.audio.state === "suspended") game.audio.resume();
    return game.audio;
  } catch {
    return null;
  }
}
export function tone(
  freq = 440,
  duration = 0.1,
  {
    type = "triangle",
    gain = 0.18,
    slide = 0,
    delay = 0,
  }: { type?: OscillatorType; gain?: number; slide?: number; delay?: number } = {},
) {
  const a = ensureAudio();
  if (!a) return;
  const t = a.currentTime + delay,
    o = a.createOscillator(),
    g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(25, freq), t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(25, freq + slide), t + duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  o.connect(g);
  g.connect(game.masterGain!);
  o.start(t);
  o.stop(t + duration + 0.02);
}
export function noise(duration = 0.12, { gain = 0.13, delay = 0, cutoff = 1800 } = {}) {
  const a = ensureAudio();
  if (!a) return;
  const len = Math.max(1, Math.floor(a.sampleRate * duration)),
    buffer = a.createBuffer(1, len, a.sampleRate),
    data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(),
    filter = a.createBiquadFilter(),
    g = a.createGain(),
    t = a.currentTime + delay;
  src.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(game.masterGain!);
  src.start(t);
}
export function sfx(name: string) {
  if (!game.sound) return;
  switch (name) {
    case "jump":
      tone(280, 0.09, { slide: 170, gain: 0.13 });
      break;
    case "land":
      tone(115, 0.06, { type: "sine", slide: -35, gain: 0.08 });
      noise(0.045, { gain: 0.035, cutoff: 700 });
      break;
    case "dash":
      noise(0.13, { gain: 0.09, cutoff: 2700 });
      tone(520, 0.11, { type: "sawtooth", slide: -260, gain: 0.09 });
      break;
    case "pickup":
      tone(650, 0.055, { gain: 0.1 });
      tone(880, 0.07, { gain: 0.07, delay: 0.045 });
      break;
    case "mix":
      tone(430, 0.08, { gain: 0.1 });
      tone(650, 0.1, { gain: 0.09, delay: 0.055 });
      tone(900, 0.12, { gain: 0.08, delay: 0.11 });
      break;
    case "cycle":
      tone(560, 0.06, { gain: 0.07 });
      break;
    case "throw":
      tone(360, 0.08, { slide: 180, gain: 0.09 });
      noise(0.07, { gain: 0.035, cutoff: 2200 });
      break;
    case "drink":
      tone(520, 0.08, { type: "sine", slide: -80, gain: 0.08 });
      tone(760, 0.1, { type: "sine", gain: 0.055, delay: 0.05 });
      break;
    case "ice":
      tone(1050, 0.16, { type: "sine", slide: 380, gain: 0.09 });
      tone(1480, 0.12, { type: "triangle", gain: 0.06, delay: 0.025 });
      break;
    case "fire":
      noise(0.18, { gain: 0.11, cutoff: 1300 });
      tone(150, 0.15, { type: "sawtooth", slide: -70, gain: 0.09 });
      break;
    case "poison":
      tone(230, 0.18, { type: "sine", slide: -60, gain: 0.09 });
      tone(340, 0.14, { type: "sine", slide: -80, gain: 0.055, delay: 0.03 });
      break;
    case "steam":
      noise(0.22, { gain: 0.1, cutoff: 4200 });
      tone(540, 0.12, { type: "sine", slide: 180, gain: 0.045 });
      break;
    case "haste":
      tone(220, 0.055, { type: "square", slide: 280, gain: 0.07 });
      tone(620, 0.07, { type: "square", slide: -180, gain: 0.055, delay: 0.055 });
      break;
    case "jumpPotion":
      tone(260, 0.18, { type: "sine", slide: 250, gain: 0.08 });
      tone(520, 0.22, { type: "triangle", slide: 160, gain: 0.055, delay: 0.04 });
      break;
    case "shield":
      tone(920, 0.14, { type: "sine", slide: -200, gain: 0.08 });
      break;
    case "freeze":
      tone(1200, 0.12, { type: "triangle", slide: -500, gain: 0.075 });
      break;
    case "hit":
      noise(0.07, { gain: 0.1, cutoff: 850 });
      tone(105, 0.08, { type: "square", slide: -35, gain: 0.07 });
      break;
    case "enemyDown":
      tone(220, 0.08, { slide: -80, gain: 0.09 });
      tone(120, 0.16, { slide: -45, gain: 0.08, delay: 0.05 });
      break;
    case "playerDown":
      tone(180, 0.14, { slide: -110, gain: 0.1 });
      tone(90, 0.28, { type: "sine", slide: -40, gain: 0.09, delay: 0.08 });
      break;
    case "halfHeart":
      tone(760, 0.1, { type: "sine", gain: 0.08 });
      tone(980, 0.12, { type: "sine", gain: 0.06, delay: 0.07 });
      break;
    case "fullHeart":
      tone(660, 0.08, { gain: 0.08 });
      tone(880, 0.1, { gain: 0.08, delay: 0.06 });
      tone(1180, 0.15, { gain: 0.09, delay: 0.13 });
      break;
    case "wave":
      tone(180, 0.12, { type: "sawtooth", slide: 110, gain: 0.07 });
      tone(310, 0.14, { gain: 0.06, delay: 0.08 });
      break;
    case "chaser":
      tone(95, 0.22, { type: "square", slide: 30, gain: 0.08 });
      tone(145, 0.18, { type: "square", gain: 0.06, delay: 0.12 });
      break;
    case "upgradeOpen":
      tone(440, 0.09, { gain: 0.07 });
      tone(660, 0.1, { gain: 0.07, delay: 0.07 });
      tone(880, 0.12, { gain: 0.07, delay: 0.14 });
      break;
    case "upgradePick":
      tone(520, 0.07, { gain: 0.08 });
      tone(780, 0.11, { gain: 0.08, delay: 0.06 });
      break;
    case "phase":
      tone(330, 0.1, { gain: 0.08 });
      tone(495, 0.12, { gain: 0.08, delay: 0.08 });
      tone(740, 0.16, { gain: 0.09, delay: 0.17 });
      break;
    case "victory":
      for (const [i, f] of [523, 659, 784, 1047].entries()) tone(f, 0.18, { gain: 0.07, delay: i * 0.11 });
      break;
    case "warning":
      tone(260, 0.08, { type: "square", gain: 0.05 });
      break;
    case "corrupt":
      noise(0.22, { gain: 0.13, cutoff: 900 });
      tone(115, 0.2, { type: "sawtooth", slide: -55, gain: 0.1 });
      tone(72, 0.25, { type: "square", slide: -22, gain: 0.055, delay: 0.05 });
      break;
    default:
      tone(440, 0.08, { gain: 0.06 });
  }
}
export function potionSfx(type: PotionType) {
  sfx(type === "jump" ? "jumpPotion" : type);
}
export function beep(f = 440) {
  tone(f, 0.1, { gain: 0.06 });
}
