// __tests__/sharedUtils.test.js
//
// Run with:  npx jest __tests__/sharedUtils.test.js --colors=false
//
// Tests for src/lib/shared-utils.js: isValidHttpUrl and escapeHtml.

import { isValidHttpUrl, escapeHtml } from "../../src/lib/shared-utils.js";

describe("isValidHttpUrl", () => {
  test("returns true for a valid http URL", () => {
    expect(isValidHttpUrl("http://example.com")).toBe(true);
    expect(isValidHttpUrl("http://example.com/path")).toBe(true);
    expect(isValidHttpUrl("http://example.com:8080/path")).toBe(true);
    expect(isValidHttpUrl("http://user:pass@example.com")).toBe(true);
  });

  test("returns true for a valid https URL", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
    expect(isValidHttpUrl("https://example.com/path?query=1")).toBe(true);
    expect(isValidHttpUrl("https://sub.example.com")).toBe(true);
    expect(isValidHttpUrl("https://example.com:443/path")).toBe(true);
  });

  test("returns false for URLs without a scheme", () => {
    expect(isValidHttpUrl("example.com")).toBe(false);
    expect(isValidHttpUrl("//example.com")).toBe(false);
    expect(isValidHttpUrl("/path/to/resource")).toBe(false);
  });

  test("returns false for non-http protocols", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
    expect(isValidHttpUrl("file:///etc/passwd")).toBe(false);
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isValidHttpUrl("data:text/html,<h1>x</h1>")).toBe(false);
  });

  test("returns false for non-string inputs", () => {
    expect(isValidHttpUrl(null)).toBe(false);
    expect(isValidHttpUrl(undefined)).toBe(false);
    expect(isValidHttpUrl(123)).toBe(false);
    expect(isValidHttpUrl({})).toBe(false);
    expect(isValidHttpUrl([])).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isValidHttpUrl("")).toBe(false);
  });

  test("returns false for URLs with only whitespace", () => {
    expect(isValidHttpUrl("   ")).toBe(false);
  });
});

describe("escapeHtml", () => {
  test("escapes ampersand", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
    expect(escapeHtml("&&&")).toBe("&amp;&amp;&amp;");
  });

  test("escapes less-than and greater-than", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
  });

  test("escapes double quotes", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
    expect(escapeHtml('a="value"')).toBe("a=&quot;value&quot;");
  });

  test("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
    expect(escapeHtml("don't")).toBe("don&#39;t");
  });

  test("escapes all entities in a typical XSS payload", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
  });

  test("returns the input unchanged when no special chars present", () => {
    expect(escapeHtml("hello world")).toBe("hello world");
    expect(escapeHtml("abc123")).toBe("abc123");
    expect(escapeHtml("simple text")).toBe("simple text");
  });

  test("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  test("coerces non-string inputs to string", () => {
    expect(escapeHtml(123)).toBe("123");
    expect(escapeHtml(true)).toBe("true");
    expect(escapeHtml(null)).toBe("null");
    expect(escapeHtml(undefined)).toBe("undefined");
  });
});
