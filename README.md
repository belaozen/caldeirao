# Caldeirão

Jogo de arena 2D com alquimia, feito em TypeScript e Canvas. Colete insumos, prepare poções automaticamente e escolha entre arremessar ou beber.

## Jogar

Gere a versão jogável com `npm run build` e abra **dist/index.html** no navegador do computador. É um arquivo único, com todo o jogo embutido: funciona offline e pode ser enviado por ZIP. As fontes do Google Fonts são opcionais.

- **Duelo:** vença Malva com 3 eliminações ou 2 estrelas.
- **Hordas:** inimigos coletam insumos e usam poções; ondas vencidas oferecem upgrades e desbloqueios. Estrelas dão vidas extras.
- **Arenas:** Estufa da Lua, Bosque dos Corredores e Ruínas de Cristal, com passagens laterais sinalizadas.

## Controles

| Ação                  | Comando                                                                           |
| --------------------- | --------------------------------------------------------------------------------- |
| Mover                 | A/D ou ←/→                                                                        |
| Pular / pulo duplo    | W ou ↑                                                                            |
| Descer plataforma     | S ou ↓                                                                            |
| Dash                  | Espaço; segue a direção segurada (duas = diagonal) ou para onde o personagem olha |
| Mirar / lançar        | Segure / solte o botão esquerdo do mouse                                          |
| Beber / cancelar mira | Botão direito                                                                     |
| Trocar poção          | E                                                                                 |
| Pausar / reiniciar    | P / R                                                                             |

O botão **Manual / Como jogar** explica receitas, progressão e eventos. Consulte também [LEIA-ME.md](LEIA-ME.md).

## Desenvolvimento

Requer Node.js 20 ou mais novo.

```sh
npm install
npm run dev      # servidor local com recarga automática
npm run build    # gera dist/index.html (arquivo único, offline)
npm test         # testes (Vitest)
npm run check    # tipos + formatação + testes
```

Para conferir o layout das arenas com uma horda parada na tela, abra o jogo com `?preview=forest` ou `?preview=frost` (por exemplo, `http://localhost:5173/?preview=frost`).

### Organização do código

O código fica em `src/`, em TypeScript estrito. Todo o estado mutável da partida está no objeto `game` (`src/state.ts`); os demais módulos leem e alteram `game.<campo>`.

| Arquivo                                                          | Conteúdo                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------- |
| `main.ts`                                                        | Inicialização, botões da interface e loop de quadros            |
| `types.ts`                                                       | Tipos compartilhados (jogador, poções, zonas, hordas…)          |
| `config.ts`, `recipes.ts`, `arenaLayouts.ts`                     | Dados: constantes, receitas e layouts das arenas                |
| `state.ts`                                                       | Estado da partida (`game`) e do mouse                           |
| `match.ts`                                                       | Modos, início/reinício, pausa e o passo de simulação `update()` |
| `player.ts`                                                      | Movimento, pulo, dash, mira, inventário e poções do jogador     |
| `combat.ts`                                                      | Projéteis, explosões, zonas, dano e eliminações                 |
| `ai.ts`                                                          | Comportamento dos bots                                          |
| `horde.ts`, `progression.ts`                                     | Ondas e fases; evolução e upgrades                              |
| `arenas.ts`, `events.ts`, `items.ts`                             | Portões e passagens; eventos de arena; insumos                  |
| `render.ts`, `hud.ts`                                            | Desenho no canvas; painéis em HTML                              |
| `input.ts`, `manual.ts`, `tutorial.ts`, `audio.ts`, `effects.ts` | Teclado/mouse, manual, tutorial, sons, partículas               |

Os testes ficam em `tests/` e rodam o jogo em Node com um DOM simulado; toda busca por id precisa existir de verdade no `index.html`.

Protótipo para teclado e mouse.
