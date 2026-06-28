'use strict';

// security-tests/apiErrors.test.cjs
// Run with: node --experimental-detect-module --test security-tests/apiErrors.test.cjs
//
// Tests the ApiError class hierarchy from src/lib/apiErrors.js.
// Logic is inlined to avoid import path issues with @/ aliases.

const { test } = require('node:test');
const assert = require('node:assert/strict');

// Inlined from src/lib/apiErrors.js
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

// Tests
test('ApiError: sets name, message, code, and status from constructor args', () => {
  const err = new ApiError('something broke', 'BAD_REQUEST', 422);
  assert.equal(err.name, 'ApiError');
  assert.equal(err.message, 'something broke');
  assert.equal(err.code, 'BAD_REQUEST');
  assert.equal(err.status, 422);
});

test('ApiError: uses default code and status when omitted', () => {
  const err = new ApiError('generic error');
  assert.equal(err.code, 'INTERNAL_ERROR');
  assert.equal(err.status, 500);
});

test('ApiError: is instanceof Error', () => {
  assert.ok(new ApiError('test') instanceof Error);
});

test('AuthError: sets correct defaults', () => {
  const err = new AuthError();
  assert.equal(err.name, 'AuthError');
  assert.equal(err.message, 'Unauthorized');
  assert.equal(err.code, 'AUTH_ERROR');
  assert.equal(err.status, 401);
});

test('AuthError: accepts custom message', () => {
  assert.equal(new AuthError('Token expired').message, 'Token expired');
});

test('AuthError: is instanceof ApiError and Error', () => {
  assert.ok(new AuthError() instanceof ApiError);
  assert.ok(new AuthError() instanceof Error);
});

test('RateLimitError: sets correct defaults', () => {
  const err = new RateLimitError();
  assert.equal(err.name, 'RateLimitError');
  assert.equal(err.message, 'Too many requests');
  assert.equal(err.code, 'RATE_LIMIT');
  assert.equal(err.status, 429);
});

test('RateLimitError: accepts custom message', () => {
  assert.equal(new RateLimitError('Slow down').message, 'Slow down');
});

test('RateLimitError: is instanceof ApiError', () => {
  assert.ok(new RateLimitError() instanceof ApiError);
});

test('ValidationError: sets correct defaults', () => {
  const err = new ValidationError();
  assert.equal(err.name, 'ValidationError');
  assert.equal(err.message, 'Validation failed');
  assert.equal(err.code, 'VALIDATION_ERROR');
  assert.equal(err.status, 400);
});

test('ValidationError: accepts custom message', () => {
  assert.equal(new ValidationError('Email is required').message, 'Email is required');
});

test('ValidationError: is instanceof ApiError', () => {
  assert.ok(new ValidationError() instanceof ApiError);
});

test('ConfigError: sets correct defaults', () => {
  const err = new ConfigError();
  assert.equal(err.name, 'ConfigError');
  assert.equal(err.message, 'Server configuration error');
  assert.equal(err.code, 'CONFIG_ERROR');
  assert.equal(err.status, 500);
});

test('ConfigError: accepts custom message', () => {
  assert.equal(new ConfigError('DB connection string missing').message, 'DB connection string missing');
});

test('ConfigError: is instanceof ApiError', () => {
  assert.ok(new ConfigError() instanceof ApiError);
});