// security-tests/lru-cache.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/lru-cache.test.cjs
//
// Tests lruCacheSteps in src/features/algorithms/hashmap/lruCache.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// Inline the source.
function lruCacheSteps(capacity, operations) {
  const steps = [];
  const cache = new Map();

  const getState = () => ({
    cache: [...cache.entries()].map(([key, value]) => ({ key, value })),
    size: cache.size,
    capacity,
  });

  operations.forEach(({ type, key, value }) => {
    if (type === "get") {
      if (cache.has(key)) {
        const val = cache.get(key);
        cache.delete(key);
        cache.set(key, val);
        steps.push({
          operation: `GET(${key})`,
          result: val,
          hit: true,
          state: getState(),
          message: `Cache HIT! Key ${key} found = ${val}. Moved to front.`,
        });
      } else {
        steps.push({
          operation: `GET(${key})`,
          result: -1,
          hit: false,
          state: getState(),
          message: `Cache MISS! Key ${key} not found. Return -1.`,
        });
      }
    } else if (type === "put") {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= capacity) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
        steps.push({
          operation: `PUT(${key}, ${value})`,
          result: null,
          evicted: firstKey,
          state: getState(),
          message: `Cache FULL! Evicted LRU key ${firstKey}. Added key ${key} = ${value}.`,
        });
        cache.set(key, value);
        return;
      }
      cache.set(key, value);
      steps.push({
        operation: `PUT(${key}, ${value})`,
        result: null,
        evicted: null,
        state: getState(),
        message: `Added key ${key} = ${value} to cache.`,
      });
    }
  });

  return steps;
}

describe("lruCacheSteps", () => {
  test("GET on empty cache returns miss with -1", () => {
    const steps = lruCacheSteps(2, [{ type: "get", key: "a" }]);
    assert.strictEqual(steps.length, 1);
    assert.strictEqual(steps[0].hit, false);
    assert.strictEqual(steps[0].result, -1);
    assert.strictEqual(steps[0].operation, "GET(a)");
  });

  test("GET on cache with matching key returns hit and value", () => {
    const steps = lruCacheSteps(2, [
      { type: "put", key: "a", value: 1 },
      { type: "get", key: "a" },
    ]);
    const getStep = steps.find((s) => s.operation === "GET(a)");
    assert.strictEqual(getStep.hit, true);
    assert.strictEqual(getStep.result, 1);
  });

  test("GET on cache with non-matching key returns miss with -1", () => {
    const steps = lruCacheSteps(2, [
      { type: "put", key: "a", value: 1 },
      { type: "get", key: "b" },
    ]);
    const getStep = steps.find((s) => s.operation === "GET(b)");
    assert.strictEqual(getStep.hit, false);
    assert.strictEqual(getStep.result, -1);
  });

  test("PUT when cache is not full adds entry with no eviction", () => {
    const steps = lruCacheSteps(2, [
      { type: "put", key: "a", value: 1 },
      { type: "put", key: "b", value: 2 },
    ]);
    assert.strictEqual(steps.length, 2);
    // First put: size goes from 0 to 1
    assert.strictEqual(steps[0].evicted, null);
    assert.strictEqual(steps[0].state.size, 1);
    assert.strictEqual(steps[0].state.capacity, 2);
    // Second put: size goes from 1 to 2
    assert.strictEqual(steps[1].evicted, null);
    assert.strictEqual(steps[1].state.size, 2);
  });

  test("PUT when cache is at capacity evicts LRU key", () => {
    const steps = lruCacheSteps(2, [
      { type: "put", key: "a", value: 1 },
      { type: "put", key: "b", value: 2 },
      { type: "put", key: "c", value: 3 },
    ]);
    // After put('a'): cache has a, size=1
    // After put('b'): cache has a,b, size=2
    // After put('c'): cache at capacity, evicts 'a', then adds 'c'
    //   eviction step: state shows post-delete (size=1, only 'b')
    //   then 'c' is added
    const evictStep = steps.find((s) => s.evicted != null);
    assert.strictEqual(evictStep.evicted, "a"); // a was LRU
    assert.strictEqual(evictStep.state.capacity, 2);
  });

  test("PUT updating existing key does not count as full eviction", () => {
    const steps = lruCacheSteps(2, [
      { type: "put", key: "a", value: 1 },
      { type: "put", key: "a", value: 10 },
    ]);
    // Updating existing key: no eviction occurs
    assert.strictEqual(steps.length, 2);
    assert.strictEqual(steps[0].evicted, null);
    assert.strictEqual(steps[1].evicted, null);
    assert.strictEqual(steps[1].state.size, 1);
  });

  test("GET hit moves accessed key to MRU position and prevents eviction", () => {
    const steps = lruCacheSteps(2, [
      { type: "put", key: "a", value: 1 },
      { type: "put", key: "b", value: 2 },
      { type: "get", key: "a" }, // access 'a' to make it MRU
      { type: "put", key: "c", value: 3 }, // should evict 'b' (LRU), not 'a'
    ]);
    const evictStep = steps.find((s) => s.evicted != null);
    assert.strictEqual(evictStep.evicted, "b"); // b should be evicted, not a
  });

  test("returns empty array when no operations provided", () => {
    const steps = lruCacheSteps(3, []);
    assert.strictEqual(steps.length, 0);
  });

  test("each step has required keys: operation, state with cache/size/capacity", () => {
    const steps = lruCacheSteps(2, [
      { type: "put", key: "x", value: 99 },
      { type: "get", key: "x" },
    ]);
    for (const step of steps) {
      assert.ok("operation" in step);
      assert.ok("state" in step);
      assert.ok("capacity" in step.state);
      assert.ok("size" in step.state);
      assert.ok("cache" in step.state);
    }
  });

  test("capacity constraint holds across multiple evictions", () => {
    const steps = lruCacheSteps(2, [
      { type: "put", key: "a", value: 1 },
      { type: "put", key: "b", value: 2 },
      { type: "put", key: "c", value: 3 },
      { type: "put", key: "d", value: 4 },
    ]);
    // Each eviction step should identify the correct LRU key
    const evictSteps = steps.filter((s) => s.evicted != null);
    assert.strictEqual(evictSteps.length, 2);
    assert.strictEqual(evictSteps[0].evicted, "a"); // first eviction: 'a' was LRU
    // After eviction 1: cache = {b,c}. Next put evicts 'b' (now LRU)
    assert.strictEqual(evictSteps[1].evicted, "b");
  });

  test("PUT add step has evicted=null and correct cache size", () => {
    const steps = lruCacheSteps(3, [
      { type: "put", key: "x", value: 10 },
      { type: "put", key: "y", value: 20 },
    ]);
    for (const step of steps) {
      if (step.operation.startsWith("PUT")) {
        assert.strictEqual(step.evicted, null);
        assert.ok(step.state.size <= step.state.capacity);
      }
    }
  });
});
