export const DEFAULT_RADIUS_KM = 20;
export const MAX_RADIUS_KM = 50;
export const EARTH_RADIUS_METERS = 6371008.8;

function validateRadius(radiusKm) {
  if (!Number.isFinite(radiusKm) || radiusKm < 1 || radiusKm > MAX_RADIUS_KM) {
    throw new RangeError(`radiusKm must be between 1 and ${MAX_RADIUS_KM}`);
  }
}

export function searchBounds(longitude, latitude, radiusKm = DEFAULT_RADIUS_KM) {
  validateRadius(radiusKm);
  const angularRadius = radiusKm * 1000 / EARTH_RADIUS_METERS;
  const latitudeDelta = angularRadius * 180 / Math.PI;
  const longitudeDelta = latitudeDelta / Math.max(Math.cos(latitude * Math.PI / 180), 1e-12);
  return {
    south: Math.max(-90, latitude - latitudeDelta),
    west: Math.max(-180, longitude - longitudeDelta),
    north: Math.min(90, latitude + latitudeDelta),
    east: Math.min(180, longitude + longitudeDelta)
  };
}

export function searchBoundary(longitude, latitude, radiusKm = DEFAULT_RADIUS_KM) {
  const steps = 96;
  const angularRadius = radiusKm * 1000 / EARTH_RADIUS_METERS;
  const lat1 = latitude * Math.PI / 180;
  const lon1 = longitude * Math.PI / 180;
  const coordinates = Array.from({ length: steps + 1 }, (_, index) => {
    const bearing = 2 * Math.PI * index / steps;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angularRadius) + Math.cos(lat1) * Math.sin(angularRadius) * Math.cos(bearing));
    const lon2 = lon1 + Math.atan2(Math.sin(bearing) * Math.sin(angularRadius) * Math.cos(lat1), Math.cos(angularRadius) - Math.sin(lat1) * Math.sin(lat2));
    return [((lon2 * 180 / Math.PI + 540) % 360) - 180, lat2 * 180 / Math.PI];
  });
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: { radiusMeters: radiusKm * 1000 }, geometry: { type: 'Polygon', coordinates: [coordinates] } }]
  };
}

export function distanceMeters(a, b) {
  const rad = value => value * Math.PI / 180;
  const [lon1, lat1] = a, [lon2, lat2] = b;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function isInsideSearchArea(originLongitude, originLatitude, longitude, latitude, radiusKm = DEFAULT_RADIUS_KM) {
  return distanceMeters([originLongitude, originLatitude], [longitude, latitude]) <= radiusKm * 1000;
}

export function overpassSearchQuery(longitude, latitude, radiusKm = DEFAULT_RADIUS_KM) {
  const { south, west, north, east } = searchBounds(longitude, latitude, radiusKm);
  return `[out:json][timeout:45];(nwr["amenity"="drinking_water"](${south},${west},${north},${east});nwr["amenity"="water_point"](${south},${west},${north},${east});nwr["amenity"="toilets"](${south},${west},${north},${east});nwr["amenity"="shower"](${south},${west},${north},${east});nwr["leisure"="swimming_area"](${south},${west},${north},${east});nwr["leisure"="swimming_pool"](${south},${west},${north},${east});nwr["natural"="beach"](${south},${west},${north},${east}););out center;`;
}
