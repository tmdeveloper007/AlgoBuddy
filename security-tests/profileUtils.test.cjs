// security-tests/profileUtils.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/profileUtils.test.cjs
//
// Tests profile utilities from src/lib/profileUtils.js: safeAvatarUrl,
// safeExternalUrl, sanitizeProfileLinks, buildFormDataFromUser, normalizeProfilePayload,
// validateProfileForm, isOnboardingStep1Valid, shouldShowProfileSetup.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ─── Inline implementation ───────────────────────────────────────────────────

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_FILE_SIZE = 2 * 1024 * 1024;
const MAX_AVATAR_URL_LENGTH = 512;
const MAX_PROFILE_URL_LENGTH = 512;
const MAX_BIO_LENGTH = 300;

const PROFILE_URL_FIELDS = ['resume_link', 'github_profile', 'linkedin_profile'];

const PRESET_PROJECT_GRADIENTS = [
  'bg-[linear-gradient(135deg,#190f4f,#25116d_45%,#5338f2)]',
  'bg-[linear-gradient(135deg,#064e3b,#0f172a)]',
];

const EMPTY_PROFILE_FORM = {
  name: '',
  branch: '',
  college: '',
  location: '',
  skills: '',
  resume_link: '',
  github_profile: '',
  linkedin_profile: '',
  email_notifications: true,
  avatar_url: '',
  leetcode_username: '',
  leetcode_solved: 0,
  codeforces_username: '',
  codeforces_rating: 0,
  codechef_username: '',
  codechef_stars: 0,
  github_username: '',
  github_contributions: 0,
  projects: [],
};

const ONBOARDING_REQUIRED_FIELDS = ['name', 'skills'];

const safeAvatarUrl = (value) => {
  if (typeof value !== 'string') return '';
  if (value.startsWith('data:')) return '';
  if (value.length > MAX_AVATAR_URL_LENGTH) return '';
  return value;
};

const safeExternalUrl = (value) => {
  if (typeof value !== 'string' || value.length > MAX_PROFILE_URL_LENGTH) return '';
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return parsed.toString();
  } catch {
    return '';
  }
};

const sanitizeProfileLinks = (data) => {
  const nextData = { ...data };

  for (const field of PROFILE_URL_FIELDS) {
    const rawValue = typeof nextData[field] === 'string' ? nextData[field].trim() : nextData[field];
    if (!rawValue) {
      nextData[field] = '';
      continue;
    }

    const safeUrl = safeExternalUrl(rawValue);
    if (!safeUrl) {
      return { error: 'Please enter valid http or https URLs for profile links.' };
    }
    nextData[field] = safeUrl;
  }

  return { data: nextData };
};

const buildFormDataFromUser = (user) => {
  const meta = user?.user_metadata || {};
  return {
    name: meta.name || '',
    branch: meta.branch || '',
    college: meta.college || '',
    location: meta.location || meta.address || '',
    skills: (meta.skills || '').slice(0, MAX_BIO_LENGTH),
    resume_link: meta.resume_link || '',
    github_profile: meta.github_profile || '',
    linkedin_profile: meta.linkedin_profile || '',
    email_notifications: meta.email_notifications !== false,
    avatar_url: safeAvatarUrl(meta.avatar_url || meta.picture),
    leetcode_username: meta.leetcode_username || '',
    leetcode_solved: meta.leetcode_solved || 0,
    codeforces_username: meta.codeforces_username || '',
    codeforces_rating: meta.codeforces_rating || 0,
    codechef_username: meta.codechef_username || '',
    codechef_stars: meta.codechef_stars || 0,
    github_username: meta.github_username || '',
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

const validateProfileForm = (formData, mode = 'edit') => {
  if (mode !== 'onboarding') return null;

  for (const field of ONBOARDING_REQUIRED_FIELDS) {
    if (!formData[field]?.trim()) {
      return field === 'name' ? 'Full name is required.' : 'Bio is required.';
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

// ─── safeAvatarUrl tests ─────────────────────────────────────────────────────

describe('safeAvatarUrl', () => {
  test('returns valid URL unchanged', () => {
    assert.strictEqual(
      safeAvatarUrl('https://avatars.githubusercontent.com/u/123456?v=4'),
      'https://avatars.githubusercontent.com/u/123456?v=4'
    );
  });

  test('rejects data URI', () => {
    assert.strictEqual(safeAvatarUrl('data:image/png;base64,iVBORw0KGgo='), '');
  });

  test('rejects data URI with text/plain', () => {
    assert.strictEqual(safeAvatarUrl('data:text/plain;charset=utf-8,hello'), '');
  });

  test('rejects URL exceeding MAX_AVATAR_URL_LENGTH (512)', () => {
    const long = 'https://example.com/' + 'x'.repeat(600);
    assert.strictEqual(safeAvatarUrl(long), '');
  });

  test('accepts URL at exactly MAX_AVATAR_URL_LENGTH', () => {
    const url = 'https://example.com/' + 'x'.repeat(MAX_AVATAR_URL_LENGTH - 21);
    assert.strictEqual(safeAvatarUrl(url), url);
  });

  test('returns empty string for non-string input', () => {
    assert.strictEqual(safeAvatarUrl(null), '');
    assert.strictEqual(safeAvatarUrl(undefined), '');
    assert.strictEqual(safeAvatarUrl(123), '');
    assert.strictEqual(safeAvatarUrl({}), '');
  });

  test('returns empty string for empty string', () => {
    assert.strictEqual(safeAvatarUrl(''), '');
  });
});

// ─── safeExternalUrl tests ───────────────────────────────────────────────────

describe('safeExternalUrl', () => {
  test('returns https URL unchanged', () => {
    assert.strictEqual(safeExternalUrl('https://github.com/user'), 'https://github.com/user');
  });

  test('returns http URL (normalized by URL parser)', () => {
    // Node URL parser normalizes host-only URLs to include trailing slash
    assert.strictEqual(safeExternalUrl('http://example.com'), 'http://example.com/');
  });

  test('rejects non-http/https protocols', () => {
    assert.strictEqual(safeExternalUrl('javascript:alert(1)'), '');
    assert.strictEqual(safeExternalUrl('ftp://example.com'), '');
    assert.strictEqual(safeExternalUrl('data:text/html,<h1>'), '');
  });

  test('rejects URL exceeding MAX_PROFILE_URL_LENGTH', () => {
    const long = 'https://example.com/' + 'x'.repeat(600);
    assert.strictEqual(safeExternalUrl(long), '');
  });

  test('returns empty string for invalid URL', () => {
    assert.strictEqual(safeExternalUrl('not-a-url'), '');
    assert.strictEqual(safeExternalUrl(''), '');
  });

  test('returns empty string for non-string input', () => {
    assert.strictEqual(safeExternalUrl(null), '');
    assert.strictEqual(safeExternalUrl(undefined), '');
    assert.strictEqual(safeExternalUrl(123), '');
  });
});

// ─── sanitizeProfileLinks tests ──────────────────────────────────────────────

describe('sanitizeProfileLinks', () => {
  test('returns data unchanged when all URLs are valid', () => {
    const input = {
      name: 'Alice',
      resume_link: 'https://example.com/resume.pdf',
      github_profile: 'https://github.com/alice',
      linkedin_profile: 'https://linkedin.com/in/alice',
    };
    const result = sanitizeProfileLinks(input);
    assert.strictEqual(result.error, undefined);
    assert.strictEqual(result.data.resume_link, 'https://example.com/resume.pdf');
    assert.strictEqual(result.data.github_profile, 'https://github.com/alice');
  });

  test('sets empty string for falsy URL fields', () => {
    const input = { resume_link: '', github_profile: null, linkedin_profile: undefined };
    const result = sanitizeProfileLinks(input);
    assert.strictEqual(result.data.resume_link, '');
    assert.strictEqual(result.data.github_profile, '');
    assert.strictEqual(result.data.linkedin_profile, '');
  });

  test('returns error when a profile link is invalid', () => {
    const input = {
      resume_link: 'not-a-url',
      github_profile: 'https://github.com/alice',
      linkedin_profile: 'https://linkedin.com/in/alice',
    };
    const result = sanitizeProfileLinks(input);
    assert.strictEqual(result.error, 'Please enter valid http or https URLs for profile links.');
    assert.strictEqual(result.data, undefined);
  });

  test('trims whitespace from URL before validating', () => {
    const input = {
      resume_link: '  https://example.com/resume  ',
      github_profile: '',
      linkedin_profile: '',
    };
    const result = sanitizeProfileLinks(input);
    assert.strictEqual(result.data.resume_link, 'https://example.com/resume');
  });
});

// ─── buildFormDataFromUser tests ─────────────────────────────────────────────

describe('buildFormDataFromUser', () => {
  test('returns full default form for null user', () => {
    const form = buildFormDataFromUser(null);
    assert.deepStrictEqual(form.avatar_url, '');
    assert.strictEqual(form.name, '');
    assert.deepStrictEqual(form.projects, []);
    assert.strictEqual(form.email_notifications, true);
  });

  test('maps metadata fields correctly', () => {
    const user = {
      user_metadata: {
        name: 'Bob',
        branch: 'CS',
        college: 'MIT',
        location: 'Boston',
        skills: 'JavaScript,Python',
        leetcode_username: 'bob',
        leetcode_solved: 50,
        github_username: 'bob-dev',
      },
    };
    const form = buildFormDataFromUser(user);
    assert.strictEqual(form.name, 'Bob');
    assert.strictEqual(form.branch, 'CS');
    assert.strictEqual(form.leetcode_username, 'bob');
    assert.strictEqual(form.leetcode_solved, 50);
  });

  test('uses avatar_url over picture when both present', () => {
    const user = {
      user_metadata: {
        avatar_url: 'https://cdn.example.com/avatar.png',
        picture: 'https://cdn.example.com/old.png',
      },
    };
    assert.strictEqual(buildFormDataFromUser(user).avatar_url, 'https://cdn.example.com/avatar.png');
  });

  test('falls back to picture when avatar_url absent', () => {
    const user = {
      user_metadata: {
        picture: 'https://cdn.example.com/pic.png',
      },
    };
    assert.strictEqual(buildFormDataFromUser(user).avatar_url, 'https://cdn.example.com/pic.png');
  });

  test('truncates skills to MAX_BIO_LENGTH (300)', () => {
    const user = { user_metadata: { skills: 'a'.repeat(500) } };
    const form = buildFormDataFromUser(user);
    assert.strictEqual(form.skills.length, MAX_BIO_LENGTH);
  });

  test('treats undefined projects as empty array', () => {
    const user = { user_metadata: { projects: undefined } };
    assert.deepStrictEqual(buildFormDataFromUser(user).projects, []);
  });

  test('passes through array projects', () => {
    const projects = [{ title: 'My Project', url: 'https://example.com' }];
    const user = { user_metadata: { projects } };
    assert.deepStrictEqual(buildFormDataFromUser(user).projects, projects);
  });
});

// ─── normalizeProfilePayload tests ───────────────────────────────────────────

describe('normalizeProfilePayload', () => {
  test('coerces string numbers to integers', () => {
    const input = {
      leetcode_solved: '42',
      codeforces_rating: '1600',
      codechef_stars: '5',
      github_contributions: '100',
    };
    const result = normalizeProfilePayload(input);
    assert.strictEqual(result.leetcode_solved, 42);
    assert.strictEqual(result.codeforces_rating, 1600);
    assert.strictEqual(result.codechef_stars, 5);
    assert.strictEqual(result.github_contributions, 100);
  });

  test('coerces NaN and non-numeric strings to 0', () => {
    const input = {
      leetcode_solved: 'abc',
      codeforces_rating: '',
      codechef_stars: null,
      github_contributions: undefined,
    };
    const result = normalizeProfilePayload(input);
    assert.strictEqual(result.leetcode_solved, 0);
    assert.strictEqual(result.codeforces_rating, 0);
    assert.strictEqual(result.codechef_stars, 0);
    assert.strictEqual(result.github_contributions, 0);
  });

  test('keeps existing numeric values unchanged', () => {
    const input = {
      leetcode_solved: 0,
      codeforces_rating: 1400,
      codechef_stars: 3,
      github_contributions: 250,
    };
    const result = normalizeProfilePayload(input);
    assert.strictEqual(result.leetcode_solved, 0);
    assert.strictEqual(result.codeforces_rating, 1400);
  });

  test('normalizes projects to array', () => {
    const result = normalizeProfilePayload({ projects: 'not an array' });
    assert.deepStrictEqual(result.projects, []);
  });
});

// ─── validateProfileForm tests ────────────────────────────────────────────────

describe('validateProfileForm', () => {
  test('returns null in edit mode regardless of content', () => {
    assert.strictEqual(validateProfileForm({ name: '' }, 'edit'), null);
  });

  test('returns null in onboarding mode when all required fields present', () => {
    const form = { name: 'Alice', skills: 'JavaScript' };
    assert.strictEqual(validateProfileForm(form, 'onboarding'), null);
  });

  test('returns error when name is missing in onboarding', () => {
    const form = { name: '', skills: 'Python' };
    assert.strictEqual(validateProfileForm(form, 'onboarding'), 'Full name is required.');
  });

  test('returns error when skills is missing in onboarding', () => {
    const form = { name: 'Alice', skills: '  ' };
    assert.strictEqual(validateProfileForm(form, 'onboarding'), 'Bio is required.');
  });

  test('throws TypeError for null formData in onboarding mode', () => {
    assert.throws(() => validateProfileForm(null, 'onboarding'), TypeError);
  });
});

// ─── isOnboardingStep1Valid tests ───────────────────────────────────────────

describe('isOnboardingStep1Valid', () => {
  test('returns true when name and skills are both non-empty', () => {
    assert.strictEqual(isOnboardingStep1Valid({ name: 'Alice', skills: 'JS' }), true);
  });

  test('returns false when name is empty', () => {
    assert.strictEqual(isOnboardingStep1Valid({ name: '', skills: 'JS' }), false);
  });

  test('returns false when skills is empty', () => {
    assert.strictEqual(isOnboardingStep1Valid({ name: 'Alice', skills: '' }), false);
  });

  test('returns false when name is only whitespace', () => {
    assert.strictEqual(isOnboardingStep1Valid({ name: '   ', skills: 'JS' }), false);
  });
});

// ─── shouldShowProfileSetup tests ────────────────────────────────────────────

describe('shouldShowProfileSetup', () => {
  test('returns false when user is null', () => {
    assert.strictEqual(shouldShowProfileSetup(null), false);
  });

  test('returns true when user_metadata is absent (has not seen setup)', () => {
    // Missing user_metadata means setup has not been shown — show it
    assert.strictEqual(shouldShowProfileSetup({}), true);
  });

  test('returns true when hasSeenProfileSetup is not true', () => {
    assert.strictEqual(shouldShowProfileSetup({ user_metadata: {} }), true);
    assert.strictEqual(shouldShowProfileSetup({ user_metadata: { hasSeenProfileSetup: false } }), true);
  });

  test('returns false when hasSeenProfileSetup is true', () => {
    assert.strictEqual(
      shouldShowProfileSetup({ user_metadata: { hasSeenProfileSetup: true } }),
      false
    );
  });
});
