#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ID = /^[A-Za-z][A-Za-z0-9._:-]*$/;
const COLLECTIONS = ['type_definitions', 'knowledge_objects', 'source_representations', 'claims', 'relations'];

function hasValue(value) {
  if (value === null || value === undefined || value === '') return false;
  if (Array.isArray(value)) return value.length > 0 && value.every(hasValue);
  if (typeof value === 'object') return Object.keys(value).length > 0 && Object.values(value).every(hasValue);
  return true;
}

function containsEmpty(value) {
  if (value === null || value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.some(containsEmpty);
  if (typeof value === 'object') return Object.values(value).some(containsEmpty);
  return false;
}

export function validateDataset(data) {
  const errors = [];
  const warnings = [];
  const records = new Map();
  const add = (list, code, path, message) => list.push({ code, path, message });

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { errors: [{ code: 'dataset.invalid', path: '$', message: 'Dataset moet een JSON-object zijn.' }], warnings };
  }
  if (data.model_version !== '1.0') add(errors, 'model.version', '$.model_version', 'model_version moet "1.0" zijn.');
  for (const field of Object.keys(data)) {
    if (!['model_version', ...COLLECTIONS].includes(field)) add(warnings, 'dataset.extra_field', `$.${field}`, 'Onbekend datasetveld; niet door v1.0 gevalideerd.');
  }
  for (const collection of COLLECTIONS) {
    if (!Array.isArray(data[collection])) {
      add(errors, 'collection.required', `$.${collection}`, 'Verwacht een array.');
      continue;
    }
    data[collection].forEach((record, index) => {
      const path = `$.${collection}[${index}]`;
      if (!record || typeof record !== 'object' || Array.isArray(record)) {
        add(errors, 'record.invalid', path, 'Record moet een JSON-object zijn.');
        return;
      }
      if (typeof record.id !== 'string' || !ID.test(record.id)) add(errors, 'id.invalid', `${path}.id`, 'ID moet een niet-lege, geldige identifier zijn.');
      else if (records.has(record.id)) add(errors, 'id.duplicate', `${path}.id`, `ID is al gebruikt in ${records.get(record.id)}.`);
      else records.set(record.id, collection);
      for (const [key, value] of Object.entries(record)) if (containsEmpty(value)) add(errors, 'value.empty', `${path}.${key}`, 'null en lege tekstwaarden zijn niet toegestaan; laat onbekende informatie weg of gebruik state=unknown.');
    });
  }
  const lookup = (id, collection, path) => {
    if (typeof id !== 'string' || records.get(id) !== collection) {
      add(errors, 'reference.invalid', path, `Verwijzing moet naar een bestaand record in ${collection} wijzen.`);
      return false;
    }
    return true;
  };
  const claimById = new Map((data.claims || []).filter(x => x && typeof x.id === 'string').map(x => [x.id, x]));
  const typeById = new Map((data.type_definitions || []).filter(x => x && typeof x.id === 'string').map(x => [x.id, x]));
  (data.type_definitions || []).forEach((type, i) => {
    if (typeof type.label !== 'string' || !type.label.trim()) add(errors, 'type.label_required', `$.type_definitions[${i}].label`, 'Typebeschrijving vereist een label.');
    if (!Array.isArray(type.properties) || type.properties.some(property => typeof property !== 'string' || !property) || new Set(type.properties).size !== type.properties.length) add(errors, 'type.properties_invalid', `$.type_definitions[${i}].properties`, 'properties moet een lijst unieke, niet-lege eigenschapsnamen bevatten.');
  });
  (data.knowledge_objects || []).forEach((object, i) => {
    const p = `$.knowledge_objects[${i}]`;
    if (typeof object.label !== 'string' || !object.label.trim()) add(errors, 'object.label_required', `${p}.label`, 'Kennisobject vereist een herkenbare beschrijving.');
    lookup(object.type_id, 'type_definitions', `${p}.type_id`);
  });
  (data.source_representations || []).forEach((item, i) => {
    const p = `$.source_representations[${i}]`;
    if (typeof item.provider !== 'string' || !item.provider.trim() || (typeof item.record_id !== 'string' && typeof item.record_id !== 'number') || item.record_id === '') add(errors, 'source.identity_required', p, 'Bronrepresentatie vereist provider en record_id.');
  });
  (data.claims || []).forEach((claim, i) => {
    const p = `$.claims[${i}]`;
    lookup(claim.subject_id, 'knowledge_objects', `${p}.subject_id`);
    if (typeof claim.property !== 'string' || !claim.property.trim()) add(errors, 'claim.property_required', `${p}.property`, 'Een bewering vereist een eigenschap.');
    const subject = (data.knowledge_objects || []).find(object => object?.id === claim.subject_id);
    const subjectType = subject && typeById.get(subject.type_id);
    if (subjectType && Array.isArray(subjectType.properties) && !subjectType.properties.includes(claim.property)) add(errors, 'claim.property_not_in_type', `${p}.property`, `Eigenschap staat niet in typebeschrijving ${subject.type_id}.`);
    const valueOk = hasValue(claim.value) && !(typeof claim.value === 'object' && !Array.isArray(claim.value) && claim.value.state !== 'unknown' && Object.keys(claim.value).length === 1);
    if (!valueOk) add(errors, 'claim.value_required', `${p}.value`, 'Waarde vereist; expliciet onbekend gebruikt {"state":"unknown"}.');
    if (claim.value && typeof claim.value === 'object' && !Array.isArray(claim.value) && 'state' in claim.value && claim.value.state !== 'unknown') add(errors, 'claim.unknown_state', `${p}.value.state`, 'De enige ondersteunde expliciete status is "unknown".');
    if (claim.source_ids !== undefined) {
      if (!Array.isArray(claim.source_ids)) add(errors, 'claim.sources_invalid', `${p}.source_ids`, 'source_ids moet een array zijn.');
      else {
        if (!claim.source_ids.length) add(warnings, 'claim.provenance_missing', p, 'Bewerking heeft geen bronverwijzing.');
        claim.source_ids.forEach((id, j) => lookup(id, 'source_representations', `${p}.source_ids[${j}]`));
      }
    } else add(warnings, 'claim.provenance_missing', p, 'Bewerking heeft geen bronverwijzing.');
    if (claim.source_ids !== undefined && !hasValue(claim.support)) add(errors, 'claim.support_required', `${p}.support`, 'Een koppeling aan een bron vereist vastgelegde onderbouwing.');
    else if (!hasValue(claim.support)) add(warnings, 'claim.support_missing', p, 'Onderbouwing is niet vastgelegd; inhoudelijke beoordeling blijft nodig.');
    if (claim.temporal_context !== undefined && !hasValue(claim.temporal_context)) add(errors, 'claim.temporal_context_invalid', `${p}.temporal_context`, 'Tijdscontext mag niet leeg zijn.');
  });
  (data.relations || []).forEach((relation, i) => {
    const p = `$.relations[${i}]`;
    const sourceKind = records.get(relation.subject_id);
    if (!['knowledge_objects', 'source_representations'].includes(sourceKind)) add(errors, 'relation.endpoint_invalid', `${p}.subject_id`, 'Relatie vereist een bestaand kennisobject of bronrepresentatie als startpunt.');
    const targetKind = records.get(relation.object_id);
    if (!['knowledge_objects', 'source_representations'].includes(targetKind)) add(errors, 'relation.endpoint_invalid', `${p}.object_id`, 'Relatie vereist een bestaand kennisobject of bronrepresentatie als eindpunt.');
    if ([sourceKind, targetKind].includes('source_representations') && ![sourceKind, targetKind].includes('knowledge_objects')) add(errors, 'relation.endpoint_pair_invalid', p, 'Een relatie met een bronrepresentatie vereist ook een werkelijk kennisobject als eindpunt.');
    if (typeof relation.predicate !== 'string' || !relation.predicate.trim()) add(errors, 'relation.predicate_required', `${p}.predicate`, 'Relatie vereist een betekenisvol predicaat.');
    if (!Array.isArray(relation.supporting_claim_ids) || relation.supporting_claim_ids.length === 0) {
      add(errors, 'relation.support_required', `${p}.supporting_claim_ids`, 'Een relatie vereist ten minste één onderbouwende bewering.');
    } else relation.supporting_claim_ids.forEach((id, j) => {
      if (!lookup(id, 'claims', `${p}.supporting_claim_ids[${j}]`)) return;
      const claim = claimById.get(id);
      if (claim && ![relation.subject_id, relation.object_id].includes(claim.subject_id)) add(errors, 'relation.support_mismatch', `${p}.supporting_claim_ids[${j}]`, 'Onderbouwende bewering moet een relatie-eindpunt beschrijven.');
    });
  });

  const groups = new Map();
  (data.claims || []).forEach((claim, i) => {
    if (!claim || typeof claim.subject_id !== 'string' || !hasValue(claim.property) || !hasValue(claim.value)) return;
    const key = JSON.stringify([claim.subject_id, claim.property]);
    const group = groups.get(key) || [];
    group.push({ claim, path: `$.claims[${i}]` });
    groups.set(key, group);
  });
  for (const group of groups.values()) {
    const values = new Set(group.map(({ claim }) => JSON.stringify(claim.value)));
    if (values.size > 1) for (const { path } of group) add(warnings, 'claim.conflict', path, 'Tegenstrijdige beweringen over dezelfde objecteigenschap blijven behouden.');
  }
  return { errors, warnings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const file = process.argv[2];
  if (!file) {
    console.error('Gebruik: node knowledge/validator.mjs <dataset.json>');
    process.exitCode = 2;
  } else {
    try {
      const result = validateDataset(JSON.parse(await readFile(file, 'utf8')));
      for (const issue of result.errors) console.error(`ERROR ${issue.code} ${issue.path}: ${issue.message}`);
      for (const issue of result.warnings) console.warn(`WAARSCHUWING ${issue.code} ${issue.path}: ${issue.message}`);
      console.log(`Validatie: ${result.errors.length} harde fout(en), ${result.warnings.length} waarschuwing(en).`);
      if (result.errors.length) process.exitCode = 1;
    } catch (error) {
      console.error(`Kan dataset niet valideren: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
