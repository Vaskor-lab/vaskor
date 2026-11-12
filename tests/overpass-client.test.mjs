import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchOverpass } from '../knowledge/overpass-client.mjs';

test('falls back to a second endpoint after HTTP failure', async () => {
  const used = [];
  const result = await fetchOverpass('query', { endpoints: ['first', 'second'], fetchImpl: async endpoint => {
    used.push(endpoint);
    return endpoint === 'first' ? { ok: false, status: 503 } : { ok: true, json: async () => ({ elements: [] }) };
  } });
  assert.deepEqual(used, ['first', 'second']);
  assert.equal(result.endpoint, 'second');
});

test('reports JSON, network and timeout failures with endpoint details', async () => {
  await assert.rejects(fetchOverpass('q', { endpoints: ['bad-json'], fetchImpl: async () => ({ ok: true, json: async () => { throw new Error(); } }) }), error => error.kind === 'json' && error.endpoint === 'bad-json');
  await assert.rejects(fetchOverpass('q', { endpoints: ['offline'], fetchImpl: async () => { throw new Error('CORS'); } }), error => error.kind === 'network' && error.endpoint === 'offline');
  await assert.rejects(fetchOverpass('q', { endpoints: ['slow'], timeoutMs: 5, fetchImpl: (_url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))) }), error => error.kind === 'timeout' && error.endpoint === 'slow');
});

test('caller cancellation stops fallback and is distinguished from timeout', async () => {
  const controller = new AbortController();
  let calls = 0;
  const request = fetchOverpass('q', { endpoints: ['one', 'two'], signal: controller.signal, fetchImpl: (_url, { signal }) => {
    calls++;
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
  } });
  controller.abort();
  await assert.rejects(request, error => error.kind === 'cancelled');
  assert.equal(calls, 1);
});
