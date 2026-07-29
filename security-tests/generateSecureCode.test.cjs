// security-tests/generateSecureCode.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/generateSecureCode.test.cjs
//
// Tests generateSecureCode in src/lib/random.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// ── Inlined source from src/lib/random.js ────────────────────────────

/**
 * Generates a cryptographically secure random alphanumeric code.
 * @param {number} length - The length of the generated code.
 * @returns {string} - The generated secure code.
 */
function generateSecureCode(length) {
  length = (length === undefined) ? 6 : length;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const biasLimit = Math.floor((2 ** 32 / charset.length) * charset.length);
  const array = new Uint32Array(length);
  let code = '';
  let filled = 0;
  while (filled < length) {
    globalThis.crypto.getRandomValues(array);
    for (let i = 0; i < array.length && filled < length; i++) {
      if (array[i] < biasLimit) {
        code += charset[array[i] % charset.length];
        filled++;
      }
    }
  }
  return code;
}

// ── Tests ────────────────────────────────────────────────────────────

describe("generateSecureCode", () => {
  const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  test("returns a string", () => {
    const result = generateSecureCode();
    assert.strictEqual(typeof result, "string");
  });

  test("defaults to length 6 when no argument given", () => {
    const result = generateSecureCode();
    assert.strictEqual(result.length, 6);
  });

  test("respects the length parameter", () => {
    assert.strictEqual(generateSecureCode(4).length, 4);
    assert.strictEqual(generateSecureCode(8).length, 8);
    assert.strictEqual(generateSecureCode(12).length, 12);
  });

  test("returns only alphanumeric characters from the charset", () => {
    for (let i = 0; i < 20; i++) {
      const code = generateSecureCode(10);
      for (const char of code) {
        assert.strictEqual(
          CHARSET.includes(char),
          true,
          `Character '${char}' is not in charset`
        );
      }
    }
  });

  test("produces codes with uppercase letters and digits", () => {
    // Generate many codes and check that both letters and digits appear across runs
    let hasLetter = false;
    let hasDigit = false;
    for (let i = 0; i < 50; i++) {
      const code = generateSecureCode(20);
      if (/[A-Z]/.test(code)) hasLetter = true;
      if (/[0-9]/.test(code)) hasDigit = true;
      if (hasLetter && hasDigit) break;
    }
    assert.strictEqual(hasLetter, true, "No uppercase letters found across 50 runs");
    assert.strictEqual(hasDigit, true, "No digits found across 50 runs");
  });

  test("multiple calls produce different values (cryptographic randomness)", () => {
    const results = new Set();
    for (let i = 0; i < 100; i++) {
      results.add(generateSecureCode(8));
    }
    // With 36^8 possible values, 100 samples should all be unique with very high probability
    assert.strictEqual(results.size, 100, "Duplicate codes detected in 100 samples — possible bias");
  });

  test("does not include lowercase letters", () => {
    for (let i = 0; i < 10; i++) {
      const code = generateSecureCode(20);
      assert.strictEqual(/[a-z]/.test(code), false, `Lowercase letter found in: ${code}`);
    }
  });

  test("does not include special characters", () => {
    for (let i = 0; i < 10; i++) {
      const code = generateSecureCode(20);
      assert.strictEqual(/[^A-Z0-9]/.test(code), false, `Special char found in: ${code}`);
    }
  });

  test("length of 0 returns empty string", () => {
    assert.strictEqual(generateSecureCode(0), "");
  });

  test("handles large length values", () => {
    const code = generateSecureCode(100);
    assert.strictEqual(code.length, 100);
    // All chars should still be from charset
    for (const char of code) {
      assert.strictEqual(CHARSET.includes(char), true);
    }
  });
});
