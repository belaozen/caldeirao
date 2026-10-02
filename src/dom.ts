// Elements whose specific DOM type the game relies on; every other id is a plain HTMLElement.
interface SpecialElements {
  "arena": HTMLCanvasElement;
  "arena-select": HTMLSelectElement;
  "manual": HTMLDialogElement;
  "upgrade-dialog": HTMLDialogElement;
}
type ElementFor<K extends string> = K extends keyof SpecialElements ? SpecialElements[K] : HTMLElement;

export const $ = <K extends string>(id: K) => document.getElementById(id) as ElementFor<K>;
export const canvas = $("arena");
export const ctx = canvas.getContext("2d")!;
