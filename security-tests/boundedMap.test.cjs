// security-tests/boundedMap.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/boundedMap.test.cjs
//
// Tests the BoundedMap class from arena-socket-server/index.js.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Inlined BoundedMap from arena-socket-server/index.js

class BoundedMap {
  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
    this._map = new Map();
  }
  get(key) {
    return this._map.get(key);
  }
  set(key, value) {
    const hadKey = this._map.has(key);
    const previousValue = this._map.get(key);
    if (hadKey) {
      this._map.delete(key);
    } else if (this._map.size >= this.maxSize) {
      const oldest = this._map.keys().next().value;
      if (oldest !== undefined) this._map.delete(oldest);
    }
    this._map.set(key, value);
    return previousValue;
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

describe('BoundedMap', () => {
  test('starts empty with default maxSize', () => {
    const map = new BoundedMap();
    assert.equal(map.size, 0);
  });

  test('starts empty with custom maxSize', () => {
    const map = new BoundedMap(5);
    assert.equal(map.size, 0);
  });

  test('set stores the value and returns undefined for new key', () => {
    const map = new BoundedMap();
    const prev = map.set('a', 1);
    assert.equal(prev, undefined);
    assert.equal(map.get('a'), 1);
  });

  test('set returns previous value if key already existed', () => {
    const map = new BoundedMap();
    map.set('a', 1);
    const prev = map.set('a', 2);
    assert.equal(prev, 1);
    assert.equal(map.get('a'), 2);
  });

  test('set replaces existing key without affecting count', () => {
    const map = new BoundedMap();
    map.set('a', 1);
    map.set('b', 2);
    map.set('a', 10);
    assert.equal(map.size, 2);
  });

  test('set evicts oldest entry when maxSize is exceeded', () => {
    const map = new BoundedMap(3);
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    assert.equal(map.size, 3);
    map.set('d', 4);
    assert.equal(map.size, 3);
    assert.equal(map.get('a'), undefined); // evicted
    assert.equal(map.get('d'), 4);
  });

  test('eviction is FIFO — oldest is evicted first', () => {
    const map = new BoundedMap(2);
    map.set('first', 1);
    map.set('second', 2);
    map.set('third', 3);
    assert.equal(map.get('first'), undefined);
    assert.equal(map.get('second'), 2);
    assert.equal(map.get('third'), 3);
  });

  test('updating an existing key refreshes its position in eviction order', () => {
    const map = new BoundedMap(3);
    map.set('a', 1);
    map.set('b', 2);
    map.set('c', 3);
    map.set('a', 10); // refresh 'a'
    map.set('d', 4);  // should evict 'b' (oldest non-refreshed)
    assert.equal(map.get('a'), 10);
    assert.equal(map.get('b'), undefined); // evicted
    assert.equal(map.get('c'), 3);
    assert.equal(map.get('d'), 4);
  });

  test('delete returns true for existing key', () => {
    const map = new BoundedMap();
    map.set('a', 1);
    assert.equal(map.delete('a'), true);
    assert.equal(map.get('a'), undefined);
  });

  test('delete returns false for missing key', () => {
    const map = new BoundedMap();
    assert.equal(map.delete('nonexistent'), false);
  });

  test('get returns undefined for missing key', () => {
    const map = new BoundedMap();
    assert.equal(map.get('nonexistent'), undefined);
  });

  test('entries returns an iterator over map entries', () => {
    const map = new BoundedMap();
    map.set('x', 10);
    map.set('y', 20);
    const entries = [...map.entries()];
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    assert.deepEqual(entries, [['x', 10], ['y', 20]]);
  });

  test('size reflects current entry count', () => {
    const map = new BoundedMap();
    assert.equal(map.size, 0);
    map.set('a', 1);
    assert.equal(map.size, 1);
    map.set('b', 2);
    assert.equal(map.size, 2);
    map.delete('a');
    assert.equal(map.size, 1);
  });

  test('handles maxSize of 1 correctly', () => {
    const map = new BoundedMap(1);
    map.set('a', 1);
    assert.equal(map.size, 1);
    map.set('b', 2);
    assert.equal(map.size, 1);
    assert.equal(map.get('a'), undefined);
    assert.equal(map.get('b'), 2);
  });
});
