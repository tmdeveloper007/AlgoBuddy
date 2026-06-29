/**
 * Unit tests for CSRF token generation and edge validation.
 * Covers: generateCsrfToken, validateCsrfTokenEdge
 * Uses Node's built-in node:test runner for seamless ESM support.
 */

const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const csrfTokenUrl = pathToFileURL(
  path.join(__dirname, "..", "src", "lib", "csrfToken.js"),
).href;

let generateCsrfToken;
let validateCsrfTokenEdge;

test("csrfToken module loads", async () => {
  const mod = await import(csrfTokenUrl);
  generateCsrfToken = mod.generateCsrfToken;
  validateCsrfTokenEdge = mod.validateCsrfTokenEdge;
  assert.ok(typeof generateCsrfToken === "function");
  assert.ok(typeof validateCsrfTokenEdge === "function");
});

test("generateCsrfToken returns a token with exactly 2 dot-separated parts", async () => {
  const token = await generateCsrfToken();
  assert.ok(typeof token === "string");
  const parts = token.split(".");
  assert.strictEqual(parts.length, 2, "Token must have exactly 2 parts separated by '.'");
});

test("generateCsrfToken randomValue part is 64 hex characters", async () => {
  const token = await generateCsrfToken();
  const [randomValue] = token.split(".");
  assert.strictEqual(randomValue.length, 64, "Random value must be 64 hex chars (32 bytes)");
  assert.ok(/^[0-9a-f]+$/.test(randomValue), "Random value must be lowercase hex");
});

test("generateCsrfToken signature part is 64 hex characters", async () => {
  const token = await generateCsrfToken();
  const [, signature] = token.split(".");
  assert.strictEqual(signature.length, 64, "Signature must be 64 hex chars (32 bytes)");
  assert.ok(/^[0-9a-f]+$/.test(signature), "Signature must be lowercase hex");
});

test("generateCsrfToken produces different values on each call", async () => {
  const token1 = await generateCsrfToken();
  const token2 = await generateCsrfToken();
  assert.notStrictEqual(token1, token2, "Two calls must produce different tokens");
});

test("validateCsrfTokenEdge accepts a valid token", async () => {
  const token = await generateCsrfToken();
  const result = await validateCsrfTokenEdge(token);
  assert.strictEqual(result, true);
});

test("validateCsrfTokenEdge rejects null", async () => {
  const result = await validateCsrfTokenEdge(null);
  assert.strictEqual(result, false);
});

test("validateCsrfTokenEdge rejects undefined", async () => {
  const result = await validateCsrfTokenEdge(undefined);
  assert.strictEqual(result, false);
});

test("validateCsrfTokenEdge rejects empty string", async () => {
  const result = await validateCsrfTokenEdge("");
  assert.strictEqual(result, false);
});

test("validateCsrfTokenEdge rejects a non-string value", async () => {
  const result = await validateCsrfTokenEdge(12345);
  assert.strictEqual(result, false);
  const result2 = await validateCsrfTokenEdge({});
  assert.strictEqual(result2, false);
});

test("validateCsrfTokenEdge rejects a token with no dot", async () => {
  const result = await validateCsrfTokenEdge("notoken");
  assert.strictEqual(result, false);
});

test("validateCsrfTokenEdge rejects a token with too many dots", async () => {
  const result = await validateCsrfTokenEdge("a.b.c");
  assert.strictEqual(result, false);
});

test("validateCsrfTokenEdge rejects a token with wrong signature length", async () => {
  const result = await validateCsrfTokenEdge("a".repeat(64) + ".b".repeat(32));
  assert.strictEqual(result, false);
});

test("validateCsrfTokenEdge rejects a token with non-hex characters", async () => {
  const badToken = "g".repeat(64) + "." + "g".repeat(64);
  const result = await validateCsrfTokenEdge(badToken);
  assert.strictEqual(result, false);
});

test("validateCsrfTokenEdge rejects a tampered token (modified random part)", async () => {
  const token = await generateCsrfToken();
  const [randomPart, sigPart] = token.split(".");
  // Flip one character in the random part
  const tampered = "0" + randomPart.slice(1) + "." + sigPart;
  const result = await validateCsrfTokenEdge(tampered);
  assert.strictEqual(result, false);
});

test("validateCsrfTokenEdge rejects a tampered token (modified signature)", async () => {
  const token = await generateCsrfToken();
  const [randomPart, sigPart] = token.split(".");
  // Flip one character in the signature
  const tampered = randomPart + ".0" + sigPart.slice(1);
  const result = await validateCsrfTokenEdge(tampered);
  assert.strictEqual(result, false);
});
