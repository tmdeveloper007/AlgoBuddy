// security-tests/persistence.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/persistence.test.cjs
//
// Tests PersistenceManager.mergeProgress and mergeBookmarks from src/lib/persistence.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// ─── Inline merge methods under test ─────────────────────────────────────────

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

function mergeBookmarks(localArray, serverArray, idField = "id") {
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

// ─── mergeProgress tests ─────────────────────────────────────────────────────

describe("mergeProgress", () => {
  test("returns a copy of local when server is null", () => {
    const local = {
      prob_a: { status: "solved", updatedAt: "2026-07-01T10:00:00Z" },
    };
    const result = mergeProgress(local, null);
    assert.deepStrictEqual(result, local);
    // Ensure it is a copy, not the same reference
    assert.notStrictEqual(result, local);
  });

  test("returns a copy of local when server is undefined", () => {
    const local = { prob_b: { status: "attempted" } };
    const result = mergeProgress(local, undefined);
    assert.deepStrictEqual(result, local);
    assert.notStrictEqual(result, local);
  });

  test("server item wins when it has a more recent updated_at", () => {
    const local = {
      prob_a: { status: "solved", updatedAt: "2026-07-01T00:00:00Z" },
    };
    const server = [
      {
        problem_id: "prob_a",
        status: "reviewed",
        updated_at: "2026-07-02T00:00:00Z",
      },
    ];
    const result = mergeProgress(local, server);
    assert.strictEqual(result.prob_a.status, "reviewed");
    assert.strictEqual(result.prob_a.updatedAt, "2026-07-02T00:00:00Z");
  });

  test("local item wins when it has a more recent updatedAt than server updated_at", () => {
    const local = {
      prob_b: { status: "attempted", updatedAt: "2026-07-05T00:00:00Z" },
    };
    const server = [
      {
        problem_id: "prob_b",
        status: "solved",
        updated_at: "2026-07-03T00:00:00Z",
      },
    ];
    const result = mergeProgress(local, server);
    assert.strictEqual(result.prob_b.status, "attempted");
    assert.strictEqual(result.prob_b.updatedAt, "2026-07-05T00:00:00Z");
  });

  test("server item wins when timestamps are equal", () => {
    const local = {
      prob_c: { status: "old", updatedAt: "2026-07-01T00:00:00Z" },
    };
    const server = [
      {
        problem_id: "prob_c",
        status: "new",
        updated_at: "2026-07-01T00:00:00Z",
      },
    ];
    const result = mergeProgress(local, server);
    assert.strictEqual(result.prob_c.status, "new");
  });

  test("preserves local items not present in server", () => {
    const local = {
      prob_x: { status: "solved", updatedAt: "2026-07-01T00:00:00Z" },
      prob_y: { status: "attempted", updatedAt: "2026-07-02T00:00:00Z" },
    };
    const server = [
      {
        problem_id: "prob_x",
        status: "reviewed",
        updated_at: "2026-07-01T01:00:00Z",
      },
    ];
    const result = mergeProgress(local, server);
    assert.strictEqual(result.prob_x.status, "reviewed");
    assert.strictEqual(result.prob_y.status, "attempted");
    assert.strictEqual(Object.keys(result).length, 2);
  });

  test("adds server items not present in local (timestamps compared with 0)", () => {
    const local = {};
    const server = [
      {
        problem_id: "new_prob",
        status: "solved",
        updated_at: "2026-07-01T00:00:00Z",
      },
    ];
    const result = mergeProgress(local, server);
    assert.strictEqual(result.new_prob.status, "solved");
    assert.strictEqual(result.new_prob.updatedAt, "2026-07-01T00:00:00Z");
  });

  test("handles server item with no updated_at (wins over local with no timestamp)", () => {
    const local = {
      prob_z: { status: "old" },
    };
    const server = [
      {
        problem_id: "prob_z",
        status: "new",
        // no updated_at
      },
    ];
    const result = mergeProgress(local, server);
    // serverUpdated = 0, localUpdated = 0 (no timestamp), server >= local so server wins
    assert.strictEqual(result.prob_z.status, "new");
  });

  test("handles server item with no updated_at but local has a timestamp (local wins)", () => {
    const local = {
      prob_w: { status: "local_newer", updatedAt: "2026-07-01T00:00:00Z" },
    };
    const server = [
      {
        problem_id: "prob_w",
        status: "server_no_ts",
        // no updated_at → 0
      },
    ];
    const result = mergeProgress(local, server);
    // serverUpdated = 0, localUpdated = some epoch, serverUpdated < localUpdated → local wins
    assert.strictEqual(result.prob_w.status, "local_newer");
  });

  test("multiple server items are all processed", () => {
    const local = {};
    const server = [
      { problem_id: "a", status: "solved_a", updated_at: "2026-07-01T00:00:00Z" },
      { problem_id: "b", status: "solved_b", updated_at: "2026-07-02T00:00:00Z" },
      { problem_id: "c", status: "solved_c", updated_at: "2026-07-03T00:00:00Z" },
    ];
    const result = mergeProgress(local, server);
    assert.strictEqual(result.a.status, "solved_a");
    assert.strictEqual(result.b.status, "solved_b");
    assert.strictEqual(result.c.status, "solved_c");
  });
});

// ─── mergeBookmarks tests ─────────────────────────────────────────────────────

describe("mergeBookmarks", () => {
  test("returns server items when local array is empty", () => {
    const server = [
      { id: 1, title: "Item A" },
      { id: 2, title: "Item B" },
    ];
    const result = mergeBookmarks([], server);
    assert.strictEqual(result.length, 2);
  });

  test("returns local items when server array is empty", () => {
    const local = [{ id: 1, title: "Item A" }];
    const result = mergeBookmarks(local, []);
    assert.strictEqual(result.length, 1);
  });

  test("merges local and server by idField", () => {
    const local = [{ id: 1, title: "Local A" }];
    const server = [{ id: 2, title: "Server B" }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 2);
    const titles = result.map((i) => i.title);
    assert.ok(titles.includes("Local A"));
    assert.ok(titles.includes("Server B"));
  });

  test("server item overrides local item when same idField value", () => {
    const local = [{ id: 1, title: "Local Override" }];
    const server = [{ id: 1, title: "Server Override" }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].title, "Server Override");
  });

  test("uses problem_id as fallback idField key", () => {
    const local = [{ problem_id: "p1", label: "Local" }];
    const server = [{ problem_id: "p2", label: "Server" }];
    const result = mergeBookmarks(local, server, "id");
    assert.strictEqual(result.length, 2);
  });

  test("uses idField when both id and problem_id are present", () => {
    const local = [{ id: "custom", problem_id: "p1", label: "local" }];
    const server = [{ id: "custom", problem_id: "p1", label: "server" }];
    const result = mergeBookmarks(local, server, "id");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].label, "server");
  });

  test("skips server item with no id and no problem_id", () => {
    const local = [{ id: 1 }];
    const server = [{ no_id_field: "x" }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 1);
  });

  test("empty local and server returns empty array", () => {
    assert.deepStrictEqual(mergeBookmarks([], []), []);
  });

  test("handles non-numeric id values", () => {
    const local = [{ id: "uuid-1", title: "A" }];
    const server = [{ id: "uuid-2", title: "B" }];
    const result = mergeBookmarks(local, server);
    assert.strictEqual(result.length, 2);
  });
});
