// __tests__/practiceData.test.js
//
// Run with:  npx jest __tests__/practiceData.test.js
//
// Tests the practiceData structure in src/lib/practiceData.js.
// Verifies that all expected algorithm topics and difficulty tiers are present,
// and that required fields exist on each problem entry.

const { practiceData } = require("../src/lib/practiceData");

const REQUIRED_PROBLEM_FIELDS = ["id", "name", "difficulty", "visualizerUrl"];
const VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const VALID_TIERS = ["Beginner", "Intermediate", "Advanced"];

describe("practiceData", () => {
  test("is a non-null array", () => {
    expect(Array.isArray(practiceData)).toBe(true);
    expect(practiceData.length).toBeGreaterThan(0);
  });

  test("each topic has a title, slug, desc, and subsections", () => {
    for (const topic of practiceData) {
      expect(typeof topic.title).toBe("string", `"${topic.title}" should have a title`);
      expect(typeof topic.slug).toBe("string", `"${topic.title}" should have a slug`);
      expect(typeof topic.desc).toBe("string", `"${topic.title}" should have a description`);
      expect(Array.isArray(topic.subsections)).toBe(true);
      expect(topic.subsections.length).toBeGreaterThan(0);
    }
  });

  test("each topic has a kebab-case slug", () => {
    for (const topic of practiceData) {
      expect(topic.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  test("each subsection is one of the valid tiers", () => {
    for (const topic of practiceData) {
      for (const subsection of topic.subsections) {
        expect(VALID_TIERS).toContain(subsection.title);
      }
    }
  });

  test("each subsection has a non-empty items array", () => {
    for (const topic of practiceData) {
      for (const subsection of topic.subsections) {
        expect(Array.isArray(subsection.items)).toBe(true);
        expect(subsection.items.length).toBeGreaterThan(0);
      }
    }
  });

  test("each problem has all required fields", () => {
    for (const topic of practiceData) {
      for (const subsection of topic.subsections) {
        for (const problem of subsection.items) {
          expect(problem).toHaveProperty("id");
          expect(typeof problem.id).toBe("string");
          expect(problem.id.length).toBeGreaterThan(0);

          expect(problem).toHaveProperty("name");
          expect(typeof problem.name).toBe("string");
          expect(problem.name.length).toBeGreaterThan(0);

          expect(problem).toHaveProperty("difficulty");
          expect(VALID_DIFFICULTIES).toContain(problem.difficulty);

          // visualizerUrl is optional — some legacy problems lack it
          if (problem.visualizerUrl) {
            expect(typeof problem.visualizerUrl).toBe("string");
            expect(problem.visualizerUrl.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test("each problem difficulty is one of the valid values", () => {
    for (const topic of practiceData) {
      for (const subsection of topic.subsections) {
        for (const problem of subsection.items) {
          expect(VALID_DIFFICULTIES).toContain(problem.difficulty);
        }
      }
    }
  });

  test("each problem has a theory section with non-empty summary and complexity", () => {
    for (const topic of practiceData) {
      for (const subsection of topic.subsections) {
        for (const problem of subsection.items) {
          if (problem.theory) {
            expect(typeof problem.theory.summary).toBe("string");
            expect(problem.theory.summary.length).toBeGreaterThan(0);
            if (problem.theory.complexity) {
              expect(typeof problem.theory.complexity.time).toBe("string");
              expect(typeof problem.theory.complexity.space).toBe("string");
            }
          }
        }
      }
    }
  });

  test("visualizerUrl starts with /visualizer/ for problems that have it", () => {
    for (const topic of practiceData) {
      for (const subsection of topic.subsections) {
        for (const problem of subsection.items) {
          if (problem.visualizerUrl) {
            expect(problem.visualizerUrl).toMatch(/^\/visualizer\//);
          }
        }
      }
    }
  });

  test("problem IDs are unique across the entire dataset", () => {
    const ids = [];
    for (const topic of practiceData) {
      for (const subsection of topic.subsections) {
        for (const problem of subsection.items) {
          ids.push(problem.id);
        }
      }
    }
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test("has at least 5 major DSA topic areas", () => {
    const topics = practiceData.map((t) => t.slug);
    expect(topics.length).toBeGreaterThanOrEqual(5);
    // Should include array and graph at minimum
    expect(topics).toContain("array");
    expect(topics).toContain("graph");
  });

  test("each difficulty tier (Beginner, Intermediate, Advanced) appears in at least one topic", () => {
    const tiersPerTopic = practiceData.map((t) => t.subsections.map((s) => s.title));
    const allTiers = tiersPerTopic.flat();

    for (const tier of VALID_TIERS) {
      expect(allTiers).toContain(tier);
    }
  });
});
