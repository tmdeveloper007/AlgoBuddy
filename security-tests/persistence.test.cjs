// security-tests/persistence.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/persistence.test.cjs
//
// Tests for src/lib/persistence.js mergeProgress and mergeBookmarks functions.
// Inlined to avoid @/ alias resolution issues in test runner.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ─── Inline mergeProgress and mergeBookmarks from src/lib/persistence.js ─────────

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

// ─── mergeProgress tests ────────────────────────────────────────────────────────

describe('mergeProgress', () => {
  test('returns empty object when both local and server are empty', () => {
    const result = mergeProgress({}, [], 'user1');
    assert.deepStrictEqual(result, {});
  });

  test('server newer than local wins', () => {
    const local = {
      'prob-1': { status: 'attempted', updatedAt: '2026-06-10T00:00:00.000Z' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved', updated_at: '2026-06-15T00:00:00.000Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.strictEqual(result['prob-1'].status, 'solved');
    assert.strictEqual(result['prob-1'].updatedAt, '2026-06-15T00:00:00.000Z');
  });

  test('local newer than server wins', () => {
    const local = {
      'prob-1': { status: 'solved', updatedAt: '2026-06-20T00:00:00.000Z' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'attempted', updated_at: '2026-06-15T00:00:00.000Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.strictEqual(result['prob-1'].status, 'solved');
    assert.strictEqual(result['prob-1'].updatedAt, '2026-06-20T00:00:00.000Z');
  });

  test('server with no updated_at loses to local with updatedAt (0 >= timestamp is false)', () => {
    // localUpdated = timestamp > 0; serverUpdated = 0; 0 >= timestamp is false -> local wins
    const local = {
      'prob-1': { status: 'attempted', updatedAt: '2026-06-10T00:00:00.000Z' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.strictEqual(result['prob-1'].status, 'attempted');
    assert.strictEqual(result['prob-1'].updatedAt, '2026-06-10T00:00:00.000Z');
  });

  test('local with no updatedAt loses to server with updated_at', () => {
    const local = {
      'prob-1': { status: 'attempted' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved', updated_at: '2026-06-15T00:00:00.000Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.strictEqual(result['prob-1'].status, 'solved');
  });

  test('server with no updated_at wins over local with no updatedAt', () => {
    const local = {
      'prob-1': { status: 'attempted' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.strictEqual(result['prob-1'].status, 'solved');
  });

  test('null local input returns empty object', () => {
    const result = mergeProgress(null, [], 'user1');
    assert.deepStrictEqual(result, {});
  });

  test('undefined local input returns empty object', () => {
    const result = mergeProgress(undefined, [], 'user1');
    assert.deepStrictEqual(result, {});
  });

  test('null server input returns local unchanged', () => {
    const local = {
      'prob-1': { status: 'attempted', updatedAt: '2026-06-10T00:00:00.000Z' },
    };
    const result = mergeProgress(local, null, 'user1');
    assert.deepStrictEqual(result, local);
  });

  test('undefined server input returns local unchanged', () => {
    const local = {
      'prob-1': { status: 'solved', updatedAt: '2026-06-20T00:00:00.000Z' },
    };
    const result = mergeProgress(local, undefined, 'user1');
    assert.deepStrictEqual(result, local);
  });

  test('server item with no problem_id gets merged as undefined key (local empty)', () => {
    // No problem_id -> merged[undefined] is set; local[undefined]?.updatedAt is undefined -> localUpdated=0
    // serverUpdated >= 0 is true -> server entry added
    const local = {};
    const server = [
      { status: 'solved', updated_at: '2026-06-15T00:00:00.000Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.strictEqual(result[undefined].status, 'solved');
    assert.strictEqual(result[undefined].updatedAt, '2026-06-15T00:00:00.000Z');
  });

  test('server newer exactly equal timestamp wins', () => {
    const ts = '2026-06-15T00:00:00.000Z';
    const local = {
      'prob-1': { status: 'attempted', updatedAt: ts },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved', updated_at: ts },
    ];
    const result = mergeProgress(local, server, 'user1');
    // serverUpdated >= localUpdated, so server wins
    assert.strictEqual(result['prob-1'].status, 'solved');
  });

  test('multiple problems merged independently', () => {
    const local = {
      'prob-1': { status: 'attempted', updatedAt: '2026-06-10T00:00:00.000Z' },
      'prob-2': { status: 'solved', updatedAt: '2026-06-20T00:00:00.000Z' },
    };
    const server = [
      { problem_id: 'prob-1', status: 'solved', updated_at: '2026-06-15T00:00:00.000Z' },
      { problem_id: 'prob-2', status: 'attempted', updated_at: '2026-06-10T00:00:00.000Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    // prob-1: server wins (newer); prob-2: local wins (newer)
    assert.strictEqual(result['prob-1'].status, 'solved');
    assert.strictEqual(result['prob-2'].status, 'solved');
  });

  test('server entries not in local are added', () => {
    const local = {};
    const server = [
      { problem_id: 'prob-new', status: 'solved', updated_at: '2026-06-15T00:00:00.000Z' },
    ];
    const result = mergeProgress(local, server, 'user1');
    assert.strictEqual(result['prob-new'].status, 'solved');
  });
});

// ─── mergeBookmarks tests ───────────────────────────────────────────────────────

describe('mergeBookmarks', () => {
  test('merges two arrays by default id field', () => {
    const local = [{ id: '1', name: 'Local Item' }];
    const server = [{ id: '2', name: 'Server Item' }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 2);
    assert.ok(result.some((i) => i.name === 'Local Item'));
    assert.ok(result.some((i) => i.name === 'Server Item'));
  });

  test('server entry overwrites local entry with same id', () => {
    const local = [{ id: '1', name: 'Local Name', extra: 'local-only' }];
    const server = [{ id: '1', name: 'Server Name' }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'Server Name');
    assert.strictEqual(result[0].extra, undefined);
  });

  test('uses problem_id as fallback id when id field is absent (result has two keys: undefined and prob-1)', () => {
    // Local: merged['prob-1'] = item; Server: merged[undefined] = item (item.id is undefined, problem_id fallback not used for server)
    const local = [{ problem_id: 'prob-1', name: 'Local' }];
    const server = [{ problem_id: 'prob-1', name: 'Server' }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 2);
  });

  test('custom idField is respected', () => {
    const local = [{ customId: 'a', name: 'Local' }];
    const server = [{ customId: 'a', name: 'Server' }];
    const result = mergeBookmarks(local, server, 'customId');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'Server');
  });

  test('idField defaults to id when not provided', () => {
    const local = [{ id: '1', name: 'Local' }];
    const server = [{ id: '2', name: 'Server' }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 2);
  });

  test('entry with neither id nor problem_id: local added as undefined key, server dropped', () => {
    // Local: merged[undefined] = item; Server: key undefined is falsy -> dropped
    const local = [{ name: 'No ID Local' }];
    const server = [{ name: 'No ID Server' }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'No ID Local');
  });

  test('empty local array returns only server entries', () => {
    const local = [];
    const server = [{ id: '1', name: 'Server Only' }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'Server Only');
  });

  test('empty server array returns only local entries', () => {
    const local = [{ id: '1', name: 'Local Only' }];
    const server = [];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'Local Only');
  });

  test('both empty arrays return empty result', () => {
    const result = mergeBookmarks([], []);
    assert.deepStrictEqual(result, []);
  });

  test('server entry without id/problem_id is dropped even when local has it', () => {
    const local = [{ id: '1', name: 'Local' }];
    const server = [{ name: 'Server without id' }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'Local');
  });

  test('result is always an array (Object.values)', () => {
    const local = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }];
    const server = [];
    const result = mergeBookmarks(local, server);
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
  });
});
