const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadSharedUtils() {
  const url = pathToFileURL(
    path.join(__dirname, "..", "src/lib/shared-utils.js"),
  ).href;
  const mod = await import(url);
  return mod;
}

test("isValidHttpUrl returns true for https URLs", async () => {
  const { isValidHttpUrl } = await loadSharedUtils();

  assert.equal(isValidHttpUrl("https://example.com"), true);
  assert.equal(isValidHttpUrl("https://example.com/path"), true);
  assert.equal(isValidHttpUrl("https://example.com/path?query=1"), true);
  assert.equal(isValidHttpUrl("https://sub.example.com"), true);
  assert.equal(isValidHttpUrl("https://localhost:3000"), true);
  assert.equal(isValidHttpUrl("https://127.0.0.1:8080"), true);
});

test("isValidHttpUrl returns true for http URLs", async () => {
  const { isValidHttpUrl } = await loadSharedUtils();

  assert.equal(isValidHttpUrl("http://example.com"), true);
  assert.equal(isValidHttpUrl("http://localhost"), true);
  assert.equal(isValidHttpUrl("http://192.168.1.1"), true);
});

test("isValidHttpUrl returns false for non-http protocols", async () => {
  const { isValidHttpUrl } = await loadSharedUtils();

  assert.equal(isValidHttpUrl("ftp://example.com"), false);
  assert.equal(isValidHttpUrl("file:///etc/passwd"), false);
  assert.equal(isValidHttpUrl("javascript:alert(1)"), false);
  assert.equal(isValidHttpUrl("data:text/html,<script>alert(1)</script>"), false);
  assert.equal(isValidHttpUrl("mailto:test@example.com"), false);
});

test("isValidHttpUrl returns false for invalid URLs", async () => {
  const { isValidHttpUrl } = await loadSharedUtils();

  assert.equal(isValidHttpUrl("not-a-url"), false);
  assert.equal(isValidHttpUrl("example.com"), false);
  assert.equal(isValidHttpUrl(""), false);
  assert.equal(isValidHttpUrl("   "), false);
  assert.equal(isValidHttpUrl("https:/"), false);
});

test("escapeHtml escapes all special characters", async () => {
  const { escapeHtml } = await loadSharedUtils();

  assert.equal(escapeHtml("<script>"), "&lt;script&gt;");
  assert.equal(escapeHtml("a & b"), "a &amp; b");
  assert.equal(escapeHtml('say "hello"'), "say &quot;hello&quot;");
  assert.equal(escapeHtml("it's fine"), "it&#39;s fine");
  assert.equal(escapeHtml("<>&\"'"), "&lt;&gt;&amp;&quot;&#39;");
});

test("escapeHtml handles empty and plain strings", async () => {
  const { escapeHtml } = await loadSharedUtils();

  assert.equal(escapeHtml(""), "");
  assert.equal(escapeHtml("plain text"), "plain text");
  assert.equal(escapeHtml("already escaped &amp;"), "already escaped &amp;amp;");
  assert.equal(escapeHtml("  spaces  "), "  spaces  ");
});

test("escapeHtml handles numbers and special chars", async () => {
  const { escapeHtml } = await loadSharedUtils();

  assert.equal(escapeHtml(123), "123");
  assert.equal(escapeHtml("a\nb\rc\td"), "a\nb\rc\td");
});

test("escapeHtml handles non-string inputs gracefully", async () => {
  const { escapeHtml } = await loadSharedUtils();

  assert.equal(escapeHtml(null), "null");
  assert.equal(escapeHtml(undefined), "undefined");
  assert.equal(escapeHtml(0), "0");
  assert.equal(escapeHtml(false), "false");
});

test("escapeHtml is called correctly in contact API context", async () => {
  const { escapeHtml } = await loadSharedUtils();

  // Simulates: escapeHtml(trimmedName) used in email HTML
  const name = "John <script>alert('xss')</script>";
  const escaped = escapeHtml(name);
  assert.equal(
    escaped,
    "John &lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
  );
});

test("getSupabaseConfig returns null when env vars are missing", async () => {
  const url = pathToFileURL(
    path.join(__dirname, "..", "src/lib/shared-utils.js"),
  ).href;
  const mod = await import(url);
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const result = mod.getSupabaseConfig();

  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;

  assert.equal(result, null);
});

test("getSupabaseConfig returns null for invalid URL", async () => {
  const url = pathToFileURL(
    path.join(__dirname, "..", "src/lib/shared-utils.js"),
  ).href;
  const mod = await import(url);
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ.test";

  const result = mod.getSupabaseConfig();

  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;

  assert.equal(result, null);
});

test("getSupabaseConfig returns config object with valid env vars", async () => {
  const url = pathToFileURL(
    path.join(__dirname, "..", "src/lib/shared-utils.js"),
  ).href;
  const mod = await import(url);
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://xyz.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ.anon.test";
  delete process.env.SUPABASE_SERVICE_KEY;

  const result = mod.getSupabaseConfig();

  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl || "";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey || "";
  if (originalService) process.env.SUPABASE_SERVICE_KEY = originalService;

  assert.equal(result.supabaseUrl, "https://xyz.supabase.co");
  assert.equal(result.supabaseAnonKey, "eyJ.anon.test");
  assert.equal(result.supabaseServiceKey, undefined);
});

test("getSupabaseConfig normalizes localhost URL to 127.0.0.1", async () => {
  const url = pathToFileURL(
    path.join(__dirname, "..", "src/lib/shared-utils.js"),
  ).href;
  const mod = await import(url);
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ.test";

  const result = mod.getSupabaseConfig();

  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl || "";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey || "";

  assert.equal(
    result.supabaseUrl,
    "http://127.0.0.1:54321",
  );
});

test("getSupabaseConfig includes service key when SUPABASE_SERVICE_KEY is set", async () => {
  const url = pathToFileURL(
    path.join(__dirname, "..", "src/lib/shared-utils.js"),
  ).href;
  const mod = await import(url);
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalService = process.env.SUPABASE_SERVICE_KEY;

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://xyz.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJ.anon.test";
  process.env.SUPABASE_SERVICE_KEY = "eyJ.admin.test";

  const result = mod.getSupabaseConfig();

  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl || "";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey || "";
  if (originalService) {
    process.env.SUPABASE_SERVICE_KEY = originalService;
  } else {
    delete process.env.SUPABASE_SERVICE_KEY;
  }

  assert.equal(result.supabaseServiceKey, "eyJ.admin.test");
});
