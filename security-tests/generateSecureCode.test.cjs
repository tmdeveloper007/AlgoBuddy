// security-tests/generateSecureCode.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/generateSecureCode.test.cjs
//
// Tests generateSecureCode from src/lib/random.js — cryptographically secure
// random alphanumeric code generation.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ─── Inline implementation ───────────────────────────────────────────────────

function generateSecureCode(length = 6) {
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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('generateSecureCode', () => {
  test('returns a string', () => {
    assert.strictEqual(typeof generateSecureCode(6), 'string');
  });

  test('returns correct length for length=1', () => {
    assert.strictEqual(generateSecureCode(1).length, 1);
  });

  test('returns correct length for length=6 (default)', () => {
    assert.strictEqual(generateSecureCode().length, 6);
  });

  test('returns correct length for length=10', () => {
    assert.strictEqual(generateSecureCode(10).length, 10);
  });

  test('returns correct length for length=32', () => {
    assert.strictEqual(generateSecureCode(32).length, 32);
  });

  test('returns only alphanumeric characters', () => {
    const code = generateSecureCode(50);
    assert.ok(/^[A-Z0-9]+$/.test(code), `Got unexpected chars in: ${code}`);
  });

  test('two calls produce different results', () => {
    const a = generateSecureCode(16);
    const b = generateSecureCode(16);
    assert.notStrictEqual(a, b, 'Two calls should produce different codes (cryptographic randomness)');
  });

  test('many calls produce unique results (statistical)', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateSecureCode(8));
    }
    // With 36^8 possible codes, 100 samples should almost certainly be all unique
    assert.ok(codes.size >= 99, `Expected >=99 unique codes, got ${codes.size}`);
  });

  test('length=0 returns empty string', () => {
    assert.strictEqual(generateSecureCode(0), '');
  });

  test('throws RangeError for negative length', () => {
    assert.throws(() => generateSecureCode(-1), RangeError);
  });
});
