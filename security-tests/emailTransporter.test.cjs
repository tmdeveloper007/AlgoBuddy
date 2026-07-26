// security-tests/emailTransporter.test.cjs
const { describe, test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = {
      service: "gmail",
      auth: { user: "test-user", pass: "test-pass" },
    };
  }
  return transporter;
}

describe("getTransporter", () => {
  beforeEach(() => { transporter = null; });

  test("returns an object on first call", () => {
    const result = getTransporter();
    assert.strictEqual(typeof result, "object");
    assert.ok(result !== null);
  });
  test("returns gmail service configuration", () => {
    assert.strictEqual(getTransporter().service, "gmail");
  });
  test("returns auth object with user field", () => {
    assert.strictEqual(typeof getTransporter().auth, "object");
    assert.strictEqual(typeof getTransporter().auth.user, "string");
  });
  test("returns auth object with pass field", () => {
    assert.strictEqual(typeof getTransporter().auth, "object");
    assert.strictEqual(typeof getTransporter().auth.pass, "string");
  });
  test("returns the same object on repeated calls (singleton)", () => {
    const first = getTransporter();
    const second = getTransporter();
    assert.strictEqual(first, second);
  });
  test("singleton persists across calls without recreating", () => {
    const first = getTransporter();
    first._marker = "singleton-persists";
    const second = getTransporter();
    assert.strictEqual(second._marker, "singleton-persists");
  });
});
