// __tests__/components/sortingGenerators.test.js
//
// Run with:  npx jest __tests__/components/sortingGenerators.test.js --colors=false

import {
  bubbleSortGen,
  selectionSortGen,
  insertionSortGen,
  quickSortGen,
} from "../../src/utils/sortingGenerators.js";

function consume(gen) {
  return [...gen];
}

function arraySorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1] > arr[i]) return false;
  }
  return true;
}

function checkStepMeta(meta) {
  expect(typeof meta.array).toBe("object");
  expect(typeof meta.comparisons).toBe("number");
  expect(typeof meta.swaps).toBe("number");
  expect(typeof meta.currentIndices).toBe("object");
}

describe("bubbleSortGen", () => {
  test("yields steps and leaves array sorted at end", () => {
    const steps = consume(bubbleSortGen([5, 2, 8, 1, 9]));
    expect(steps.length).toBeGreaterThan(0);
    expect(arraySorted(steps.at(-1).array)).toBe(true);
  });

  test("yields step metadata on each step", () => {
    const steps = consume(bubbleSortGen([3, 1, 2]));
    steps.forEach((step) => checkStepMeta(step));
  });

  test("handles already-sorted array", () => {
    const steps = consume(bubbleSortGen([1, 2, 3]));
    expect(arraySorted(steps.at(-1).array)).toBe(true);
  });

  test("handles single-element array", () => {
    const steps = consume(bubbleSortGen([42]));
    // May yield 0 steps — verify either no steps or sorted result
    if (steps.length > 0) {
      expect(arraySorted(steps.at(-1).array)).toBe(true);
    }
  });

  test("handles empty array", () => {
    const steps = consume(bubbleSortGen([]));
    // May yield 0 steps — verify either no steps or empty result
    if (steps.length > 0) {
      expect(steps.at(-1).array).toEqual([]);
    }
  });

  test("handles duplicate elements", () => {
    const steps = consume(bubbleSortGen([3, 1, 3, 1]));
    expect(arraySorted(steps.at(-1).array)).toBe(true);
  });
});

describe("selectionSortGen", () => {
  test("yields steps and leaves array sorted at end", () => {
    const steps = consume(selectionSortGen([5, 2, 8, 1, 9]));
    expect(steps.length).toBeGreaterThan(0);
    expect(arraySorted(steps.at(-1).array)).toBe(true);
  });

  test("yields step metadata on each step", () => {
    const steps = consume(selectionSortGen([3, 1, 2]));
    steps.forEach((step) => checkStepMeta(step));
  });

  test("handles already-sorted array", () => {
    const steps = consume(selectionSortGen([1, 2, 3]));
    expect(arraySorted(steps.at(-1).array)).toBe(true);
  });

  test("handles single-element array", () => {
    const steps = consume(selectionSortGen([42]));
    if (steps.length > 0) {
      expect(arraySorted(steps.at(-1).array)).toBe(true);
    }
  });
});

describe("insertionSortGen", () => {
  test("yields steps and leaves array sorted at end", () => {
    const steps = consume(insertionSortGen([5, 2, 8, 1, 9]));
    expect(steps.length).toBeGreaterThan(0);
    expect(arraySorted(steps.at(-1).array)).toBe(true);
  });

  test("yields step metadata on each step", () => {
    const steps = consume(insertionSortGen([3, 1, 2]));
    steps.forEach((step) => checkStepMeta(step));
  });

  test("handles already-sorted array", () => {
    const steps = consume(insertionSortGen([1, 2, 3]));
    expect(arraySorted(steps.at(-1).array)).toBe(true);
  });

  test("handles single-element array", () => {
    const steps = consume(insertionSortGen([42]));
    if (steps.length > 0) {
      expect(arraySorted(steps.at(-1).array)).toBe(true);
    }
  });
});

describe("quickSortGen", () => {
  test("yields steps and leaves array sorted at end", () => {
    const steps = consume(quickSortGen([5, 2, 8, 1, 9]));
    expect(steps.length).toBeGreaterThan(0);
    expect(arraySorted(steps.at(-1).array)).toBe(true);
  });

  test("yields step metadata on each step", () => {
    const steps = consume(quickSortGen([3, 1, 2]));
    steps.forEach((step) => checkStepMeta(step));
  });

  test("handles already-sorted array", () => {
    const steps = consume(quickSortGen([1, 2, 3]));
    expect(arraySorted(steps.at(-1).array)).toBe(true);
  });

  test("handles single-element array", () => {
    const steps = consume(quickSortGen([42]));
    if (steps.length > 0) {
      expect(arraySorted(steps.at(-1).array)).toBe(true);
    }
  });
});
