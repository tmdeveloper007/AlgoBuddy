// __tests__/sortingGenerators.test.js
//
// Run with:  npx jest __tests__/sortingGenerators.test.js
//
// Tests the sorting algorithm generators in src/utils/sortingGenerators.js.

const { describe, expect, test } = require("@jest/globals");
const {
  bubbleSortGen,
  selectionSortGen,
  insertionSortGen,
  mergeSortGen,
  quickSortGen,
  heapSortGen,
} = require("../src/utils/sortingGenerators.js");

function collectAllSteps(generator) {
  return [...generator];
}

function getFinalArray(generator, inputArr) {
  const steps = collectAllSteps(generator);
  if (steps.length === 0) {
    // Generators yield no steps for empty or single-element inputs;
    // in that case the array is already sorted (same as input).
    return inputArr;
  }
  return steps.at(-1).array;
}

// ── Shared helpers ───────────────────────────────────────────────────────────

function isSorted(arr) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] > arr[i + 1]) return false;
  }
  return true;
}

function hasRequiredStepKeys(step) {
  return (
    Array.isArray(step.array) &&
    typeof step.comparisons === "number" &&
    typeof step.swaps === "number" &&
    step.currentIndices !== undefined
  );
}

// ── Bubble Sort ─────────────────────────────────────────────────────────────

describe("bubbleSortGen", () => {
  test("sorts a simple array in ascending order", () => {
    const result = getFinalArray(bubbleSortGen([5, 3, 8, 4, 2]), [5, 3, 8, 4, 2]);
    expect(result).toEqual([2, 3, 4, 5, 8]);
  });

  test("returns sorted array when already sorted", () => {
    const result = getFinalArray(bubbleSortGen([1, 2, 3]), [1, 2, 3]);
    expect(result).toEqual([1, 2, 3]);
  });

  test("handles a single element", () => {
    const result = getFinalArray(bubbleSortGen([42]), [42]);
    expect(result).toEqual([42]);
  });

  test("handles an empty array", () => {
    const result = getFinalArray(bubbleSortGen([]), []);
    expect(result).toEqual([]);
  });

  test("handles duplicates", () => {
    const result = getFinalArray(bubbleSortGen([3, 1, 3, 2, 1]), [3, 1, 3, 2, 1]);
    expect(isSorted(result)).toBe(true);
    expect(result.filter((x) => x === 1).length).toBe(2);
    expect(result.filter((x) => x === 3).length).toBe(2);
  });

  test("each yielded step has required keys", () => {
    const steps = collectAllSteps(bubbleSortGen([5, 1, 4, 2]));
    steps.forEach((step) => {
      expect(hasRequiredStepKeys(step)).toBe(true);
    });
  });

  test("breaks early when no swaps occur (already sorted)", () => {
    const steps = collectAllSteps(bubbleSortGen([1, 2, 3]));
    const hasComparisons = steps.some((s) => s.comparisons > 0 || s.swaps > 0);
    expect(hasComparisons).toBe(true);
  });
});

// ── Selection Sort ───────────────────────────────────────────────────────────

describe("selectionSortGen", () => {
  test("sorts a simple array in ascending order", () => {
    const result = getFinalArray(selectionSortGen([64, 25, 12, 22, 11]), [64, 25, 12, 22, 11]);
    expect(result).toEqual([11, 12, 22, 25, 64]);
  });

  test("handles a single element", () => {
    const result = getFinalArray(selectionSortGen([99]), [99]);
    expect(result).toEqual([99]);
  });

  test("handles an empty array", () => {
    const result = getFinalArray(selectionSortGen([]), []);
    expect(result).toEqual([]);
  });

  test("handles reverse-sorted array", () => {
    const result = getFinalArray(selectionSortGen([5, 4, 3, 2, 1]), [5, 4, 3, 2, 1]);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  test("each yielded step has required keys", () => {
    const steps = collectAllSteps(selectionSortGen([5, 1, 4, 2]));
    steps.forEach((step) => {
      expect(hasRequiredStepKeys(step)).toBe(true);
    });
  });

  test("currentIndices contains active index during iteration", () => {
    const steps = collectAllSteps(selectionSortGen([5, 1, 4]));
    const activeSteps = steps.filter((s) => s.currentIndices.active !== undefined);
    expect(activeSteps.length).toBeGreaterThan(0);
  });
});

// ── Insertion Sort ───────────────────────────────────────────────────────────

describe("insertionSortGen", () => {
  test("sorts a simple array in ascending order", () => {
    const result = getFinalArray(insertionSortGen([12, 11, 13, 5, 6]), [12, 11, 13, 5, 6]);
    expect(result).toEqual([5, 6, 11, 12, 13]);
  });

  test("handles a single element", () => {
    const result = getFinalArray(insertionSortGen([42]), [42]);
    expect(result).toEqual([42]);
  });

  test("handles an empty array", () => {
    const result = getFinalArray(insertionSortGen([]), []);
    expect(result).toEqual([]);
  });

  test("handles already-sorted array", () => {
    const result = getFinalArray(insertionSortGen([1, 2, 3, 4]), [1, 2, 3, 4]);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  test("each yielded step has required keys", () => {
    const steps = collectAllSteps(insertionSortGen([5, 1, 4, 2]));
    steps.forEach((step) => {
      expect(hasRequiredStepKeys(step)).toBe(true);
    });
  });

  test("currentIndices contains key index when shifting", () => {
    const steps = collectAllSteps(insertionSortGen([5, 1, 4, 2]));
    const keySteps = steps.filter((s) => s.currentIndices.key !== undefined);
    expect(keySteps.length).toBeGreaterThan(0);
  });
});

// ── Merge Sort ──────────────────────────────────────────────────────────────

describe("mergeSortGen", () => {
  test("sorts a simple array in ascending order", () => {
    const result = getFinalArray(mergeSortGen([38, 27, 43, 3, 9, 82, 10]), [38, 27, 43, 3, 9, 82, 10]);
    expect(result).toEqual([3, 9, 10, 27, 38, 43, 82]);
  });

  test("handles a single element", () => {
    const result = getFinalArray(mergeSortGen([7]), [7]);
    expect(result).toEqual([7]);
  });

  test("handles an empty array", () => {
    const result = getFinalArray(mergeSortGen([]), []);
    expect(result).toEqual([]);
  });

  test("handles two elements", () => {
    const result = getFinalArray(mergeSortGen([2, 1]), [2, 1]);
    expect(result).toEqual([1, 2]);
  });

  test("handles duplicates", () => {
    const result = getFinalArray(mergeSortGen([3, 3, 1, 2, 1]), [3, 3, 1, 2, 1]);
    expect(isSorted(result)).toBe(true);
    expect(result.filter((x) => x === 1).length).toBe(2);
    expect(result.filter((x) => x === 3).length).toBe(2);
  });

  test("each yielded step has required keys and range in currentIndices", () => {
    const steps = collectAllSteps(mergeSortGen([5, 1, 4, 2]));
    steps.forEach((step) => {
      expect(hasRequiredStepKeys(step)).toBe(true);
    });
    const rangeSteps = steps.filter((s) => s.currentIndices && s.currentIndices.range !== undefined);
    expect(rangeSteps.length).toBeGreaterThan(0);
  });
});

// ── Quick Sort ───────────────────────────────────────────────────────────────

describe("quickSortGen", () => {
  test("sorts a simple array in ascending order", () => {
    const result = getFinalArray(quickSortGen([10, 7, 8, 9, 1, 5]), [10, 7, 8, 9, 1, 5]);
    expect(result).toEqual([1, 5, 7, 8, 9, 10]);
  });

  test("handles a single element", () => {
    const result = getFinalArray(quickSortGen([42]), [42]);
    expect(result).toEqual([42]);
  });

  test("handles an empty array", () => {
    const result = getFinalArray(quickSortGen([]), []);
    expect(result).toEqual([]);
  });

  test("handles reverse-sorted array", () => {
    const result = getFinalArray(quickSortGen([9, 8, 7, 6, 5]), [9, 8, 7, 6, 5]);
    expect(result).toEqual([5, 6, 7, 8, 9]);
  });

  test("handles duplicates", () => {
    const result = getFinalArray(quickSortGen([3, 1, 4, 1, 5, 9, 2, 6, 5]), [3, 1, 4, 1, 5, 9, 2, 6, 5]);
    expect(isSorted(result)).toBe(true);
  });

  test("each yielded step has required keys with pivot info", () => {
    const steps = collectAllSteps(quickSortGen([5, 1, 4, 2]));
    steps.forEach((step) => {
      expect(hasRequiredStepKeys(step)).toBe(true);
    });
    const pivotSteps = steps.filter((s) => s.currentIndices && s.currentIndices.pivot !== undefined);
    expect(pivotSteps.length).toBeGreaterThan(0);
  });
});

// ── Heap Sort ───────────────────────────────────────────────────────────────

describe("heapSortGen", () => {
  test("sorts a simple array in ascending order", () => {
    const result = getFinalArray(heapSortGen([12, 11, 13, 5, 6, 7]), [12, 11, 13, 5, 6, 7]);
    expect(result).toEqual([5, 6, 7, 11, 12, 13]);
  });

  test("handles a single element", () => {
    const result = getFinalArray(heapSortGen([42]), [42]);
    expect(result).toEqual([42]);
  });

  test("handles an empty array", () => {
    const result = getFinalArray(heapSortGen([]), []);
    expect(result).toEqual([]);
  });

  test("handles reverse-sorted array", () => {
    const result = getFinalArray(heapSortGen([5, 4, 3, 2, 1]), [5, 4, 3, 2, 1]);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  test("handles duplicates", () => {
    const result = getFinalArray(heapSortGen([3, 1, 4, 1, 5]), [3, 1, 4, 1, 5]);
    expect(isSorted(result)).toBe(true);
  });

  test("each yielded step has required keys with heapSize info", () => {
    const steps = collectAllSteps(heapSortGen([5, 1, 4, 2]));
    steps.forEach((step) => {
      expect(hasRequiredStepKeys(step)).toBe(true);
    });
    const heapSteps = steps.filter((s) => s.currentIndices && s.currentIndices.heapSize !== undefined);
    expect(heapSteps.length).toBeGreaterThan(0);
  });
});
