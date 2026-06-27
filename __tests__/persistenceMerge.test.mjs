// __tests__/persistenceMerge.test.mjs
//
// Run with:  NODE_OPTIONS="--experimental-vm-modules" npx jest __tests__/persistenceMerge.test.mjs --colors=false
//
// Tests the mergeProgress and mergeBookmarks methods in src/lib/persistence.js.

import { describe, expect, test } from "@jest/globals";
import { persistence } from "../src/lib/persistence.js";

describe("mergeProgress", () => {
  test("returns empty merged object when both inputs are empty", () => {
    const result = persistence.mergeProgress({}, null, "user-1");
    expect(result).toEqual({});
  });

  test("server item wins when it is newer than local", () => {
    const local = {
      problem1: { status: "attempted", updatedAt: "2026-06-01T00:00:00Z" },
    };
    const server = [
      { problem_id: "problem1", status: "solved", updated_at: "2026-06-15T00:00:00Z" },
    ];
    const result = persistence.mergeProgress(local, server, "user-1");
    expect(result.problem1.status).toBe("solved");
    expect(result.problem1.updatedAt).toBe("2026-06-15T00:00:00Z");
  });

  test("local item wins when it is newer than server", () => {
    const local = {
      problem1: { status: "solved", updatedAt: "2026-06-20T00:00:00Z" },
    };
    const server = [
      { problem_id: "problem1", status: "attempted", updated_at: "2026-06-01T00:00:00Z" },
    ];
    const result = persistence.mergeProgress(local, server, "user-1");
    expect(result.problem1.status).toBe("solved");
    expect(result.problem1.updatedAt).toBe("2026-06-20T00:00:00Z");
  });

  test("server item wins when local has no updatedAt", () => {
    const local = {
      problem1: { status: "attempted" },
    };
    const server = [
      { problem_id: "problem1", status: "solved", updated_at: "2026-06-15T00:00:00Z" },
    ];
    const result = persistence.mergeProgress(local, server, "user-1");
    expect(result.problem1.status).toBe("solved");
  });

  test("local item wins when server item has no updated_at", () => {
    const local = {
      problem1: { status: "solved", updatedAt: "2026-06-20T00:00:00Z" },
    };
    const server = [{ problem_id: "problem1", status: "attempted" }];
    const result = persistence.mergeProgress(local, server, "user-1");
    expect(result.problem1.status).toBe("solved");
  });

  test("merges local-only and server-only items", () => {
    const local = {
      problem1: { status: "solved", updatedAt: "2026-06-20T00:00:00Z" },
    };
    const server = [
      { problem_id: "problem2", status: "attempted", updated_at: "2026-06-10T00:00:00Z" },
    ];
    const result = persistence.mergeProgress(local, server, "user-1");
    expect(result.problem1.status).toBe("solved");
    expect(result.problem2.status).toBe("attempted");
  });

  test("handles null server gracefully", () => {
    const local = { problem1: { status: "attempted" } };
    const result = persistence.mergeProgress(local, null, "user-1");
    expect(result.problem1.status).toBe("attempted");
  });
});

describe("mergeBookmarks", () => {
  test("deduplicates by idField when both arrays have the same item", () => {
    const local = [{ id: "b1", title: "Local Title", url: "http://local" }];
    const server = [{ id: "b1", title: "Server Title", url: "http://server" }];
    const result = persistence.mergeBookmarks(local, server, "id");
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe("http://server");
  });

  test("keeps local-only and server-only items", () => {
    const local = [{ id: "b1", title: "Local" }];
    const server = [{ id: "b2", title: "Server" }];
    const result = persistence.mergeBookmarks(local, server, "id");
    expect(result).toHaveLength(2);
  });

  test("server items fall back to problem_id when idField is absent", () => {
    // Server uses problem_id fallback; local uses idField directly (may key as undefined)
    const local = [{ id: "p1", title: "Local" }];
    const server = [{ problem_id: "p1", title: "Server" }];
    const result = persistence.mergeBookmarks(local, server, "id");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Server");
  });

  test("skips items with no matching key", () => {
    const local = [{ id: "b1", title: "Local" }];
    const server = [];
    const result = persistence.mergeBookmarks(local, server, "id");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Local");
  });

  test("handles empty arrays", () => {
    const result = persistence.mergeBookmarks([], [], "id");
    expect(result).toEqual([]);
  });
});
