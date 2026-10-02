# Caldeirão

Jogo de arena 2D com alquimia, feito em HTML, CSS e JavaScript. Colete insumos, prepare poções automaticamente e escolha entre arremessar ou beber.

## Jogar

Abra **index.html** no navegador do computador. O arquivo contém todo o jogo e pode ser aberto offline, sem instalar dependências. As fontes do Google Fonts são opcionais.

- **Duelo:** vença Malva com 3 eliminações ou 2 estrelas.
- **Hordas:** inimigos coletam insumos e usam poções; ondas vencidas oferecem upgrades e desbloqueios. Estrelas dão vidas extras.
- **Arenas:** Estufa da Lua, Bosque dos Corredores e Ruínas de Cristal, com passagens laterais sinalizadas.

## Controles

| Ação | Comando |
| --- | --- |
| Mover | A/D ou ←/→ |
| Pular / pulo duplo | W ou ↑ |
| Descer plataforma | S ou ↓ |
| Dash | Espaço; segue a direção segurada (duas = diagonal) ou para onde o personagem olha |
| Mirar / lançar | Segure / solte o botão esquerdo do mouse |
| Beber / cancelar mira | Botão direito |
| Trocar poção | E |
| Pausar / reiniciar | P / R |

O botão **Manual / Como jogar** explica receitas, progressão e eventos. Consulte também [LEIA-ME.md](LEIA-ME.md).

## Arquivos e desenvolvimento

- **index.html:** versão completa e independente para jogar.
- **game.js:** cópia editável da lógica; mantenha o script embutido no HTML sincronizado ao alterar.
- **test-*.cjs:** verificações de arenas, controles, bots, evolução e manual.

Execute os testes na raiz do repositório com Node.js, sem instalar pacotes:

```sh
node test-arenas.cjs
node test-progression.cjs
node test-manual.cjs
```

Protótipo para teclado e mouse.
