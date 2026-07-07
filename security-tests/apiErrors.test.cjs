// security-tests/apiErrors.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/apiErrors.test.cjs
//
// Tests the ApiError class hierarchy exported from src/lib/apiErrors.js.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('node:url');

const errorsUrl = pathToFileURL(path.join(__dirname, '../src/lib/apiErrors.js'));

describe('ApiError', () => {
  test('has correct name, default code and status', async () => {
    const { ApiError } = await import(errorsUrl);
    const err = new ApiError('Something went wrong');
    assert.strictEqual(err.name, 'ApiError');
    assert.strictEqual(err.message, 'Something went wrong');
    assert.strictEqual(err.code, 'INTERNAL_ERROR');
    assert.strictEqual(err.status, 500);
  });

  test('is an instance of Error', async () => {
    const { ApiError } = await import(errorsUrl);
    const err = new ApiError();
    assert.ok(err instanceof Error);
  });

  test('accepts custom code and status', async () => {
    const { ApiError } = await import(errorsUrl);
    const err = new ApiError('Custom error', 'CUSTOM_CODE', 418);
    assert.strictEqual(err.code, 'CUSTOM_CODE');
    assert.strictEqual(err.status, 418);
  });

  test('JSON serialises name, code and status but not message by default', async () => {
    const { ApiError } = await import(errorsUrl);
    const err = new ApiError('Bad request', 'BAD_REQUEST', 400);
    const json = JSON.stringify(err);
    const parsed = JSON.parse(json);
    // Error.prototype.toJSON is not defined by default, so message is not included
    // but custom properties code and status are included
    assert.strictEqual(parsed.name, 'ApiError');
    assert.strictEqual(parsed.code, 'BAD_REQUEST');
    assert.strictEqual(parsed.status, 400);
  });
});

describe('AuthError', () => {
  test('inherits from ApiError', async () => {
    const { ApiError, AuthError } = await import(errorsUrl);
    const err = new AuthError();
    assert.ok(err instanceof ApiError);
    assert.ok(err instanceof AuthError);
  });

  test('has correct default message, code and status', async () => {
    const { AuthError } = await import(errorsUrl);
    const err = new AuthError();
    assert.strictEqual(err.name, 'AuthError');
    assert.strictEqual(err.message, 'Unauthorized');
    assert.strictEqual(err.code, 'AUTH_ERROR');
    assert.strictEqual(err.status, 401);
  });

  test('accepts a custom message', async () => {
    const { AuthError } = await import(errorsUrl);
    const err = new AuthError('Token expired');
    assert.strictEqual(err.message, 'Token expired');
  });
});

describe('RateLimitError', () => {
  test('inherits from ApiError', async () => {
    const { ApiError, RateLimitError } = await import(errorsUrl);
    const err = new RateLimitError();
    assert.ok(err instanceof ApiError);
    assert.ok(err instanceof RateLimitError);
  });

  test('has correct default message, code and status', async () => {
    const { RateLimitError } = await import(errorsUrl);
    const err = new RateLimitError();
    assert.strictEqual(err.name, 'RateLimitError');
    assert.strictEqual(err.message, 'Too many requests');
    assert.strictEqual(err.code, 'RATE_LIMIT');
    assert.strictEqual(err.status, 429);
  });

  test('accepts a custom message', async () => {
    const { RateLimitError } = await import(errorsUrl);
    const err = new RateLimitError('Slow down');
    assert.strictEqual(err.message, 'Slow down');
  });
});

describe('ValidationError', () => {
  test('inherits from ApiError', async () => {
    const { ApiError, ValidationError } = await import(errorsUrl);
    const err = new ValidationError();
    assert.ok(err instanceof ApiError);
    assert.ok(err instanceof ValidationError);
  });

  test('has correct default message, code and status', async () => {
    const { ValidationError } = await import(errorsUrl);
    const err = new ValidationError();
    assert.strictEqual(err.name, 'ValidationError');
    assert.strictEqual(err.message, 'Validation failed');
    assert.strictEqual(err.code, 'VALIDATION_ERROR');
    assert.strictEqual(err.status, 400);
  });

  test('accepts a custom message', async () => {
    const { ValidationError } = await import(errorsUrl);
    const err = new ValidationError('Invalid email');
    assert.strictEqual(err.message, 'Invalid email');
  });
});

describe('ConfigError', () => {
  test('inherits from ApiError', async () => {
    const { ApiError, ConfigError } = await import(errorsUrl);
    const err = new ConfigError();
    assert.ok(err instanceof ApiError);
    assert.ok(err instanceof ConfigError);
  });

  test('has correct default message, code and status', async () => {
    const { ConfigError } = await import(errorsUrl);
    const err = new ConfigError();
    assert.strictEqual(err.name, 'ConfigError');
    assert.strictEqual(err.message, 'Server configuration error');
    assert.strictEqual(err.code, 'CONFIG_ERROR');
    assert.strictEqual(err.status, 500);
  });

  test('accepts a custom message', async () => {
    const { ConfigError } = await import(errorsUrl);
    const err = new ConfigError('Missing env var');
    assert.strictEqual(err.message, 'Missing env var');
  });
});
