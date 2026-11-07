import test from 'node:test';
import assert from 'node:assert/strict';
import { isInsideSearchArea, overpassSearchQuery, searchBoundary, searchBounds } from '../knowledge/search-area.mjs';

test('search boundary is 30 km east-west and 60 km north-south from GPS', () => {
  const bounds = searchBounds(0, 0);
  const latitudeKm = (bounds.north - bounds.south) * Math.PI / 180 * 6371.0088;
  const longitudeKm = (bounds.east - bounds.west) * Math.PI / 180 * 6371.0088;
  assert.ok(Math.abs(longitudeKm - 30) < 0.01);
  assert.ok(Math.abs(latitudeKm - 60) < 0.01);

  const area = searchBoundary(0, 0).features[0];
  assert.equal(area.geometry.type, 'Polygon');
  assert.deepEqual(area.properties, { widthMeters: 30000, heightMeters: 60000 });
  assert.equal(area.geometry.coordinates[0].length, 5);
});

test('candidate inclusion and Overpass request use the same rectangular bounds', () => {
  assert.equal(isInsideSearchArea(0, 0, 0.1, 0.2), true);
  assert.equal(isInsideSearchArea(0, 0, 0.2, 0), false);
  assert.equal(isInsideSearchArea(0, 0, 0, 0.3), false);

  const query = overpassSearchQuery(0, 0);
  assert.match(query, /\(\-?0\.\d+,\-?0\.\d+,0\.\d+,0\.\d+\)/);
  assert.equal((query.match(/nwr\[/g) || []).length, 3);
});
