import assert from 'node:assert/strict';
import test from 'node:test';
import { clientIp, rateLimit, resetLimits, resolveModel, LIMITS } from './policy.js';

test('rate limit allows 10 posts per IP per minute, then blocks', () => {
  resetLimits();
  const start = 1_700_000_000_000;
  for (let i = 0; i < LIMITS.maxRequests; i += 1) {
    assert.equal(rateLimit('203.0.113.10', start + i).allowed, true);
  }
  const blocked = rateLimit('203.0.113.10', start + 20);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSec >= 1);
  assert.equal(rateLimit('203.0.113.11', start + 20).allowed, true);
  assert.equal(rateLimit('203.0.113.10', start + LIMITS.windowMs).allowed, true);
});

test('client IP uses the first forwarded hop', () => {
  const request = new Request('http://localhost/api/analyze', {
    headers: { 'x-forwarded-for': '198.51.100.8, 10.0.0.1' },
  });
  assert.equal(clientIp(request), '198.51.100.8');
});

test('model id falls back when the env value is unsafe', () => {
  assert.equal(resolveModel(undefined), 'gemini-3-flash-preview');
  assert.equal(resolveModel('gemini-2.5-flash'), 'gemini-2.5-flash');
  assert.equal(resolveModel('../etc/passwd'), 'gemini-3-flash-preview');
  assert.equal(resolveModel('bad model'), 'gemini-3-flash-preview');
});
