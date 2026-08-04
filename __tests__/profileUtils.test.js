// __tests__/profileUtils.test.js
//
// Run with:  npx jest __tests__/profileUtils.test.js
//
// Tests the profile utility functions in src/lib/profileUtils.js.

const { describe, expect, test } = require("@jest/globals");
const {
  AVATAR_BUCKET,
  MAX_AVATAR_FILE_SIZE,
  MAX_AVATAR_URL_LENGTH,
  MAX_PROFILE_URL_LENGTH,
  MAX_BIO_LENGTH,
  PROFILE_URL_FIELDS,
  PRESET_PROJECT_GRADIENTS,
  EMPTY_PROJECT,
  CODING_PLATFORMS,
  ONBOARDING_OPTIONAL_FIELDS,
  ONBOARDING_REQUIRED_FIELDS,
  EMPTY_PROFILE_FORM,
  safeAvatarUrl,
  safeExternalUrl,
  sanitizeProfileLinks,
  buildFormDataFromUser,
  normalizeProfilePayload,
  validateProfileForm,
  isOnboardingStep1Valid,
  shouldShowProfileSetup,
} = require("../src/lib/profileUtils.js");

// ── Constants ────────────────────────────────────────────────────────────────

describe("profileUtils constants", () => {
  test("AVATAR_BUCKET is 'avatars'", () => {
    expect(AVATAR_BUCKET).toBe("avatars");
  });

  test("MAX_AVATAR_FILE_SIZE is 2MB", () => {
    expect(MAX_AVATAR_FILE_SIZE).toBe(2 * 1024 * 1024);
  });

  test("MAX_AVATAR_URL_LENGTH and MAX_PROFILE_URL_LENGTH are positive", () => {
    expect(MAX_AVATAR_URL_LENGTH).toBeGreaterThan(0);
    expect(MAX_PROFILE_URL_LENGTH).toBeGreaterThan(0);
  });

  test("MAX_BIO_LENGTH is a reasonable limit", () => {
    expect(MAX_BIO_LENGTH).toBe(300);
  });

  test("PROFILE_URL_FIELDS contains expected fields", () => {
    expect(PROFILE_URL_FIELDS).toContain("resume_link");
    expect(PROFILE_URL_FIELDS).toContain("github_profile");
    expect(PROFILE_URL_FIELDS).toContain("linkedin_profile");
  });

  test("PRESET_PROJECT_GRADIENTS has at least one entry", () => {
    expect(PRESET_PROJECT_GRADIENTS.length).toBeGreaterThan(0);
  });

  test("EMPTY_PROJECT has required keys", () => {
    expect(EMPTY_PROJECT).toHaveProperty("title");
    expect(EMPTY_PROJECT).toHaveProperty("subtitle");
    expect(EMPTY_PROJECT).toHaveProperty("tags");
    expect(EMPTY_PROJECT).toHaveProperty("url");
    expect(EMPTY_PROJECT).toHaveProperty("preview");
  });

  test("CODING_PLATFORMS is a non-empty array", () => {
    expect(Array.isArray(CODING_PLATFORMS)).toBe(true);
    expect(CODING_PLATFORMS.length).toBeGreaterThan(0);
  });

  test("ONBOARDING_REQUIRED_FIELDS includes 'name' and 'skills'", () => {
    expect(ONBOARDING_REQUIRED_FIELDS).toContain("name");
    expect(ONBOARDING_REQUIRED_FIELDS).toContain("skills");
  });

  test("EMPTY_PROFILE_FORM has all required fields", () => {
    expect(EMPTY_PROFILE_FORM).toHaveProperty("name");
    expect(EMPTY_PROFILE_FORM).toHaveProperty("skills");
    expect(EMPTY_PROFILE_FORM).toHaveProperty("email_notifications");
    expect(EMPTY_PROFILE_FORM).toHaveProperty("avatar_url");
    expect(EMPTY_PROFILE_FORM).toHaveProperty("projects");
  });
});

// ── safeAvatarUrl ────────────────────────────────────────────────────────────

describe("safeAvatarUrl", () => {
  test("returns a valid URL unchanged", () => {
    expect(safeAvatarUrl("https://example.com/avatar.png")).toBe("https://example.com/avatar.png");
  });

  test("returns empty string for non-string input", () => {
    expect(safeAvatarUrl(null)).toBe("");
    expect(safeAvatarUrl(undefined)).toBe("");
    expect(safeAvatarUrl(123)).toBe("");
    expect(safeAvatarUrl({})).toBe("");
  });

  test("returns empty string for data URL", () => {
    expect(safeAvatarUrl("data:image/png;base64,abc123")).toBe("");
    expect(safeAvatarUrl("data:text/html,<script>")).toBe("");
  });

  test("returns empty string for overly long URL", () => {
    const longUrl = "https://example.com/" + "x".repeat(MAX_AVATAR_URL_LENGTH);
    expect(safeAvatarUrl(longUrl)).toBe("");
  });

  test("returns trimmed URL within length limit", () => {
    const shortUrl = "https://example.com/avatar.png";
    expect(safeAvatarUrl(shortUrl)).toBe(shortUrl);
  });
});

// ── safeExternalUrl ────────────────────────────────────────────────────────

describe("safeExternalUrl", () => {
  test("returns valid http URL unchanged", () => {
    expect(safeExternalUrl("http://example.com/page")).toBe("http://example.com/page");
  });

  test("returns valid https URL unchanged", () => {
    expect(safeExternalUrl("https://github.com/user")).toBe("https://github.com/user");
  });

  test("returns empty string for non-string input", () => {
    expect(safeExternalUrl(null)).toBe("");
    expect(safeExternalUrl(undefined)).toBe("");
    expect(safeExternalUrl(123)).toBe("");
  });

  test("returns empty string for file:// URLs", () => {
    expect(safeExternalUrl("file:///etc/passwd")).toBe("");
  });

  test("returns empty string for javascript: URLs", () => {
    expect(safeExternalUrl("javascript:alert(1)")).toBe("");
  });

  test("returns empty string for ftp:// URLs", () => {
    expect(safeExternalUrl("ftp://files.example.com")).toBe("");
  });

  test("returns empty string for overly long URL", () => {
    const longUrl = "https://example.com/" + "x".repeat(MAX_PROFILE_URL_LENGTH);
    expect(safeExternalUrl(longUrl)).toBe("");
  });

  test("returns empty string for invalid URL", () => {
    expect(safeExternalUrl("not-a-url")).toBe("");
    expect(safeExternalUrl("just some text")).toBe("");
  });
});

// ── sanitizeProfileLinks ────────────────────────────────────────────────────

describe("sanitizeProfileLinks", () => {
  test("passes through valid URLs and trims whitespace", () => {
    const result = sanitizeProfileLinks({
      resume_link: "  https://example.com/resume  ",
      github_profile: "https://github.com/user",
      linkedin_profile: "https://linkedin.com/in/user",
    });
    expect(result.data).toBeDefined();
    expect(result.data.resume_link).toBe("https://example.com/resume");
  });

  test("sets empty string for missing fields", () => {
    const result = sanitizeProfileLinks({});
    expect(result.data).toBeDefined();
    expect(result.data.resume_link).toBe("");
    expect(result.data.github_profile).toBe("");
  });

  test("returns error object for invalid URL", () => {
    const result = sanitizeProfileLinks({
      resume_link: "not-a-url",
      github_profile: "",
      linkedin_profile: "",
    });
    expect(result.error).toBeDefined();
    expect(result.error).toContain("valid http or https URLs");
  });

  test("returns error for javascript: URL", () => {
    const result = sanitizeProfileLinks({
      resume_link: "javascript:alert(1)",
      github_profile: "",
      linkedin_profile: "",
    });
    expect(result.error).toBeDefined();
  });
});

// ── buildFormDataFromUser ───────────────────────────────────────────────────

describe("buildFormDataFromUser", () => {
  test("returns empty form for null user", () => {
    const form = buildFormDataFromUser(null);
    expect(form.name).toBe("");
  });

  test("returns empty form for user with no metadata", () => {
    const form = buildFormDataFromUser({});
    expect(form.name).toBe("");
  });

  test("extracts metadata fields correctly", () => {
    const user = {
      user_metadata: {
        name: "Alice",
        skills: "JavaScript, Python",
        leetcode_username: "alice",
        codeforces_rating: 1500,
      },
    };
    const form = buildFormDataFromUser(user);
    expect(form.name).toBe("Alice");
    expect(form.skills).toBe("JavaScript, Python");
    expect(form.leetcode_username).toBe("alice");
    expect(form.codeforces_rating).toBe(1500);
  });

  test("limits skills to MAX_BIO_LENGTH", () => {
    const longSkills = "a".repeat(MAX_BIO_LENGTH + 100);
    const user = { user_metadata: { skills: longSkills } };
    const form = buildFormDataFromUser(user);
    expect(form.skills.length).toBeLessThanOrEqual(MAX_BIO_LENGTH);
  });

  test("uses picture as avatar_url fallback", () => {
    const user = { user_metadata: { picture: "https://example.com/pic.png" } };
    const form = buildFormDataFromUser(user);
    expect(form.avatar_url).toBe("https://example.com/pic.png");
  });

  test("defaults projects to empty array if not an array", () => {
    const user = { user_metadata: { projects: "not-an-array" } };
    const form = buildFormDataFromUser(user);
    expect(Array.isArray(form.projects)).toBe(true);
    expect(form.projects.length).toBe(0);
  });
});

// ── normalizeProfilePayload ─────────────────────────────────────────────────

describe("normalizeProfilePayload", () => {
  test("converts numeric strings to numbers", () => {
    const data = {
      leetcode_solved: "42",
      codeforces_rating: "1500",
      codechef_stars: "3",
      github_contributions: "100",
    };
    const normalized = normalizeProfilePayload(data);
    expect(normalized.leetcode_solved).toBe(42);
    expect(normalized.codeforces_rating).toBe(1500);
    expect(normalized.codechef_stars).toBe(3);
    expect(normalized.github_contributions).toBe(100);
  });

  test("converts non-numeric strings to 0", () => {
    const data = { leetcode_solved: "abc", codeforces_rating: "" };
    const normalized = normalizeProfilePayload(data);
    expect(normalized.leetcode_solved).toBe(0);
    expect(normalized.codeforces_rating).toBe(0);
  });

  test("preserves non-numeric fields", () => {
    const data = { name: "Alice", skills: "JS" };
    const normalized = normalizeProfilePayload(data);
    expect(normalized.name).toBe("Alice");
    expect(normalized.skills).toBe("JS");
  });

  test("ensures projects is always an array", () => {
    const normalized1 = normalizeProfilePayload({ projects: null });
    const normalized2 = normalizeProfilePayload({ projects: "not-array" });
    const normalized3 = normalizeProfilePayload({ projects: ["proj1"] });
    expect(Array.isArray(normalized1.projects)).toBe(true);
    expect(Array.isArray(normalized2.projects)).toBe(true);
    expect(Array.isArray(normalized3.projects)).toBe(true);
    expect(normalized3.projects).toEqual(["proj1"]);
  });
});

// ── validateProfileForm ─────────────────────────────────────────────────────

describe("validateProfileForm", () => {
  test("returns null for 'edit' mode regardless of content", () => {
    expect(validateProfileForm({}, "edit")).toBeNull();
    expect(validateProfileForm({ name: "", skills: "" }, "edit")).toBeNull();
  });

  test("returns null when required fields are present in onboarding", () => {
    const form = { name: "Alice", skills: "JavaScript" };
    expect(validateProfileForm(form, "onboarding")).toBeNull();
  });

  test("returns error message when name is missing in onboarding", () => {
    const form = { name: "", skills: "JavaScript" };
    expect(validateProfileForm(form, "onboarding")).toBe("Full name is required.");
  });

  test("returns error message when skills is missing in onboarding", () => {
    const form = { name: "Alice", skills: "" };
    expect(validateProfileForm(form, "onboarding")).toBe("Bio is required.");
  });

  test("trims whitespace before validation", () => {
    expect(validateProfileForm({ name: "   ", skills: "JS" }, "onboarding")).toBe("Full name is required.");
    expect(validateProfileForm({ name: "Alice", skills: "   " }, "onboarding")).toBe("Bio is required.");
  });
});

// ── isOnboardingStep1Valid ──────────────────────────────────────────────────

describe("isOnboardingStep1Valid", () => {
  test("returns false when required fields are missing", () => {
    expect(isOnboardingStep1Valid({})).toBe(false);
    expect(isOnboardingStep1Valid({ name: "", skills: "" })).toBe(false);
    expect(isOnboardingStep1Valid({ name: "Alice", skills: "" })).toBe(false);
    expect(isOnboardingStep1Valid({ name: "", skills: "JS" })).toBe(false);
  });

  test("returns true when all required fields are non-empty", () => {
    expect(isOnboardingStep1Valid({ name: "Alice", skills: "JavaScript" })).toBe(true);
  });

  test("returns false for whitespace-only values", () => {
    expect(isOnboardingStep1Valid({ name: "  ", skills: "JS" })).toBe(false);
  });
});

// ── shouldShowProfileSetup ──────────────────────────────────────────────────

describe("shouldShowProfileSetup", () => {
  test("returns false for null user", () => {
    expect(shouldShowProfileSetup(null)).toBe(false);
  });

  test("returns false for undefined user", () => {
    expect(shouldShowProfileSetup(undefined)).toBe(false);
  });

  test("returns true when hasSeenProfileSetup is not true", () => {
    expect(shouldShowProfileSetup({ user_metadata: {} })).toBe(true);
    expect(shouldShowProfileSetup({ user_metadata: { hasSeenProfileSetup: false } })).toBe(true);
  });

  test("returns false when hasSeenProfileSetup is true", () => {
    expect(shouldShowProfileSetup({ user_metadata: { hasSeenProfileSetup: true } })).toBe(false);
  });
});
