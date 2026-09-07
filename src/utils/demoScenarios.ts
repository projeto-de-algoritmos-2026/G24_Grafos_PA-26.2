import type { Building, Connection, Environment, Floor } from '@/types';

/**
 * Purpose-built demonstration scenarios (spec section 16). Each floor is
 * crafted so a specific algorithmic behaviour is easy to reproduce and
 * explain during the presentation. None of the metrics are faked — the
 * graphs are shaped so the real algorithms produce the intended outcome.
 *
 * Scenario ids/positions are deterministic (no random ids) so the numbers
 * shown in the UI are reproducible across reloads.
 */

const now = new Date().toISOString();

// ── Scenario A — Dijkstra: one clearly-explainable weighted shortest path ─────
const scenarioA: Floor = {
  id: 'demo_floor_a_dijkstra',
  number: 1,
  name: 'Terreo',
  environments: [
    { id: 'a_origem', name: 'Sala Origem', type: 'ROOM', capacity: 40, isAccessible: true, occupancy: { regular: 24, pcd: 0 }, position: { x: 80, y: 250 } },
    { id: 'a_hall', name: 'Hall', type: 'CORRIDOR', capacity: 80, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 330, y: 120 } },
    { id: 'a_deposito', name: 'Depósito', type: 'ROOM', capacity: 30, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 330, y: 400 } },
    { id: 'a_corredor', name: 'Corredor', type: 'CORRIDOR', capacity: 80, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 580, y: 250 } },
    { id: 'a_saida', name: 'Saída', type: 'EMERGENCY_EXIT', capacity: 200, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 820, y: 250 } },
  ],
  connections: [
    // Fast upper path: Origem → Hall → Corredor → Saída  (short + quick)
    { id: 'a_c1', fromEnvironmentId: 'a_origem', toEnvironmentId: 'a_hall', distanceMeters: 14, traversalTimeSeconds: 18, riskLevel: 1, isAccessible: true, type: 'DOOR' },
    { id: 'a_c2', fromEnvironmentId: 'a_hall', toEnvironmentId: 'a_corredor', distanceMeters: 16, traversalTimeSeconds: 20, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    // Slow lower path via the storage room (longer)
    { id: 'a_c3', fromEnvironmentId: 'a_origem', toEnvironmentId: 'a_deposito', distanceMeters: 22, traversalTimeSeconds: 30, riskLevel: 2, isAccessible: true, type: 'DOOR' },
    { id: 'a_c4', fromEnvironmentId: 'a_deposito', toEnvironmentId: 'a_corredor', distanceMeters: 24, traversalTimeSeconds: 34, riskLevel: 2, isAccessible: true, type: 'CORRIDOR' },
    { id: 'a_c5', fromEnvironmentId: 'a_corredor', toEnvironmentId: 'a_saida', distanceMeters: 12, traversalTimeSeconds: 15, riskLevel: 0, isAccessible: true, type: 'DOOR' },
  ],
};

// ── Scenario B — A* vs Dijkstra (grid): both optimal, A* explores fewer ───────
// A uniform 3×4 grid. Origin is the bottom-left corner, the exit the
// top-right corner. Dijkstra fans out as a diamond and expands nodes far
// from the goal; A*, pulled by the straight-line heuristic toward the exit,
// expands markedly fewer nodes — while still returning the identical optimal
// cost (the heuristic is admissible). This same floor is used to demo route
// blocking (scenario D): block an edge on the primary route and rerun.
const buildGridScenario = (): Floor => {
  const cols = 4;
  const rows = 3;
  const startX = 70;
  const startY = 60;
  const stepX = 210;
  const stepY = 195;

  const environments: Environment[] = [];
  const connections: Connection[] = [];
  const idAt = (r: number, c: number) => `b_r${r}c${c}`;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const isOrigin = r === rows - 1 && c === 0; // bottom-left
      const isExit = r === 0 && c === cols - 1; // top-right
      environments.push({
        id: idAt(r, c),
        name: isExit ? 'Saída' : isOrigin ? 'Origem' : `Sala ${r}-${c}`,
        type: isExit ? 'EMERGENCY_EXIT' : 'ROOM',
        capacity: 40,
        isAccessible: true,
        occupancy: { regular: isOrigin ? 18 : 0, pcd: 0 },
        position: { x: startX + c * stepX, y: startY + r * stepY },
      });
    }
  }

  // Uniform grid edges (horizontal + vertical), identical weight so the
  // shortest path is a pure "manhattan" walk and the algorithms' explored
  // counts are what differ.
  const pushEdge = (r1: number, c1: number, r2: number, c2: number) => {
    connections.push({
      id: `b_${idAt(r1, c1)}_${idAt(r2, c2)}`,
      fromEnvironmentId: idAt(r1, c1),
      toEnvironmentId: idAt(r2, c2),
      distanceMeters: 20,
      traversalTimeSeconds: 26,
      riskLevel: 1,
      isAccessible: true,
      type: 'CORRIDOR',
    });
  };

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (c < cols - 1) pushEdge(r, c, r, c + 1);
      if (r < rows - 1) pushEdge(r, c, r + 1, c);
    }
  }

  return { id: 'demo_floor_b_astar', number: 2, name: '1º Andar', environments, connections };
};

const scenarioB = buildGridScenario();

// ── Scenario C — Risk changes the route ───────────────────────────────────────
// Two ways out of the origin: a physically SHORT corridor that runs right
// past the fire, and a LONGER detour that stays far from it. With criteria
// "Mais curta" the short (risky) corridor wins; with "Mais segura" the model
// (dynamic risk propagated from the fire + higher static risk on that
// corridor) makes the longer detour cheaper.
const scenarioC: Floor = {
  id: 'demo_floor_c_risk',
  number: 3,
  name: '2º Andar',
  environments: [
    { id: 'c_origem', name: 'Sala Origem', type: 'ROOM', capacity: 50, isAccessible: true, occupancy: { regular: 28, pcd: 0 }, position: { x: 90, y: 250 } },
    { id: 'c_foco', name: 'Foco de Incêndio', type: 'ROOM', capacity: 20, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 360, y: 60 } },
    { id: 'c_corredor_curto', name: 'Corredor Curto', type: 'CORRIDOR', capacity: 60, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 360, y: 250 } },
    { id: 'c_detour1', name: 'Corredor Sul 1', type: 'CORRIDOR', capacity: 60, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 300, y: 470 } },
    { id: 'c_detour2', name: 'Corredor Sul 2', type: 'CORRIDOR', capacity: 60, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 560, y: 470 } },
    { id: 'c_saida', name: 'Saída', type: 'EMERGENCY_EXIT', capacity: 200, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 780, y: 250 } },
  ],
  connections: [
    // Short route (passes right by the fire) — high static risk on top of the propagated risk.
    { id: 'c_short1', fromEnvironmentId: 'c_origem', toEnvironmentId: 'c_corredor_curto', distanceMeters: 12, traversalTimeSeconds: 16, riskLevel: 8, isAccessible: true, type: 'CORRIDOR' },
    { id: 'c_short2', fromEnvironmentId: 'c_corredor_curto', toEnvironmentId: 'c_saida', distanceMeters: 14, traversalTimeSeconds: 18, riskLevel: 8, isAccessible: true, type: 'CORRIDOR' },
    // The fire sits next to the short corridor (drives risk propagation).
    { id: 'c_fire', fromEnvironmentId: 'c_foco', toEnvironmentId: 'c_corredor_curto', distanceMeters: 9, traversalTimeSeconds: 12, riskLevel: 6, isAccessible: true, type: 'DOOR' },
    // Long, safe detour to the south.
    { id: 'c_long1', fromEnvironmentId: 'c_origem', toEnvironmentId: 'c_detour1', distanceMeters: 20, traversalTimeSeconds: 26, riskLevel: 0, isAccessible: true, type: 'CORRIDOR' },
    { id: 'c_long2', fromEnvironmentId: 'c_detour1', toEnvironmentId: 'c_detour2', distanceMeters: 20, traversalTimeSeconds: 26, riskLevel: 0, isAccessible: true, type: 'CORRIDOR' },
    { id: 'c_long3', fromEnvironmentId: 'c_detour2', toEnvironmentId: 'c_saida', distanceMeters: 20, traversalTimeSeconds: 26, riskLevel: 0, isAccessible: true, type: 'CORRIDOR' },
  ],
};

// ── Scenario E — Accessibility: standard uses stairs, PCD needs the ramp ───────
// The short way out is through a staircase that is NOT wheelchair accessible.
// Occupants without accessibility needs take it; the PCD profile is forced
// onto a longer, fully accessible ramp corridor.
const scenarioE: Floor = {
  id: 'demo_floor_e_accessibility',
  number: 4,
  name: '3º Andar',
  environments: [
    { id: 'e_origem', name: 'Sala Origem', type: 'ROOM', capacity: 40, isAccessible: true, occupancy: { regular: 10, pcd: 6 }, position: { x: 90, y: 250 } },
    { id: 'e_foco', name: 'Foco de Incêndio', type: 'ROOM', capacity: 10, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 90, y: 60 } },
    { id: 'e_escada', name: 'Escada', type: 'STAIRCASE', capacity: 40, isAccessible: false, occupancy: { regular: 0, pcd: 0 }, position: { x: 360, y: 110 } },
    { id: 'e_rampa1', name: 'Rampa 1', type: 'CORRIDOR', capacity: 60, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 330, y: 420 } },
    { id: 'e_rampa2', name: 'Rampa 2', type: 'CORRIDOR', capacity: 60, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 590, y: 420 } },
    { id: 'e_saida', name: 'Saída', type: 'EMERGENCY_EXIT', capacity: 200, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 800, y: 250 } },
  ],
  connections: [
    // Fire sits in a side room off the origin so the danger origin can be
    // blocked without removing either evacuation route.
    { id: 'e_fire', fromEnvironmentId: 'e_foco', toEnvironmentId: 'e_origem', distanceMeters: 10, traversalTimeSeconds: 14, riskLevel: 2, isAccessible: true, type: 'DOOR' },
    // Short route via a non-accessible staircase.
    { id: 'e_stair1', fromEnvironmentId: 'e_origem', toEnvironmentId: 'e_escada', distanceMeters: 12, traversalTimeSeconds: 18, riskLevel: 1, isAccessible: false, type: 'STAIRCASE' },
    { id: 'e_stair2', fromEnvironmentId: 'e_escada', toEnvironmentId: 'e_saida', distanceMeters: 12, traversalTimeSeconds: 18, riskLevel: 1, isAccessible: false, type: 'STAIRCASE' },
    // Longer, fully accessible ramp route.
    { id: 'e_ramp1', fromEnvironmentId: 'e_origem', toEnvironmentId: 'e_rampa1', distanceMeters: 20, traversalTimeSeconds: 26, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'e_ramp2', fromEnvironmentId: 'e_rampa1', toEnvironmentId: 'e_rampa2', distanceMeters: 20, traversalTimeSeconds: 26, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'e_ramp3', fromEnvironmentId: 'e_rampa2', toEnvironmentId: 'e_saida', distanceMeters: 20, traversalTimeSeconds: 26, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
  ],
};

// ── Scenario F — MST: a redundant mesh for Kruskal/Prim to prune ──────────────
// Six points wired with many more candidate links than needed to connect
// them. The MST keeps exactly 5 edges and drops the rest, making the cost
// saving and cycle-avoidance obvious on the infrastructure screen.
const scenarioF: Floor = {
  id: 'demo_floor_f_mst',
  number: 5,
  name: '4º Andar',
  environments: [
    { id: 'f_n1', name: 'Central', type: 'ROOM', capacity: 30, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 110, y: 240 } },
    { id: 'f_n2', name: 'Ala Norte', type: 'ROOM', capacity: 30, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 360, y: 80 } },
    { id: 'f_n3', name: 'Ala Sul', type: 'ROOM', capacity: 30, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 360, y: 420 } },
    { id: 'f_n4', name: 'Ala Leste', type: 'ROOM', capacity: 30, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 620, y: 240 } },
    { id: 'f_n5', name: 'Depósito', type: 'ROOM', capacity: 30, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 620, y: 470 } },
    { id: 'f_n6', name: 'Guarita', type: 'EMERGENCY_EXIT', capacity: 60, isAccessible: true, occupancy: { regular: 0, pcd: 0 }, position: { x: 840, y: 120 } },
  ],
  connections: [
    { id: 'f_e12', fromEnvironmentId: 'f_n1', toEnvironmentId: 'f_n2', distanceMeters: 18, traversalTimeSeconds: 24, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'f_e13', fromEnvironmentId: 'f_n1', toEnvironmentId: 'f_n3', distanceMeters: 20, traversalTimeSeconds: 26, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'f_e23', fromEnvironmentId: 'f_n2', toEnvironmentId: 'f_n3', distanceMeters: 34, traversalTimeSeconds: 44, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'f_e24', fromEnvironmentId: 'f_n2', toEnvironmentId: 'f_n4', distanceMeters: 22, traversalTimeSeconds: 28, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'f_e34', fromEnvironmentId: 'f_n3', toEnvironmentId: 'f_n4', distanceMeters: 24, traversalTimeSeconds: 30, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'f_e35', fromEnvironmentId: 'f_n3', toEnvironmentId: 'f_n5', distanceMeters: 16, traversalTimeSeconds: 22, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'f_e45', fromEnvironmentId: 'f_n4', toEnvironmentId: 'f_n5', distanceMeters: 19, traversalTimeSeconds: 25, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'f_e46', fromEnvironmentId: 'f_n4', toEnvironmentId: 'f_n6', distanceMeters: 21, traversalTimeSeconds: 27, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'f_e26', fromEnvironmentId: 'f_n2', toEnvironmentId: 'f_n6', distanceMeters: 30, traversalTimeSeconds: 38, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
    { id: 'f_e56', fromEnvironmentId: 'f_n5', toEnvironmentId: 'f_n6', distanceMeters: 36, traversalTimeSeconds: 46, riskLevel: 1, isAccessible: true, type: 'CORRIDOR' },
  ],
};

export const demoBuilding: Building = {
  id: 'building_demo_algoritmos',
  name: 'Centro de Demonstração Algorítmica',
  type: 'COMMERCIAL',
  description: 'Cenários desenhados para demonstrar Dijkstra, A*, risco, acessibilidade, bloqueio e MST.',
  createdAt: now,
  updatedAt: now,
  floors: [scenarioA, scenarioB, scenarioC, scenarioE, scenarioF],
};
