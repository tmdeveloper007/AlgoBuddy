const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadApiErrors() {
  const url = pathToFileURL(
    path.join(__dirname, "..", "src/lib/apiErrors.js"),
  ).href;
  const mod = await import(url);
  return mod;
}

test("ApiError base class sets all properties correctly", async () => {
  const { ApiError } = await loadApiErrors();

  const err = new ApiError("Something broke", "MY_CODE", 503);

  assert.equal(err.name, "ApiError");
  assert.equal(err.message, "Something broke");
  assert.equal(err.code, "MY_CODE");
  assert.equal(err.status, 503);
  assert.ok(err instanceof Error, "should be instanceof Error");
  assert.ok(err instanceof ApiError, "should be instanceof ApiError");
});

test("ApiError uses defaults when optional args omitted", async () => {
  const { ApiError } = await loadApiErrors();

  const err = new ApiError("Default error");

  assert.equal(err.message, "Default error");
  assert.equal(err.code, "INTERNAL_ERROR");
  assert.equal(err.status, 500);
});

test("ApiError is callable with just a message", async () => {
  const { ApiError } = await loadApiErrors();

  const err = new ApiError("Only message");

  assert.equal(err.message, "Only message");
  assert.equal(err.code, "INTERNAL_ERROR");
  assert.equal(err.status, 500);
});

test("AuthError sets 401 and AUTH_ERROR by default", async () => {
  const { ApiError, AuthError } = await loadApiErrors();

  const err = new AuthError("Token expired");

  assert.equal(err.name, "AuthError");
  assert.equal(err.message, "Token expired");
  assert.equal(err.code, "AUTH_ERROR");
  assert.equal(err.status, 401);
  assert.ok(err instanceof ApiError, "should be instanceof ApiError");
});

test("AuthError uses default message when omitted", async () => {
  const { AuthError } = await loadApiErrors();

  const err = new AuthError();

  assert.equal(err.message, "Unauthorized");
  assert.equal(err.status, 401);
  assert.equal(err.code, "AUTH_ERROR");
});

test("RateLimitError sets 429 and RATE_LIMIT by default", async () => {
  const { ApiError, RateLimitError } = await loadApiErrors();

  const err = new RateLimitError("Slow down");

  assert.equal(err.name, "RateLimitError");
  assert.equal(err.message, "Slow down");
  assert.equal(err.code, "RATE_LIMIT");
  assert.equal(err.status, 429);
  assert.ok(err instanceof ApiError);
});

test("RateLimitError uses default message when omitted", async () => {
  const { RateLimitError } = await loadApiErrors();

  const err = new RateLimitError();

  assert.equal(err.message, "Too many requests");
  assert.equal(err.status, 429);
  assert.equal(err.code, "RATE_LIMIT");
});

test("ValidationError sets 400 and VALIDATION_ERROR by default", async () => {
  const { ApiError, ValidationError } = await loadApiErrors();

  const err = new ValidationError("Bad input");

  assert.equal(err.name, "ValidationError");
  assert.equal(err.message, "Bad input");
  assert.equal(err.code, "VALIDATION_ERROR");
  assert.equal(err.status, 400);
  assert.ok(err instanceof ApiError);
});

test("ValidationError uses default message when omitted", async () => {
  const { ValidationError } = await loadApiErrors();

  const err = new ValidationError();

  assert.equal(err.message, "Validation failed");
  assert.equal(err.status, 400);
  assert.equal(err.code, "VALIDATION_ERROR");
});

test("ConfigError sets 500 and CONFIG_ERROR by default", async () => {
  const { ApiError, ConfigError } = await loadApiErrors();

  const err = new ConfigError("Missing env var");

  assert.equal(err.name, "ConfigError");
  assert.equal(err.message, "Missing env var");
  assert.equal(err.code, "CONFIG_ERROR");
  assert.equal(err.status, 500);
  assert.ok(err instanceof ApiError);
});

test("ConfigError uses default message when omitted", async () => {
  const { ConfigError } = await loadApiErrors();

  const err = new ConfigError();

  assert.equal(err.message, "Server configuration error");
  assert.equal(err.status, 500);
  assert.equal(err.code, "CONFIG_ERROR");
});

test("each subclass is independently usable", async () => {
  const { AuthError, RateLimitError, ValidationError, ConfigError } =
    await loadApiErrors();

  const auth = new AuthError("not auth");
  const rate = new RateLimitError("rate");
  const val = new ValidationError("val");
  const cfg = new ConfigError("cfg");

  assert.notEqual(auth.status, rate.status);
  assert.notEqual(rate.status, val.status);
  assert.notEqual(val.status, cfg.status);
  assert.equal(auth.status, 401);
  assert.equal(rate.status, 429);
  assert.equal(val.status, 400);
  assert.equal(cfg.status, 500);
});
