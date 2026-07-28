// __tests__/cookieConsent.test.js
//
// Run with:  npx jest __tests__/cookieConsent.test.js --colors=false
//
// Tests cookieConsent utilities in src/lib/cookieConsent.js.

const {
  CONSENT_PREFERENCES_KEY,
  CONSENT_UPDATED_EVENT,
  DEFAULT_PREFERENCES,
  getStoredPreferences,
  saveStoredPreferences,
  hasAnalyticsConsent,
  hasMarketingConsent,
  hasFunctionalConsent,
} = require("../src/lib/cookieConsent.js");

describe("DEFAULT_PREFERENCES", () => {
  test("has essential=true and others false", () => {
    expect(DEFAULT_PREFERENCES.essential).toBe(true);
    expect(DEFAULT_PREFERENCES.analytics).toBe(false);
    expect(DEFAULT_PREFERENCES.functional).toBe(false);
    expect(DEFAULT_PREFERENCES.marketing).toBe(false);
  });
});

describe("getStoredPreferences", () => {
  let savedWindow;

  beforeEach(() => {
    savedWindow = global.window;
    global.window = Object.create(null);
    global.window.localStorage = {
      _data: {},
      getItem(key) { return this._data[key] ?? null; },
      setItem(key, val) { this._data[key] = val; },
    };
  });

  afterEach(() => {
    global.window = savedWindow;
  });

  test("returns DEFAULT_PREFERENCES when storage is empty", () => {
    const prefs = getStoredPreferences();
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
  });

  test("returns DEFAULT_PREFERENCES on corrupted JSON", () => {
    global.window.localStorage._data[CONSENT_PREFERENCES_KEY] = "not json";
    const prefs = getStoredPreferences();
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
  });

  test("returns DEFAULT_PREFERENCES when window is undefined", () => {
    global.window = undefined;
    const prefs = getStoredPreferences();
    expect(prefs).toEqual(DEFAULT_PREFERENCES);
  });

  test("merges stored prefs with defaults", () => {
    global.window.localStorage._data[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      analytics: true, marketing: true, functional: true,
    });
    const prefs = getStoredPreferences();
    expect(prefs.analytics).toBe(true);
    expect(prefs.marketing).toBe(true);
    expect(prefs.functional).toBe(true);
  });

  test("essential is always true even if stored as false", () => {
    global.window.localStorage._data[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      essential: false, analytics: true,
    });
    const prefs = getStoredPreferences();
    expect(prefs.essential).toBe(true);
  });
});

describe("saveStoredPreferences", () => {
  let savedWindow;
  let dispatchedEvents;

  beforeEach(() => {
    savedWindow = global.window;
    dispatchedEvents = [];
    global.window = Object.create(null);
    global.window.localStorage = {
      _data: {},
      getItem(key) { return this._data[key] ?? null; },
      setItem(key, val) { this._data[key] = val; },
    };
    global.window.dispatchEvent = (event) => {
      dispatchedEvents.push(event);
    };
  });

  afterEach(() => {
    global.window = savedWindow;
  });

  test("saves merged preferences including essential forced true", () => {
    saveStoredPreferences({ analytics: true, marketing: false, functional: false });
    const stored = JSON.parse(global.window.localStorage._data[CONSENT_PREFERENCES_KEY]);
    expect(stored.analytics).toBe(true);
    expect(stored.marketing).toBe(false);
    expect(stored.essential).toBe(true);
  });

  test("dispatches cookiePreferencesUpdated event", () => {
    saveStoredPreferences({ analytics: true });
    expect(dispatchedEvents.length).toBeGreaterThan(0);
    const event = dispatchedEvents.find((e) => e.type === CONSENT_UPDATED_EVENT);
    expect(event).toBeDefined();
  });

  test("does nothing when window is undefined", () => {
    global.window = undefined;
    expect(() => saveStoredPreferences({ analytics: true })).not.toThrow();
  });
});

describe("hasAnalyticsConsent", () => {
  let savedWindow;

  beforeEach(() => {
    savedWindow = global.window;
    global.window = Object.create(null);
    global.window.localStorage = {
      _data: {},
      getItem(key) { return this._data[key] ?? null; },
      setItem(key, val) { this._data[key] = val; },
    };
  });

  afterEach(() => {
    global.window = savedWindow;
  });

  test("returns false by default", () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  test("returns true when analytics is enabled in storage", () => {
    global.window.localStorage._data[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      analytics: true,
    });
    expect(hasAnalyticsConsent()).toBe(true);
  });
});

describe("hasMarketingConsent", () => {
  let savedWindow;

  beforeEach(() => {
    savedWindow = global.window;
    global.window = Object.create(null);
    global.window.localStorage = {
      _data: {},
      getItem(key) { return this._data[key] ?? null; },
      setItem(key, val) { this._data[key] = val; },
    };
  });

  afterEach(() => {
    global.window = savedWindow;
  });

  test("returns false by default", () => {
    expect(hasMarketingConsent()).toBe(false);
  });

  test("returns true when marketing is enabled in storage", () => {
    global.window.localStorage._data[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      marketing: true,
    });
    expect(hasMarketingConsent()).toBe(true);
  });
});

describe("hasFunctionalConsent", () => {
  let savedWindow;

  beforeEach(() => {
    savedWindow = global.window;
    global.window = Object.create(null);
    global.window.localStorage = {
      _data: {},
      getItem(key) { return this._data[key] ?? null; },
      setItem(key, val) { this._data[key] = val; },
    };
  });

  afterEach(() => {
    global.window = savedWindow;
  });

  test("returns false by default", () => {
    expect(hasFunctionalConsent()).toBe(false);
  });

  test("returns true when functional is enabled in storage", () => {
    global.window.localStorage._data[CONSENT_PREFERENCES_KEY] = JSON.stringify({
      functional: true,
    });
    expect(hasFunctionalConsent()).toBe(true);
  });
});
