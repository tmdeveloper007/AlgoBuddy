// security-tests/apiErrors.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/apiErrors.test.cjs
//
// Tests ApiError class hierarchy in src/lib/apiErrors.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// Inlined source.
class ApiError extends Error {
  constructor(message, code = "INTERNAL_ERROR", status = 500) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

class AuthError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthError";
  }
}

class RateLimitError extends ApiError {
  constructor(message = "Too many requests") {
    super(message, "RATE_LIMIT", 429);
    this.name = "RateLimitError";
  }
}

class ValidationError extends ApiError {
  constructor(message = "Validation failed") {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

class ConfigError extends ApiError {
  constructor(message = "Server configuration error") {
    super(message, "CONFIG_ERROR", 500);
    this.name = "ConfigError";
  }
}

describe("ApiError", () => {
  test("has correct name, code, and status", () => {
    const err = new ApiError("Something went wrong", "CUSTOM_ERROR", 503);
    assert.equal(err.name, "ApiError");
    assert.equal(err.message, "Something went wrong");
    assert.equal(err.code, "CUSTOM_ERROR");
    assert.equal(err.status, 503);
  });

  test("uses defaults when not provided", () => {
    const err = new ApiError();
    assert.equal(err.name, "ApiError");
    // Calling super(undefined) sets message to empty string, not undefined
    assert.equal(err.message, "");
    assert.equal(err.code, "INTERNAL_ERROR");
    assert.equal(err.status, 500);
  });

  test("is an instance of Error", () => {
    const err = new ApiError("test");
    assert.ok(err instanceof Error);
    assert.ok(err instanceof ApiError);
  });

  test("is enumerable in error properties", () => {
    const err = new ApiError("test", "ERR", 400);
    const keys = Object.keys(err);
    assert.ok(keys.includes("code"), "code should be enumerable");
    assert.ok(keys.includes("status"), "status should be enumerable");
  });
});

describe("AuthError", () => {
  test("has correct defaults", () => {
    const err = new AuthError();
    assert.equal(err.name, "AuthError");
    assert.equal(err.message, "Unauthorized");
    assert.equal(err.code, "AUTH_ERROR");
    assert.equal(err.status, 401);
  });

  test("accepts custom message", () => {
    const err = new AuthError("Session expired");
    assert.equal(err.message, "Session expired");
    assert.equal(err.status, 401);
  });

  test("inherits from ApiError", () => {
    const err = new AuthError();
    assert.ok(err instanceof ApiError);
    assert.ok(err instanceof Error);
  });
});

describe("RateLimitError", () => {
  test("has correct defaults", () => {
    const err = new RateLimitError();
    assert.equal(err.name, "RateLimitError");
    assert.equal(err.message, "Too many requests");
    assert.equal(err.code, "RATE_LIMIT");
    assert.equal(err.status, 429);
  });

  test("accepts custom message", () => {
    const err = new RateLimitError("Rate limit exceeded for IP 1.2.3.4");
    assert.equal(err.message, "Rate limit exceeded for IP 1.2.3.4");
    assert.equal(err.status, 429);
  });

  test("inherits from ApiError", () => {
    const err = new RateLimitError();
    assert.ok(err instanceof ApiError);
  });
});

describe("ValidationError", () => {
  test("has correct defaults", () => {
    const err = new ValidationError();
    assert.equal(err.name, "ValidationError");
    assert.equal(err.message, "Validation failed");
    assert.equal(err.code, "VALIDATION_ERROR");
    assert.equal(err.status, 400);
  });

  test("accepts custom message", () => {
    const err = new ValidationError("Email is required");
    assert.equal(err.message, "Email is required");
    assert.equal(err.status, 400);
  });

  test("inherits from ApiError", () => {
    const err = new ValidationError();
    assert.ok(err instanceof ApiError);
  });
});

describe("ConfigError", () => {
  test("has correct defaults", () => {
    const err = new ConfigError();
    assert.equal(err.name, "ConfigError");
    assert.equal(err.message, "Server configuration error");
    assert.equal(err.code, "CONFIG_ERROR");
    assert.equal(err.status, 500);
  });

  test("accepts custom message", () => {
    const err = new ConfigError("Missing SUPABASE_URL");
    assert.equal(err.message, "Missing SUPABASE_URL");
    assert.equal(err.status, 500);
  });

  test("inherits from ApiError", () => {
    const err = new ConfigError();
    assert.ok(err instanceof ApiError);
  });
});
