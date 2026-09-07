[🇧🇷 Português](README.md) | 🇺🇸 **English**

<h1>ExitPath 2.0 - Evacuation Routing & Emergency Infrastructure with Graphs</h1>

<p align="center">
  <img src="https://i.postimg.cc/L5GFDGGp/Captura-de-Tela-2026-09-07-a-s-08-06-11.png" width="700"><br><br>
  <img src="https://i.postimg.cc/K8SyMSn0/Captura-de-Tela-2026-09-07-a-s-08-06-49.png" width="700"><br><br>
  <img src="https://i.postimg.cc/1zMx28bk/Captura-de-Tela-2026-09-07-a-s-08-07-25.png" width="700">
</p>

---

## The real problem

In an emergency every occupied room must be evacuated through the **best** exit, not necessarily
the nearest in meters. The best route depends on **distance**, **traversal time**, **risk**
(proximity to the hazard), **accessibility** (wheelchair users - PCD) and **emergency intensity**
(elevators are banned in intense fire). The building also needs a **minimum-cost network of
emergency infrastructure** (alarms, sensors, emergency lighting, communication) connecting every
point.

ExitPath 2.0 models both as graphs:

| Problem | Algorithm(s) |
| --- | --- |
| Least-cost evacuation route | **Dijkstra** and **A\*** |
| Minimum infrastructure network | **Kruskal** and **Prim** (MST) |

## Graph model

Each **floor** is a weighted, **undirected** graph. Vertices are environments (rooms, corridors,
stairs, elevators, exits…) carrying capacity, occupancy, accessibility and a canvas **position**
(x, y). Edges are connections carrying distance (m), traversal time (s), static risk (0–10),
accessibility and an optional blocked flag. Edge weight:

```
cost = w_dist · norm(distance) + w_time · norm(time) + w_risk · combinedRisk
```

Distance/time are normalized to `[0, 1]` against the whole floor's maxima; the weights come from the
chosen **criterion** (SHORTEST/FASTEST/SAFEST/BALANCED) blended with the **intensity**. Blocked
elements and banned elevators are **removed** from the graph, never mutated in the source data. Risk
spreads from the hazard origin via BFS (linear decay, zones CRITICAL→NONE).

## Algorithms

| Algorithm | Use | Structure | Complexity |
| --- | --- | --- | --- |
| Dijkstra | evacuation route | Min-Heap | `O((V + E) log V)` |
| A\* | guided evacuation route | Min-Heap | `O((V + E) log V)` |
| Kruskal | infrastructure MST | Union-Find | `O(E log E)` |
| Prim | infrastructure MST | Min-Heap | `O(E log E)` |

**A\* heuristic.** `h(n) = straight_line_distance(n, exit) · coefficient`, `f = g + h`. Node
positions are in pixels and distances in meters, so `GraphBuilder` folds a **conservative**
pixels→meters scale into the coefficient. The estimate never exceeds the real remaining distance
(triangle inequality) and ignores the non-negative time/risk terms, so the heuristic is **admissible
and consistent** - A\* returns the **same optimal path as Dijkstra**, usually exploring fewer nodes.

**Kruskal / Prim** both yield the same minimum total cost but may pick different edges on weight
ties; the app shows this. Disconnected graphs yield a minimum spanning **forest**.

## Features

- **Algorithm selector** (Dijkstra / A\* / Compare both) and **route priority** selector, sent to
  the engine and shown in the scenario summary.
- **Algorithm comparison** table (cost, distance, time, nodes explored, edges evaluated, runtime,
  percentage differences) from the real run,  nothing hardcoded.
- **Step-by-step playback** (play/pause/next/prev/restart, 0.5×/1×/2×) highlighting current /
  frontier / visited / final-path nodes on the canvas.
- **Risk visualization** with zones and a legend; the hazard origin is highlighted.
- **Accessibility** comparison (accessible vs standard route) and **contingency** route with real
  deltas.
- **Infrastructure planning** page (`/infrastructure`): candidate cabling with editable costs, run
  Kruskal/Prim/both, MST canvas, savings and step list.

See `src/graph/` for the core (`Graph`, `GraphBuilder`, `SimulationEngine`, `InfrastructurePlanner`,
`algorithms/`, `structures/`, `weights/`, `models/`). Note: `connectedComponents.ts` computes
reachability (connected components in an undirected graph), **not** strongly connected components.

## Running

Requires **Node.js 18+** and **npm**.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm test         # 55 Vitest tests
```

Sample buildings (including the "Centro de Demonstração Algorítmica" with one floor per algorithmic
scenario) are preloaded.

## Contributors

| [Camila Cavalcante](https://github.com/CamilaSilvaC) | [Luísa Ferreira](https://github.com/luisa12ll) |
| :---: | :---: |
| <img src="https://github.com/CamilaSilvaC.png" alt="camila" width="120"> | <img src="https://github.com/luisa12ll.png" alt="luisa" width="120"> |
