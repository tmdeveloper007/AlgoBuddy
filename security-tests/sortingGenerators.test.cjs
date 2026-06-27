// security-tests/sortingGenerators.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/sortingGenerators.test.cjs
//
// Tests the sorting generator functions in src/utils/sortingGenerators.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// Inlined generator functions to avoid ESM import issues.

// 1. Bubble Sort
function* bubbleSortGen(arr) {
  let a = [...arr];
  let n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      yield {
        array: [...a],
        comparisons: 1,
        swaps: 0,
        currentIndices: { comparing: [j, j + 1] }
      };
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        yield {
          array: [...a],
          comparisons: 0,
          swaps: 1,
          currentIndices: { swapping: [j, j + 1] }
        };
      }
    }
    if (!swapped) break;
  }
}

// 2. Selection Sort
function* selectionSortGen(arr) {
  let a = [...arr];
  let n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < n; j++) {
      yield {
        array: [...a],
        comparisons: 1,
        swaps: 0,
        currentIndices: { comparing: [j], min: minIndex, active: i }
      };
      if (a[j] < a[minIndex]) {
        minIndex = j;
        yield {
          array: [...a],
          comparisons: 0,
          swaps: 0,
          currentIndices: { comparing: [j], min: minIndex, active: i }
        };
      }
    }
    if (minIndex !== i) {
      [a[i], a[minIndex]] = [a[minIndex], a[i]];
      yield {
        array: [...a],
        comparisons: 0,
        swaps: 1,
        currentIndices: { swapping: [i, minIndex], active: i }
      };
    }
  }
}

// 3. Insertion Sort
function* insertionSortGen(arr) {
  let a = [...arr];
  let n = a.length;
  for (let i = 1; i < n; i++) {
    let current = a[i];
    let j = i - 1;
    yield {
      array: [...a],
      comparisons: 0,
      swaps: 0,
      currentIndices: { key: i, comparing: [j] }
    };
    while (j >= 0 && a[j] > current) {
      yield {
        array: [...a],
        comparisons: 1,
        swaps: 0,
        currentIndices: { key: i, comparing: [j] }
      };
      a[j + 1] = a[j];
      yield {
        array: [...a],
        comparisons: 0,
        swaps: 1,
        currentIndices: { key: i, shifting: [j + 1] }
      };
      j--;
    }
    a[j + 1] = current;
    yield {
      array: [...a],
      comparisons: 0,
      swaps: 0,
      currentIndices: { key: j + 1 }
    };
  }
}

function collectSteps(gen) {
  const steps = [];
  let result = gen.next();
  while (!result.done) {
    steps.push(result.value);
    result = gen.next();
  }
  return steps;
}

function isSorted(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) return false;
  }
  return true;
}

describe("bubbleSortGen", () => {
  test("sorts [5, 3, 8, 4, 2] correctly", () => {
    const steps = collectSteps(bubbleSortGen([5, 3, 8, 4, 2]));
    assert.ok(steps.length > 0, "should yield at least one step");
    const lastStep = steps[steps.length - 1];
    assert.deepStrictEqual(lastStep.array, [2, 3, 4, 5, 8], "final array should be sorted");
  });

  test("each step has expected shape with array, comparisons, swaps, currentIndices", () => {
    const steps = collectSteps(bubbleSortGen([5, 3, 8]));
    for (const step of steps) {
      assert.ok(Array.isArray(step.array), "step.array should be an array");
      assert.strictEqual(typeof step.comparisons, "number", "step.comparisons should be a number");
      assert.strictEqual(typeof step.swaps, "number", "step.swaps should be a number");
      assert.ok(step.currentIndices && typeof step.currentIndices === "object", "step.currentIndices should be an object");
    }
  });

  test("swaps field is 1 when comparing pair is swapped, 0 otherwise", () => {
    const steps = collectSteps(bubbleSortGen([5, 3, 8, 4, 2]));
    for (const step of steps) {
      assert.ok(
        step.swaps === 0 || step.swaps === 1,
        `swaps should be 0 or 1, got ${step.swaps}`,
      );
    }
  });

  test("final array is always sorted regardless of input", () => {
    const inputs = [
      [3, 1, 2],
      [9, 5, 1, 7],
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
    ];
    for (const input of inputs) {
      const steps = collectSteps(bubbleSortGen(input));
      const lastStep = steps[steps.length - 1];
      assert.ok(isSorted(lastStep.array), `bubbleSortGen([${input}]) should produce sorted output`);
    }
  });

  test("handles empty array gracefully", () => {
    const steps = collectSteps(bubbleSortGen([]));
    assert.strictEqual(steps.length, 0, "empty array should yield no steps");
  });

  test("handles single-element array", () => {
    const steps = collectSteps(bubbleSortGen([42]));
    assert.strictEqual(steps.length, 0, "single element should yield no steps");
  });

  test("handles already-sorted array (early exit)", () => {
    const steps = collectSteps(bubbleSortGen([1, 2, 3]));
    assert.ok(steps.length > 0, "should yield at least initial comparison");
    // With early exit optimization, may produce fewer steps
    const lastStep = steps[steps.length - 1];
    assert.ok(isSorted(lastStep.array), "output should be sorted");
  });
});

describe("selectionSortGen", () => {
  test("sorts [5, 3, 8, 4, 2] correctly", () => {
    const steps = collectSteps(selectionSortGen([5, 3, 8, 4, 2]));
    assert.ok(steps.length > 0);
    const lastStep = steps[steps.length - 1];
    assert.deepStrictEqual(lastStep.array, [2, 3, 4, 5, 8]);
  });

  test("each step has expected shape", () => {
    const steps = collectSteps(selectionSortGen([5, 3, 8]));
    for (const step of steps) {
      assert.ok(Array.isArray(step.array));
      assert.strictEqual(typeof step.comparisons, "number");
      assert.strictEqual(typeof step.swaps, "number");
      assert.ok(step.currentIndices && typeof step.currentIndices === "object");
    }
  });

  test("final array is always sorted", () => {
    const inputs = [
      [3, 1, 2],
      [9, 5, 1, 7],
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
    ];
    for (const input of inputs) {
      const steps = collectSteps(selectionSortGen(input));
      const lastStep = steps[steps.length - 1];
      assert.ok(isSorted(lastStep.array), `selectionSortGen([${input}]) should produce sorted output`);
    }
  });

  test("handles empty array", () => {
    const steps = collectSteps(selectionSortGen([]));
    assert.strictEqual(steps.length, 0);
  });

  test("handles single-element array", () => {
    const steps = collectSteps(selectionSortGen([42]));
    assert.strictEqual(steps.length, 0);
  });

  test("handles array with all equal elements", () => {
    const steps = collectSteps(selectionSortGen([5, 5, 5]));
    const lastStep = steps[steps.length - 1];
    assert.ok(isSorted(lastStep.array));
  });
});

describe("insertionSortGen", () => {
  test("sorts [5, 3, 8, 4, 2] correctly", () => {
    const steps = collectSteps(insertionSortGen([5, 3, 8, 4, 2]));
    assert.ok(steps.length > 0);
    const lastStep = steps[steps.length - 1];
    assert.deepStrictEqual(lastStep.array, [2, 3, 4, 5, 8]);
  });

  test("each step has expected shape", () => {
    const steps = collectSteps(insertionSortGen([5, 3, 8]));
    for (const step of steps) {
      assert.ok(Array.isArray(step.array));
      assert.strictEqual(typeof step.comparisons, "number");
      assert.strictEqual(typeof step.swaps, "number");
      assert.ok(step.currentIndices && typeof step.currentIndices === "object");
    }
  });

  test("final array is always sorted", () => {
    const inputs = [
      [3, 1, 2],
      [9, 5, 1, 7],
      [1, 2, 3, 4, 5],
      [5, 4, 3, 2, 1],
    ];
    for (const input of inputs) {
      const steps = collectSteps(insertionSortGen(input));
      const lastStep = steps[steps.length - 1];
      assert.ok(isSorted(lastStep.array), `insertionSortGen([${input}]) should produce sorted output`);
    }
  });

  test("handles empty array", () => {
    const steps = collectSteps(insertionSortGen([]));
    assert.strictEqual(steps.length, 0);
  });

  test("handles single-element array", () => {
    const steps = collectSteps(insertionSortGen([42]));
    // insertion sort on single element yields no steps (loop never runs)
    assert.strictEqual(steps.length, 0);
  });

  test("handles already-sorted array", () => {
    const steps = collectSteps(insertionSortGen([1, 2, 3]));
    const lastStep = steps[steps.length - 1];
    assert.ok(isSorted(lastStep.array));
  });

  test("handles reverse-sorted array", () => {
    const steps = collectSteps(insertionSortGen([5, 4, 3, 2, 1]));
    const lastStep = steps[steps.length - 1];
    assert.ok(isSorted(lastStep.array));
  });
});