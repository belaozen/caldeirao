import type { Ingredient, RecipeKey, Recipe } from "./types";
import { names } from "./config";

export const recipes: Record<RecipeKey, Recipe> = {
  "00": {
    name: "Incêndio",
    icon: "✹",
    color: "#ff9968",
    throw: "Explosão e chão em chamas.",
    drink: "Combustão por 5s: contato causa dano.",
    type: "fire",
  },
  "11": {
    name: "Geada",
    icon: "❄",
    color: "#81ddef",
    throw: "Congela o adversário por 5s.",
    drink: "Escudo por 10s.",
    type: "ice",
  },
  "22": {
    name: "Elixir vital",
    icon: "✚",
    color: "#c6ec80",
    throw: "Nuvem circular letal por 6s.",
    drink: "Recupera 1 de vida.",
    type: "poison",
  },
  "01": {
    name: "Vapor",
    icon: "↟",
    color: "#e2dcff",
    throw: "Coluna de ataque em toda a altura.",
    drink: "Velocidade por 10s.",
    type: "steam",
  },
  "02": {
    name: "Ímpeto",
    icon: "ϟ",
    color: "#ffd97f",
    throw: "Rastro letal começa à frente e dura 5s.",
    drink: "Retalia o dano recebido por 10s.",
    type: "haste",
  },
  "12": {
    name: "Salto lunar",
    icon: "☾",
    color: "#b2b0ff",
    throw: "Cria uma parede sólida por 10s.",
    drink: "Superpulo duplo por 10s.",
    type: "jump",
  },
};
export const RECIPE_KEYS = Object.keys(recipes) as RecipeKey[];
export const recipeEntries = () => Object.entries(recipes) as [RecipeKey, Recipe][];
export const isRecipeKey = (key: string): key is RecipeKey => Object.hasOwn(recipes, key);
export const recipeOf = (key: string | null | undefined): Recipe | undefined =>
  key != null && isRecipeKey(key) ? recipes[key] : undefined;
/** Two ingredients always mix to the same key regardless of pickup order ("10" → "01"). */
/** "Brasa + Gelo" for a recipe key. */
export const formula = (key: RecipeKey) => `${names[+key[0]]} + ${names[+key[1]]}`;
export const mixKey = (a: Ingredient, b: Ingredient) => [a, b].sort().join("");
/** Duel texts; horde mode rewrites throw/drink with upgraded stats in refreshGrimoire(). */
export const originalRecipeText = Object.fromEntries(
  recipeEntries().map(([k, r]) => [k, { throw: r.throw, drink: r.drink }]),
) as Record<RecipeKey, { throw: string; drink: string }>;
