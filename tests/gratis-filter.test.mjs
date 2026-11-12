import test from 'node:test';
import assert from 'node:assert/strict';
import { filterGratisOsmElements, gratisRelationForOsmElement } from '../knowledge/gratis-filter.mjs';

const element = (id, tags = { amenity: 'drinking_water' }) => ({ type: 'node', id, lon: 2, lat: 41, version: 3, timestamp: 'TEST: 2026-11-10T12:00:00Z', tags });

test('explicit OSM no-charge tags establish a traceable GRATIS relation', () => {
  const feeNo = element(1, { amenity: 'drinking_water', fee: 'no', name: 'TEST: fountain' });
  const relation = gratisRelationForOsmElement(feeNo);
  assert.deepEqual(relation, {
    id: 'OSM-node-1-REL-GRATIS',
    subject_id: 'OSM-node-1',
    predicate: 'qualifies_as',
    object_id: 'GRATIS',
    evidence: { source: 'OpenStreetMap', record_id: 'node/1', tags: { fee: 'no' } }
  });
  assert.deepEqual(filterGratisOsmElements([feeNo]), [feeNo]);
  assert.deepEqual(feeNo.tags, { amenity: 'drinking_water', fee: 'no', name: 'TEST: fountain' });
});

test('fee free, charge no, and explicit zero amounts also establish the relation', () => {
  for (const tags of [{ fee: 'free' }, { charge: 'no' }, { fee: '0.00' }, { charge: '0,0' }]) {
    assert.ok(gratisRelationForOsmElement(element(1, tags)));
  }
});

test('OSM existence, category, access, or missing fee information do not establish GRATIS', () => {
  assert.equal(gratisRelationForOsmElement(element(1)), null);
  assert.equal(gratisRelationForOsmElement(element(1, { amenity: 'drinking_water', access: 'yes' })), null);
  assert.equal(gratisRelationForOsmElement(element(1, { amenity: 'drinking_water', fee: 'unknown' })), null);
  assert.deepEqual(filterGratisOsmElements([element(1)]), []);
});

test('paid, conflicting, and conditional charges are excluded', () => {
  for (const tags of [
    { fee: 'yes' },
    { fee: 'no', charge: '2 EUR' },
    { fee: 'no', 'fee:conditional': 'yes @ (Mo-Fr)' },
    { charge: '0', 'charge:conditional': 'yes' }
  ]) assert.equal(gratisRelationForOsmElement(element(1, tags)), null);
});

test('relation provenance requires a valid OSM identity', () => {
  assert.equal(gratisRelationForOsmElement({ type: 'node', id: 'bad', tags: { fee: 'no' } }), null);
  assert.equal(gratisRelationForOsmElement({ type: 'unknown', id: 1, tags: { fee: 'no' } }), null);
});

