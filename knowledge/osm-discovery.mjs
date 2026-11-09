import { distanceMeters } from './search-area.mjs';

export function classifyOsmTags(tags = {}) {
  if (tags.amenity === 'toilets') return 'toilet';
  if (tags.amenity === 'shower') return 'shower';
  if (tags.leisure === 'swimming_area' || tags.leisure === 'swimming_pool' || tags.natural === 'beach') return 'swimming';
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

export function relationsForFeature(feature, features, dataset, candidateDistanceMeters = 500) {
  const sourceId = feature.properties.osmSourceId;
  const objectIds = new Set(dataset.knowledge_objects.map(object => object.id));
  const sourceIds = new Set(dataset.source_representations.map(source => source.id));
  const recorded = dataset.relations.flatMap(relation => {
    const sourceIsEndpoint = relation.subject_id === sourceId || relation.object_id === sourceId;
    if (!sourceIsEndpoint) return [];
    const otherId = relation.subject_id === sourceId ? relation.object_id : relation.subject_id;
    if (!objectIds.has(otherId) && !sourceIds.has(otherId)) return [];
    const relatedObject = dataset.knowledge_objects.find(object => object.id === otherId);
    const relatedSource = dataset.source_representations.find(source => source.id === otherId);
    return [{ kind: 'recorded', predicate: relation.predicate, id: otherId, label: relatedObject?.label || `${relatedSource.provider}: ${relatedSource.record_id}` }];
  });
  const candidates = features.flatMap(other => {
    if (other.properties.vaskorId === feature.properties.vaskorId) return [];
    const distance = Math.round(distanceMeters(feature.geometry.coordinates, other.geometry.coordinates));
    if (distance > candidateDistanceMeters) return [];
    return [{ kind: 'candidate', predicate: 'nearby', id: other.properties.vaskorId, label: other.properties.tags.name || categoryLabel(other.properties.category), distanceMeters: distance }];
  }).sort((a, b) => a.distanceMeters - b.distanceMeters);
  return { recorded, candidates };
}

export function categoryLabel(category) {
  return ({ water: 'Drinkwatervoorziening', toilet: 'Toilet', shower: 'Douche', swimming: 'Openbare zwemplek' })[category] || 'Voorziening';
}
