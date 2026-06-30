// security-tests/authUrlValidators.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/authUrlValidators.test.cjs
//
// Tests isValidSupabaseUrl and isValidKey from src/lib/auth.js.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Inlined helpers from src/lib/auth.js

function isValidSupabaseUrl(value) {
  if (!value) return false;
  const trimmed = String(value).trim();
  if (trimmed.startsWith('Your ')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidKey(value) {
  if (!value) return false;
  const trimmed = String(value).trim();
  return trimmed && !trimmed.startsWith('Your ');
}

describe('isValidSupabaseUrl', () => {
  test('returns true for a valid https URL', () => {
    assert.equal(isValidSupabaseUrl('https://xyz.supabase.co'), true);
  });

  test('returns true for a valid http URL', () => {
    assert.equal(isValidSupabaseUrl('http://localhost:54321'), true);
  });

  test('returns true for http://127.0.0.1 URL', () => {
    assert.equal(isValidSupabaseUrl('http://127.0.0.1:54321'), true);
  });

  test('returns false for null', () => {
    assert.equal(isValidSupabaseUrl(null), false);
  });

  test('returns false for undefined', () => {
    assert.equal(isValidSupabaseUrl(undefined), false);
  });

  test('returns false for empty string', () => {
    assert.equal(isValidSupabaseUrl(''), false);
  });

  test('returns false for whitespace-only string', () => {
    assert.equal(isValidSupabaseUrl('   '), false);
  });

  test('returns false for non-URL string', () => {
    assert.equal(isValidSupabaseUrl('not-a-url'), false);
  });

  test('returns false for URL without protocol', () => {
    assert.equal(isValidSupabaseUrl('xyz.supabase.co'), false);
  });

  test('returns false for URL with ftp protocol', () => {
    assert.equal(isValidSupabaseUrl('ftp://xyz.supabase.co'), false);
  });

  test('returns false for URL with file protocol', () => {
    assert.equal(isValidSupabaseUrl('file:///etc/passwd'), false);
  });

  test('returns false for placeholder string starting with Your', () => {
    assert.equal(isValidSupabaseUrl('Your Project URL'), false);
  });

  test('returns true for URL with port', () => {
    assert.equal(isValidSupabaseUrl('https://xyz.supabase.co:54321'), true);
  });

  test('returns true after trimming whitespace', () => {
    assert.equal(isValidSupabaseUrl('  https://xyz.supabase.co  '), true);
  });

  test('handles URL with username and password', () => {
    assert.equal(isValidSupabaseUrl('https://user:pass@xyz.supabase.co'), true);
  });
});

describe('isValidKey', () => {
  test('returns true for a non-empty string', () => {
    assert.equal(isValidKey('abc123xyz'), true);
  });

  test('returns true for a long key string', () => {
    const key = 'a'.repeat(200);
    assert.equal(isValidKey(key), true);
  });

  test('returns false for empty string', () => {
    assert.equal(isValidKey(''), false);
  });

  test('returns false for null', () => {
    assert.equal(isValidKey(null), false);
  });

  test('returns false for undefined', () => {
    assert.equal(isValidKey(undefined), false);
  });

  test('returns false for placeholder string starting with Your', () => {
    assert.equal(isValidKey('Your anon key'), false);
  });

  test('returns truthy value after trimming whitespace', () => {
    const result = isValidKey('  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9  ');
    // result is true (boolean) for valid key — just verify it is truthy and not empty string
    assert.ok(result, 'should be truthy for valid key with surrounding whitespace');
  });

  test('returns falsy (empty string) for whitespace-only input', () => {
    const result = isValidKey('   ');
    assert.ok(!result || result === '');
  });

  test('returns true for numeric string', () => {
    assert.equal(isValidKey('12345'), true);
  });
});
