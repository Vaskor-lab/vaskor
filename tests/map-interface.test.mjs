import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const markers = await readFile(new URL('../knowledge/map-markers.mjs', import.meta.url), 'utf8');

test('map hides redundant copy and removes the full field test UI and logic', async () => {
  assert.doesNotMatch(page, /Exporteer veldtest|export-data|field-pilot|saveFieldObservation|VASKOR<\/h1>|\$\{features\.length\}/i);
  assert.doesNotMatch(markers, /op OpenStreetMap/);
  await assert.rejects(readFile(new URL('../knowledge/pilot.mjs', import.meta.url)));
  await assert.rejects(readFile(new URL('./pilot-storage.test.mjs', import.meta.url)));
  assert.match(page, /\.status\{position:absolute;width:1px;height:1px/);
  assert.doesNotMatch(page, /<div class="search-boundary"/);
  assert.match(page, /map\.addSource\("search-boundary"/);
  assert.match(page, /attributionControl:\{compact:false\}/);
  assert.match(page, /\.maplibregl-ctrl-attrib\{font-size:9px!important/);
});

test('location switch starts tracking only on activation and stops cleanly when off', () => {
  assert.match(page, /role="switch" aria-checked="false" aria-label="Locatie uit"/);
  assert.match(page, /navigator\.geolocation\.watchPosition/);
  assert.match(page, /navigator\.geolocation\.clearWatch/);
  assert.match(page, /setLocationSwitch\(false\)/);
  assert.match(page, /min-height:56px/);
  const searchHandler = page.match(/searchButton\.addEventListener\("click",\(\)=>\{([\s\S]*?)\n \}\);/)?.[1];
  assert.ok(searchHandler);
  assert.ok(searchHandler.includes('aria-checked') && searchHandler.includes('Schakel Locatie in om voorzieningen te zoeken.'));
  assert.ok(searchHandler.indexOf('aria-checked') < searchHandler.indexOf('navigator.geolocation.getCurrentPosition'));
});

test('map supports single-finger pan and pinch while marker remains geographically anchored', () => {
  assert.match(page, /cooperativeGestures:false/);
  assert.match(page, /touch-action:none/);
  assert.match(page, /new ml\.Marker\(\{element:el,anchor:"center",rotationAlignment:"viewport"\}\)\.setLngLat\(point\)/);
  const positionUpdate = page.match(/const updatePosition=\(\{coords\}\)=>\{([\s\S]*?)\n \};/)?.[1];
  assert.ok(positionUpdate);
  assert.match(positionUpdate, /setLocationMarker\(coords\)/);
  assert.doesNotMatch(positionUpdate, /easeTo/);
});

test('blue location marker shows only available heading plus GPS accuracy', () => {
  assert.match(page, /coords\.heading/);
  assert.match(page, /DeviceOrientationEvent/);
  assert.match(page, /requestPermission\(\)/);
  assert.match(page, /event\.absolute!==true/);
  assert.match(page, /else el\.classList\.remove\("has-heading"\)/);
  assert.match(page, /location-accuracy-fill/);
});

test('search radius, explicit search, map style, and fixed facility markers remain', () => {
  assert.match(page, /id="search-radius"/);
  assert.match(page, /value="20" selected>20 km/);
  assert.match(page, /value="50">50 km/);
  assert.match(page, /id="search-osm"/);
  assert.match(page, /applyVaskorMapStyle\(map\)/);
  assert.match(page, /renderPoiMarkers\(\)/);
});
