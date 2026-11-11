import test from 'node:test';
import assert from 'node:assert/strict';
import { overpassTrailQuery } from '../knowledge/search-area.mjs';
import { deriveTrailRelations, filterTrailFeatures, toTrailFeatures } from '../knowledge/osm-trails.mjs';

test('trail query covers paths, hiking route relations and nature', () => {
  const query = overpassTrailQuery(5, 52, 20);
  assert.match(query, /highway.*path/);
  assert.match(query, /relation\["route"~"\^\(hiking\|foot\)\$"\]/);
  assert.match(query, /natural/);
  assert.match(query, /out body geom/);
});

test('features retain OSM identity and tags and remove duplicate source objects', () => {
  const way = { type: 'way', id: 12, version: 3, tags: { highway: 'path', name: 'Bosroute' }, geometry: [{ lon: 5, lat: 52 }, { lon: 5.001, lat: 52 }] };
  const features = toTrailFeatures([way, way]);
  assert.equal(features.length, 1);
  assert.equal(features[0].properties.osmSourceId, 'OSM-way-12');
  assert.equal(features[0].properties.tags.name, 'Bosroute');
  assert.equal(features[0].geometry.type, 'LineString');
});

test('route member links are retained and inferred surroundings are marked as candidates', () => {
  const features = toTrailFeatures([
    { type: 'way', id: 12, tags: { highway: 'path' }, geometry: [{ lon: 5, lat: 52 }, { lon: 5.001, lat: 52 }] },
    { type: 'relation', id: 20, tags: { type: 'route', route: 'hiking', name: 'Lus' }, members: [{ type: 'way', ref: 12, role: '' }], geometry: [{ lon: 5, lat: 52 }, { lon: 5.001, lat: 52 }] },
    { type: 'way', id: 30, tags: { landuse: 'forest', name: 'Bos' }, geometry: [{ lon: 5.001, lat: 52 }, { lon: 5.003, lat: 52 }] },
    { type: 'way', id: 40, tags: { amenity: 'picnic_site' }, center: { lon: 5.001, lat: 52 } }
  ]);
  const relations = deriveTrailRelations(features);
  assert.ok(relations.some(relation => relation.predicate.includes('bestaat uit wandelpad') && relation.kind === 'osm_member' && relation.confidence.includes('niet ter plaatse geverifieerd')));
  assert.ok(relations.some(relation => relation.predicate.includes('loopt doorheen') && relation.confidence.includes('onbevestigd')));
  assert.ok(relations.some(relation => relation.predicate.includes('picknickplek ligt in bos')));
  assert.ok(filterTrailFeatures(features, 5, 52, 1).length > 0);
});
