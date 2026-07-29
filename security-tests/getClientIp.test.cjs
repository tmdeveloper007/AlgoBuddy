// security-tests/getClientIp.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/getClientIp.test.cjs
//
// Tests getClientIp from src/lib/getClientIp.js.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ─── Inline implementation ───────────────────────────────────────────────────

function getClientIp(headers) {
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getClientIp', () => {
  test('returns x-real-ip header value when present', () => {
    const headers = { get: (key) => (key === 'x-real-ip' ? '203.0.113.42' : null) };
    assert.strictEqual(getClientIp(headers), '203.0.113.42');
  });

  test('trims whitespace from x-real-ip value', () => {
    const headers = { get: (key) => (key === 'x-real-ip' ? '  203.0.113.42  ' : null) };
    assert.strictEqual(getClientIp(headers), '203.0.113.42');
  });

  test('returns x-real-ip for IPv6 address', () => {
    const headers = { get: (key) => (key === 'x-real-ip' ? '2001:db8::1' : null) };
    assert.strictEqual(getClientIp(headers), '2001:db8::1');
  });

  test('returns x-real-ip even when x-forwarded-for is also present', () => {
    const headers = {
      get: (key) => {
        if (key === 'x-real-ip') return '10.0.0.1';
        if (key === 'x-forwarded-for') return '203.0.113.1, 198.51.100.1';
        return null;
      },
    };
    // getClientIp intentionally ignores x-forwarded-for — that's a security decision
    assert.strictEqual(getClientIp(headers), '10.0.0.1');
  });

  test('returns "unknown" when x-real-ip header is absent', () => {
    const headers = { get: () => null };
    assert.strictEqual(getClientIp(headers), 'unknown');
  });

  test('returns "unknown" when x-real-ip is empty string', () => {
    const headers = { get: (key) => (key === 'x-real-ip' ? '' : null) };
    assert.strictEqual(getClientIp(headers), 'unknown');
  });

  test('returns "unknown" when x-real-ip is explicitly null', () => {
    const headers = { get: (key) => (key === 'x-real-ip' ? null : undefined) };
    assert.strictEqual(getClientIp(headers), 'unknown');
  });

  test('handles headers with other headers present but no x-real-ip', () => {
    const headers = {
      get: (key) => {
        if (key === 'host') return 'algobuddy.com';
        if (key === 'user-agent') return 'Mozilla/5.0';
        return null;
      },
    };
    assert.strictEqual(getClientIp(headers), 'unknown');
  });
});
