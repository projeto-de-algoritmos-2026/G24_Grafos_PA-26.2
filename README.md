🇧🇷 **Português** | 🇺🇸 [English](README-eng.md)

<h1>ExitPath 2.0 - Rotas de Evacuação e Infraestrutura de Emergência com Grafos</h1>

<p align="center">
  <img src="https://i.postimg.cc/L5GFDGGp/Captura-de-Tela-2026-09-07-a-s-08-06-11.png" width="700"><br><br>
  <img src="https://i.postimg.cc/K8SyMSn0/Captura-de-Tela-2026-09-07-a-s-08-06-49.png" width="700"><br><br>
  <img src="https://i.postimg.cc/1zMx28bk/Captura-de-Tela-2026-09-07-a-s-08-07-25.png" width="700">
</p>

---

## Problema real

Em uma emergência (incêndio, vazamento, colapso), cada ambiente ocupado de um edifício precisa
ser esvaziado pela **melhor** saída, não necessariamente a mais próxima em metros. A melhor rota
depende de **distância**, **tempo de travessia**, **nível de risco** (proximidade do perigo),
**acessibilidade** (pessoas com deficiência - PCD) e da **intensidade** da emergência (em fogo
intenso, elevadores são proibidos). Além das rotas, o prédio precisa de uma **rede de
infraestrutura de emergência** (alarmes, sensores, iluminação, comunicação) que conecte todos os
pontos com o **menor custo de instalação** possível.

O ExitPath 2.0 modela ambos os problemas como grafos e os resolve com algoritmos clássicos:

| Problema | Algoritmo(s) |
| --- | --- |
| Rota de evacuação de menor custo | **Dijkstra** e **A\*** |
| Rede mínima de infraestrutura | **Kruskal** e **Prim** (MST) |

---

## Modelagem do prédio como grafo

Cada **andar** vira um grafo **ponderado e não-dirigido**. A construção do grafo para um cenário
específico fica em [`GraphBuilder`](src/graph/GraphBuilder.ts): ele filtra o que está bloqueado,
desativa elevadores conforme a intensidade, aplica o perfil de acessibilidade e calcula os pesos.
A classe [`Graph`](src/graph/Graph.ts) é intencionalmente “burra” (só lista de adjacência), para
que os algoritmos dependam de uma API estrutural pequena e estável.

### Vértices

Cada **ambiente** é um vértice: sala, corredor, escada, elevador, banheiro, **saída de emergência**
ou ponto de encontro. Guarda capacidade, ocupação (regular + PCD), acessibilidade e a **posição**
(x, y) na planta, usada pelo canvas **e** pela heurística do A\*.

### Arestas

Cada **conexão** entre dois ambientes é uma aresta não-dirigida (porta, corredor, escada,
elevador), com: distância (m), tempo de travessia (s), nível de risco estático (0–10),
acessibilidade (PCD) e um possível estado de bloqueio.

### Pesos

O peso de cada aresta é calculado em [`weights/costFunction.ts`](src/graph/weights/costFunction.ts):

```
custo = w_dist · norm(distância) + w_tempo · norm(tempo) + w_risco · risco_combinado
```

Os coeficientes `w_dist`, `w_tempo`, `w_risco` vêm do **critério de otimização** escolhido,
combinados com a **intensidade** (ver abaixo). Bloqueios e elevadores proibidos são **removidos**
do grafo (não recebem peso alto, desaparecem), preservando os dados originais do edifício.

### Normalização

Distância e tempo vivem em unidades diferentes (metros × segundos). Antes de combinar, cada um é
normalizado para `[0, 1]` dividindo pelo **maior valor observado no andar inteiro** (não só no
subgrafo filtrado). Isso mantém a escala de custo estável entre variantes do mesmo andar (rota
principal × contingência) e é o que permite comparar Dijkstra e A\* de forma justa e manter a
heurística do A\* admissível.

### Propagação de risco

Implementada em [`weights/riskPropagation.ts`](src/graph/weights/riskPropagation.ts). A partir da
**origem do perigo**, uma **BFS** sobre a topologia física atribui a cada ambiente uma distância
em saltos; o risco decai **linearmente** com a distância e zera após um raio adaptativo
(`max(3, ⌈salto_mais_distante · 0.6⌉)`). O resultado é classificado em zonas
`CRITICAL → HIGH → MEDIUM → LOW → NONE`, mostradas no canvas. O risco de uma aresta é o **máximo**
entre o risco estático dela e o risco dinâmico propagado (média das pontas), sempre em `[0, 1]`.

### Critérios de otimização

Quatro objetivos, definidos em `CRITERIA_WEIGHTS`, misturados com o perfil de `INTENSITY_WEIGHTS`:

| Critério | Prioriza | Ideia |
| --- | --- | --- |
| **SHORTEST** (Mais curta) | distância | menor caminho físico |
| **FASTEST** (Mais rápida) | tempo | menor tempo de travessia |
| **SAFEST** (Mais segura) | risco | evita as zonas de perigo |
| **BALANCED** (Balanceada) | equilíbrio | distância + tempo + risco |

Regra de mistura (documentada em `resolveCriteriaWeights`): critérios “extremos” são honrados
fortemente e a intensidade só empurra o risco um pouco (`influência = 0.25`); em **BALANCED**, a
intensidade dirige totalmente o equilíbrio (`influência = 1`). Quanto maior a intensidade, maior o
peso do risco.

---

## Dijkstra

[`algorithms/dijkstra.ts`](src/graph/algorithms/dijkstra.ts). Menor caminho ponderado da origem
até a **saída mais próxima em custo**, usando uma **fila de prioridade (min-heap binário)**
([`structures/PriorityQueue.ts`](src/graph/structures/PriorityQueue.ts)) - `push`/`popMin` em
`O(log n)`. Para assim que uma saída é retirada da fila (seguro, pois o Dijkstra finaliza nós em
ordem não-decrescente de custo).

**Complexidade:** `O((V + E) · log V)`.

## A\*

[`algorithms/astar.ts`](src/graph/algorithms/astar.ts). Mesma estrutura do Dijkstra, mas guiado por
uma heurística até a saída:

```
g(n) = custo real acumulado da origem até n
h(n) = distância_em_linha_reta(n, saída_mais_próxima) · coeficiente
f(n) = g(n) + h(n)        ← prioridade na fila
```

**Por que a heurística é admissível.** As posições estão em **pixels** e as distâncias em
**metros**. Para não superestimar, o `GraphBuilder` deriva uma escala **conservadora**
pixels→metros (o menor `metros/pixel` entre as arestas) e a dobra no coeficiente junto do
custo-por-metro. Assim a estimativa em linha reta nunca excede a distância real de nenhum trecho
(desigualdade triangular) e ignora as componentes de tempo e risco (não-negativas). A heurística é,
portanto, **admissível e consistente** → o A\* devolve **o mesmo caminho ótimo do Dijkstra**,
tipicamente **explorando menos nós** por ser guiado à saída.

**Complexidade:** `O((V + E) · log V)` (mesmo limite; a heurística muda *quais* nós são expandidos).

## Comparação Dijkstra × A\*

O [`SimulationEngine`](src/graph/SimulationEngine.ts) escolhe o ambiente ocupado com **mais
pessoas** como origem representativa e roda o(s) algoritmo(s) escolhido(s) sobre o **mesmo grafo**.
Cada execução registra caminho, custo, distância, tempo, **nós explorados**, **arestas analisadas**,
**tempo de execução** e os **passos** para animação. No modo *Comparar ambos*, a interface mostra a
tabela lado a lado e indica se os dois acharam o mesmo custo ótimo e o mesmo caminho, além da
diferença percentual de nós/arestas. Nenhum número é fixo, tudo vem da execução real
(`result.analysis`).

---

## Kruskal

[`algorithms/kruskal.ts`](src/graph/algorithms/kruskal.ts). Ordena as arestas candidatas por peso
crescente e aceita cada uma que conecte **dois componentes distintos**, detectando ciclos com
Union-Find. Em grafo desconexo produz naturalmente uma **floresta** geradora mínima (uma árvore por
componente). **Complexidade:** `O(E log E)`.

## Union-Find

[`structures/UnionFind.ts`](src/graph/structures/UnionFind.ts). Conjuntos disjuntos com **compressão
de caminho** e **união por rank**, dando `find`/`union` em tempo praticamente constante
(`α(n)` - Ackermann inverso). É o que torna a detecção de ciclos do Kruskal eficiente.

## Prim

[`algorithms/prim.ts`](src/graph/algorithms/prim.ts). Cresce uma única árvore a partir de um nó,
sempre adicionando a **aresta mais barata** que liga a árvore a um nó de fora, via **min-heap**.
Se sobrarem nós (grafo desconexo), inicia uma nova árvore, mesma **floresta** do Kruskal.
**Complexidade:** `O(E log E)`.

## Minimum Spanning Tree

Uma **MST** conecta todos os vértices com o menor peso total possível e sem ciclos (`V-1` arestas
para `V` nós conectados). Kruskal e Prim sempre chegam ao **mesmo custo total**, mas podem escolher
**arestas diferentes** quando há empates de peso, o app deixa isso explícito.

## Aplicação da MST à infraestrutura

[`InfrastructurePlanner`](src/graph/InfrastructurePlanner.ts) trata cada conexão física como um
**cabeamento candidato** (o duto segue o mesmo caminho das pessoas), com custo = distância ×
tarifa editável (R$/m). Rodar Kruskal/Prim devolve a **rede mínima**: quais conexões instalar, o
custo mínimo, a economia frente a instalar tudo e se todos os pontos ficaram conectados. A tela
`/infrastructure` permite escolher edifício/andar, editar custos, comparar Kruskal × Prim e ver os
passos.

---

## Acessibilidade

Ambientes com pessoas **PCD** recebem um grafo filtrado que **exclui conexões não acessíveis**. A
rota resultante é a acessível; o app também calcula a rota **padrão** equivalente e mostra a
diferença de distância/custo (ou avisa se **não há rota acessível**).

## Bloqueios

Ambientes e conexões podem ser bloqueados no canvas para simular fogo, colapso ou obstrução. São
**removidos** do grafo e as rotas recalculadas. Sob intensidade **HIGH/CRITICAL**, elevadores são
removidos automaticamente.

## Rota de contingência

Estratégia estilo Yen para o 2º melhor caminho: remove **uma aresta da rota principal por vez**,
recalcula com Dijkstra e mantém o **desvio mais barato** que difira da principal. A interface mostra
custo/distância/tempo principal × alternativa, **% de sobreposição**, **% de aumento de custo** e a
diferença em metros.

---

## Estrutura atualizada de `src/graph`

```
src/graph/
├── Graph.ts                      # Grafo ponderado (lista de adjacência)
├── GraphBuilder.ts               # Monta o grafo do cenário (bloqueios, PCD, intensidade, risco, escala do A*)
├── SimulationEngine.ts           # Orquestra: rotas, contingência, cobertura, análise e comparação
├── InfrastructurePlanner.ts      # Gera candidatos, roda MST (Kruskal/Prim) e compara
├── index.ts                      # Re-exporta o módulo
├── algorithms/
│   ├── dijkstra.ts               # Menor caminho (min-heap)
│   ├── astar.ts                  # Menor caminho guiado (min-heap + heurística)
│   ├── kruskal.ts                # MST por ordenação + Union-Find
│   ├── prim.ts                   # MST crescendo por min-heap
│   ├── bfs.ts / dfs.ts           # Buscas auxiliares (uso interno)
│   └── connectedComponents.ts    # Ambientes sem rota até uma saída
├── structures/
│   ├── PriorityQueue.ts          # Min-heap binário (Dijkstra, A*, Prim)
│   └── UnionFind.ts              # Conjuntos disjuntos (Kruskal)
├── weights/
│   ├── costFunction.ts           # Pesos por critério + intensidade, normalização
│   └── riskPropagation.ts        # Propagação de risco por BFS (zonas)
└── models/
    ├── pathfinding.types.ts      # Tipos de rota/execução/passos
    └── mst.types.ts              # Tipos de MST/passos
```

> **Nota de terminologia:** `connectedComponents.ts` faz *alcançabilidade* (componentes conexos por
> DFS a partir das saídas), **não** componentes **fortemente** conexos - o grafo é não-dirigido.

---

## Cenários de demonstração

O edifício **“Centro de Demonstração Algorítmica”** (em [`utils/demoScenarios.ts`](src/utils/demoScenarios.ts))
traz um andar por objetivo:

| Andar | Demonstra |
| --- | --- |
| **A · Dijkstra** | menor caminho ponderado fácil de explicar |
| **B · A\* vs Dijkstra** | grid onde ambos acham o mesmo ótimo e o A\* explora menos nós (também serve para bloqueio) |
| **C · Risco muda a rota** | “Mais curta” passa pelo fogo; “Mais segura” escolhe o desvio mais longo |
| **E · Acessibilidade** | rota padrão usa escada; PCD é forçado à rampa acessível |
| **F · Infraestrutura (MST)** | malha redundante para Kruskal/Prim podarem e reduzirem o custo |

---

## Como executar

Pré-requisitos: **Node.js 18+** e **npm**.

```bash
npm install
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173). O app já vem com edifícios de exemplo
carregados (inclusive o Centro de Demonstração). Build de produção: `npm run build`.

## Como executar testes

```bash
npm test
```

São 55 testes (Vitest) cobrindo PriorityQueue, UnionFind, Dijkstra, A\*, Kruskal, Prim, função de
custo, propagação de risco e testes de **integração** do `SimulationEngine` e do
`InfrastructurePlanner` sobre os cenários de demonstração.

---

## Colaboradores

| [Camila Cavalcante](https://github.com/CamilaSilvaC) | [Luísa Ferreira](https://github.com/luisa12ll) |
| :---: | :---: |
| <img src="https://github.com/CamilaSilvaC.png" alt="camila" width="120"> | <img src="https://github.com/luisa12ll.png" alt="luisa" width="120"> |
