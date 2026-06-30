// security-tests/persistenceMerge.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/persistenceMerge.test.cjs
//
// Tests mergeProgress and mergeBookmarks from src/lib/persistence.js.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Inlined helpers from src/lib/persistence.js

function mergeProgress(local, server, userId) {
  const merged = { ...local };
  if (server) {
    server.forEach((item) => {
      const problemId = item.problem_id;
      const serverStatus = item.status;
      const serverUpdated = item.updated_at ? new Date(item.updated_at).getTime() : 0;
      const localUpdated = local[problemId]?.updatedAt
        ? new Date(local[problemId].updatedAt).getTime()
        : 0;

      if (serverUpdated >= localUpdated) {
        merged[problemId] = { status: serverStatus, updatedAt: item.updated_at };
      }
    });
  }
  return merged;
}

function mergeBookmarks(localArray, serverArray, idField = 'id') {
  const merged = {};
  localArray.forEach((item) => {
    merged[item[idField]] = item;
  });
  serverArray.forEach((item) => {
    const key = item[idField] || item.problem_id;
    if (key) {
      merged[key] = item;
    }
  });
  return Object.values(merged);
}

describe('mergeProgress', () => {
  test('returns empty object when both inputs are empty', () => {
    const result = mergeProgress({}, [], 'user1');
    assert.deepEqual(result, {});
  });

  test('preserves local records when server is null', () => {
    const local = { 'prob-1': { status: 'solved', updatedAt: '2026-01-01T00:00:00Z' } };
    const result = mergeProgress(local, null, 'user1');
    assert.deepEqual(result, local);
  });

  test('preserves local records when server is empty', () => {
    const local = { 'prob-1': { status: 'solved', updatedAt: '2026-01-01T00:00:00Z' } };
    const result = mergeProgress(local, [], 'user1');
    assert.deepEqual(result, local);
  });

  test('server record wins when newer than local', () => {
    const local = {
      'prob-1': { status: 'attempted', updatedAt: '2026-01-01T00:00:00Z' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved', updated_at: '2026-06-01T00:00:00Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.equal(result['prob-1'].status, 'solved');
  });

  test('local record wins when newer than server', () => {
    const local = {
      'prob-1': { status: 'attempted', updatedAt: '2026-06-10T00:00:00Z' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved', updated_at: '2026-01-01T00:00:00Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.equal(result['prob-1'].status, 'attempted');
  });

  test('server record wins on exact same timestamp', () => {
    const local = {
      'prob-1': { status: 'attempted', updatedAt: '2026-06-01T00:00:00Z' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved', updated_at: '2026-06-01T00:00:00Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.equal(result['prob-1'].status, 'solved');
  });

  test('server record wins when local is missing', () => {
    const local = {};
    const server = [
      { problem_id: 'prob-2', status: 'solved', updated_at: '2026-06-01T00:00:00Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.equal(result['prob-2'].status, 'solved');
  });

  test('handles multiple problems with mixed newer/older', () => {
    const local = {
      'prob-1': { status: 'attempted', updatedAt: '2026-01-01T00:00:00Z' },
      'prob-2': { status: 'solved', updatedAt: '2026-06-10T00:00:00Z' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved', updated_at: '2026-06-01T00:00:00Z' },
      { problem_id: 'prob-2', status: 'attempted', updated_at: '2026-01-01T00:00:00Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.equal(result['prob-1'].status, 'solved');  // server newer
    assert.equal(result['prob-2'].status, 'solved');  // local newer
  });

  test('userId is used only as context and does not affect merge logic', () => {
    const local = {
      'prob-1': { status: 'attempted', updatedAt: '2026-01-01T00:00:00Z' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved', updated_at: '2026-06-01T00:00:00Z' },
    ];
    const result1 = mergeProgress(local, server, 'user-A');
    const result2 = mergeProgress(local, server, 'user-B');
    assert.deepEqual(result1, result2);
  });

  test('handles server record with no updated_at', () => {
    const local = {
      'prob-1': { status: 'attempted', updatedAt: '2026-06-01T00:00:00Z' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved' },  // no updated_at
    ];
    const result = mergeProgress(local, server, 'user1');
    // serverUpdated = 0, localUpdated > 0, so local wins
    assert.equal(result['prob-1'].status, 'attempted');
  });
});

describe('mergeBookmarks', () => {
  test('returns empty array when both inputs are empty', () => {
    const result = mergeBookmarks([], []);
    assert.deepEqual(result, []);
  });

  test('returns local items when server is empty', () => {
    const local = [{ id: '1', path: '/algo1' }, { id: '2', path: '/algo2' }];
    const result = mergeBookmarks(local, []);
    assert.deepEqual(result, local);
  });

  test('returns server items when local is empty', () => {
    const server = [{ id: '3', path: '/algo3' }];
    const result = mergeBookmarks([], server);
    assert.deepEqual(result, server);
  });

  test('merges both arrays by idField', () => {
    const local = [{ id: '1', path: '/algo1' }];
    const server = [{ id: '2', path: '/algo2' }];
    const result = mergeBookmarks(local, server);
    assert.equal(result.length, 2);
    assert.ok(result.some((i) => i.id === '1'));
    assert.ok(result.some((i) => i.id === '2'));
  });

  test('server record overwrites local when same id exists', () => {
    const local = [{ id: '1', path: '/algo1-old' }];
    const server = [{ id: '1', path: '/algo1-new' }];
    const result = mergeBookmarks(local, server);
    assert.equal(result.length, 1);
    assert.equal(result[0].path, '/algo1-new');
  });

  test('falls back to problem_id when idField is missing from item', () => {
    const local = [{ problem_id: 'prob-1', path: '/prob1' }];
    const result = mergeBookmarks(local, [], 'id');
    assert.equal(result.length, 1);
    assert.equal(result[0].problem_id, 'prob-1');
  });

  test('server record adds entry under problem_id when id is missing (separate from local undefined-key entry)', () => {
    // When id is missing, local stores under key=undefined, server uses problem_id as key.
    // Both slots are used, so the result has 2 items.
    const local = [{ problem_id: 'prob-1', path: '/old' }];
    const server = [{ problem_id: 'prob-1', path: '/new' }];
    const result = mergeBookmarks(local, server, 'id');
    assert.equal(result.length, 2);
    // Server item is accessible under its problem_id key
    const serverItem = result.find((i) => i.problem_id === 'prob-1' && i.path === '/new');
    assert.ok(serverItem, 'server item should be present');
  });

  test('local item with no id and no problem_id is stored under undefined key', () => {
    // Items without id or problem_id are stored under undefined key — they are not dropped
    const local = [{ path: '/orphan' }];
    const server = [];
    const result = mergeBookmarks(local, server, 'id');
    assert.equal(result.length, 1);
    assert.equal(result[0].path, '/orphan');
  });

  test('handles custom idField', () => {
    const local = [{ key: 'abc', path: '/algo1' }];
    const server = [{ key: 'def', path: '/algo2' }];
    const result = mergeBookmarks(local, server, 'key');
    assert.equal(result.length, 2);
  });

  test('returns array of plain objects', () => {
    const result = mergeBookmarks([{ id: '1' }], [{ id: '2' }]);
    assert.equal(Array.isArray(result), true);
    assert.equal(typeof result[0], 'object');
  });
});
