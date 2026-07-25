// __tests__/components/cookieConsent.test.js
//
// Run with:  npx jest __tests__/components/cookieConsent.test.js
//
// Tests the cookie consent utilities in src/lib/cookieConsent.js.

const {
  getStoredPreferences,
  saveStoredPreferences,
  hasAnalyticsConsent,
  hasMarketingConsent,
  hasFunctionalConsent,
  CONSENT_STATUS_KEY,
  CONSENT_PREFERENCES_KEY,
  CONSENT_UPDATED_EVENT,
  DEFAULT_PREFERENCES,
} = require("../../src/lib/cookieConsent");

describe("constants", () => {
  test("DEFAULT_PREFERENCES has essential=true and others false", () => {
    expect(DEFAULT_PREFERENCES).toEqual({
      essential: true,
      analytics: false,
      functional: false,
      marketing: false,
    });
  });

  test("event name is a non-empty string", () => {
    expect(typeof CONSENT_UPDATED_EVENT).toBe("string");
    expect(CONSENT_UPDATED_EVENT.length).toBeGreaterThan(0);
  });

  test("storage keys are non-empty strings", () => {
    expect(typeof CONSENT_STATUS_KEY).toBe("string");
    expect(CONSENT_STATUS_KEY.length).toBeGreaterThan(0);
    expect(typeof CONSENT_PREFERENCES_KEY).toBe("string");
    expect(CONSENT_PREFERENCES_KEY.length).toBeGreaterThan(0);
  });
});

describe("getStoredPreferences", () => {
  const storage = {};
  let windowSpy;

  beforeEach(() => {
    for (const key of Object.keys(storage)) delete storage[key];
    windowSpy = jest.spyOn(window, "localStorage", "get").mockReturnValue({
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
    });
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  test("returns DEFAULT_PREFERENCES when localStorage is empty", () => {
    expect(getStoredPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  test("returns DEFAULT_PREFERENCES when no item is stored", () => {
    expect(getStoredPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  test("returns parsed preferences when stored", () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      essential: true,
      analytics: true,
      functional: true,
      marketing: false,
    });
    const prefs = getStoredPreferences();
    expect(prefs.analytics).toBe(true);
    expect(prefs.functional).toBe(true);
    expect(prefs.marketing).toBe(false);
    expect(prefs.essential).toBe(true); // always enforced
  });

  test("always forces essential to true even if stored as false", () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      essential: false,
      analytics: false,
      functional: false,
      marketing: false,
    });
    expect(getStoredPreferences().essential).toBe(true);
  });

  test("merges stored prefs with defaults (partial override)", () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      analytics: true,
      marketing: true,
    });
    const prefs = getStoredPreferences();
    expect(prefs.analytics).toBe(true);
    expect(prefs.marketing).toBe(true);
    expect(prefs.functional).toBe(false); // default
    expect(prefs.essential).toBe(true);   // default
  });

  test("returns DEFAULT_PREFERENCES on invalid JSON", () => {
    storage[CONSENT_PREFERENCES_KEY] = "not valid json";
    expect(getStoredPreferences()).toEqual(DEFAULT_PREFERENCES);
  });
});

describe("saveStoredPreferences", () => {
  const storage = {};
  let windowSpy;
  let dispatchSpy;

  beforeEach(() => {
    for (const key of Object.keys(storage)) delete storage[key];
    windowSpy = jest.spyOn(window, "localStorage", "get").mockReturnValue({
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
    });
    dispatchSpy = jest.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    windowSpy.mockRestore();
    dispatchSpy.mockRestore();
  });

  test("saves preferences with essential forced to true", () => {
    const prefs = { analytics: true, functional: false, marketing: false };
    saveStoredPreferences({ essential: false, ...prefs });
    const stored = JSON.parse(storage[CONSENT_PREFERENCES_KEY]);
    expect(stored.essential).toBe(true);
    expect(stored.analytics).toBe(true);
    expect(stored.functional).toBe(false);
  });

  test("dispatches cookiePreferencesUpdated event", () => {
    saveStoredPreferences({ analytics: true, functional: false, marketing: false });
    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const dispatchedEvent = dispatchSpy.mock.calls[0][0];
    expect(dispatchedEvent.type).toBe(CONSENT_UPDATED_EVENT);
  });
});

describe("hasAnalyticsConsent", () => {
  const storage = {};
  let windowSpy;

  beforeEach(() => {
    for (const key of Object.keys(storage)) delete storage[key];
    windowSpy = jest.spyOn(window, "localStorage", "get").mockReturnValue({
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
    });
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  test("returns false by default (analytics is off)", () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  test("returns true when analytics is stored as true", () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      analytics: true,
      functional: false,
      marketing: false,
    });
    expect(hasAnalyticsConsent()).toBe(true);
  });
});

describe("hasMarketingConsent", () => {
  const storage = {};
  let windowSpy;

  beforeEach(() => {
    for (const key of Object.keys(storage)) delete storage[key];
    windowSpy = jest.spyOn(window, "localStorage", "get").mockReturnValue({
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
    });
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  test("returns false by default", () => {
    expect(hasMarketingConsent()).toBe(false);
  });

  test("returns true when marketing is stored as true", () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      analytics: false,
      functional: false,
      marketing: true,
    });
    expect(hasMarketingConsent()).toBe(true);
  });
});

describe("hasFunctionalConsent", () => {
  const storage = {};
  let windowSpy;

  beforeEach(() => {
    for (const key of Object.keys(storage)) delete storage[key];
    windowSpy = jest.spyOn(window, "localStorage", "get").mockReturnValue({
      getItem: (key) => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
    });
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  test("returns false by default", () => {
    expect(hasFunctionalConsent()).toBe(false);
  });

  test("returns true when functional is stored as true", () => {
    storage[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      analytics: false,
      functional: true,
      marketing: false,
    });
    expect(hasFunctionalConsent()).toBe(true);
  });
});
