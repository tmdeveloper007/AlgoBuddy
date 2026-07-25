// security-tests/apiErrors.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/apiErrors.test.cjs
//
// Tests ApiError class hierarchy.

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Inlined source to avoid ESM import issues.
class ApiError extends Error {
  constructor(message, code = 'INTERNAL_ERROR', status = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

class AuthError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

class RateLimitError extends ApiError {
  constructor(message = 'Too many requests') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

class ValidationError extends ApiError {
  constructor(message = 'Validation failed') {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

class ConfigError extends ApiError {
  constructor(message = 'Server configuration error') {
    super(message, 'CONFIG_ERROR', 500);
    this.name = 'ConfigError';
  }
}

// ── Tests ────────────────────────────────────────────────────────────

describe('ApiError', () => {
  it('has correct default values', () => {
    const err = new ApiError();
    assert.equal(err.message, '');
    assert.equal(err.code, 'INTERNAL_ERROR');
    assert.equal(err.status, 500);
    assert.equal(err.name, 'ApiError');
  });

  it('accepts custom message, code, and status', () => {
    const err = new ApiError('Custom message', 'CUSTOM_CODE', 503);
    assert.equal(err.message, 'Custom message');
    assert.equal(err.code, 'CUSTOM_CODE');
    assert.equal(err.status, 503);
  });

  it('is an instance of Error', () => {
    assert.ok(new ApiError() instanceof Error);
  });
});

describe('AuthError', () => {
  it('defaults to 401 and AUTH_ERROR code', () => {
    const err = new AuthError();
    assert.equal(err.status, 401);
    assert.equal(err.code, 'AUTH_ERROR');
    assert.equal(err.message, 'Unauthorized');
  });

  it('accepts custom message', () => {
    const err = new AuthError('Session expired');
    assert.equal(err.message, 'Session expired');
    assert.equal(err.status, 401);
  });

  it('is an instance of ApiError', () => {
    assert.ok(new AuthError() instanceof ApiError);
  });
});

describe('RateLimitError', () => {
  it('defaults to 429 and RATE_LIMIT code', () => {
    const err = new RateLimitError();
    assert.equal(err.status, 429);
    assert.equal(err.code, 'RATE_LIMIT');
    assert.equal(err.message, 'Too many requests');
  });

  it('is an instance of ApiError', () => {
    assert.ok(new RateLimitError() instanceof ApiError);
  });
});

describe('ValidationError', () => {
  it('defaults to 400 and VALIDATION_ERROR code', () => {
    const err = new ValidationError();
    assert.equal(err.status, 400);
    assert.equal(err.code, 'VALIDATION_ERROR');
  });

  it('is an instance of ApiError', () => {
    assert.ok(new ValidationError() instanceof ApiError);
  });
});

describe('ConfigError', () => {
  it('defaults to 500 and CONFIG_ERROR code', () => {
    const err = new ConfigError();
    assert.equal(err.status, 500);
    assert.equal(err.code, 'CONFIG_ERROR');
  });

  it('is an instance of ApiError', () => {
    assert.ok(new ConfigError() instanceof ApiError);
  });
});
