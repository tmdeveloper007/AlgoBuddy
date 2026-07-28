// security-tests/profileUtils.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/profileUtils.test.cjs
//
// Tests profile utility functions in src/lib/profileUtils.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// Inlined source — pure functions only, no DOM/network deps.
const MAX_AVATAR_URL_LENGTH = 512;
const MAX_PROFILE_URL_LENGTH = 512;
const MAX_BIO_LENGTH = 300;
const PROFILE_URL_FIELDS = ["resume_link", "github_profile", "linkedin_profile"];

const safeAvatarUrl = (value) => {
  if (typeof value !== "string") return "";
  if (value.startsWith("data:")) return "";
  if (value.length > MAX_AVATAR_URL_LENGTH) return "";
  return value;
};

const safeExternalUrl = (value) => {
  if (typeof value !== "string" || value.length > MAX_PROFILE_URL_LENGTH) return "";
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
};

const sanitizeProfileLinks = (data) => {
  const nextData = { ...data };
  for (const field of PROFILE_URL_FIELDS) {
    const rawValue = typeof nextData[field] === "string" ? nextData[field].trim() : nextData[field];
    if (!rawValue) {
      nextData[field] = "";
      continue;
    }
    const safeUrl = safeExternalUrl(rawValue);
    if (!safeUrl) {
      return { error: "Please enter valid http or https URLs for profile links." };
    }
    nextData[field] = safeUrl;
  }
  return { data: nextData };
};

const buildFormDataFromUser = (user) => {
  const meta = user?.user_metadata || {};
  return {
    name: meta.name || "",
    branch: meta.branch || "",
    college: meta.college || "",
    location: meta.location || meta.address || "",
    skills: (meta.skills || "").slice(0, MAX_BIO_LENGTH),
    resume_link: meta.resume_link || "",
    github_profile: meta.github_profile || "",
    linkedin_profile: meta.linkedin_profile || "",
    email_notifications: meta.email_notifications !== false,
    avatar_url: safeAvatarUrl(meta.avatar_url || meta.picture),
    leetcode_username: meta.leetcode_username || "",
    leetcode_solved: meta.leetcode_solved || 0,
    codeforces_username: meta.codeforces_username || "",
    codeforces_rating: meta.codeforces_rating || 0,
    codechef_username: meta.codechef_username || "",
    codechef_stars: meta.codechef_stars || 0,
    github_username: meta.github_username || "",
    github_contributions: meta.github_contributions || 0,
    projects: Array.isArray(meta.projects) ? meta.projects : [],
  };
};

const normalizeProfilePayload = (data) => ({
  ...data,
  leetcode_solved: Number(data.leetcode_solved) || 0,
  codeforces_rating: Number(data.codeforces_rating) || 0,
  codechef_stars: Number(data.codechef_stars) || 0,
  github_contributions: Number(data.github_contributions) || 0,
  projects: Array.isArray(data.projects) ? data.projects : [],
});

const ONBOARDING_REQUIRED_FIELDS = ["name", "skills"];

const validateProfileForm = (formData, mode = "edit") => {
  if (mode !== "onboarding") return null;
  for (const field of ONBOARDING_REQUIRED_FIELDS) {
    if (!formData[field]?.trim()) {
      return field === "name" ? "Full name is required." : "Bio is required.";
    }
  }
  return null;
};

const isOnboardingStep1Valid = (formData) =>
  ONBOARDING_REQUIRED_FIELDS.every((field) => Boolean(formData[field]?.trim()));

const shouldShowProfileSetup = (user) => {
  if (!user) return false;
  return user.user_metadata?.hasSeenProfileSetup !== true;
};

describe("safeAvatarUrl", () => {
  test("accepts valid https URL", () => {
    assert.equal(safeAvatarUrl("https://example.com/avatar.png"), "https://example.com/avatar.png");
  });

  test("rejects data: URL", () => {
    assert.equal(safeAvatarUrl("data:image/png;base64,abc123"), "");
  });

  test("rejects overly long URL", () => {
    const long = "https://example.com/" + "a".repeat(600);
    assert.equal(safeAvatarUrl(long), "");
  });

  test("returns empty string for non-string", () => {
    assert.equal(safeAvatarUrl(null), "");
    assert.equal(safeAvatarUrl(undefined), "");
    assert.equal(safeAvatarUrl(123), "");
  });
});

describe("safeExternalUrl", () => {
  test("accepts valid https URL", () => {
    assert.equal(safeExternalUrl("https://github.com/user"), "https://github.com/user");
  });

  test("accepts valid http URL", () => {
    // new URL() adds trailing slash if missing
    assert.equal(safeExternalUrl("http://example.com"), "http://example.com/");
  });

  test("rejects empty string", () => {
    // Empty string causes URL() to throw in some environments; handle gracefully
    try {
      new URL("");
    } catch {
      assert.equal(safeExternalUrl(""), "");
      return;
    }
    // If URL("") does not throw, it still fails our protocol check
    assert.equal(safeExternalUrl(""), "");
  });

  test("rejects javascript: URL", () => {
    assert.equal(safeExternalUrl("javascript:alert(1)"), "");
  });

  test("rejects data: URL", () => {
    assert.equal(safeExternalUrl("data:text/html,<script>"), "");
  });

  test("rejects file: URL", () => {
    assert.equal(safeExternalUrl("file:///etc/passwd"), "");
  });

  test("rejects malformed URL", () => {
    assert.equal(safeExternalUrl("not-a-url"), "");
    assert.equal(safeExternalUrl(""), "");
  });

  test("rejects overly long URL", () => {
    const long = "https://example.com/" + "a".repeat(600);
    assert.equal(safeExternalUrl(long), "");
  });

  test("returns empty string for non-string", () => {
    assert.equal(safeExternalUrl(null), "");
    assert.equal(safeExternalUrl(undefined), "");
  });
});

describe("sanitizeProfileLinks", () => {
  test("passes valid URLs through", () => {
    const result = sanitizeProfileLinks({
      resume_link: "https://example.com/resume.pdf",
      github_profile: "https://github.com/user",
      linkedin_profile: "https://linkedin.com/in/user",
    });
    assert.equal(result.data.resume_link, "https://example.com/resume.pdf");
    assert.equal(result.data.github_profile, "https://github.com/user");
    assert.equal(result.error, undefined);
  });

  test("clears empty fields", () => {
    const result = sanitizeProfileLinks({ github_profile: "", linkedin_profile: "  " });
    assert.equal(result.data.github_profile, "");
    assert.equal(result.data.linkedin_profile, "");
  });

  test("returns error for invalid URL", () => {
    const result = sanitizeProfileLinks({
      github_profile: "not-a-url",
      resume_link: "",
      linkedin_profile: "",
    });
    assert.ok(result.error);
    assert.ok(result.error.includes("valid http or https URLs"));
  });

  test("returns error for javascript: URL", () => {
    const result = sanitizeProfileLinks({
      resume_link: "javascript:alert(1)",
      github_profile: "",
      linkedin_profile: "",
    });
    assert.ok(result.error);
  });
});

describe("buildFormDataFromUser", () => {
  test("maps user_metadata fields correctly", () => {
    const user = {
      user_metadata: {
        name: "Alice",
        branch: "CSE",
        college: "MIT",
        skills: "JavaScript, Python",
        github_profile: "https://github.com/alice",
        avatar_url: "https://example.com/alice.png",
        leetcode_username: "alice",
        leetcode_solved: 150,
      },
    };
    const form = buildFormDataFromUser(user);
    assert.equal(form.name, "Alice");
    assert.equal(form.branch, "CSE");
    assert.equal(form.github_profile, "https://github.com/alice");
    assert.equal(form.leetcode_username, "alice");
    assert.equal(form.leetcode_solved, 150);
    assert.equal(form.email_notifications, true);
  });

  test("returns empty strings for missing metadata", () => {
    const form = buildFormDataFromUser({});
    assert.equal(form.name, "");
    assert.equal(form.branch, "");
    assert.equal(form.skills, "");
  });

  test("falls back avatar_url to picture", () => {
    const user = { user_metadata: { picture: "https://example.com/pic.png" } };
    assert.equal(buildFormDataFromUser(user).avatar_url, "https://example.com/pic.png");
  });

  test("sanitizes avatar_url with data: prefix", () => {
    const user = { user_metadata: { avatar_url: "data:text/html,<script>alert(1)</script>" } };
    assert.equal(buildFormDataFromUser(user).avatar_url, "");
  });

  test("handles null user", () => {
    const form = buildFormDataFromUser(null);
    assert.equal(form.name, "");
  });

  test("truncates skills to MAX_BIO_LENGTH", () => {
    const longSkills = "a".repeat(400);
    const user = { user_metadata: { skills: longSkills } };
    assert.equal(buildFormDataFromUser(user).skills.length, MAX_BIO_LENGTH);
  });
});

describe("normalizeProfilePayload", () => {
  test("converts numeric strings to numbers", () => {
    const result = normalizeProfilePayload({ leetcode_solved: "100", codeforces_rating: "1500" });
    assert.equal(result.leetcode_solved, 100);
    assert.equal(result.codeforces_rating, 1500);
  });

  test("converts NaN and invalid to 0", () => {
    const result = normalizeProfilePayload({ leetcode_solved: "abc", codeforces_rating: "" });
    assert.equal(result.leetcode_solved, 0);
    assert.equal(result.codeforces_rating, 0);
  });

  test("preserves projects array", () => {
    const projects = [{ title: "My Project" }];
    const result = normalizeProfilePayload({ projects });
    assert.deepStrictEqual(result.projects, projects);
  });

  test("defaults projects to empty array", () => {
    const result = normalizeProfilePayload({ projects: null });
    assert.deepStrictEqual(result.projects, []);
  });
});

describe("validateProfileForm", () => {
  test("returns null for edit mode", () => {
    assert.equal(validateProfileForm({ name: "" }), null);
  });

  test("returns null for onboarding with valid fields", () => {
    assert.equal(validateProfileForm({ name: "Alice", skills: "Python" }, "onboarding"), null);
  });

  test("returns error for missing name in onboarding", () => {
    assert.equal(validateProfileForm({ name: "", skills: "Python" }, "onboarding"), "Full name is required.");
  });

  test("returns error for missing skills in onboarding", () => {
    assert.equal(validateProfileForm({ name: "Alice", skills: "  " }, "onboarding"), "Bio is required.");
  });
});

describe("isOnboardingStep1Valid", () => {
  test("returns true when both required fields are non-empty", () => {
    assert.equal(isOnboardingStep1Valid({ name: "Alice", skills: "Python" }), true);
  });

  test("returns false when name is missing", () => {
    assert.equal(isOnboardingStep1Valid({ name: "", skills: "Python" }), false);
  });

  test("returns false when skills is missing", () => {
    assert.equal(isOnboardingStep1Valid({ name: "Alice", skills: "" }), false);
  });

  test("returns false for whitespace-only fields", () => {
    assert.equal(isOnboardingStep1Valid({ name: "  ", skills: "Python" }), false);
  });
});

describe("shouldShowProfileSetup", () => {
  test("returns false when user is null", () => {
    assert.equal(shouldShowProfileSetup(null), false);
  });

  test("returns false when user has seen profile setup", () => {
    assert.equal(shouldShowProfileSetup({ user_metadata: { hasSeenProfileSetup: true } }), false);
  });

  test("returns true when hasSeenProfileSetup is false", () => {
    assert.equal(shouldShowProfileSetup({ user_metadata: { hasSeenProfileSetup: false } }), true);
  });

  test("returns true when hasSeenProfileSetup is undefined", () => {
    assert.equal(shouldShowProfileSetup({ user_metadata: {} }), true);
  });
});
