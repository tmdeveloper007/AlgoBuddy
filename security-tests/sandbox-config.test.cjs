// security-tests/sandbox-config.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/sandbox-config.test.cjs
//
// Tests the sandbox resource limit configuration exported from src/lib/sandbox/sandbox.config.js.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const SANDBOX_CONFIG = require('../src/lib/sandbox/sandbox.config.js');

describe('SANDBOX_CONFIG structure', () => {
  test('exports an object', () => {
    assert.strictEqual(typeof SANDBOX_CONFIG, 'object');
    assert.ok(!Array.isArray(SANDBOX_CONFIG));
  });

  test('has all required keys', () => {
    assert.ok('MAX_TIMEOUT_MS' in SANDBOX_CONFIG);
    assert.ok('MAX_MEMORY_MB' in SANDBOX_CONFIG);
    assert.ok('MAX_OUTPUT_LENGTH' in SANDBOX_CONFIG);
    assert.ok('RATE_LIMIT_MAX_REQUESTS' in SANDBOX_CONFIG);
    assert.ok('RATE_LIMIT_WINDOW_SEC' in SANDBOX_CONFIG);
  });

  test('has exactly 5 keys', () => {
    assert.strictEqual(Object.keys(SANDBOX_CONFIG).length, 5);
  });
});

describe('numeric value sanity', () => {
  test('MAX_TIMEOUT_MS is a positive integer', () => {
    const val = SANDBOX_CONFIG.MAX_TIMEOUT_MS;
    assert.strictEqual(typeof val, 'number');
    assert.ok(Number.isInteger(val), 'MAX_TIMEOUT_MS should be an integer');
    assert.ok(val > 0, 'MAX_TIMEOUT_MS should be positive');
    assert.ok(val <= 60_000, 'MAX_TIMEOUT_MS should not exceed 60 seconds (human sanity)');
  });

  test('MAX_MEMORY_MB is a positive integer', () => {
    const val = SANDBOX_CONFIG.MAX_MEMORY_MB;
    assert.strictEqual(typeof val, 'number');
    assert.ok(Number.isInteger(val), 'MAX_MEMORY_MB should be an integer');
    assert.ok(val > 0, 'MAX_MEMORY_MB should be positive');
    assert.ok(val <= 1024, 'MAX_MEMORY_MB should not exceed 1 GB (human sanity)');
  });

  test('MAX_OUTPUT_LENGTH is a positive integer', () => {
    const val = SANDBOX_CONFIG.MAX_OUTPUT_LENGTH;
    assert.strictEqual(typeof val, 'number');
    assert.ok(Number.isInteger(val), 'MAX_OUTPUT_LENGTH should be an integer');
    assert.ok(val > 0, 'MAX_OUTPUT_LENGTH should be positive');
  });

  test('RATE_LIMIT_MAX_REQUESTS is a positive integer', () => {
    const val = SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS;
    assert.strictEqual(typeof val, 'number');
    assert.ok(Number.isInteger(val), 'RATE_LIMIT_MAX_REQUESTS should be an integer');
    assert.ok(val > 0, 'RATE_LIMIT_MAX_REQUESTS should be positive');
    assert.ok(val <= 1000, 'RATE_LIMIT_MAX_REQUESTS should be reasonable');
  });

  test('RATE_LIMIT_WINDOW_SEC is a positive integer', () => {
    const val = SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC;
    assert.strictEqual(typeof val, 'number');
    assert.ok(Number.isInteger(val), 'RATE_LIMIT_WINDOW_SEC should be an integer');
    assert.ok(val > 0, 'RATE_LIMIT_WINDOW_SEC should be positive');
    assert.ok(val <= 3600, 'RATE_LIMIT_WINDOW_SEC should not exceed 1 hour');
  });
});

describe('semantic correctness', () => {
  test('timeout is at least 100ms (not trivially zero)', () => {
    assert.ok(
      SANDBOX_CONFIG.MAX_TIMEOUT_MS >= 100,
      'MAX_TIMEOUT_MS should be at least 100ms to allow meaningful execution',
    );
  });

  test('output limit is at least 1 character', () => {
    assert.ok(
      SANDBOX_CONFIG.MAX_OUTPUT_LENGTH >= 1,
      'MAX_OUTPUT_LENGTH should be at least 1 to allow some output',
    );
  });

  test('rate limit window is reasonable (at least 1 second)', () => {
    assert.ok(
      SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC >= 1,
      'RATE_LIMIT_WINDOW_SEC should be at least 1 second',
    );
  });

  test('memory limit is sufficient for basic execution (at least 1 MB)', () => {
    assert.ok(
      SANDBOX_CONFIG.MAX_MEMORY_MB >= 1,
      'MAX_MEMORY_MB should be at least 1 MB',
    );
  });
});
