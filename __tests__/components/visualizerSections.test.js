// __tests__/components/visualizerSections.test.js
//
// Run with:  npx jest __tests__/components/visualizerSections.test.js
//
// Tests the visualizerSections data structure in src/lib/visualizerSections.js.

import { sections } from "../../src/lib/visualizerSections.js";

describe("sections data integrity", () => {
  // Collect all slugs across sections and items for uniqueness checks
  const sectionSlugs = [];
  const itemPaths = [];
  const itemNames = [];
  const allPracticeItems = [];

  beforeAll(() => {
    sections.forEach((section) => {
      sectionSlugs.push(section.slug);

      if (section.subsections) {
        section.subsections.forEach((sub) => {
          if (sub.items) {
            sub.items.forEach((item) => {
              itemPaths.push(item.path);
              if (item.name) itemNames.push(item.name);
              // Practice items have difficulty field
              if (item.difficulty) {
                allPracticeItems.push({ name: item.name, difficulty: item.difficulty });
              }
            });
          }
        });
      }
    });
  });

  test("sections is a non-empty array", () => {
    expect(Array.isArray(sections)).toBe(true);
    expect(sections.length).toBeGreaterThan(0);
  });

  test("every section has a non-empty title", () => {
    sections.forEach((section) => {
      expect(section.title).toBeTruthy();
      expect(typeof section.title).toBe("string");
      expect(section.title.trim().length).toBeGreaterThan(0);
    });
  });

  test("every section has a non-empty slug", () => {
    sections.forEach((section) => {
      expect(section.slug).toBeTruthy();
      expect(typeof section.slug).toBe("string");
    });
  });

  test("all section slugs are unique", () => {
    const unique = new Set(sectionSlugs);
    expect(unique.size).toBe(sectionSlugs.length);
  });

  test("every section has at least one subsection", () => {
    sections.forEach((section) => {
      expect(Array.isArray(section.subsections)).toBe(true);
      expect(section.subsections.length).toBeGreaterThan(0);
    });
  });

  test("every subsection has a non-empty title", () => {
    sections.forEach((section) => {
      section.subsections.forEach((sub) => {
        expect(sub.title).toBeTruthy();
        expect(typeof sub.title).toBe("string");
        expect(sub.title.trim().length).toBeGreaterThan(0);
      });
    });
  });

  test("every item has a non-empty name", () => {
    sections.forEach((section) => {
      section.subsections.forEach((sub) => {
        sub.items.forEach((item) => {
          expect(item.name).toBeTruthy();
          expect(typeof item.name).toBe("string");
        });
      });
    });
  });

  test("every item has a path starting with /visualizer/", () => {
    itemPaths.forEach((path) => {
      expect(path).toBeTruthy();
      expect(typeof path).toBe("string");
      expect(path.startsWith("/visualizer/")).toBe(true);
    });
  });

  test("all item paths are unique", () => {
    const unique = new Set(itemPaths);
    expect(unique.size).toBe(itemPaths.length);
  });

  test("all practice items have valid difficulty values", () => {
    const validDifficulties = new Set(["Easy", "Medium", "Hard"]);
    allPracticeItems.forEach((item) => {
      expect(validDifficulties.has(item.difficulty)).toBe(true);
    });
  });
});
