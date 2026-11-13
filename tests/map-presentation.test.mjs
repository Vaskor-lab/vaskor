import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createPoiMarkerElement, markerIconSvg, MATERIAL_SYMBOL_PATHS } from '../knowledge/map-markers.mjs';
import { applyVaskorMapStyle } from '../knowledge/map-style.mjs';

const iconRoot = new URL('../assets/map-icons/google-material-symbols-rounded/', import.meta.url);

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
  assert.equal(attributes['aria-label'], 'Toilet');
  assert.match(marker.innerHTML, /E37400/);
});

test('unknown categories use a neutral icon instead of the water icon', async () => {
  const sprite = await readFile(new URL('sprite.svg', iconRoot), 'utf8');
  const neutral = sprite.match(/<symbol id="info" viewBox="[^"]+"><path fill="currentColor" d="([^"]+)"\/><\/symbol>/);
  assert.ok(neutral, 'neutral info symbol exists in the approved sprite');
  const unknownSvg = markerIconSvg('unrecognized-category');
  assert.notEqual(unknownSvg, markerIconSvg('water'));
  assert.notEqual(markerIconSvg('unrecognized-category', 'drinking_water'), markerIconSvg('water'));
  assert.ok(unknownSvg.includes(`<path fill="#fff" d="${neutral[1]}"/>`));
});

test('public facility objects use distinct, type-appropriate icons where available', () => {
  const disposal = markerIconSvg('public', 'sanitary_dump_station');
  const picnic = markerIconSvg('public', 'picnic_site');
  const fire = markerIconSvg('public', 'firepit');
  const waste = markerIconSvg('public', 'waste_basket');
  const firstAid = markerIconSvg('public', 'first_aid');
  assert.equal(new Set([disposal, picnic, fire, waste, firstAid]).size, 5);
  assert.equal(markerIconSvg('public', 'firepit'), fire);
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


test('POI markers include the four inline Google Material Symbols paths', () => {
  const symbols = {
    water: 'M480-80q-137 0-228.5-94T160-408q0-62 28-124t70-119q42-57 91-107t91-87q8-8 18.5-11.5T480-860q11 0 21.5 3.5T520-845q42 37 91 87t91 107q42 57 70 119t28 124q0 140-91.5 234T480-80Zm11-120q12-1 20.5-9.5T520-230q0-14-9-22.5t-23-7.5q-41 3-87-22.5T343-375q-2-11-10.5-18t-19.5-7q-14 0-23 10.5t-6 24.5q17 91 80 130t127 35Z',
    toilet: 'M220-120v-260h-20q-17 0-28.5-11.5T160-420v-180q0-33 23.5-56.5T240-680h120q33 0 56.5 23.5T440-600v180q0 17-11.5 28.5T400-380h-20v260q0 17-11.5 28.5T340-80h-80q-17 0-28.5-11.5T220-120Zm80-600q-33 0-56.5-23.5T220-800q0-33 23.5-56.5T300-880q33 0 56.5 23.5T380-800q0 33-23.5 56.5T300-720Zm300 600v-200h-65q-20 0-32-16.5t-5-36.5l84-253q8-26 29.5-40t48.5-14q27 0 48.5 14t29.5 40l84 253q7 20-5 36.5T785-320h-65v200q0 17-11.5 28.5T680-80h-40q-17 0-28.5-11.5T600-120Zm60-600q-33 0-56.5-23.5T580-800q0-33 23.5-56.5T660-880q33 0 56.5 23.5T740-800q0 33-23.5 56.5T660-720Z',
    shower: 'M320-240q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm160 0q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm160 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240ZM240-400q-17 0-28.5-11.5T200-440v-40q0-106 68-184t172-92v-44q0-17 11.5-28.5T480-840q17 0 28.5 11.5T520-800v44q104 14 172 92t68 184v40q0 17-11.5 28.5T720-400H240Zm80 280q-17 0-28.5-11.5T280-160q0-17 11.5-28.5T320-200q17 0 28.5 11.5T360-160q0 17-11.5 28.5T320-120Zm160 0q-17 0-28.5-11.5T440-160q0-17 11.5-28.5T480-200q17 0 28.5 11.5T520-160q0 17-11.5 28.5T480-120Zm160 0q-17 0-28.5-11.5T600-160q0-17 11.5-28.5T640-200q17 0 28.5 11.5T680-160q0 17-11.5 28.5T640-120Z',
    swimming: 'M280-202q-49 0-78 22t-81 31q-17 3-29-8t-12-28q0-17 11.5-28.5T120-230q36-11 68-30.5t92-19.5q38 0 62.5 8.5t45.5 19q21 10.5 42 19.5t50 9q29 0 50-9t42-19.5q21-10.5 46-19t62-8.5q60 0 92 19.5t68 30.5q17 5 28.5 16.5T880-185q0 17-12 28t-29 8q-52-9-81-31t-78-22q-28 0-48.5 8.5t-41 19Q570-164 544.5-155t-64.5 9q-39 0-64.5-9t-46-19.5Q349-185 329-193.5t-49-8.5Zm0-178q-49 0-78 22t-81 31q-17 3-29-8t-12-28q0-17 11.5-28.5T120-408q36-11 68-30.5t92-19.5q38 0 62.5 8.5t45.5 19q21 10.5 42 19.5t50 9q29 0 50-9t42-19.5q21-10.5 46-19t62-8.5q60 0 92 19.5t68 30.5q17 5 28.5 16.5T880-363q0 17-12 28t-29 8q-52-9-81-31t-78-22q-29 0-49.5 8.5t-41 19Q569-342 544-333t-64 9q-39 0-64.5-9t-46-19.5Q349-363 329-371.5t-49-8.5Zm0-178q-49 0-78 22t-81 31q-17 3-29-8t-12-28q0-17 11.5-28.5T120-586q36-11 68-30.5t92-19.5q38 0 62.5 8.5t45.5 19q21 10.5 42 19.5t50 9q29 0 50-9t42-19.5q21-10.5 46-19t62-8.5q60 0 92 19.5t68 30.5q17 5 28.5 16.5T880-541q0 17-12 28t-29 8q-52-9-81-31t-78-22q-28 0-48.5 8.5t-41 19Q570-520 544.5-511t-64.5 9q-39 0-64.5-9t-46-19.5Q349-541 329-549.5t-49-8.5Zm0-178q-49 0-78 22t-81 31q-17 3-29-8t-12-28q0-17 11.5-28.5T120-764q36-11 68-30.5t92-19.5q38 0 62.5 8.5t45.5 19q21 10.5 42 19.5t50 9q29 0 50-9t42-19.5q21-10.5 46-19t62-8.5q60 0 92 19.5t68 30.5q17 5 28.5 16.5T880-719q0 17-12 28t-29 8q-52-9-81-31t-78-22q-28 0-48.5 8.5t-41 19Q570-698 544.5-689t-64.5 9q-39 0-64.5-9t-46-19.5Q349-719 329-727.5t-49-8.5Z',
  };
  for (const [category, path] of Object.entries(symbols)) {
    const svg = markerIconSvg(category);
    assert.ok(svg.includes(`<path fill="#fff" d="${path}"/>`), `${category} symbol is inline`);
    assert.doesNotMatch(svg, /<use\\b/);
  }
});

test('all seven category markers use inline paths from the approved symbol manifest and sprite', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', iconRoot), 'utf8'));
  const sprite = await readFile(new URL('sprite.svg', iconRoot), 'utf8');
  const manifestNames = new Set(manifest.icons.map(icon => icon.name));
  const symbols = {
    orientation: 'travel_explore', shelter: 'cabin', public: 'public',
    transport: 'directions_bus', nature: 'landscape', sport: 'sports_soccer', safety: 'health_and_safety'
  };
  const categorySvgs = Object.keys(symbols).map(category => markerIconSvg(category));
  assert.equal(new Set(categorySvgs).size, 7, 'each main category has its own recognizable symbol');
  for (const [category, symbol] of Object.entries(symbols)) {
    assert.ok(manifestNames.has(symbol), `${symbol} is in the approved manifest`);
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = sprite.match(new RegExp(`<symbol id="${escaped}" viewBox="[^"]+"><path fill="currentColor" d="([^"]+)"/></symbol>`));
    assert.ok(match, `${symbol} path is in the approved sprite`);
    const svg = markerIconSvg(category);
    assert.ok(svg.includes(`<path fill="#fff" d="${match[1]}"/>`), `${category} embeds its exact sprite path`);
    assert.doesNotMatch(svg, /<text\b|font-family|font-variation-settings|<use\b/);
  }
});

test('type-specific public facility paths also come from the approved sprite and have no runtime dependency', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', iconRoot), 'utf8'));
  const sprite = await readFile(new URL('sprite.svg', iconRoot), 'utf8');
  const markerSource = await readFile(new URL('../knowledge/map-markers.mjs', import.meta.url), 'utf8');
  const names = new Set(manifest.icons.map(icon => icon.name));
  const symbols = {
    sanitary_dump_station: 'cleaning_services', picnic_site: 'restaurant', firepit: 'local_fire_department',
    waste_basket: 'recycling', first_aid: 'medical_services'
  };
  for (const [type, symbol] of Object.entries(symbols)) {
    assert.ok(names.has(symbol), `${symbol} is in the approved manifest`);
    const match = sprite.match(new RegExp(`<symbol id="${symbol}" viewBox="[^"]+"><path fill="currentColor" d="([^"]+)"/></symbol>`));
    assert.ok(match, `${symbol} path is in the approved sprite`);
    assert.ok(markerIconSvg('public', type).includes(`<path fill="#fff" d="${match[1]}"/>`), `${type} embeds ${symbol}`);
  }
  assert.doesNotMatch(markerSource, /fonts\.googleapis|font-family|font-variation-settings|<text\b|<use\b|https?:\/\//);
});

test('every embedded symbol path is present in the approved manifest and sprite', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', iconRoot), 'utf8'));
  const sprite = await readFile(new URL('sprite.svg', iconRoot), 'utf8');
  const names = new Set(manifest.icons.map(icon => icon.name));
  for (const [symbol, path] of Object.entries(MATERIAL_SYMBOL_PATHS)) {
    assert.ok(names.has(symbol), `${symbol} is in the approved manifest`);
    const start = sprite.indexOf(`<symbol id="${symbol}" `);
    const end = sprite.indexOf('</symbol>', start);
    assert.ok(start >= 0 && end > start && sprite.slice(start, end).includes(`d="${path}"`), `${symbol} path is in the approved sprite`);
  }
});
