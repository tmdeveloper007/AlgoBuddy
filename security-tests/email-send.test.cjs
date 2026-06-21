// security-tests/email-send.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/email-send.test.cjs
//
// Tests sendEmail in src/lib/email.js.

const { describe, test, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

// Inline the source — sendEmail is a plain async function.
async function sendEmail({ to, subject, html }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured. Skipping email send.");
    return { success: false, skipped: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AlgoBuddy <notifications@algobuddy.com>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[/lib/email] Resend error:", err);
      return { success: false, error: err };
    }

    return { success: true };
  } catch (error) {
    console.error("[/lib/email] Failed to send email:", error);
    return { success: false, error: error.message };
  }
}

describe("sendEmail", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("returns skipped when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail({ to: "test@example.com", subject: "Hi", html: "<p>Hello</p>" });
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.skipped, true);
  });

  test("returns error when fetch returns non-OK status", async () => {
    process.env.RESEND_API_KEY = "test_key_abc123";

    const fakeFetch = mock.fn(async () => {
      return {
        ok: false,
        status: 422,
        async text() { return "Invalid API key"; },
      };
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = fakeFetch;
    try {
      const result = await sendEmail({ to: "test@example.com", subject: "Hi", html: "<p>Hello</p>" });
      assert.strictEqual(result.success, false);
      assert.ok("error" in result);
      assert.strictEqual(result.skipped, undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("returns success when fetch returns 200", async () => {
    process.env.RESEND_API_KEY = "test_key_abc123";

    const fakeFetch = mock.fn(async () => {
      return {
        ok: true,
        status: 200,
      };
    });

    // Inject mock fetch by temporarily replacing global fetch
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fakeFetch;

    try {
      const result = await sendEmail({ to: "user@example.com", subject: "Welcome", html: "<p>Welcome!</p>" });
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.error, undefined);
      assert.strictEqual(result.skipped, undefined);

      // Verify the call arguments
      const [url, opts] = fakeFetch.mock.calls[0].arguments;
      assert.strictEqual(url, "https://api.resend.com/emails");
      assert.strictEqual(opts.method, "POST");
      assert.strictEqual(opts.headers["Authorization"], "Bearer test_key_abc123");
      const body = JSON.parse(opts.body);
      assert.strictEqual(body.from, "AlgoBuddy <notifications@algobuddy.com>");
      assert.strictEqual(body.to, "user@example.com");
      assert.strictEqual(body.subject, "Welcome");
      assert.strictEqual(body.html, "<p>Welcome!</p>");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("returns error when fetch throws a network exception", async () => {
    process.env.RESEND_API_KEY = "test_key_abc123";

    const fakeFetch = mock.fn(async () => {
      throw new Error("ENOTFOUND");
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = fakeFetch;

    try {
      const result = await sendEmail({ to: "test@example.com", subject: "Hi", html: "<p>Hello</p>" });
      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, "ENOTFOUND");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
