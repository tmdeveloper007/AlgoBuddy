// __tests__/apiErrors.test.js
//
// Run with:  npx jest __tests__/apiErrors.test.js
//
// Tests the ApiError subclasses in src/lib/apiErrors.js.

const { describe, expect, test } = require("@jest/globals");
const {
  ApiError,
  AuthError,
  RateLimitError,
  ValidationError,
  ConfigError,
} = require("../src/lib/apiErrors.js");

describe("ApiError", () => {
  test("sets name, message, code and status from constructor args", () => {
    const err = new ApiError("Something broke", "SOMETHING_BROKE", 503);
    expect(err.name).toBe("ApiError");
    expect(err.message).toBe("Something broke");
    expect(err.code).toBe("SOMETHING_BROKE");
    expect(err.status).toBe(503);
  });

  test("uses defaults when only message is provided", () => {
    const err = new ApiError("Generic error");
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.status).toBe(500);
  });

  test("uses all defaults when no args provided", () => {
    const err = new ApiError();
    expect(err.message).toBe("");
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.status).toBe(500);
  });

  test("is an instance of Error", () => {
    const err = new ApiError("test");
    expect(err instanceof Error).toBe(true);
    expect(err instanceof ApiError).toBe(true);
  });
});

describe("AuthError", () => {
  test("sets 401 status and AUTH_ERROR code", () => {
    const err = new AuthError("Invalid token");
    expect(err.name).toBe("AuthError");
    expect(err.message).toBe("Invalid token");
    expect(err.code).toBe("AUTH_ERROR");
    expect(err.status).toBe(401);
  });

  test("uses default message when none provided", () => {
    const err = new AuthError();
    expect(err.message).toBe("Unauthorized");
    expect(err.status).toBe(401);
  });

  test("is an instance of ApiError and Error", () => {
    const err = new AuthError();
    expect(err instanceof ApiError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

describe("RateLimitError", () => {
  test("sets 429 status and RATE_LIMIT code", () => {
    const err = new RateLimitError("Slow down");
    expect(err.name).toBe("RateLimitError");
    expect(err.message).toBe("Slow down");
    expect(err.code).toBe("RATE_LIMIT");
    expect(err.status).toBe(429);
  });

  test("uses default message when none provided", () => {
    const err = new RateLimitError();
    expect(err.message).toBe("Too many requests");
    expect(err.status).toBe(429);
  });

  test("is an instance of ApiError and Error", () => {
    const err = new RateLimitError();
    expect(err instanceof ApiError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

describe("ValidationError", () => {
  test("sets 400 status and VALIDATION_ERROR code", () => {
    const err = new ValidationError("Email is required");
    expect(err.name).toBe("ValidationError");
    expect(err.message).toBe("Email is required");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.status).toBe(400);
  });

  test("uses default message when none provided", () => {
    const err = new ValidationError();
    expect(err.message).toBe("Validation failed");
    expect(err.status).toBe(400);
  });

  test("is an instance of ApiError and Error", () => {
    const err = new ValidationError();
    expect(err instanceof ApiError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});

describe("ConfigError", () => {
  test("sets 500 status and CONFIG_ERROR code", () => {
    const err = new ConfigError("Missing DB URL");
    expect(err.name).toBe("ConfigError");
    expect(err.message).toBe("Missing DB URL");
    expect(err.code).toBe("CONFIG_ERROR");
    expect(err.status).toBe(500);
  });

  test("uses default message when none provided", () => {
    const err = new ConfigError();
    expect(err.message).toBe("Server configuration error");
    expect(err.status).toBe(500);
  });

  test("is an instance of ApiError and Error", () => {
    const err = new ConfigError();
    expect(err instanceof ApiError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });
});
