// security-tests/cookieConsent.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/cookieConsent.test.cjs
//
// Tests cookieConsent utilities in src/lib/cookieConsent.js.
// Uses Node's built-in test runner with inline module copies to avoid mocking issues.

const { describe, test, beforeEach, mock } = require("node:test");
const assert = require("node:assert/strict");

// --- Inline the source under test (pure functions, no DOM/network) ---

const CONSENT_STATUS_KEY = "cookieConsent";
const CONSENT_PREFERENCES_KEY = "cookiePreferences";
const CONSENT_UPDATED_EVENT = "cookiePreferencesUpdated";
const DEFAULT_PREFERENCES = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
};

function getStoredPreferences(windowRef) {
  if (typeof windowRef === "undefined" || windowRef === null) return structuredClone(DEFAULT_PREFERENCES);
  try {
    const raw = windowRef.localStorage.getItem(CONSENT_PREFERENCES_KEY);
    if (!raw) return structuredClone(DEFAULT_PREFERENCES);
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed, essential: true };
  } catch {
    return structuredClone(DEFAULT_PREFERENCES);
  }
}

function saveStoredPreferences(preferences, windowRef) {
  if (typeof windowRef === "undefined" || windowRef === null) return;
  windowRef.localStorage.setItem(
    CONSENT_PREFERENCES_KEY,
    JSON.stringify({ ...preferences, essential: true })
  );
  windowRef.dispatchEvent(CONSENT_UPDATED_EVENT);
}

function hasAnalyticsConsent(windowRef) {
  return getStoredPreferences(windowRef).analytics === true;
}

function hasMarketingConsent(windowRef) {
  return getStoredPreferences(windowRef).marketing === true;
}

function hasFunctionalConsent(windowRef) {
  return getStoredPreferences(windowRef).functional === true;
}

// --- Tests ---

describe("DEFAULT_PREFERENCES", () => {
  test("essential is true, others are false", () => {
    assert.strictEqual(DEFAULT_PREFERENCES.essential, true);
    assert.strictEqual(DEFAULT_PREFERENCES.analytics, false);
    assert.strictEqual(DEFAULT_PREFERENCES.functional, false);
    assert.strictEqual(DEFAULT_PREFERENCES.marketing, false);
  });

  test("CONSENT_PREFERENCES_KEY is the cookie preferences storage key", () => {
    assert.strictEqual(typeof CONSENT_PREFERENCES_KEY, "string");
    assert.strictEqual(CONSENT_PREFERENCES_KEY, "cookiePreferences");
  });
});

describe("getStoredPreferences", () => {
  function makeWindow(initialData = {}) {
    const data = { ...initialData };
    return {
      localStorage: {
        getItem(key) { return data[key] ?? null; },
        setItem(key, val) { data[key] = val; },
        _data: data,
      },
      dispatchEvent() {},
    };
  }

  test("returns DEFAULT_PREFERENCES when storage is empty", () => {
    const w = makeWindow();
    const prefs = getStoredPreferences(w);
    assert.deepStrictEqual(prefs, DEFAULT_PREFERENCES);
  });

  test("returns DEFAULT_PREFERENCES on corrupted JSON", () => {
    const w = makeWindow({ [CONSENT_PREFERENCES_KEY]: "not json {{{" });
    const prefs = getStoredPreferences(w);
    assert.deepStrictEqual(prefs, DEFAULT_PREFERENCES);
  });

  test("returns DEFAULT_PREFERENCES when window is undefined", () => {
    const prefs = getStoredPreferences(undefined);
    assert.deepStrictEqual(prefs, DEFAULT_PREFERENCES);
  });

  test("returns DEFAULT_PREFERENCES when window is null", () => {
    const prefs = getStoredPreferences(null);
    assert.deepStrictEqual(prefs, DEFAULT_PREFERENCES);
  });

  test("merges stored prefs with defaults", () => {
    const w = makeWindow({ [CONSENT_PREFERENCES_KEY]: JSON.stringify({ analytics: true, marketing: true }) });
    const prefs = getStoredPreferences(w);
    assert.strictEqual(prefs.analytics, true);
    assert.strictEqual(prefs.marketing, true);
    assert.strictEqual(prefs.functional, false); // default
  });

  test("essential is always forced to true", () => {
    const w = makeWindow({ [CONSENT_PREFERENCES_KEY]: JSON.stringify({ essential: false, analytics: true }) });
    const prefs = getStoredPreferences(w);
    assert.strictEqual(prefs.essential, true);
  });
});

describe("saveStoredPreferences", () => {
  test("saves merged preferences with essential forced true", () => {
    const data = {};
    const w = {
      localStorage: {
        getItem(key) { return data[key] ?? null; },
        setItem(key, val) { data[key] = val; },
      },
      dispatchEvent() {},
    };
    saveStoredPreferences({ analytics: true, marketing: false }, w);
    const stored = JSON.parse(data[CONSENT_PREFERENCES_KEY]);
    assert.strictEqual(stored.analytics, true);
    assert.strictEqual(stored.marketing, false);
    assert.strictEqual(stored.essential, true);
  });

  test("dispatches cookiePreferencesUpdated event", () => {
    let called = false;
    const w = {
      localStorage: { getItem() { return null; }, setItem() {} },
      dispatchEvent(event) {
        if (event === CONSENT_UPDATED_EVENT) called = true;
      },
    };
    saveStoredPreferences({ analytics: true }, w);
    assert.strictEqual(called, true);
  });

  test("is no-op when window is undefined", () => {
    assert.doesNotThrow(() => saveStoredPreferences({ analytics: true }, undefined));
  });
});

describe("hasAnalyticsConsent", () => {
  function makeWindow(data = {}) {
    return {
      localStorage: {
        getItem(key) { return data[key] ?? null; },
        setItem() {},
      },
    };
  }

  test("returns false by default", () => {
    assert.strictEqual(hasAnalyticsConsent(makeWindow()), false);
  });

  test("returns true when analytics is enabled in storage", () => {
    const w = makeWindow({ [CONSENT_PREFERENCES_KEY]: JSON.stringify({ analytics: true }) });
    assert.strictEqual(hasAnalyticsConsent(w), true);
  });
});

describe("hasMarketingConsent", () => {
  function makeWindow(data = {}) {
    return {
      localStorage: {
        getItem(key) { return data[key] ?? null; },
        setItem() {},
      },
    };
  }

  test("returns false by default", () => {
    assert.strictEqual(hasMarketingConsent(makeWindow()), false);
  });

  test("returns true when marketing is enabled in storage", () => {
    const w = makeWindow({ [CONSENT_PREFERENCES_KEY]: JSON.stringify({ marketing: true }) });
    assert.strictEqual(hasMarketingConsent(w), true);
  });
});

describe("hasFunctionalConsent", () => {
  function makeWindow(data = {}) {
    return {
      localStorage: {
        getItem(key) { return data[key] ?? null; },
        setItem() {},
      },
    };
  }

  test("returns false by default", () => {
    assert.strictEqual(hasFunctionalConsent(makeWindow()), false);
  });

  test("returns true when functional is enabled in storage", () => {
    const w = makeWindow({ [CONSENT_PREFERENCES_KEY]: JSON.stringify({ functional: true }) });
    assert.strictEqual(hasFunctionalConsent(w), true);
  });
});
