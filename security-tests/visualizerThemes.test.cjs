// security-tests/visualizerThemes.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/visualizerThemes.test.cjs
//
// Tests visualizer theme helpers in src/lib/visualizerThemes.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// Inlined source — pure data transformations, no DOM/network deps.
const VISUALIZER_THEMES = {
  Array: {
    name: "Array",
    color: "#a435f0",
    light: { bg: "bg-purple-100", surface: "bg-purple-50", border: "border-purple-200", text: "text-purple-900", accent: "bg-purple-500" },
    dark: { bg: "dark:bg-purple-950/50", surface: "dark:bg-purple-950/40", border: "dark:border-purple-500/20", text: "dark:text-purple-100" },
    border: "border-purple-500/20",
    label: "10 algorithms",
  },
  Stack: {
    name: "Stack",
    color: "#2563eb",
    light: { bg: "bg-blue-100", surface: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", accent: "bg-blue-500" },
    dark: { bg: "dark:bg-blue-950/50", surface: "dark:bg-blue-950/40", border: "dark:border-purple-500/20", text: "dark:text-blue-100" },
    border: "border-blue-500/20",
    label: "8 algorithms",
  },
  Queue: {
    name: "Queue",
    color: "#059669",
    light: { bg: "bg-green-100", surface: "bg-green-50", border: "border-green-200", text: "text-green-900", accent: "bg-green-500" },
    dark: { bg: "dark:bg-green-950/50", surface: "dark:bg-green-950/40", border: "dark:border-green-500/20", text: "dark:text-green-100" },
    border: "border-green-500/20",
    label: "10 algorithms",
  },
};

const getVisualizerTheme = (name) => {
  return VISUALIZER_THEMES[name] || VISUALIZER_THEMES.Array;
};

const getThemeClasses = (themeName, key = "bg") => {
  const theme = getVisualizerTheme(themeName);
  const lightClass = theme.light[key] || "";
  const darkClass = theme.dark[key] || "";
  return `${lightClass} ${darkClass}`.trim();
};

const getCardTheme = (themeName) => {
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
};

describe("getVisualizerTheme", () => {
  test("returns theme by exact name", () => {
    const theme = getVisualizerTheme("Array");
    assert.equal(theme.name, "Array");
    assert.equal(theme.color, "#a435f0");
  });

  test("returns Stack theme correctly", () => {
    const theme = getVisualizerTheme("Stack");
    assert.equal(theme.name, "Stack");
    assert.equal(theme.color, "#2563eb");
  });

  test("returns Queue theme correctly", () => {
    const theme = getVisualizerTheme("Queue");
    assert.equal(theme.name, "Queue");
    assert.equal(theme.color, "#059669");
  });

  test("falls back to Array for unknown name", () => {
    const theme = getVisualizerTheme("NonExistent");
    assert.equal(theme.name, "Array");
  });

  test("falls back to Array for null/undefined", () => {
    assert.equal(getVisualizerTheme(null).name, "Array");
    assert.equal(getVisualizerTheme(undefined).name, "Array");
  });
});

describe("getThemeClasses", () => {
  test("returns both light and dark classes for bg key", () => {
    const classes = getThemeClasses("Array", "bg");
    assert.ok(classes.includes("bg-purple-100"), "should contain light bg class");
    assert.ok(classes.includes("dark:bg-purple-950/50"), "should contain dark bg class");
  });

  test("returns both light and dark classes for text key", () => {
    const classes = getThemeClasses("Array", "text");
    assert.ok(classes.includes("text-purple-900"), "should contain light text class");
    assert.ok(classes.includes("dark:text-purple-100"), "should contain dark text class");
  });

  test("returns both light and dark classes for border key", () => {
    const classes = getThemeClasses("Queue", "border");
    assert.ok(classes.includes("border-green-200"), "should contain light border class");
    assert.ok(classes.includes("dark:border-green-500/20"), "should contain dark border class");
  });

  test("defaults to bg key when no key specified", () => {
    const classes = getThemeClasses("Stack");
    assert.ok(classes.includes("bg-blue-100"));
    assert.ok(classes.includes("dark:bg-blue-950/50"));
  });

  test("returns empty string for missing key", () => {
    const classes = getThemeClasses("Array", "nonexistent");
    assert.equal(classes, "");
  });
});

describe("getCardTheme", () => {
  test("returns color from theme", () => {
    const card = getCardTheme("Queue");
    assert.equal(card.color, "#059669");
  });

  test("returns combined bgClasses", () => {
    const card = getCardTheme("Array");
    assert.ok(card.bgClasses.includes("bg-purple-100"));
    assert.ok(card.bgClasses.includes("dark:bg-purple-950/50"));
  });

  test("returns combined surfaceClasses", () => {
    const card = getCardTheme("Stack");
    assert.ok(card.surfaceClasses.includes("bg-blue-50"));
    assert.ok(card.surfaceClasses.includes("dark:bg-blue-950/40"));
  });

  test("returns combined borderClasses", () => {
    const card = getCardTheme("Queue");
    assert.ok(card.borderClasses.includes("border-green-200"));
    assert.ok(card.borderClasses.includes("dark:border-green-500/20"));
  });

  test("returns combined textClasses", () => {
    const card = getCardTheme("Array");
    assert.ok(card.textClasses.includes("text-purple-900"));
    assert.ok(card.textClasses.includes("dark:text-purple-100"));
  });

  test("strips bg- prefix from lightBg", () => {
    const card = getCardTheme("Array");
    assert.equal(card.lightBg, "purple-100");
  });

  test("returns darkBgStyle", () => {
    const card = getCardTheme("Array");
    assert.equal(card.darkBgStyle, "dark:bg-purple-950/50");
  });

  test("returns border string", () => {
    const card = getCardTheme("Stack");
    assert.equal(card.border, "border-blue-500/20");
  });

  test("falls back to Array for unknown theme", () => {
    const card = getCardTheme("Unknown");
    assert.equal(card.color, "#a435f0");
  });
});
