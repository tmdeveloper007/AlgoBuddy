// security-tests/generateSecureCode.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/generateSecureCode.test.cjs
//
// Tests cryptographically secure random code generation.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Inlined source to avoid ESM import issues.
function generateSecureCode(length = 6) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const array = new Uint32Array(length);
  globalThis.crypto.getRandomValues(array);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += charset[array[i] % charset.length];
  }
  return code;
}

// ── Tests ────────────────────────────────────────────────────────────

describe('generateSecureCode', () => {
  it('returns a string of the specified length', () => {
    assert.equal(generateSecureCode(8).length, 8);
    assert.equal(generateSecureCode(4).length, 4);
    assert.equal(generateSecureCode(1).length, 1);
  });

  it('defaults to length 6 when no argument given', () => {
    assert.equal(generateSecureCode().length, 6);
  });

  it('contains only alphanumeric characters from the charset', () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 20; i++) {
      const code = generateSecureCode(10);
      for (const char of code) {
        assert.ok(charset.includes(char), `Unexpected character: ${char}`);
      }
    }
  });

  it('returns different values across multiple calls (not deterministic)', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateSecureCode(8));
    }
    // With 36^8 possible codes, 100 samples should have very low collision probability
    assert.ok(codes.size >= 90, `Too many collisions: ${codes.size}/100 unique`);
  });

  it('handles length of 0 by returning empty string', () => {
    assert.equal(generateSecureCode(0), '');
  });
});
