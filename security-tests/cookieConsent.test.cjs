const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadCookieConsent() {
  const url = pathToFileURL(
    path.join(__dirname, "..", "src/lib/cookieConsent.js"),
  ).href;
  return import(url);
}

test("DEFAULT_PREFERENCES sets essential true and others false", async () => {
  const mod = await loadCookieConsent();

  assert.equal(mod.DEFAULT_PREFERENCES.essential, true);
  assert.equal(mod.DEFAULT_PREFERENCES.analytics, false);
  assert.equal(mod.DEFAULT_PREFERENCES.functional, false);
  assert.equal(mod.DEFAULT_PREFERENCES.marketing, false);
});

test("CONSENT_STATUS_KEY and CONSENT_PREFERENCES_KEY are string constants", async () => {
  const mod = await loadCookieConsent();

  assert.equal(typeof mod.CONSENT_STATUS_KEY, "string");
  assert.equal(typeof mod.CONSENT_PREFERENCES_KEY, "string");
  assert.ok(mod.CONSENT_STATUS_KEY.length > 0);
  assert.ok(mod.CONSENT_PREFERENCES_KEY.length > 0);
});

test("getStoredPreferences returns DEFAULT_PREFERENCES when localStorage is absent", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = undefined;

  try {
    const prefs = mod.getStoredPreferences();
    assert.equal(prefs.essential, true);
    assert.equal(prefs.analytics, false);
    assert.equal(prefs.functional, false);
    assert.equal(prefs.marketing, false);
  } finally {
    global.window = originalWindow;
  }
});

test("getStoredPreferences returns DEFAULT_PREFERENCES when localStorage is empty", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = {
    localStorage: { getItem: () => null },
  };

  try {
    const prefs = mod.getStoredPreferences();
    assert.equal(prefs.essential, true);
    assert.equal(prefs.analytics, false);
  } finally {
    global.window = originalWindow;
  }
});

test("getStoredPreferences merges stored prefs with defaults", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: (key) => {
        if (key === mod.CONSENT_PREFERENCES_KEY) {
          return JSON.stringify({ analytics: true, marketing: true });
        }
        return null;
      },
    },
  };

  try {
    const prefs = mod.getStoredPreferences();
    assert.equal(prefs.essential, true, "essential must always be true");
    assert.equal(prefs.analytics, true, "analytics from stored prefs");
    assert.equal(prefs.functional, false, "functional from defaults");
    assert.equal(prefs.marketing, true, "marketing from stored prefs");
  } finally {
    global.window = originalWindow;
  }
});

test("getStoredPreferences ignores malformed JSON", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: () => "not valid json{{{",
    },
  };

  try {
    const prefs = mod.getStoredPreferences();
    assert.equal(prefs.essential, true);
    assert.equal(prefs.analytics, false);
  } finally {
    global.window = originalWindow;
  }
});

test("hasAnalyticsConsent returns true when analytics is enabled", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: (key) => {
        if (key === mod.CONSENT_PREFERENCES_KEY) {
          return JSON.stringify({ analytics: true });
        }
        return null;
      },
    },
  };

  try {
    assert.equal(mod.hasAnalyticsConsent(), true);
  } finally {
    global.window = originalWindow;
  }
});

test("hasAnalyticsConsent returns false when analytics is disabled", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: () => null,
    },
  };

  try {
    assert.equal(mod.hasAnalyticsConsent(), false);
  } finally {
    global.window = originalWindow;
  }
});

test("hasMarketingConsent returns true when marketing is enabled", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: (key) => {
        if (key === mod.CONSENT_PREFERENCES_KEY) {
          return JSON.stringify({ marketing: true });
        }
        return null;
      },
    },
  };

  try {
    assert.equal(mod.hasMarketingConsent(), true);
  } finally {
    global.window = originalWindow;
  }
});

test("hasMarketingConsent returns false when marketing is disabled", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: () => null,
    },
  };

  try {
    assert.equal(mod.hasMarketingConsent(), false);
  } finally {
    global.window = originalWindow;
  }
});

test("hasFunctionalConsent returns true when functional is enabled", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: (key) => {
        if (key === mod.CONSENT_PREFERENCES_KEY) {
          return JSON.stringify({ functional: true });
        }
        return null;
      },
    },
  };

  try {
    assert.equal(mod.hasFunctionalConsent(), true);
  } finally {
    global.window = originalWindow;
  }
});

test("hasFunctionalConsent returns false when functional is disabled", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: () => null,
    },
  };

  try {
    assert.equal(mod.hasFunctionalConsent(), false);
  } finally {
    global.window = originalWindow;
  }
});

test("saveStoredPreferences is a no-op in Node.js (window undefined)", async () => {
  // In Node.js, window is not defined in ESM lexical scope.
  // The typeof window === "undefined" guard causes early return.
  // This test verifies the guard works without throwing.
  const mod = await loadCookieConsent();

  // Calling with window undefined should not throw
  mod.saveStoredPreferences({ analytics: true });
  // If we reach here, the guard worked (returned early)
  // This is the expected behavior in a Node.js test environment
});

test("getStoredPreferences essential field cannot be overridden to false", async () => {
  const mod = await loadCookieConsent();
  const originalWindow = global.window;
  global.window = {
    localStorage: {
      getItem: (key) => {
        if (key === mod.CONSENT_PREFERENCES_KEY) {
          return JSON.stringify({ essential: false, analytics: true });
        }
        return null;
      },
    },
  };

  try {
    const prefs = mod.getStoredPreferences();
    assert.equal(
      prefs.essential,
      true,
      "essential must always be true regardless of stored value",
    );
    assert.equal(prefs.analytics, true);
  } finally {
    global.window = originalWindow;
  }
});
