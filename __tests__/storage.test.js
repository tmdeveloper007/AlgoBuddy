// __tests__/storage.test.js
//
// Run with:  npx jest __tests__/storage.test.js --colors=false
//
// Tests the storage utility functions in src/utils/storage.js.
// Uses Jest's manual mocking to mock global localStorage without SSR dependencies.

import { saveToStorage, loadFromStorage, removeFromStorage } from "../src/utils/storage.js";

const STORAGE = {};
const STORAGE_GET = jest.fn((key) => STORAGE[key] ?? null);
const STORAGE_SET = jest.fn((key, value) => { STORAGE[key] = value; });
const STORAGE_REMOVE = jest.fn((key) => { delete STORAGE[key]; });

beforeEach(() => {
  Object.keys(STORAGE).forEach((k) => delete STORAGE[k]);
  STORAGE_GET.mockClear();
  STORAGE_SET.mockClear();
  STORAGE_REMOVE.mockClear();

  // Mock global localStorage
  global.localStorage = {
    getItem: STORAGE_GET,
    setItem: STORAGE_SET,
    removeItem: STORAGE_REMOVE,
  };
});

afterEach(() => {
  delete global.localStorage;
});

describe("saveToStorage", () => {
  test("calls localStorage.setItem with the key and JSON-stringified value", () => {
    saveToStorage("theme", "dark");
    expect(STORAGE_SET).toHaveBeenCalledTimes(1);
    expect(STORAGE_SET).toHaveBeenCalledWith("theme", "\"dark\"");
  });

  test("JSON-stringifies objects correctly", () => {
    saveToStorage("user", { id: 1, name: "Alice" });
    expect(STORAGE_SET).toHaveBeenCalledWith(
      "user",
      JSON.stringify({ id: 1, name: "Alice" })
    );
  });

  test("JSON-stringifies arrays correctly", () => {
    saveToStorage("tags", ["dsa", "algorithms"]);
    expect(STORAGE_SET).toHaveBeenCalledWith(
      "tags",
      JSON.stringify(["dsa", "algorithms"])
    );
  });

  test("handles null and undefined values", () => {
    saveToStorage("empty", null);
    expect(STORAGE_SET).toHaveBeenCalledWith("empty", "null");
    STORAGE_SET.mockClear();

    saveToStorage("empty2", undefined);
    expect(STORAGE_SET).toHaveBeenCalledWith("empty2", undefined);
  });

  test("no-ops when window is undefined (SSR guard)", () => {
    delete global.localStorage;
    // Should not throw
    expect(() => saveToStorage("key", "value")).not.toThrow();
  });
});

describe("loadFromStorage", () => {
  test("returns parsed JSON when item exists", () => {
    STORAGE_GET.mockReturnValue('"dark"');
    const result = loadFromStorage("theme");
    expect(result).toBe("dark");
  });

  test("returns parsed object correctly", () => {
    STORAGE_GET.mockReturnValue(JSON.stringify({ id: 42 }));
    const result = loadFromStorage("user");
    expect(result).toEqual({ id: 42 });
  });

  test("returns fallback when item does not exist", () => {
    STORAGE_GET.mockReturnValue(null);
    const result = loadFromStorage("nonexistent", "default");
    expect(result).toBe("default");
  });

  test("returns fallback when item is empty string", () => {
    STORAGE_GET.mockReturnValue("");
    const result = loadFromStorage("empty_key", "fallback_value");
    expect(result).toBe("fallback_value");
  });

  test("returns fallback when JSON.parse throws", () => {
    STORAGE_GET.mockReturnValue("not valid json {{{");
    const result = loadFromStorage("corrupt", { safe: true });
    expect(result).toEqual({ safe: true });
  });

  test("returns undefined as fallback when no fallback provided and item missing", () => {
    STORAGE_GET.mockReturnValue(null);
    const result = loadFromStorage("missing");
    expect(result).toBe(undefined);
  });

  test("no-ops when window is undefined (SSR guard)", () => {
    delete global.localStorage;
    expect(() => loadFromStorage("key")).not.toThrow();
    expect(loadFromStorage("key")).toBe(undefined);
    expect(loadFromStorage("key", "default")).toBe("default");
  });

  test("calls localStorage.getItem with the correct key", () => {
    STORAGE_GET.mockReturnValue('"value"');
    loadFromStorage("my_key");
    expect(STORAGE_GET).toHaveBeenCalledWith("my_key");
  });
});

describe("removeFromStorage", () => {
  test("calls localStorage.removeItem with the correct key", () => {
    removeFromStorage("theme");
    expect(STORAGE_REMOVE).toHaveBeenCalledTimes(1);
    expect(STORAGE_REMOVE).toHaveBeenCalledWith("theme");
  });

  test("no-ops when window is undefined (SSR guard)", () => {
    delete global.localStorage;
    expect(() => removeFromStorage("key")).not.toThrow();
  });
});

describe("round-trip behavior", () => {
  test("save then load returns equivalent value for strings", () => {
    saveToStorage("name", "Alice");
    STORAGE_GET.mockReturnValue(STORAGE["name"]);
    const loaded = loadFromStorage("name");
    expect(loaded).toBe("Alice");
  });

  test("save then load returns equivalent value for objects", () => {
    const obj = { score: 100, active: true };
    saveToStorage("progress", obj);
    STORAGE_GET.mockReturnValue(STORAGE["progress"]);
    const loaded = loadFromStorage("progress");
    expect(loaded).toEqual(obj);
  });
});
