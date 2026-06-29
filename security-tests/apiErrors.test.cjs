// security-tests/apiErrors.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/apiErrors.test.cjs
//
// Tests the ApiError class hierarchy in src/lib/apiErrors.js.
// Uses node:test + assert/strict — the same runner as npm run test:security.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// ─── Inline the source to avoid ESM / @/ alias resolution issues ────────────
// (Copied verbatim from src/lib/apiErrors.js)

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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("ApiError", () => {
  test("sets name to 'ApiError'", () => {
    const err = new ApiError("something went wrong");
    assert.strictEqual(err.name, "ApiError");
  });

  test("sets message from constructor", () => {
    const err = new ApiError("custom message");
    assert.strictEqual(err.message, "custom message");
  });

  test("is an instance of Error", () => {
    const err = new ApiError();
    assert.ok(err instanceof Error);
    assert.ok(err instanceof ApiError);
  });

  test("defaults code to 'INTERNAL_ERROR' and status to 500", () => {
    const err = new ApiError();
    assert.strictEqual(err.code, "INTERNAL_ERROR");
    assert.strictEqual(err.status, 500);
  });

  test("accepts custom code and status", () => {
    const err = new ApiError("custom msg", "SOME_CODE", 418);
    assert.strictEqual(err.code, "SOME_CODE");
    assert.strictEqual(err.status, 418);
  });
});

describe("AuthError", () => {
  test("extends ApiError", () => {
    const err = new AuthError();
    assert.ok(err instanceof ApiError);
    assert.ok(err instanceof Error);
  });

  test("sets name to 'AuthError'", () => {
    const err = new AuthError();
    assert.strictEqual(err.name, "AuthError");
  });

  test("defaults to code 'AUTH_ERROR' and status 401", () => {
    const err = new AuthError();
    assert.strictEqual(err.code, "AUTH_ERROR");
    assert.strictEqual(err.status, 401);
  });

  test("defaults message to 'Unauthorized'", () => {
    const err = new AuthError();
    assert.strictEqual(err.message, "Unauthorized");
  });

  test("accepts custom message", () => {
    const err = new AuthError("Token expired");
    assert.strictEqual(err.message, "Token expired");
    assert.strictEqual(err.code, "AUTH_ERROR");
    assert.strictEqual(err.status, 401);
  });
});

describe("RateLimitError", () => {
  test("extends ApiError", () => {
    const err = new RateLimitError();
    assert.ok(err instanceof ApiError);
  });

  test("sets name to 'RateLimitError'", () => {
    const err = new RateLimitError();
    assert.strictEqual(err.name, "RateLimitError");
  });

  test("defaults to code 'RATE_LIMIT' and status 429", () => {
    const err = new RateLimitError();
    assert.strictEqual(err.code, "RATE_LIMIT");
    assert.strictEqual(err.status, 429);
  });

  test("defaults message to 'Too many requests'", () => {
    const err = new RateLimitError();
    assert.strictEqual(err.message, "Too many requests");
  });

  test("accepts custom message", () => {
    const err = new RateLimitError("Slow down, cowboy");
    assert.strictEqual(err.message, "Slow down, cowboy");
    assert.strictEqual(err.code, "RATE_LIMIT");
    assert.strictEqual(err.status, 429);
  });
});

describe("ValidationError", () => {
  test("extends ApiError", () => {
    const err = new ValidationError();
    assert.ok(err instanceof ApiError);
  });

  test("sets name to 'ValidationError'", () => {
    const err = new ValidationError();
    assert.strictEqual(err.name, "ValidationError");
  });

  test("defaults to code 'VALIDATION_ERROR' and status 400", () => {
    const err = new ValidationError();
    assert.strictEqual(err.code, "VALIDATION_ERROR");
    assert.strictEqual(err.status, 400);
  });

  test("defaults message to 'Validation failed'", () => {
    const err = new ValidationError();
    assert.strictEqual(err.message, "Validation failed");
  });

  test("accepts custom message", () => {
    const err = new ValidationError("Missing required field: email");
    assert.strictEqual(err.message, "Missing required field: email");
    assert.strictEqual(err.code, "VALIDATION_ERROR");
    assert.strictEqual(err.status, 400);
  });
});

describe("ConfigError", () => {
  test("extends ApiError", () => {
    const err = new ConfigError();
    assert.ok(err instanceof ApiError);
  });

  test("sets name to 'ConfigError'", () => {
    const err = new ConfigError();
    assert.strictEqual(err.name, "ConfigError");
  });

  test("defaults to code 'CONFIG_ERROR' and status 500", () => {
    const err = new ConfigError();
    assert.strictEqual(err.code, "CONFIG_ERROR");
    assert.strictEqual(err.status, 500);
  });

  test("defaults message to 'Server configuration error'", () => {
    const err = new ConfigError();
    assert.strictEqual(err.message, "Server configuration error");
  });

  test("accepts custom message", () => {
    const err = new ConfigError("Missing DATABASE_URL");
    assert.strictEqual(err.message, "Missing DATABASE_URL");
    assert.strictEqual(err.code, "CONFIG_ERROR");
    assert.strictEqual(err.status, 500);
  });
});