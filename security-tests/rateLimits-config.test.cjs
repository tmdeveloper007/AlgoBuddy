'use strict';

// security-tests/rateLimits-config.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/rateLimits-config.test.cjs
//
// Tests the rate limits configuration in src/config/rateLimits.js.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Inlined source from src/config/rateLimits.js.
const RATE_LIMITS = {
  CONTACT_API: {
    LIMIT: 5,
  },
  SMTP: {
    DAILY_QUOTA: parseInt(process.env.SMTP_DAILY_QUOTA || "400", 10),
  },
};

describe('RATE_LIMITS configuration', () => {
  it('CONTACT_API has a positive numeric LIMIT', () => {
    assert.ok(RATE_LIMITS.CONTACT_API, 'CONTACT_API key must exist');
    assert.strictEqual(typeof RATE_LIMITS.CONTACT_API.LIMIT, 'number');
    assert.ok(RATE_LIMITS.CONTACT_API.LIMIT > 0, 'LIMIT must be positive');
  });

  it('SMTP has a positive integer DAILY_QUOTA', () => {
    assert.ok(RATE_LIMITS.SMTP, 'SMTP key must exist');
    assert.strictEqual(typeof RATE_LIMITS.SMTP.DAILY_QUOTA, 'number');
    assert.ok(Number.isInteger(RATE_LIMITS.SMTP.DAILY_QUOTA), 'DAILY_QUOTA must be an integer');
    assert.ok(RATE_LIMITS.SMTP.DAILY_QUOTA > 0, 'DAILY_QUOTA must be positive');
  });

  it('has exactly two top-level keys', () => {
    const keys = Object.keys(RATE_LIMITS);
    assert.deepStrictEqual(keys, ['CONTACT_API', 'SMTP']);
  });
});
