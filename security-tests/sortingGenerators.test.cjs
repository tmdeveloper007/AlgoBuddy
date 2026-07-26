// security-tests/sortingGenerators.test.cjs
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

function* bubbleSortGen(arr) {
  let a = [...arr];
  let n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      yield { array: [...a], comparisons: 1, swaps: 0, currentIndices: { comparing: [j, j + 1] } };
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
        yield { array: [...a], comparisons: 0, swaps: 1, currentIndices: { swapping: [j, j + 1] } };
      }
    }
    if (!swapped) break;
  }
}

function* selectionSortGen(arr) {
  let a = [...arr];
  let n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < n; j++) {
      yield { array: [...a], comparisons: 1, swaps: 0, currentIndices: { comparing: [j], min: minIndex, active: i } };
      if (a[j] < a[minIndex]) {
        minIndex = j;
        yield { array: [...a], comparisons: 0, swaps: 0, currentIndices: { comparing: [j], min: minIndex, active: i } };
      }
    }
    if (minIndex !== i) {
      [a[i], a[minIndex]] = [a[minIndex], a[i]];
      yield { array: [...a], comparisons: 0, swaps: 1, currentIndices: { swapping: [i, minIndex], active: i } };
    }
  }
}

function* insertionSortGen(arr) {
  let a = [...arr];
  let n = a.length;
  for (let i = 1; i < n; i++) {
    let current = a[i];
    let j = i - 1;
    yield { array: [...a], comparisons: 0, swaps: 0, currentIndices: { key: i, comparing: [j] } };
    while (j >= 0 && a[j] > current) {
      yield { array: [...a], comparisons: 1, swaps: 0, currentIndices: { key: i, comparing: [j] } };
      a[j + 1] = a[j];
      yield { array: [...a], comparisons: 0, swaps: 1, currentIndices: { key: i, shifting: [j + 1] } };
      j--;
    }
    a[j + 1] = current;
    yield { array: [...a], comparisons: 0, swaps: 0, currentIndices: { key: j + 1 } };
  }
}

function* mergeSortGen(arr) {
  let a = [...arr];
  yield* msHelper(a, 0, a.length - 1);

  function* msHelper(a, l, r) {
    if (l >= r) return;
    let m = l + Math.floor((r - l) / 2);
    yield* msHelper(a, l, m);
    yield* msHelper(a, m + 1, r);
    yield* merge(a, l, m, r);
  }

  function* merge(a, l, m, r) {
    let L = a.slice(l, m + 1);
    let R = a.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < L.length && j < R.length) {
      yield { array: [...a], comparisons: 1, swaps: 0, currentIndices: { range: [l, r], comparing: [l + i, m + 1 + j] } };
      if (L[i] <= R[j]) { a[k] = L[i++]; } else { a[k] = R[j++]; }
      yield { array: [...a], comparisons: 0, swaps: 1, currentIndices: { range: [l, r], writing: [k] } };
      k++;
    }
    while (i < L.length) { a[k] = L[i++]; yield { array: [...a], comparisons: 0, swaps: 1, currentIndices: { range: [l, r], writing: [k] } }; k++; }
    while (j < R.length) { a[k] = R[j++]; yield { array: [...a], comparisons: 0, swaps: 1, currentIndices: { range: [l, r], writing: [k] } }; k++; }
  }
}

function* quickSortGen(arr) {
  let a = [...arr];
  yield* qsHelper(a, 0, a.length - 1);

  function* qsHelper(a, low, high) {
    if (low < high) {
      let piRef = { val: low };
      yield* partition(a, low, high, piRef);
      let pi = piRef.val;
      yield* qsHelper(a, low, pi - 1);
      yield* qsHelper(a, pi + 1, high);
    }
  }

  function* partition(a, low, high, piRef) {
    let pivot = a[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
      yield { array: [...a], comparisons: 1, swaps: 0, currentIndices: { pivot: high, comparing: [j], boundary: i } };
      if (a[j] < pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        yield { array: [...a], comparisons: 0, swaps: 1, currentIndices: { pivot: high, swapping: [i, j], boundary: i } };
      }
    }
    [a[i + 1], a[high]] = [a[high], a[i + 1]];
    yield { array: [...a], comparisons: 0, swaps: 1, currentIndices: { pivot: high, swapping: [i + 1, high], boundary: i } };
    piRef.val = i + 1;
  }
}

function* heapSortGen(arr) {
  const a = [...arr];
  const n = a.length;

  function* heapify(heapSize, root) {
    let largest = root;
    const left = 2 * root + 1;
    const right = 2 * root + 2;
    yield { array: [...a], comparisons: 0, swaps: 0, currentIndices: { active: root, heapSize } };
    if (left < heapSize) {
      yield { array: [...a], comparisons: 1, swaps: 0, currentIndices: { comparing: [largest, left], active: root, heapSize } };
      if (a[left] > a[largest]) largest = left;
    }
    if (right < heapSize) {
      yield { array: [...a], comparisons: 1, swaps: 0, currentIndices: { comparing: [largest, right], active: root, heapSize } };
      if (a[right] > a[largest]) largest = right;
    }
    if (largest !== root) {
      [a[root], a[largest]] = [a[largest], a[root]];
      yield { array: [...a], comparisons: 0, swaps: 1, currentIndices: { swapping: [root, largest], active: largest, heapSize } };
      yield* heapify(heapSize, largest);
    }
  }

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) yield* heapify(n, i);
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    yield { array: [...a], comparisons: 0, swaps: 1, currentIndices: { swapping: [0, end], heapSize: end, sortedStart: end } };
    yield* heapify(end, 0);
  }
}

function collectAllSteps(gen) {
  const steps = [];
  for (const step of gen) steps.push(step);
  return steps;
}

function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) if (arr[i] < arr[i - 1]) return false;
  return true;
}

describe("bubbleSortGen", () => {
  test("yields objects with correct shape", () => {
    const steps = collectAllSteps(bubbleSortGen([3, 1, 2]));
    assert.ok(steps.length > 0);
    assert.ok(Array.isArray(steps[0].array));
    assert.strictEqual(typeof steps[0].comparisons, "number");
    assert.strictEqual(typeof steps[0].swaps, "number");
  });
  test("produces a sorted array", () => {
    const steps = collectAllSteps(bubbleSortGen([5, 2, 8, 1, 9]));
    const last = steps[steps.length - 1];
    assert.strictEqual(isSorted(last.array), true);
  });
  test("handles already-sorted input", () => {
    const steps = collectAllSteps(bubbleSortGen([1, 2, 3]));
    const last = steps[steps.length - 1];
    assert.strictEqual(isSorted(last.array), true);
  });
  test("handles single-element input", () => {
    const steps = collectAllSteps(bubbleSortGen([42]));
    if (steps.length > 0) assert.deepStrictEqual(steps[steps.length - 1].array, [42]);
    else assert.ok(true);
  });
});

describe("selectionSortGen", () => {
  test("yields objects with correct shape", () => {
    const steps = collectAllSteps(selectionSortGen([3, 1, 2]));
    assert.ok(steps.length > 0);
    assert.ok(Array.isArray(steps[0].array));
    assert.strictEqual(typeof steps[0].comparisons, "number");
  });
  test("produces a sorted array", () => {
    const steps = collectAllSteps(selectionSortGen([5, 2, 8, 1, 9]));
    assert.strictEqual(isSorted(steps[steps.length - 1].array), true);
  });
  test("handles reverse-sorted input", () => {
    const steps = collectAllSteps(selectionSortGen([5, 4, 3, 2, 1]));
    assert.strictEqual(isSorted(steps[steps.length - 1].array), true);
  });
});

describe("insertionSortGen", () => {
  test("yields objects with correct shape", () => {
    const steps = collectAllSteps(insertionSortGen([3, 1, 2]));
    assert.ok(steps.length > 0);
    assert.ok(Array.isArray(steps[0].array));
    assert.strictEqual(typeof steps[0].comparisons, "number");
  });
  test("produces a sorted array", () => {
    const steps = collectAllSteps(insertionSortGen([5, 2, 8, 1, 9]));
    assert.strictEqual(isSorted(steps[steps.length - 1].array), true);
  });
  test("handles already-sorted input", () => {
    const steps = collectAllSteps(insertionSortGen([1, 2, 3]));
    assert.strictEqual(isSorted(steps[steps.length - 1].array), true);
  });
});

describe("mergeSortGen", () => {
  test("yields objects with correct shape", () => {
    const steps = collectAllSteps(mergeSortGen([3, 1, 2]));
    assert.ok(steps.length > 0);
    assert.ok(Array.isArray(steps[0].array));
    assert.strictEqual(typeof steps[0].comparisons, "number");
  });
  test("produces a sorted array", () => {
    const steps = collectAllSteps(mergeSortGen([5, 2, 8, 1, 9]));
    assert.strictEqual(isSorted(steps[steps.length - 1].array), true);
  });
  test("handles empty array", () => {
    const steps = collectAllSteps(mergeSortGen([]));
    if (steps.length > 0) assert.deepStrictEqual(steps[steps.length - 1].array, []);
    else assert.ok(true);
  });
  test("handles duplicate elements", () => {
    const steps = collectAllSteps(mergeSortGen([3, 1, 3, 1, 2]));
    assert.strictEqual(isSorted(steps[steps.length - 1].array), true);
  });
});

describe("quickSortGen", () => {
  test("yields objects with correct shape", () => {
    const steps = collectAllSteps(quickSortGen([3, 1, 2]));
    assert.ok(steps.length > 0);
    assert.ok(Array.isArray(steps[0].array));
    assert.strictEqual(typeof steps[0].comparisons, "number");
  });
  test("produces a sorted array", () => {
    const steps = collectAllSteps(quickSortGen([5, 2, 8, 1, 9]));
    assert.strictEqual(isSorted(steps[steps.length - 1].array), true);
  });
  test("handles single-element input", () => {
    const steps = collectAllSteps(quickSortGen([42]));
    if (steps.length > 0) assert.deepStrictEqual(steps[steps.length - 1].array, [42]);
    else assert.ok(true);
  });
});

describe("heapSortGen", () => {
  test("yields objects with correct shape", () => {
    const steps = collectAllSteps(heapSortGen([3, 1, 2]));
    assert.ok(steps.length > 0);
    assert.ok(Array.isArray(steps[0].array));
    assert.strictEqual(typeof steps[0].comparisons, "number");
  });
  test("produces a sorted array", () => {
    const steps = collectAllSteps(heapSortGen([5, 2, 8, 1, 9]));
    assert.strictEqual(isSorted(steps[steps.length - 1].array), true);
  });
  test("handles reverse-sorted input", () => {
    const steps = collectAllSteps(heapSortGen([5, 4, 3, 2, 1]));
    assert.strictEqual(isSorted(steps[steps.length - 1].array), true);
  });
  test("handles duplicate elements", () => {
    const steps = collectAllSteps(heapSortGen([3, 3, 1, 1, 2, 2]));
    assert.strictEqual(isSorted(steps[steps.length - 1].array), true);
  });
});
