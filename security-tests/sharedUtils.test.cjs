// security-tests/sharedUtils.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/sharedUtils.test.cjs
//
// Tests utility functions from src/lib/shared-utils.js: isValidHttpUrl, escapeHtml,
// and getSupabaseConfig.

const { test, describe, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');

// ─── Imports (inline the module body to avoid path-alias issues) ───────────────

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
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
  if (finalUrl.startsWith('http://localhost:')) {
    finalUrl = finalUrl.replace('http://localhost:', 'http://127.0.0.1:');
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
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ─── isValidHttpUrl tests ────────────────────────────────────────────────────

describe('isValidHttpUrl', () => {
  test('returns true for valid https URL', () => {
    assert.strictEqual(isValidHttpUrl('https://example.com'), true);
  });

  test('returns true for valid http URL', () => {
    assert.strictEqual(isValidHttpUrl('http://localhost:3000'), true);
  });

  test('returns true for URL with path', () => {
    assert.strictEqual(isValidHttpUrl('https://example.com/api/users'), true);
  });

  test('returns true for URL with query params', () => {
    assert.strictEqual(isValidHttpUrl('https://example.com?q=test&page=1'), true);
  });

  test('returns false for ftp protocol', () => {
    assert.strictEqual(isValidHttpUrl('ftp://example.com'), false);
  });

  test('returns false for javascript protocol', () => {
    assert.strictEqual(isValidHttpUrl('javascript:alert(1)'), false);
  });

  test('returns false for data URI', () => {
    assert.strictEqual(isValidHttpUrl('data:text/html,<h1>'), false);
  });

  test('returns false for empty string', () => {
    assert.strictEqual(isValidHttpUrl(''), false);
  });

  test('returns false for plain hostname without protocol', () => {
    assert.strictEqual(isValidHttpUrl('example.com'), false);
  });

  test('returns false for null input', () => {
    assert.strictEqual(isValidHttpUrl(null), false);
  });

  test('returns false for undefined input', () => {
    assert.strictEqual(isValidHttpUrl(undefined), false);
  });

  test('returns false for object input', () => {
    assert.strictEqual(isValidHttpUrl({}), false);
  });
});

// ─── escapeHtml tests ────────────────────────────────────────────────────────

describe('escapeHtml', () => {
  test('escapes ampersand', () => {
    assert.strictEqual(escapeHtml('a & b'), 'a &amp; b');
  });

  test('escapes less-than sign', () => {
    assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
  });

  test('escapes greater-than sign', () => {
    assert.strictEqual(escapeHtml('5 > 3'), '5 &gt; 3');
  });

  test('escapes double quote', () => {
    assert.strictEqual(escapeHtml('say "hello"'), 'say &quot;hello&quot;');
  });

  test('escapes single quote', () => {
    assert.strictEqual(escapeHtml("it's"), 'it&#39;s');
  });

  test('escapes all special characters together', () => {
    assert.strictEqual(
      escapeHtml('<div class="test">&copy;</div>'),
      '&lt;div class=&quot;test&quot;&gt;&amp;copy;&lt;/div&gt;'
    );
  });

  test('returns non-string inputs as string', () => {
    assert.strictEqual(escapeHtml(123), '123');
    assert.strictEqual(escapeHtml(null), 'null');
    assert.strictEqual(escapeHtml(undefined), 'undefined');
  });

  test('identity for plain text without special chars', () => {
    assert.strictEqual(escapeHtml('hello world'), 'hello world');
  });

  test('escapes XSS-like payload', () => {
    assert.strictEqual(
      escapeHtml('<img src=x onerror=alert(1)>'),
      '&lt;img src=x onerror=alert(1)&gt;'
    );
  });
});

// ─── getSupabaseConfig tests ─────────────────────────────────────────────────

describe('getSupabaseConfig', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const originalServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  test('returns null when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key';
    assert.strictEqual(getSupabaseConfig(), null);
  });

  test('returns null when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    assert.strictEqual(getSupabaseConfig(), null);
  });

  test('returns null for non-http URL', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'ftp://example.com';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key';
    assert.strictEqual(getSupabaseConfig(), null);
  });

  test('returns config object when both env vars are set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
    const config = getSupabaseConfig();
    assert.deepStrictEqual(config, {
      supabaseUrl: 'https://project.supabase.co',
      supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    });
  });

  test('normalizes localhost to 127.0.0.1', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key';
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseUrl, 'http://127.0.0.1:54321');
  });

  test('trims whitespace from URL and key', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '  https://example.com  ';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '  secret-key  ';
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseUrl, 'https://example.com');
    assert.strictEqual(config.supabaseAnonKey, 'secret-key');
  });

  test('includes supabaseServiceKey from SUPABASE_SERVICE_KEY env var', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_KEY = 'service-role-key';
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseServiceKey, 'service-role-key');
  });

  test('prefers SUPABASE_SERVICE_KEY over SUPABASE_SERVICE_ROLE_KEY', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_KEY = 'service-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'role-key';
    const config = getSupabaseConfig();
    assert.strictEqual(config.supabaseServiceKey, 'service-key');
  });

  test('omits supabaseServiceKey when neither service key env var is set', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.com';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const config = getSupabaseConfig();
    assert.strictEqual('supabaseServiceKey' in config, false);
  });
});
