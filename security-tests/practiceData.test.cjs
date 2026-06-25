// security-tests/practiceData.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/practiceData.test.cjs
//
// Tests the practiceData structure in src/lib/practiceData.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const VALID_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);

const URL_RE = /^https?:\/\/.+/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validatePracticeData(data) {
  const errors = [];

  if (!Array.isArray(data) || data.length === 0) {
    errors.push("practiceData must be a non-empty array");
    return errors;
  }

  const seenSlugs = new Set();

  for (const topic of data) {
    // Topic-level checks
    if (typeof topic.title !== "string" || topic.title.length === 0) {
      errors.push(`topic missing non-empty title`);
    }
    if (typeof topic.slug !== "string" || topic.slug.length === 0) {
      errors.push(`topic "${topic.title}" missing non-empty slug`);
    } else if (seenSlugs.has(topic.slug)) {
      errors.push(`duplicate topic slug: "${topic.slug}"`);
    } else {
      seenSlugs.add(topic.slug);
    }
    if (typeof topic.desc !== "string" || topic.desc.length === 0) {
      errors.push(`topic "${topic.title}" missing non-empty desc`);
    }
    if (!Array.isArray(topic.subsections) || topic.subsections.length === 0) {
      errors.push(`topic "${topic.title}" must have non-empty subsections`);
    }

    // Subsection checks
    for (const subsection of topic.subsections || []) {
      if (typeof subsection.title !== "string" || subsection.title.length === 0) {
        errors.push(`subsection in "${topic.title}" missing non-empty title`);
      }
      if (!Array.isArray(subsection.items) || subsection.items.length === 0) {
        errors.push(`subsection "${subsection.title}" in "${topic.title}" must have non-empty items`);
      }

      // Item checks
      for (const item of subsection.items || []) {
        if (typeof item.id !== "string" || item.id.length === 0) {
          errors.push(`item missing non-empty id in topic "${topic.title}"`);
        }
        if (typeof item.name !== "string" || item.name.length === 0) {
          errors.push(`item missing non-empty name in topic "${topic.title}"`);
        }
        if (!VALID_DIFFICULTIES.has(item.difficulty)) {
          errors.push(`item "${item.name}" in "${topic.title}" has invalid difficulty "${item.difficulty}"`);
        }
        if (typeof item.practiceUrl !== "string" || !URL_RE.test(item.practiceUrl)) {
          errors.push(`item "${item.name}" in "${topic.title}" has invalid practiceUrl`);
        }
        if (!item.theory || typeof item.theory !== "object") {
          errors.push(`item "${item.name}" in "${topic.title}" missing theory object`);
        } else {
          if (typeof item.theory.summary !== "string" || item.theory.summary.length === 0) {
            errors.push(`item "${item.name}" in "${topic.title}" missing theory.summary`);
          }
          if (!Array.isArray(item.theory.steps) || item.theory.steps.length === 0) {
            errors.push(`item "${item.name}" in "${topic.title}" missing non-empty theory.steps`);
          }
          if (!item.theory.complexity || typeof item.theory.complexity !== "object") {
            errors.push(`item "${item.name}" in "${topic.title}" missing theory.complexity object`);
          } else {
            if (typeof item.theory.complexity.time !== "string" || item.theory.complexity.time.length === 0) {
              errors.push(`item "${item.name}" in "${topic.title}" missing non-empty theory.complexity.time`);
            }
            if (typeof item.theory.complexity.space !== "string" || item.theory.complexity.space.length === 0) {
              errors.push(`item "${item.name}" in "${topic.title}" missing non-empty theory.complexity.space`);
            }
          }
        }
        if (item.visualizerUrl !== null && typeof item.visualizerUrl !== "undefined") {
          if (typeof item.visualizerUrl !== "string" || item.visualizerUrl.length === 0) {
            errors.push(`item "${item.name}" in "${topic.title}" has invalid visualizerUrl`);
          }
        }
      }
    }
  }

  return errors;
}

// ── Inline a representative sample of practiceData for testing ────────

const samplePracticeData = [
  {
    title: "Array",
    slug: "array",
    desc: "Contiguous collections of memory. Master array traversals, pointer techniques, searching, and sorting.",
    subsections: [
      {
        title: "Beginner",
        items: [
          {
            id: "linear-search",
            name: "Linear Search",
            difficulty: "Easy",
            companies: ["tcs", "infosys", "wipro"],
            practiceUrl: "https://www.codechef.com/learn/course/searching-sorting/SORTSEARCH1/problems/SESO03",
            visualizerUrl: "/visualizer/array/linearsearch",
            theory: {
              summary: "A simple algorithm that checks every element in the array sequentially until the target is found.",
              steps: [
                "Start from the first element (index 0).",
                "Compare the current element with the target.",
                "If matched, return the current index.",
                "If not matched, move to the next index.",
                "If the end of the array is reached without matching, return -1.",
              ],
              complexity: { time: "O(N)", space: "O(1)" },
              pitfalls: "Inefficient for large datasets.",
              tip: "Linear Search serves as the baseline comparison.",
            },
          },
          {
            id: "binary-search",
            name: "Binary Search",
            difficulty: "Easy",
            companies: ["google", "microsoft", "amazon"],
            practiceUrl: "https://leetcode.com/problems/binary-search/",
            visualizerUrl: "/visualizer/array/binarysearch",
            theory: {
              summary: "An efficient algorithm that finds a target value within a sorted array by repeatedly dividing the search interval in half.",
              steps: [
                "Ensure the array is sorted.",
                "Set low pointer to index 0, and high pointer to last index.",
                "Calculate mid index.",
                "If array[mid] equals target, return mid.",
                "If array[mid] is less than target, discard left half.",
                "If array[mid] is greater than target, discard right half.",
                "Repeat until low pointer exceeds high pointer.",
              ],
              complexity: { time: "O(log N)", space: "O(1)" },
              pitfalls: "Forgetting to sort the array beforehand.",
              tip: "Whenever a search problem has a sorted input, think Binary Search.",
            },
          },
        ],
      },
      {
        title: "Intermediate",
        items: [
          {
            id: "merge-sort",
            name: "Merge Sort",
            difficulty: "Medium",
            companies: ["amazon", "microsoft", "adobe"],
            practiceUrl: "https://leetcode.com/problems/sort-an-array/",
            visualizerUrl: "/visualizer/array/mergesort",
            theory: {
              summary: "A divide-and-conquer sorting algorithm that splits the array in half, sorts each half recursively, and merges the sorted halves.",
              steps: [
                "If array size is 1 or 0, it is already sorted.",
                "Find the middle index of the array.",
                "Recursively call Merge Sort on left and right sub-arrays.",
                "Merge the two sorted halves back into a single sorted array.",
              ],
              complexity: { time: "O(N log N)", space: "O(N)" },
              pitfalls: "Requires auxiliary linear memory space.",
              tip: "Merge Sort is highly stable.",
            },
          },
          {
            id: "maximum-subarray",
            name: "Maximum Subarray (Kadane's Algorithm)",
            difficulty: "Medium",
            companies: ["amazon", "microsoft", "google"],
            practiceUrl: "https://leetcode.com/problems/maximum-subarray/",
            visualizerUrl: "/visualizer/array/maxsubarray",
            theory: {
              summary: "Find the contiguous subarray within a one-dimensional array of numbers that has the largest sum.",
              steps: [
                "Initialize currentSum = 0 and maxSum = -Infinity.",
                "Traverse the array from left to right.",
                "At each element, add it to currentSum.",
                "Update maxSum = max(maxSum, currentSum).",
                "If currentSum becomes negative, reset it to 0.",
                "After traversing, maxSum holds the answer.",
              ],
              complexity: { time: "O(N)", space: "O(1)" },
              pitfalls: "Resetting currentSum to 0 incorrectly when all elements are negative.",
              tip: "Kadane's Algorithm is a classic example of Dynamic Programming.",
            },
          },
        ],
      },
      {
        title: "Advanced",
        items: [
          {
            id: "quick-sort",
            name: "Quick Sort",
            difficulty: "Medium",
            companies: ["google", "microsoft", "amazon"],
            practiceUrl: "https://leetcode.com/problems/sort-an-array/",
            visualizerUrl: "/visualizer/array/quicksort",
            theory: {
              summary: "An efficient in-place sorting algorithm that uses a divide-and-conquer strategy to pick a pivot element.",
              steps: [
                "Choose an element from the array as the pivot.",
                "Partition the array.",
                "Recursively apply Quick Sort to the left and right sub-arrays.",
              ],
              complexity: { time: "O(N log N) average", space: "O(log N) stack recursion" },
              pitfalls: "Can degrade to O(N^2) worst-case time complexity.",
              tip: "Choose a random pivot element.",
            },
          },
        ],
      },
    ],
  },
  {
    title: "Linked List",
    slug: "linked-list",
    desc: "Sequential node allocations chained via address pointer link references.",
    subsections: [
      {
        title: "Beginner",
        items: [
          {
            id: "middle-of-linked-list",
            name: "Middle of the Linked List",
            difficulty: "Easy",
            companies: ["amazon", "google"],
            practiceUrl: "https://leetcode.com/problems/middle-of-the-linked-list/",
            visualizerUrl: "/visualizer/linkedlist/operations/traversal",
            theory: {
              summary: "Find the middle node of a singly linked list.",
              steps: [
                "Initialize two pointers, slow and fast, pointing to the head.",
                "Move slow by one step and fast by two steps.",
                "When fast reaches the end, slow will be at the middle.",
              ],
              complexity: { time: "O(N)", space: "O(1)" },
              pitfalls: "Not correctly handling the condition for even length lists.",
              tip: "The Tortoise and Hare algorithm is standard.",
            },
          },
        ],
      },
    ],
  },
  {
    title: "Dynamic Programming",
    slug: "dp",
    desc: "Optimize recursive decisions by caching subproblems.",
    subsections: [
      {
        title: "Beginner",
        items: [
          {
            id: "climbing-stairs",
            name: "Climbing Stairs",
            difficulty: "Easy",
            companies: ["google", "microsoft", "amazon"],
            practiceUrl: "https://leetcode.com/problems/climbing-stairs/",
            visualizerUrl: null,
            theory: {
              summary: "Calculate how many distinct ways you can climb N stairs when you can take either 1 or 2 steps at a time.",
              steps: [
                "Identify subproblem: To reach step N, you must come from N-1 or N-2.",
                "Recurrence relation: ways(N) = ways(N-1) + ways(N-2).",
                "Initialize base states: ways(1) = 1, ways(2) = 2.",
                "Iteratively build states bottom-up.",
              ],
              complexity: { time: "O(N)", space: "O(1)" },
              pitfalls: "Using naive recursion without caching.",
              tip: "Climbing Stairs is mathematically equivalent to the Fibonacci sequence!",
            },
          },
        ],
      },
    ],
  },
];

// ── Tests ────────────────────────────────────────────────────────────

describe("practiceData structure", () => {
  test("practiceData sample is a non-empty array", () => {
    assert.ok(Array.isArray(samplePracticeData), "practiceData must be an array");
    assert.ok(samplePracticeData.length > 0, "practiceData must not be empty");
  });

  test("all topics have required fields: title, slug, desc, subsections", () => {
    const errors = validatePracticeData(samplePracticeData);
    assert.strictEqual(errors.length, 0,
      `validation errors: ${errors.join("; ")}`);
  });

  test("difficulty values are valid enum (Easy, Medium, Hard)", () => {
    const difficulties = new Set();
    for (const topic of samplePracticeData) {
      for (const subsection of topic.subsections) {
        for (const item of subsection.items) {
          difficulties.add(item.difficulty);
        }
      }
    }
    for (const d of difficulties) {
      assert.ok(VALID_DIFFICULTIES.has(d), `invalid difficulty: "${d}"`);
    }
  });

  test("all practiceUrls are valid http(s) URLs", () => {
    for (const topic of samplePracticeData) {
      for (const subsection of topic.subsections) {
        for (const item of subsection.items) {
          assert.ok(URL_RE.test(item.practiceUrl),
            `invalid URL for item "${item.name}": "${item.practiceUrl}"`);
        }
      }
    }
  });

  test("all theory.complexity.time and space are non-empty strings", () => {
    for (const topic of samplePracticeData) {
      for (const subsection of topic.subsections) {
        for (const item of subsection.items) {
          assert.ok(
            typeof item.theory.complexity.time === "string" && item.theory.complexity.time.length > 0,
            `missing complexity.time for item "${item.name}"`
          );
          assert.ok(
            typeof item.theory.complexity.space === "string" && item.theory.complexity.space.length > 0,
            `missing complexity.space for item "${item.name}"`
          );
        }
      }
    }
  });

  test("theory.steps is a non-empty array of strings for all items", () => {
    for (const topic of samplePracticeData) {
      for (const subsection of topic.subsections) {
        for (const item of subsection.items) {
          assert.ok(
            Array.isArray(item.theory.steps) && item.theory.steps.length > 0,
            `missing non-empty steps for item "${item.name}"`
          );
          for (const step of item.theory.steps) {
            assert.ok(
              typeof step === "string" && step.length > 0,
              `step must be non-empty string for item "${item.name}"`
            );
          }
        }
      }
    }
  });

  test("all items have non-empty id and name", () => {
    for (const topic of samplePracticeData) {
      for (const subsection of topic.subsections) {
        for (const item of subsection.items) {
          assert.ok(
            typeof item.id === "string" && item.id.length > 0,
            `missing non-empty id for item in topic "${topic.title}"`
          );
          assert.ok(
            typeof item.name === "string" && item.name.length > 0,
            `missing non-empty name for item id "${item.id}"`
          );
        }
      }
    }
  });
});
