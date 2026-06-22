// security-tests/sandbox-config.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/sandbox-config.test.cjs
//
// Tests the SANDBOX_CONFIG resource limits in src/lib/sandbox/sandbox.config.js.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const SANDBOX_CONFIG = require('../src/lib/sandbox/sandbox.config');

describe('SANDBOX_CONFIG keys', () => {
  test('has MAX_TIMEOUT_MS', () => {
    assert.ok('MAX_TIMEOUT_MS' in SANDBOX_CONFIG);
  });

  test('has MAX_MEMORY_MB', () => {
    assert.ok('MAX_MEMORY_MB' in SANDBOX_CONFIG);
  });

  test('has MAX_OUTPUT_LENGTH', () => {
    assert.ok('MAX_OUTPUT_LENGTH' in SANDBOX_CONFIG);
  });

  test('has RATE_LIMIT_MAX_REQUESTS', () => {
    assert.ok('RATE_LIMIT_MAX_REQUESTS' in SANDBOX_CONFIG);
  });

  test('has RATE_LIMIT_WINDOW_SEC', () => {
    assert.ok('RATE_LIMIT_WINDOW_SEC' in SANDBOX_CONFIG);
  });
});

describe('MAX_TIMEOUT_MS', () => {
  test('is a positive integer', () => {
    const val = SANDBOX_CONFIG.MAX_TIMEOUT_MS;
    assert.strictEqual(typeof val, 'number');
    assert.ok(Number.isInteger(val), 'MAX_TIMEOUT_MS should be an integer');
    assert.ok(val > 0, 'MAX_TIMEOUT_MS should be positive');
  });

  test('equals 1000ms', () => {
    assert.strictEqual(SANDBOX_CONFIG.MAX_TIMEOUT_MS, 1000);
  });
});

describe('MAX_MEMORY_MB', () => {
  test('is a positive integer', () => {
    const val = SANDBOX_CONFIG.MAX_MEMORY_MB;
    assert.strictEqual(typeof val, 'number');
    assert.ok(Number.isInteger(val), 'MAX_MEMORY_MB should be an integer');
    assert.ok(val > 0, 'MAX_MEMORY_MB should be positive');
  });

  test('equals 32MB', () => {
    assert.strictEqual(SANDBOX_CONFIG.MAX_MEMORY_MB, 32);
  });
});

describe('MAX_OUTPUT_LENGTH', () => {
  test('is a positive integer', () => {
    const val = SANDBOX_CONFIG.MAX_OUTPUT_LENGTH;
    assert.strictEqual(typeof val, 'number');
    assert.ok(Number.isInteger(val), 'MAX_OUTPUT_LENGTH should be an integer');
    assert.ok(val > 0, 'MAX_OUTPUT_LENGTH should be positive');
  });

  test('equals 8000', () => {
    assert.strictEqual(SANDBOX_CONFIG.MAX_OUTPUT_LENGTH, 8000);
  });
});

describe('RATE_LIMIT_MAX_REQUESTS', () => {
  test('is a positive integer', () => {
    const val = SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS;
    assert.strictEqual(typeof val, 'number');
    assert.ok(Number.isInteger(val), 'RATE_LIMIT_MAX_REQUESTS should be an integer');
    assert.ok(val > 0, 'RATE_LIMIT_MAX_REQUESTS should be positive');
  });

  test('equals 10', () => {
    assert.strictEqual(SANDBOX_CONFIG.RATE_LIMIT_MAX_REQUESTS, 10);
  });
});

describe('RATE_LIMIT_WINDOW_SEC', () => {
  test('is a positive integer', () => {
    const val = SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC;
    assert.strictEqual(typeof val, 'number');
    assert.ok(Number.isInteger(val), 'RATE_LIMIT_WINDOW_SEC should be an integer');
    assert.ok(val > 0, 'RATE_LIMIT_WINDOW_SEC should be positive');
  });

  test('equals 60 seconds', () => {
    assert.strictEqual(SANDBOX_CONFIG.RATE_LIMIT_WINDOW_SEC, 60);
  });
});
