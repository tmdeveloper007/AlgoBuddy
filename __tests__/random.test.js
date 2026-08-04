// __tests__/random.test.js
//
// Run with:  npx jest __tests__/random.test.js
//
// Tests the generateSecureCode function in src/lib/random.js.

const { describe, expect, test } = require("@jest/globals");
const { generateSecureCode } = require("../src/lib/random.js");

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

describe("generateSecureCode", () => {
  test("returns a string", () => {
    const result = generateSecureCode();
    expect(typeof result).toBe("string");
  });

  test("defaults to length 6", () => {
    expect(generateSecureCode().length).toBe(6);
  });

  test("respects custom length argument", () => {
    expect(generateSecureCode(4).length).toBe(4);
    expect(generateSecureCode(8).length).toBe(8);
    expect(generateSecureCode(12).length).toBe(12);
  });

  test("returns empty string for length 0", () => {
    expect(generateSecureCode(0)).toBe("");
  });

  test("returns only alphanumeric characters from the expected charset", () => {
    const code = generateSecureCode(100);
    for (const char of code) {
      expect(CHARSET).toContain(char);
    }
  });

  test("returns a different code on each call (high probability)", () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateSecureCode());
    }
    // With 6 chars from 36-char set, collision probability is very low in 100 samples
    expect(codes.size).toBe(100);
  });

  test("generates uppercase letters and digits only", () => {
    const code = generateSecureCode(50);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  test("does not include lowercase letters", () => {
    // Run multiple times to catch any lowercase leakage
    for (let i = 0; i < 10; i++) {
      const code = generateSecureCode(20);
      expect(code).not.toMatch(/[a-z]/);
    }
  });

  test("length argument of 1 returns exactly one character", () => {
    const code = generateSecureCode(1);
    expect(code.length).toBe(1);
    expect(CHARSET).toContain(code);
  });

  test("large length generates all valid characters", () => {
    const code = generateSecureCode(360);
    const uniqueChars = new Set(code);
    // Should cover most of the 36-character charset in 360 samples
    expect(uniqueChars.size).toBeGreaterThanOrEqual(30);
  });
});
