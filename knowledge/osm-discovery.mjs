export function classifyOsmTags(tags = {}) {
  if (tags.amenity === 'toilets') return 'toilet';
  if (tags.amenity === 'shower') return 'shower';
  if (tags.leisure === 'swimming_area' || tags.leisure === 'swimming_pool') return 'swimming';
  if (tags.amenity === 'drinking_water' || tags.amenity === 'water_point') return 'water';
  return null;
}

export function toVaskorFeature(element) {
  const tags = element.tags || {};
  const longitude = element.lon ?? element.center?.lon;
  const latitude = element.lat ?? element.center?.lat;
  const category = classifyOsmTags(tags);
  if (!category || !Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  const osmType = element.type;
  const osmId = element.id;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [longitude, latitude] },
    properties: {
      vaskorId: `VASKOR-OSM-${osmType}-${osmId}`,
      osmSourceId: `OSM-${osmType}-${osmId}`,
      osmType, osmId, version: element.version, timestamp: element.timestamp,
      category, tags
    }
  };
}

export function categoryLabel(category) {
  return ({ water: 'Drinkwatervoorziening', toilet: 'Toilet', shower: 'Douche', swimming: 'Openbare zwemplek' })[category] || 'Voorziening';
}
