# Algoritmos do ExitPath 2.0

Documentação técnica dos algoritmos de grafo usados no projeto. O pseudocódigo é intencionalmente
resumido — a implementação real está em `src/graph/`.

## Visão geral

| Algoritmo | Uso no ExitPath | Estrutura | Complexidade |
| --- | --- | --- | --- |
| Dijkstra | rota de evacuação | Min-Heap | `O((V + E) log V)` |
| A\* | rota de evacuação guiada | Min-Heap | `O((V + E) log V)` |
| Kruskal | MST de infraestrutura | Union-Find | `O(E log E)` |
| Prim | MST de infraestrutura | Min-Heap | `O(E log E)` |
| BFS (risco) | propagação de risco | Fila | `O(V + E)` |
| DFS / alcançabilidade | áreas sem saída | Pilha/recursão | `O(V + E)` |

`V` = número de ambientes; `E` = número de conexões do andar (já filtrado para o cenário).

---

## Função de custo das arestas

Antes dos algoritmos de caminho, cada aresta recebe um peso adimensional em `~[0, 1]`:

```
norm(x, max)   = max > 0 ? x / max : 0
custo(aresta)  = w_dist · norm(dist, maxDist)
               + w_tempo · norm(tempo, maxTempo)
               + w_risco · risco_combinado
```

- `maxDist`/`maxTempo` vêm do **andar inteiro** (normalização estável).
- `risco_combinado = max(risco_estático/10, risco_dinâmico_propagado)`, ambos em `[0, 1]`.
- `w_dist, w_tempo, w_risco` = mistura do critério (SHORTEST/FASTEST/SAFEST/BALANCED) com a
  intensidade (LOW→CRITICAL). Somam 1.

---

## Dijkstra

Menor caminho ponderado de uma origem até a saída de menor custo.

```
dist[origem] = 0; demais = ∞
heap.push(origem, 0)
enquanto heap não vazio:
    u = heap.popMin()
    se u já finalizado: continue
    finaliza u
    se u é saída: para (caminho encontrado)
    para cada vizinho v de u:
        se dist[u] + peso(u,v) < dist[v]:
            dist[v] = dist[u] + peso(u,v)
            anterior[v] = u
            heap.push(v, dist[v])
reconstrói caminho por 'anterior'
```

Parar ao **retirar** uma saída da fila é seguro porque o Dijkstra finaliza nós em ordem
não-decrescente de custo. Com min-heap binário: `O((V + E) log V)`.

## A\*

Dijkstra guiado por uma estimativa do custo restante.

```
g[origem] = 0
f(origem) = g[origem] + h(origem)
heap.push(origem, f(origem))
enquanto heap não vazio:
    u = heap.popMin()      # menor f
    se u já finalizado: continue
    finaliza u
    se u é saída: para
    para cada vizinho v de u:
        g_tentativo = g[u] + peso(u,v)
        se g_tentativo < g[v]:
            g[v] = g_tentativo
            anterior[v] = u
            heap.push(v, g[v] + h(v))
```

- `g(n)`: custo real acumulado até `n`.
- `h(n) = distância_linha_reta(n, saída) · coeficiente`, onde o coeficiente combina o custo-por-metro
  da distância com uma escala **conservadora** pixels→metros (as posições estão em pixels; as
  distâncias, em metros). `h` ignora tempo e risco (não-negativos).
- `f(n) = g(n) + h(n)`.

**Admissibilidade e consistência.** Como a escala é o menor `metros/pixel` observado, a estimativa em
linha reta nunca excede a distância real de nenhum trecho; pela desigualdade triangular, também não
excede a soma ao longo de qualquer caminho. Logo `h` é admissível **e** consistente, e o A\* devolve
o **mesmo caminho ótimo** do Dijkstra — normalmente expandindo menos nós. Se `h ≡ 0` (sem posições
ou coeficiente 0), o A\* degenera exatamente no Dijkstra.

## Comparação Dijkstra × A\*

Ambos rodam sobre o **mesmo grafo** e o mesmo par origem/saídas. Cada execução registra
`{caminho, custo, distância, tempo, nós_explorados, arestas_analisadas, tempo_execução, passos[]}`.
Com heurística admissível, os custos ótimos coincidem; os **nós explorados** diferem (o A\* costuma
explorar menos). Os passos alimentam a animação passo a passo sem re-executar o algoritmo.

---

## Union-Find (conjuntos disjuntos)

Suporte ao Kruskal: descobre se dois nós já estão no mesmo componente (ciclo).

```
find(x):  segue os pais até a raiz, comprimindo o caminho (aponta direto para a raiz)
union(a,b): ra=find(a); rb=find(b)
            se ra==rb: retorna false          # já conectados → ciclo
            liga a menor árvore sob a maior (união por rank); retorna true
```

Compressão de caminho + união por rank ⇒ operações em `α(n)` amortizado (praticamente constante).

## Kruskal

```
ordena arestas por peso crescente
uf = UnionFind(nós)
para cada aresta (u,v) em ordem:
    se uf.union(u,v):   aceita (entra na MST)
    senão:              rejeita (formaria ciclo)
```

Custo dominado pela ordenação: `O(E log E)`. Grafo desconexo ⇒ **floresta** geradora mínima.

## Prim

```
visitados = {início}
heap = arestas do início
enquanto heap não vazio:
    (u,v,peso) = heap.popMin()
    se v já visitado: rejeita (ciclo); continue
    visita v; aceita (u,v)
    empurra as arestas de v para fora da árvore
# se sobrar nó não visitado (grafo desconexo), recomeça de um deles
```

Cada aresta entra no heap no máximo uma vez por ponta: `O(E log E)`. Também produz **floresta** em
grafos desconexos.

## MST — observação sobre empates

Kruskal e Prim garantem o **mesmo custo total mínimo**, porém podem selecionar **conjuntos de
arestas diferentes** quando há pesos empatados. O app compara os dois e sinaliza “mesmo custo” e
“mesmas arestas” separadamente.

---

## Propagação de risco (BFS)

```
hop[origem] = 0; fila = [origem]
enquanto fila:
    u = desenfileira
    para cada vizinho v (topologia física, ignora bloqueios):
        se v não visitado: hop[v] = hop[u] + 1; enfileira v
raio = max(3, ⌈hop_max · 0.6⌉)
score(v) = max(0, 1 - hop[v]/raio)         # decai linearmente
zona(v)  = CRITICAL/HIGH/MEDIUM/LOW/NONE   # a partir do score
```

O risco de uma aresta usa a média dos scores das pontas, combinada por `max` com o risco estático.

## Alcançabilidade (DFS a partir das saídas)

Uma DFS partindo de cada saída marca todos os ambientes alcançáveis; os **não** visitados são áreas
sem rota de saída, destacadas na interface. `O(V + E)`. Termo correto: componentes **conexos**
(grafo não-dirigido), não “fortemente conexos”.
