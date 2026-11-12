import test from 'node:test';
import assert from 'node:assert/strict';
import { overpassNatureQuery, overpassTrailQuery } from '../knowledge/search-area.mjs';
import { addTrailLayers, countRouteMemberLinks, deriveTrailRelations, filterTrailFeatures, setTrailSourceData, toTrailFeatures, trailLayerDefinitions } from '../knowledge/osm-trails.mjs';

test('trail and nature queries are scoped independently', () => {
  const query = overpassTrailQuery(5, 52, 20);
  assert.match(query, /highway.*path/);
  assert.match(query, /relation\["route"~"\^\(hiking\|foot\)\$"\]/);
  assert.doesNotMatch(query, /landuse|natural|waterway|picnic_site|viewpoint/);
  const nature = overpassNatureQuery(5, 52, 20);
  assert.match(nature, /natural/);
  assert.match(nature, /landuse"="forest/);
  assert.match(nature, /waterway/);
  assert.doesNotMatch(nature, /highway|\["place"|picnic_site|viewpoint|meadow|grass|"park"/);
  assert.match(query, /out body geom/);
  assert.match(nature, /out body geom/);
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
  assert.equal(countRouteMemberLinks(features), 1);
  assert.ok(relations.some(relation => relation.predicate.includes('bestaat uit wandelpad') && relation.kind === 'osm_member' && relation.confidence.includes('niet ter plaatse geverifieerd')));
  assert.ok(relations.some(relation => relation.predicate.includes('loopt doorheen') && relation.confidence.includes('onbevestigd')));
  assert.ok(relations.some(relation => relation.predicate.includes('picknickplek ligt in bos')));
  assert.ok(filterTrailFeatures(features, 5, 52, 1).length > 0);
});

test('fast route-link count ignores inferred pairwise proximity work', () => {
  const features = toTrailFeatures([
    { type: 'way', id: 201, tags: { highway: 'path' }, geometry: [{ lon: 5, lat: 52 }, { lon: 5.001, lat: 52 }] },
    { type: 'relation', id: 202, tags: { type: 'route', route: 'hiking' }, members: [{ type: 'way', ref: 201, role: '' }], geometry: [{ lon: 5, lat: 52 }, { lon: 5.001, lat: 52 }] },
    { type: 'way', id: 203, tags: { landuse: 'forest' }, geometry: [{ lon: 5, lat: 52 }, { lon: 5.002, lat: 52 }, { lon: 5.002, lat: 52.002 }, { lon: 5, lat: 52.002 }, { lon: 5, lat: 52 }] }
  ]);
  assert.equal(countRouteMemberLinks(features), 1);
  assert.equal(countRouteMemberLinks(features.filter(feature => feature.properties.category === 'nature_area')), 0);
});

test('center-only ways become point candidates and crossing ways survive radius filtering', () => {
  const features = toTrailFeatures([
    { type: 'way', id: 51, tags: { highway: 'path' }, center: { lon: 5, lat: 52 } },
    { type: 'way', id: 52, tags: { highway: 'path' }, geometry: [{ lon: 4.99, lat: 52 }, { lon: 5.01, lat: 52 }] }
  ]);
  assert.equal(features[0].geometry.type, 'Point');
  assert.equal(filterTrailFeatures(features, 5, 52, 1).length, 2);
});

test('route relations without top-level geometry retain member lines without joining gaps', () => {
  const features = toTrailFeatures([{
    type: 'relation', id: 71, tags: { type: 'route', route: 'hiking', name: 'Gesegmenteerde route' },
    members: [
      { type: 'way', ref: 1, role: '', geometry: [{ lon: 5, lat: 52 }, { lon: 5.001, lat: 52 }] },
      { type: 'way', ref: 2, role: '', geometry: [{ lon: 5.01, lat: 52 }, { lon: 5.011, lat: 52 }] }
    ]
  }]);
  assert.equal(features.length, 1);
  assert.equal(features[0].geometry.type, 'MultiLineString');
  assert.equal(features[0].geometry.coordinates.length, 2);
  assert.equal(filterTrailFeatures(features, 5, 52, 1).length, 1);
});

test('line and polygon fixtures reach the MapLibre GeoJSON source and visible layers', () => {
  const features = toTrailFeatures([
    { type: 'way', id: 81, tags: { highway: 'path', name: 'Bospaadje' }, geometry: [{ lon: 5, lat: 52 }, { lon: 5.001, lat: 52 }] },
    { type: 'way', id: 82, tags: { landuse: 'forest', name: 'Bos' }, geometry: [{ lon: 5, lat: 52 }, { lon: 5.002, lat: 52 }, { lon: 5.002, lat: 52.002 }, { lon: 5, lat: 52.002 }, { lon: 5, lat: 52 }] }
  ]);
  let sourceData;
  const addedLayers = [];
  const map = {
    getSource: id => id === 'osm-trails' ? { setData: data => { sourceData = data; } } : undefined,
    addLayer: layer => addedLayers.push(layer),
    on: () => {},
    getCanvas: () => ({ style: {} })
  };

  setTrailSourceData(map, features);
  addTrailLayers(map);

  assert.equal(sourceData.type, 'FeatureCollection');
  assert.ok(sourceData.features.some(feature => feature.geometry.type === 'LineString'));
  assert.ok(sourceData.features.some(feature => feature.geometry.type === 'Polygon'));
  assert.deepEqual(addedLayers, trailLayerDefinitions);
  assert.ok(addedLayers.some(layer => layer.id === 'osm-trail-lines' && layer.source === 'osm-trails'));
  assert.ok(addedLayers.some(layer => layer.id === 'osm-nature-fill' && layer.source === 'osm-trails'));
  assert.ok(addedLayers.some(layer => layer.id === 'osm-nature-lines' && layer.source === 'osm-trails'));
  assert.equal(addedLayers.find(layer => layer.id === 'osm-trail-lines').paint['line-color'], '#176B45');
  assert.ok(addedLayers.every(layer => layer.layout?.visibility !== 'none'));
});

test('nature polygon containing the search center survives even when its boundary is outside the radius', () => {
  const [forest] = toTrailFeatures([{
    type: 'way', id: 91, tags: { landuse: 'forest', name: 'Groot bos' },
    geometry: [
      { lon: 4.98, lat: 51.98 }, { lon: 5.02, lat: 51.98 },
      { lon: 5.02, lat: 52.02 }, { lon: 4.98, lat: 52.02 },
      { lon: 4.98, lat: 51.98 }
    ]
  }]);
  assert.equal(filterTrailFeatures([forest], 5, 52, 1).length, 1);
});

test('nature multipolygon relations assemble member rings and retain inner holes', () => {
  const [forest] = toTrailFeatures([{
    type: 'relation', id: 92, tags: { type: 'multipolygon', landuse: 'forest', name: 'Bos met open plek' },
    members: [
      { type: 'way', ref: 101, role: 'outer', geometry: [{ lon: 4.99, lat: 51.99 }, { lon: 5.01, lat: 51.99 }, { lon: 5.01, lat: 52.01 }, { lon: 4.99, lat: 52.01 }, { lon: 4.99, lat: 51.99 }] },
      { type: 'way', ref: 102, role: 'inner', geometry: [{ lon: 4.999, lat: 51.999 }, { lon: 5.001, lat: 51.999 }, { lon: 5.001, lat: 52.001 }, { lon: 4.999, lat: 52.001 }, { lon: 4.999, lat: 51.999 }] }
    ]
  }]);
  assert.equal(forest.geometry.type, 'Polygon');
  assert.equal(forest.geometry.coordinates.length, 2);
  assert.equal(filterTrailFeatures([forest], 5, 52, 0.05).length, 0);
  assert.equal(filterTrailFeatures([forest], 5.005, 52, 0.05).length, 1);
});

