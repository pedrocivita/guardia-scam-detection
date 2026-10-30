import assert from 'node:assert/strict';
import test from 'node:test';
import { GET, POST, normalizeReport } from './analyze.js';
import { LIMITS, resetLimits } from './policy.js';

const originalFetch = globalThis.fetch;

function post(transcript, headers = {}) {
  return POST(new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify({ transcript }),
  }));
}

test.beforeEach(() => {
  resetLimits();
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  globalThis.fetch = originalFetch;
});

test.after(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_MODEL;
  globalThis.fetch = originalFetch;
});

test('GET reports whether a server key exists and does not cache', async () => {
  const hidden = await GET();
  assert.equal(hidden.status, 200);
  assert.equal(hidden.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await hidden.json(), { realModeAvailable: false });

  process.env.GEMINI_API_KEY = 'server-only-placeholder';
  const shown = await GET();
  const shownBody = await shown.json();
  assert.deepEqual(shownBody, { realModeAvailable: true });
  assert.equal(JSON.stringify(shownBody).includes('server-only-placeholder'), false);
});

test('POST rejects oversized, empty, and non-JSON bodies', async () => {
  const big = await POST(new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ transcript: 'x'.repeat(LIMITS.maxBodyBytes) }),
  }));
  assert.equal(big.status, 413);

  const long = await post('x'.repeat(LIMITS.maxTranscriptChars + 1));
  assert.equal(long.status, 400);

  const empty = await post('   ');
  assert.equal(empty.status, 400);

  const broken = await POST(new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  }));
  assert.equal(broken.status, 400);
});

test('POST rate limit counts configured and unconfigured calls', async () => {
  for (let i = 0; i < LIMITS.maxRequests; i += 1) {
    const res = await post('A caller asks for a password.');
    assert.equal(res.status, 503);
  }
  const blocked = await post('A caller asks for a password.');
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get('retry-after'));
});

test('POST never returns the server key or upstream error text', async () => {
  process.env.GEMINI_API_KEY = 'server-only-placeholder';
  globalThis.fetch = async () => {
    throw new Error('socket hang up while using server-only-placeholder');
  };
  const failed = await post('Please read me the one time code.');
  const failedBody = await failed.json();
  assert.equal(failed.status, 502);
  assert.equal(JSON.stringify(failedBody).includes('server-only-placeholder'), false);
  assert.equal(JSON.stringify(failedBody).includes('socket hang up'), false);

  resetLimits();
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url).includes('server-only-placeholder'), false);
    assert.equal(init.headers['x-goog-api-key'], 'server-only-placeholder');
    return new Response('invalid server-only-placeholder', { status: 401 });
  };
  const rejected = await post('Send a verification Pix now.');
  const rejectedBody = await rejected.json();
  assert.equal(rejected.status, 502);
  assert.equal(JSON.stringify(rejectedBody).includes('server-only-placeholder'), false);
});

test('POST clamps the model report and keeps the key out of the URL', async () => {
  process.env.GEMINI_API_KEY = 'server-only-placeholder';
  process.env.GEMINI_MODEL = 'gemini-2.5-flash';
  globalThis.fetch = async (url) => {
    assert.match(String(url), /models\/gemini-2\.5-flash:generateContent$/);
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              score: 42,
              reason: 'y'.repeat(1500),
              actions: ['Hang up'],
              sentiment: { primary: 'Urgent', intensity: 140, scoreAdjustment: 3 },
              detections: [{ keyword: 'Pix', category: 'Payment' }],
            }),
          }],
        },
      }],
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  const res = await post('Send a verification Pix to the safety key.');
  assert.equal(res.status, 200);
  const report = await res.json();
  assert.equal(report.score, 10);
  assert.equal(report.level, 'high');
  assert.equal(report.reason.length, 1200);
  assert.deepEqual(report.actions, ['Hang up']);
  assert.equal(report.detections[0].keyword, 'Pix');
  assert.equal(report.sentiment.intensity, 100);
  assert.equal(JSON.stringify(report).includes('server-only-placeholder'), false);
});

test('normalizeReport drops incomplete payloads', () => {
  assert.equal(normalizeReport({ score: 4 }), null);
  assert.equal(normalizeReport(null), null);
  const report = normalizeReport({ score: 0, reason: 'Calm check-in from a known contact.' });
  assert.equal(report.score, 1);
  assert.equal(report.level, 'low');
});
