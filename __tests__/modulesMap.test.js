// __tests__/modulesMap.test.js
//
// Run with:  npx jest __tests__/modulesMap.test.js
//
// Tests the MODULE_MAPS data export in src/lib/modulesMap.js.
// Verifies that all expected algorithm and data-structure entries are present
// with correctly formatted UUIDs or kebab-case identifiers.

const { MODULE_MAPS } = require("../src/lib/modulesMap");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEBAB_REGEX = /^[a-z][a-z0-9-]*$/;
const ALPHANUM_REGEX = /^[a-z0-9][a-z0-9-]*$/;

function isValidModuleId(id) {
  return typeof id === "string" && id.length > 0;
}

describe("MODULE_MAPS", () => {
  test("is a non-null object", () => {
    expect(MODULE_MAPS).not.toBeNull();
    expect(typeof MODULE_MAPS).toBe("object");
  });

  test("has entries for all major algorithm categories", () => {
    // Search algorithms
    expect(MODULE_MAPS).toHaveProperty("linearSearch");
    expect(MODULE_MAPS).toHaveProperty("binarySearch");

    // Sorting algorithms
    expect(MODULE_MAPS).toHaveProperty("bubbleSort");
    expect(MODULE_MAPS).toHaveProperty("mergeSort");
    expect(MODULE_MAPS).toHaveProperty("quickSort");
    expect(MODULE_MAPS).toHaveProperty("insertionSort");
    expect(MODULE_MAPS).toHaveProperty("selectionSort");

    // Data structures
    expect(MODULE_MAPS).toHaveProperty("pushPop");
    expect(MODULE_MAPS).toHaveProperty("peek");
    expect(MODULE_MAPS).toHaveProperty("isEmpty");
    expect(MODULE_MAPS).toHaveProperty("enqueueDequeue");
    expect(MODULE_MAPS).toHaveProperty("queueArray");
    expect(MODULE_MAPS).toHaveProperty("stackArray");
    expect(MODULE_MAPS).toHaveProperty("trie");
    expect(MODULE_MAPS).toHaveProperty("redBlackTree");
    expect(MODULE_MAPS).toHaveProperty("bTree");
    expect(MODULE_MAPS).toHaveProperty("heapSort");

    // Advanced / graph
    expect(MODULE_MAPS).toHaveProperty("astar");
  });

  test("every value is a non-empty string", () => {
    for (const [key, value] of Object.entries(MODULE_MAPS)) {
      expect(typeof value).toBe("string", `Key "${key}" should have a string value`);
      expect(value.length).toBeGreaterThan(0, `Key "${key}" should not be an empty string`);
    }
  });

  test("every value is either a valid UUID, kebab-case identifier, or an alphanumeric ID", () => {
    for (const [key, value] of Object.entries(MODULE_MAPS)) {
      const isUuid = UUID_REGEX.test(value);
      const isKebab = KEBAB_REGEX.test(value);
      const isAlphanum = /^[a-z0-9][a-z0-9-]*$/.test(value);
      expect(isUuid || isKebab || isAlphanum).toBe(true, `Key "${key}" value "${value}" is not valid`);
    }
  });

  test("all values are unique (no duplicate module IDs)", () => {
    const values = Object.values(MODULE_MAPS);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  test("linearSearch and binarySearch have UUIDs", () => {
    expect(UUID_REGEX.test(MODULE_MAPS.linearSearch)).toBe(true);
    expect(UUID_REGEX.test(MODULE_MAPS.binarySearch)).toBe(true);
  });

  test("ternarySearch and jumpSearch use kebab-case identifiers", () => {
    expect(KEBAB_REGEX.test(MODULE_MAPS.ternarySearch)).toBe(true);
    expect(KEBAB_REGEX.test(MODULE_MAPS.jumpSearch)).toBe(true);
  });

  test("bubbleSort and mergeSort have UUIDs", () => {
    expect(UUID_REGEX.test(MODULE_MAPS.bubbleSort)).toBe(true);
    expect(UUID_REGEX.test(MODULE_MAPS.mergeSort)).toBe(true);
  });

  test("countingSort has a UUID format ID", () => {
    expect(UUID_REGEX.test(MODULE_MAPS.countingSort)).toBe(true);
  });

  test("bucketSort has a kebab-case or alphanumeric ID", () => {
    const val = MODULE_MAPS.bucketSort;
    expect(/^[a-z][a-z0-9-]*$/.test(val)).toBe(true);
  });

  test("pushPop and peek have UUIDs", () => {
    expect(UUID_REGEX.test(MODULE_MAPS.pushPop)).toBe(true);
    expect(UUID_REGEX.test(MODULE_MAPS.peek)).toBe(true);
  });

  test("isEmpty and isFull have UUIDs", () => {
    expect(UUID_REGEX.test(MODULE_MAPS.isEmpty)).toBe(true);
    expect(UUID_REGEX.test(MODULE_MAPS.isFull)).toBe(true);
  });

  test("stackArray and stackLinkedList have UUIDs", () => {
    expect(UUID_REGEX.test(MODULE_MAPS.stackArray)).toBe(true);
    expect(UUID_REGEX.test(MODULE_MAPS.stackLinkedList)).toBe(true);
  });

  test("queueArray and queueLinkedList have UUIDs", () => {
    expect(UUID_REGEX.test(MODULE_MAPS.queueArray)).toBe(true);
    expect(UUID_REGEX.test(MODULE_MAPS.queueLinkedList)).toBe(true);
  });

  test("recursion entries use UUID format", () => {
    expect(UUID_REGEX.test(MODULE_MAPS.recursionFactorial)).toBe(true);
    expect(UUID_REGEX.test(MODULE_MAPS.recursionFibonacci)).toBe(true);
    expect(UUID_REGEX.test(MODULE_MAPS.recursionHanoi)).toBe(true);
  });

  test("has entries for all recursion problems", () => {
    expect(MODULE_MAPS).toHaveProperty("recursionFactorial");
    expect(MODULE_MAPS).toHaveProperty("recursionFibonacci");
    expect(MODULE_MAPS).toHaveProperty("recursionHanoi");
    expect(MODULE_MAPS).toHaveProperty("recursionSum");
    expect(MODULE_MAPS).toHaveProperty("recursionReverseArray");
    expect(MODULE_MAPS).toHaveProperty("recursionPalindrome");
    expect(MODULE_MAPS).toHaveProperty("recursionBinarySearch");
    expect(MODULE_MAPS).toHaveProperty("recursionSubsequences");
    expect(MODULE_MAPS).toHaveProperty("recursionNQueens");
    expect(MODULE_MAPS).toHaveProperty("recursionPrint1ToN");
    expect(MODULE_MAPS).toHaveProperty("recursionPrintNTo1");
  });
});
