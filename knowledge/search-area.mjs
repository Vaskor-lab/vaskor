const earthRadiusMeters = 6371008.8;
const halfWidthMeters = 15000;
const halfHeightMeters = 30000;

export function searchBounds(longitude, latitude) {
  const latitudeDelta = halfHeightMeters / earthRadiusMeters * 180 / Math.PI;
  const longitudeDelta = halfWidthMeters / (earthRadiusMeters * Math.max(Math.cos(latitude * Math.PI / 180), 1e-12)) * 180 / Math.PI;
  return {
    south: Math.max(-90, latitude - latitudeDelta),
    west: Math.max(-180, longitude - longitudeDelta),
    north: Math.min(90, latitude + latitudeDelta),
    east: Math.min(180, longitude + longitudeDelta)
  };
}

export function searchBoundary(longitude, latitude) {
  const { south, west, north, east } = searchBounds(longitude, latitude);
  return {
    type: "FeatureCollection",
    features: [{
      type: "Feature",
      properties: { widthMeters: halfWidthMeters * 2, heightMeters: halfHeightMeters * 2 },
      geometry: { type: "Polygon", coordinates: [[[west, south], [east, south], [east, north], [west, north], [west, south]]] }
    }]
  };
}

export function isInsideSearchArea(originLongitude, originLatitude, longitude, latitude) {
  const { south, west, north, east } = searchBounds(originLongitude, originLatitude);
  return longitude >= west && longitude <= east && latitude >= south && latitude <= north;
}

export function overpassSearchQuery(longitude, latitude) {
  const { south, west, north, east } = searchBounds(longitude, latitude);
  return `[out:json][timeout:45];(nwr["amenity"="drinking_water"](${south},${west},${north},${east});nwr["amenity"="water_point"](${south},${west},${north},${east});nwr["amenity"="toilets"](${south},${west},${north},${east}););out center;`;
}
