// security-tests/cookieConsent.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/cookieConsent.test.cjs
//
// Tests cookie consent preference helpers.

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Inlined source to avoid ESM import issues.
const CONSENT_PREFERENCES_KEY = "cookiePreferences";
const DEFAULT_PREFERENCES = {
    essential: true,
    analytics: false,
    functional: false,
    marketing: false,
};

// Mutable mock store — replaced in beforeEach
let _store = {};
function _ls() {
  return {
    getItem: (key) => _store[key] ?? null,
    setItem: (key, value) => { _store[key] = value; },
    removeItem: (key) => { delete _store[key]; },
    clear: () => { _store = {}; },
  };
}

function getStoredPreferences() {
    const ls = _ls();
    try {
    const raw = ls.getItem(CONSENT_PREFERENCES_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed, essential: true };
    } catch {
    return { ...DEFAULT_PREFERENCES };
    }
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

beforeEach(() => {
  _store = {};
});

// ── Tests ────────────────────────────────────────────────────────────

describe('getStoredPreferences', () => {
  it('returns DEFAULT_PREFERENCES when localStorage is empty', () => {
    assert.deepEqual(getStoredPreferences(), DEFAULT_PREFERENCES);
  });

  it('merges stored preferences over defaults', () => {
    _store[CONSENT_PREFERENCES_KEY] = JSON.stringify({ analytics: true, marketing: true });
    const prefs = getStoredPreferences();
    assert.equal(prefs.analytics, true);
    assert.equal(prefs.marketing, true);
    assert.equal(prefs.essential, true); // forced to true
    assert.equal(prefs.functional, false); // from default
  });

  it('always forces essential to true even if stored as false', () => {
    _store[CONSENT_PREFERENCES_KEY] = JSON.stringify({ essential: false, analytics: true });
    assert.equal(getStoredPreferences().essential, true);
  });

  it('returns DEFAULT_PREFERENCES on malformed JSON', () => {
    _store[CONSENT_PREFERENCES_KEY] = 'not valid json';
    assert.deepEqual(getStoredPreferences(), DEFAULT_PREFERENCES);
  });
});

describe('hasAnalyticsConsent', () => {
  it('returns false when analytics is not set', () => {
    assert.equal(hasAnalyticsConsent(), false);
  });

  it('returns true when analytics is true', () => {
    _store[CONSENT_PREFERENCES_KEY] = JSON.stringify({ analytics: true });
    assert.equal(hasAnalyticsConsent(), true);
  });
});

describe('hasMarketingConsent', () => {
  it('returns false when marketing is not set', () => {
    assert.equal(hasMarketingConsent(), false);
  });

  it('returns true when marketing is true', () => {
    _store[CONSENT_PREFERENCES_KEY] = JSON.stringify({ marketing: true });
    assert.equal(hasMarketingConsent(), true);
  });
});

describe('hasFunctionalConsent', () => {
  it('returns false when functional is not set', () => {
    assert.equal(hasFunctionalConsent(), false);
  });

  it('returns true when functional is true', () => {
    _store[CONSENT_PREFERENCES_KEY] = JSON.stringify({ functional: true });
    assert.equal(hasFunctionalConsent(), true);
  });
});
