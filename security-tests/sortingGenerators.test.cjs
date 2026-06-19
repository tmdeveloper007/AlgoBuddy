// security-tests/sortingGenerators.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/sortingGenerators.test.cjs
//
// Tests sorting algorithm generators in src/utils/sortingGenerators.js.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  bubbleSortGen,
  selectionSortGen,
  insertionSortGen,
  mergeSortGen,
  quickSortGen,
  heapSortGen,
} = require('../src/utils/sortingGenerators.js');

// Helper: collect all generator steps into an array
function collectSteps(gen) {
  const steps = [];
  let result;
  while (!(result = gen.next()).done) {
    steps.push(result.value);
  }
  return steps;
}

// Helper: check a step has the required shape
function assertStepShape(step) {
  assert.ok(step, 'step is not null/undefined');
  assert.ok(Array.isArray(step.array), 'step.array must be an array');
  assert.strictEqual(typeof step.comparisons, 'number', 'step.comparisons must be a number');
  assert.strictEqual(typeof step.swaps, 'number', 'step.swaps must be a number');
  assert.ok(typeof step.currentIndices === 'object' && step.currentIndices !== null,
    'step.currentIndices must be a non-null object');
}

// Helper: check array is sorted in ascending order
function assertSorted(arr) {
  for (let i = 1; i < arr.length; i++) {
    assert.ok(arr[i - 1] <= arr[i], `array not sorted: ${arr[i - 1]} > ${arr[i]} at index ${i}`);
  }
}

function runSortTests(name, genFn) {
  describe(name, () => {
    test('yields at least one step', () => {
      const steps = collectSteps(genFn([3, 1, 2]));
      assert.ok(steps.length >= 1, `expected at least 1 step, got ${steps.length}`);
    });

    test('each step has required shape', () => {
      const steps = collectSteps(genFn([3, 1, 2]));
      steps.forEach(assertStepShape);
    });

    test('final array is sorted ascending', () => {
      const steps = collectSteps(genFn([5, 4, 3, 2, 1]));
      const lastStep = steps[steps.length - 1];
      assertSorted(lastStep.array);
    });

    test('sorted input returns sorted output', () => {
      const steps = collectSteps(genFn([1, 2, 3]));
      const lastStep = steps[steps.length - 1];
      assertSorted(lastStep.array);
      assert.deepStrictEqual(lastStep.array, [1, 2, 3]);
    });

    test('reverse input returns sorted output', () => {
      const steps = collectSteps(genFn([5, 4, 3, 2, 1]));
      const lastStep = steps[steps.length - 1];
      assertSorted(lastStep.array);
    });

    test('comparisons and swaps are non-negative', () => {
      const steps = collectSteps(genFn([3, 1, 2]));
      steps.forEach(step => {
        assert.ok(step.comparisons >= 0, 'comparisons must be >= 0');
        assert.ok(step.swaps >= 0, 'swaps must be >= 0');
      });
    });

    test('empty array completes without error', () => {
      const steps = collectSteps(genFn([]));
      // Generators yield 0 steps for empty input — they short-circuit immediately
      assert.strictEqual(steps.length, 0);
    });

    test('single element completes without error', () => {
      const steps = collectSteps(genFn([42]));
      // Generators yield 0 steps for single-element input — nothing to sort
      assert.strictEqual(steps.length, 0);
    });

    test('duplicate values are handled without error', () => {
      const steps = collectSteps(genFn([3, 1, 3, 1]));
      const lastStep = steps[steps.length - 1];
      assertSorted(lastStep.array);
    });
  });
}

runSortTests('bubbleSortGen', bubbleSortGen);
runSortTests('selectionSortGen', selectionSortGen);
runSortTests('insertionSortGen', insertionSortGen);
runSortTests('mergeSortGen', mergeSortGen);
runSortTests('quickSortGen', quickSortGen);
runSortTests('heapSortGen', heapSortGen);