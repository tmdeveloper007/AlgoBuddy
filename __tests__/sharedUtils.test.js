// __tests__/sharedUtils.test.js
//
// Run with:  npx jest __tests__/sharedUtils.test.js
//
// Tests the shared utility functions in src/lib/shared-utils.js:
// escapeHtml, isValidHttpUrl, and getSupabaseConfig.

const { escapeHtml, isValidHttpUrl, getSupabaseConfig } = require("../src/lib/shared-utils");

describe("isValidHttpUrl", () => {
  test("returns true for https://example.com", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
  });

  test("returns true for http://example.com", () => {
    expect(isValidHttpUrl("http://example.com")).toBe(true);
  });

  test("returns true for https://example.com:8080/path", () => {
    expect(isValidHttpUrl("https://example.com:8080/path")).toBe(true);
  });

  test("returns false for ftp://example.com", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
  });

  test("returns false for file:///path/to/file", () => {
    expect(isValidHttpUrl("file:///path/to/file")).toBe(false);
  });

  test("returns false for javascript:alert(1)", () => {
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
  });

  test("returns false for malformed strings", () => {
    expect(isValidHttpUrl("not-a-url")).toBe(false);
    expect(isValidHttpUrl("")).toBe(false);
    expect(isValidHttpUrl("://missing-protocol")).toBe(false);
  });
});

describe("escapeHtml", () => {
  test("escapes ampersand to &amp;", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  test("escapes less-than to &lt;", () => {
    expect(escapeHtml("a < b")).toBe("a &lt; b");
  });

  test("escapes greater-than to &gt;", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  test("escapes double quote to &quot;", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  test("escapes single quote to &#39;", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });

  test("escapes all special characters in a mixed string", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  test("returns empty string for empty input", () => {
    expect(escapeHtml("")).toBe("");
  });

  test("returns stringified value for non-string input (String coercion)", () => {
    // String(null) produces "null", not ""
    expect(escapeHtml(null)).toBe("null");
    // String(undefined) produces "undefined"
    expect(escapeHtml(undefined)).toBe("undefined");
    // String(123) produces "123"
    expect(escapeHtml(123)).toBe("123");
  });

  test("re-escapes already-escaped content (simple replace-based escaper)", () => {
    // The simple replace-based escaper does not guard against double-escaping.
    // & in &amp; becomes &amp;amp;
    expect(escapeHtml("a &amp; b")).toBe("a &amp;amp; b");
  });
});

describe("getSupabaseConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("returns null when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getSupabaseConfig } = require("../src/lib/shared-utils");
    expect(getSupabaseConfig()).toBe(null);
  });

  test("returns null when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const { getSupabaseConfig } = require("../src/lib/shared-utils");
    expect(getSupabaseConfig()).toBe(null);
  });

  test("returns null when URL has invalid protocol", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "ftp://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "valid-key";
    const { getSupabaseConfig } = require("../src/lib/shared-utils");
    expect(getSupabaseConfig()).toBe(null);
  });

  test("returns config object with trimmed values when env vars are valid", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "  https://example.supabase.co  ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ";
    const { getSupabaseConfig } = require("../src/lib/shared-utils");
    const config = getSupabaseConfig();
    expect(config).not.toBe(null);
    expect(config.supabaseUrl).toBe("https://example.supabase.co");
    expect(config.supabaseAnonKey).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
  });

  test("replaces localhost: with 127.0.0.1: in URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "key";
    const { getSupabaseConfig } = require("../src/lib/shared-utils");
    expect(getSupabaseConfig().supabaseUrl).toBe("http://127.0.0.1:54321");
  });

  test("includes service key when SUPABASE_SERVICE_KEY is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_KEY = "service-key";
    const { getSupabaseConfig } = require("../src/lib/shared-utils");
    const config = getSupabaseConfig();
    expect(config.supabaseServiceKey).toBe("service-key");
  });

  test("prefers SUPABASE_SERVICE_KEY over SUPABASE_SERVICE_ROLE_KEY when both are set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_KEY = "service-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "role-key";
    const { getSupabaseConfig } = require("../src/lib/shared-utils");
    expect(getSupabaseConfig().supabaseServiceKey).toBe("service-key");
  });

  test("uses SUPABASE_SERVICE_ROLE_KEY when SUPABASE_SERVICE_KEY is not set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.SUPABASE_SERVICE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "role-key";
    const { getSupabaseConfig } = require("../src/lib/shared-utils");
    expect(getSupabaseConfig().supabaseServiceKey).toBe("role-key");
  });
});
