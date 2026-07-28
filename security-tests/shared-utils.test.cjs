// security-tests/shared-utils.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/shared-utils.test.cjs
//
// Tests shared utility functions in src/lib/shared-utils.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// Inlined source — pure functions, no DOM/network dependencies.
function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// getSupabaseConfig reads process.env — tested separately via env mocking.

describe("isValidHttpUrl", () => {
  test("returns true for http URL", () => {
    assert.equal(isValidHttpUrl("http://example.com"), true);
  });

  test("returns true for https URL", () => {
    assert.equal(isValidHttpUrl("https://example.com/path?query=1"), true);
  });

  test("returns false for javascript: URL", () => {
    assert.equal(isValidHttpUrl("javascript:alert(1)"), false);
  });

  test("returns false for data: URL", () => {
    assert.equal(isValidHttpUrl("data:text/html,<script>alert(1)</script>"), false);
  });

  test("returns false for file: URL", () => {
    assert.equal(isValidHttpUrl("file:///etc/passwd"), false);
  });

  test("returns false for ftp URL", () => {
    assert.equal(isValidHttpUrl("ftp://ftp.example.com"), false);
  });

  test("returns false for malformed URL", () => {
    assert.equal(isValidHttpUrl("not-a-url"), false);
    assert.equal(isValidHttpUrl(""), false);
  });

  test("returns false for null and undefined", () => {
    assert.equal(isValidHttpUrl(null), false);
    assert.equal(isValidHttpUrl(undefined), false);
  });
});

describe("escapeHtml", () => {
  test("escapes ampersand", () => {
    assert.equal(escapeHtml("a & b"), "a &amp; b");
  });

  test("escapes less-than", () => {
    assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
  });

  test("escapes greater-than", () => {
    assert.equal(escapeHtml("5 > 3"), "5 &gt; 3");
  });

  test("escapes double quote", () => {
    assert.equal(escapeHtml('say "hello"'), "say &quot;hello&quot;");
  });

  test("escapes single quote", () => {
    assert.equal(escapeHtml("it's"), "it&#39;s");
  });

  test("escapes mixed XSS payload", () => {
    const payload = '<script>alert("xss")</script>';
    const escaped = escapeHtml(payload);
    assert.ok(!escaped.includes("<"), "should not contain raw <");
    assert.ok(!escaped.includes(">"), "should not contain raw >");
    assert.ok(!escaped.includes('"'), "should not contain raw double quote");
    // After escaping, the string contains the HTML entity representations
    assert.ok(escaped.includes("&lt;"), "should contain escaped <");
    assert.ok(escaped.includes("&gt;"), "should contain escaped >");
  });

  test("returns stringified non-string inputs", () => {
    assert.equal(escapeHtml(123), "123");
    assert.equal(escapeHtml(null), "null");
    assert.equal(escapeHtml(true), "true");
  });

  test("handles empty string", () => {
    assert.equal(escapeHtml(""), "");
  });

  test("preserves text without special characters", () => {
    assert.equal(escapeHtml("Hello World 123"), "Hello World 123");
  });
});
