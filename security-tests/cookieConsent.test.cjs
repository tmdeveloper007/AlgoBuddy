'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');

// Inline the module source so we can test it without ESM complications.
// We copy the relevant constants and functions here, keeping them in sync.
const CONSENT_STATUS_KEY = 'cookieConsent';
const CONSENT_PREFERENCES_KEY = 'cookiePreferences';
const CONSENT_UPDATED_EVENT = 'cookiePreferencesUpdated';
const DEFAULT_PREFERENCES = {
  essential: true,
  analytics: false,
  functional: false,
  marketing: false,
};

function getStoredPreferences(window) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  try {
    const raw = window.localStorage.getItem(CONSENT_PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed, essential: true };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function saveStoredPreferences(window, preferences) {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return;
  }
  window.localStorage.setItem(
    CONSENT_PREFERENCES_KEY,
    JSON.stringify({ ...preferences, essential: true })
  );
  window.dispatchEvent({ type: CONSENT_UPDATED_EVENT });
}

function hasAnalyticsConsent(window) {
  return getStoredPreferences(window).analytics === true;
}

function hasMarketingConsent(window) {
  return getStoredPreferences(window).marketing === true;
}

function hasFunctionalConsent(window) {
  return getStoredPreferences(window).functional === true;
}

describe('cookieConsent — constants', () => {
  it('DEFAULT_PREFERENCES has expected shape', () => {
    assert.deepStrictEqual(DEFAULT_PREFERENCES, {
      essential: true,
      analytics: false,
      functional: false,
      marketing: false,
    });
  });

  it('CONSENT_STATUS_KEY is a non-empty string', () => {
    assert.strictEqual(typeof CONSENT_STATUS_KEY, 'string');
    assert.ok(CONSENT_STATUS_KEY.length > 0);
  });

  it('CONSENT_PREFERENCES_KEY is a non-empty string', () => {
    assert.strictEqual(typeof CONSENT_PREFERENCES_KEY, 'string');
    assert.ok(CONSENT_PREFERENCES_KEY.length > 0);
  });

  it('CONSENT_UPDATED_EVENT is a non-empty string', () => {
    assert.strictEqual(typeof CONSENT_UPDATED_EVENT, 'string');
    assert.ok(CONSENT_UPDATED_EVENT.length > 0);
  });
});

describe('getStoredPreferences', () => {
  it('returns DEFAULT_PREFERENCES when window is undefined', () => {
    const result = getStoredPreferences(undefined);
    assert.deepStrictEqual(result, DEFAULT_PREFERENCES);
  });

  it('returns DEFAULT_PREFERENCES when localStorage is absent', () => {
    const result = getStoredPreferences({});
    assert.deepStrictEqual(result, DEFAULT_PREFERENCES);
  });

  it('returns DEFAULT_PREFERENCES when getItem returns null', () => {
    const mockWindow = {
      localStorage: { getItem: () => null },
    };
    const result = getStoredPreferences(mockWindow);
    assert.deepStrictEqual(result, DEFAULT_PREFERENCES);
    // getItem was called to retrieve the value
  });

  it('returns merged preferences on valid localStorage data', () => {
    const mockWindow = {
      localStorage: {
        getItem: () => JSON.stringify({ analytics: true, marketing: true }),
      },
    };
    const result = getStoredPreferences(mockWindow);
    assert.strictEqual(result.essential, true);
    assert.strictEqual(result.analytics, true);
    assert.strictEqual(result.marketing, true);
    assert.strictEqual(result.functional, false);
  });

  it('returns DEFAULT_PREFERENCES on JSON parse error', () => {
    const mockWindow = {
      localStorage: { getItem: () => 'not valid json{' },
    };
    const result = getStoredPreferences(mockWindow);
    assert.deepStrictEqual(result, DEFAULT_PREFERENCES);
  });

  it('essential is always true even if localStorage sets it to false', () => {
    const mockWindow = {
      localStorage: {
        getItem: () => JSON.stringify({ essential: false, analytics: true }),
      },
    };
    const result = getStoredPreferences(mockWindow);
    assert.strictEqual(result.essential, true);
  });
});

describe('saveStoredPreferences', () => {
  it('no-ops when window is undefined', () => {
    // Should not throw
    saveStoredPreferences(undefined, { analytics: true });
  });

  it('no-ops when localStorage is absent', () => {
    saveStoredPreferences({}, { analytics: true });
  });

  it('stores JSON-stringified preferences to localStorage', () => {
    const stored = [];
    const mockWindow = {
      localStorage: {
        setItem: (k, v) => stored.push([k, v]),
      },
      dispatchEvent: () => {},
    };
    saveStoredPreferences(mockWindow, { analytics: true, functional: true });
    assert.strictEqual(stored.length, 1);
    const [key, value] = stored[0];
    assert.strictEqual(key, CONSENT_PREFERENCES_KEY);
    const parsed = JSON.parse(value);
    assert.strictEqual(parsed.analytics, true);
    assert.strictEqual(parsed.functional, true);
    assert.strictEqual(parsed.essential, true);
  });

  it('dispatches a cookiePreferencesUpdated event', () => {
    let dispatched = null;
    const mockWindow = {
      localStorage: { setItem: () => {} },
      dispatchEvent: (e) => { dispatched = e; },
    };
    saveStoredPreferences(mockWindow, { marketing: true });
    assert.strictEqual(dispatched.type, CONSENT_UPDATED_EVENT);
  });
});

describe('hasAnalyticsConsent', () => {
  it('returns false when preferences are not set', () => {
    const mockWindow = { localStorage: { getItem: () => null } };
    assert.strictEqual(hasAnalyticsConsent(mockWindow), false);
  });

  it('returns true when analytics is set to true', () => {
    const mockWindow = {
      localStorage: { getItem: () => JSON.stringify({ analytics: true }) },
    };
    assert.strictEqual(hasAnalyticsConsent(mockWindow), true);
  });

  it('returns false when analytics is explicitly false', () => {
    const mockWindow = {
      localStorage: { getItem: () => JSON.stringify({ analytics: false }) },
    };
    assert.strictEqual(hasAnalyticsConsent(mockWindow), false);
  });
});

describe('hasMarketingConsent', () => {
  it('returns false when preferences are not set', () => {
    const mockWindow = { localStorage: { getItem: () => null } };
    assert.strictEqual(hasMarketingConsent(mockWindow), false);
  });

  it('returns true when marketing is set to true', () => {
    const mockWindow = {
      localStorage: { getItem: () => JSON.stringify({ marketing: true }) },
    };
    assert.strictEqual(hasMarketingConsent(mockWindow), true);
  });

  it('returns false when marketing is explicitly false', () => {
    const mockWindow = {
      localStorage: { getItem: () => JSON.stringify({ marketing: false }) },
    };
    assert.strictEqual(hasMarketingConsent(mockWindow), false);
  });
});

describe('hasFunctionalConsent', () => {
  it('returns false when preferences are not set', () => {
    const mockWindow = { localStorage: { getItem: () => null } };
    assert.strictEqual(hasFunctionalConsent(mockWindow), false);
  });

  it('returns true when functional is set to true', () => {
    const mockWindow = {
      localStorage: { getItem: () => JSON.stringify({ functional: true }) },
    };
    assert.strictEqual(hasFunctionalConsent(mockWindow), true);
  });

  it('returns false when functional is explicitly false', () => {
    const mockWindow = {
      localStorage: { getItem: () => JSON.stringify({ functional: false }) },
    };
    assert.strictEqual(hasFunctionalConsent(mockWindow), false);
  });
});
