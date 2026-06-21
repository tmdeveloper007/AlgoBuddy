// __tests__/generateLearningReminders.test.js
//
// Run with:  npx jest __tests__/generateLearningReminders.test.js --colors=false
//
// Tests generateLearningReminders in src/utils/generateLearningReminders.js.
// Note: activityDates must be an array of ISO date strings (e.g. "2026-06-20").
// activityDates = [] triggers Infinity days inactivity (pre-existing module behavior).

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

import generateLearningReminders from "../src/utils/generateLearningReminders.js";

describe("generateLearningReminders — empty / null input", () => {
  test("empty activityDates triggers practice_today and long_inactivity", () => {
    const reminders = generateLearningReminders({
      activityDates: [],
      activityTypes: [],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("practice_today");
    expect(ids).toContain("long_inactivity");
  });

  test("null entries in activityDates are safely ignored", () => {
    const reminders = generateLearningReminders({
      activityDates: [null, daysAgo(1)],
      activityTypes: [],
    });
    const ids = reminders.map((r) => r.id);
    // yesterday: practice_today, but NOT long_inactivity
    expect(ids).toContain("practice_today");
    expect(ids).not.toContain("long_inactivity");
  });

  test("undefined activityDates handled gracefully", () => {
    const reminders = generateLearningReminders({});
    // undefined -> treated as empty -> Infinity days
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("practice_today");
    expect(ids).toContain("long_inactivity");
  });
});

describe("generateLearningReminders — practice_today reminder", () => {
  test("no practice_today when last activity was today", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: [],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).not.toContain("practice_today");
  });

  test("practice_today when last activity was yesterday", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(1)],
      activityTypes: [],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("practice_today");
  });

  test("practice_today when last activity was 2 days ago", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(2)],
      activityTypes: [],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("practice_today");
  });
});

describe("generateLearningReminders — streak_risk reminder", () => {
  test("no streak_risk when streak is less than 3 consecutive days", () => {
    const dates = [daysAgo(0), daysAgo(1), daysAgo(2)]; // 3 days but < 3
    const reminders = generateLearningReminders({
      activityDates: dates,
      activityTypes: [],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).not.toContain("streak_risk");
  });

  test("streak_risk when last activity was yesterday and streak >= 3", () => {
    const dates = [daysAgo(0), daysAgo(1), daysAgo(2), daysAgo(3)]; // 4 consecutive
    const reminders = generateLearningReminders({
      activityDates: dates,
      activityTypes: [],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("streak_risk");
  });

  test("no streak_risk when last activity was today even with streak >= 3", () => {
    const dates = [];
    for (let i = 0; i < 5; i++) dates.push(daysAgo(i));
    const reminders = generateLearningReminders({
      activityDates: dates,
      activityTypes: [],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).not.toContain("streak_risk");
  });
});

describe("generateLearningReminders — inactivity reminders", () => {
  test("long_inactivity when inactive >= 7 days", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(10)],
      activityTypes: [],
    });
    const li = reminders.find((r) => r.id === "long_inactivity");
    expect(li).toBeDefined();
    expect(li.severity).toBe("high");
  });

  test("mild_inactivity when inactive >= 3 days and < 7", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(4)],
      activityTypes: [],
    });
    const mi = reminders.find((r) => r.id === "mild_inactivity");
    expect(mi).toBeDefined();
    expect(mi.severity).toBe("medium");
  });

  test("no inactivity when last activity within 2 days", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(2)],
      activityTypes: [],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).not.toContain("long_inactivity");
    expect(ids).not.toContain("mild_inactivity");
  });

  test("long_inactivity takes priority over mild_inactivity", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(10)],
      activityTypes: [],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("long_inactivity");
    expect(ids).not.toContain("mild_inactivity");
  });
});

describe("generateLearningReminders — module progress reminders", () => {
  test("near_completion when pct >= 80 and < 100", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: [],
      modulesCount: 10,
      completedModulesCount: 9,
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("near_completion");
  });

  test("keep_going when pct > 0 and < 80", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: [],
      modulesCount: 10,
      completedModulesCount: 5,
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("keep_going");
  });

  test("congratulations when all modules completed", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: [],
      modulesCount: 5,
      completedModulesCount: 5,
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("congratulations");
  });

  test("start_learning when modules exist but none completed", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: [],
      modulesCount: 5,
      completedModulesCount: 0,
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("start_learning");
  });

  test("no module reminder when modulesCount is 0", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: [],
      modulesCount: 0,
      completedModulesCount: 0,
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).not.toContain("near_completion");
    expect(ids).not.toContain("keep_going");
    expect(ids).not.toContain("congratulations");
    expect(ids).not.toContain("start_learning");
  });

  test("near_completion and congratulations are mutually exclusive", () => {
    const complete = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: [],
      modulesCount: 10,
      completedModulesCount: 10,
    });
    const near = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: [],
      modulesCount: 10,
      completedModulesCount: 9,
    });
    expect(complete.map((r) => r.id)).not.toContain("near_completion");
    expect(near.map((r) => r.id)).not.toContain("congratulations");
  });
});

describe("generateLearningReminders — try_visualizer suggestion", () => {
  test("try_visualizer added when no visualizer activity type", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: ["coding", "reading"],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).toContain("try_visualizer");
  });

  test("try_visualizer NOT added when visualizer activity type present", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: ["coding", "visualizer_session"],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).not.toContain("try_visualizer");
  });

  test("try_visualizer is case-insensitive for visualizer matching", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(0)],
      activityTypes: ["VISUALIZER", "GRAPH_VISUALIZER"],
    });
    const ids = reminders.map((r) => r.id);
    expect(ids).not.toContain("try_visualizer");
  });
});

describe("generateLearningReminders — deduplication and priority", () => {
  test("returns at most 5 reminders", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(10)],
      activityTypes: [],
      modulesCount: 10,
      completedModulesCount: 9,
    });
    expect(reminders.length).toBeLessThanOrEqual(5);
  });

  test("reminders sorted by severity (high before medium before low)", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(10)],
      activityTypes: [],
      modulesCount: 5,
      completedModulesCount: 3,
    });
    const severities = reminders.map((r) => r.severity);
    const highIdx = severities.indexOf("high");
    const medIdx = severities.indexOf("medium");
    const lowIdx = severities.indexOf("low");
    if (highIdx !== -1 && medIdx !== -1) {
      expect(highIdx).toBeLessThan(medIdx);
    }
    if (medIdx !== -1 && lowIdx !== -1) {
      expect(medIdx).toBeLessThan(lowIdx);
    }
  });

  test("duplicate ids are deduplicated", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(10)],
      activityTypes: [],
      modulesCount: 0,
      completedModulesCount: 0,
    });
    const ids = reminders.map((r) => r.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  test("each reminder has required properties: id, type, severity, message", () => {
    const reminders = generateLearningReminders({
      activityDates: [daysAgo(1)],
      activityTypes: [],
      modulesCount: 5,
      completedModulesCount: 3,
    });
    reminders.forEach((r) => {
      expect(typeof r.id).toBe("string");
      expect(r.id.length).toBeGreaterThan(0);
      expect(typeof r.type).toBe("string");
      expect(["encouragement", "streak", "warning", "nudge", "achievement", "suggestion"]).toContain(r.type);
      expect(["high", "medium", "low"]).toContain(r.severity);
      expect(typeof r.message).toBe("string");
      expect(r.message.length).toBeGreaterThan(0);
    });
  });
});
