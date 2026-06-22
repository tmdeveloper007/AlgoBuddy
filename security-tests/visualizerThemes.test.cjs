// security-tests/visualizerThemes.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/visualizerThemes.test.cjs
//
// Tests for src/lib/visualizerThemes.js helper functions.
// Inlined to avoid @/ alias resolution issues in test runner.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ─── Inline VISUALIZER_THEMES and helpers from src/lib/visualizerThemes.js ──────

const VISUALIZER_THEMES = {
  Array: {
    name: "Array",
    color: "#a435f0",
    light: {
      bg: "bg-purple-100",
      surface: "bg-purple-50",
      border: "border-purple-200",
      text: "text-purple-900",
      accent: "bg-purple-500",
      iconBg: "bg-purple-100",
    },
    dark: {
      bg: "dark:bg-purple-950/50",
      surface: "dark:bg-purple-950/40",
      border: "dark:border-purple-500/20",
      text: "dark:text-purple-100",
      accent: "dark:bg-purple-600",
      iconBg: "dark:bg-purple-950/60",
      shadow: "dark:shadow-purple-950/50",
    },
    border: "border-purple-500/20",
    label: "10 algorithms",
  },
  Stack: {
    name: "Stack",
    color: "#2563eb",
    light: {
      bg: "bg-blue-100",
      surface: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      accent: "bg-blue-500",
      iconBg: "bg-blue-100",
    },
    dark: {
      bg: "dark:bg-blue-950/50",
      surface: "dark:bg-blue-950/40",
      border: "dark:border-blue-500/20",
      text: "dark:text-blue-100",
      accent: "dark:bg-blue-600",
      iconBg: "dark:bg-blue-950/60",
      shadow: "dark:shadow-blue-950/50",
    },
    border: "border-blue-500/20",
    label: "8 algorithms",
  },
  Queue: {
    name: "Queue",
    color: "#059669",
    light: {
      bg: "bg-green-100",
      surface: "bg-green-50",
      border: "border-green-200",
      text: "text-green-900",
      accent: "bg-green-500",
      iconBg: "bg-green-100",
    },
    dark: {
      bg: "dark:bg-green-950/50",
      surface: "dark:bg-green-950/40",
      border: "dark:border-green-500/20",
      text: "dark:text-green-100",
      accent: "dark:bg-green-600",
      iconBg: "dark:bg-green-950/60",
      shadow: "dark:shadow-green-950/50",
    },
    border: "border-green-500/20",
    label: "10 algorithms",
  },
  "Linked List": {
    name: "Linked List",
    color: "#d97706",
    light: {
      bg: "bg-orange-100",
      surface: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-900",
      accent: "bg-orange-500",
      iconBg: "bg-orange-100",
    },
    dark: {
      bg: "dark:bg-orange-950/50",
      surface: "dark:bg-orange-950/40",
      border: "dark:border-orange-500/20",
      text: "dark:text-orange-100",
      accent: "dark:bg-orange-600",
      iconBg: "dark:bg-orange-950/60",
      shadow: "dark:shadow-orange-950/50",
    },
    border: "border-orange-500/20",
    label: "10 algorithms",
  },
  Tree: {
    name: "Tree",
    color: "#7c3aed",
    light: {
      bg: "bg-violet-100",
      surface: "bg-violet-50",
      border: "border-violet-200",
      text: "text-violet-900",
      accent: "bg-violet-500",
      iconBg: "bg-violet-100",
    },
    dark: {
      bg: "dark:bg-violet-950/50",
      surface: "dark:bg-violet-950/40",
      border: "dark:border-violet-500/20",
      text: "dark:text-violet-100",
      accent: "dark:bg-violet-600",
      iconBg: "dark:bg-violet-950/60",
      shadow: "dark:shadow-violet-950/50",
    },
    border: "border-violet-500/20",
    label: "20 algorithms",
  },
  Graph: {
    name: "Graph",
    color: "#dc2626",
    light: {
      bg: "bg-red-100",
      surface: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
      accent: "bg-red-500",
      iconBg: "bg-red-100",
    },
    dark: {
      bg: "dark:bg-red-950/50",
      surface: "dark:bg-red-950/40",
      border: "dark:border-red-500/20",
      text: "dark:text-red-100",
      accent: "dark:bg-red-600",
      iconBg: "dark:bg-red-950/60",
      shadow: "dark:shadow-red-950/50",
    },
    border: "border-red-500/20",
    label: "8 algorithms",
  },
  "AI Algorithms": {
    name: "AI Algorithms",
    color: "#0891b2",
    light: {
      bg: "bg-cyan-100",
      surface: "bg-cyan-50",
      border: "border-cyan-200",
      text: "text-cyan-900",
      accent: "bg-cyan-500",
      iconBg: "bg-cyan-100",
    },
    dark: {
      bg: "dark:bg-cyan-950/50",
      surface: "dark:bg-cyan-950/40",
      border: "dark:border-cyan-500/20",
      text: "dark:text-cyan-100",
      accent: "dark:bg-cyan-600",
      iconBg: "dark:bg-cyan-950/60",
      shadow: "dark:shadow-cyan-950/50",
    },
    border: "border-cyan-500/20",
    label: "1 algorithm",
  },
};

function getVisualizerTheme(name) {
  return VISUALIZER_THEMES[name] || VISUALIZER_THEMES.Array;
}

function getThemeClasses(themeName, key = "bg") {
  const theme = getVisualizerTheme(themeName);
  const lightClass = theme.light[key] || "";
  const darkClass = theme.dark[key] || "";
  return `${lightClass} ${darkClass}`.trim();
}

function getCardTheme(themeName) {
  const theme = getVisualizerTheme(themeName);
  return {
    color: theme.color,
    bgClasses: `${theme.light.bg} ${theme.dark.bg}`,
    surfaceClasses: `${theme.light.surface} ${theme.dark.surface}`,
    borderClasses: `${theme.light.border} ${theme.dark.border}`,
    textClasses: `${theme.light.text} ${theme.dark.text}`,
    lightBg: theme.light.bg.replace("bg-", ""),
    darkBgStyle: theme.dark.bg,
    border: theme.border,
  };
}

// ─── getVisualizerTheme tests ───────────────────────────────────────────────────

describe('getVisualizerTheme', () => {
  test('returns the Array theme for known name "Array"', () => {
    const theme = getVisualizerTheme("Array");
    assert.strictEqual(theme.name, "Array");
    assert.strictEqual(theme.color, "#a435f0");
  });

  test('returns the Stack theme for known name "Stack"', () => {
    const theme = getVisualizerTheme("Stack");
    assert.strictEqual(theme.name, "Stack");
    assert.strictEqual(theme.color, "#2563eb");
  });

  test('returns the Queue theme for known name "Queue"', () => {
    const theme = getVisualizerTheme("Queue");
    assert.strictEqual(theme.name, "Queue");
  });

  test('returns the Linked List theme for known name "Linked List"', () => {
    const theme = getVisualizerTheme("Linked List");
    assert.strictEqual(theme.name, "Linked List");
    assert.strictEqual(theme.color, "#d97706");
  });

  test('returns the Tree theme for known name "Tree"', () => {
    const theme = getVisualizerTheme("Tree");
    assert.strictEqual(theme.name, "Tree");
  });

  test('returns the Graph theme for known name "Graph"', () => {
    const theme = getVisualizerTheme("Graph");
    assert.strictEqual(theme.name, "Graph");
    assert.strictEqual(theme.color, "#dc2626");
  });

  test('returns the AI Algorithms theme for known name "AI Algorithms"', () => {
    const theme = getVisualizerTheme("AI Algorithms");
    assert.strictEqual(theme.name, "AI Algorithms");
    assert.strictEqual(theme.color, "#0891b2");
  });

  test('returns VISUALIZER_THEMES.Array for unknown theme name', () => {
    const theme = getVisualizerTheme("UnknownTheme");
    assert.strictEqual(theme.name, "Array");
    assert.strictEqual(theme.color, "#a435f0");
  });

  test('returns VISUALIZER_THEMES.Array for empty string', () => {
    const theme = getVisualizerTheme("");
    assert.strictEqual(theme.name, "Array");
  });

  test('returns VISUALIZER_THEMES.Array for null/undefined', () => {
    const theme1 = getVisualizerTheme(null);
    const theme2 = getVisualizerTheme(undefined);
    assert.strictEqual(theme1.name, "Array");
    assert.strictEqual(theme2.name, "Array");
  });
});

// ─── getThemeClasses tests ─────────────────────────────────────────────────────

describe('getThemeClasses', () => {
  test('returns merged bg classes for Array theme', () => {
    const result = getThemeClasses("Array", "bg");
    assert.ok(result.includes("bg-purple-100"));
    assert.ok(result.includes("dark:bg-purple-950/50"));
  });

  test('returns merged surface classes for Stack theme', () => {
    const result = getThemeClasses("Stack", "surface");
    assert.ok(result.includes("bg-blue-50"));
    assert.ok(result.includes("dark:bg-blue-950/40"));
  });

  test('returns merged border classes for Queue theme', () => {
    const result = getThemeClasses("Queue", "border");
    assert.ok(result.includes("border-green-200"));
    assert.ok(result.includes("dark:border-green-500/20"));
  });

  test('returns merged text classes for Linked List theme', () => {
    const result = getThemeClasses("Linked List", "text");
    assert.ok(result.includes("text-orange-900"));
    assert.ok(result.includes("dark:text-orange-100"));
  });

  test('returns merged accent classes for Graph theme', () => {
    const result = getThemeClasses("Graph", "accent");
    assert.ok(result.includes("bg-red-500"));
    assert.ok(result.includes("dark:bg-red-600"));
  });

  test('returns merged iconBg classes for Tree theme', () => {
    const result = getThemeClasses("Tree", "iconBg");
    assert.ok(result.includes("bg-violet-100"));
    assert.ok(result.includes("dark:bg-violet-950/60"));
  });

  test('returns default bg key when key not specified', () => {
    const result = getThemeClasses("Array");
    assert.ok(result.includes("bg-purple-100"));
  });

  test('falls back to Array for unknown theme name', () => {
    const result = getThemeClasses("NonExistent", "bg");
    assert.ok(result.includes("bg-purple-100"));
  });

  test('returns dark-only class string for shadow key (Array theme has it only in dark object)', () => {
    const result = getThemeClasses("Array", "shadow");
    assert.strictEqual(result, "dark:shadow-purple-950/50");
  });

  test('returns empty string for a key that does not exist in either light or dark', () => {
    const result = getThemeClasses("Array", "nonexistentKey");
    assert.strictEqual(result, "");
  });

  test('handles AI Algorithms theme for all common keys', () => {
    const bg = getThemeClasses("AI Algorithms", "bg");
    const surface = getThemeClasses("AI Algorithms", "surface");
    const border = getThemeClasses("AI Algorithms", "border");
    assert.ok(bg.includes("bg-cyan-100"));
    assert.ok(surface.includes("bg-cyan-50"));
    assert.ok(border.includes("border-cyan-200"));
  });
});

// ─── getCardTheme tests ────────────────────────────────────────────────────────

describe('getCardTheme', () => {
  test('returns correct shape for Array theme', () => {
    const card = getCardTheme("Array");
    assert.strictEqual(card.color, "#a435f0");
    assert.ok(card.bgClasses.includes("bg-purple-100"));
    assert.ok(card.bgClasses.includes("dark:bg-purple-950/50"));
    assert.ok(card.surfaceClasses.includes("bg-purple-50"));
    assert.ok(card.borderClasses.includes("border-purple-200"));
    assert.ok(card.textClasses.includes("text-purple-900"));
    assert.strictEqual(card.lightBg, "purple-100");
    assert.strictEqual(card.darkBgStyle, "dark:bg-purple-950/50");
    assert.strictEqual(card.border, "border-purple-500/20");
  });

  test('returns correct shape for Stack theme', () => {
    const card = getCardTheme("Stack");
    assert.strictEqual(card.color, "#2563eb");
    assert.ok(card.bgClasses.includes("bg-blue-100"));
    assert.ok(card.surfaceClasses.includes("bg-blue-50"));
  });

  test('returns correct shape for Queue theme', () => {
    const card = getCardTheme("Queue");
    assert.strictEqual(card.color, "#059669");
    assert.ok(card.bgClasses.includes("bg-green-100"));
  });

  test('returns correct shape for Graph theme', () => {
    const card = getCardTheme("Graph");
    assert.strictEqual(card.color, "#dc2626");
    assert.ok(card.bgClasses.includes("bg-red-100"));
  });

  test('falls back to Array for unknown theme name', () => {
    const card = getCardTheme("UnknownTheme");
    assert.strictEqual(card.color, "#a435f0");
    assert.ok(card.bgClasses.includes("bg-purple-100"));
  });

  test('lightBg strips the bg- prefix', () => {
    const card = getCardTheme("Array");
    assert.strictEqual(card.lightBg, "purple-100");
  });

  test('border field is always the neutral border color', () => {
    const card1 = getCardTheme("Array");
    const card2 = getCardTheme("Stack");
    assert.strictEqual(card1.border, "border-purple-500/20");
    assert.strictEqual(card2.border, "border-blue-500/20");
  });

  test('darkBgStyle preserves the full dark class string', () => {
    const card = getCardTheme("Tree");
    assert.strictEqual(card.darkBgStyle, "dark:bg-violet-950/50");
  });

  test('AI Algorithms theme returns correct color and class names', () => {
    const card = getCardTheme("AI Algorithms");
    assert.strictEqual(card.color, "#0891b2");
    assert.ok(card.bgClasses.includes("bg-cyan-100"));
    assert.ok(card.surfaceClasses.includes("bg-cyan-50"));
  });
});
