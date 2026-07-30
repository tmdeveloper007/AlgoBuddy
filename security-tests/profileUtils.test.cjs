const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

async function loadProfileUtils() {
  const url = pathToFileURL(
    path.join(__dirname, "..", "src/lib/profileUtils.js"),
  ).href;
  return import(url);
}

test("safeAvatarUrl rejects non-string inputs", async () => {
  const { safeAvatarUrl } = await loadProfileUtils();

  assert.equal(safeAvatarUrl(null), "");
  assert.equal(safeAvatarUrl(undefined), "");
  assert.equal(safeAvatarUrl(123), "");
  assert.equal(safeAvatarUrl({}), "");
  assert.equal(safeAvatarUrl([]), "");
});

test("safeAvatarUrl rejects data URIs", async () => {
  const { safeAvatarUrl } = await loadProfileUtils();

  assert.equal(safeAvatarUrl("data:image/png;base64,abc123"), "");
  assert.equal(safeAvatarUrl("data:text/html,<script>alert(1)</script>"), "");
});

test("safeAvatarUrl rejects oversized URLs", async () => {
  const { safeAvatarUrl } = await loadProfileUtils();
  const longUrl = "https://example.com/" + "a".repeat(600);

  assert.equal(safeAvatarUrl(longUrl), "");
});

test("safeAvatarUrl accepts valid https URLs within length limit", async () => {
  const { safeAvatarUrl } = await loadProfileUtils();

  assert.equal(
    safeAvatarUrl("https://example.com/avatar.png"),
    "https://example.com/avatar.png",
  );
  assert.equal(
    safeAvatarUrl("https://avatars.githubusercontent.com/u/1234"),
    "https://avatars.githubusercontent.com/u/1234",
  );
});

test("safeExternalUrl rejects non-string inputs", async () => {
  const { safeExternalUrl } = await loadProfileUtils();

  assert.equal(safeExternalUrl(null), "");
  assert.equal(safeExternalUrl(undefined), "");
  assert.equal(safeExternalUrl(123), "");
  assert.equal(safeExternalUrl({}), "");
});

test("safeExternalUrl rejects oversized URLs", async () => {
  const { safeExternalUrl } = await loadProfileUtils();
  const longUrl = "https://example.com/" + "a".repeat(600);

  assert.equal(safeExternalUrl(longUrl), "");
});

test("safeExternalUrl accepts valid http and https URLs", async () => {
  const { safeExternalUrl } = await loadProfileUtils();

  assert.equal(
    safeExternalUrl("https://github.com/user"),
    "https://github.com/user",
  );
  // new URL normalizes localhost:3000 → localhost:3000/
  assert.equal(safeExternalUrl("http://localhost:3000"), "http://localhost:3000/");
  assert.equal(
    safeExternalUrl("https://linkedin.com/in/user"),
    "https://linkedin.com/in/user",
  );
});

test("safeExternalUrl rejects non-http protocols", async () => {
  const { safeExternalUrl } = await loadProfileUtils();

  assert.equal(safeExternalUrl("javascript:alert(1)"), "");
  assert.equal(safeExternalUrl("ftp://example.com"), "");
  assert.equal(safeExternalUrl("file:///etc/passwd"), "");
});

test("safeExternalUrl rejects invalid URL strings", async () => {
  const { safeExternalUrl } = await loadProfileUtils();

  assert.equal(safeExternalUrl("not-a-url"), "");
  assert.equal(safeExternalUrl("github.com/user"), "");
  assert.equal(safeExternalUrl(""), "");
});

test("sanitizeProfileLinks returns error for invalid profile URLs", async () => {
  const { sanitizeProfileLinks } = await loadProfileUtils();

  const result = sanitizeProfileLinks({
    resume_link: "not-a-url",
    github_profile: "",
    linkedin_profile: "",
  });

  assert.ok(result.error);
  assert.equal(
    result.error,
    "Please enter valid http or https URLs for profile links.",
  );
});

test("sanitizeProfileLinks accepts valid https profile URLs", async () => {
  const { sanitizeProfileLinks } = await loadProfileUtils();

  const result = sanitizeProfileLinks({
    resume_link: "https://example.com/resume.pdf",
    github_profile: "https://github.com/user",
    linkedin_profile: "https://linkedin.com/in/user",
  });

  assert.equal(result.data.resume_link, "https://example.com/resume.pdf");
  assert.equal(result.data.github_profile, "https://github.com/user");
  assert.equal(result.data.linkedin_profile, "https://linkedin.com/in/user");
});

test("sanitizeProfileLinks trims whitespace from values", async () => {
  const { sanitizeProfileLinks } = await loadProfileUtils();

  const result = sanitizeProfileLinks({
    resume_link: "  https://example.com/resume.pdf  ",
    github_profile: "  https://github.com/user  ",
    linkedin_profile: "",
  });

  assert.equal(result.data.resume_link, "https://example.com/resume.pdf");
  assert.equal(result.data.github_profile, "https://github.com/user");
});

test("sanitizeProfileLinks treats empty string as valid (clears field)", async () => {
  const { sanitizeProfileLinks } = await loadProfileUtils();

  const result = sanitizeProfileLinks({
    resume_link: "",
    github_profile: "",
    linkedin_profile: "",
  });

  assert.equal(result.data.resume_link, "");
  assert.equal(result.data.github_profile, "");
  assert.equal(result.data.linkedin_profile, "");
  assert.equal(result.error, undefined);
});

test("sanitizeProfileLinks returns error on first invalid field", async () => {
  const { sanitizeProfileLinks } = await loadProfileUtils();

  // resume_link is valid, github_profile is invalid
  const result = sanitizeProfileLinks({
    resume_link: "https://example.com/resume.pdf",
    github_profile: "javascript:alert(1)",
    linkedin_profile: "https://linkedin.com/in/user",
  });

  assert.ok(result.error);
});

test("buildFormDataFromUser extracts metadata correctly", async () => {
  const { buildFormDataFromUser } = await loadProfileUtils();

  const user = {
    user_metadata: {
      name: "Alice",
      branch: "CSE",
      college: "MIT",
      skills: "JavaScript, Python",
      github_profile: "https://github.com/alice",
      leetcode_username: "alice",
      leetcode_solved: 50,
      codeforces_rating: 1500,
      projects: [{ title: "My Project" }],
    },
  };

  const form = buildFormDataFromUser(user);

  assert.equal(form.name, "Alice");
  assert.equal(form.branch, "CSE");
  assert.equal(form.college, "MIT");
  assert.equal(form.skills, "JavaScript, Python");
  assert.equal(form.github_profile, "https://github.com/alice");
  assert.equal(form.leetcode_username, "alice");
  assert.equal(form.leetcode_solved, 50);
  assert.equal(form.codeforces_rating, 1500);
  assert.deepEqual(form.projects, [{ title: "My Project" }]);
});

test("buildFormDataFromUser handles missing metadata gracefully", async () => {
  const { buildFormDataFromUser } = await loadProfileUtils();

  const form = buildFormDataFromUser({});

  assert.equal(form.name, "");
  assert.equal(form.branch, "");
  assert.equal(form.college, "");
  assert.equal(form.skills, "");
  assert.equal(form.github_profile, "");
  assert.equal(form.leetcode_username, "");
  assert.equal(form.leetcode_solved, 0);
  assert.deepEqual(form.projects, []);
});

test("buildFormDataFromUser handles null user", async () => {
  const { buildFormDataFromUser } = await loadProfileUtils();

  const form = buildFormDataFromUser(null);

  assert.equal(form.name, "");
  assert.equal(form.leetcode_solved, 0);
});

test("normalizeProfilePayload converts numeric fields", async () => {
  const { normalizeProfilePayload } = await loadProfileUtils();

  const result = normalizeProfilePayload({
    leetcode_solved: "42",
    codeforces_rating: 1600,
    codechef_stars: "3",
    github_contributions: null,
    projects: [{ title: "test" }],
  });

  assert.equal(result.leetcode_solved, 42);
  assert.equal(result.codeforces_rating, 1600);
  assert.equal(result.codechef_stars, 3);
  assert.equal(result.github_contributions, 0);
  assert.deepEqual(result.projects, [{ title: "test" }]);
});

test("normalizeProfilePayload handles non-array projects", async () => {
  const { normalizeProfilePayload } = await loadProfileUtils();

  const result = normalizeProfilePayload({ projects: "not an array" });

  assert.deepEqual(result.projects, []);
});

test("validateProfileForm returns null for edit mode", async () => {
  const { validateProfileForm } = await loadProfileUtils();

  assert.equal(validateProfileForm({}, "edit"), null);
  assert.equal(
    validateProfileForm({ name: "", skills: "" }, "edit"),
    null,
  );
});

test("validateProfileForm returns error for missing name in onboarding", async () => {
  const { validateProfileForm } = await loadProfileUtils();

  assert.equal(
    validateProfileForm({ name: "", skills: "js" }, "onboarding"),
    "Full name is required.",
  );
});

test("validateProfileForm returns error for missing skills in onboarding", async () => {
  const { validateProfileForm } = await loadProfileUtils();

  assert.equal(
    validateProfileForm({ name: "Alice", skills: "" }, "onboarding"),
    "Bio is required.",
  );
});

test("validateProfileForm returns null when all required fields present in onboarding", async () => {
  const { validateProfileForm } = await loadProfileUtils();

  assert.equal(
    validateProfileForm({ name: "Alice", skills: "JS" }, "onboarding"),
    null,
  );
});

test("isOnboardingStep1Valid returns true when all required fields are non-empty", async () => {
  const { isOnboardingStep1Valid } = await loadProfileUtils();

  assert.equal(
    isOnboardingStep1Valid({ name: "Alice", skills: "JS" }),
    true,
  );
});

test("isOnboardingStep1Valid returns false when name is empty", async () => {
  const { isOnboardingStep1Valid } = await loadProfileUtils();

  assert.equal(isOnboardingStep1Valid({ name: "", skills: "JS" }), false);
});

test("isOnboardingStep1Valid returns false when skills is empty", async () => {
  const { isOnboardingStep1Valid } = await loadProfileUtils();

  assert.equal(isOnboardingStep1Valid({ name: "Alice", skills: "" }), false);
});

test("isOnboardingStep1Valid returns false when both fields are empty", async () => {
  const { isOnboardingStep1Valid } = await loadProfileUtils();

  assert.equal(isOnboardingStep1Valid({ name: "  ", skills: "   " }), false);
});

test("shouldShowProfileSetup returns true when hasSeenProfileSetup is false", async () => {
  const { shouldShowProfileSetup } = await loadProfileUtils();

  assert.equal(
    shouldShowProfileSetup({
      user_metadata: { hasSeenProfileSetup: false },
    }),
    true,
  );
});

test("shouldShowProfileSetup returns false when hasSeenProfileSetup is true", async () => {
  const { shouldShowProfileSetup } = await loadProfileUtils();

  assert.equal(
    shouldShowProfileSetup({
      user_metadata: { hasSeenProfileSetup: true },
    }),
    false,
  );
});

test("shouldShowProfileSetup returns false for null user", async () => {
  const { shouldShowProfileSetup } = await loadProfileUtils();

  assert.equal(shouldShowProfileSetup(null), false);
});

test("AVATAR_BUCKET and MAX fields are exported", async () => {
  const mod = await loadProfileUtils();

  assert.equal(typeof mod.AVATAR_BUCKET, "string");
  assert.equal(typeof mod.MAX_AVATAR_FILE_SIZE, "number");
  assert.equal(typeof mod.MAX_AVATAR_URL_LENGTH, "number");
  assert.equal(typeof mod.MAX_PROFILE_URL_LENGTH, "number");
  assert.equal(typeof mod.MAX_BIO_LENGTH, "number");
});

test("CODING_PLATFORMS, PRESET_PROJECT_GRADIENTS, EMPTY_PROFILE_FORM are exported", async () => {
  const mod = await loadProfileUtils();

  assert.ok(Array.isArray(mod.CODING_PLATFORMS));
  assert.ok(Array.isArray(mod.PRESET_PROJECT_GRADIENTS));
  assert.ok(typeof mod.EMPTY_PROFILE_FORM === "object");
});
