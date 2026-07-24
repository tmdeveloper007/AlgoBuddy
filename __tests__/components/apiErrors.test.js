// __tests__/apiErrors.test.js
//
// Run with:  npx jest __tests__/apiErrors.test.js --colors=false

import {
  ApiError,
  AuthError,
  RateLimitError,
  ValidationError,
  ConfigError,
} from "../../src/lib/apiErrors.js";

describe("ApiError", () => {
  test("constructs with correct name, message, code, and status", () => {
    const err = new ApiError("Something went wrong", "BAD_REQUEST", 418);
    expect(err.name).toBe("ApiError");
    expect(err.message).toBe("Something went wrong");
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.status).toBe(418);
  });

  test("uses defaults when no arguments given", () => {
    const err = new ApiError();
    expect(err.name).toBe("ApiError");
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.status).toBe(500);
  });

  test("is an instance of Error", () => {
    expect(new ApiError()).toBeInstanceOf(Error);
  });
});

describe("AuthError", () => {
  test("sets code AUTH_ERROR and status 401", () => {
    const err = new AuthError();
    expect(err.name).toBe("AuthError");
    expect(err.code).toBe("AUTH_ERROR");
    expect(err.status).toBe(401);
  });

  test("uses default message Unauthorized", () => {
    expect(new AuthError().message).toBe("Unauthorized");
  });

  test("accepts a custom message", () => {
    expect(new AuthError("Token expired").message).toBe("Token expired");
  });

  test("is an instance of ApiError and Error", () => {
    expect(new AuthError()).toBeInstanceOf(ApiError);
    expect(new AuthError()).toBeInstanceOf(Error);
  });
});

describe("RateLimitError", () => {
  test("sets code RATE_LIMIT and status 429", () => {
    const err = new RateLimitError();
    expect(err.name).toBe("RateLimitError");
    expect(err.code).toBe("RATE_LIMIT");
    expect(err.status).toBe(429);
  });

  test("uses default message Too many requests", () => {
    expect(new RateLimitError().message).toBe("Too many requests");
  });

  test("is an instance of ApiError and Error", () => {
    expect(new RateLimitError()).toBeInstanceOf(ApiError);
    expect(new RateLimitError()).toBeInstanceOf(Error);
  });
});

describe("ValidationError", () => {
  test("sets code VALIDATION_ERROR and status 400", () => {
    const err = new ValidationError();
    expect(err.name).toBe("ValidationError");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.status).toBe(400);
  });

  test("uses default message Validation failed", () => {
    expect(new ValidationError().message).toBe("Validation failed");
  });

  test("is an instance of ApiError and Error", () => {
    expect(new ValidationError()).toBeInstanceOf(ApiError);
    expect(new ValidationError()).toBeInstanceOf(Error);
  });
});

describe("ConfigError", () => {
  test("sets code CONFIG_ERROR and status 500", () => {
    const err = new ConfigError();
    expect(err.name).toBe("ConfigError");
    expect(err.code).toBe("CONFIG_ERROR");
    expect(err.status).toBe(500);
  });

  test("uses default message Server configuration error", () => {
    expect(new ConfigError().message).toBe("Server configuration error");
  });

  test("is an instance of ApiError and Error", () => {
    expect(new ConfigError()).toBeInstanceOf(ApiError);
    expect(new ConfigError()).toBeInstanceOf(Error);
  });
});
