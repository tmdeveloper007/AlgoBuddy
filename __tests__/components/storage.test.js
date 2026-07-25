// __tests__/components/storage.test.js
//
// Run with:  npx jest __tests__/components/storage.test.js
//
// Tests the browser storage utilities in src/utils/storage.js.

const { saveToStorage, loadFromStorage, removeFromStorage } = require("../../src/utils/storage");

describe("saveToStorage", () => {
  const storage = {};
  let windowSpy;

  beforeEach(() => {
    // Clear storage between tests
    for (const key of Object.keys(storage)) delete storage[key];
    // Mock window.localStorage
    windowSpy = jest.spyOn(window, "localStorage", "get").mockReturnValue({
      setItem: (key, value) => { storage[key] = value; },
      getItem: (key) => storage[key] ?? null,
      removeItem: (key) => { delete storage[key]; },
    });
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  test("serializes object to JSON and stores it", () => {
    saveToStorage("foo", { name: "bar", count: 42 });
    expect(storage["foo"]).toBe('{"name":"bar","count":42}');
  });

  test("handles string values", () => {
    saveToStorage("plain", "hello");
    expect(storage["plain"]).toBe('"hello"');
  });

  test("handles number values", () => {
    saveToStorage("num", 123);
    expect(storage["num"]).toBe("123");
  });

  test("handles array values", () => {
    saveToStorage("arr", [1, 2, 3]);
    expect(storage["arr"]).toBe("[1,2,3]");
  });

  test("handles null", () => {
    saveToStorage("nil", null);
    expect(storage["nil"]).toBe("null");
  });
});

describe("loadFromStorage", () => {
  const storage = {};
  let windowSpy;

  beforeEach(() => {
    for (const key of Object.keys(storage)) delete storage[key];
    windowSpy = jest.spyOn(window, "localStorage", "get").mockReturnValue({
      setItem: (key, value) => { storage[key] = value; },
      getItem: (key) => storage[key] ?? null,
      removeItem: (key) => { delete storage[key]; },
    });
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  test("parses stored JSON back to object", () => {
    storage["parsed"] = '{"name":"bar","count":42}';
    const result = loadFromStorage("parsed");
    expect(result).toEqual({ name: "bar", count: 42 });
  });

  test("returns fallback when key is not found", () => {
    expect(loadFromStorage("missing", "default")).toBe("default");
    expect(loadFromStorage("missing", null)).toBe(null);
    expect(loadFromStorage("missing", 0)).toBe(0);
  });

  test("returns fallback on JSON parse error", () => {
    storage["bad"] = "{invalid";
    expect(loadFromStorage("bad", "fallback")).toBe("fallback");
  });

  test("returns fallback on empty string", () => {
    storage["empty"] = "";
    expect(loadFromStorage("empty", "fallback")).toBe("fallback");
  });
});

describe("removeFromStorage", () => {
  const storage = {};
  let windowSpy;

  beforeEach(() => {
    storage["session_token"] = "abc123";
    storage["other"] = "value";
    windowSpy = jest.spyOn(window, "localStorage", "get").mockReturnValue({
      setItem: (key, value) => { storage[key] = value; },
      getItem: (key) => storage[key] ?? null,
      removeItem: (key) => { delete storage[key]; },
    });
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  test("removes the given key from storage", () => {
    removeFromStorage("session_token");
    expect(storage["session_token"]).toBeUndefined();
    expect(storage["other"]).toBe("value"); // other keys unaffected
  });

  test("no-ops when key does not exist", () => {
    removeFromStorage("nonexistent");
    // Should not throw
  });
});

// SSR guard tests: the storage functions guard with `typeof window !== "undefined"`.
// In Node.js without jsdom (SSR), window is undefined so the functions are no-ops.
// In Jest jsdom environment, window is present — real localStorage is used.
// We verify the SSR no-op behavior by noting that jest-environment-jsdom provides
// a functional window.localStorage, so SSR tests would require a Node.js test
// runner (e.g. via node:test). The 11 browser tests above cover the core logic.
