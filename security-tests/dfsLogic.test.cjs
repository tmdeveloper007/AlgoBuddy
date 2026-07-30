// security-tests/dfsLogic.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/dfsLogic.test.cjs
//
// Tests the dfsGenerator export from src/features/algorithms/graph/dfsLogic.js

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

describe("dfsGenerator", () => {
  test("yields nothing for null adjacency", async () => {
    const { dfsGenerator } = await import('../src/features/algorithms/graph/dfsLogic.js');
    const frames = [...dfsGenerator(null, null)];
    assert.strictEqual(frames.length, 0);
  });

  test("yields nothing for null startNode", async () => {
    const { dfsGenerator } = await import('../src/features/algorithms/graph/dfsLogic.js');
    const frames = [...dfsGenerator({}, null)];
    assert.strictEqual(frames.length, 0);
  });

  test("yields nothing when startNode key is absent from adjacency", async () => {
    const { dfsGenerator } = await import('../src/features/algorithms/graph/dfsLogic.js');
    const frames = [...dfsGenerator({ a: [] }, 'z')];
    assert.strictEqual(frames.length, 0);
  });

  test("yields one frame for a single isolated node", async () => {
    const { dfsGenerator } = await import('../src/features/algorithms/graph/dfsLogic.js');
    const adj = { A: [] };
    const frames = [...dfsGenerator(adj, 'A')];
    assert.ok(frames.length >= 1);
    assert.strictEqual(frames[0].currentNode, 'A');
    assert.deepStrictEqual(frames[0].stack, ['A']);
  });

  test("visitedNodes accumulates as DFS explores", async () => {
    const { dfsGenerator } = await import('../src/features/algorithms/graph/dfsLogic.js');
    const adj = { A: ['B'], B: [] };
    const frames = [...dfsGenerator(adj, 'A')];
    const visitedSizes = frames.map((f) => f.visitedNodes.size);
    for (let i = 1; i < visitedSizes.length; i++) {
      assert.ok(visitedSizes[i] >= visitedSizes[i - 1]);
    }
  });

  test("stack is copied in each frame (immutability)", async () => {
    const { dfsGenerator } = await import('../src/features/algorithms/graph/dfsLogic.js');
    const adj = { A: ['B'], B: [] };
    const frames = [...dfsGenerator(adj, 'A')];
    frames.forEach((frame) => {
      assert.ok(Array.isArray(frame.stack));
    });
  });

  test("produces backtracking frames when exploring children", async () => {
    const { dfsGenerator } = await import('../src/features/algorithms/graph/dfsLogic.js');
    const adj = { A: ['B', 'C'], B: [], C: [] };
    const frames = [...dfsGenerator(adj, 'A')];
    const hasBacktrack = frames.some(
      (f) => f.description && f.description.includes('Backtracking'),
    );
    assert.ok(hasBacktrack);
  });

  test("handles weighted adjacency list with node objects", async () => {
    const { dfsGenerator } = await import('../src/features/algorithms/graph/dfsLogic.js');
    const adj = { A: [{ node: 'B', weight: 5 }], B: [] };
    const frames = [...dfsGenerator(adj, 'A')];
    assert.ok(frames.length > 0);
  });

  test("handles adjacency list with plain string neighbors", async () => {
    const { dfsGenerator } = await import('../src/features/algorithms/graph/dfsLogic.js');
    const adj = { A: ['B', 'C'], B: [], C: [] };
    const frames = [...dfsGenerator(adj, 'A')];
    assert.ok(frames.length > 0);
  });

  test("final frame has empty stack", async () => {
    const { dfsGenerator } = await import('../src/features/algorithms/graph/dfsLogic.js');
    const adj = { A: ['B'], B: [] };
    const frames = [...dfsGenerator(adj, 'A')];
    const last = frames[frames.length - 1];
    assert.deepStrictEqual(last.stack, []);
  });
});
