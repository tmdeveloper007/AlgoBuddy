// security-tests/profileUtils.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/profileUtils.test.cjs
//
// Tests for profile utility helpers in src/lib/profileUtils.js.

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

// ─── Inline source under test ─────────────────────────────────────────────────

const MAX_AVATAR_URL_LENGTH = 512;
const MAX_PROFILE_URL_LENGTH = 512;
const MAX_BIO_LENGTH = 300;
const PROFILE_URL_FIELDS = ["resume_link", "github_profile", "linkedin_profile"];

const PRESET_PROJECT_GRADIENTS = [
  "bg-[linear-gradient(135deg,#190f4f,#25116d_45%,#5338f2)]",
  "bg-[linear-gradient(135deg,#064e3b,#0f172a)]",
  "bg-[linear-gradient(135deg,#312e81,#111827)]",
  "bg-[linear-gradient(135deg,#7c2d12,#1c1917)]",
  "bg-[linear-gradient(135deg,#134e4a,#0f172a)]",
  "bg-[linear-gradient(135deg,#1e1b4b,#312e81)]",
];

const EMPTY_PROJECT = {
  title: "",
  subtitle: "",
  tags: "",
  url: "",
  preview: PRESET_PROJECT_GRADIENTS[0],
};

const CODING_PLATFORMS = [
  ["leetcode", "leetcode_username", "LeetCode Username", "leetcode_solved", "Solved"],
  ["codeforces", "codeforces_username", "Codeforces Handle", "codeforces_rating", "Rating"],
  ["codechef", "codechef_username", "CodeChef Username", "codechef_stars", "Stars"],
  ["github", "github_username", "GitHub Username", "github_contributions", "Contributions"],
];

const ONBOARDING_REQUIRED_FIELDS = ["name", "skills"];

const EMPTY_PROFILE_FORM = {
  name: "",
  branch: "",
  college: "",
  location: "",
  skills: "",
  resume_link: "",
  github_profile: "",
  linkedin_profile: "",
  email_notifications: true,
  avatar_url: "",
  leetcode_username: "",
  leetcode_solved: 0,
  codeforces_username: "",
  codeforces_rating: 0,
  codechef_username: "",
  codechef_stars: 0,
  github_username: "",
  github_contributions: 0,
  projects: [],
};

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
    const rawValue =
      typeof nextData[field] === "string" ? nextData[field].trim() : nextData[field];
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

const validateProfileForm = (formData, mode = "edit") => {
  if (mode !== "onboarding") return null;

  for (const field of ONBOARDING_REQUIRED_FIELDS) {
    if (!formData[field]?.trim()) {
      return field === "name"
        ? "Full name is required."
        : "Bio is required.";
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

// ─── safeAvatarUrl tests ──────────────────────────────────────────────────────

describe("safeAvatarUrl", () => {
  test("returns the URL when it is a normal https URL under length limit", () => {
    assert.strictEqual(
      safeAvatarUrl("https://example.com/avatar.png"),
      "https://example.com/avatar.png",
    );
  });

  test("returns empty string for data URI", () => {
    assert.strictEqual(
      safeAvatarUrl("data:image/png;base64,iVBORw0KGgo="),
      "",
    );
  });

  test("returns empty string for non-string input (null)", () => {
    assert.strictEqual(safeAvatarUrl(null), "");
  });

  test("returns empty string for non-string input (undefined)", () => {
    assert.strictEqual(safeAvatarUrl(undefined), "");
  });

  test("returns empty string for non-string input (number)", () => {
    assert.strictEqual(safeAvatarUrl(12345), "");
  });

  test("returns empty string for URL exceeding MAX_AVATAR_URL_LENGTH", () => {
    const longUrl = "https://example.com/" + "x".repeat(MAX_AVATAR_URL_LENGTH);
    assert.strictEqual(safeAvatarUrl(longUrl), "");
  });

  test("accepts URL at exactly MAX_AVATAR_URL_LENGTH", () => {
    const exactUrl = "https://example.com/" + "x".repeat(MAX_AVATAR_URL_LENGTH - 26);
    assert.strictEqual(safeAvatarUrl(exactUrl), exactUrl);
  });

  test("returns empty string for object input", () => {
    assert.strictEqual(safeAvatarUrl({}), "");
  });
});

// ─── safeExternalUrl tests ─────────────────────────────────────────────────────

describe("safeExternalUrl", () => {
  test("returns URL string for valid https URL", () => {
    const result = safeExternalUrl("https://github.com/user/repo");
    assert.strictEqual(result, "https://github.com/user/repo");
  });

  test("returns URL string for valid http URL", () => {
    const result = safeExternalUrl("http://example.com");
    // URL constructor normalizes to include trailing slash
    assert.strictEqual(result, "http://example.com/");
  });

  test("returns empty string for ftp URL", () => {
    assert.strictEqual(safeExternalUrl("ftp://files.com"), "");
  });

  test("returns empty string for mailto URL", () => {
    assert.strictEqual(safeExternalUrl("mailto:test@example.com"), "");
  });

  test("returns empty string for data URI", () => {
    assert.strictEqual(safeExternalUrl("data:text/html,<script>alert(1)</script>"), "");
  });

  test("returns empty string for plain hostname (no scheme)", () => {
    assert.strictEqual(safeExternalUrl("example.com/path"), "");
  });

  test("returns empty string for empty string", () => {
    assert.strictEqual(safeExternalUrl(""), "");
  });

  test("returns empty string for null input", () => {
    assert.strictEqual(safeExternalUrl(null), "");
  });

  test("returns empty string for undefined input", () => {
    assert.strictEqual(safeExternalUrl(undefined), "");
  });

  test("returns empty string for URL exceeding MAX_PROFILE_URL_LENGTH", () => {
    const long = "https://example.com/" + "x".repeat(MAX_PROFILE_URL_LENGTH);
    assert.strictEqual(safeExternalUrl(long), "");
  });

  test("returns empty string for integer input", () => {
    assert.strictEqual(safeExternalUrl(12345), "");
  });

  test("normalizes URL (removes trailing slash)", () => {
    // new URL does not remove trailing slash, but toString() preserves it.
    const result = safeExternalUrl("https://example.com/");
    assert.strictEqual(result, "https://example.com/");
  });
});

// ─── sanitizeProfileLinks tests ───────────────────────────────────────────────

describe("sanitizeProfileLinks", () => {
  test("returns data with empty strings when all fields are empty", () => {
    const result = sanitizeProfileLinks({
      resume_link: "",
      github_profile: "",
      linkedin_profile: "",
    });
    assert.strictEqual(result.error, undefined);
    assert.deepStrictEqual(result.data.resume_link, "");
  });

  test("returns data with sanitized URLs for all three valid fields", () => {
    const result = sanitizeProfileLinks({
      resume_link: "  https://example.com/resume  ",
      github_profile: " https://github.com/user ",
      linkedin_profile: " http://linkedin.com/in/user ",
    });
    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.data.resume_link, "https://example.com/resume");
    assert.strictEqual(result.data.github_profile, "https://github.com/user");
    assert.strictEqual(result.data.linkedin_profile, "http://linkedin.com/in/user");
  });

  test("returns error when resume_link is an invalid URL", () => {
    const result = sanitizeProfileLinks({
      resume_link: "not-a-url",
      github_profile: "",
      linkedin_profile: "",
    });
    assert.strictEqual(
      result.error,
      "Please enter valid http or https URLs for profile links.",
    );
  });

  test("returns error when github_profile is ftp URL", () => {
    const result = sanitizeProfileLinks({
      resume_link: "",
      github_profile: "ftp://github.com/user",
      linkedin_profile: "",
    });
    assert.strictEqual(result.error,
      "Please enter valid http or https URLs for profile links.",
    );
  });

  test("trims whitespace before validating", () => {
    const result = sanitizeProfileLinks({
      resume_link: "   https://example.com/resume   ",
      github_profile: "",
      linkedin_profile: "",
    });
    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.data.resume_link, "https://example.com/resume");
  });

  test("returns error for missing fields treated as empty string (no error)", () => {
    const result = sanitizeProfileLinks({});
    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.data.resume_link, "");
  });
});

// ─── buildFormDataFromUser tests ──────────────────────────────────────────────

describe("buildFormDataFromUser", () => {
  test("returns all defaults when user is null", () => {
    const result = buildFormDataFromUser(null);
    assert.strictEqual(result.name, "");
    assert.strictEqual(result.avatar_url, "");
    assert.deepStrictEqual(result.projects, []);
  });

  test("returns all defaults when user_metadata is absent", () => {
    const result = buildFormDataFromUser({});
    assert.strictEqual(result.name, "");
  });

  test("extracts basic fields from user_metadata", () => {
    const user = {
      user_metadata: {
        name: "Alice",
        branch: "CSE",
        college: "MIT",
        location: "Boston",
        skills: "JS, Python",
      },
    };
    const result = buildFormDataFromUser(user);
    assert.strictEqual(result.name, "Alice");
    assert.strictEqual(result.branch, "CSE");
    assert.strictEqual(result.college, "MIT");
    assert.strictEqual(result.location, "Boston");
    assert.strictEqual(result.skills, "JS, Python");
  });

  test("prefers location over address when both are present", () => {
    const user = {
      user_metadata: { location: "NYC", address: "OldAddr" },
    };
    assert.strictEqual(buildFormDataFromUser(user).location, "NYC");
  });

  test("uses address when location is absent", () => {
    const user = {
      user_metadata: { address: "FallbackAddr" },
    };
    assert.strictEqual(buildFormDataFromUser(user).location, "FallbackAddr");
  });

  test("truncates skills to MAX_BIO_LENGTH", () => {
    const longSkills = "a".repeat(MAX_BIO_LENGTH + 50);
    const user = { user_metadata: { skills: longSkills } };
    assert.strictEqual(
      buildFormDataFromUser(user).skills.length,
      MAX_BIO_LENGTH,
    );
  });

  test("uses avatar_url from metadata for avatar_url field", () => {
    const user = { user_metadata: { avatar_url: "https://cdn.example.com/pic.png" } };
    assert.strictEqual(buildFormDataFromUser(user).avatar_url, "https://cdn.example.com/pic.png");
  });

  test("falls back to picture for avatar_url when avatar_url absent", () => {
    const user = { user_metadata: { picture: "https://cdn.example.com/photo.jpg" } };
    assert.strictEqual(buildFormDataFromUser(user).avatar_url, "https://cdn.example.com/photo.jpg");
  });

  test("blocks data: URI avatars", () => {
    const user = { user_metadata: { avatar_url: "data:image/png;base64,xyz" } };
    assert.strictEqual(buildFormDataFromUser(user).avatar_url, "");
  });

  test("extracts coding platform stats", () => {
    const user = {
      user_metadata: {
        leetcode_username: "alice",
        leetcode_solved: 150,
        codeforces_username: "alice_cf",
        codeforces_rating: 1850,
      },
    };
    const result = buildFormDataFromUser(user);
    assert.strictEqual(result.leetcode_username, "alice");
    assert.strictEqual(result.leetcode_solved, 150);
    assert.strictEqual(result.codeforces_username, "alice_cf");
    assert.strictEqual(result.codeforces_rating, 1850);
  });

  test("defaults coding stats to 0 when absent", () => {
    const user = { user_metadata: { leetcode_username: "alice" } };
    const result = buildFormDataFromUser(user);
    assert.strictEqual(result.leetcode_solved, 0);
    assert.strictEqual(result.codeforces_rating, 0);
    assert.strictEqual(result.codechef_stars, 0);
  });

  test("extracts projects array", () => {
    const projects = [{ title: "My App", url: "https://example.com" }];
    const user = { user_metadata: { projects } };
    assert.deepStrictEqual(buildFormDataFromUser(user).projects, projects);
  });

  test("defaults projects to empty array when not an array", () => {
    const user = { user_metadata: { projects: "not-an-array" } };
    assert.deepStrictEqual(buildFormDataFromUser(user).projects, []);
  });

  test("email_notifications defaults to true when undefined", () => {
    const user = { user_metadata: {} };
    assert.strictEqual(buildFormDataFromUser(user).email_notifications, true);
  });

  test("email_notifications false when explicitly set to false", () => {
    const user = { user_metadata: { email_notifications: false } };
    assert.strictEqual(buildFormDataFromUser(user).email_notifications, false);
  });
});

// ─── normalizeProfilePayload tests ────────────────────────────────────────────

describe("normalizeProfilePayload", () => {
  test("coerces string numbers to actual numbers", () => {
    const result = normalizeProfilePayload({
      leetcode_solved: "150",
      codeforces_rating: "1850",
      codechef_stars: "4",
      github_contributions: "200",
    });
    assert.strictEqual(result.leetcode_solved, 150);
    assert.strictEqual(result.codeforces_rating, 1850);
    assert.strictEqual(result.codechef_stars, 4);
    assert.strictEqual(result.github_contributions, 200);
  });

  test("coerces NaN to 0", () => {
    const result = normalizeProfilePayload({
      leetcode_solved: "not-a-number",
      codeforces_rating: undefined,
    });
    assert.strictEqual(result.leetcode_solved, 0);
    assert.strictEqual(result.codeforces_rating, 0);
  });

  test("keeps numeric values unchanged", () => {
    const result = normalizeProfilePayload({
      leetcode_solved: 200,
      codeforces_rating: 2000,
    });
    assert.strictEqual(result.leetcode_solved, 200);
    assert.strictEqual(result.codeforces_rating, 2000);
  });

  test("normalizes projects to array", () => {
    const result = normalizeProfilePayload({ projects: "not-array" });
    assert.deepStrictEqual(result.projects, []);
  });

  test("keeps valid projects array unchanged", () => {
    const projects = [{ title: "test" }];
    const result = normalizeProfilePayload({ projects });
    assert.deepStrictEqual(result.projects, projects);
  });
});

// ─── validateProfileForm tests ────────────────────────────────────────────────

describe("validateProfileForm", () => {
  test("returns null in edit mode regardless of content", () => {
    assert.strictEqual(validateProfileForm({}, "edit"), null);
    assert.strictEqual(
      validateProfileForm({ name: "", skills: "" }, "edit"),
      null,
    );
  });

  test("returns null in onboarding when all required fields are filled", () => {
    const result = validateProfileForm(
      { name: "Alice", skills: "JS" },
      "onboarding",
    );
    assert.strictEqual(result, null);
  });

  test("returns 'Full name is required.' when name is missing in onboarding", () => {
    assert.strictEqual(
      validateProfileForm({ name: "", skills: "JS" }, "onboarding"),
      "Full name is required.",
    );
  });

  test("returns 'Full name is required.' when name is only whitespace", () => {
    assert.strictEqual(
      validateProfileForm({ name: "   ", skills: "JS" }, "onboarding"),
      "Full name is required.",
    );
  });

  test("returns 'Bio is required.' when skills is missing in onboarding", () => {
    assert.strictEqual(
      validateProfileForm({ name: "Alice", skills: "" }, "onboarding"),
      "Bio is required.",
    );
  });

  test("returns 'Bio is required.' when skills is only whitespace", () => {
    assert.strictEqual(
      validateProfileForm({ name: "Alice", skills: "   " }, "onboarding"),
      "Bio is required.",
    );
  });
});

// ─── isOnboardingStep1Valid tests ─────────────────────────────────────────────

describe("isOnboardingStep1Valid", () => {
  test("returns true when both required fields are non-empty", () => {
    assert.strictEqual(
      isOnboardingStep1Valid({ name: "Alice", skills: "JS" }),
      true,
    );
  });

  test("returns false when name is missing", () => {
    assert.strictEqual(isOnboardingStep1Valid({ name: "", skills: "JS" }), false);
  });

  test("returns false when skills is missing", () => {
    assert.strictEqual(isOnboardingStep1Valid({ name: "Alice", skills: "" }), false);
  });

  test("returns false when both are missing", () => {
    assert.strictEqual(isOnboardingStep1Valid({}), false);
  });

  test("returns false when name is only whitespace", () => {
    assert.strictEqual(isOnboardingStep1Valid({ name: "  ", skills: "JS" }), false);
  });
});

// ─── shouldShowProfileSetup tests ─────────────────────────────────────────────

describe("shouldShowProfileSetup", () => {
  test("returns false when user is null", () => {
    assert.strictEqual(shouldShowProfileSetup(null), false);
  });

  test("returns false when user is undefined", () => {
    assert.strictEqual(shouldShowProfileSetup(undefined), false);
  });

  test("returns true when user_metadata is absent (shows setup by default)", () => {
    // hasSeenProfileSetup is undefined !== true, so returns true
    assert.strictEqual(shouldShowProfileSetup({}), true);
  });

  test("returns false when hasSeenProfileSetup is true", () => {
    assert.strictEqual(
      shouldShowProfileSetup({
        user_metadata: { hasSeenProfileSetup: true },
      }),
      false,
    );
  });

  test("returns true when hasSeenProfileSetup is false", () => {
    assert.strictEqual(
      shouldShowProfileSetup({
        user_metadata: { hasSeenProfileSetup: false },
      }),
      true,
    );
  });

  test("returns true when hasSeenProfileSetup is undefined", () => {
    assert.strictEqual(
      shouldShowProfileSetup({
        user_metadata: { name: "Alice" },
      }),
      true,
    );
  });
});
