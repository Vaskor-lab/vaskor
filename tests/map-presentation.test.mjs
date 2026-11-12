import test from 'node:test';
import assert from 'node:assert/strict';
import { createPoiMarkerElement, markerIconSvg } from '../knowledge/map-markers.mjs';
import { applyVaskorMapStyle } from '../knowledge/map-style.mjs';

test('water and toilet marker icons share the white pin and VASKOR orange', () => {
  for (const category of ['water', 'toilet']) {
    const svg = markerIconSvg(category);
    assert.match(svg, /fill="#fff"/);
    assert.match(svg, /fill="#E37400"/);
    assert.match(svg, /<path/);
  }
  assert.notEqual(markerIconSvg('water'), markerIconSvg('toilet'));
});

test('POI marker buttons have a readable category label', () => {
  const attributes = {};
  const element = { setAttribute: (key, value) => { attributes[key] = value; } };
  const marker = createPoiMarkerElement({ properties: { category: 'toilet' } }, {
    createElement: tag => { assert.equal(tag, 'button'); return element; }
  });
  assert.equal(marker.type, 'button');
  assert.equal(marker.className, 'poi-marker');
  assert.equal(attributes['aria-label'], 'Toilet op OpenStreetMap');
  assert.match(marker.innerHTML, /E37400/);
});

test('Positron receives the VASKOR palette while retaining its layer structure', () => {
  const layers = [
    { id: 'background', type: 'background', paint: { 'background-color': '#fff' } },
    { id: 'water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': '#aaa' } },
    { id: 'park', type: 'fill', 'source-layer': 'park', paint: { 'fill-color': '#aaa' } },
    { id: 'highway_path', type: 'line', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'path'], paint: { 'line-color': '#aaa' } },
    { id: 'highway_motorway_inner', type: 'line', 'source-layer': 'transportation', filter: ['==', ['get', 'class'], 'motorway'], paint: { 'line-color': '#aaa' } },
    { id: 'place_label', type: 'symbol', paint: { 'text-color': '#aaa', 'text-halo-color': '#fff', 'text-halo-width': 1 } }
  ];
  const changes = [];
  const map = {
    getStyle: () => ({ layers }),
    setPaintProperty: (...change) => changes.push(change)
  };
  assert.equal(applyVaskorMapStyle(map), changes.length);
  assert.ok(changes.some(([id, property, value]) => id === 'water' && property === 'fill-color' && value === '#B7E1E3'));
  assert.ok(changes.some(([id, property, value]) => id === 'park' && property === 'fill-color' && value === '#D5EBD8'));
  assert.ok(changes.some(([id, property, value]) => id === 'highway_path' && property === 'line-color' && value === '#94A7B0'));
  assert.ok(changes.some(([id, property, value]) => id === 'highway_path' && property === 'line-dasharray' && value.join(',') === '1.2,1.6'));
  assert.ok(changes.some(([id, property, value]) => id === 'highway_motorway_inner' && property === 'line-color' && value === '#E5C976'));
  assert.ok(changes.some(([id, property, value]) => id === 'place_label' && property === 'text-color' && value === '#53636C'));
});
