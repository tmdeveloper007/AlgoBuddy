'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

describe('contact API input validation', () => {
  describe('escapeHtml', () => {
    it('escapes ampersand', () => {
      assert.strictEqual(escapeHtml('a & b'), 'a &amp; b');
    });

    it('escapes less-than and greater-than', () => {
      assert.strictEqual(escapeHtml('<script>alert("xss")</script>'),
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('escapes single quotes', () => {
      assert.strictEqual(escapeHtml("it's a trap"), 'it&#39;s a trap');
    });

    it('returns empty string for null', () => {
      assert.strictEqual(escapeHtml(null), '');
    });

    it('returns empty string for undefined', () => {
      assert.strictEqual(escapeHtml(undefined), '');
    });

    it('handles newlines in message body', () => {
      const escaped = escapeHtml('line1\nline2\nline3');
      assert.strictEqual(escaped.replace(/\n/g, '<br>'), 'line1<br>line2<br>line3');
    });
  });

  describe('isValidEmail', () => {
    it('accepts valid email', () => {
      assert.strictEqual(isValidEmail('test@example.com'), true);
    });

    it('rejects email without @', () => {
      assert.strictEqual(isValidEmail('testexample.com'), false);
    });

    it('rejects email without domain', () => {
      assert.strictEqual(isValidEmail('test@'), false);
    });

    it('rejects email with spaces', () => {
      assert.strictEqual(isValidEmail('test @example.com'), false);
    });

    it('rejects empty string', () => {
      assert.strictEqual(isValidEmail(''), false);
    });

    it('rejects XSS payload in email field', () => {
      assert.strictEqual(isValidEmail('<script>alert(1)</script>'), false);
    });
  });
});
