// Run with: node --experimental-detect-module --test security-tests/bfsLogic.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

test("bfsGenerator — normal traversal visits all reachable nodes in breadth-first order", async () => {
  const { bfsGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/bfsLogic.js")).href);

  const adj = {
    0: [{ node: 1 }, { node: 2 }],
    1: [{ node: 3 }],
    2: [],
    3: [],
  };

  const steps = [...bfsGenerator(adj, 0)];
  // Collect nodes in order of first appearance in visitedNodes
  const seen = new Set();
  const visitOrder = [];
  for (const step of steps) {
    for (const n of step.visitedNodes) {
      if (!seen.has(n)) {
        seen.add(n);
        visitOrder.push(n);
      }
    }
  }
  assert.deepStrictEqual(visitOrder, [0, 1, 2, 3]);
});

test("bfsGenerator — yields nothing for null adjacency list", async () => {
  const { bfsGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/bfsLogic.js")).href);

  const steps = [...bfsGenerator(null, 0)];
  assert.strictEqual(steps.length, 0);
});

test("bfsGenerator — yields nothing for empty adjacency list", async () => {
  const { bfsGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/bfsLogic.js")).href);

  const steps = [...bfsGenerator({}, 0)];
  assert.strictEqual(steps.length, 0);
});

test("bfsGenerator — yields nothing for invalid startNode", async () => {
  const { bfsGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/bfsLogic.js")).href);

  const adj = { 0: [{ node: 1 }] };
  const steps = [...bfsGenerator(adj, 99)];
  assert.strictEqual(steps.length, 0);
});

test("bfsGenerator — single-node graph yields at least one step", async () => {
  const { bfsGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/bfsLogic.js")).href);

  const adj = { 0: [] };
  const steps = [...bfsGenerator(adj, 0)];
  assert.ok(steps.length > 0, "Should produce at least one step");
  const visitedNodes = new Set();
  steps.forEach((s) => s.visitedNodes.forEach((n) => visitedNodes.add(n)));
  assert.ok(visitedNodes.has(0));
});

test("bfsGenerator — graph with isolated nodes visits only reachable component", async () => {
  const { bfsGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/bfsLogic.js")).href);

  const adj = {
    0: [{ node: 1 }],
    1: [],
    2: [{ node: 3 }],
    3: [],
  };

  const steps = [...bfsGenerator(adj, 0)];
  const visitedNodes = new Set();
  steps.forEach((s) => s.visitedNodes.forEach((n) => visitedNodes.add(n)));
  assert.ok(visitedNodes.has(0));
  assert.ok(visitedNodes.has(1));
  assert.ok(!visitedNodes.has(2));
  assert.ok(!visitedNodes.has(3));
});

test("bfsGenerator — queue reflects correct FIFO order", async () => {
  const { bfsGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/bfsLogic.js")).href);

  const adj = {
    0: [{ node: 1 }, { node: 2 }, { node: 3 }],
    1: [],
    2: [],
    3: [],
  };

  const steps = [...bfsGenerator(adj, 0)];
  const stepAfterStart = steps.find((s) => s.currentNode === 0 && s.queue.length === 3);
  assert.ok(stepAfterStart !== undefined, "Should find a step with queue [1,2,3]");
  assert.deepStrictEqual(stepAfterStart.queue, [1, 2, 3]);
});

test("bfsGenerator — plain node values (not objects) are handled correctly", async () => {
  const { bfsGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/bfsLogic.js")).href);

  const adj = {
    0: [1, 2],
    1: [],
    2: [],
  };

  const steps = [...bfsGenerator(adj, 0)];
  const visitedNodes = new Set();
  steps.forEach((s) => s.visitedNodes.forEach((n) => visitedNodes.add(n)));
  assert.ok(visitedNodes.has(0));
  assert.ok(visitedNodes.has(1));
  assert.ok(visitedNodes.has(2));
});
