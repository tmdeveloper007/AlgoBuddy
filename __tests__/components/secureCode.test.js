// __tests__/components/secureCode.test.js
//
// Run with:  npx jest __tests__/components/secureCode.test.js --colors=false

import { generateSecureCode } from "../../src/lib/random.js";

describe("generateSecureCode", () => {
  test("returns a string", () => {
    const code = generateSecureCode(6);
    expect(typeof code).toBe("string");
  });

  test("returns code of the specified length", () => {
    expect(generateSecureCode(6).length).toBe(6);
    expect(generateSecureCode(10).length).toBe(10);
    expect(generateSecureCode(1).length).toBe(1);
    expect(generateSecureCode(32).length).toBe(32);
  });

  test("default length is 6", () => {
    expect(generateSecureCode().length).toBe(6);
  });

  test("contains only alphanumeric characters (A-Z, 0-9)", () => {
    const code = generateSecureCode(100);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  test("does not contain lowercase letters", () => {
    const code = generateSecureCode(200);
    expect(code).not.toMatch(/[a-z]/);
  });

  test("generates different codes on consecutive calls (randomness)", () => {
    const codes = new Set();
    for (let i = 0; i < 50; i++) {
      codes.add(generateSecureCode(8));
    }
    expect(codes.size).toBe(50);
  });

  test("length of 0 returns empty string", () => {
    expect(generateSecureCode(0)).toBe("");
  });

  test("does not throw for valid positive lengths", () => {
    expect(() => generateSecureCode(1)).not.toThrow();
    expect(() => generateSecureCode(100)).not.toThrow();
  });
});
