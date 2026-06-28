'use strict';

// security-tests/getClientIp.test.cjs
// Run with: node --experimental-detect-module --test security-tests/getClientIp.test.cjs
//
// Tests getClientIp from src/lib/getClientIp.js.
// Logic is inlined to avoid import path issues with @/ aliases.

const { test } = require('node:test');
const assert = require('node:assert/strict');

// Inlined from src/lib/getClientIp.js
const PRIVATE_IP_RE =
  /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:)/i;

function getClientIp(headers) {
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const hops = forwardedFor
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    for (let i = hops.length - 1; i >= 0; i--) {
      if (!PRIVATE_IP_RE.test(hops[i])) return hops[i];
    }
  }

  return "unknown";
}

// Minimal Headers mock — get() returns null for missing keys
class MockHeaders {
  constructor(values = {}) {
    this._values = values;
  }
  get(name) {
    const v = this._values[name];
    return v !== undefined ? v : null;
  }
}

function headers(vals) {
  return new MockHeaders(vals);
}

// x-real-ip tests
test('x-real-ip header returns its value directly', () => {
  assert.equal(getClientIp(headers({ "x-real-ip": "203.0.113.42" })), "203.0.113.42");
});

test('x-real-ip with whitespace is trimmed', () => {
  assert.equal(getClientIp(headers({ "x-real-ip": "  203.0.113.42  " })), "203.0.113.42");
});

// x-forwarded-for single hop tests
test('x-forwarded-for with single public IP returns it', () => {
  assert.equal(getClientIp(headers({ "x-forwarded-for": "203.0.113.99" })), "203.0.113.99");
});

test('x-forwarded-for with no x-real-ip returns rightmost public hop', () => {
  assert.equal(
    getClientIp(headers({ "x-forwarded-for": "10.0.0.1, 10.0.0.2, 203.0.113.5" })),
    "203.0.113.5"
  );
});

// PRIVATE_IP_RE coverage
test('127.x.x.x is treated as private', () => {
  assert.equal(getClientIp(headers({ "x-forwarded-for": "127.0.0.1, 203.0.113.1" })), "203.0.113.1");
});

test('10.x.x.x is treated as private', () => {
  assert.equal(getClientIp(headers({ "x-forwarded-for": "10.255.255.255, 203.0.113.2" })), "203.0.113.2");
});

test('172.16-31.x.x is treated as private', () => {
  assert.equal(getClientIp(headers({ "x-forwarded-for": "172.31.255.255, 203.0.113.3" })), "203.0.113.3");
});

test('172.15.x.x is NOT matched by PRIVATE_IP_RE (only 172.16-31 range)', () => {
  // PRIVATE_IP_RE only matches 172.16-31.x.x; 172.15.x.x passes through as public
  assert.equal(getClientIp(headers({ "x-forwarded-for": "172.15.0.1, 10.0.0.1" })), "172.15.0.1");
});

test('192.168.x.x is treated as private', () => {
  assert.equal(getClientIp(headers({ "x-forwarded-for": "192.168.255.255, 203.0.113.4" })), "203.0.113.4");
});

test('::1 (IPv6 loopback) is treated as private', () => {
  assert.equal(getClientIp(headers({ "x-forwarded-for": "::1, 203.0.113.5" })), "203.0.113.5");
});

test('fc00::/7 (IPv6 private) is treated as private', () => {
  assert.equal(getClientIp(headers({ "x-forwarded-for": "fc00::1, 203.0.113.6" })), "203.0.113.6");
  assert.equal(getClientIp(headers({ "x-forwarded-for": "fd00::1, 203.0.113.7" })), "203.0.113.7");
});

// Edge cases
test('all private hops in x-forwarded-for returns unknown', () => {
  assert.equal(
    getClientIp(headers({ "x-forwarded-for": "10.0.0.1, 192.168.1.1, 172.16.0.1" })),
    "unknown"
  );
});

test('x-forwarded-for with no spaces between IPs is parsed correctly', () => {
  assert.equal(getClientIp(headers({ "x-forwarded-for": "203.0.113.1,10.0.0.1,203.0.113.2" })), "203.0.113.2");
});

test('missing both headers returns unknown', () => {
  assert.equal(getClientIp(headers({})), "unknown");
});

test('x-forwarded-for with empty value returns unknown', () => {
  assert.equal(getClientIp(headers({ "x-forwarded-for": "" })), "unknown");
});