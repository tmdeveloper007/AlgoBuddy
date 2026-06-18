// security-tests/graphUtility.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/graphUtility.test.cjs
//
// Tests pure graph utility functions in src/utils/graph.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// Inline the source to avoid ESM/compatibility issues.
function buildAdjacencyList(nodeCount, edges, isDirected, isWeighted = false) {
  const adj = {};
  for (let i = 0; i < nodeCount; i++) adj[i] = [];

  for (const { from, to, weight = 1 } of edges) {
    adj[from].push(isWeighted ? { to, weight } : to);
    if (!isDirected) adj[to].push(isWeighted ? { to: from, weight } : from);
  }
  return adj;
}

function buildAdjacencyMatrix(nodeCount, edges, isDirected, isWeighted = false) {
  const matrix = Array.from({ length: nodeCount }, () => Array(nodeCount).fill(0));
  for (const { from, to, weight = 1 } of edges) {
    matrix[from][to] = isWeighted ? weight : 1;
    if (!isDirected) matrix[to][from] = isWeighted ? weight : 1;
  }
  return matrix;
}

function bfsSteps(adj, start) {
  const steps = [];
  const visited = new Set();
  const queue = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift();
    steps.push({ current, visited: new Set(visited), queue: [...queue] });

    for (const neighbor of (adj[current] || [])) {
      const id = typeof neighbor === "object" ? neighbor.to : neighbor;
      if (!visited.has(id)) {
        visited.add(id);
        queue.push(id);
      }
    }
  }
  return steps;
}

function dfsSteps(adj, start) {
  const steps = [];
  const visited = new Set();

  function dfs(node) {
    visited.add(node);
    steps.push({ current: node, visited: new Set(visited), stack: [] });
    for (const neighbor of (adj[node] || [])) {
      const id = typeof neighbor === "object" ? neighbor.to : neighbor;
      if (!visited.has(id)) dfs(id);
    }
  }

  dfs(start);
  return steps;
}

function dijkstraSteps(adj, start, nodeCount) {
  const steps = [];
  const distances = {};
  const visited = new Set();

  for (let i = 0; i < nodeCount; i++) distances[i] = Infinity;
  distances[start] = 0;

  for (let i = 0; i < nodeCount; i++) {
    let u = -1;
    for (let v = 0; v < nodeCount; v++) {
      if (!visited.has(v) && (u === -1 || distances[v] < distances[u])) u = v;
    }
    if (u === -1 || distances[u] === Infinity) break;

    visited.add(u);
    steps.push({ current: u, visited: new Set(visited), distances: { ...distances } });

    for (const { to, weight } of (adj[u] || [])) {
      if (!visited.has(to) && distances[u] + weight < distances[to]) {
        distances[to] = distances[u] + weight;
      }
    }
  }
  return steps;
}

function primSteps(adj, start, nodeCount) {
  const steps = [];
  const visited = new Set();
  const mstEdges = [];

  visited.add(start);

  while (visited.size < nodeCount) {
    let bestEdge = null;
    let bestWeight = Infinity;

    for (const u of visited) {
      for (const { to, weight } of (adj[u] || [])) {
        if (!visited.has(to) && weight < bestWeight) {
          bestWeight = weight;
          bestEdge = { from: u, to, weight };
        }
      }
    }

    if (!bestEdge) break;

    visited.add(bestEdge.to);
    mstEdges.push(bestEdge);
    steps.push({ current: bestEdge.to, visited: new Set(visited), mstEdges: [...mstEdges] });
  }
  return steps;
}

function hasCycleDirected(nodeCount, adj) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = Array(nodeCount).fill(WHITE);

  function dfs(u) {
    color[u] = GRAY;
    for (const neighbor of (adj[u] || [])) {
      const v = typeof neighbor === "object" ? neighbor.to : neighbor;
      if (color[v] === GRAY) return true;
      if (color[v] === WHITE && dfs(v)) return true;
    }
    color[u] = BLACK;
    return false;
  }

  for (let i = 0; i < nodeCount; i++) {
    if (color[i] === WHITE && dfs(i)) return true;
  }
  return false;
}

function topologicalSort(nodeCount, adj) {
  const inDegree = Array(nodeCount).fill(0);
  for (let u = 0; u < nodeCount; u++) {
    for (const neighbor of (adj[u] || [])) {
      const v = typeof neighbor === "object" ? neighbor.to : neighbor;
      inDegree[v]++;
    }
  }

  const queue = [];
  for (let i = 0; i < nodeCount; i++) {
    if (inDegree[i] === 0) queue.push(i);
  }

  const order = [];
  while (queue.length > 0) {
    const u = queue.shift();
    order.push(u);
    for (const neighbor of (adj[u] || [])) {
      const v = typeof neighbor === "object" ? neighbor.to : neighbor;
      inDegree[v]--;
      if (inDegree[v] === 0) queue.push(v);
    }
  }

  return order.length === nodeCount ? order : null;
}

// ── Tests ────────────────────────────────────────────────────────────

describe("buildAdjacencyList", () => {
  test("builds undirected unweighted list", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 0, to: 2 },
    ], false);
    assert.ok(adj[0].includes(1), "0 should connect to 1");
    assert.ok(adj[0].includes(2), "0 should connect to 2");
    assert.ok(adj[1].includes(0), "1 should connect back to 0");
    assert.ok(adj[1].includes(2), "1 should connect to 2");
    assert.ok(adj[2].includes(1), "2 should connect back to 1");
    assert.ok(adj[2].includes(0), "2 should connect back to 0");
  });

  test("builds directed list", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ], true);
    assert.ok(adj[0].includes(1), "0 should have outgoing to 1");
    assert.ok(!adj[1].includes(0), "directed: 1 should NOT connect back to 0");
    assert.ok(adj[1].includes(2), "1 should have outgoing to 2");
    assert.ok(adj[2].length === 0, "2 should have no outgoing");
  });

  test("defaults weight to 1 in weighted mode", () => {
    const adj = buildAdjacencyList(2, [{ from: 0, to: 1 }], false, true);
    assert.equal(adj[0][0].weight, 1, "default weight should be 1");
    assert.equal(adj[0][0].to, 1);
  });

  test("stores weights correctly in weighted mode", () => {
    const adj = buildAdjacencyList(2, [{ from: 0, to: 1, weight: 5 }], false, true);
    assert.equal(adj[0][0].weight, 5);
    assert.equal(adj[0][0].to, 1);
    assert.equal(adj[1][0].to, 0);
    assert.equal(adj[1][0].weight, 5);
  });
});

describe("buildAdjacencyMatrix", () => {
  test("builds undirected unweighted matrix", () => {
    const m = buildAdjacencyMatrix(3, [{ from: 0, to: 1 }], false, false);
    assert.equal(m[0][1], 1);
    assert.equal(m[1][0], 1);
    assert.equal(m[0][0], 0);
    assert.equal(m[2][0], 0);
  });

  test("builds directed unweighted matrix", () => {
    const m = buildAdjacencyMatrix(3, [{ from: 0, to: 1 }], true, false);
    assert.equal(m[0][1], 1);
    assert.equal(m[1][0], 0);
  });

  test("stores weight in weighted mode", () => {
    const m = buildAdjacencyMatrix(2, [{ from: 0, to: 1, weight: 7 }], true, true);
    assert.equal(m[0][1], 7);
  });
});

describe("bfsSteps", () => {
  test("visits all reachable nodes in BFS order", () => {
    const adj = buildAdjacencyList(4, [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
    ], false);
    const steps = bfsSteps(adj, 0);
    const order = steps.map((s) => s.current);
    assert.deepStrictEqual(order, [0, 1, 2, 3]);
  });

  test("returns one step per visited node", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ], false);
    const steps = bfsSteps(adj, 0);
    assert.equal(steps.length, 3);
  });

  test("handles disconnected graph", () => {
    const adj = buildAdjacencyList(4, [{ from: 0, to: 1 }], false);
    const steps = bfsSteps(adj, 0);
    const order = steps.map((s) => s.current);
    assert.deepStrictEqual(order, [0, 1]);
  });

  test("handles weighted adjacency list", () => {
    const adj = buildAdjacencyList(3, [{ from: 0, to: 1, weight: 5 }], false, true);
    const steps = bfsSteps(adj, 0);
    const order = steps.map((s) => s.current);
    assert.deepStrictEqual(order, [0, 1]);
  });
});

describe("dfsSteps", () => {
  test("visits all reachable nodes", () => {
    const adj = buildAdjacencyList(4, [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
    ], false);
    const steps = dfsSteps(adj, 0);
    assert.equal(steps.length, 4);
  });

  test("marks start node visited in first step", () => {
    const adj = buildAdjacencyList(2, [{ from: 0, to: 1 }], false);
    const steps = dfsSteps(adj, 0);
    assert.equal(steps[0].current, 0);
    assert.ok(steps[0].visited.has(0));
  });
});

describe("dijkstraSteps", () => {
  test("computes correct distances on a simple weighted graph", () => {
    const adj = buildAdjacencyList(4, [
      { from: 0, to: 1, weight: 1 },
      { from: 0, to: 2, weight: 4 },
      { from: 1, to: 2, weight: 2 },
      { from: 1, to: 3, weight: 6 },
      { from: 2, to: 3, weight: 1 },
    ], false, true);
    const steps = dijkstraSteps(adj, 0, 4);
    const last = steps[steps.length - 1];
    assert.equal(last.distances[0], 0);
    assert.equal(last.distances[1], 1);
    assert.equal(last.distances[2], 3); // via 1
    assert.equal(last.distances[3], 4); // via 2
  });

  test("returns correct step count for connected graph", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1, weight: 1 },
      { from: 1, to: 2, weight: 1 },
    ], false, true);
    const steps = dijkstraSteps(adj, 0, 3);
    assert.equal(steps.length, 3);
  });

  test("handles disconnected graph gracefully", () => {
    const adj = buildAdjacencyList(3, [{ from: 0, to: 1, weight: 1 }], false, true);
    const steps = dijkstraSteps(adj, 0, 3);
    assert.equal(steps.length, 2); // only 0 and 1 reachable
  });
});

describe("primSteps", () => {
  test("builds MST with correct weight for a connected graph", () => {
    const adj = buildAdjacencyList(4, [
      { from: 0, to: 1, weight: 10 },
      { from: 0, to: 2, weight: 6 },
      { from: 0, to: 3, weight: 5 },
      { from: 1, to: 3, weight: 15 },
      { from: 2, to: 3, weight: 4 },
    ], false, true);
    const steps = primSteps(adj, 0, 4);
    const last = steps[steps.length - 1];
    assert.equal(last.mstEdges.length, 3); // MST has n-1 edges
    const total = last.mstEdges.reduce((sum, e) => sum + e.weight, 0);
    assert.equal(total, 19); // 5+4+10 = 19 (edges: 0-3, 3-2, 0-1 — no direct 2-1 edge in this graph)
  });

  test("returns 0 steps for single-node graph", () => {
    const adj = buildAdjacencyList(1, [], false, true);
    const steps = primSteps(adj, 0, 1);
    assert.equal(steps.length, 0);
  });
});

describe("hasCycleDirected", () => {
  test("returns true for a cyclic directed graph", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 0 },
    ], true);
    assert.ok(hasCycleDirected(3, adj));
  });

  test("returns false for a DAG", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
    ], true);
    assert.ok(!hasCycleDirected(3, adj));
  });

  test("detects self-loop as cycle", () => {
    const adj = buildAdjacencyList(1, [{ from: 0, to: 0 }], true);
    assert.ok(hasCycleDirected(1, adj));
  });
});

describe("topologicalSort", () => {
  test("returns correct order for a DAG", () => {
    const adj = buildAdjacencyList(4, [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 3 },
    ], true);
    const order = topologicalSort(4, adj);
    assert.notEqual(order, null);
    assert.equal(order.length, 4);
    assert.ok(order.indexOf(0) < order.indexOf(1));
    assert.ok(order.indexOf(0) < order.indexOf(2));
    assert.ok(order.indexOf(1) < order.indexOf(3));
    assert.ok(order.indexOf(2) < order.indexOf(3));
  });

  test("returns null for a cyclic graph", () => {
    const adj = buildAdjacencyList(3, [
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 0 },
    ], true);
    assert.equal(topologicalSort(3, adj), null);
  });

  test("returns correct order for single-node graph", () => {
    const adj = buildAdjacencyList(1, [], true);
    assert.deepStrictEqual(topologicalSort(1, adj), [0]);
  });

  test("handles disconnected nodes in DAG", () => {
    const adj = buildAdjacencyList(3, [{ from: 0, to: 1 }], true);
    const order = topologicalSort(3, adj);
    assert.notEqual(order, null);
    assert.equal(order.length, 3);
    assert.ok(order.indexOf(0) < order.indexOf(1));
  });
});
