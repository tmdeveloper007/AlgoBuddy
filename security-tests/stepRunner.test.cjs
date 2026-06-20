/**
 * Regression tests for visualizer step runner utilities in
 * src/lib/visualizer/stepRunner.js
 *
 * NOTE: generateSteps expects algorithmFn to be a PLAIN function (not a generator)
 * that returns an array of child states.
 *
 * Run with: node --experimental-detect-module --test security-tests/stepRunner.test.cjs
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const {
  generateSteps,
  buildStepRunner,
  createSyncStepRunner,
} = require(path.resolve(__dirname, "../src/lib/visualizer/stepRunner.js"));

// ─── generateSteps ─────────────────────────────────────────────────────────────
// algorithmFn must be a plain function (not generator) returning an array.

test("generateSteps: collects all steps from a tree-walking algorithm", async () => {
  // Plain function: return array of children
  function treeWalker(state) {
    if (state.value > 3) return [];
    return state.children;
  }

  const input = { value: 1, children: [{ value: 2, children: [] }, { value: 3, children: [] }] };
  const gen = generateSteps(treeWalker, input);
  const steps = [];
  for await (const step of gen) steps.push(step);

  // Root (value 1) yields its children: {value:2}, {value:3}
  // Those children yield [] → no further steps
  assert.strictEqual(steps.length, 2, "should yield 2 steps (the two children of root)");
  assert.strictEqual(steps[0].value, 2);
  assert.strictEqual(steps[1].value, 3);
});

test("generateSteps: empty children yields no steps", async () => {
  function leaf(state) { return []; }
  const gen = generateSteps(leaf, { value: 1 });
  const steps = [];
  for await (const step of gen) steps.push(step);
  assert.strictEqual(steps.length, 0, "leaf with no children yields no steps");
});

test("generateSteps: handles multi-level tree", async () => {
  function treeFn(state) {
    if (state.level >= 2) return [];
    return [{ level: state.level + 1 }];
  }

  const gen = generateSteps(treeFn, { level: 0 });
  const steps = [];
  for await (const step of gen) steps.push(step);

  // Level 0 → [level 1], Level 1 → [level 2] (stop)
  assert.strictEqual(steps.length, 2, "should yield 2 steps (root + child)");
  assert.strictEqual(steps[0].level, 1);
  assert.strictEqual(steps[1].level, 2);
});

test("generateSteps: each yielded step is queued for further expansion", async () => {
  // Binary tree: each node yields two children
  function binaryExpand(state) {
    if (state.n <= 0) return [];
    return [{ n: state.n - 1 }, { n: state.n - 1 }];
  }

  const gen = generateSteps(binaryExpand, { n: 2 });
  const steps = [];
  for await (const step of gen) steps.push(step);

  // n=2 yields two n=1 nodes; each n=1 yields two n=0 nodes (stop)
  // Steps: n=1a, n=1b, n=0, n=0, n=0, n=0 = 6 steps
  assert.strictEqual(steps.length, 6, "should yield 6 total steps in binary expansion");
});

// ─── buildStepRunner ────────────────────────────────────────────────────────────

test("buildStepRunner: returns a function that collects all steps", async () => {
  function simpleFn(state) { return [{ processed: true }]; }

  const runner = buildStepRunner(simpleFn({ data: 42 }));
  const result = await runner();
  assert.ok(Array.isArray(result), "should return an array");
  assert.strictEqual(result[0].processed, true);
});

// ─── createSyncStepRunner ──────────────────────────────────────────────────────

test("createSyncStepRunner: collects steps synchronously", () => {
  function counterFn(input) {
    const result = [];
    for (let i = 0; i < input.count; i++) result.push({ i });
    return result;
  }

  const runner = createSyncStepRunner(counterFn);
  const steps = runner({ count: 3 });

  assert.strictEqual(steps.length, 3, "should collect 3 steps");
  assert.strictEqual(steps[0].i, 0);
  assert.strictEqual(steps[1].i, 1);
  assert.strictEqual(steps[2].i, 2);
});

test("createSyncStepRunner: handles zero-count input", () => {
  function genFn(input) {
    const result = [];
    for (let i = 0; i < input.count; i++) result.push({ i });
    return result;
  }

  const runner = createSyncStepRunner(genFn);
  const steps = runner({ count: 0 });
  assert.strictEqual(steps.length, 0, "should yield no steps for count=0");
});

test("createSyncStepRunner: each step is independent object", () => {
  function genFn(input) {
    const result = [];
    for (let i = 0; i < input.count; i++) result.push({ i });
    return result;
  }

  const runner = createSyncStepRunner(genFn);
  const steps = runner({ count: 2 });
  assert.ok(steps[0] !== steps[1], "each step should be a separate object");
});

test("createSyncStepRunner: returns direct children of input", () => {
  function directChildren(state) { return [{x: 2}, {x: 3}]; }

  const runner = createSyncStepRunner(directChildren);
  const steps = runner({x: 1});
  assert.strictEqual(steps.length, 2, "should yield 2 direct children");
  assert.strictEqual(steps[0].x, 2);
  assert.strictEqual(steps[1].x, 3);
});
