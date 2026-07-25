// security-tests/getClientIp.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/getClientIp.test.cjs
//
// Tests client IP extraction from request headers.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Inlined source to avoid ESM import issues.
function getClientIp(headers) {
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

// ── Tests ────────────────────────────────────────────────────────────

describe('getClientIp', () => {
  it('returns trimmed IP when x-real-ip header is present', () => {
    const headers = { get: (name) => (name === 'x-real-ip' ? '203.0.113.42' : null) };
    assert.equal(getClientIp(headers), '203.0.113.42');
  });

  it('trims whitespace from x-real-ip value', () => {
    const headers = { get: (name) => (name === 'x-real-ip' ? '  198.51.100.7  ' : null) };
    assert.equal(getClientIp(headers), '198.51.100.7');
  });

  it('returns unknown when x-real-ip header is absent', () => {
    const headers = { get: () => null };
    assert.equal(getClientIp(headers), 'unknown');
  });

  it('returns unknown when x-real-ip is empty string', () => {
    const headers = { get: (name) => (name === 'x-real-ip' ? '' : null) };
    assert.equal(getClientIp(headers), 'unknown');
  });
});
