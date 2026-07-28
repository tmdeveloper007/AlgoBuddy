// __tests__/getClientIp.test.js
//
// Run with:  npx jest __tests__/getClientIp.test.js --colors=false
//
// Tests getClientIp in src/lib/getClientIp.js.

const { getClientIp } = require("../src/lib/getClientIp.js");

function makeHeaders(entries = []) {
  const map = new Map(entries);
  return {
    get(name) {
      return map.get(name) ?? null;
    },
  };
}

describe("getClientIp", () => {
  test("returns x-real-ip header value when present", () => {
    const headers = makeHeaders([["x-real-ip", "192.168.1.100"]]);
    expect(getClientIp(headers)).toBe("192.168.1.100");
  });

  test("trims whitespace from x-real-ip", () => {
    const headers = makeHeaders([["x-real-ip", "  10.0.0.1  "]]);
    expect(getClientIp(headers)).toBe("10.0.0.1");
  });

  test("returns unknown when x-real-ip is absent", () => {
    const headers = makeHeaders([]);
    expect(getClientIp(headers)).toBe("unknown");
  });

  test("returns unknown when x-real-ip is empty string", () => {
    const headers = makeHeaders([["x-real-ip", ""]]);
    expect(getClientIp(headers)).toBe("unknown");
  });

  test("prefers x-real-ip over any other header", () => {
    // Only x-real-ip is trusted per implementation
    const headers = makeHeaders([
      ["x-real-ip", "1.2.3.4"],
      ["x-forwarded-for", "5.6.7.8"],
    ]);
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  test("handles IPv6 address", () => {
    const headers = makeHeaders([["x-real-ip", "2001:db8::1"]]);
    expect(getClientIp(headers)).toBe("2001:db8::1");
  });

  test("handles IPv4-mapped IPv6 address", () => {
    const headers = makeHeaders([["x-real-ip", "::ffff:192.168.1.1"]]);
    expect(getClientIp(headers)).toBe("::ffff:192.168.1.1");
  });
});
