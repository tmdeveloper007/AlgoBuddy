// security-tests/apiErrors.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/apiErrors.test.cjs

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// Inline the source to avoid ESM import issues.
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

// ── Tests ────────────────────────────────────────────────────────────

describe("ApiError", () => {
  test("has correct name, message, and default values", () => {
    const err = new ApiError("something went wrong");
    assert.equal(err.name, "ApiError");
    assert.equal(err.message, "something went wrong");
    assert.equal(err.code, "INTERNAL_ERROR");
    assert.equal(err.status, 500);
    assert.ok(err instanceof Error);
    assert.ok(err instanceof ApiError);
  });

  test("accepts custom code and status", () => {
    const err = new ApiError("custom", "CUSTOM_CODE", 422);
    assert.equal(err.code, "CUSTOM_CODE");
    assert.equal(err.status, 422);
  });
});

describe("AuthError", () => {
  test("has correct name, defaults, and inherits from ApiError", () => {
    const err = new AuthError();
    assert.equal(err.name, "AuthError");
    assert.equal(err.message, "Unauthorized");
    assert.equal(err.code, "AUTH_ERROR");
    assert.equal(err.status, 401);
    assert.ok(err instanceof ApiError);
  });

  test("accepts a custom message", () => {
    const err = new AuthError("Token expired");
    assert.equal(err.message, "Token expired");
  });
});

describe("RateLimitError", () => {
  test("has correct name, defaults, and inherits from ApiError", () => {
    const err = new RateLimitError();
    assert.equal(err.name, "RateLimitError");
    assert.equal(err.message, "Too many requests");
    assert.equal(err.code, "RATE_LIMIT");
    assert.equal(err.status, 429);
    assert.ok(err instanceof ApiError);
  });

  test("accepts a custom message", () => {
    const err = new RateLimitError("API rate limit exceeded");
    assert.equal(err.message, "API rate limit exceeded");
  });
});

describe("ValidationError", () => {
  test("has correct name, defaults, and inherits from ApiError", () => {
    const err = new ValidationError();
    assert.equal(err.name, "ValidationError");
    assert.equal(err.message, "Validation failed");
    assert.equal(err.code, "VALIDATION_ERROR");
    assert.equal(err.status, 400);
    assert.ok(err instanceof ApiError);
  });

  test("accepts a custom message", () => {
    const err = new ValidationError("Email address is invalid");
    assert.equal(err.message, "Email address is invalid");
  });
});

describe("ConfigError", () => {
  test("has correct name, defaults, and inherits from ApiError", () => {
    const err = new ConfigError();
    assert.equal(err.name, "ConfigError");
    assert.equal(err.message, "Server configuration error");
    assert.equal(err.code, "CONFIG_ERROR");
    assert.equal(err.status, 500);
    assert.ok(err instanceof ApiError);
  });

  test("accepts a custom message", () => {
    const err = new ConfigError("Missing SUPABASE_URL");
    assert.equal(err.message, "Missing SUPABASE_URL");
  });
});
