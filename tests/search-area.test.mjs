import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_RADIUS_KM, isInsideSearchArea, overpassSearchQuery, searchBoundary, searchBounds } from '../knowledge/search-area.mjs';
import { classifyOsmTags, relationsForFeature, toVaskorFeature } from '../knowledge/osm-discovery.mjs';

test('default circle is 20 km and boundary represents requested radius', () => {
  assert.equal(DEFAULT_RADIUS_KM, 20);
  const bounds = searchBounds(0, 0, DEFAULT_RADIUS_KM);
  const northSouthKm = (bounds.north - bounds.south) * Math.PI / 180 * 6371.0088;
  assert.ok(Math.abs(northSouthKm - 40) < 0.01);
  const feature = searchBoundary(0, 0, 50).features[0];
  assert.equal(feature.properties.radiusMeters, 50000);
  assert.equal(feature.geometry.type, 'Polygon');
  assert.equal(feature.geometry.coordinates[0].length, 97);
});

test('circle distance filter and Overpass rectangle query support 20 and 50 km', () => {
  assert.equal(isInsideSearchArea(0, 0, 0.1, 0, 20), true);
  assert.equal(isInsideSearchArea(0, 0, 0.3, 0, 20), false);
  assert.equal(isInsideSearchArea(0, 0, 0.3, 0, 50), true);
  const query = overpassSearchQuery(0, 0, 20);
  for (const tag of ['drinking_water', 'water_point', 'toilets', 'shower', 'swimming_area', 'swimming_pool']) assert.ok(query.includes(tag));
  for (const tag of ['highway', 'route', 'natural', 'waterway', 'landuse']) assert.ok(!query.includes(tag));
  assert.throws(() => overpassSearchQuery(0, 0, 51), RangeError);
});

test('OSM candidates become separate VASKOR identities and known categories', () => {
  const feature = toVaskorFeature({ type: 'node', id: 123, lon: 2, lat: 42, tags: { amenity: 'shower', name: 'TEST: douche' } });
  assert.equal(feature.properties.vaskorId, 'VASKOR-OSM-node-123');
  assert.equal(feature.properties.osmSourceId, 'OSM-node-123');
  assert.equal(feature.properties.category, 'shower');
  assert.equal(classifyOsmTags({ natural: 'beach' }), null);
  const way = toVaskorFeature({ type: 'way', id: 124, center: { lon: 2.1, lat: 42.1 }, tags: { amenity: 'toilets' } });
  assert.equal(way.geometry.type, 'Point');
  assert.deepEqual(way.geometry.coordinates, [2.1, 42.1]);
  assert.equal(toVaskorFeature({ type: 'way', id: 125, geometry: [{ lon: 2, lat: 42 }], tags: { amenity: 'toilets' } }), null);
  assert.equal(toVaskorFeature({ type: 'node', id: 1, lon: 0, lat: 0, tags: { amenity: 'bench' } }), null);
});

test('recorded links and inferred nearby candidates are returned separately', () => {
  const a = toVaskorFeature({ type: 'node', id: 1, lon: 0, lat: 0, tags: { amenity: 'drinking_water' } });
  const b = toVaskorFeature({ type: 'node', id: 2, lon: 0.001, lat: 0, tags: { amenity: 'toilets' } });
  const dataset = {
    knowledge_objects: [{ id: a.properties.vaskorId, label: 'TEST: waargenomen waterpunt' }],
    source_representations: [{ id: 'OSM-node-1', provider: 'OpenStreetMap', record_id: 'node/1' }],
    relations: [{ id: 'REL-1', subject_id: 'OSM-node-1', predicate: 'represents', object_id: a.properties.vaskorId, supporting_claim_ids: ['CLAIM-1'] }]
  };
  const relations = relationsForFeature(a, [a, b], dataset);
  assert.equal(relations.recorded[0].kind, 'recorded');
  assert.equal(relations.recorded[0].predicate, 'represents');
  assert.equal(relations.candidates[0].kind, 'candidate');
  assert.ok(relations.candidates[0].distanceMeters < 500);
});
