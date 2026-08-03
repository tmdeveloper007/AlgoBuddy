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

function validateRating(rating) {
  const ratingNum = Number(rating);
  return Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5;
}

describe('send-review API input validation', () => {
  describe('escapeHtml', () => {
    it('escapes script tag XSS payload', () => {
      assert.strictEqual(
        escapeHtml('<script>alert("xss")</script>'),
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('escapes ampersand', () => {
      assert.strictEqual(escapeHtml('Tom & Jerry'), 'Tom &amp; Jerry');
    });

    it('returns empty string for null', () => {
      assert.strictEqual(escapeHtml(null), '');
    });
  });

  describe('isValidEmail', () => {
    it('accepts valid email', () => {
      assert.strictEqual(isValidEmail('user@domain.com'), true);
    });

    it('rejects missing @', () => {
      assert.strictEqual(isValidEmail('invalid-email'), false);
    });

    it('rejects empty string', () => {
      assert.strictEqual(isValidEmail(''), false);
    });
  });

  describe('validateRating', () => {
    it('accepts rating 1 through 5', () => {
      for (let r = 1; r <= 5; r++) {
        assert.strictEqual(validateRating(r), true, `rating ${r} should be valid`);
      }
    });

    it('rejects rating below 1', () => {
      assert.strictEqual(validateRating(0), false);
      assert.strictEqual(validateRating(-1), false);
    });

    it('rejects rating above 5', () => {
      assert.strictEqual(validateRating(6), false);
      assert.strictEqual(validateRating(100), false);
    });

    it('rejects non-integer floats', () => {
      assert.strictEqual(validateRating(3.5), false);
      assert.strictEqual(validateRating(2.9), false);
    });

    it('rejects string values outside range', () => {
      assert.strictEqual(validateRating('10'), false);
      assert.strictEqual(validateRating('-1'), false);
    });

    it('rejects non-numeric strings', () => {
      assert.strictEqual(validateRating('abc'), false);
    });
  });
});
