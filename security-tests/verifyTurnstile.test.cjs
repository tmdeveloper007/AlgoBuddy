// security-tests/verifyTurnstile.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/verifyTurnstile.test.cjs
//
// Tests the Turnstile captcha verification helper in src/lib/verifyTurnstile.js.

const { test, describe, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('node:url');

const turnstileUrl = pathToFileURL(path.join(__dirname, '../src/lib/verifyTurnstile.js')).href;

describe('getCaptchaSecret', () => {
  const origEnv = process.env;

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  test('returns the configured secret key', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret-xyz';
    const { getCaptchaSecret } = await import(turnstileUrl);
    assert.strictEqual(getCaptchaSecret(), 'test-secret-xyz');
  });

  test('throws CAPTCHA_CONFIG_MISSING when env var is absent', async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const { getCaptchaSecret } = await import(turnstileUrl);
    assert.throws(() => getCaptchaSecret(), { message: 'CAPTCHA_CONFIG_MISSING' });
  });

  test('throws CAPTCHA_CONFIG_MISSING when env var is undefined string', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'undefined';
    const { getCaptchaSecret } = await import(turnstileUrl);
    assert.throws(() => getCaptchaSecret(), { message: 'CAPTCHA_CONFIG_MISSING' });
  });
});

describe('verifyTurnstile', () => {
  const origEnv = process.env;
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...origEnv, TURNSTILE_SECRET_KEY: 'test-secret-xyz' };
  });

  afterEach(() => {
    process.env = origEnv;
    globalThis.fetch = origFetch;
  });

  test('returns error for missing token', async () => {
    const { verifyTurnstile } = await import(turnstileUrl);
    const result = await verifyTurnstile(null);
    assert.deepStrictEqual(result, { ok: false, error: 'Captcha token missing' });
  });

  test('returns error for empty string token', async () => {
    const { verifyTurnstile } = await import(turnstileUrl);
    const result = await verifyTurnstile('');
    assert.deepStrictEqual(result, { ok: false, error: 'Captcha token missing' });
  });

  test('returns error when fetch throws', async () => {
    const { verifyTurnstile } = await import(turnstileUrl);
    globalThis.fetch = mock.fn(() => { throw new Error('network error'); });
    const result = await verifyTurnstile('valid-token', { ip: '1.2.3.4' });
    assert.deepStrictEqual(result, { ok: false, error: 'Captcha verification request failed' });
  });

  test('returns error when fetch returns non-ok status', async () => {
    const { verifyTurnstile } = await import(turnstileUrl);
    globalThis.fetch = mock.fn(() => Promise.resolve({ ok: false, status: 500 }));
    const result = await verifyTurnstile('valid-token', {});
    assert.deepStrictEqual(result, { ok: false, error: 'Captcha verification request failed' });
  });

  test('returns ok:true on successful verification', async () => {
    const { verifyTurnstile } = await import(turnstileUrl);
    globalThis.fetch = mock.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }),
    );
    const result = await verifyTurnstile('valid-token', { ip: '1.2.3.4' });
    assert.deepStrictEqual(result, { ok: true });
    assert.strictEqual(globalThis.fetch.mock.callCount(), 1);
  });

  test('returns specific error on timeout-or-duplicate failure', async () => {
    const { verifyTurnstile } = await import(turnstileUrl);
    globalThis.fetch = mock.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: false, 'error-codes': ['timeout-or-duplicate'] }),
      }),
    );
    const result = await verifyTurnstile('stale-token', {});
    assert.deepStrictEqual(result, {
      ok: false,
      error: 'Captcha token expired or was already used. Please refresh the page.',
    });
  });

  test('returns generic error on other failed verification', async () => {
    const { verifyTurnstile } = await import(turnstileUrl);
    globalThis.fetch = mock.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: false, 'error-codes': ['invalid-input-response'] }),
      }),
    );
    const result = await verifyTurnstile('bad-token', {});
    assert.deepStrictEqual(result, {
      ok: false,
      error: 'Captcha verification failed. Please try again.',
    });
  });

  test('trims whitespace from token', async () => {
    const { verifyTurnstile } = await import(turnstileUrl);
    globalThis.fetch = mock.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }),
    );
    await verifyTurnstile('  valid-token  ', { ip: '1.2.3.4' });
    assert.strictEqual(globalThis.fetch.mock.callCount(), 1);
  });

  test('omits remoteip when ip is unknown', async () => {
    const { verifyTurnstile } = await import(turnstileUrl);
    globalThis.fetch = mock.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) }),
    );
    await verifyTurnstile('token', { ip: 'unknown' });
    // body is a URLSearchParams; check the search string doesn't contain remoteip
    const bodyStr = globalThis.fetch.mock.calls[0].arguments[1].body.toString();
    assert.ok(!bodyStr.includes('remoteip'));
  });
});
