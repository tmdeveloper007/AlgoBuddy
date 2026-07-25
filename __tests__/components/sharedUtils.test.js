// __tests__/sharedUtils.test.js
//
// Run with:  npx jest __tests__/sharedUtils.test.js
//
// Tests the shared utility functions in src/lib/shared-utils.js.

const { isValidHttpUrl, escapeHtml, getSupabaseConfig } = require("../../src/lib/shared-utils");

describe("isValidHttpUrl", () => {
  test("returns true for valid https URL", () => {
    expect(isValidHttpUrl("https://example.com")).toBe(true);
  });

  test("returns true for valid http URL", () => {
    expect(isValidHttpUrl("http://localhost:3000")).toBe(true);
  });

  test("returns true for URL with path", () => {
    expect(isValidHttpUrl("https://example.com/api/v1/users")).toBe(true);
  });

  test("returns true for URL with query params", () => {
    expect(isValidHttpUrl("https://example.com?foo=bar")).toBe(true);
  });

  test("returns false for FTP URL", () => {
    expect(isValidHttpUrl("ftp://example.com")).toBe(false);
  });

  test("returns false for file URL", () => {
    expect(isValidHttpUrl("file:///etc/passwd")).toBe(false);
  });

  test("returns false for plain hostname without scheme", () => {
    expect(isValidHttpUrl("example.com")).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isValidHttpUrl("")).toBe(false);
  });

  test("returns false for javascript URL", () => {
    expect(isValidHttpUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("escapeHtml", () => {
  test("escapes ampersand", () => {
    expect(escapeHtml("foo & bar")).toBe("foo &amp; bar");
  });

  test("escapes less-than sign", () => {
    expect(escapeHtml("<div>")).toBe("&lt;div&gt;");
  });

  test("escapes greater-than sign", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  test("escapes double quote", () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  test("escapes single quote", () => {
    expect(escapeHtml("it's fine")).toBe("it&#39;s fine");
  });

  test("escapes all special characters together", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  test("returns empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });

  test("returns non-string input as string", () => {
    expect(escapeHtml(123)).toBe("123");
  });
});

describe("getSupabaseConfig", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original env after each test
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  test("returns null when neither URL nor key is set", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(getSupabaseConfig()).toBeNull();
  });

  test("returns null when only URL is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(getSupabaseConfig()).toBeNull();
  });

  test("returns null when only key is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGc...";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(getSupabaseConfig()).toBeNull();
  });

  test("returns null for invalid URL scheme", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "ftp://bad.com";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGc...";
    expect(getSupabaseConfig()).toBeNull();
  });

  test("returns config with anon key when valid", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGc...";
    const config = getSupabaseConfig();
    expect(config).not.toBeNull();
    expect(config.supabaseUrl).toBe("https://abc.supabase.co");
    expect(config.supabaseAnonKey).toBe("eyJhbGc...");
    expect(config.supabaseServiceKey).toBeUndefined();
  });

  test("adds service key when SUPABASE_SERVICE_KEY is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGc...";
    process.env.SUPABASE_SERVICE_KEY = "secret-key";
    const config = getSupabaseConfig();
    expect(config.supabaseServiceKey).toBe("secret-key");
  });

  test("uses SUPABASE_SERVICE_KEY when both keys are set (SUPABASE_SERVICE_KEY takes precedence)", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGc...";
    process.env.SUPABASE_SERVICE_KEY = "key-a";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "key-b";
    const config = getSupabaseConfig();
    expect(config.supabaseServiceKey).toBe("key-a");
  });

  test("falls back to SUPABASE_SERVICE_ROLE_KEY when SUPABASE_SERVICE_KEY is not set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGc...";
    delete process.env.SUPABASE_SERVICE_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "key-b";
    const config = getSupabaseConfig();
    expect(config.supabaseServiceKey).toBe("key-b");
  });

  test("normalizes localhost port from hostname to 127.0.0.1", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGc...";
    const config = getSupabaseConfig();
    expect(config.supabaseUrl).toBe("http://127.0.0.1:54321");
  });

  test("trims whitespace from URL and key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "  https://abc.supabase.co  ";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "  eyJhbGc...  ";
    const config = getSupabaseConfig();
    expect(config.supabaseUrl).toBe("https://abc.supabase.co");
    expect(config.supabaseAnonKey).toBe("eyJhbGc...");
  });
});
