const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadGetClientIp() {
  const url = pathToFileURL(
    path.join(__dirname, "..", "src/lib/getClientIp.js"),
  ).href;
  const mod = await import(url);
  return mod.getClientIp;
}

test("returns trimmed IP when x-real-ip header is present", async () => {
  const getClientIp = await loadGetClientIp();
  const headers = new Map([["x-real-ip", "192.168.1.100"]]);

  assert.equal(getClientIp(headers), "192.168.1.100");
});

test("returns trimmed IP with surrounding whitespace", async () => {
  const getClientIp = await loadGetClientIp();
  const headers = new Map([["x-real-ip", "  10.0.0.1  "]]);

  assert.equal(getClientIp(headers), "10.0.0.1");
});

test("returns trimmed IPv6 address", async () => {
  const getClientIp = await loadGetClientIp();
  const headers = new Map([["x-real-ip", "2001:db8::1"]]);

  assert.equal(getClientIp(headers), "2001:db8::1");
});

test("returns unknown when x-real-ip header is missing", async () => {
  const getClientIp = await loadGetClientIp();
  const headers = new Map([]);

  assert.equal(getClientIp(headers), "unknown");
});

test("returns unknown when x-real-ip header is empty string", async () => {
  const getClientIp = await loadGetClientIp();
  const headers = new Map([["x-real-ip", ""]]);

  assert.equal(getClientIp(headers), "unknown");
});

test("returns trimmed value for whitespace-only x-real-ip header", async () => {
  const getClientIp = await loadGetClientIp();
  const headers = new Map([["x-real-ip", "   "]]);

  // Map stores the raw value; trim() removes surrounding whitespace
  assert.equal(getClientIp(headers), "");
});

test("prefers x-real-ip over other headers", async () => {
  const getClientIp = await loadGetClientIp();
  const headers = new Map([
    ["x-real-ip", "1.2.3.4"],
    ["x-forwarded-for", "5.6.7.8"],
    ["cf-connecting-ip", "9.9.9.9"],
  ]);

  assert.equal(getClientIp(headers), "1.2.3.4");
});

test("ignores x-forwarded-for when x-real-ip is present", async () => {
  const getClientIp = await loadGetClientIp();
  const headers = new Map([
    ["x-real-ip", "8.8.8.8"],
    ["x-forwarded-for", "spoofed.ip.here"],
  ]);

  assert.equal(getClientIp(headers), "8.8.8.8");
});
