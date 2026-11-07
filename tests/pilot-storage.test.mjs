import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPilotDataset, saveFieldObservation } from '../knowledge/pilot.mjs';

function observation() {
  let id = 0;
  return {
    category: 'water',
    osmType: 'node',
    osmId: 123,
    name: 'Test water point',
    coordinates: [5, 52],
    observationLocation: [5.0001, 52.0001],
    accuracyMeters: 8,
    distanceMeters: 14,
    observedAt: '2026-11-07T12:00:00Z',
    createId: () => `TEST-${++id}`
  };
}

test('field observations are saved transactionally without mutating the current dataset', () => {
  const dataset = emptyPilotDataset();
  let storedKey;
  let storedValue;
  const storage = { setItem(key, value) { storedKey = key; storedValue = value; } };

  const nextDataset = saveFieldObservation(dataset, observation(), storage);

  assert.equal(storedKey, 'vaskor-knowledge-pilot-v1');
  assert.deepEqual(JSON.parse(storedValue), nextDataset);
  assert.equal(dataset.knowledge_objects.length, 0);
  assert.equal(nextDataset.knowledge_objects.length, 1);
});

test('storage failure leaves the current dataset untouched', () => {
  const dataset = emptyPilotDataset();
  const before = structuredClone(dataset);
  const storage = { setItem() { throw new Error('storage unavailable'); } };

  assert.throws(() => saveFieldObservation(dataset, observation(), storage), /storage unavailable/);
  assert.deepEqual(dataset, before);
});
