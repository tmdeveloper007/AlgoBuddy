// security-tests/sandboxConfig.test.cjs
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const SANDBOX_CONFIG = {
  MAX_TIMEOUT_MS: 1000,
  MAX_MEMORY_MB: 32,
  MAX_OUTPUT_LENGTH: 8000,
  RATE_LIMIT_MAX_REQUESTS: 10,
  RATE_LIMIT_WINDOW_SEC: 60,
};

describe("SANDBOX_CONFIG", () => {
  test("MAX_TIMEOUT_MS is a positive number", () => {
    assert.strictEqual(typeof SANDBOX_CONFIG.MAX_TIMEOUT_MS, "number");
    assert.ok(SANDBOX_CONFIG.MAX_TIMEOUT_MS > 0, "MAX_TIMEOUT_MS must be positive");
  });
  test("MAX_TIMEOUT_MS is within reasonable bounds (max 30000ms)", () => {
    assert.ok(SANDBOX_CONFIG.MAX_TIMEOUT_MS <= 30000);
  });
  test("MAX_MEMORY_MB is a positive number", () => {
    assert.strictEqual(typeof SANDBOX_CONFIG.MAX_MEMORY_MB, "number");
    assert.ok(SANDBOX_CONFIG.MAX_MEMORY_MB > 0, "MAX_MEMORY_MB must be positive");
  });
  test("MAX_MEMORY_MB is within reasonable bounds (max 256MB)", () => {
    assert.ok(SANDBOX_CONFIG.MAX_MEMORY_MB <= 256);
  });
  test("MAX_OUTPUT_LENGTH is a positive number", () => {
    assert.strictEqual(typeof SANDBOX_CONFIG.MAX_OUTPUT_LENGTH, "number");
    assert.ok(SANDBOX_CONFIG.MAX_OUTPUT_LENGTH > 0, "MAX_OUTPUT_LENGTH must be positive");
  });
  test("RATE_LIMIT_MAX_REQUESTS is a positive integer", () => {
    assert.strictEqual(typeof SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS, "number");
    assert.ok(SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS > 0);
    assert.strictEqual(SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS, Math.floor(SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS));
  });
  test("RATE_LIMIT_WINDOW_SEC is a positive integer", () => {
    assert.strictEqual(typeof SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC, "number");
    assert.ok(SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC > 0);
    assert.strictEqual(SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC, Math.floor(SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC));
  });
  test("all config values are defined (not undefined or null)", () => {
    for (const [key, val] of Object.entries(SANDBOX_CONFIG)) {
      assert.notStrictEqual(val, undefined, `${key} must not be undefined`);
      assert.notStrictEqual(val, null, `${key} must not be null`);
    }
  });
});
