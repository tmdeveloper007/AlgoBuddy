// __tests__/cookieConsent.test.js
//
// Run with:  npx jest __tests__/cookieConsent.test.js
//
// Tests the cookie consent helpers in src/lib/cookieConsent.js.
// Sets global.localStorage directly in beforeEach; module is required once
// at the top using the jsdom window/localStorage.

const {
  CONSENT_STATUS_KEY,
  CONSENT_PREFERENCES_KEY,
  CONSENT_UPDATED_EVENT,
  DEFAULT_PREFERENCES,
  getStoredPreferences,
  saveStoredPreferences,
  hasAnalyticsConsent,
  hasMarketingConsent,
  hasFunctionalConsent,
} = require("../src/lib/cookieConsent");

describe("cookieConsent constants", () => {
  test("CONSENT_STATUS_KEY is a non-empty string", () => {
    expect(typeof CONSENT_STATUS_KEY).toBe("string");
    expect(CONSENT_STATUS_KEY.length).toBeGreaterThan(0);
  });

  test("CONSENT_PREFERENCES_KEY is a non-empty string", () => {
    expect(typeof CONSENT_PREFERENCES_KEY).toBe("string");
    expect(CONSENT_PREFERENCES_KEY.length).toBeGreaterThan(0);
  });

  test("CONSENT_UPDATED_EVENT is a non-empty string", () => {
    expect(typeof CONSENT_UPDATED_EVENT).toBe("string");
    expect(CONSENT_UPDATED_EVENT.length).toBeGreaterThan(0);
  });

  test("DEFAULT_PREFERENCES has correct structure", () => {
    expect(DEFAULT_PREFERENCES).toEqual({
      essential: true,
      analytics: false,
      functional: false,
      marketing: false,
    });
  });
});

describe("getStoredPreferences", () => {
  beforeEach(() => {
    // Clear jsdom localStorage before each test
    global.localStorage.clear();
  });

  test("returns DEFAULT_PREFERENCES when localStorage is empty", () => {
    expect(getStoredPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  test("returns merged preferences when localStorage has valid JSON", () => {
    global.localStorage.setItem(
      CONSENT_PREFERENCES_KEY,
      JSON.stringify({ analytics: true, marketing: true })
    );
    const result = getStoredPreferences();
    expect(result.analytics).toBe(true);
    expect(result.marketing).toBe(true);
  });

  test("always forces essential to true even if stored value is false", () => {
    global.localStorage.setItem(
      CONSENT_PREFERENCES_KEY,
      JSON.stringify({ essential: false, analytics: true })
    );
    const result = getStoredPreferences();
    expect(result.essential).toBe(true);
    expect(result.analytics).toBe(true);
  });

  test("returns DEFAULT_PREFERENCES on invalid JSON", () => {
    global.localStorage.setItem(CONSENT_PREFERENCES_KEY, "not-valid-json{");
    expect(getStoredPreferences()).toEqual(DEFAULT_PREFERENCES);
  });
});

describe("saveStoredPreferences", () => {
  let dispatchEventSpy;

  beforeEach(() => {
    global.localStorage.clear();
    dispatchEventSpy = jest.spyOn(global.window, "dispatchEvent");
  });

  afterEach(() => {
    dispatchEventSpy.mockRestore();
  });

  test("saves JSON-serialized preferences to localStorage", () => {
    const prefs = { analytics: true, marketing: false };
    saveStoredPreferences(prefs);
    const stored = global.localStorage.getItem(CONSENT_PREFERENCES_KEY);
    const parsed = JSON.parse(stored);
    expect(parsed.analytics).toBe(true);
    expect(parsed.marketing).toBe(false);
  });

  test("always saves essential as true regardless of input", () => {
    saveStoredPreferences({ essential: false, analytics: true });
    const stored = global.localStorage.getItem(CONSENT_PREFERENCES_KEY);
    const parsed = JSON.parse(stored);
    expect(parsed.essential).toBe(true);
  });

  test("dispatches cookiePreferencesUpdated event", () => {
    saveStoredPreferences({ analytics: true });
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: CONSENT_UPDATED_EVENT })
    );
  });
});

describe("hasAnalyticsConsent", () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  test("returns true when analytics is true", () => {
    global.localStorage.setItem(
      CONSENT_PREFERENCES_KEY,
      JSON.stringify({ analytics: true })
    );
    expect(hasAnalyticsConsent()).toBe(true);
  });

  test("returns false when analytics is false", () => {
    global.localStorage.setItem(
      CONSENT_PREFERENCES_KEY,
      JSON.stringify({ analytics: false })
    );
    expect(hasAnalyticsConsent()).toBe(false);
  });

  test("returns false when analytics is not in stored preferences", () => {
    global.localStorage.setItem(
      CONSENT_PREFERENCES_KEY,
      JSON.stringify({ marketing: true })
    );
    expect(hasAnalyticsConsent()).toBe(false);
  });
});

describe("hasMarketingConsent", () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  test("returns true when marketing is true", () => {
    global.localStorage.setItem(
      CONSENT_PREFERENCES_KEY,
      JSON.stringify({ marketing: true })
    );
    expect(hasMarketingConsent()).toBe(true);
  });

  test("returns false when marketing is false", () => {
    global.localStorage.setItem(
      CONSENT_PREFERENCES_KEY,
      JSON.stringify({ marketing: false })
    );
    expect(hasMarketingConsent()).toBe(false);
  });
});

describe("hasFunctionalConsent", () => {
  beforeEach(() => {
    global.localStorage.clear();
  });

  test("returns true when functional is true", () => {
    global.localStorage.setItem(
      CONSENT_PREFERENCES_KEY,
      JSON.stringify({ functional: true })
    );
    expect(hasFunctionalConsent()).toBe(true);
  });

  test("returns false when functional is false", () => {
    global.localStorage.setItem(
      CONSENT_PREFERENCES_KEY,
      JSON.stringify({ functional: false })
    );
    expect(hasFunctionalConsent()).toBe(false);
  });
});
