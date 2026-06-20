// __tests__/sandboxConfig.test.js
//
// Run with:  npx jest __tests__/sandboxConfig.test.js --colors=false
//
// Tests that src/lib/sandbox/sandbox.config.js exports the expected resource-limit
// constants and that each satisfies basic safety invariants.

const { describe, expect, test } = require("@jest/globals");
const SANDBOX_CONFIG = require("../src/lib/sandbox/sandbox.config.js");

describe("SANDBOX_CONFIG exports", () => {
  test("exports an object (not a class instance)", () => {
    expect(typeof SANDBOX_CONFIG).toBe("object");
    expect(SANDBOX_CONFIG).not.toBeNull();
  });

  test("contains exactly the expected five keys", () => {
    const expectedKeys = [
      "MAX_TIMEOUT_MS",
      "MAX_MEMORY_MB",
      "MAX_OUTPUT_LENGTH",
      "RATE_LIMIT_MAX_REQUESTS",
      "RATE_LIMIT_WINDOW_SEC",
    ];
    const actualKeys = Object.keys(SANDBOX_CONFIG).sort();
    expect(actualKeys).toEqual(expectedKeys.sort());
  });

  test("no extra keys beyond the five expected", () => {
    const keys = Object.keys(SANDBOX_CONFIG);
    expect(keys.length).toBe(5);
  });
});

describe("MAX_TIMEOUT_MS", () => {
  test("is defined and is a number", () => {
    expect(typeof SANDBOX_CONFIG.MAX_TIMEOUT_MS).toBe("number");
  });

  test("is positive", () => {
    expect(SANDBOX_CONFIG.MAX_TIMEOUT_MS).toBeGreaterThan(0);
  });

  test("is at least 100ms (avoid false TLEs on fast code)", () => {
    expect(SANDBOX_CONFIG.MAX_TIMEOUT_MS).toBeGreaterThanOrEqual(100);
  });

  test("is a finite integer", () => {
    expect(Number.isFinite(SANDBOX_CONFIG.MAX_TIMEOUT_MS)).toBe(true);
    expect(Number.isInteger(SANDBOX_CONFIG.MAX_TIMEOUT_MS)).toBe(true);
  });
});

describe("MAX_MEMORY_MB", () => {
  test("is defined and is a number", () => {
    expect(typeof SANDBOX_CONFIG.MAX_MEMORY_MB).toBe("number");
  });

  test("is positive", () => {
    expect(SANDBOX_CONFIG.MAX_MEMORY_MB).toBeGreaterThan(0);
  });

  test("is at least 1MB (avoid false MLEs)", () => {
    expect(SANDBOX_CONFIG.MAX_MEMORY_MB).toBeGreaterThanOrEqual(1);
  });

  test("is a finite integer", () => {
    expect(Number.isFinite(SANDBOX_CONFIG.MAX_MEMORY_MB)).toBe(true);
    expect(Number.isInteger(SANDBOX_CONFIG.MAX_MEMORY_MB)).toBe(true);
  });
});

describe("MAX_OUTPUT_LENGTH", () => {
  test("is defined and is a number", () => {
    expect(typeof SANDBOX_CONFIG.MAX_OUTPUT_LENGTH).toBe("number");
  });

  test("is positive", () => {
    expect(SANDBOX_CONFIG.MAX_OUTPUT_LENGTH).toBeGreaterThan(0);
  });

  test("is at most 1_000_000 (sensible upper bound)", () => {
    expect(SANDBOX_CONFIG.MAX_OUTPUT_LENGTH).toBeLessThanOrEqual(1_000_000);
  });

  test("is a finite integer", () => {
    expect(Number.isFinite(SANDBOX_CONFIG.MAX_OUTPUT_LENGTH)).toBe(true);
    expect(Number.isInteger(SANDBOX_CONFIG.MAX_OUTPUT_LENGTH)).toBe(true);
  });
});

describe("RATE_LIMIT_MAX_REQUESTS", () => {
  test("is defined and is a number", () => {
    expect(typeof SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS).toBe("number");
  });

  test("is a positive integer", () => {
    expect(SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS).toBeGreaterThan(0);
    expect(Number.isInteger(SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS)).toBe(true);
  });
});

describe("RATE_LIMIT_WINDOW_SEC", () => {
  test("is defined and is a number", () => {
    expect(typeof SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC).toBe("number");
  });

  test("is a positive integer", () => {
    expect(SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC).toBeGreaterThan(0);
    expect(Number.isInteger(SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC)).toBe(true);
  });
});

describe("Cross-field invariants", () => {
  test("MAX_OUTPUT_LENGTH is greater than 0 and not absurdly small", () => {
    // At least 100 chars — enough for a meaningful error message
    expect(SANDBOX_CONFIG.MAX_OUTPUT_LENGTH).toBeGreaterThanOrEqual(100);
  });

  test("RATE_LIMIT_WINDOW_SEC is at least 1 second", () => {
    expect(SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC).toBeGreaterThanOrEqual(1);
  });

  test("RATE_LIMIT_MAX_REQUESTS is a reasonable positive integer", () => {
    // An upper bound of 100_000 req/window is too permissive
    expect(SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS).toBeLessThan(100_000);
  });
});
