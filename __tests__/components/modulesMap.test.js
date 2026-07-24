// __tests__/components/modulesMap.test.js
//
// Run with:  npx jest __tests__/components/modulesMap.test.js --colors=false

import { MODULE_MAPS } from "../../src/lib/modulesMap.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(value) {
  return UUID_REGEX.test(value);
}

describe("MODULE_MAPS", () => {
  test("is a plain object", () => {
    expect(typeof MODULE_MAPS).toBe("object");
    expect(Array.isArray(MODULE_MAPS)).toBe(false);
  });

  test("has expected algorithm categories as keys", () => {
    expect(MODULE_MAPS).toHaveProperty("linearSearch");
    expect(MODULE_MAPS).toHaveProperty("binarySearch");
    expect(MODULE_MAPS).toHaveProperty("bubbleSort");
    expect(MODULE_MAPS).toHaveProperty("mergeSort");
    expect(MODULE_MAPS).toHaveProperty("quickSort");
    expect(MODULE_MAPS).toHaveProperty("recursionFibonacci");
    expect(MODULE_MAPS).toHaveProperty("recursionFactorial");
    expect(MODULE_MAPS).toHaveProperty("trie");
    expect(MODULE_MAPS).toHaveProperty("redBlackTree");
    expect(MODULE_MAPS).toHaveProperty("heapSort");
  });

  test("all values are non-empty strings", () => {
    Object.entries(MODULE_MAPS).forEach(([key, value]) => {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    });
  });

  test("all keys are non-empty strings", () => {
    Object.keys(MODULE_MAPS).forEach((key) => {
      expect(typeof key).toBe("string");
      expect(key.length).toBeGreaterThan(0);
    });
  });

  test("UUID-formatted values match the UUID pattern", () => {
    Object.entries(MODULE_MAPS)
      .filter(([, v]) => isUUID(v))
      .forEach(([key, value]) => {
        expect(value).toMatch(UUID_REGEX);
      });
  });

  test("known algorithm names map to correct UUIDs", () => {
    expect(MODULE_MAPS.linearSearch).toBe("378adcd8-7356-4d10-84cf-1dad1cbd496a");
    expect(MODULE_MAPS.binarySearch).toBe("e527f92a-7962-4b0b-a46a-52ecf08a73ef");
    expect(MODULE_MAPS.bubbleSort).toBe("b1387e6d-ebf8-4b52-9c5d-ab8c94f8eda4");
    expect(MODULE_MAPS.insertionSort).toBe("f8ae92e2-1371-4852-a615-0354011f8f48");
    expect(MODULE_MAPS.selectionSort).toBe("7dffce41-ff4c-4700-8cfe-04b8793cc25c");
  });

  test("no duplicate values exist", () => {
    const values = Object.values(MODULE_MAPS);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  test("slug-style values are lowercase alphanumeric with hyphens", () => {
    Object.entries(MODULE_MAPS)
      .filter(([, v]) => v.includes("-") && !isUUID(v))
      .forEach(([key, value]) => {
        expect(value).toMatch(/^[a-z0-9-]+$/);
      });
  });
});
