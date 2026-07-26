// security-tests/sharedUtils.test.cjs
const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

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

describe("isValidHttpUrl", () => {
  test("returns true for valid https:// URL", () => {
    assert.strictEqual(isValidHttpUrl("https://example.com"), true);
  });
  test("returns true for valid http:// URL", () => {
    assert.strictEqual(isValidHttpUrl("http://localhost:3000"), true);
  });
  test("returns true for https URL with path and query", () => {
    assert.strictEqual(isValidHttpUrl("https://example.com/path?key=val#anchor"), true);
  });
  test("returns false for non-http protocol", () => {
    assert.strictEqual(isValidHttpUrl("ftp://example.com"), false);
    assert.strictEqual(isValidHttpUrl("file:///etc/passwd"), false);
    assert.strictEqual(isValidHttpUrl("javascript:alert(1)"), false);
  });
  test("returns false for malformed URL", () => {
    assert.strictEqual(isValidHttpUrl("not a url"), false);
    assert.strictEqual(isValidHttpUrl(""), false);
    assert.strictEqual(isValidHttpUrl("http://"), false);
  });
  test("returns false for null or undefined", () => {
    assert.strictEqual(isValidHttpUrl(null), false);
    assert.strictEqual(isValidHttpUrl(undefined), false);
  });
});

describe("escapeHtml", () => {
  test("escapes ampersand to &amp;", () => {
    assert.strictEqual(escapeHtml("a & b"), "a &amp; b");
  });
  test("escapes less-than to &lt;", () => {
    assert.strictEqual(escapeHtml("<script>"), "&lt;script&gt;");
  });
  test("escapes greater-than to &gt;", () => {
    assert.strictEqual(escapeHtml("a > b"), "a &gt; b");
  });
  test("escapes double quote to &quot;", () => {
    assert.strictEqual(escapeHtml('say "hello"'), "say &quot;hello&quot;");
  });
  test("escapes single quote to &#39;", () => {
    assert.strictEqual(escapeHtml("it's"), "it&#39;s");
  });
  test("escapes all special characters together", () => {
    const input = '<script>alert("XSS & \'injection\')</script>';
    const expected = "&lt;script&gt;alert(&quot;XSS &amp; &#39;injection&#39;)&lt;/script&gt;";
    assert.strictEqual(escapeHtml(input), expected);
  });
  test("returns plain text unchanged", () => {
    assert.strictEqual(escapeHtml("hello world"), "hello world");
    assert.strictEqual(escapeHtml("123"), "123");
  });
  test("coerces non-string input to string before escaping", () => {
    assert.strictEqual(escapeHtml(42), "42");
    assert.strictEqual(escapeHtml(true), "true");
  });
});
