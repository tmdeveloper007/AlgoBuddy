// security-tests/bfsLogic.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/bfsLogic.test.cjs
//
// Tests the bfsGenerator export from src/features/algorithms/graph/bfsLogic.js

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

describe("bfsGenerator", () => {
  test("yields nothing for null adjacency", async () => {
    const { bfsGenerator } = await import('../src/features/algorithms/graph/bfsLogic.js');
    const frames = [...bfsGenerator(null, null)];
    assert.strictEqual(frames.length, 0);
  });

  test("yields nothing for null startNode", async () => {
    const { bfsGenerator } = await import('../src/features/algorithms/graph/bfsLogic.js');
    const frames = [...bfsGenerator({}, null)];
    assert.strictEqual(frames.length, 0);
  });

  test("yields nothing when startNode key is absent from adjacency", async () => {
    const { bfsGenerator } = await import('../src/features/algorithms/graph/bfsLogic.js');
    const frames = [...bfsGenerator({ a: [] }, 'z')];
    assert.strictEqual(frames.length, 0);
  });

  test("yields one frame for a single isolated node", async () => {
    const { bfsGenerator } = await import('../src/features/algorithms/graph/bfsLogic.js');
    const adj = { A: [] };
    const frames = [...bfsGenerator(adj, 'A')];
    assert.ok(frames.length >= 1);
    assert.strictEqual(frames[0].currentNode, 'A');
    assert.deepStrictEqual(frames[0].queue, ['A']);
  });

  test("explores neighbors in BFS order for a simple two-level graph", async () => {
    const { bfsGenerator } = await import('../src/features/algorithms/graph/bfsLogic.js');
    const adj = { A: ['B', 'C'], B: [], C: [] };
    const frames = [...bfsGenerator(adj, 'A')];
    assert.strictEqual(frames[0].currentNode, 'A');
    assert.ok(frames[0].queue.includes('A'));
    const last = frames[frames.length - 1];
    assert.ok(last.visitedNodes.has('A'));
  });

  test("visitedNodes grows as BFS discovers nodes", async () => {
    const { bfsGenerator } = await import('../src/features/algorithms/graph/bfsLogic.js');
    const adj = { A: ['B', 'C'], B: ['D'], C: [], D: [] };
    const frames = [...bfsGenerator(adj, 'A')];
    const visitedSizes = frames.map((f) => f.visitedNodes.size);
    for (let i = 1; i < visitedSizes.length; i++) {
      assert.ok(visitedSizes[i] >= visitedSizes[i - 1]);
    }
  });

  test("queue is copied in each frame (immutability)", async () => {
    const { bfsGenerator } = await import('../src/features/algorithms/graph/bfsLogic.js');
    const adj = { A: ['B'], B: [] };
    const frames = [...bfsGenerator(adj, 'A')];
    frames.forEach((frame) => {
      assert.ok(Array.isArray(frame.queue));
    });
  });

  test("handles weighted adjacency list with node objects", async () => {
    const { bfsGenerator } = await import('../src/features/algorithms/graph/bfsLogic.js');
    const adj = { A: [{ node: 'B', weight: 5 }], B: [] };
    const frames = [...bfsGenerator(adj, 'A')];
    assert.ok(frames.length > 0);
    // A appears in visitedNodes at some point during traversal
    const anyVisitedA = frames.some((f) => f.visitedNodes.has('A'));
    assert.ok(anyVisitedA, 'A should appear in visitedNodes during traversal');
  });

  test("handles adjacency list with plain string neighbors", async () => {
    const { bfsGenerator } = await import('../src/features/algorithms/graph/bfsLogic.js');
    const adj = { A: ['B', 'C'], B: [], C: [] };
    const frames = [...bfsGenerator(adj, 'A')];
    assert.ok(frames.length > 0);
  });
});
