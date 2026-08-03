'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const ALLOWED_TYPES = ['site_visit', 'module_view', 'quiz_attempt', 'bookmark'];

function validateActivityInput(userId, type) {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return { valid: false, reason: 'invalid userId' };
  }
  if (!type || typeof type !== 'string' || type.trim().length === 0) {
    return { valid: false, reason: 'invalid type' };
  }
  return { valid: true };
}

describe('trackActivity input validation', () => {
  describe('validateActivityInput', () => {
    it('accepts valid userId and type', () => {
      assert.strictEqual(validateActivityInput('user-123', 'site_visit').valid, true);
    });

    it('rejects null userId', () => {
      assert.strictEqual(validateActivityInput(null, 'site_visit').valid, false);
      assert.strictEqual(validateActivityInput(null, 'site_visit').reason, 'invalid userId');
    });

    it('rejects empty string userId', () => {
      assert.strictEqual(validateActivityInput('', 'site_visit').valid, false);
      assert.strictEqual(validateActivityInput('', 'site_visit').reason, 'invalid userId');
    });

    it('rejects whitespace-only userId', () => {
      assert.strictEqual(validateActivityInput('   ', 'site_visit').valid, false);
    });

    it('rejects non-string userId', () => {
      assert.strictEqual(validateActivityInput(12345, 'site_visit').valid, false);
      assert.strictEqual(validateActivityInput({}, 'site_visit').valid, false);
      assert.strictEqual(validateActivityInput([], 'site_visit').valid, false);
    });

    it('rejects null type', () => {
      assert.strictEqual(validateActivityInput('user-123', null).valid, false);
      assert.strictEqual(validateActivityInput('user-123', null).reason, 'invalid type');
    });

    it('rejects empty string type', () => {
      assert.strictEqual(validateActivityInput('user-123', '').valid, false);
    });

    it('rejects whitespace-only type', () => {
      assert.strictEqual(validateActivityInput('user-123', '  ').valid, false);
    });

    it('rejects non-string type', () => {
      assert.strictEqual(validateActivityInput('user-123', 42).valid, false);
      assert.strictEqual(validateActivityInput('user-123', undefined).valid, false);
    });

    it('ALLOWED_TYPES includes expected values', () => {
      assert.ok(ALLOWED_TYPES.includes('site_visit'));
      assert.ok(ALLOWED_TYPES.includes('module_view'));
      assert.ok(ALLOWED_TYPES.includes('quiz_attempt'));
      assert.ok(ALLOWED_TYPES.includes('bookmark'));
    });
  });
});
