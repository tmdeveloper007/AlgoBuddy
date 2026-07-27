// security-tests/cookieConsent.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/cookieConsent.test.cjs
//
// Tests cookie consent helpers from src/lib/cookieConsent.js.

const { describe, test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");

// ─── Inline source under test ─────────────────────────────────────────────────

const CONSENT_STATUS_KEY = "cookieConsent";
const CONSENT_PREFERENCES_KEY = "cookiePreferences";
const CONSENT_UPDATED_EVENT = "cookiePreferencesUpdated";

const DEFAULT_PREFERENCES = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
};

function getStoredPreferences() {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(CONSENT_PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed, essential: true };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function saveStoredPreferences(preferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    CONSENT_PREFERENCES_KEY,
    JSON.stringify({ ...preferences, essential: true }),
  );
  window.dispatchEvent(new Event(CONSENT_UPDATED_EVENT));
}

function hasAnalyticsConsent() {
  return getStoredPreferences().analytics === true;
}

function hasMarketingConsent() {
  return getStoredPreferences().marketing === true;
}

function hasFunctionalConsent() {
  return getStoredPreferences().functional === true;
}

// ─── Shared mock state ────────────────────────────────────────────────────────
// Each test resets these directly.

let mockStore = {};
const mockListeners = {};

function makeWindow(overrides = {}) {
  return {
    localStorage: {
      getItem: (key) => mockStore[key] ?? null,
      setItem: (key, value) => { mockStore[key] = value; },
      removeItem: (key) => { delete mockStore[key]; },
      clear: () => { mockStore = {}; },
    },
    addEventListener: (type, fn) => {
      if (!mockListeners[type]) mockListeners[type] = [];
      mockListeners[type].push(fn);
    },
    dispatchEvent: (event) => {
      if (mockListeners[event.type]) {
        mockListeners[event.type].forEach((fn) => fn(event));
      }
    },
    ...overrides,
  };
}

function resetStore() {
  mockStore = {};
  for (const k of Object.keys(mockListeners)) delete mockListeners[k];
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("constants", () => {
  test("CONSENT_STATUS_KEY is cookieConsent", () => {
    assert.strictEqual(CONSENT_STATUS_KEY, "cookieConsent");
  });

  test("CONSENT_PREFERENCES_KEY is cookiePreferences", () => {
    assert.strictEqual(CONSENT_PREFERENCES_KEY, "cookiePreferences");
  });

  test("CONSENT_UPDATED_EVENT is cookiePreferencesUpdated", () => {
    assert.strictEqual(CONSENT_UPDATED_EVENT, "cookiePreferencesUpdated");
  });

  test("DEFAULT_PREFERENCES has essential true and others false", () => {
    assert.deepStrictEqual(DEFAULT_PREFERENCES, {
      essential: true,
      analytics: false,
      functional: false,
      marketing: false,
    });
  });
});

describe("getStoredPreferences", () => {
  beforeEach(() => {
    resetStore();
    globalThis.window = makeWindow();
  });

  test("returns DEFAULT_PREFERENCES when localStorage is empty", () => {
    assert.deepStrictEqual(getStoredPreferences(), DEFAULT_PREFERENCES);
  });

  test("returns DEFAULT_PREFERENCES when key is absent", () => {
    mockStore["other_key"] = "some_value";
    assert.deepStrictEqual(getStoredPreferences(), DEFAULT_PREFERENCES);
  });

  test("merges stored prefs on top of defaults", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      analytics: true,
      functional: true,
    });
    const result = getStoredPreferences();
    assert.strictEqual(result.essential, true);     // forced true
    assert.strictEqual(result.analytics, true);    // from stored
    assert.strictEqual(result.functional, true);   // from stored
    assert.strictEqual(result.marketing, false);   // default
  });

  test("always forces essential to true even if stored as false", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      essential: false,
      analytics: true,
    });
    const result = getStoredPreferences();
    assert.strictEqual(result.essential, true);  // forced true regardless
    assert.strictEqual(result.analytics, true);
  });

  test("returns DEFAULT_PREFERENCES when stored JSON is malformed", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = "not valid json {{{";
    assert.deepStrictEqual(getStoredPreferences(), DEFAULT_PREFERENCES);
  });

  test("returns DEFAULT_PREFERENCES when stored value is empty string", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = "";
    assert.deepStrictEqual(getStoredPreferences(), DEFAULT_PREFERENCES);
  });

  test("returns DEFAULT_PREFERENCES in SSR (no window)", () => {
    globalThis.window = undefined;
    assert.deepStrictEqual(getStoredPreferences(), DEFAULT_PREFERENCES);
  });

  test("partial stored prefs fill in remaining from defaults", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = JSON.stringify({ analytics: true });
    const result = getStoredPreferences();
    assert.strictEqual(result.essential, true);    // default
    assert.strictEqual(result.analytics, true);   // from stored
    assert.strictEqual(result.functional, false); // default
    assert.strictEqual(result.marketing, false); // default
  });
});

describe("saveStoredPreferences", () => {
  beforeEach(() => {
    resetStore();
    globalThis.window = makeWindow();
  });

  test("saves merged preferences with essential forced to true", () => {
    saveStoredPreferences({
      analytics: true,
      functional: true,
      marketing: false,
    });
    const saved = JSON.parse(mockStore[CONSENT_PREFERENCES_KEY]);
    assert.strictEqual(saved.essential, true);     // forced true
    assert.strictEqual(saved.analytics, true);    // from input
    assert.strictEqual(saved.functional, true);   // from input
    assert.strictEqual(saved.marketing, false);   // from input
  });

  test("dispatches cookiePreferencesUpdated event", () => {
    let eventFired = false;
    mockListeners[CONSENT_UPDATED_EVENT] = [];
    globalThis.window = makeWindow({
      addEventListener: (type, fn) => {
        if (type === CONSENT_UPDATED_EVENT) fn(new Event(type));
      },
    });
    globalThis.window.addEventListener(CONSENT_UPDATED_EVENT, () => {
      eventFired = true;
    });
    saveStoredPreferences({ analytics: true });
    assert.strictEqual(eventFired, true);
  });

  test("is no-op in SSR (no window)", () => {
    globalThis.window = undefined;
    // Should not throw
    saveStoredPreferences({ analytics: true });
    // store should still be empty
    assert.strictEqual(Object.keys(mockStore).length, 0);
  });

  test("overwrites previously stored preferences", () => {
    saveStoredPreferences({ analytics: true });
    saveStoredPreferences({ analytics: false, marketing: true });
    const saved = JSON.parse(mockStore[CONSENT_PREFERENCES_KEY]);
    assert.strictEqual(saved.analytics, false);
    assert.strictEqual(saved.marketing, true);
  });
});

describe("hasAnalyticsConsent", () => {
  beforeEach(() => {
    resetStore();
    globalThis.window = makeWindow();
  });

  test("returns false when analytics is not set (default)", () => {
    assert.strictEqual(hasAnalyticsConsent(), false);
  });

  test("returns true when analytics preference is true", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = JSON.stringify({ analytics: true });
    assert.strictEqual(hasAnalyticsConsent(), true);
  });

  test("returns false when analytics preference is explicitly false", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = JSON.stringify({ analytics: false });
    assert.strictEqual(hasAnalyticsConsent(), false);
  });
});

describe("hasMarketingConsent", () => {
  beforeEach(() => {
    resetStore();
    globalThis.window = makeWindow();
  });

  test("returns false when marketing is not set (default)", () => {
    assert.strictEqual(hasMarketingConsent(), false);
  });

  test("returns true when marketing preference is true", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = JSON.stringify({ marketing: true });
    assert.strictEqual(hasMarketingConsent(), true);
  });

  test("returns false when marketing preference is explicitly false", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = JSON.stringify({ marketing: false });
    assert.strictEqual(hasMarketingConsent(), false);
  });
});

describe("hasFunctionalConsent", () => {
  beforeEach(() => {
    resetStore();
    globalThis.window = makeWindow();
  });

  test("returns false when functional is not set (default)", () => {
    assert.strictEqual(hasFunctionalConsent(), false);
  });

  test("returns true when functional preference is true", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = JSON.stringify({ functional: true });
    assert.strictEqual(hasFunctionalConsent(), true);
  });

  test("returns false when functional preference is explicitly false", () => {
    mockStore[CONSENT_PREFERENCES_KEY] = JSON.stringify({ functional: false });
    assert.strictEqual(hasFunctionalConsent(), false);
  });
});
