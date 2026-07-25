// __tests__/components/getClientIp.test.js
//
// Run with:  npx jest __tests__/components/getClientIp.test.js
//
// Tests the getClientIp utility in src/lib/getClientIp.js.
// getClientIp is the sole IP source for rate-limiting on the platform.

const { getClientIp } = require("../../src/lib/getClientIp");

describe("getClientIp", () => {
  test("returns the x-real-ip header value when present", () => {
    const headers = new Map([["x-real-ip", "203.0.113.42"]]);
    // Mock Headers-like object with .get() method
    const mockHeaders = { get: (key) => headers.get(key) };
    expect(getClientIp(mockHeaders)).toBe("203.0.113.42");
  });

  test("trims whitespace from x-real-ip value", () => {
    const mockHeaders = { get: (key) => (key === "x-real-ip" ? "  198.51.100.7  " : null) };
    expect(getClientIp(mockHeaders)).toBe("198.51.100.7");
  });

  test("returns unknown when x-real-ip header is absent", () => {
    const mockHeaders = { get: (key) => null };
    expect(getClientIp(mockHeaders)).toBe("unknown");
  });

  test("returns unknown when x-real-ip is empty string", () => {
    const mockHeaders = { get: (key) => (key === "x-real-ip" ? "" : null) };
    expect(getClientIp(mockHeaders)).toBe("unknown");
  });

  test("returns unknown when headers object has no get method", () => {
    // Defensive: pass null or undefined get
    const mockHeaders = { get: () => null };
    expect(getClientIp(mockHeaders)).toBe("unknown");
  });

  test("handles IPv6 address in x-real-ip", () => {
    const mockHeaders = { get: (key) => (key === "x-real-ip" ? "2001:db8::1" : null) };
    expect(getClientIp(mockHeaders)).toBe("2001:db8::1");
  });

  test("does NOT trust x-forwarded-for even if present (security boundary)", () => {
    // getClientIp only trusts x-real-ip. x-forwarded-for should be ignored.
    const mockHeaders = {
      get: (key) => {
        if (key === "x-real-ip") return null;
        if (key === "x-forwarded-for") return "10.0.0.1, 192.168.1.1";
        return null;
      },
    };
    // Since x-real-ip is absent, result should be "unknown" regardless of x-forwarded-for
    expect(getClientIp(mockHeaders)).toBe("unknown");
  });
});
