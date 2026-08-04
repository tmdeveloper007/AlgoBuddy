// __tests__/rateLimits.test.js
//
// Run with:  npx jest __tests__/rateLimits.test.js
//
// Tests the rate limit configuration in src/config/rateLimits.js.

const { describe, expect, test } = require("@jest/globals");
const { RATE_LIMITS } = require("../src/config/rateLimits.js");

describe("RATE_LIMITS", () => {
  test("CONTACT_API has a positive LIMIT", () => {
    expect(RATE_LIMITS.CONTACT_API).toBeDefined();
    expect(typeof RATE_LIMITS.CONTACT_API.LIMIT).toBe("number");
    expect(RATE_LIMITS.CONTACT_API.LIMIT).toBeGreaterThan(0);
  });

  test("SMTP has DAILY_QUOTA with a sensible default", () => {
    expect(RATE_LIMITS.SMTP).toBeDefined();
    expect(typeof RATE_LIMITS.SMTP.DAILY_QUOTA).toBe("number");
    // Default is 400 per the config
    expect(RATE_LIMITS.SMTP.DAILY_QUOTA).toBe(400);
  });

  test("has only expected top-level keys", () => {
    const keys = Object.keys(RATE_LIMITS).sort();
    expect(keys).toEqual(["CONTACT_API", "SMTP"]);
  });

  test("CONTACT_API.LIMIT is an integer", () => {
    expect(Number.isInteger(RATE_LIMITS.CONTACT_API.LIMIT)).toBe(true);
  });

  test("SMTP.DAILY_QUOTA is an integer", () => {
    expect(Number.isInteger(RATE_LIMITS.SMTP.DAILY_QUOTA)).toBe(true);
  });

  test("CONTACT_API.LIMIT is a reasonable small number (anti-abuse)", () => {
    // A contact API limit should not be huge
    expect(RATE_LIMITS.CONTACT_API.LIMIT).toBeLessThanOrEqual(100);
  });

  test("SMTP.DAILY_QUOTA is a reasonable daily volume", () => {
    // SMTP daily quota should be positive and realistic
    expect(RATE_LIMITS.SMTP.DAILY_QUOTA).toBeGreaterThan(0);
    expect(RATE_LIMITS.SMTP.DAILY_QUOTA).toBeGreaterThanOrEqual(100);
  });
});
