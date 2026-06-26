// Run with: node --experimental-detect-module --test security-tests/dijkstraLogic.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

test("dijkstraGenerator — normal shortest-path computation", async () => {
  const { dijkstraGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/dijkstraLogic.js")).href);

  // 0 -> 1 (weight 2), 0 -> 2 (weight 5), 1 -> 2 (weight 1), 2 -> 3 (weight 3)
  // Shortest path to 3 = 0 -> 1 -> 2 -> 3 = 2 + 1 + 3 = 6
  const adj = {
    0: [{ node: 1, weight: 2 }, { node: 2, weight: 5 }],
    1: [{ node: 2, weight: 1 }],
    2: [{ node: 3, weight: 3 }],
    3: [],
  };

  const steps = [...dijkstraGenerator(adj, 0)];
  assert.ok(steps.length > 0, "Should produce at least one step");

  // Find the last step — it should contain final distances
  const lastStep = steps[steps.length - 1];
  assert.deepStrictEqual(lastStep.distances, {
    0: 0,
    1: 2,
    2: 3,
    3: 6,
  });
});

test("dijkstraGenerator — yields nothing for null adjacency list", async () => {
  const { dijkstraGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/dijkstraLogic.js")).href);

  const steps = [...dijkstraGenerator(null, 0)];
  assert.strictEqual(steps.length, 0);
});

test("dijkstraGenerator — yields nothing for empty adjacency list", async () => {
  const { dijkstraGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/dijkstraLogic.js")).href);

  const steps = [...dijkstraGenerator({}, 0)];
  assert.strictEqual(steps.length, 0);
});

test("dijkstraGenerator — yields nothing for invalid startNode", async () => {
  const { dijkstraGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/dijkstraLogic.js")).href);

  const adj = { 0: [{ node: 1, weight: 1 }] };
  const steps = [...dijkstraGenerator(adj, 99)];
  assert.strictEqual(steps.length, 0);
});

test("dijkstraGenerator — graph with unreachable nodes keeps them at Infinity", async () => {
  const { dijkstraGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/dijkstraLogic.js")).href);

  const adj = {
    0: [{ node: 1, weight: 2 }],
    1: [],
    2: [], // unreachable
  };

  const steps = [...dijkstraGenerator(adj, 0)];
  const lastStep = steps[steps.length - 1];
  assert.strictEqual(lastStep.distances[0], 0);
  assert.strictEqual(lastStep.distances[1], 2);
  assert.strictEqual(lastStep.distances[2], Infinity);
});

test("dijkstraGenerator — single-node graph sets start distance to 0", async () => {
  const { dijkstraGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/dijkstraLogic.js")).href);

  const adj = { 0: [] };
  const steps = [...dijkstraGenerator(adj, 0)];
  assert.ok(steps.length > 0, "Should produce at least one step");
  const lastStep = steps[steps.length - 1];
  assert.strictEqual(lastStep.distances[0], 0);
});

test("dijkstraGenerator — last step indicates completion", async () => {
  const { dijkstraGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/dijkstraLogic.js")).href);

  const adj = {
    0: [{ node: 1, weight: 1 }],
    1: [],
  };

  const steps = [...dijkstraGenerator(adj, 0)];
  const lastStep = steps[steps.length - 1];
  assert.ok(
    lastStep.description.toLowerCase().includes("complete") ||
    lastStep.description.toLowerCase().includes("done"),
    "Last step should indicate completion"
  );
});

test("dijkstraGenerator — relaxations update distances correctly", async () => {
  const { dijkstraGenerator } = await import(pathToFileURL(path.join(__dirname, "..", "src/features/algorithms/graph/dijkstraLogic.js")).href);

  const adj = {
    0: [{ node: 1, weight: 10 }],
    1: [{ node: 2, weight: 1 }],
    2: [],
  };

  const steps = [...dijkstraGenerator(adj, 0)];
  // Find relaxation step where distance to node 2 is set
  const relaxationSteps = steps.filter(
    (s) => s.description.includes("Relaxed distance to 2")
  );
  assert.ok(relaxationSteps.length > 0, "Should have at least one relaxation step for node 2");
  assert.strictEqual(relaxationSteps[0].distances[2], 11, "Distance to node 2 should be 11 via 0->1->2");
});
