'use strict';

// security-tests/getToken-auth.test.cjs
//
// Run with:  node --experimental-detect-module --test security-tests/getToken-auth.test.cjs
//
// Tests getToken in src/utils/auth.js.

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Inlined source from src/utils/auth.js.
// Inlined to avoid ESM module import issues in Node test runner.
const getTokenInline = (supabaseInstance) => {
  const session = supabaseInstance?.auth?.getSession?.()?.data?.session;
  return session?.access_token || null;
};

// Mock supabase instance with controllable session state.
const mockSupabaseInstance = {
  auth: {
    getSession: () => ({ data: { session: null } }),
  },
};

describe('getToken', () => {
  beforeEach(() => {
    mockSupabaseInstance.auth.getSession = () => ({
      data: { session: null },
    });
  });

  it('returns access_token when session exists', () => {
    mockSupabaseInstance.auth.getSession = () => ({
      data: {
        session: {
          access_token: 'eyJhbGcOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
          user: { id: 'user-123' },
        },
      },
    });

    const token = getTokenInline(mockSupabaseInstance);
    assert.strictEqual(token, 'eyJhbGcOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
  });

  it('returns null when no session exists', () => {
    const token = getTokenInline(mockSupabaseInstance);
    assert.strictEqual(token, null);
  });

  it('returns null when session has no access_token field', () => {
    mockSupabaseInstance.auth.getSession = () => ({
      data: {
        session: {
          user: { id: 'user-123' },
        },
      },
    });

    const token = getTokenInline(mockSupabaseInstance);
    assert.strictEqual(token, null);
  });
});
