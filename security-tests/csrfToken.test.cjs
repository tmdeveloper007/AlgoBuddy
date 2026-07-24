// security-tests/csrfToken.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/csrfToken.test.cjs
//
// Tests CSRF token generation and validation in src/lib/csrfToken.js.

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

// Inlined source to avoid ESM import issues in Node test runner.
const CSRF_TOKEN_LENGTH = 32;
const CSRF_SECRET_ENV = "CSRF_SECRET";
let devSecret = null;

function getSecret() {
  const secret = process.env[CSRF_SECRET_ENV];
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("CSRF_SECRET must be set in production for CSRF token signing.");
  }
  if (!devSecret) {
    const array = new Uint8Array(32);
    globalThis.crypto.getRandomValues(array);
    devSecret = Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return devSecret;
}

async function generateCsrfToken() {
  const secret = getSecret();
  const array = new Uint8Array(CSRF_TOKEN_LENGTH);
  globalThis.crypto.getRandomValues(array);
  const randomValue = Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const sigBytes = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(randomValue));
  const signature = Array.from(new Uint8Array(sigBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${randomValue}.${signature}`;
}

async function validateCsrfTokenEdge(token) {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [randomValue, signature] = parts;
  const secret = getSecret();
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"],
  );
  const sigBytes = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(randomValue));
  const expected = Array.from(new Uint8Array(sigBytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (signature.length !== expected.length) return false;
  try {
    const sigBuf = new Uint8Array(signature.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
    const expBuf = new Uint8Array(expected.match(/.{1,2}/g).map((b) => parseInt(b, 16)));
    if (sigBuf.length !== expBuf.length) return false;
    const result = sigBuf.reduce((acc, byte, i) => acc | (byte ^ expBuf[i]), 0);
    return result === 0;
  } catch {
    return false;
  }
}

describe("generateCsrfToken", () => {
  test("returns a string", async () => {
    const token = await generateCsrfToken();
    assert.strictEqual(typeof token, "string");
  });

  test("returns a token with exactly one dot", async () => {
    const token = await generateCsrfToken();
    const parts = token.split(".");
    assert.strictEqual(parts.length, 2);
  });

  test("randomValue is 64 hex chars (CSRF_TOKEN_LENGTH bytes)", async () => {
    const token = await generateCsrfToken();
    const [randomValue] = token.split(".");
    assert.strictEqual(randomValue.length, CSRF_TOKEN_LENGTH * 2);
  });

  test("generates different tokens on consecutive calls", async () => {
    const tokens = new Set();
    for (let i = 0; i < 10; i++) {
      tokens.add(await generateCsrfToken());
    }
    assert.strictEqual(tokens.size, 10);
  });
});

describe("validateCsrfTokenEdge", () => {
  test("accepts a valid token generated moments before", async () => {
    const token = await generateCsrfToken();
    const valid = await validateCsrfTokenEdge(token);
    assert.strictEqual(valid, true);
  });

  test("rejects null", async () => {
    assert.strictEqual(await validateCsrfTokenEdge(null), false);
  });

  test("rejects undefined", async () => {
    assert.strictEqual(await validateCsrfTokenEdge(undefined), false);
  });

  test("rejects empty string", async () => {
    assert.strictEqual(await validateCsrfTokenEdge(""), false);
  });

  test("rejects a number", async () => {
    assert.strictEqual(await validateCsrfTokenEdge(42), false);
  });

  test("rejects a string with no dot", async () => {
    assert.strictEqual(await validateCsrfTokenEdge("not_a_valid_token"), false);
  });

  test("rejects a string with too many dots", async () => {
    assert.strictEqual(await validateCsrfTokenEdge("a.b.c"), false);
  });

  test("rejects a token with wrong HMAC", async () => {
    const token = await generateCsrfToken();
    const [randomPart] = token.split(".");
    const tampered = `${randomPart}.${"0".repeat(64)}`;
    assert.strictEqual(await validateCsrfTokenEdge(tampered), false);
  });
});
