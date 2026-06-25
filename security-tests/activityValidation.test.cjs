const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// -------------------------------------------------------------------
// Date-parsing logic from src/app/api/activity/route.js (inline)
// -------------------------------------------------------------------

function parseLocalDate(body) {
  const localDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const localDate =
    typeof body.localDate === "string" && localDateRegex.test(body.localDate)
      ? body.localDate
      : new Date().toISOString().split("T")[0];
  return localDate;
}

// -------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------

describe("parseLocalDate", () => {
  it("returns the localDate when it is a valid YYYY-MM-DD string", () => {
    const result = parseLocalDate({ localDate: "2026-06-25" });
    assert.strictEqual(result, "2026-06-25");
  });

  it("returns the localDate for a past date", () => {
    const result = parseLocalDate({ localDate: "2025-01-15" });
    assert.strictEqual(result, "2025-01-15");
  });

  it("returns the localDate for the earliest valid date", () => {
    const result = parseLocalDate({ localDate: "0001-01-01" });
    assert.strictEqual(result, "0001-01-01");
  });

  it("returns the localDate for a future date", () => {
    const result = parseLocalDate({ localDate: "2099-12-31" });
    assert.strictEqual(result, "2099-12-31");
  });

  it("falls back to UTC when localDate is missing", () => {
    const result = parseLocalDate({});
    // Result should be today's UTC date in YYYY-MM-DD format
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
    assert.strictEqual(result.length, 10);
  });

  it("falls back to UTC when localDate is null", () => {
    const result = parseLocalDate({ localDate: null });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate is undefined", () => {
    const result = parseLocalDate({ localDate: undefined });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate is a number", () => {
    const result = parseLocalDate({ localDate: 20260625 });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate is an object", () => {
    const result = parseLocalDate({ localDate: { iso: "2026-06-25" } });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate is an array", () => {
    const result = parseLocalDate({ localDate: ["2026", "06", "25"] });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate has wrong format (slash separator)", () => {
    const result = parseLocalDate({ localDate: "2026/06/25" });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate has wrong format (day first)", () => {
    const result = parseLocalDate({ localDate: "25-06-2026" });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate has no separator", () => {
    const result = parseLocalDate({ localDate: "20260625" });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate has extra characters", () => {
    const result = parseLocalDate({ localDate: "2026-06-25T00:00:00Z" });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate has random string", () => {
    const result = parseLocalDate({ localDate: "yesterday" });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate is empty string", () => {
    const result = parseLocalDate({ localDate: "" });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("falls back to UTC when localDate is whitespace only", () => {
    const result = parseLocalDate({ localDate: "   " });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("accepts localDate with leading zeros in month and day", () => {
    const result = parseLocalDate({ localDate: "2026-01-01" });
    assert.strictEqual(result, "2026-01-01");
  });

  it("rejects localDate with single-digit month (missing leading zero)", () => {
    // "2026-6-25" does not match /^\d{4}-\d{2}-\d{2}$/ because "6" is not \d{2}
    const result = parseLocalDate({ localDate: "2026-6-25" });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
    assert.notStrictEqual(result, "2026-6-25");
  });

  it("rejects localDate with single-digit day (missing leading zero)", () => {
    const result = parseLocalDate({ localDate: "2026-06-5" });
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
    assert.notStrictEqual(result, "2026-06-5");
  });
});
