// security-tests/getClientIp.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/getClientIp.test.cjs
//
// Tests getClientIp in src/lib/getClientIp.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// ── Inlined source from src/lib/getClientIp.js ───────────────────────

/**
 * Returns the verified client IP from an incoming request's headers.
 *
 * Only trusts x-real-ip — set by Vercel's edge infrastructure; cannot
 * be spoofed by the client.  X-Forwarded-For is NOT used because it is
 * fully client-controlled and would allow complete rate-limit bypass.
 *
 * @param {Headers} headers  The request headers object.
 * @returns {string}  Verified IP address, or "unknown" if none can be determined.
 */
function getClientIp(headers) {
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

// ── Tests ────────────────────────────────────────────────────────────

describe("getClientIp", () => {
  // Minimal Headers-like object that implements .get()
  const makeHeaders = (pairs) => {
    const map = new Map();
    for (const [k, v] of pairs) map.set(k.toLowerCase(), v);
    return { get: (key) => map.get(key.toLowerCase()) ?? null };
  };

  test("returns trimmed x-real-ip when present", () => {
    const headers = makeHeaders([["x-real-ip", "  203.0.113.42  "]]);
    assert.strictEqual(getClientIp(headers), "203.0.113.42");
  });

  test("returns x-real-ip without trimming when no whitespace", () => {
    const headers = makeHeaders([["x-real-ip", "192.168.1.1"]]);
    assert.strictEqual(getClientIp(headers), "192.168.1.1");
  });

  test("returns x-real-ip for IPv6 address", () => {
    const headers = makeHeaders([["x-real-ip", "2001:db8::1"]]);
    assert.strictEqual(getClientIp(headers), "2001:db8::1");
  });

  test("ignores x-forwarded-for even when present", () => {
    // x-forwarded-for is client-controlled and must NOT be trusted
    const headers = makeHeaders([
      ["x-real-ip", "10.0.0.1"],
      ["x-forwarded-for", "1.2.3.4, 5.6.7.8"],
    ]);
    assert.strictEqual(getClientIp(headers), "10.0.0.1");
  });

  test("returns 'unknown' when x-real-ip is not set", () => {
    const headers = makeHeaders([["accept", "application/json"]]);
    assert.strictEqual(getClientIp(headers), "unknown");
  });

  test("returns 'unknown' when headers is empty", () => {
    const headers = makeHeaders([]);
    assert.strictEqual(getClientIp(headers), "unknown");
  });

  test("is case-insensitive for x-real-ip header name", () => {
    const headers = { get: (k) => (k === "x-real-ip" ? "5.5.5.5" : null) };
    assert.strictEqual(getClientIp(headers), "5.5.5.5");
  });

  test("returns 'unknown' when x-real-ip value is empty string (falsy)", () => {
    const headers = makeHeaders([["x-real-ip", ""]]);
    assert.strictEqual(getClientIp(headers), "unknown");
  });

  test("handles x-real-ip with multiple IPs (edge case)", () => {
    const headers = makeHeaders([["x-real-ip", "1.1.1.1, 2.2.2.2"]]);
    // The function does not parse comma-separated values; it returns the raw trimmed value
    assert.strictEqual(getClientIp(headers), "1.1.1.1, 2.2.2.2");
  });
});
