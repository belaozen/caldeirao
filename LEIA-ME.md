# Caldeirão — Arena alquímica · Protótipo 12

Abra `index.html` no navegador. O HTML contém todo o jogo, funciona offline e não precisa de instalação. As fontes decorativas usam Google Fonts quando disponível. `game.js` contém uma cópia legível do código do jogo.

## Controles

O jogo é **solo contra o bot**: você controla Íris; Malva é controlada pelo computador.

| Ação | Comando |
|---|---|
| Mover na horizontal | A / D ou ← / → |
| Dash com breve invencibilidade | Dois toques em uma direção; segure outra para diagonal |
| Pular / pulo duplo | W, ↑ ou Espaço |
| Descer por uma plataforma | S ou ↓ |
| Olhar e apontar em 360 graus | Mover o mouse na arena |
| Mostrar a parábola | Segurar botão esquerdo do mouse |
| Lançar a poção ativa | Soltar botão esquerdo |
| Cancelar a mira sem gastar a poção | Botão direito durante a mira, ou Esc |
| Beber a poção ativa | Botão direito fora da mira |
| Trocar a poção ativa | E |

A direção acompanha o cursor e a distância do cursor ao personagem controla a força: perto é mais fraco, longe é mais forte. Durante a mira o movimento horizontal para, mas a gravidade continua atuando. Cancelar permite voltar a andar imediatamente. Após cancelar com o direito, soltar o esquerdo não lança nem bebe a poção. O menu de contexto do navegador fica desativado apenas sobre a arena.

A parábola e o alvo mostram a primeira colisão prevista com cenário ou adversário, usando a mesma física da poção. Adversários podem se mover depois do lançamento. S/↓ atravessa as plataformas suspensas, mas não o chão ou paredes sólidas.

P pausa; R reinicia a sessão. Sair da janela pausa o jogo e cancela a mira sem gastar a poção.

### Dash

Toque duas vezes na mesma direção em até 0,25s. Segure outra direção para diagonal. Repetição automática e teclas equivalentes pressionadas juntas não contam. Espaço volta a pular. O dash dura 0,18 segundo e protege contra dano comum, perigos letais e congelamento durante o movimento. Há um intervalo de 0,85 segundo entre ativações, indicado abaixo da arena.

Funciona no chão e no ar, sem renovar o pulo duplo. Bater em uma parede ou no limite lateral interrompe o dash e sua invencibilidade; escudos e outras proteções anteriores continuam com sua própria duração. Um dash durante a mira a cancela sem gastar a poção. Soltar o botão do mouse depois desse cancelamento não lança. Personagens congelados ou eliminados não podem ativá-lo.

## Misturas e insumos

Passar sobre dois insumos prepara e guarda a poção automaticamente. Você pode carregar **até três poções prontas**, inclusive repetidas. O box destacado identifica a ativa; os outros boxes mostram as demais por ícones. E percorre as poções e volta ao começo. É possível trocar enquanto mira; a parábola assume a nova poção selecionada.

Preparar outra poção não troca a seleção atual. Ao lançar ou beber, somente a ativa é consumida; a próxima disponível é selecionada. Com três poções, o personagem deixa de coletar insumos até liberar um espaço. A ficha mostra o nome, os dois usos, o insumo da próxima mistura, vida e duração dos efeitos. Ser eliminado esvazia o inventário.

Há sempre **pelo menos dois insumos** no cenário. Normalmente o limite é quatro; durante a chuva de insumos, sobe para oito. Coletar ou deixar expirar um insumo causa reposição imediata quando o total cair abaixo de dois. Os extras normais continuam surgindo a cada 3,5–6,5 segundos, até o limite de quatro. Tipo e local são aleatórios. Insumos não coletados desaparecem após 12–18 segundos, respeitando a reposição mínima. Se paredes temporárias bloquearem os pontos habituais, o jogo busca outros locais livres.

Com **um insumo na mão**, os itens do cenário mostram o ícone da poção que você prepararia ao coletá-los. Exemplo: com Brasa, outra Brasa mostra Incêndio; Gelo mostra Vapor; Seiva mostra Ímpeto. O pequeno ponto colorido mantém a identificação do ingrediente original. Ao completar a mistura, os itens voltam à aparência normal. Os ícones correspondem sempre ao insumo carregado por você, não ao do bot.

## Arena e rounds

Vença cada round com **3 eliminações ou 2 estrelas**. O próximo round reinicia vida, itens e objetivos; o total de rounds vencidos é mantido. Reiniciar zera a sessão.

As estrelas ficam nos observatórios altos. O pulo duplo comum não alcança esses locais a partir das plataformas de apoio; o Salto lunar permite chegar lá. Paredes temporárias também podem criar novas rotas. Estrelas coletadas voltam ao lugar original quando seu portador é eliminado.

Os observatórios têm **portas alternadas**: um lado fica aberto por 12 segundos enquanto o outro permanece fechado. Há contagem regressiva no cenário e abaixo da arena. Coletar uma estrela reinicia os 12 segundos antes da abertura do outro lado, impedindo aproveitar o final do temporizador para pegar as duas com o mesmo boost de Salto lunar. O primeiro lado aberto alterna a cada round.

Portas fechadas bloqueiam personagens, dash e projéteis; não é possível coletar a estrela por trás delas. Se uma porta fechar com um personagem dentro, ele é reposicionado em um espaço livre fora da porta, sem dano ou aprisionamento. A pausa também congela o temporizador.

O vão central no chão leva ao corredor no topo. Essa passagem não renova os pulos. Paredes bloqueiam movimento e poções; plataformas deixam personagens subir por baixo, mas bloqueiam projéteis. As paredes superiores limitam atalhos entre os observatórios.

## Poções

| Receita | Poção | Jogar | Beber |
|---|---|---|---|
| Gelo + Gelo | Geada | Congela o adversário por 5 segundos | Escudo por 10 segundos |
| Gelo + Seiva | Salto lunar | Parede sólida temporária por 10 segundos | Superpulo, incluindo pulo duplo, por 10 segundos |
| Seiva + Seiva | Elixir vital | Nuvem circular letal por 6 segundos | Recupera 1 de vida, até o máximo de 5 |
| Brasa + Brasa | Incêndio | Explosão de 2 de dano e chão em chamas por 5 segundos | Combustão por 5 segundos: contato causa 1 de dano |
| Brasa + Gelo | Vapor | Coluna vertical de 2 de dano em toda a altura, atravessando plataformas | Velocidade por 10 segundos |
| Brasa + Seiva | Ímpeto | Deixa rastro aéreo letal até colidir; cada trecho dura 5 segundos | Retalia o dano recebido por 10 segundos |

Superpulo (10s), retaliação (10s) e nuvem tóxica (6s) são valores iniciais de balanceamento para efeitos cuja duração não foi especificada. A coluna de Vapor fica visível por 0,7s e atinge cada rival uma vez por lançamento. Retaliação devolve a quantidade de vida perdida ao atacante, respeitando escudo e invulnerabilidade, sem gerar ciclos de retaliação.

**Perigos próprios também contam:** nuvens, rastros, explosões e fogo no chão podem atingir o autor. Uma autoeliminação pontua para o adversário. O rastro de Ímpeto começa a 52 unidades do ponto de lançamento: essa área fica sem fogo, mesmo se o projétil voltar a passar por ela. Isso permite lançar parado sem se eliminar automaticamente. O restante do rastro continua letal, inclusive para o autor que entrar nele depois. Colisões com paredes continuam funcionando antes do rastro começar. Escudo e invulnerabilidade de reaparecimento protegem contra efeitos letais. O dano comum concede uma breve invulnerabilidade.

## Eventos da arena

Um contador de **30 segundos** escolhe um evento aleatório, sem repetir o anterior imediatamente. Nos **3 segundos finais**, o nome e a região afetada aparecem como aviso, ainda sem causar dano. Ao zerar, o evento começa:

| Evento | Duração | Efeito |
|---|---|---|
| Lava no piso inferior | 8s | Causa 1 de dano por contato, respeitando a breve invulnerabilidade. As plataformas acima e o vão central permitem escapar. |
| Lasers nas laterais | 6s | As duas faixas de 38 unidades nas bordas causam 2 de dano por contato. O centro fica livre. |
| Chuva de insumos | 10s | Ingredientes reais caem do alto e podem ser coletados. Até 8 itens simultâneos; os extras permanecem até coleta ou expiração. |

Quando o evento termina, a próxima contagem começa em 30s. Pausar, abrir o manual ou sair da janela congela o contador e os efeitos. Um novo round reinicia tudo. Escudo, dash e invulnerabilidade protegem dos perigos ambientais. Eliminações pela arena pontuam para o rival, mas o dano da arena não dispara retaliação contra ele.

## Estado do protótipo

HTML/CSS/JavaScript e Canvas 2D, sem dependências obrigatórias. Arte original desenhada por código. Modo solo com teclado e mouse. Não inclui multiplayer, gamepad ou controles touch. O bot ainda tem navegação simples.

Verificações automatizadas cobrem coleta, inventário de três poções, troca, consumo, combinação dos dois botões do mouse, cancelamento, mira em 360 graus, escala do canvas, comandos alternativos de pulo, descida de plataformas e as regras de combate já existentes.


## Hordas (experimental)

Use os botões Duelo normal / Hordas · teste; trocar reinicia a partida. Hordas: ondas de 2, 3, 2+2, 3+2, 3+3 e assim por diante, em grupos de no máximo 3. Cada grupo precisa ser eliminado antes do próximo. Há 2s de aviso de chegada, 4s entre ondas e cura de 1 HP ao completar uma onda. Três vidas; morrer perde uma vida e as poções. Cada estrela dá uma vida extra e só pode ser coletada uma vez por onda; volta na onda seguinte. R recomeça o modo atual.

Inimigos alquimistas: normal (3 HP), veloz (2 HP, mais rápido que Íris), grandão (8 HP, maior e lento). Coletam insumos, preparam, bebem e lançam poções; não causam dano ao simples contato e não se ferem entre si. Combustão por poção continua causando dano por contato. Perigos da arena também os atingem. Poções letais continuam letais.

Os boxes voltaram ao ícone único original de cada poção. As descrições de jogar e beber permanecem nas fichas e no manual.

Bots menos agressivos: hordas se movem mais devagar, fazem pequenas pausas e usam a mesma lógica de coleta e arremesso do bot do duelo. Malva leva mais tempo para mirar e espera entre ataques.


## Evolução nas hordas

Ao completar uma onda, escolha uma melhoria ou um desbloqueio com a arena pausada. Incêndio, Geada e Elixir começam liberados; Vapor, Ímpeto e Salto lunar precisam de desbloqueio. Ingredientes de combinações bloqueadas não são coletados; o mapa mostra um cadeado.

Cinco níveis por poção. Por melhoria: Geada +1s congelamento/+2s escudo; Salto lunar +2s parede; Elixir +1s nuvem/+1 HP cura (máximo 5); Incêndio +15px raio/+1s combustão; Vapor +12px coluna/+2s velocidade; Ímpeto +1s rastro/+2s retaliação. Base das durações: 2/4s, parede 4s, nuvem 3s, combustão 2s, velocidade 4s, rastro 2s e retaliação 4s. Superpulo: 6s. Explosão inicial: raio 60px. Coluna inicial: 32px.

Upgrades persistem entre mortes, mas reiniciar ou trocar de modo zera a evolução. Após maximizar tudo, a recompensa de onda é uma vida extra. Estrelas dão vidas extras, não HP; não há teto de três vidas. Duelo preserva as regras anteriores.


## Arenas

Seletor acima da arena: Estufa original, Bosque dos Corredores e Ruínas de Cristal. Trocar reinicia a partida, incluindo a evolução. As setas laterais marcam conexões direita/esquerda na mesma altura para jogadores e bots. Poções colidem com os limites. Buracos no piso retornam ao topo. Pontos de insumos, chegada de inimigos, estrelas e portas se adaptam ao mapa selecionado.
