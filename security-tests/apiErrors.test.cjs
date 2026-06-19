// security-tests/apiErrors.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/apiErrors.test.cjs
//
// Tests the ApiError class hierarchy defined in src/lib/apiErrors.js.
// Uses Node's built-in node:test and node:assert/strict (matching npm run test:security).

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Import using require() from CommonJS context
const { ApiError, AuthError, RateLimitError, ValidationError } = require('../src/lib/apiErrors.js');

describe('ApiError', () => {
  test('constructor sets name, message, code, status', () => {
    const err = new ApiError('something broke', 'BAD_REQUEST', 400);
    assert.strictEqual(err.name, 'ApiError');
    assert.strictEqual(err.message, 'something broke');
    assert.strictEqual(err.code, 'BAD_REQUEST');
    assert.strictEqual(err.status, 400);
  });

  test('uses defaults when optional params omitted', () => {
    const err = new ApiError();
    assert.strictEqual(err.name, 'ApiError');
    assert.strictEqual(err.code, 'INTERNAL_ERROR');
    assert.strictEqual(err.status, 500);
  });

  test('is an instance of Error', () => {
    assert.ok(new ApiError() instanceof Error);
  });
});

describe('AuthError', () => {
  test('inherits from ApiError', () => {
    assert.ok(new AuthError() instanceof ApiError);
  });

  test('name is AuthError', () => {
    assert.strictEqual(new AuthError().name, 'AuthError');
  });

  test('defaults code to AUTH_ERROR and status to 401', () => {
    const err = new AuthError();
    assert.strictEqual(err.code, 'AUTH_ERROR');
    assert.strictEqual(err.status, 401);
  });

  test('accepts a custom message', () => {
    const err = new AuthError('token expired');
    assert.strictEqual(err.message, 'token expired');
    assert.strictEqual(err.code, 'AUTH_ERROR');
    assert.strictEqual(err.status, 401);
  });
});

describe('RateLimitError', () => {
  test('inherits from ApiError', () => {
    assert.ok(new RateLimitError() instanceof ApiError);
  });

  test('name is RateLimitError', () => {
    assert.strictEqual(new RateLimitError().name, 'RateLimitError');
  });

  test('defaults code to RATE_LIMIT and status to 429', () => {
    const err = new RateLimitError();
    assert.strictEqual(err.code, 'RATE_LIMIT');
    assert.strictEqual(err.status, 429);
  });

  test('accepts a custom message', () => {
    const err = new RateLimitError('slow down');
    assert.strictEqual(err.message, 'slow down');
    assert.strictEqual(err.code, 'RATE_LIMIT');
    assert.strictEqual(err.status, 429);
  });
});

describe('ValidationError', () => {
  test('inherits from ApiError', () => {
    assert.ok(new ValidationError() instanceof ApiError);
  });

  test('name is ValidationError', () => {
    assert.strictEqual(new ValidationError().name, 'ValidationError');
  });

  test('defaults code to VALIDATION_ERROR and status to 400', () => {
    const err = new ValidationError();
    assert.strictEqual(err.code, 'VALIDATION_ERROR');
    assert.strictEqual(err.status, 400);
  });

  test('accepts a custom message', () => {
    const err = new ValidationError('missing field');
    assert.strictEqual(err.message, 'missing field');
    assert.strictEqual(err.code, 'VALIDATION_ERROR');
    assert.strictEqual(err.status, 400);
  });
});