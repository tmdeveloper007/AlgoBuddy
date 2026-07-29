// security-tests/stepRunner.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/stepRunner.test.cjs
//
// Tests utility functions in src/lib/visualizer/stepRunner.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// ── Inlined source from src/lib/visualizer/stepRunner.js ─────────────

const ALGORITHMS = new Map();

function registerAlgorithm(name, fn) {
  ALGORITHMS.set(name, fn);
}

async function* generateSteps(algorithmFn, input) {
  const queue = [input];
  while (queue.length > 0) {
    const state = queue.shift();
    const nextStates = algorithmFn(state);
    for (const next of nextStates) {
      yield next;
      queue.push(next);
    }
  }
}

function buildStepRunner(stepGenerator) {
  return async () => {
    const steps = [];
    for await (const step of stepGenerator) {
      steps.push(step);
    }
    return steps;
  };
}

function createSyncStepRunner(generatorFn) {
  return (input) => {
    const steps = [];
    const gen = generatorFn(input);
    for (const step of gen) {
      steps.push(step);
    }
    return steps;
  };
}

// ── Tests ────────────────────────────────────────────────────────────

describe("registerAlgorithm", () => {
  test("stores the algorithm function under the given name", () => {
    ALGORITHMS.clear();
    const fn = (x) => [x + 1];
    registerAlgorithm("incr", fn);
    assert.strictEqual(ALGORITHMS.get("incr"), fn);
  });

  test("overwrites a previously registered algorithm with the same name", () => {
    ALGORITHMS.clear();
    const fn1 = (x) => [x + 1];
    const fn2 = (x) => [x * 2];
    registerAlgorithm("doubler", fn1);
    registerAlgorithm("doubler", fn2);
    assert.strictEqual(ALGORITHMS.get("doubler"), fn2);
  });

  test("allows multiple algorithms with different names", () => {
    ALGORITHMS.clear();
    const fn1 = () => [];
    const fn2 = () => [];
    registerAlgorithm("a", fn1);
    registerAlgorithm("b", fn2);
    assert.strictEqual(ALGORITHMS.size, 2);
  });
});

describe("generateSteps", () => {
  test("yields nothing when algorithm returns an empty next-states array", async () => {
    ALGORITHMS.clear();
    const fn = () => [];
    const steps = [];
    for await (const step of generateSteps(fn, { value: 1 })) {
      steps.push(step);
    }
    // The initial state is queued but not yielded; only algorithm-returned states are yielded.
    assert.deepStrictEqual(steps, []);
  });

  test("yields the next states returned by the algorithm function", async () => {
    ALGORITHMS.clear();
    // State -> array of next states
    const fn = (state) => {
      if (state.n === 0) return [{ n: 1 }, { n: 2 }];
      return [];
    };
    const steps = [];
    for await (const step of generateSteps(fn, { n: 0 })) {
      steps.push(step);
    }
    assert.deepStrictEqual(steps, [{ n: 1 }, { n: 2 }]);
  });

  test("does a breadth-first traversal — yields next states level by level", async () => {
    // BFS means level 0 -> all level 1 -> all level 2, etc.
    const fn = (state) => {
      if (state.level < 2) return [{ level: state.level + 1 }];
      return [];
    };
    const steps = [];
    for await (const step of generateSteps(fn, { level: 0 })) {
      steps.push(step);
    }
    assert.deepStrictEqual(steps, [{ level: 1 }, { level: 2 }]);
  });

  test("handles a generator function that returns an empty array (leaf node)", async () => {
    const fn = () => [];
    const steps = [];
    for await (const step of generateSteps(fn, { id: 1 })) {
      steps.push(step);
    }
    assert.deepStrictEqual(steps, []);
  });
});

describe("buildStepRunner", () => {
  test("collects all steps from an async generator into an array", async () => {
    async function* simpleGen() {
      yield { step: 1 };
      yield { step: 2 };
      yield { step: 3 };
    }
    const run = buildStepRunner(simpleGen());
    const result = await run();
    assert.deepStrictEqual(result, [{ step: 1 }, { step: 2 }, { step: 3 }]);
  });

  test("returns empty array for an empty generator", async () => {
    async function* emptyGen() {}
    const run = buildStepRunner(emptyGen());
    const result = await run();
    assert.deepStrictEqual(result, []);
  });
});

describe("createSyncStepRunner", () => {
  test("collects all steps yielded by the generator function into an array", () => {
    function* simpleGen(input) {
      yield { input, step: 1 };
      yield { input, step: 2 };
    }
    const run = createSyncStepRunner(simpleGen);
    // shorthand { input } is equivalent to { input: input }
    const result = run({ value: 42 });
    assert.deepStrictEqual(result, [
      { input: { value: 42 }, step: 1 },
      { input: { value: 42 }, step: 2 },
    ]);
  });

  test("returns empty array when generator yields nothing", () => {
    function* emptyGen(input) {
      // yields nothing — generator completes immediately
      return;
    }
    const run = createSyncStepRunner(emptyGen);
    const result = run({});
    assert.deepStrictEqual(result, []);
  });

  test("passes input through to the generator function", () => {
    function* passThru(input) {
      yield input;
    }
    const run = createSyncStepRunner(passThru);
    const input = { arr: [1, 2, 3], meta: "data" };
    const result = run(input);
    assert.deepStrictEqual(result, [input]);
  });

  test("handles numeric state values from generator", () => {
    function* countGen(start) {
      let current = start;
      yield { value: current };
      current += 1;
      yield { value: current };
    }
    const run = createSyncStepRunner(countGen);
    const result = run(0);
    assert.deepStrictEqual(result, [{ value: 0 }, { value: 1 }]);
  });
});
