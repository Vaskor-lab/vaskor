import { distanceMeters, isInsideSearchArea } from './search-area.mjs';

const tagsOf = element => element.tags || {};
const isTrail = tags => tags.highway && /^(path|footway|track|bridleway|steps)$/.test(tags.highway);
const isRoute = tags => tags.type === 'route' && /^(hiking|foot)$/.test(tags.route);
const isNature = tags => tags.natural || tags.landuse || tags.waterway || tags.leisure === 'nature_reserve' || tags.leisure === 'park';
const hasCoordinates = point => Number.isFinite(point?.[0]) && Number.isFinite(point?.[1]);

function geometryOf(element, tags) {
  const points = (element.geometry || []).map(point => [point.lon, point.lat]).filter(hasCoordinates);
  if (points.length > 1) {
    const area = (tags.area === 'yes' || tags.natural || tags.landuse || tags.leisure === 'nature_reserve' || tags.leisure === 'park') &&
      points.length >= 4 && points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1];
    return { type: area ? 'Polygon' : 'LineString', coordinates: area ? [points] : points };
  }
  const center = element.center || (Number.isFinite(element.lon) ? element : null);
  return center ? { type: 'Point', coordinates: [center.lon, center.lat] } : null;
}

export function toTrailFeatures(elements = []) {
  const seen = new Set();
  return elements.flatMap(element => {
    const tags = tagsOf(element), trail = isTrail(tags), route = isRoute(tags), nature = Boolean(isNature(tags));
    const category = trail ? 'trail' : route ? 'hiking_route' : tags.amenity === 'picnic_site' ? 'picnic'
      : tags.natural === 'beach' ? 'beach' : tags.tourism === 'viewpoint' ? 'viewpoint'
      : tags.place && /^(city|town|village|hamlet|suburb|neighbourhood)$/.test(tags.place) ? 'built_up' : nature ? 'nature_area' : null;
    if (!category) return [];
    const sourceId = `OSM-${element.type}-${element.id}`;
    if (seen.has(sourceId)) return [];
    seen.add(sourceId);
    const geometry = geometryOf(element, tags);
    if (!geometry) return [];
    return [{ type: 'Feature', geometry, properties: {
      vaskorId: `VASKOR-${sourceId}`, osmSourceId: sourceId, osmType: element.type,
      osmId: element.id, version: element.version, timestamp: element.timestamp,
      category, uncertainty: 'OSM-brondata; niet ter plaatse geverifieerd', tags,
      members: route ? (element.members || []).filter(member => member.type === 'way').map(member => ({ type: member.type, ref: member.ref, role: member.role || '' })) : []
    } }];
  });
}

function anchor(feature) {
  const geometry = feature.geometry;
  if (geometry.type === 'Point') return geometry.coordinates;
  const points = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates;
  return points[Math.floor(points.length / 2)] || null;
}

function vertices(feature) {
  const geometry = feature.geometry;
  return geometry.type === 'Point' ? [geometry.coordinates]
    : geometry.type === 'Polygon' ? geometry.coordinates.flat() : geometry.coordinates;
}

function nearestVertexDistance(a, b) {
  let nearest = Infinity;
  for (const pointA of vertices(a)) for (const pointB of vertices(b)) {
    nearest = Math.min(nearest, distanceMeters(pointA, pointB));
  }
  return nearest;
}

const targetKinds = {
  nature_area: ['forest', 'loopt doorheen'], water_area: ['river_or_water', 'loopt langs'],
  beach: ['beach', 'loopt langs'], viewpoint: ['viewpoint', 'leidt naar'],
  picnic: ['picnic', 'verbindt'], built: ['built_up', 'verbindt']
};

export function deriveTrailRelations(features, maxDistanceMeters = 500) {
  const relations = new Map();
  const add = (from, to, predicate, distance, kind = 'candidate', confidence = 'onbevestigd; afstand is slechts een aanwijzing') => {
    const key = `${from.properties.osmSourceId}|${predicate}|${to.properties.osmSourceId}`;
    if (!relations.has(key)) relations.set(key, { from: from.properties.osmSourceId, to: to.properties.osmSourceId, predicate, kind, distanceMeters: Math.round(distance), confidence });
  };
  for (const route of features.filter(feature => feature.properties.category === 'hiking_route')) {
    const memberRefs = new Set(route.properties.members.map(member => `OSM-way-${member.ref}`));
    for (const trail of features.filter(feature => feature.properties.category === 'trail' && memberRefs.has(feature.properties.osmSourceId))) add(route, trail, 'bestaat uit wandelpad (OSM route-lidmaatschap)', 0, 'osm_member', 'expliciet route-lid in OSM; niet ter plaatse geverifieerd');
    for (const viewpoint of features.filter(feature => feature.properties.category === 'viewpoint')) {
      const distance = nearestVertexDistance(route, viewpoint);
      if (distance <= maxDistanceMeters) add(route, viewpoint, 'voert langs uitzichtpunt (nabijheidskandidaat)', distance);
    }
  }
  for (const trail of features.filter(feature => feature.properties.category === 'trail')) {
    const a = anchor(trail); if (!a) continue;
    for (const target of features) {
      if (target === trail || !anchor(target)) continue;
      const kind = target.properties.category === 'nature_area' ? (target.properties.tags.natural === 'water' || target.properties.tags.waterway ? 'river_or_water' : 'nature_area')
        : target.properties.category === 'picnic' ? 'picnic' : target.properties.category === 'beach' ? 'beach'
        : target.properties.category === 'viewpoint' ? 'viewpoint' : target.properties.category === 'built_up' ? 'built' : null;
      if (!kind || !targetKinds[kind]) continue;
      const distance = nearestVertexDistance(trail, target);
      if (distance <= maxDistanceMeters) add(trail, target, targetKinds[kind][1], distance);
    }
  }
  for (const picnic of features.filter(feature => feature.properties.category === 'picnic')) {
    for (const target of features.filter(feature => ['nature_area', 'beach'].includes(feature.properties.category))) {
      const distance = nearestVertexDistance(picnic, target);
      if (distance > maxDistanceMeters) continue;
      const forest = target.properties.category === 'nature_area' && ['forest', 'wood'].includes(target.properties.tags.landuse || target.properties.tags.natural);
      const water = target.properties.category === 'beach' || target.properties.tags.natural === 'water' || target.properties.tags.waterway;
      if (forest) add(picnic, target, 'picknickplek ligt in bos (nabijheidskandidaat)', distance);
      if (water) add(picnic, target, 'picknickplek ligt aan watergebied (nabijheidskandidaat)', distance);
    }
  }
  for (const beach of features.filter(feature => feature.properties.category === 'beach')) {
    for (const water of features.filter(feature => feature.properties.category === 'nature_area' && (feature.properties.tags.natural === 'water' || feature.properties.tags.waterway))) {
      const distance = nearestVertexDistance(beach, water);
      if (distance <= maxDistanceMeters) add(beach, water, 'strand grenst aan watergebied (nabijheidskandidaat)', distance);
    }
  }
  return [...relations.values()];
}

export function filterTrailFeatures(features, longitude, latitude, radiusKm) {
  const radiusMeters = radiusKm * 1000;
  const toLocal = ([lon, lat]) => [
    (lon - longitude) * Math.PI / 180 * 6371008.8 * Math.cos(latitude * Math.PI / 180),
    (lat - latitude) * Math.PI / 180 * 6371008.8
  ];
  const segmentDistance = (point, start, end) => {
    const p = toLocal(point), a = toLocal(start), b = toLocal(end);
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const denominator = dx * dx + dy * dy;
    const t = denominator ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / denominator)) : 0;
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  return features.filter(feature => {
    const points = vertices(feature);
    if (points.some(point => isInsideSearchArea(longitude, latitude, point[0], point[1], radiusKm))) return true;
    const segments = feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates.flatMap(ring => ring.slice(1).map((point, index) => [ring[index], point]))
      : points.slice(1).map((point, index) => [points[index], point]);
    return segments.some(([start, end]) => segmentDistance([longitude, latitude], start, end) <= radiusMeters);
  });
}
