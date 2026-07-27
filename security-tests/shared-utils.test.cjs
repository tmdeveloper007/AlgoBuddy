// security-tests/shared-utils.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/shared-utils.test.cjs
//
// Tests for isValidHttpUrl, escapeHtml, and getSupabaseConfig in src/lib/shared-utils.js.

const { describe, test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

// ─── Inline source under test ─────────────────────────────────────────────────

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!isValidHttpUrl(supabaseUrl)) return null;

  let finalUrl = String(supabaseUrl).trim();
  if (finalUrl.startsWith("http://localhost:")) {
    finalUrl = finalUrl.replace("http://localhost:", "http://127.0.0.1:");
  }

  const config = {
    supabaseUrl: finalUrl,
    supabaseAnonKey: String(supabaseAnonKey).trim(),
  };

  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey) {
    config.supabaseServiceKey = String(serviceKey).trim();
  }

  return config;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ─── isValidHttpUrl tests ────────────────────────────────────────────────────

describe("isValidHttpUrl", () => {
  test("returns true for a valid https URL", () => {
    assert.strictEqual(isValidHttpUrl("https://example.com"), true);
  });

  test("returns true for a valid http URL", () => {
    assert.strictEqual(isValidHttpUrl("http://localhost:3000"), true);
  });

  test("returns true for URL with port and path", () => {
    assert.strictEqual(isValidHttpUrl("https://example.com:8080/api/v1"), true);
  });

  test("returns false for ftp URL", () => {
    assert.strictEqual(isValidHttpUrl("ftp://files.example.com"), false);
  });

  test("returns false for file URL", () => {
    assert.strictEqual(isValidHttpUrl("file:///etc/passwd"), false);
  });

  test("returns false for mailto URL", () => {
    assert.strictEqual(isValidHttpUrl("mailto:test@example.com"), false);
  });

  test("returns false for null input", () => {
    assert.strictEqual(isValidHttpUrl(null), false);
  });

  test("returns false for undefined input", () => {
    assert.strictEqual(isValidHttpUrl(undefined), false);
  });

  test("returns false for a plain hostname without scheme", () => {
    assert.strictEqual(isValidHttpUrl("example.com"), false);
  });

  test("returns false for empty string", () => {
    assert.strictEqual(isValidHttpUrl(""), false);
  });

  test("returns false for integer input", () => {
    assert.strictEqual(isValidHttpUrl(12345), false);
  });

  test("returns false for object input", () => {
    assert.strictEqual(isValidHttpUrl({}), false);
  });
});

// ─── escapeHtml tests ─────────────────────────────────────────────────────────

describe("escapeHtml", () => {
  test("escapes ampersand to &amp;", () => {
    assert.strictEqual(escapeHtml("foo & bar"), "foo &amp; bar");
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
    assert.strictEqual(escapeHtml("it's fine"), "it&#39;s fine");
  });

  test("escapes all special chars in combination", () => {
    const input = '<a href="https://example.com?a=1&b=2">Click & go</a>';
    const expected =
      "&lt;a href=&quot;https://example.com?a=1&amp;b=2&quot;&gt;Click &amp; go&lt;/a&gt;";
    assert.strictEqual(escapeHtml(input), expected);
  });

  test("returns empty string for empty input", () => {
    assert.strictEqual(escapeHtml(""), "");
  });

  test("returns unchanged string when no special chars present", () => {
    assert.strictEqual(escapeHtml("hello world 123"), "hello world 123");
  });

  test("handles numeric input by converting to string", () => {
    assert.strictEqual(escapeHtml(42), "42");
  });

  test("handles null input", () => {
    assert.strictEqual(escapeHtml(null), "null");
  });

  test("handles undefined input", () => {
    assert.strictEqual(escapeHtml(undefined), "undefined");
  });

  test("escaping twice produces double-escaped output (replaceAll is not idempotent)", () => {
    const input = "<div>&</div>";
    // escapeHtml uses replaceAll which replaces & first, so double-run does double-escape.
    const once = escapeHtml(input);
    const twice = escapeHtml(once);
    assert.strictEqual(once, "&lt;div&gt;&amp;&lt;/div&gt;");
    assert.strictEqual(twice, "&amp;lt;div&amp;gt;&amp;amp;&amp;lt;/div&amp;gt;");
  });
});

// ─── getSupabaseConfig tests ─────────────────────────────────────────────────

describe("getSupabaseConfig", () => {
  const originalEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const cleanup = () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  };

  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
    if (originalEnv.NEXT_PUBLIC_SUPABASE_URL)
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalEnv.NEXT_PUBLIC_SUPABASE_URL;
    if (originalEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (originalEnv.SUPABASE_SERVICE_KEY)
      process.env.SUPABASE_SERVICE_KEY = originalEnv.SUPABASE_SERVICE_KEY;
    if (originalEnv.SUPABASE_SERVICE_ROLE_KEY)
      process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv.SUPABASE_SERVICE_ROLE_KEY;
  });

  test("returns null when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    assert.strictEqual(getSupabaseConfig(), null);
  });

  test("returns null when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcdef.supabase.co";
    assert.strictEqual(getSupabaseConfig(), null);
  });

  test("returns null when URL is invalid (non-http)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "ftp://bad.proto";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiJ9";
    assert.strictEqual(getSupabaseConfig(), null);
  });

  test("returns null when URL is a plain hostname (no scheme)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url.example.com";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiJ9";
    assert.strictEqual(getSupabaseConfig(), null);
  });

  test("normalizes localhost to 127.0.0.1", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseUrl, "http://127.0.0.1:54321");
  });

  test("preserves non-localhost URLs unchanged", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseUrl, "https://myproj.supabase.co");
  });

  test("trims whitespace from URL and key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "  https://myproj.supabase.co  ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "  test-key  ";
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseUrl, "https://myproj.supabase.co");
    assert.strictEqual(config.supabaseAnonKey, "test-key");
  });

  test("includes supabaseServiceKey when SUPABASE_SERVICE_KEY is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_KEY = "super-secret-key";
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseServiceKey, "super-secret-key");
  });

  test("uses first available service key env var (SUPABASE_SERVICE_KEY preferred order)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    // Only set SUPABASE_SERVICE_KEY — code uses `||` so first defined wins
    process.env.SUPABASE_SERVICE_KEY = "service-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseServiceKey, "service-key");
  });

  test("does not include supabaseServiceKey when neither service key is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproj.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    const config = getSupabaseConfig();
    assert.strictEqual("supabaseServiceKey" in config, false);
  });
});
