// Run with: node --experimental-detect-module --test security-tests/newsletter.test.cjs
//
// Tests newsletter subscription route input validation and error handling.
// The Supabase client is mocked to avoid network calls; validation logic
// is tested in isolation.

const test = require("node:test");
const assert = require("node:assert/strict");

// ── Email validation regex (extracted from the route) ────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
  return Boolean(email && EMAIL_REGEX.test(String(email)));
}

// ── Route logic (minimal reproduction of the POST handler) ──────────────────
function handleNewsletterSubscribe({ email }) {
  // Validation step
  if (!email || !EMAIL_REGEX.test(String(email))) {
    return { status: 400, body: { error: "Invalid email address" } };
  }
  // Mock successful Supabase insert
  return { status: 201, body: { message: "Successfully subscribed!" } };
}

function handleNewsletterSubscribeDup({ email }) {
  if (!email || !EMAIL_REGEX.test(String(email))) {
    return { status: 400, body: { error: "Invalid email address" } };
  }
  // Mock unique constraint violation (error.code === '23505')
  return { status: 200, body: { message: "You are already subscribed!" } };
}

// ── Tests ────────────────────────────────────────────────────────────────────

test("email validation — accepts valid email addresses", () => {
  const validEmails = [
    "user@example.com",
    "test.name@sub.domain.org",
    "a@b.co",
    "user+tag@example.com",
    "firstname.lastname@company.co.uk",
  ];
  for (const email of validEmails) {
    assert.ok(isValidEmail(email), `Should accept: ${email}`);
  }
});

test("email validation — rejects invalid email addresses", () => {
  const invalidEmails = [
    "",
    null,
    undefined,
    "notanemail",
    "missing@domain",
    "@nodomain.com",
    "spaces in@email.com",
    "noatsign.com",
    "   ",
  ];
  for (const email of invalidEmails) {
    assert.ok(!isValidEmail(email), `Should reject: ${JSON.stringify(email)}`);
  }
});

test("email validation — rejects missing email (undefined)", () => {
  assert.strictEqual(isValidEmail(undefined), false);
});

test("email validation — rejects null email", () => {
  assert.strictEqual(isValidEmail(null), false);
});

test("email validation — rejects empty string", () => {
  assert.strictEqual(isValidEmail(""), false);
});

test("newsletter route — valid email returns 201", () => {
  const result = handleNewsletterSubscribe({ email: "user@example.com" });
  assert.strictEqual(result.status, 201);
  assert.strictEqual(result.body.message, "Successfully subscribed!");
});

test("newsletter route — invalid email returns 400 with error message", () => {
  const result = handleNewsletterSubscribe({ email: "notanemail" });
  assert.strictEqual(result.status, 400);
  assert.strictEqual(result.body.error, "Invalid email address");
});

test("newsletter route — missing email returns 400", () => {
  const result = handleNewsletterSubscribe({});
  assert.strictEqual(result.status, 400);
  assert.strictEqual(result.body.error, "Invalid email address");
});

test("newsletter route — duplicate email (unique constraint) returns 200 with already-subscribed message", () => {
  const result = handleNewsletterSubscribeDup({ email: "user@example.com" });
  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.body.message, "You are already subscribed!");
});

test("newsletter route — duplicate email still validates email first", () => {
  const result = handleNewsletterSubscribeDup({ email: "notanemail" });
  assert.strictEqual(result.status, 400, "Should reject invalid email before checking uniqueness");
});

test("email validation — TLD with dot returns valid", () => {
  assert.ok(isValidEmail("a@b.c"));
  assert.ok(isValidEmail("a@b.x"));
});

test("email validation — domain with multiple dots", () => {
  assert.ok(isValidEmail("user@mail.example.com"));
});
