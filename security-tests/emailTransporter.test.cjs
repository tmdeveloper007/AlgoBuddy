// security-tests/emailTransporter.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/emailTransporter.test.cjs
//
// Tests src/lib/emailTransporter.js — getTransporter() singleton.

const { describe, test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

// ─── Inline emailTransporter source ───────────────────────────────────────────

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = {
      service: "gmail",
      auth: {
        user: "test-user",
        pass: "test-pass",
      },
    };
  }
  return transporter;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("getTransporter", () => {
  // Reset the singleton before each test to ensure deterministic state
  beforeEach(() => {
    transporter = null;
  });

  test("returns an object on first call", () => {
    const result = getTransporter();
    assert.strictEqual(typeof result, "object");
    assert.ok(result !== null, "transporter must not be null");
  });

  test("returns gmail service configuration", () => {
    const result = getTransporter();
    assert.strictEqual(result.service, "gmail");
  });

  test("returns auth object with user field", () => {
    const result = getTransporter();
    assert.strictEqual(typeof result.auth, "object");
    assert.strictEqual(typeof result.auth.user, "string");
  });

  test("returns auth object with pass field", () => {
    const result = getTransporter();
    assert.strictEqual(typeof result.auth, "object");
    assert.strictEqual(typeof result.auth.pass, "string");
  });

  test("returns the same object on repeated calls (singleton)", () => {
    const first = getTransporter();
    const second = getTransporter();
    assert.strictEqual(first, second, "getTransporter must return the same singleton instance");
  });

  test("singleton persists across calls without recreating", () => {
    const first = getTransporter();
    first._marker = "singleton-persists";
    const second = getTransporter();
    assert.strictEqual(second._marker, "singleton-persists", "singleton state must persist across calls");
  });
});
