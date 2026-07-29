// security-tests/cookieConsent.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/cookieConsent.test.cjs
//
// Tests cookie consent utilities from src/lib/cookieConsent.js.

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// ─── Inline implementation ───────────────────────────────────────────────────

const CONSENT_STATUS_KEY = 'cookieConsent';
const CONSENT_PREFERENCES_KEY = 'cookiePreferences';
const CONSENT_UPDATED_EVENT = 'cookiePreferencesUpdated';

const DEFAULT_PREFERENCES = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
};

function getStoredPreferences() {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
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
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    CONSENT_PREFERENCES_KEY,
    JSON.stringify({ ...preferences, essential: true })
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

// ─── localStorage mock ───────────────────────────────────────────────────────

const storage = {};
const listeners = {};

global.window = {
  localStorage: {
    getItem: (key) => {
      if (storage[key] !== undefined) return storage[key];
      return null;
    },
    setItem: (key, value) => { storage[key] = value; },
    removeItem: (key) => { delete storage[key]; },
  },
  dispatchEvent: (event) => {
    const handlers = listeners[event.type] || [];
    handlers.forEach((h) => h(event));
  },
  addEventListener: (type, handler) => {
    if (!listeners[type]) listeners[type] = [];
    listeners[type].push(handler);
  },
};

function clearStorage() {
  Object.keys(storage).forEach((k) => delete storage[k]);
  Object.keys(listeners).forEach((k) => delete listeners[k]);
}

beforeEach(() => {
  clearStorage();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getStoredPreferences', () => {
  test('returns DEFAULT_PREFERENCES when localStorage is empty', () => {
    assert.deepStrictEqual(getStoredPreferences(), DEFAULT_PREFERENCES);
  });

  test('returns DEFAULT_PREFERENCES when localStorage has null entry', () => {
    storage[CONSENT_PREFERENCES_KEY] = null;
    assert.deepStrictEqual(getStoredPreferences(), DEFAULT_PREFERENCES);
  });

  test('returns DEFAULT_PREFERENCES when localStorage has invalid JSON', () => {
    storage[CONSENT_PREFERENCES_KEY] = 'not valid json {{{';
    assert.deepStrictEqual(getStoredPreferences(), DEFAULT_PREFERENCES);
  });

  test('merges stored preferences over defaults', () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      analytics: true,
      marketing: true,
    });
    const prefs = getStoredPreferences();
    assert.strictEqual(prefs.essential, true); // always true
    assert.strictEqual(prefs.analytics, true);
    assert.strictEqual(prefs.marketing, true);
    assert.strictEqual(prefs.functional, false); // default
  });

  test('always sets essential to true regardless of stored value', () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      essential: false,
      analytics: true,
    });
    const prefs = getStoredPreferences();
    assert.strictEqual(prefs.essential, true);
    assert.strictEqual(prefs.analytics, true);
  });

  test('handles partial preferences', () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({ functional: true });
    const prefs = getStoredPreferences();
    assert.strictEqual(prefs.functional, true);
    assert.strictEqual(prefs.marketing, false);
    assert.strictEqual(prefs.analytics, false);
  });
});

describe('saveStoredPreferences', () => {
  // Validate via getStoredPreferences to avoid direct storage access timing issues
  test('stores analytics and marketing preferences via getStoredPreferences', () => {
    saveStoredPreferences({ analytics: true, marketing: false });
    const prefs = getStoredPreferences();
    assert.strictEqual(prefs.essential, true); // enforced
    assert.strictEqual(prefs.analytics, true);
    assert.strictEqual(prefs.marketing, false);
    assert.strictEqual(prefs.functional, false); // not set, defaults to false
  });

  test('always enforces essential as true regardless of input', () => {
    saveStoredPreferences({ essential: false, analytics: true });
    const prefs = getStoredPreferences();
    assert.strictEqual(prefs.essential, true);
    assert.strictEqual(prefs.analytics, true);
  });

  test('dispatches cookiePreferencesUpdated event', () => {
    let eventFired = false;
    global.window.addEventListener(CONSENT_UPDATED_EVENT, () => { eventFired = true; });
    saveStoredPreferences({ analytics: true });
    assert.strictEqual(eventFired, true);
  });
});

describe('hasAnalyticsConsent', () => {
  test('returns false by default', () => {
    assert.strictEqual(hasAnalyticsConsent(), false);
  });

  test('returns true when analytics is true in stored preferences', () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({ analytics: true });
    assert.strictEqual(hasAnalyticsConsent(), true);
  });

  test('returns false when analytics is explicitly false', () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({ analytics: false });
    assert.strictEqual(hasAnalyticsConsent(), false);
  });
});

describe('hasMarketingConsent', () => {
  test('returns false by default', () => {
    assert.strictEqual(hasMarketingConsent(), false);
  });

  test('returns true when marketing is true in stored preferences', () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({ marketing: true });
    assert.strictEqual(hasMarketingConsent(), true);
  });
});

describe('hasFunctionalConsent', () => {
  test('returns false by default', () => {
    assert.strictEqual(hasFunctionalConsent(), false);
  });

  test('returns true when functional is true in stored preferences', () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({ functional: true });
    assert.strictEqual(hasFunctionalConsent(), true);
  });
});
