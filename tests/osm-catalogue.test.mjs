import test from 'node:test';
import assert from 'node:assert/strict';
import { OSM_CATALOGUE, catalogObjectForTags, toVaskorFeature } from '../knowledge/osm-discovery.mjs';
import { gratisRelationForOsmElement } from '../knowledge/gratis-filter.mjs';
import { overpassSearchQuery } from '../knowledge/search-area.mjs';

const allObjects = OSM_CATALOGUE.flatMap(section => section.objects.map(([id, label, tags]) => ({ id, label, tags })));

test('catalogue contains only the 7 requested sections and 67 requested object types', () => {
  assert.deepEqual(OSM_CATALOGUE.map(section => section.id), ['orientation', 'shelter', 'public', 'transport', 'nature', 'sport', 'safety']);
  assert.equal(allObjects.length, 67);
  assert.equal(new Set(allObjects.map(object => object.id)).size, 67);
});

test('every selected tag pattern classifies to its requested knowledge object', () => {
  for (const [index, object] of allObjects.entries()) {
    const tags = Object.fromEntries(Object.entries(object.tags).map(([key, value]) => [key, value === '*' ? 'slide' : Array.isArray(value) ? value[0] : value]));
    const feature = toVaskorFeature({ type: 'node', id: index + 1, lon: 4, lat: 52, tags });
    assert.ok(feature, `${object.id} should produce a fixed-location feature`);
    assert.equal(feature.properties.catalogType, object.id);
    assert.equal(feature.properties.catalogLabel, object.label);
  }
});

test('free evidence and fixed-location requirements still gate OSM candidates', () => {
  const eligible = { type: 'node', id: 11, lon: 4, lat: 52, tags: { amenity: 'drinking_water', fee: 'no' } };
  assert.ok(gratisRelationForOsmElement(eligible));
  assert.equal(gratisRelationForOsmElement({ ...eligible, tags: { amenity: 'drinking_water' } }), null);
  assert.equal(toVaskorFeature({ ...eligible, lon: undefined, lat: undefined }), null);
  assert.equal(catalogObjectForTags({ leisure: 'swimming_pool' }), null);
});

test('Overpass query includes selected types and excludes unselected legacy types', () => {
  const query = overpassSearchQuery(4, 52);
  for (const object of allObjects) {
    for (const [key, value] of Object.entries(object.tags)) {
      if (value === '*') assert.ok(query.includes(`["${key}"]`), `${object.id} selector`);
      else if (Array.isArray(value)) for (const item of value) assert.ok(query.includes(`["${key}"="${item}"]`), `${object.id} selector`);
      else assert.ok(query.includes(`["${key}"="${value}"]`), `${object.id} selector`);
    }
  }
  assert.ok(!query.includes('swimming_pool'));
});
