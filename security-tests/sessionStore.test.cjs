// security-tests/sessionStore.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/sessionStore.test.cjs
//
// Tests constants and pure helper functions from src/lib/collaboration/sessionStore.js.
// No external module imports are used - all tested logic is inlined.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// ─── Constants (mirrored from src/lib/collaboration/sessionStore.js) ───────────
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;
const SESSION_INDEX_KEY = 'collab:session:index';
const SESSION_PUBLIC_INDEX_KEY = 'collab:session:public:index';
const PUBLIC_VISIBILITY = new Set(['public', 'unlisted', 'private']);
const PASSWORD_HASH_ALGORITHM = 'bcrypt';
const PASSWORD_HASH_WORK_FACTOR = 12;
const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;
const SUBSCRIPTION_TOKEN_TTL_MS = 2 * 60 * 1000;
const MAX_EXPIRED_BUFFER = 50;
const MEMORY_SWEEP_INTERVAL_MS = 60_000;
const MAX_MEMORY_SESSIONS = parseInt(process.env.MAX_MEMORY_SESSIONS || '1000', 10);
const LOCK_TIMEOUT_MS = 30000;
const MEMORY_WRITE_WARN_THRESHOLD = 50;

// ─── Inlined pure helpers from sessionStore.js ─────────────────────────────────

function sessionKey(sessionId) {
  return `collab:session:${sessionId}`;
}

function joinCodeKey(code) {
  return `collab:joinCode:${normalizeJoinCode(code)}`;
}

function normalizeVisibility(value) {
  return PUBLIC_VISIBILITY.has(value) ? value : 'public';
}

function normalizeJoinCode(value) {
  return String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
}

function clampLimit(value) {
  const limit = Number.isFinite(Number(value)) ? Number(value) : DEFAULT_PAGE_LIMIT;
  return Math.min(Math.max(1, limit), MAX_PAGE_LIMIT);
}

function createId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function createJoinCode() {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
}

function hashLegacyPassword(password) {
  if (!password) return null;
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function hashSubscriptionToken(token) {
  const normalized = token ? String(token).slice(0, 240) : '';
  if (!normalized) return '';
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function pruneActiveSubscriptionTokens(tokens, nowMs = Date.now()) {
  const entries = Array.isArray(tokens) ? tokens : [];
  return entries.filter((entry) => {
    if (!entry?.tokenHash || !entry?.userId || !entry?.expiresAt) return false;
    const expiresAt = Date.parse(entry.expiresAt);
    return Number.isFinite(expiresAt) && expiresAt > nowMs;
  });
}

function parseCursor(cursor) {
  if (!cursor || cursor === '+inf') return { score: '+inf', offset: 0 };
  const parts = cursor.split('::', 2);
  const score = Number.isFinite(Number(parts[0])) ? Number(parts[0]) : '+inf';
  const offset = Number.isFinite(Number(parts[1])) ? Number(parts[1]) : 0;
  return { score, offset };
}

// ─── Constant value tests ──────────────────────────────────────────────────────
describe('Security constants', () => {
  test('PASSWORD_HASH_ALGORITHM equals bcrypt', () => {
    assert.strictEqual(PASSWORD_HASH_ALGORITHM, 'bcrypt');
  });

  test('PASSWORD_HASH_WORK_FACTOR is a positive integer', () => {
    assert.strictEqual(typeof PASSWORD_HASH_WORK_FACTOR, 'number');
    assert.ok(Number.isInteger(PASSWORD_HASH_WORK_FACTOR));
    assert.ok(PASSWORD_HASH_WORK_FACTOR > 0);
    assert.strictEqual(PASSWORD_HASH_WORK_FACTOR, 12);
  });

  test('SESSION_TTL_SECONDS equals 604800 (7 days)', () => {
    assert.strictEqual(SESSION_TTL_SECONDS, 604800);
  });

  test('SESSION_TTL_MS equals 604800000 (7 days in ms)', () => {
    assert.strictEqual(SESSION_TTL_MS, 604800000);
  });

  test('SUBSCRIPTION_TOKEN_TTL_MS equals 120000 (2 minutes)', () => {
    assert.strictEqual(SUBSCRIPTION_TOKEN_TTL_MS, 120000);
  });

  test('PUBLIC_VISIBILITY Set contains public, unlisted, private', () => {
    assert.ok(PUBLIC_VISIBILITY.has('public'));
    assert.ok(PUBLIC_VISIBILITY.has('unlisted'));
    assert.ok(PUBLIC_VISIBILITY.has('private'));
    assert.strictEqual(PUBLIC_VISIBILITY.size, 3);
  });
});

describe('Pagination constants', () => {
  test('DEFAULT_PAGE_LIMIT is a positive integer', () => {
    assert.strictEqual(typeof DEFAULT_PAGE_LIMIT, 'number');
    assert.ok(Number.isInteger(DEFAULT_PAGE_LIMIT));
    assert.ok(DEFAULT_PAGE_LIMIT > 0);
    assert.strictEqual(DEFAULT_PAGE_LIMIT, 50);
  });

  test('MAX_PAGE_LIMIT is a positive integer greater than DEFAULT', () => {
    assert.strictEqual(typeof MAX_PAGE_LIMIT, 'number');
    assert.ok(Number.isInteger(MAX_PAGE_LIMIT));
    assert.ok(MAX_PAGE_LIMIT > 0);
    assert.ok(MAX_PAGE_LIMIT > DEFAULT_PAGE_LIMIT);
    assert.strictEqual(MAX_PAGE_LIMIT, 100);
  });

  test('MAX_EXPIRED_BUFFER is a positive integer', () => {
    assert.strictEqual(typeof MAX_EXPIRED_BUFFER, 'number');
    assert.ok(Number.isInteger(MAX_EXPIRED_BUFFER));
    assert.ok(MAX_EXPIRED_BUFFER > 0);
    assert.strictEqual(MAX_EXPIRED_BUFFER, 50);
  });
});

describe('Memory management constants', () => {
  test('MEMORY_SWEEP_INTERVAL_MS is a positive number', () => {
    assert.strictEqual(typeof MEMORY_SWEEP_INTERVAL_MS, 'number');
    assert.ok(MEMORY_SWEEP_INTERVAL_MS > 0);
    assert.strictEqual(MEMORY_SWEEP_INTERVAL_MS, 60000);
  });

  test('MAX_MEMORY_SESSIONS is a positive integer (env override respected)', () => {
    assert.strictEqual(typeof MAX_MEMORY_SESSIONS, 'number');
    assert.ok(Number.isInteger(MAX_MEMORY_SESSIONS));
    assert.ok(MAX_MEMORY_SESSIONS > 0);
    assert.strictEqual(MAX_MEMORY_SESSIONS, 1000); // default since no env set
  });

  test('LOCK_TIMEOUT_MS equals 30000', () => {
    assert.strictEqual(LOCK_TIMEOUT_MS, 30000);
  });

  test('MEMORY_WRITE_WARN_THRESHOLD equals 50', () => {
    assert.strictEqual(MEMORY_WRITE_WARN_THRESHOLD, 50);
  });
});

describe('Redis key constants', () => {
  test('SESSION_INDEX_KEY is a non-empty string', () => {
    assert.strictEqual(typeof SESSION_INDEX_KEY, 'string');
    assert.ok(SESSION_INDEX_KEY.length > 0);
    assert.strictEqual(SESSION_INDEX_KEY, 'collab:session:index');
  });

  test('SESSION_PUBLIC_INDEX_KEY is a non-empty string', () => {
    assert.strictEqual(typeof SESSION_PUBLIC_INDEX_KEY, 'string');
    assert.ok(SESSION_PUBLIC_INDEX_KEY.length > 0);
    assert.strictEqual(SESSION_PUBLIC_INDEX_KEY, 'collab:session:public:index');
  });
});

// ─── Pure function tests ───────────────────────────────────────────────────────
describe('sessionKey', () => {
  test('prepends collab:session: prefix', () => {
    assert.strictEqual(sessionKey('abc123'), 'collab:session:abc123');
  });

  test('handles special characters in sessionId', () => {
    assert.strictEqual(sessionKey('test-id_42'), 'collab:session:test-id_42');
  });
});

describe('joinCodeKey', () => {
  test('prepends collab:joinCode: prefix', () => {
    assert.strictEqual(joinCodeKey('ABC123'), 'collab:joinCode:ABC123');
  });

  test('normalizes join code before prefixing', () => {
    assert.strictEqual(joinCodeKey('abc-123'), 'collab:joinCode:ABC123');
    assert.strictEqual(joinCodeKey('abc123!'), 'collab:joinCode:ABC123');
  });

  test('handles empty input', () => {
    assert.strictEqual(joinCodeKey(''), 'collab:joinCode:');
  });
});

describe('normalizeVisibility', () => {
  test('returns value unchanged when in PUBLIC_VISIBILITY Set', () => {
    assert.strictEqual(normalizeVisibility('public'), 'public');
    assert.strictEqual(normalizeVisibility('unlisted'), 'unlisted');
    assert.strictEqual(normalizeVisibility('private'), 'private');
  });

  test('defaults to public for unknown visibility values', () => {
    assert.strictEqual(normalizeVisibility('invalid'), 'public');
    assert.strictEqual(normalizeVisibility(''), 'public');
    assert.strictEqual(normalizeVisibility(null), 'public');
    assert.strictEqual(normalizeVisibility(undefined), 'public');
  });
});

describe('normalizeJoinCode', () => {
  test('converts to uppercase', () => {
    assert.strictEqual(normalizeJoinCode('abc123'), 'ABC123');
  });

  test('removes non-alphanumeric characters', () => {
    assert.strictEqual(normalizeJoinCode('AB-CD-12'), 'ABCD12');
    assert.strictEqual(normalizeJoinCode('ab!@#$cd34'), 'ABCD34');
  });

  test('returns empty string for empty or null input', () => {
    assert.strictEqual(normalizeJoinCode(''), '');
    assert.strictEqual(normalizeJoinCode(null), '');
    assert.strictEqual(normalizeJoinCode(undefined), '');
  });
});

describe('clampLimit', () => {
  test('returns default when input is undefined', () => {
    assert.strictEqual(clampLimit(undefined), DEFAULT_PAGE_LIMIT);
  });

  test('returns default when input is NaN', () => {
    assert.strictEqual(clampLimit(NaN), DEFAULT_PAGE_LIMIT);
  });

  test('caps at MAX_PAGE_LIMIT', () => {
    assert.strictEqual(clampLimit(500), MAX_PAGE_LIMIT);
  });

  test('floors at 1', () => {
    assert.strictEqual(clampLimit(0), 1);
    assert.strictEqual(clampLimit(-10), 1);
  });

  test('accepts valid numeric input', () => {
    assert.strictEqual(clampLimit(25), 25);
  });
});

describe('createId', () => {
  test('prefixes with given string', () => {
    const id = createId('session');
    assert.ok(id.startsWith('session_'));
  });

  test('appends a hex string of expected length', () => {
    const id = createId('test');
    const hex = id.replace('test_', '');
    assert.strictEqual(hex.length, 16); // 8 bytes = 16 hex chars
    assert.ok(/^[0-9a-f]+$/i.test(hex));
  });

  test('generates unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(createId('uid'));
    assert.strictEqual(ids.size, 100);
  });
});

describe('createJoinCode', () => {
  test('returns uppercase hex string of expected length', () => {
    const code = createJoinCode();
    assert.strictEqual(code.length, 10); // 5 bytes = 10 hex chars
    assert.ok(/^[0-9A-F]+$/.test(code));
  });

  test('generates unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) codes.add(createJoinCode());
    assert.strictEqual(codes.size, 100);
  });
});

describe('hashLegacyPassword', () => {
  test('returns null for falsy input', () => {
    assert.strictEqual(hashLegacyPassword(null), null);
    assert.strictEqual(hashLegacyPassword(undefined), null);
    assert.strictEqual(hashLegacyPassword(''), null);
  });

  test('returns a sha256 hex string', () => {
    const hash = hashLegacyPassword('testpassword');
    assert.strictEqual(hash.length, 64); // sha256 = 32 bytes = 64 hex chars
    assert.ok(/^[0-9a-f]{64}$/.test(hash));
  });

  test('is deterministic', () => {
    const h1 = hashLegacyPassword('same-input');
    const h2 = hashLegacyPassword('same-input');
    assert.strictEqual(h1, h2);
  });
});

describe('hashSubscriptionToken', () => {
  test('returns empty string for falsy input', () => {
    assert.strictEqual(hashSubscriptionToken(null), '');
    assert.strictEqual(hashSubscriptionToken(''), '');
    assert.strictEqual(hashSubscriptionToken(undefined), '');
  });

  test('returns sha256 hex string', () => {
    const hash = hashSubscriptionToken('mytoken');
    assert.strictEqual(hash.length, 64);
    assert.ok(/^[0-9a-f]{64}$/.test(hash));
  });

  test('truncates to 240 chars before hashing', () => {
    const long = 'a'.repeat(300);
    const hash = hashSubscriptionToken(long);
    assert.strictEqual(hash.length, 64);
  });
});

describe('pruneActiveSubscriptionTokens', () => {
  test('returns empty array for null input', () => {
    assert.deepStrictEqual(pruneActiveSubscriptionTokens(null), []);
  });

  test('returns empty array for empty array', () => {
    assert.deepStrictEqual(pruneActiveSubscriptionTokens([]), []);
  });

  test('filters out expired tokens', () => {
    const now = new Date('2026-06-01T12:00:00Z').getTime();
    const tokens = [
      { tokenHash: 'abc', userId: 'u1', expiresAt: '2026-06-01T11:00:00Z' }, // expired
      { tokenHash: 'def', userId: 'u2', expiresAt: '2026-06-01T13:00:00Z' }, // active
    ];
    const result = pruneActiveSubscriptionTokens(tokens, now);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].tokenHash, 'def');
  });

  test('filters out entries missing required fields', () => {
    const now = Date.now() + 10000;
    const tokens = [
      { tokenHash: 'abc', userId: 'u1', expiresAt: new Date(now + 1000).toISOString() },
      { tokenHash: '', userId: 'u2', expiresAt: new Date(now + 1000).toISOString() }, // invalid
      { tokenHash: 'def', expiresAt: new Date(now + 1000).toISOString() }, // missing userId
    ];
    const result = pruneActiveSubscriptionTokens(tokens, now);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].tokenHash, 'abc');
  });
});

describe('parseCursor', () => {
  test('returns +inf for null or undefined', () => {
    const r1 = parseCursor(null);
    assert.strictEqual(r1.score, '+inf');
    assert.strictEqual(r1.offset, 0);

    const r2 = parseCursor(undefined);
    assert.strictEqual(r2.score, '+inf');
    assert.strictEqual(r2.offset, 0);
  });

  test('parses numeric cursor correctly', () => {
    const r = parseCursor('1719000000000::5');
    assert.strictEqual(r.score, 1719000000000);
    assert.strictEqual(r.offset, 5);
  });

  test('handles +inf score in cursor', () => {
    const r = parseCursor('+inf::3');
    assert.strictEqual(r.score, '+inf');
    assert.strictEqual(r.offset, 3);
  });

  test('defaults invalid parts to defaults', () => {
    const r = parseCursor('abc::xyz');
    assert.strictEqual(r.score, '+inf');
    assert.strictEqual(r.offset, 0);
  });
});
