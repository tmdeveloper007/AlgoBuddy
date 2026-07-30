// security-tests/visualizerSections.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/visualizerSections.test.cjs
//
// Tests the visualizerSections.js data structure — verifies all required
// sections have valid slugs, items have valid paths, and no duplicate slugs.

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');

// Load the sections data
const { sections } = require('../src/lib/visualizerSections.js');

describe("sections data structure", () => {
  test("sections is a non-empty array", () => {
    assert.ok(Array.isArray(sections));
    assert.ok(sections.length > 0);
  });

  test("each section has required fields", () => {
    sections.forEach((section) => {
      assert.ok(typeof section.title === 'string' && section.title.length > 0, "section must have title");
      assert.ok(typeof section.slug === 'string' && section.slug.length > 0, "section must have slug");
      assert.ok(typeof section.desc === 'string' && section.desc.length > 0, "section must have desc");
      assert.ok(Array.isArray(section.subsections), "section must have subsections array");
    });
  });

  test("each subsection has required fields", () => {
    sections.forEach((section) => {
      section.subsections.forEach((sub) => {
        assert.ok(typeof sub.title === 'string' && sub.title.length > 0, "subsection must have title");
        assert.ok(Array.isArray(sub.items), "subsection must have items array");
      });
    });
  });

  test("each item has name and path fields", () => {
    let totalItems = 0;
    sections.forEach((section) => {
      section.subsections.forEach((sub) => {
        sub.items.forEach((item) => {
          totalItems++;
          assert.ok(typeof item.name === 'string' && item.name.length > 0, "item must have name");
          assert.ok(typeof item.path === 'string' && item.path.length > 0, "item must have path");
          // Path must start with /visualizer
          assert.ok(item.path.startsWith('/visualizer'), `path must start with /visualizer: ${item.path}`);
        });
      });
    });
    assert.ok(totalItems >= 50, `Expected at least 50 items, got ${totalItems}`);
  });

  test("no duplicate section slugs", () => {
    const slugs = sections.map((s) => s.slug);
    const unique = new Set(slugs);
    assert.strictEqual(slugs.length, unique.size, "duplicate section slugs found");
  });

  test("no duplicate item paths within a subsection", () => {
    sections.forEach((section) => {
      section.subsections.forEach((sub) => {
        const paths = sub.items.map((i) => i.path);
        const unique = new Set(paths);
        assert.strictEqual(
          paths.length,
          unique.size,
          `duplicate paths in section "${section.title}", subsection "${sub.title}": ${paths.filter((p, i) => paths.indexOf(p) !== i).join(', ')}`,
        );
      });
    });
  });

  test("AI section exists and contains expected algorithms", () => {
    const aiSection = sections.find((s) => s.slug === 'ai');
    assert.ok(aiSection, "AI section must exist");

    const aiPaths = aiSection.subsections.flatMap((sub) => sub.items.map((i) => i.path));
    assert.ok(aiPaths.some((p) => p.includes('astar')), "AI section must include A* Search");
    assert.ok(aiPaths.some((p) => p.includes('minmax')), "AI section must include Min Max");
    assert.ok(aiPaths.some((p) => p.includes('alpha-beta')), "AI section must include Alpha Beta Pruning");
    assert.ok(aiPaths.some((p) => p.includes('mcts')), "AI section must include MCTS");
  });

  test("Array section exists with Searching and Sorting subsections", () => {
    const arraySection = sections.find((s) => s.slug === 'array');
    assert.ok(arraySection, "Array section must exist");

    const subTitles = arraySection.subsections.map((s) => s.title);
    assert.ok(subTitles.includes('Searching'), "Array section must have Searching subsection");
    assert.ok(subTitles.includes('Sorting'), "Array section must have Sorting subsection");
  });

  test("Graph section exists with BFS and DFS", () => {
    const graphSection = sections.find((s) => s.slug === 'graph');
    assert.ok(graphSection, "Graph section must exist");

    const allPaths = graphSection.subsections.flatMap((s) => s.items.map((i) => i.path));
    assert.ok(allPaths.some((p) => p.includes('/bfs')), "Graph section must have BFS");
    assert.ok(allPaths.some((p) => p.includes('/dfs')), "Graph section must have DFS");
  });

  test("Recursion section includes Tower of Hanoi and Backtracking", () => {
    const recSection = sections.find((s) => s.slug === 'recursion');
    assert.ok(recSection, "Recursion section must exist");

    const allPaths = recSection.subsections.flatMap((s) => s.items.map((i) => i.path));
    assert.ok(allPaths.some((p) => p.includes('tower-of-hanoi')), "Recursion must include Tower of Hanoi");
    assert.ok(allPaths.some((p) => p.includes('backtracking')), "Recursion must include Backtracking");
    assert.ok(allPaths.some((p) => p.includes('tail-recursion')), "Recursion must include Tail Recursion");
  });

  test("String section includes KMP and Rabin-Karp pattern matching", () => {
    const stringSection = sections.find((s) => s.slug === 'string');
    assert.ok(stringSection, "String section must exist");

    const allPaths = stringSection.subsections.flatMap((s) => s.items.map((i) => i.path));
    assert.ok(allPaths.some((p) => p.includes('kmp')), "String section must include KMP");
    assert.ok(allPaths.some((p) => p.includes('rabin-karp')), "String section must include Rabin-Karp");
  });
});
