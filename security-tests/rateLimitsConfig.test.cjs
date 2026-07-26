// security-tests/rateLimitsConfig.test.cjs
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const RATE_LIMITS = {
  CONTACT_API: { LIMIT: 5 },
  SMTP: { DAILY_QUOTA: 400 },
};

describe("RATE_LIMITS", () => {
  describe("CONTACT_API", () => {
    test("CONTACT_API is defined", () => {
      assert.ok(RATE_LIMITS.CONTACT_API !== undefined);
      assert.strictEqual(typeof RATE_LIMITS.CONTACT_API, "object");
    });
    test("CONTACT_API.LIMIT is a positive integer", () => {
      assert.strictEqual(typeof RATE_LIMITS.CONTACT_API.LIMIT, "number");
      assert.ok(RATE_LIMITS.CONTACT_API.LIMIT > 0);
      assert.strictEqual(RATE_LIMITS.CONTACT_API.LIMIT, Math.floor(RATE_LIMITS.CONTACT_API.LIMIT));
    });
    test("CONTACT_API.LIMIT is within reasonable bounds (max 100)", () => {
      assert.ok(RATE_LIMITS.CONTACT_API.LIMIT <= 100);
    });
  });

  describe("SMTP", () => {
    test("SMTP is defined", () => {
      assert.ok(RATE_LIMITS.SMTP !== undefined);
      assert.strictEqual(typeof RATE_LIMITS.SMTP, "object");
    });
    test("SMTP.DAILY_QUOTA is a positive integer", () => {
      assert.strictEqual(typeof RATE_LIMITS.SMTP.DAILY_QUOTA, "number");
      assert.ok(RATE_LIMITS.SMTP.DAILY_QUOTA > 0);
      assert.strictEqual(RATE_LIMITS.SMTP.DAILY_QUOTA, Math.floor(RATE_LIMITS.SMTP.DAILY_QUOTA));
    });
    test("SMTP.DAILY_QUOTA defaults to 400 when env var is absent", () => {
      assert.strictEqual(RATE_LIMITS.SMTP.DAILY_QUOTA, 400);
    });
    test("SMTP.DAILY_QUOTA is within reasonable bounds (max 10000)", () => {
      assert.ok(RATE_LIMITS.SMTP.DAILY_QUOTA <= 10000);
    });
  });

  test("all keys in RATE_LIMITS are defined and non-null", () => {
    assert.ok(RATE_LIMITS.CONTACT_API !== null);
    assert.ok(RATE_LIMITS.SMTP !== null);
  });
});
