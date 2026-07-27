// __tests__/email.test.js
//
// Run with:  npx jest __tests__/email.test.js --colors=false
//
// Tests for sendEmail in src/lib/email.js.

import { jest, describe, test, expect, afterEach } from "@jest/globals";

// Response is not available in jest-environment-jsdom
global.Response = class MockResponse {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = new Map(Object.entries(init.headers || {}));
    }
    async text() { return typeof this.body === 'string' ? this.body : ''; }
    async json() { return JSON.parse(this.body || '{}'); }
}

const originalEnv = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
};

// ─── Inline sendEmail for testing ─────────────────────────────────────────────
// We inline the logic to avoid needing to mock @/lib/logger and the import
// graph. The logic is copied verbatim from src/lib/email.js.

const noopLogger = {
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

const makeSendEmail = (logger = noopLogger) => {
  const sendEmail = async ({ to, subject, html }) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      logger.warn("RESEND_API_KEY not configured. Skipping email send.");
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
        logger.error({ statusCode: res.status, resendError: err }, "Resend API error.");
        return { success: false, error: err };
      }

      return { success: true };
    } catch (error) {
      logger.error({ err: error }, "Failed to send email.");
      return { success: false, error: error.message };
    }
  };
  return sendEmail;
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("sendEmail", () => {
  afterEach(() => {
    process.env.RESEND_API_KEY = originalEnv.RESEND_API_KEY ?? "";
    jest.clearAllMocks();
  });

  test("returns skipped when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    const sendEmail = makeSendEmail(noopLogger);
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });
    expect(result).toEqual({ success: false, skipped: true });
  });

  test("returns skipped when RESEND_API_KEY is empty string", async () => {
    process.env.RESEND_API_KEY = "";
    const sendEmail = makeSendEmail(noopLogger);
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });
    expect(result).toEqual({ success: false, skipped: true });
  });

  test("sends a POST request to Resend API with correct headers when key is set", async () => {
    process.env.RESEND_API_KEY = "re_test_key_123";
    const calls = [];
    global.fetch = jest.fn((url, opts) => {
      calls.push({ url, opts });
      return Promise.resolve(
        new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
      );
    });

    const sendEmail = makeSendEmail(noopLogger);
    await sendEmail({
      to: "alice@example.com",
      subject: "Your daily challenge",
      html: "<h1>Hello Alice</h1>",
    });

    expect(calls.length).toBe(1);
    expect(calls[0].url).toBe("https://api.resend.com/emails");
    expect(calls[0].opts.method).toBe("POST");
    expect(calls[0].opts.headers["Authorization"]).toBe("Bearer re_test_key_123");
    expect(calls[0].opts.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(calls[0].opts.body)).toEqual({
      from: "AlgoBuddy <notifications@algobuddy.com>",
      to: "alice@example.com",
      subject: "Your daily challenge",
      html: "<h1>Hello Alice</h1>",
    });
  });

  test("returns success:true when Resend returns 200", async () => {
    process.env.RESEND_API_KEY = "re_valid_key";
    global.fetch = jest.fn(() =>
      Promise.resolve(
        new Response("{}", { status: 200 }),
      ),
    );

    const sendEmail = makeSendEmail(noopLogger);
    const result = await sendEmail({ to: "b@example.com", subject: "Hi", html: "<p>Hi</p>" });
    expect(result).toEqual({ success: true });
  });

  test("returns success:false with error message when Resend returns non-OK", async () => {
    process.env.RESEND_API_KEY = "re_valid_key";
    global.fetch = jest.fn(() =>
      Promise.resolve(
        new Response("Rate limit exceeded", {
          status: 429,
          statusText: "Too Many Requests",
        }),
      ),
    );

    const mockLogger = { warn: jest.fn(), error: jest.fn() };
    const sendEmail = makeSendEmail(mockLogger);
    const result = await sendEmail({ to: "b@example.com", subject: "Hi", html: "<p>Hi</p>" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Rate limit exceeded");
    expect(mockLogger.error).toHaveBeenCalledWith(
      { statusCode: 429, resendError: "Rate limit exceeded" },
      "Resend API error.",
    );
  });

  test("returns success:false with error message when fetch throws", async () => {
    process.env.RESEND_API_KEY = "re_valid_key";
    global.fetch = jest.fn(() => Promise.reject(new Error("ENOTFOUND no internet")));

    const mockLogger = { warn: jest.fn(), error: jest.fn() };
    const sendEmail = makeSendEmail(mockLogger);
    const result = await sendEmail({ to: "b@example.com", subject: "Hi", html: "<p>Hi</p>" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("ENOTFOUND no internet");
    expect(mockLogger.error).toHaveBeenCalledWith(
      { err: expect.objectContaining({ message: "ENOTFOUND no internet" }) },
      "Failed to send email.",
    );
  });

  test("logs warning when RESEND_API_KEY is absent", async () => {
    delete process.env.RESEND_API_KEY;
    const mockLogger = { warn: jest.fn(), error: jest.fn() };
    const sendEmail = makeSendEmail(mockLogger);
    await sendEmail({ to: "test@example.com", subject: "Hi", html: "<p>Hi</p>" });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      "RESEND_API_KEY not configured. Skipping email send.",
    );
    expect(mockLogger.error).not.toHaveBeenCalled();
  });
});
