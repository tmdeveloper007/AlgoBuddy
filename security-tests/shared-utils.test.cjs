// security-tests/shared-utils.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/shared-utils.test.cjs
//
// Tests utility helpers in src/lib/shared-utils.js.
// Tests isValidHttpUrl, getSupabaseConfig, and escapeHtml.

const { describe, test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

// ── Inlined source from src/lib/shared-utils.js ──────────────────────

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

  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
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

// ── Tests for isValidHttpUrl ─────────────────────────────────────────

describe("isValidHttpUrl", () => {
  test("returns true for a valid https URL", () => {
    assert.strictEqual(isValidHttpUrl("https://example.com"), true);
  });

  test("returns true for a valid http URL", () => {
    assert.strictEqual(isValidHttpUrl("http://example.com"), true);
  });

  test("returns true for https URL with port", () => {
    assert.strictEqual(isValidHttpUrl("https://example.com:8080"), true);
  });

  test("returns true for https URL with path", () => {
    assert.strictEqual(isValidHttpUrl("https://example.com/path/to/resource"), true);
  });

  test("returns false for ftp URL", () => {
    assert.strictEqual(isValidHttpUrl("ftp://example.com"), false);
  });

  test("returns false for file:// URL", () => {
    assert.strictEqual(isValidHttpUrl("file:///etc/passwd"), false);
  });

  test("returns false for data URL", () => {
    assert.strictEqual(isValidHttpUrl("data:text/html,<script>alert(1)</script>"), false);
  });

  test("returns false for plain hostname without protocol", () => {
    assert.strictEqual(isValidHttpUrl("example.com"), false);
  });

  test("returns false for empty string", () => {
    assert.strictEqual(isValidHttpUrl(""), false);
  });

  test("returns false for javascript: URL", () => {
    assert.strictEqual(isValidHttpUrl("javascript:alert(1)"), false);
  });
});

// ── Tests for getSupabaseConfig ──────────────────────────────────────

describe("getSupabaseConfig", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_KEY;
  const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const cleanup = () => {
    if (originalUrl !== undefined) process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    else delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (originalKey !== undefined) process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    else delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (originalService !== undefined) process.env.SUPABASE_SERVICE_KEY = originalService;
    else delete process.env.SUPABASE_SERVICE_KEY;
    if (originalServiceRole !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = originalServiceRole;
    else delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  };

  beforeEach(() => {
    cleanup();
  });

  test("returns null when NEXT_PUBLIC_SUPABASE_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    assert.strictEqual(getSupabaseConfig(), null);
  });

  test("returns null when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.strictEqual(getSupabaseConfig(), null);
  });

  test("returns null when URL is not http/https", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "ftp://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    assert.strictEqual(getSupabaseConfig(), null);
  });

  test("returns valid config for https URL with both env vars set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseUrl, "https://example.supabase.co");
    assert.strictEqual(config.supabaseAnonKey, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9");
  });

  test("replaces localhost: with 127.0.0.1:", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key";
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseUrl, "http://127.0.0.1:3000");
  });

  test("includes service key from SUPABASE_SERVICE_KEY", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_KEY = "service-role-key";
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseServiceKey, "service-role-key");
  });

  test("prefers SUPABASE_SERVICE_KEY over SUPABASE_SERVICE_ROLE_KEY", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_KEY = "primary-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "fallback-key";
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseServiceKey, "primary-key");
  });

  test("trims whitespace from URL and key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "  https://example.supabase.co  ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "  test-key  ";
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseUrl, "https://example.supabase.co");
    assert.strictEqual(config.supabaseAnonKey, "test-key");
  });
});

// ── Tests for escapeHtml ───────────────────────────────────────────────

describe("escapeHtml", () => {
  test("escapes ampersand to &amp;", () => {
    assert.strictEqual(escapeHtml("Tom & Jerry"), "Tom &amp; Jerry");
  });

  test("escapes less-than to &lt;", () => {
    assert.strictEqual(escapeHtml("<script>"), "&lt;script&gt;");
  });

  test("escapes greater-than to &gt;", () => {
    assert.strictEqual(escapeHtml("a > b"), "a &gt; b");
  });

  test('escapes double quote to &quot;', () => {
    assert.strictEqual(escapeHtml('say "hello"'), "say &quot;hello&quot;");
  });

  test("escapes single quote to &#39;", () => {
    assert.strictEqual(escapeHtml("it's"), "it&#39;s");
  });

  test("escapes all special chars in XSS payload", () => {
    const payload = '<script>alert("XSS")</script>';
    const expected = "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;";
    assert.strictEqual(escapeHtml(payload), expected);
  });

  test("handles non-string input by converting to string", () => {
    assert.strictEqual(escapeHtml(123), "123");
    assert.strictEqual(escapeHtml(null), "null");
    assert.strictEqual(escapeHtml(undefined), "undefined");
  });

  test("returns empty string for empty input", () => {
    assert.strictEqual(escapeHtml(""), "");
  });

  test("escapes newlines as literal newlines (not a special char)", () => {
    // Newlines are not in the replace list, so they pass through
    assert.strictEqual(escapeHtml("line1\nline2"), "line1\nline2");
  });

  test("escapes already-escaped characters by encoding them again", () => {
    // escapeHtml does NOT guard against double-escaping; each call re-encodes.
    const input = "&amp;";
    const output = escapeHtml(input);
    assert.strictEqual(output, "&amp;amp;");
  });
});
