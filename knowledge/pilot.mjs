export function emptyPilotDataset() {
  return {
    model_version: '1.0',
    type_definitions: [
      { id: 'PILOT-TYPE-WATER', label: 'Drinking-water provision', properties: ['observed_present'] },
      { id: 'PILOT-TYPE-SANITARY', label: 'Sanitary facility', properties: ['observed_present'] },
      { id: 'PILOT-TYPE-SHOWER', label: 'Shower facility', properties: ['observed_present'] },
      { id: 'PILOT-TYPE-SWIMMING', label: 'Public swimming place', properties: ['observed_present'] }
    ],
    knowledge_objects: [],
    source_representations: [],
    claims: [],
    relations: []
  };
}

export function addFieldObservation(dataset, observation) {
  const { category, osmType, osmId, name, coordinates, observedAt, observationLocation, accuracyMeters, distanceMeters, createId } = observation;
  if (!['water', 'sanitary', 'toilet', 'shower', 'swimming'].includes(category)) throw new TypeError('category must be water, toilet, shower or swimming');
  if (!Array.isArray(coordinates) || coordinates.length !== 2 || coordinates.some(value => !Number.isFinite(value))) {
    throw new TypeError('coordinates must contain longitude and latitude');
  }
  const objectId = `VASKOR-OSM-${osmType}-${osmId}`;
  const fieldSourceId = `PILOT-FIELD-${createId()}`;
  const osmSourceId = `OSM-${osmType}-${osmId}`;
  const typeId = category === 'shower' ? 'PILOT-TYPE-SHOWER' : category === 'swimming' ? 'PILOT-TYPE-SWIMMING' : ['sanitary', 'toilet'].includes(category) ? 'PILOT-TYPE-SANITARY' : 'PILOT-TYPE-WATER';
  const claimId = `PILOT-CLAIM-${createId()}`;

  if (!dataset.source_representations.some(item => item.id === osmSourceId)) {
    dataset.source_representations.push({ id: osmSourceId, provider: 'OpenStreetMap', record_id: `${osmType}/${osmId}` });
  }
  dataset.source_representations.push({ id: fieldSourceId, provider: 'VASKOR field observation', record_id: observedAt });
  const fallbackLabel = ({ sanitary: 'Sanitaire voorziening', toilet: 'Toilet', shower: 'Douche', swimming: 'Openbare zwemplek', water: 'Drinkwaterpunt' })[category];
  if (!dataset.knowledge_objects.some(object => object.id === objectId)) {
    dataset.knowledge_objects.push({ id: objectId, label: name || fallbackLabel, type_id: typeId, domain: 'travel' });
  }
  dataset.claims.push({
    id: claimId,
    subject_id: objectId,
    property: 'observed_present',
    value: true,
    source_ids: [fieldSourceId],
    support: `Field observation on ${observedAt}; visitor confirmed the facility was physically visible. OSM candidate: ${coordinates[1]}, ${coordinates[0]}.${observationLocation ? ` Phone GPS: ${observationLocation[1]}, ${observationLocation[0]} (accuracy ${accuracyMeters} m; ${distanceMeters} m from candidate).` : ''}`,
    temporal_context: observedAt
  });
  dataset.relations.push({
    id: `PILOT-RELATION-${createId()}`,
    subject_id: osmSourceId,
    predicate: 'represents',
    object_id: objectId,
    supporting_claim_ids: [claimId]
  });
  return dataset;
}

export function saveFieldObservation(dataset, observation, storage) {
  const nextDataset = structuredClone(dataset);
  addFieldObservation(nextDataset, observation);
  storage.setItem('vaskor-knowledge-pilot-v1', JSON.stringify(nextDataset));
  return nextDataset;
}
