import { describe, expect, test } from "@jest/globals";

// Inlined helpers from src/lib/auth.js to test pure validation logic
// without needing Supabase client or Next.js context.

function isValidSupabaseUrl(value) {
  if (!value) return false;
  const trimmed = String(value).trim();
  if (trimmed.startsWith("Your ")) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidKey(value) {
  if (!value) return false;
  const trimmed = String(value).trim();
  return trimmed && !trimmed.startsWith("Your ");
}

describe("isValidSupabaseUrl", () => {
  test("returns true for a valid https URL", () => {
    expect(isValidSupabaseUrl("https://myproject.supabase.co")).toBe(true);
  });

  test("returns true for a valid http URL", () => {
    expect(isValidSupabaseUrl("http://localhost:54321")).toBe(true);
    expect(isValidSupabaseUrl("http://127.0.0.1:54321")).toBe(true);
  });

  test("returns true for URL with path", () => {
    expect(isValidSupabaseUrl("https://myproject.supabase.co/rest/v1")).toBe(true);
  });

  test("returns false for null", () => {
    expect(isValidSupabaseUrl(null)).toBe(false);
  });

  test("returns false for undefined", () => {
    expect(isValidSupabaseUrl(undefined)).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isValidSupabaseUrl("")).toBe(false);
  });

  test("returns false for URL starting with placeholder 'Your '", () => {
    expect(isValidSupabaseUrl("Your Supabase URL")).toBe(false);
  });

  test("returns false for invalid URL", () => {
    expect(isValidSupabaseUrl("not-a-url")).toBe(false);
    expect(isValidSupabaseUrl("ftp://example.com")).toBe(false);
  });

  test("returns false for non-string values", () => {
    expect(isValidSupabaseUrl(123)).toBe(false);
    expect(isValidSupabaseUrl({})).toBe(false);
    expect(isValidSupabaseUrl([])).toBe(false);
  });

  test("trims whitespace before validating", () => {
    expect(isValidSupabaseUrl("  https://myproject.supabase.co  ")).toBe(true);
  });
});

describe("isValidKey", () => {
  test("returns true for a non-empty string key", () => {
    expect(isValidKey("abcdefghijklmnopqrstuvwxyz123456")).toBe(true);
  });

  test("returns true for a long base64-like JWT key", () => {
    const longKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMjE2MjQwMCwiZXhwIjoxOTM3NzM4NDAwfQ.signature";
    expect(isValidKey(longKey)).toBe(true);
  });

  test("returns false for null", () => {
    expect(isValidKey(null)).toBe(false);
  });

  test("returns false for undefined", () => {
    expect(isValidKey(undefined)).toBe(false);
  });

  test("returns false for empty string", () => {
    expect(isValidKey("")).toBe(false);
  });

  test("returns false for string starting with 'Your '", () => {
    expect(isValidKey("Your anon key")).toBe(false);
    expect(isValidKey("Your service_role key")).toBe(false);
  });

  test("returns false or falsy for whitespace-only string", () => {
    // whitespace-only trims to "" which is falsy
    expect(isValidKey("   ")).toBeFalsy();
  });

  test("returns truthy for non-string values that coerce to non-empty strings", () => {
    // String coercion converts these to non-empty strings before validation
    expect(isValidKey(123)).toBeTruthy();
    expect(isValidKey({})).toBeTruthy();
  });

  test("returns falsy for empty array (coerces to empty string)", () => {
    // String([]) = "" which is falsy
    expect(isValidKey([])).toBeFalsy();
  });

  test("trims whitespace before validating", () => {
    expect(isValidKey("  mykey123  ")).toBe(true);
  });
});
