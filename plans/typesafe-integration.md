# Integração TypeSafe (System One / Jev) — Proposta

Experimentos feitos com a API real (`jev-1.13.0`) usando os dados do próprio repositório como
gabarito: `ITEMLIST` (394 itens), `Factors` / `FactorGroups` (55 prioridades selecionáveis) e a
tabela `STATS` de `data/gatherItems.py`. Foram ~0,50M tokens de entrada e ~0,11M de saída no total.

## Resumo

Três casos de uso foram medidos contra o que o app faz hoje. O veredito:

| # | Mudança | Ganho medido | Vale a pena? |
|---|---------|--------------|--------------|
| 1 | Caixa "descreva seu objetivo" que escolhe a priority | 95% vs 84% de acerto; 4/4 objetivos vagos recusados corretamente | **Sim, recomendado** |
| 2 | Rerank + "não encontrei" ao resolver nome de item | Abstenção correta 5/5 vs 0/5; confiança separa certo (0,93) de errado (0,56) | **Sim, escopo pequeno** |
| 3 | Busca semântica na ItemTable / Cleaning / Perks | F1 92–97 em consultas focadas vs F1 0 da busca atual | Depende — precisa de gabarito humano |

Antes de qualquer coisa: o app é publicado como site estático no GitHub Pages, sem backend.
**A API key não pode ir no bundle.** Veja a seção "Restrição de segurança".

---

## Experimento 1 — Resolver nome de item (typo, apelido, abreviação)

**Desenho.** 106 referências: 64 corrupções mecânicas geradas com PRNG com semente fixa
(minúsculas, sem pontuação, sem espaços, palavra final removida, abreviação, troca de duas letras,
ordem invertida, ruído) + 42 frases reais de jogador, incluindo 5 itens que **não existem** no
catálogo. Gabarito = id real do item.

**Baseline (código comum).** Igualdade exata normalizada — que é o que o `AppLayout.js:248-251`
faz hoje — mais retriever Dice/bigrama com shortlist top-K.

| split | n | igualdade normalizada | Dice top-1 | TypeSafe (K=10) |
|---|---|---|---|---|
| todos os resolvíveis | 101 | 42 (42%) | 97 (96%) | **98 (97%)** |
| mecânicas | 64 | 24 (38%) | 62 (97%) | 61 (95%) |
| frases reais | 37 | 18 (49%) | 35 (95%) | **37 (100%)** |
| **abstenção nos 5 inexistentes** | 5 | 0/5 | 0/5 | **5/5** |

Custo/latência (106 casos, questões em lote numa única chamada cada):

| shortlist | TypeSafe top-1 | tokens in/out | tempo (106 casos) | confiança certo vs errado |
|---|---|---|---|---|
| K=5 | 95% | 38k / 7,6k | 2,0 s (2 chamadas) | 0,922 vs 0,444 |
| K=10 | 97% | 63k / 12,3k | 2,0 s (3 chamadas) | 0,929 vs 0,590 |
| K=25 | 97% | 137k / 26,3k | 3,7 s (5 chamadas) | 0,934 vs 0,563 |

**Leitura.** O Dice já é quase teto em typo, então **o rerank não compra acurácia** (96% → 97%).
O que ele compra é: (a) **abstenção calibrada** — 5/5 "não existe" recusados com probabilidade de
`none_of_these` entre 0,75 e 1,00, contra 0/5 do Dice; (b) **confiança utilizável** para rotear
(0,93 no acerto vs 0,56 no erro). O erro restante de maior valor (`"ascended pendant"`) era
*falta de cobertura do shortlist*, corrigido com K≥10.

O custo é honesto: 3 falsas abstenções em 101 no K=5 (K=25: 2 em 101), todas com confiança baixa
(0,30–0,45), ou seja, roteáveis para confirmação do usuário.

---

## Experimento 2 — "Descreva o que você quer" → priority (o mais promissor)

**Desenho.** 44 objetivos em linguagem natural, gabarito = a prioridade correta, com alternativas
igualmente defensáveis aceitas (ex.: `BEARD` ≡ `BEARD_SPEED`). 4 objetivos deliberadamente vagos
para testar abstenção. Escolha única sobre as **55 prioridades** fechadas (as mesmas de
`FactorGroups`, agrupadas como o usuário vê). Baseline = casamento por token contra o rótulo +
os stats da priority.

| sistema | acerto |
|---|---|
| baseline por palavra-chave | 37/44 (84%) |
| **TypeSafe (1 Choice sobre 55 opções)** | **42/44 (95%)** |

Confiança: **0,911 no acerto** (n=42) · **0,600 nos vagos** (n=4) · **0,475 no erro** (n=2) —
ordenação limpa o suficiente para gate de confiança.

**O keyword matcher falha justamente onde não há sobreposição lexical:**
`"kill titans faster"` → `POWER`, `"I keep dying, I need to survive longer"` → `TOUGHNESS`,
`"faster respawns"` → `RESPAWN`, `"better cooking speed"` → `COOKING`,
`"overall energy and magic for everything at once"` → `EMPC`. É exatamente o caso de uso.
Os 2 erros do TypeSafe (`"magic per bar"` conf 0,26 e `"fastest energy bar regen when my cap is
low"` conf 0,69) ficam **abaixo de um gate de 0,8** — ou seja, o app perguntaria em vez de errar.

**Os 4 objetivos vagos** (`"just make me stronger overall"`, `"whatever is best right now"`,
`"I want to be more efficient"`, `"help me progress"`) voltaram **todos** como `none_of_these`,
com confiança 0,38–0,75. Nunca aplicaria uma priority errada em cima de um pedido vago.

Custo: ~1,8k tokens de entrada + 0,5k de saída por objetivo; 0,78–1,47 s para um lote de 16.

---

## Experimento 3 — Busca semântica de itens (o app não tem nada disso hoje)

**Desenho.** 131 itens amostrados do catálogo (1 em cada 3). Gabarito = o item possui algum stat
do conjunto da própria priority do app (ex.: `WISHES` = Energy Cap/Power, Magic Cap/Power, Res3
Cap/Power, Raw Wish Speed). Uma pergunta Noul por item, em lote numa chamada.

Busca atual = `name.toLowerCase().includes(query)` (`CleaningTable.js:175-179`, `Perks.js:49`;
a `ItemTable` **não tem busca nenhuma**).

| consulta | regra de stats | F1 substring | F1 lexical-stats | F1 TypeSafe |
|---|---|---|---|---|
| gear para sobreviver | 121 | 0 | 15,3 | **96,7** |
| gear p/ ouro e drop rate | 17 | 0 | 52,3 | **91,9** |
| gear p/ meus hacks | 51 | 0 | 25,4 | 23,3 |
| gear p/ meus NGUs | 98 | 0 | 33,1 | 30,0 |
| gear p/ meus wishes | 111 | 0 | 25,2 | 19,4 |
| gear p/ minhas beards | 89 | 0 | 10,2 | 6,4 |
| **média** | | **0** | **26,9** | **44,6** |

**Leitura honesta.** A busca por substring dá **F1 0** em consulta descritiva — é um buraco real.
Com o modelo, consultas focadas ficam excelentes (`sobreviver` 96,7; `ouro/drop` 91,9, com o
lexical caindo para 35% de precisão por casar "drop" com tudo). Mas nas consultas largas
(wishes/NGUs/beards) o modelo é **muito mais seletivo** que a regra de stats: recall baixo e F1
pior que o baseline lexical. Olhando os casos, a divergência é em boa parte defensável — a regra
conta item de early game com 1 Energy Power como "bom para NGU", e o modelo diz não — mas
inspecionei alguns erros reais (`Badly Drawn Gun` marcado como "para hacks" sem nenhum stat de
hack). **Conclusão: não shippar sem um gabarito rotulado à mão.** A consulta ainda tinha
2,5k tokens de saída e 0,4–2,2 s por consulta.

---

## Experimento 4 — Estabilidade entre chamadas

Mesma requisição repetida 3× (12 objetivos + 1 pergunta Noul de guardrail):

- **12/12 respostas idênticas** nas 3 execuções.
- Deriva de confiança média entre execuções: **0,022**.
- Latência média 873 ms; 21,3k tokens de entrada por chamada.

Respostas determinísticas o bastante para **aplicar automaticamente acima de um limiar de
confiança**, sem pedir confirmação a cada clique.

---

## Mudanças propostas

### 1. Roteador de prioridade por linguagem natural (recomendado)

Na `FactorForm` já existe uma busca por substring no rótulo da priority (`FactorForm.js:29-42`).
Substituir por: campo "Descreva seu objetivo", uma chamada com **uma** Choice sobre as 55
prioridades, e o app pré-seleciona a priority.

- Mostrar a sugestão + a 2ª opção com as probabilidades (o usuário decide), nunca aplicar
  silenciosamente abaixo do gate de confiança (sugestão: 0,8).
- Abaixo do gate, cair no `none_of_these` → mostrar "não entendi, escolha manualmente".
- Isso entrega de verdade o "chat Gemini" que o `Settings.js:106` já anuncia e que não existe.
- Perguntar junto (fan-out especulativo, custo quase zero) uma Noul de guardrail do tipo
  "o pedido é sobre prioridade de gear?" para filtrar entrada fora de escopo.

**Arquivos:** `src/components/FactorForm/FactorForm.js`, novo `src/utils/priorityRouter.js`,
ação em `src/containers/App.js`, estado/cache em `src/reducers/optimizerSlice.js`.

### 2. Rerank + abstenção na resolução de nomes de item (escopo pequeno)

**Não substituir** o Dice — ele já é teto em typo. Adicionar em cima dele:

- recuperar top-10 pelo Dice, pedir uma Choice (K=10: 97%, +2pp em frases reais) com opção
  `none_of_these`, e **usar a abstenção** para dizer "não encontrei esse item" em vez de chutar.
- Gate pelo `none_of_these` ≥ 0,75 porque a abstenção do modelo é confiável (0,95–1,00 nos
  inexistentes).
- Cachear por string normalizada — o `loadState` em `src/reducers/Items.js:200-230` roda
  repetido em migração de save e a resposta é determinística.

Usar onde o app traduz nome → id: `EQUIP_ITEMS` (`optimizerSlice.js:776`) e a migração de
`loadState`. Hoje `EQUIP_ITEMS` está só parcialmente implementado (`optimizerSlice.js:612`),
então é a hora certa de projetar isso junto.

### 3. Melhorias de custo zero, sem IA (fazer primeiro)

- `Perks.js:49` busca só `p.name`, mas `perks.json` tem `description` — incluir a descrição no
  texto buscado resolve sozinho boa parte de "procurar por conceito" em perks.
- A `ItemTable` não tem busca; antes de IA, um filtro por stat/slot/zone já cobre a maior parte.

---

## Restrição de segurança (bloqueante para qualquer coisa em produção)

O app é 100% client-side e publicado em GitHub Pages (`package.json:2`, `deploy: gh-pages`).
A documentação do TypeSafe manda manter a credencial no servidor. Opções, em ordem de aderência
à arquitetura local-first do projeto:

1. **Chave do usuário, no navegador.** Campo em Settings, guardado via `src/utils/safeStorage.js`
   (mesmo modelo "traga seus dados" do save). Chave errada/proxy = recurso desabilitado, o app
   segue funcionando offline. Nunca commitar chave no bundle.
2. **Proxy pelo servidor local do Live Sync** (`localhost:3005`, que o mod C# já sobe em
   `LiveSyncEngine.js:74`). Custo zero para quem usa o mod.
3. **Função serverless** (Worker) com rate limit, se quiser valer para todos.

## Próximos passos sugeridos

1. Mudança 3 (grátis) — incluir descrições de perks na busca.
2. Mudança 1 atrás de um flag de settings, com a chave vinda do usuário.
3. Rotular à mão ~50 consultas descritivas e só então decidir sobre a mudança 3 (busca semântica).

## Ressalvas sobre os experimentos

- O gabarito é derivado das tabelas do próprio app (`Factors`, `Stats`), não de rótulos humanos
  independentes — por isso vale para comparar sistemas, não como verdade absoluta.
- As corrupções `abbrev` ("che amu", "bus swo upp") geram abreviações que não correspondem a como
  pessoas digitam; os únicos erros do TypeSafe no exp. 1 vêm quase todos daí.
- O exp. 3 usa 131 itens amostrados, com a regra de stats como proxy — a divergência
  modelo-vs-regra foi inspecionada caso a caso, mas não é validada.
- Os scripts dos experimentos ficaram no diretório de scratchpad da sessão (não versionados).
