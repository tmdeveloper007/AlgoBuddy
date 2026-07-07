// security-tests/errorCodes.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/errorCodes.test.cjs
//
// Tests the sandbox execution status codes exported from src/lib/sandbox/errorCodes.js.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const { EXECUTION_STATUS, EXECUTION_MESSAGES } = require('../src/lib/sandbox/errorCodes.js');

describe('EXECUTION_STATUS', () => {
  test('exports all expected status keys', () => {
    assert.ok('SUCCESS' in EXECUTION_STATUS);
    assert.ok('TLE' in EXECUTION_STATUS);
    assert.ok('MLE' in EXECUTION_STATUS);
    assert.ok('RUNTIME_ERROR' in EXECUTION_STATUS);
    assert.ok('INTERNAL_ERROR' in EXECUTION_STATUS);
  });

  test('status values equal their keys', () => {
    assert.strictEqual(EXECUTION_STATUS.SUCCESS, 'SUCCESS');
    assert.strictEqual(EXECUTION_STATUS.TLE, 'TLE');
    assert.strictEqual(EXECUTION_STATUS.MLE, 'MLE');
    assert.strictEqual(EXECUTION_STATUS.RUNTIME_ERROR, 'RUNTIME_ERROR');
    assert.strictEqual(EXECUTION_STATUS.INTERNAL_ERROR, 'INTERNAL_ERROR');
  });

  test('has exactly 5 statuses', () => {
    assert.strictEqual(Object.keys(EXECUTION_STATUS).length, 5);
  });
});

describe('EXECUTION_MESSAGES', () => {
  test('has the same keys as EXECUTION_STATUS', () => {
    const statusKeys = Object.keys(EXECUTION_STATUS);
    const messageKeys = Object.keys(EXECUTION_MESSAGES);
    assert.deepStrictEqual(messageKeys.sort(), statusKeys.sort());
  });

  test('every message is a non-empty string', () => {
    for (const key of Object.keys(EXECUTION_MESSAGES)) {
      const msg = EXECUTION_MESSAGES[key];
      assert.strictEqual(typeof msg, 'string', `${key} message should be a string`);
      assert.ok(msg.length > 0, `${key} message should not be empty`);
    }
  });

  test('SUCCESS message is present', () => {
    assert.ok(EXECUTION_MESSAGES.SUCCESS.length > 0);
  });

  test('TLE message references time limit', () => {
    assert.ok(
      EXECUTION_MESSAGES.TLE.toLowerCase().includes('time') ||
      EXECUTION_MESSAGES.TLE.toLowerCase().includes('limit'),
      'TLE message should reference time or limit',
    );
  });

  test('MLE message references memory limit', () => {
    assert.ok(
      EXECUTION_MESSAGES.MLE.toLowerCase().includes('memory') ||
      EXECUTION_MESSAGES.MLE.toLowerCase().includes('limit'),
      'MLE message should reference memory or limit',
    );
  });

  test('RUNTIME_ERROR message is present and descriptive', () => {
    assert.ok(EXECUTION_MESSAGES.RUNTIME_ERROR.length > 5);
  });

  test('INTERNAL_ERROR message is present and descriptive', () => {
    assert.ok(EXECUTION_MESSAGES.INTERNAL_ERROR.length > 5);
  });
});

describe('cross-consistency', () => {
  test('every status key maps to a message', () => {
    for (const key of Object.keys(EXECUTION_STATUS)) {
      assert.ok(
        key in EXECUTION_MESSAGES,
        `EXECUTION_STATUS.${key} should have a corresponding EXECUTION_MESSAGES entry`,
      );
    }
  });

  test('status values can be used as message keys', () => {
    const msg = EXECUTION_MESSAGES[EXECUTION_STATUS.SUCCESS];
    assert.ok(typeof msg === 'string' && msg.length > 0);
  });
});
