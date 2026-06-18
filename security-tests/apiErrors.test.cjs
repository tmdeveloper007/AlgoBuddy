'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

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

describe('ApiError', () => {
  it('sets message, code, and status from constructor args', () => {
    const err = new ApiError('oops', 'BAD_REQUEST', 400);
    assert.equal(err.message, 'oops');
    assert.equal(err.code, 'BAD_REQUEST');
    assert.equal(err.status, 400);
    assert.equal(err.name, 'ApiError');
  });

  it('uses defaults when args omitted', () => {
    const err = new ApiError();
    assert.equal(err.message, '');
    assert.equal(err.code, 'INTERNAL_ERROR');
    assert.equal(err.status, 500);
    assert.equal(err.name, 'ApiError');
  });

  it('is an instance of Error', () => {
    assert.ok(new ApiError() instanceof Error);
  });
});

describe('AuthError', () => {
  it('sets correct defaults', () => {
    const err = new AuthError();
    assert.equal(err.message, 'Unauthorized');
    assert.equal(err.code, 'AUTH_ERROR');
    assert.equal(err.status, 401);
    assert.equal(err.name, 'AuthError');
  });

  it('accepts custom message', () => {
    const err = new AuthError('Token expired');
    assert.equal(err.message, 'Token expired');
    assert.equal(err.status, 401);
  });

  it('is instanceof ApiError', () => {
    assert.ok(new AuthError() instanceof ApiError);
    assert.ok(new AuthError() instanceof Error);
  });
});

describe('RateLimitError', () => {
  it('sets correct defaults', () => {
    const err = new RateLimitError();
    assert.equal(err.message, 'Too many requests');
    assert.equal(err.code, 'RATE_LIMIT');
    assert.equal(err.status, 429);
    assert.equal(err.name, 'RateLimitError');
  });

  it('accepts custom message', () => {
    const err = new RateLimitError('Slow down');
    assert.equal(err.message, 'Slow down');
    assert.equal(err.status, 429);
  });

  it('is instanceof ApiError', () => {
    assert.ok(new RateLimitError() instanceof ApiError);
  });
});

describe('ValidationError', () => {
  it('sets correct defaults', () => {
    const err = new ValidationError();
    assert.equal(err.message, 'Validation failed');
    assert.equal(err.code, 'VALIDATION_ERROR');
    assert.equal(err.status, 400);
    assert.equal(err.name, 'ValidationError');
  });

  it('accepts custom message', () => {
    const err = new ValidationError('Invalid email');
    assert.equal(err.message, 'Invalid email');
    assert.equal(err.status, 400);
  });

  it('is instanceof ApiError', () => {
    assert.ok(new ValidationError() instanceof ApiError);
  });
});

describe('ConfigError', () => {
  it('sets correct defaults', () => {
    const err = new ConfigError();
    assert.equal(err.message, 'Server configuration error');
    assert.equal(err.code, 'CONFIG_ERROR');
    assert.equal(err.status, 500);
    assert.equal(err.name, 'ConfigError');
  });

  it('accepts custom message', () => {
    const err = new ConfigError('Missing env var');
    assert.equal(err.message, 'Missing env var');
    assert.equal(err.status, 500);
  });

  it('is instanceof ApiError', () => {
    assert.ok(new ConfigError() instanceof ApiError);
  });
});
