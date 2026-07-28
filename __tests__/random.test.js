// __tests__/random.test.js
//
// Run with:  npx jest __tests__/random.test.js --colors=false
//
// Tests generateSecureCode in src/lib/random.js.

const { generateSecureCode } = require("../src/lib/random.js");

describe("generateSecureCode", () => {
  test("returns a string of the requested length", () => {
    expect(generateSecureCode(6).length).toBe(6);
    expect(generateSecureCode(10).length).toBe(10);
    expect(generateSecureCode(1).length).toBe(1);
    expect(generateSecureCode(32).length).toBe(32);
  });

  test("returns empty string for length 0", () => {
    expect(generateSecureCode(0)).toBe("");
  });

  test("default length is 6", () => {
    expect(generateSecureCode().length).toBe(6);
  });

  test("all characters are alphanumeric uppercase + digits", () => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = generateSecureCode(100);
    for (const ch of code) {
      expect(charset.includes(ch)).toBe(true);
    }
  });

  test("output is deterministic under crypto mocking is not possible without mock", () => {
    // Without mocking globalThis.crypto, we verify output is non-trivial
    // by checking it changes across calls (extremely high probability)
    const a = generateSecureCode(16);
    const b = generateSecureCode(16);
    const c = generateSecureCode(16);
    // At least 2 of 3 should differ (probability of collision ~ 1/36^16)
    const allSame = (a === b) && (b === c);
    expect(allSame).toBe(false);
  });

  test("handles very large length without throwing", () => {
    const code = generateSecureCode(1000);
    expect(code.length).toBe(1000);
  });

  test("each character is a valid charset index", () => {
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = generateSecureCode(200);
    for (const ch of code) {
      expect(charset.includes(ch)).toBe(true);
    }
  });
});
