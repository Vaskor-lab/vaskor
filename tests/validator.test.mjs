import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateDataset } from '../knowledge/validator.mjs';
import { addFieldObservation, emptyPilotDataset } from '../knowledge/pilot.mjs';

const fixture = JSON.parse(await readFile(new URL('./fixtures/representative-v1.0.json', import.meta.url), 'utf8'));
const clone = value => structuredClone(value);

test('representative fixture preserves unknowns, disagreements, unmatched representation and other domains', () => {
  const result = validateDataset(fixture);
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some(item => item.code === 'claim.conflict'));
  assert.ok(result.warnings.some(item => item.code === 'claim.provenance_missing'));
  assert.ok(fixture.source_representations.some(source => source.id === 'TEST-SOURCE-UNMATCHED'));
  assert.ok(fixture.knowledge_objects.some(object => object.domain === 'art'));
  assert.ok(fixture.claims.some(claim => claim.property === 'opening_hours' && claim.value.state === 'unknown'));
});

test('hard error for unsupported relationship', () => {
  const data = clone(fixture);
  data.relations.push({ id: 'TEST-REL-UNSUPPORTED', subject_id: 'TEST-OBJECT-WATER', predicate: 'near', object_id: 'TEST-OBJECT-SANITARY', supporting_claim_ids: [] });
  assert.ok(validateDataset(data).errors.some(item => item.code === 'relation.support_required'));
});

test('hard error for a relationship with nonexistent endpoint', () => {
  const data = clone(fixture);
  data.relations[0].object_id = 'DOES-NOT-EXIST';
  assert.ok(validateDataset(data).errors.some(item => item.code === 'relation.endpoint_invalid'));
});

test('hard error for null or empty values and duplicate IDs', () => {
  const data = clone(fixture);
  data.knowledge_objects[0].label = '';
  data.knowledge_objects[1].id = data.knowledge_objects[0].id;
  assert.ok(validateDataset(data).errors.some(item => item.code === 'value.empty'));
  assert.ok(validateDataset(data).errors.some(item => item.code === 'id.duplicate'));
});

test('explicit unknown is accepted while absent value is rejected', () => {
  const data = clone(fixture);
  data.claims[1].value = null;
  assert.ok(validateDataset(data).errors.some(item => item.code === 'value.empty'));
});

test('relationship support must describe one of its endpoints', () => {
  const data = clone(fixture);
  data.relations[0].supporting_claim_ids = ['TEST-CLAIM-CLIMBING'];
  assert.ok(validateDataset(data).errors.some(item => item.code === 'relation.support_mismatch'));
});

test('source representations cannot be related to each other', () => {
  const data = clone(fixture);
  data.relations[0].object_id = 'TEST-SOURCE-B';
  assert.ok(validateDataset(data).errors.some(item => item.code === 'relation.endpoint_pair_invalid'));
});

test('a knowledge object may be the subject of a supported source relation', () => {
  const data = clone(fixture);
  data.relations[0].subject_id = 'TEST-OBJECT-WATER';
  data.relations[0].object_id = 'TEST-SOURCE-A';
  assert.equal(validateDataset(data).errors.length, 0);
});

test('a knowledge object must have a recognizable label', () => {
  const data = clone(fixture);
  delete data.knowledge_objects[0].label;
  assert.ok(validateDataset(data).errors.some(item => item.code === 'object.label_required'));
});

test('an empty source list is treated as missing provenance', () => {
  const data = clone(fixture);
  data.claims[0].source_ids = [];
  assert.ok(validateDataset(data).warnings.some(item => item.code === 'claim.provenance_missing'));
});

test('source association without support is a hard error', () => {
  const data = clone(fixture);
  delete data.claims[0].support;
  assert.ok(validateDataset(data).errors.some(item => item.code === 'claim.support_required'));
});

test('nested null values are a hard error', () => {
  const data = clone(fixture);
  data.claims[0].value.latitude = null;
  assert.ok(validateDataset(data).errors.some(item => item.code === 'value.empty'));
});

test('phone field observations produce valid water and sanitary objects with supported OSM relations', () => {
  const data = emptyPilotDataset();
  let nextId = 0;
  const createId = () => `TEST-${++nextId}`;
  addFieldObservation(data, { category: 'water', osmType: 'node', osmId: 101, name: 'TEST: water point', coordinates: [2.9, 42.7], observationLocation: [2.9001, 42.7001], accuracyMeters: 12, distanceMeters: 14, observedAt: 'TEST: 2026-11-06T10:00:00Z', createId });
  addFieldObservation(data, { category: 'sanitary', osmType: 'way', osmId: 202, name: 'TEST: toilets', coordinates: [2.91, 42.71], observationLocation: [2.9101, 42.7101], accuracyMeters: 15, distanceMeters: 14, observedAt: 'TEST: 2026-11-06T10:05:00Z', createId });
  const result = validateDataset(data);
  assert.equal(result.errors.length, 0);
  assert.equal(data.knowledge_objects.length, 2);
  assert.deepEqual(data.relations.map(relation => relation.predicate), ['represents', 'represents']);
  assert.ok(data.claims.every(claim => claim.support.includes('Phone GPS:')));
});
