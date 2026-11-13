import test from 'node:test';
import assert from 'node:assert/strict';
import { OSM_CATALOGUE, catalogObjectForTags, toVaskorFeature } from '../knowledge/osm-discovery.mjs';
import { filterGratisOsmElements, gratisRelationForOsmElement } from '../knowledge/gratis-filter.mjs';
import { overpassSearchQuery } from '../knowledge/search-area.mjs';

const allObjects = OSM_CATALOGUE.flatMap(section => section.objects.map(([id, label, tags]) => ({ id, label, tags })));
const tagsFor = object => Object.fromEntries(Object.entries(object.tags).map(([key, value]) => [key, value === '*' ? 'slide' : Array.isArray(value) ? value[0] : value]));
const acceptedFeatures = element => filterGratisOsmElements([element]).flatMap(candidate => {
  const feature = toVaskorFeature(candidate);
  if (feature) feature.properties.gratisRelation = gratisRelationForOsmElement(candidate);
  return feature ? [feature] : [];
});

test('catalogue has seven sections and only object tags with an independent fixed identity', () => {
  assert.deepEqual(OSM_CATALOGUE.map(section => section.id), ['orientation', 'shelter', 'public', 'transport', 'nature', 'sport', 'safety']);
  assert.equal(allObjects.length, 67);
  assert.equal(new Set(allObjects.map(object => object.id)).size, 67);
  assert.equal(catalogObjectForTags({ 'addr:housenumber': '12', 'addr:street': 'Main Street' }).id, 'address');
  assert.equal(catalogObjectForTags({ sport: 'climbing' }).id, 'climbing', 'OSM maps climbing sites on their physical feature');
  assert.equal(catalogObjectForTags({ playground: 'slide' }).id, 'playground_equipment', 'OSM maps individual play devices as separate features');
  assert.equal(catalogObjectForTags({ leisure: 'pitch' }).id, 'pitch', 'a pitch is its own marked sport area');
});

test('each retained type requires a node location and explicit, consistent free evidence', () => {
  for (const [index, object] of allObjects.entries()) {
    const tags = tagsFor(object);
    const id = index + 1;
    const freeNode = { type: 'node', id, lon: 4, lat: 52, tags: { ...tags, fee: 'no' } };
    const feature = acceptedFeatures(freeNode)[0];
    assert.ok(feature, `${object.id}: own node coordinates and fee=no should be admitted`);
    assert.equal(feature.properties.catalogType, object.id);
    assert.deepEqual(feature.geometry.coordinates, [4, 52]);
    assert.deepEqual(feature.properties.gratisRelation, {
      id: `OSM-node-${id}-REL-GRATIS`,
      subject_id: `OSM-node-${id}`,
      predicate: 'qualifies_as',
      object_id: 'GRATIS',
      evidence: { source: 'OpenStreetMap', record_id: `node/${id}`, tags: { fee: 'no' } }
    });

    for (const priceTags of [
      {}, { fee: 'yes' }, { fee: 'no', charge: '2 EUR' },
      { fee: 'no', 'fee:conditional': 'yes @ (Mo-Fr)' },
      { charge: '0', 'charge:conditional': 'yes' }
    ]) {
      assert.deepEqual(acceptedFeatures({ ...freeNode, tags: { ...tags, ...priceTags } }), [], `${object.id}: price tags ${JSON.stringify(priceTags)} must be excluded`);
    }

    for (const [kind, location] of [
      ['way', { center: { lon: 4, lat: 52 } }],
      ['way', { geometry: [{ lon: 4, lat: 52 }, { lon: 4.1, lat: 52.1 }] }],
      ['relation', { center: { lon: 4, lat: 52 } }],
      ['relation', { geometry: [{ lon: 4, lat: 52 }, { lon: 4.1, lat: 52.1 }] }]
    ]) {
      assert.deepEqual(acceptedFeatures({ type: kind, id: 1000 + id, tags: { ...tags, fee: 'no' }, ...location }), [], `${object.id}: ${kind} with derived center/direct geometry is not an own point location`);
    }
  }
});

test('location validation rejects missing, non-finite, and out-of-range node coordinates', () => {
  const tags = { amenity: 'drinking_water', fee: 'no' };
  for (const location of [{}, { lon: 4 }, { lat: 52 }, { lon: NaN, lat: 52 }, { lon: 181, lat: 52 }, { lon: 4, lat: 91 }]) {
    assert.equal(toVaskorFeature({ type: 'node', id: 1, tags, ...location }), null);
  }
  assert.equal(toVaskorFeature({ type: 'way', id: 1, tags, lon: 4, lat: 52 }), null);
  assert.equal(toVaskorFeature({ type: 'relation', id: 1, tags, lon: 4, lat: 52 }), null);
});

test('Overpass query requests only node records with their own coordinates', () => {
  const query = overpassSearchQuery(4, 52);
  assert.match(query, /\bout body;/);
  assert.doesNotMatch(query, /\bnwr\b|\bout center;/);
  assert.match(query, /node\["addr:housenumber"\]\["addr:street"\]/);
  for (const object of allObjects) {
    for (const [key, value] of Object.entries(object.tags)) {
      if (value === '*') assert.ok(query.includes(`["${key}"]`), `${object.id} selector`);
      else if (Array.isArray(value)) for (const item of value) assert.ok(query.includes(`["${key}"="${item}"]`), `${object.id} selector`);
      else assert.ok(query.includes(`["${key}"="${value}"]`), `${object.id} selector`);
    }
  }
});
