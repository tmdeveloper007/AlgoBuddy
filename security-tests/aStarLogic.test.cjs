// security-tests/aStarLogic.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/aStarLogic.test.cjs
//
// Tests the aStarGenerator export from src/features/algorithms/graph/aStarLogic.js

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

describe("aStarGenerator", () => {
  test("yields nothing when startNode is null", async () => {
    const { aStarGenerator } = await import('../src/features/algorithms/graph/aStarLogic.js');
    const frames = [...aStarGenerator([], [], null, 'C')];
    assert.strictEqual(frames.length, 0);
  });

  test("yields nothing when goalNode is null", async () => {
    const { aStarGenerator } = await import('../src/features/algorithms/graph/aStarLogic.js');
    const frames = [...aStarGenerator([], [], 'A', null)];
    assert.strictEqual(frames.length, 0);
  });

  test("yields nothing when startNode equals goalNode", async () => {
    const { aStarGenerator } = await import('../src/features/algorithms/graph/aStarLogic.js');
    const frames = [...aStarGenerator([], [], 'A', 'A')];
    assert.strictEqual(frames.length, 0);
  });

  test("yields at least one frame for a valid graph", async () => {
    const { aStarGenerator } = await import('../src/features/algorithms/graph/aStarLogic.js');
    const nodeList = [
      { id: 'A', x: 0, y: 0 },
      { id: 'B', x: 1, y: 0 },
      { id: 'C', x: 2, y: 0 },
    ];
    const edgeList = [
      { from: 'A', to: 'B', weight: 1 },
      { from: 'B', to: 'C', weight: 1 },
    ];
    const frames = [...aStarGenerator(nodeList, edgeList, 'A', 'C')];
    assert.ok(frames.length >= 1);
  });

  test("first frame has initialization description", async () => {
    const { aStarGenerator } = await import('../src/features/algorithms/graph/aStarLogic.js');
    const nodeList = [
      { id: 'A', x: 0, y: 0 },
      { id: 'B', x: 1, y: 0 },
      { id: 'C', x: 2, y: 0 },
    ];
    const edgeList = [
      { from: 'A', to: 'B', weight: 1 },
      { from: 'B', to: 'C', weight: 1 },
    ];
    const frames = [...aStarGenerator(nodeList, edgeList, 'A', 'C')];
    assert.ok(frames[0].description.includes('initialized'));
    assert.strictEqual(frames[0].currentNode, 'A');
  });

  test("last frame has phase found or no_path", async () => {
    const { aStarGenerator } = await import('../src/features/algorithms/graph/aStarLogic.js');
    const nodeList = [
      { id: 'A', x: 0, y: 0 },
      { id: 'C', x: 2, y: 0 },
    ];
    const edgeList = [{ from: 'A', to: 'B', weight: 1 }];
    const frames = [...aStarGenerator(nodeList, edgeList, 'A', 'C')];
    const last = frames[frames.length - 1];
    assert.ok(['found', 'no_path'].includes(last.phase));
  });

  test("visitedNodes and visitingNodes are Sets in every frame", async () => {
    const { aStarGenerator } = await import('../src/features/algorithms/graph/aStarLogic.js');
    const nodeList = [
      { id: 'A', x: 0, y: 0 },
      { id: 'B', x: 1, y: 0 },
      { id: 'C', x: 2, y: 0 },
    ];
    const edgeList = [
      { from: 'A', to: 'B', weight: 1 },
      { from: 'B', to: 'C', weight: 1 },
    ];
    const frames = [...aStarGenerator(nodeList, edgeList, 'A', 'C')];
    frames.forEach((frame) => {
      assert.ok(frame.visitedNodes instanceof Set, 'visitedNodes must be a Set');
      assert.ok(frame.visitingNodes instanceof Set, 'visitingNodes must be a Set');
    });
  });

  test("distances object is present in every frame", async () => {
    const { aStarGenerator } = await import('../src/features/algorithms/graph/aStarLogic.js');
    const nodeList = [
      { id: 'A', x: 0, y: 0 },
      { id: 'B', x: 1, y: 0 },
      { id: 'C', x: 2, y: 0 },
    ];
    const edgeList = [
      { from: 'A', to: 'B', weight: 1 },
      { from: 'B', to: 'C', weight: 1 },
    ];
    const frames = [...aStarGenerator(nodeList, edgeList, 'A', 'C')];
    frames.forEach((frame) => {
      assert.ok(typeof frame.distances === 'object');
    });
  });

  test("handles disconnected graph (no path)", async () => {
    const { aStarGenerator } = await import('../src/features/algorithms/graph/aStarLogic.js');
    const nodeList = [
      { id: 'A', x: 0, y: 0 },
      { id: 'D', x: 10, y: 0 },
    ];
    const edgeList = [{ from: 'A', to: 'B', weight: 1 }];
    const frames = [...aStarGenerator(nodeList, edgeList, 'A', 'D')];
    const last = frames[frames.length - 1];
    assert.strictEqual(last.phase, 'no_path');
    assert.strictEqual(last.visitingNodes.size, 0);
  });

  test("result field is an array when goal is found", async () => {
    const { aStarGenerator } = await import('../src/features/algorithms/graph/aStarLogic.js');
    const nodeList = [
      { id: 'A', x: 0, y: 0 },
      { id: 'B', x: 1, y: 0 },
      { id: 'C', x: 2, y: 0 },
    ];
    const edgeList = [
      { from: 'A', to: 'B', weight: 1 },
      { from: 'B', to: 'C', weight: 1 },
    ];
    const frames = [...aStarGenerator(nodeList, edgeList, 'A', 'C')];
    const last = frames[frames.length - 1];
    if (last.phase === 'found') {
      assert.ok(Array.isArray(last.result));
      assert.ok(last.result.includes('A'));
      assert.ok(last.result.includes('C'));
    }
  });
});
