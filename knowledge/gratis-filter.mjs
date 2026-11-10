function isNoChargeValue(value) {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'no' || normalized === 'free' || /^0(?:[.,]0+)?$/.test(normalized);
}

/** OSM's explicit no-charge tags establish a traceable, search-time GRATIS relation. */
export function gratisRelationForOsmElement(element) {
  const tags = element?.tags || {};
  const fee = typeof tags.fee === 'string' ? tags.fee.trim().toLowerCase() : undefined;
  const charge = typeof tags.charge === 'string' ? tags.charge.trim().toLowerCase() : undefined;
  const evidence = Object.fromEntries([['fee', fee], ['charge', charge]].filter(([, value]) => value !== undefined));
  const hasNoChargeValue = Object.values(evidence).some(isNoChargeValue);
  if (!hasNoChargeValue || Object.values(evidence).some(value => !isNoChargeValue(value))) return null;
  if (tags['fee:conditional'] || tags['charge:conditional']) return null;
  if (!['node', 'way', 'relation'].includes(element?.type) || !Number.isSafeInteger(element?.id)) return null;

  const sourceId = `OSM-${element.type}-${element.id}`;
  return {
    id: `${sourceId}-REL-GRATIS`,
    subject_id: sourceId,
    predicate: 'qualifies_as',
    object_id: 'GRATIS',
    evidence: { source: 'OpenStreetMap', record_id: `${element.type}/${element.id}`, tags: evidence }
  };
}

export function filterGratisOsmElements(elements) {
  if (!Array.isArray(elements)) return [];
  return elements.filter(element => gratisRelationForOsmElement(element) !== null);
}

