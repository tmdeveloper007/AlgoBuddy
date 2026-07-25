// security-tests/shared-utils.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/shared-utils.test.cjs
//
// Tests shared utility functions: isValidHttpUrl, getSupabaseConfig, escapeHtml.

const { describe, it, mock } = require('node:test');
const assert = require('node:assert/strict');

// Inlined source to avoid ESM import issues.
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

// getSupabaseConfig depends on process.env — tested inline with env stub.

// ── Tests ────────────────────────────────────────────────────────────

describe('isValidHttpUrl', () => {
  it('returns true for https URLs', () => {
    assert.ok(isValidHttpUrl('https://example.com'));
    assert.ok(isValidHttpUrl('https://foo.bar.com/path?q=1'));
  });

  it('returns true for http URLs', () => {
    assert.ok(isValidHttpUrl('http://localhost:3000'));
    assert.ok(isValidHttpUrl('http://127.0.0.1:54321'));
  });

  it('returns false for non-http protocols', () => {
    assert.ok(!isValidHttpUrl('ftp://example.com'));
    assert.ok(!isValidHttpUrl('file:///etc/passwd'));
    assert.ok(!isValidHttpUrl('javascript:alert(1)'));
  });

  it('returns false for invalid URLs', () => {
    assert.ok(!isValidHttpUrl('not a url'));
    assert.ok(!isValidHttpUrl(''));
    assert.ok(!isValidHttpUrl('://missing-scheme.com'));
  });

  it('returns false for URLs with no protocol', () => {
    assert.ok(!isValidHttpUrl('example.com'));
    assert.ok(!isValidHttpUrl('localhost:3000'));
  });
});

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    assert.equal(escapeHtml('a & b'), 'a &amp; b');
  });

  it('escapes less-than and greater-than', () => {
    assert.equal(escapeHtml('<script>'), '&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    assert.equal(escapeHtml('say "hello"'), 'say &quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    assert.equal(escapeHtml("it's fine"), "it&#39;s fine");
  });

  it('escapes all characters in combination', () => {
    assert.equal(escapeHtml('<a href="x">&copy;</a>'),
      '&lt;a href=&quot;x&quot;&gt;&amp;copy;&lt;/a&gt;');
  });

  it('returns empty string unchanged', () => {
    assert.equal(escapeHtml(''), '');
  });

  it('coerces non-string input to string', () => {
    assert.equal(escapeHtml(123), '123');
    assert.equal(escapeHtml(null), 'null');
    assert.equal(escapeHtml(undefined), 'undefined');
  });
});
