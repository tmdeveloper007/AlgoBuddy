// security-tests/sessionTrace.test.cjs
//
// Run with: node --experimental-detect-module --test security-tests/sessionTrace.test.cjs
//
// Tests the collaboration session trace utilities in src/lib/collaboration/sessionTrace.js.

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('node:url');

const traceUrl = pathToFileURL(path.join(__dirname, '../src/lib/collaboration/sessionTrace.js')).href;

describe('sanitizeSessionText', () => {
  let sanitizeSessionText;

  before(async () => {
    ({ sanitizeSessionText } = await import(traceUrl));
  });

  test('returns empty string for null input', async () => {
    assert.strictEqual(sanitizeSessionText(null), '');
  });

  test('returns empty string for undefined input', async () => {
    assert.strictEqual(sanitizeSessionText(undefined), '');
  });

  test('returns empty string for non-string values', async () => {
    assert.strictEqual(sanitizeSessionText(123), '');
    assert.strictEqual(sanitizeSessionText({}), '');
  });

  test('strips control characters while preserving whitespace', async () => {
    // \x00 and \x1F are control chars; regular space is preserved
    const result = sanitizeSessionText('hello\x00 world \x1Ftest');
    assert.strictEqual(result, 'hello world test');
  });

  test('strips HTML tags', async () => {
    const result = sanitizeSessionText('hello<script>alert(1)</script>world');
    assert.strictEqual(result, 'helloalert(1)world');
  });

  test('collapses whitespace', async () => {
    const result = sanitizeSessionText('hello   world\n\n  test  ');
    assert.strictEqual(result, 'hello world test');
  });

  test('trims leading and trailing whitespace', async () => {
    const result = sanitizeSessionText('  hello world  ');
    assert.strictEqual(result, 'hello world');
  });

  test('respects maxLength truncation', async () => {
    const result = sanitizeSessionText('hello world', 5);
    assert.strictEqual(result, 'hello');
  });

  test('skips truncation when maxLength is zero (maxLength > 0 guard)', async () => {
    const result = sanitizeSessionText('hello world', 0);
    assert.strictEqual(result, 'hello world');
  });

  test('handles string at exactly maxLength', async () => {
    const result = sanitizeSessionText('hello', 5);
    assert.strictEqual(result, 'hello');
  });

  test('handles empty string', async () => {
    const result = sanitizeSessionText('');
    assert.strictEqual(result, '');
  });
});

describe('createSessionSnapshot', () => {
  let createSessionSnapshot;

  before(async () => {
    ({ createSessionSnapshot } = await import(traceUrl));
  });

  test('creates snapshot with null presenterId by default', async () => {
    const snap = createSessionSnapshot();
    assert.strictEqual(snap.presenterId, null);
    assert.ok(Array.isArray(snap.events));
    assert.strictEqual(snap.events.length, 0);
    assert.ok(snap.appliedEventIds instanceof Set);
    assert.strictEqual(snap.appliedEventIds.size, 0);
  });

  test('creates snapshot with a given presenterId', async () => {
    const snap = createSessionSnapshot({ presenterId: 'user-42' });
    assert.strictEqual(snap.presenterId, 'user-42');
  });

  test('returns independent objects (no shared mutation)', async () => {
    const snap1 = createSessionSnapshot();
    const snap2 = createSessionSnapshot();
    assert.ok(snap1 !== snap2);
    assert.ok(snap1.appliedEventIds !== snap2.appliedEventIds);
  });
});

describe('canApplyPrivilegedSessionEvent', () => {
  let canApplyPrivilegedSessionEvent;

  before(async () => {
    ({ canApplyPrivilegedSessionEvent } = await import(traceUrl));
  });

  test('returns false for null snapshot', async () => {
    assert.strictEqual(await canApplyPrivilegedSessionEvent(null, { type: 'control:grant' }), false);
  });

  test('returns false for null event', async () => {
    assert.strictEqual(await canApplyPrivilegedSessionEvent({}, null), false);
  });

  test('allows non-privileged event regardless of presenterId', async () => {
    const snap = { presenterId: 'user-1', events: [], appliedEventIds: new Set() };
    const event = { type: 'message:send', senderId: 'other-user' };
    assert.strictEqual(await canApplyPrivilegedSessionEvent(snap, event), true);
  });

  test('allows privileged event when presenterId is null', async () => {
    const snap = { presenterId: null, events: [], appliedEventIds: new Set() };
    const event = { type: 'control:grant', senderId: 'anyone' };
    assert.strictEqual(await canApplyPrivilegedSessionEvent(snap, event), true);
  });

  test('allows privileged event from the current presenterId', async () => {
    const snap = { presenterId: 'user-1', events: [], appliedEventIds: new Set() };
    const event = { type: 'control:grant', senderId: 'user-1' };
    assert.strictEqual(await canApplyPrivilegedSessionEvent(snap, event), true);
  });

  test('blocks privileged event from a different senderId', async () => {
    const snap = { presenterId: 'user-1', events: [], appliedEventIds: new Set() };
    const event = { type: 'control:grant', senderId: 'malicious-user' };
    assert.strictEqual(await canApplyPrivilegedSessionEvent(snap, event), false);
  });
});

describe('applySessionEvent', () => {
  let applySessionEvent, createSessionSnapshot;

  before(async () => {
    ({ applySessionEvent, createSessionSnapshot } = await import(traceUrl));
  });

  test('returns snapshot unchanged for null snapshot', async () => {
    const result = applySessionEvent(null, { type: 'message:send' });
    assert.strictEqual(result, null);
  });

  test('returns snapshot unchanged for null event', async () => {
    const snap = createSessionSnapshot();
    const result = applySessionEvent(snap, null);
    assert.strictEqual(result, snap);
  });

  test('idempotent: applying same event twice does not duplicate it', async () => {
    const snap = createSessionSnapshot({ presenterId: 'user-1' });
    const event = { id: 'evt-1', type: 'message:send', senderId: 'user-1' };
    const after1 = applySessionEvent(snap, event);
    const after2 = applySessionEvent(after1, event);
    assert.strictEqual(after2.events.length, 1);
    assert.strictEqual(after2.events[0].id, 'evt-1');
  });

  test('applies event when not yet applied', async () => {
    const snap = createSessionSnapshot({ presenterId: 'user-1' });
    const event = { id: 'evt-2', type: 'message:send', senderId: 'user-1' };
    const result = applySessionEvent(snap, event);
    assert.strictEqual(result.events.length, 1);
    assert.strictEqual(result.events[0].id, 'evt-2');
    assert.ok(result.appliedEventIds.has('evt-2'));
  });

  test('updates presenterId on control:grant event', async () => {
    const snap = createSessionSnapshot({ presenterId: 'user-1' });
    const event = {
      id: 'evt-3',
      type: 'control:grant',
      senderId: 'user-1',
      payload: { presenterId: 'user-2' },
    };
    const result = applySessionEvent(snap, event);
    assert.strictEqual(result.presenterId, 'user-2');
  });

  test('does not update presenterId for non-control:grant events', async () => {
    const snap = createSessionSnapshot({ presenterId: 'user-1' });
    const event = {
      id: 'evt-4',
      type: 'message:send',
      senderId: 'user-1',
      payload: { presenterId: 'user-3' },
    };
    const result = applySessionEvent(snap, event);
    assert.strictEqual(result.presenterId, 'user-1');
  });
});
