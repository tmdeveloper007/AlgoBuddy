// security-tests/arenaSocket.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/arenaSocket.test.cjs
//
// Tests the BoundedMap class and isAllowedVercelOrigin function
// from arena-socket-server/index.js

const { describe, test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Inline BoundedMap from arena-socket-server/index.js
class BoundedMap {
  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
    this._map = new Map();
  }
  get(key) {
    const value = this._map.get(key);
    if (value !== undefined) {
      this._map.delete(key);
      this._map.set(key, value);
    }
    return value;
  }
  set(key, value) {
    if (this._map.has(key)) {
      this._map.delete(key);
    } else if (this._map.size >= this.maxSize) {
      const oldest = this._map.keys().next().value;
      if (oldest !== undefined) this._map.delete(oldest);
    }
    this._map.set(key, value);
  }
  delete(key) {
    return this._map.delete(key);
  }
  entries() {
    return this._map.entries();
  }
  get size() {
    return this._map.size;
  }
}

// Inline isAllowedVercelOrigin from arena-socket-server/index.js
function isAllowedVercelOrigin(origin) {
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    return hostname === 'algobuddy.vercel.app' ||
      hostname.endsWith('.algobuddy.vercel.app');
  } catch {
    return false;
  }
}

describe("BoundedMap", () => {
  test("starts empty", () => {
    const bm = new BoundedMap();
    assert.strictEqual(bm.size, 0);
    assert.strictEqual(bm.get("nonexistent"), undefined);
  });

  test("set and get return the correct value", () => {
    const bm = new BoundedMap();
    bm.set("key1", "value1");
    assert.strictEqual(bm.get("key1"), "value1");
    assert.strictEqual(bm.size, 1);
  });

  test("get moves accessed key to most-recent position (LRU behavior)", () => {
    const bm = new BoundedMap(3);
    bm.set("a", 1);
    bm.set("b", 2);
    bm.set("c", 3);
    // Access 'a' (which should move it to most-recent)
    bm.get("a");
    // Add 'd' — should evict 'b' (oldest accessed before 'a')
    bm.set("d", 4);
    assert.strictEqual(bm.get("a"), 1);
    assert.strictEqual(bm.get("b"), undefined); // evicted
    assert.strictEqual(bm.get("c"), 3);
    assert.strictEqual(bm.get("d"), 4);
  });

  test("updating an existing key does not change size", () => {
    const bm = new BoundedMap();
    bm.set("k", 1);
    bm.set("k", 2);
    assert.strictEqual(bm.size, 1);
    assert.strictEqual(bm.get("k"), 2);
  });

  test("deletes a key and reduces size", () => {
    const bm = new BoundedMap();
    bm.set("x", 10);
    assert.strictEqual(bm.delete("x"), true);
    assert.strictEqual(bm.size, 0);
    assert.strictEqual(bm.get("x"), undefined);
    assert.strictEqual(bm.delete("x"), false); // already gone
  });

  test("evicts the oldest entry when capacity is reached", () => {
    const bm = new BoundedMap(2);
    bm.set("a", 1);
    bm.set("b", 2);
    bm.set("c", 3); // capacity exceeded, 'a' should be evicted
    assert.strictEqual(bm.size, 2);
    assert.strictEqual(bm.get("a"), undefined); // evicted
    assert.strictEqual(bm.get("b"), 2);
    assert.strictEqual(bm.get("c"), 3);
  });

  test("evicts the oldest non-accessed entry when capacity is reached", () => {
    const bm = new BoundedMap(2);
    bm.set("a", 1);
    bm.set("b", 2);
    bm.get("a"); // mark 'a' as recently used
    bm.set("c", 3); // 'b' should be evicted (oldest)
    assert.strictEqual(bm.get("b"), undefined); // evicted
    assert.strictEqual(bm.get("a"), 1); // still there
    assert.strictEqual(bm.get("c"), 3);
  });

  test("evicts oldest when accessing does not prevent eviction on set", () => {
    const bm = new BoundedMap(2);
    bm.set("x", 1);
    bm.set("y", 2);
    bm.get("x"); // recent
    bm.get("y"); // most recent
    bm.set("z", 3); // capacity exceeded, 'x' should be evicted
    assert.strictEqual(bm.get("x"), undefined);
    assert.strictEqual(bm.size, 2);
  });
});

describe("isAllowedVercelOrigin", () => {
  test("allows the exact algobuddy.vercel.app domain", () => {
    assert.strictEqual(isAllowedVercelOrigin("https://algobuddy.vercel.app"), true);
  });

  test("allows subdomain of algobuddy.vercel.app", () => {
    assert.strictEqual(isAllowedVercelOrigin("https://www.algobuddy.vercel.app"), true);
    assert.strictEqual(isAllowedVercelOrigin("https://foo.bar.algobuddy.vercel.app"), true);
  });

  test("rejects non-vercel-app hosts", () => {
    assert.strictEqual(isAllowedVercelOrigin("https://algobuddy.vercel.dev"), false);
    assert.strictEqual(isAllowedVercelOrigin("https://algobuddy.fake.com"), false);
    assert.strictEqual(isAllowedVercelOrigin("https://evilarcodel.com/algobuddy.vercel.app"), false);
  });

  test("rejects attacker-controlled subdomain of vercel.app", () => {
    // This is a critical security check — subdomain takeover or similar
    assert.strictEqual(isAllowedVercelOrigin("https://algobuddy.attacker.com"), false);
    assert.strictEqual(isAllowedVercelOrigin("https://algobuddy.vercel.app.attacker.com"), false);
  });

  test("rejects invalid URLs gracefully (returns false, does not throw)", () => {
    assert.strictEqual(isAllowedVercelOrigin("not-a-url"), false);
    assert.strictEqual(isAllowedVercelOrigin(""), false);
    assert.strictEqual(isAllowedVercelOrigin(null), false);
    assert.strictEqual(isAllowedVercelOrigin(undefined), false);
  });

  test("hostname matching is case-insensitive", () => {
    assert.strictEqual(isAllowedVercelOrigin("https://Algobuddy.Vercel.App"), true);
    assert.strictEqual(isAllowedVercelOrigin("https://WWW.Algobuddy.Vercel.App"), true);
  });
});
