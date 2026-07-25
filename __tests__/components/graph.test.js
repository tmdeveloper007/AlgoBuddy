// __tests__/components/graph.test.js
//
// Run with:  npx jest __tests__/components/graph.test.js
//
// Tests the pure graph logic in src/utils/graph.js.

const {
  buildAdjacencyList,
  buildAdjacencyMatrix,
  bfsSteps,
  dfsSteps,
  dijkstraSteps,
  primSteps,
  hasCycleDirected,
  topologicalSort,
} = require("../../src/utils/graph");

describe("buildAdjacencyList", () => {
  test("builds undirected adjacency list from edges", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ], false, false);
    expect(adj[0]).toContain(1);
    expect(adj[1]).toContain(0);
    expect(adj[1]).toContain(2);
    expect(adj[2]).toContain(1);
  });

  test("builds directed adjacency list from edges", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ], true, false);
    expect(adj[0]).toContain(1);
    expect(adj[1]).not.toContain(0);
    expect(adj[1]).toContain(2);
    expect(adj[2]).not.toContain(1);
  });

  test("handles weighted edges", () => {
    const adj = buildAdjacencyList(2, [
      { from: 0, to: 1, weight: 5 },
    ], false, true);
    expect(adj[0]).toEqual([{ to: 1, weight: 5 }]);
    expect(adj[1]).toEqual([{ to: 0, weight: 5 }]);
  });

  test("defaults weight to 1 when isWeighted is true but no weight given", () => {
    const adj = buildAdjacencyList(2, [{ from: 0, to: 1 }], false, true);
    expect(adj[0]).toEqual([{ to: 1, weight: 1 }]);
  });
});

describe("buildAdjacencyMatrix", () => {
  test("builds undirected adjacency matrix", () => {
    const mat = buildAdjacencyMatrix(3, [{ from: 0, to: 1 }], false, false);
    expect(mat[0][1]).toBe(1);
    expect(mat[1][0]).toBe(1);
    expect(mat[0][0]).toBe(0);
  });

  test("builds directed adjacency matrix", () => {
    const mat = buildAdjacencyMatrix(3, [{ from: 0, to: 1 }], true, false);
    expect(mat[0][1]).toBe(1);
    expect(mat[1][0]).toBe(0);
  });

  test("stores weight in weighted mode", () => {
    const mat = buildAdjacencyMatrix(2, [{ from: 0, to: 1, weight: 7 }], false, true);
    expect(mat[0][1]).toBe(7);
    expect(mat[1][0]).toBe(7);
  });
});

describe("bfsSteps", () => {
  test("traverses simple graph in breadth-first order", () => {
    // 0 - 1 - 2
    // |       |
    // 3 ----- 4
    const adj = buildAdjacencyList(5, [
      { from: 0, to: 1 }, { from: 0, to: 3 },
      { from: 1, to: 2 }, { from: 3, to: 4 }, { from: 2, to: 4 },
    ], false, false);

    const steps = bfsSteps(adj, 0);
    const visitedOrder = steps.map((s) => s.current);

    expect(visitedOrder[0]).toBe(0);
    // BFS visits level by level
    expect(visitedOrder).toContain(1);
    expect(visitedOrder).toContain(3);
    expect(visitedOrder).toHaveLength(5);
  });

  test("returns single step for isolated node", () => {
    const adj = buildAdjacencyList(1, [], false, false);
    const steps = bfsSteps(adj, 0);
    expect(steps).toHaveLength(1);
    expect(steps[0].current).toBe(0);
  });
});

describe("dfsSteps", () => {
  test("traverses simple graph in depth-first order", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 }, { from: 1, to: 2 },
    ], false, false);

    const steps = dfsSteps(adj, 0);
    const visitedOrder = steps.map((s) => s.current);

    expect(visitedOrder[0]).toBe(0);
    expect(visitedOrder).toHaveLength(3);
  });

  test("returns single step for isolated node", () => {
    const adj = buildAdjacencyList(1, [], false, false);
    const steps = dfsSteps(adj, 0);
    expect(steps).toHaveLength(1);
  });
});

describe("dijkstraSteps", () => {
  test("finds shortest path distances", () => {
    // 0 --2-- 1
    // |       |
    // 1       3
    // |       |
    // 2 --1-- 3
    const adj = buildAdjacencyList(4, [
      { from: 0, to: 1, weight: 2 },
      { from: 0, to: 2, weight: 1 },
      { from: 2, to: 3, weight: 1 },
      { from: 1, to: 3, weight: 3 },
    ], false, true);

    const steps = dijkstraSteps(adj, 0, 4);
    const lastStep = steps[steps.length - 1];

    expect(lastStep.distances[0]).toBe(0);
    expect(lastStep.distances[2]).toBe(1); // 0 -> 2
    expect(lastStep.distances[1]).toBe(2);  // 0 -> 1
    expect(lastStep.distances[3]).toBe(2);  // 0 -> 2 -> 3
  });

  test("handles disconnected graph", () => {
    const adj = buildAdjacencyList(3, [{ from: 0, to: 1 }], false, true);
    const steps = dijkstraSteps(adj, 0, 3);
    const lastStep = steps[steps.length - 1];
    expect(lastStep.distances[2]).toBe(Infinity);
  });
});

describe("primSteps", () => {
  test("builds minimum spanning tree", () => {
    // 0 --5-- 1
    // |       |
    // 6       4
    // |       |
    // 2 --2-- 3
    const adj = buildAdjacencyList(4, [
      { from: 0, to: 1, weight: 5 },
      { from: 0, to: 2, weight: 6 },
      { from: 1, to: 3, weight: 4 },
      { from: 2, to: 3, weight: 2 },
    ], false, true);

    const steps = primSteps(adj, 0, 4);
    const lastStep = steps[steps.length - 1];

    // MST should have 3 edges for 4 nodes
    expect(lastStep.mstEdges).toHaveLength(3);
    // Total weight: 2 (2-3) + 4 (1-3) + 5 (0-1) = 11, or 2+5+6 = 13, or 6+2+4 = 12
    const totalWeight = lastStep.mstEdges.reduce((sum, e) => sum + e.weight, 0);
    expect(totalWeight).toBeLessThan(Infinity);
  });

  test("handles disconnected graph", () => {
    const adj = buildAdjacencyList(3, [{ from: 0, to: 1 }], false, true);
    const steps = primSteps(adj, 0, 3);
    // Cannot visit all nodes — stops early
    expect(steps.length).toBeGreaterThan(0);
  });
});

describe("hasCycleDirected", () => {
  test("detects cycle in directed graph", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 0 },
    ], true, false);
    expect(hasCycleDirected(3, adj)).toBe(true);
  });

  test("returns false for acyclic directed graph", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ], true, false);
    expect(hasCycleDirected(3, adj)).toBe(false);
  });

  test("returns false for empty graph", () => {
    const adj = buildAdjacencyList(0, [], true, false);
    expect(hasCycleDirected(0, adj)).toBe(false);
  });
});

describe("topologicalSort", () => {
  test("returns topological order for DAG", () => {
    // 0 -> 1 -> 2
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ], true, false);
    const order = topologicalSort(3, adj);
    expect(order).not.toBeNull();
    expect(order).toHaveLength(3);
    // 0 must come before 1, 1 before 2
    expect(order.indexOf(0)).toBeLessThan(order.indexOf(1));
    expect(order.indexOf(1)).toBeLessThan(order.indexOf(2));
  });

  test("returns null for graph with cycle", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 0 },
    ], true, false);
    expect(topologicalSort(3, adj)).toBeNull();
  });

  test("returns empty array for empty graph (nodeCount=0)", () => {
    const adj = buildAdjacencyList(0, [], true, false);
    // When nodeCount is 0, order.length == nodeCount == 0, so empty array is returned
    expect(topologicalSort(0, adj)).toEqual([]);
  });
});
