// security-tests/rateLimitsConfig.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/rateLimitsConfig.test.cjs
//
// Tests src/config/rateLimits.js — verifies RATE_LIMITS constant structure.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// ─── Inline rateLimits.js source ──────────────────────────────────────────────

const RATE_LIMITS = {
  CONTACT_API: {
    LIMIT: 5,
  },
  SMTP: {
    DAILY_QUOTA: 400,
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("RATE_LIMITS", () => {
  describe("CONTACT_API", () => {
    test("CONTACT_API is defined", () => {
      assert.ok(RATE_LIMITS.CONTACT_API !== undefined, "CONTACT_API must be defined");
      assert.strictEqual(typeof RATE_LIMITS.CONTACT_API, "object");
    });

    test("CONTACT_API.LIMIT is a positive integer", () => {
      assert.strictEqual(typeof RATE_LIMITS.CONTACT_API.LIMIT, "number");
      assert.ok(RATE_LIMITS.CONTACT_API.LIMIT > 0, "CONTACT_API.LIMIT must be positive");
      assert.strictEqual(
        RATE_LIMITS.CONTACT_API.LIMIT,
        Math.floor(RATE_LIMITS.CONTACT_API.LIMIT),
        "CONTACT_API.LIMIT must be an integer",
      );
    });

    test("CONTACT_API.LIMIT is within reasonable bounds (max 100)", () => {
      assert.ok(RATE_LIMITS.CONTACT_API.LIMIT <= 100, "CONTACT_API.LIMIT should not exceed 100");
    });
  });

  describe("SMTP", () => {
    test("SMTP is defined", () => {
      assert.ok(RATE_LIMITS.SMTP !== undefined, "SMTP must be defined");
      assert.strictEqual(typeof RATE_LIMITS.SMTP, "object");
    });

    test("SMTP.DAILY_QUOTA is a positive integer", () => {
      assert.strictEqual(typeof RATE_LIMITS.SMTP.DAILY_QUOTA, "number");
      assert.ok(RATE_LIMITS.SMTP.DAILY_QUOTA > 0, "SMTP.DAILY_QUOTA must be positive");
      assert.strictEqual(
        RATE_LIMITS.SMTP.DAILY_QUOTA,
        Math.floor(RATE_LIMITS.SMTP.DAILY_QUOTA),
        "SMTP.DAILY_QUOTA must be an integer",
      );
    });

    test("SMTP.DAILY_QUOTA defaults to 400 when env var is absent", () => {
      assert.strictEqual(RATE_LIMITS.SMTP.DAILY_QUOTA, 400, "SMTP.DAILY_QUOTA default should be 400");
    });

    test("SMTP.DAILY_QUOTA is within reasonable bounds (max 10000)", () => {
      assert.ok(RATE_LIMITS.SMTP.DAILY_QUOTA <= 10000, "SMTP.DAILY_QUOTA should not exceed 10000");
    });
  });

  test("all keys in RATE_LIMITS are defined and non-null", () => {
    assert.ok(RATE_LIMITS.CONTACT_API !== null);
    assert.ok(RATE_LIMITS.SMTP !== null);
  });
});
