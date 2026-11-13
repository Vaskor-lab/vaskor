export const OSM_CATALOGUE = [
  { id: 'orientation', label: 'Oriëntatie en locatie', objects: [
    ['place', 'Plaats', { place: ['village', 'town', 'city'] }],
    ['peak', 'Bergtop', { natural: 'peak' }],
    ['viewpoint', 'Uitzichtpunt', { tourism: 'viewpoint' }],
    ['information_board', 'Informatiebord', { information: 'board' }],
    ['map_board', 'Kaartbord', { information: 'map' }],
    ['guidepost', 'Wegwijzer', { information: 'guidepost' }],
    ['route_marker', 'Routeaanduiding', { information: 'route_marker' }],
    ['information_point', 'Informatiepunt', { tourism: 'information' }]
  ] },
  { id: 'shelter', label: 'Overnachten en schuilen', objects: [
    ['caravan_site', 'Camperplaats', { tourism: 'caravan_site' }],
    ['camp_pitch', 'Kampeerplaats', { tourism: 'camp_pitch' }],
    ['alpine_hut', 'Berghut', { tourism: 'alpine_hut' }],
    ['wilderness_hut', 'Wildernishut', { tourism: 'wilderness_hut' }],
    ['basic_hut', 'Eenvoudige slaaphut', { amenity: 'shelter', shelter_type: 'basic_hut' }],
    ['lean_to', 'Open schuilhut', { amenity: 'shelter', shelter_type: 'lean_to' }],
    ['weather_shelter', 'Weershut', { amenity: 'shelter', shelter_type: 'weather_shelter' }]
  ] },
  { id: 'public', label: 'Water, sanitair en openbare voorzieningen', objects: [
    ['drinking_water', 'Drinkwaterpunt', { amenity: 'drinking_water' }],
    ['water_point', 'Watervulpunt', { amenity: 'water_point' }],
    ['toilets', 'Openbaar toilet', { amenity: 'toilets' }],
    ['shower', 'Douchevoorziening', { amenity: 'shower' }],
    ['sanitary_dump_station', 'Sanitaire loosplaats', { amenity: 'sanitary_dump_station' }],
    ['picnic_site', 'Picknickplaats', { tourism: 'picnic_site' }],
    ['picnic_table', 'Picknicktafel', { leisure: 'picnic_table' }],
    ['firepit', 'Vuurplaats', { leisure: 'firepit' }],
    ['waste_basket', 'Afvalbak', { amenity: 'waste_basket' }],
    ['first_aid', 'Eerstehulppost', { amenity: 'first_aid' }]
  ] },
  { id: 'transport', label: 'Vervoer en infrastructuur', objects: [
    ['parking', 'Parkeerplaats', { amenity: 'parking' }],
    ['bicycle_repair', 'Fietsreparatiepunt', { amenity: 'bicycle_repair_station' }],
    ['fuel', 'Tankstation', { amenity: 'fuel' }],
    ['charging_station', 'Laadstation elektrische voertuigen', { amenity: 'charging_station' }],
    ['bus_stop', 'Bushalte', { highway: 'bus_stop' }],
    ['platform', 'OV-perron / halteplatform', { public_transport: 'platform' }],
    ['ferry_terminal', 'Veerterminal', { amenity: 'ferry_terminal' }],
    ['marina', 'Jachthaven', { leisure: 'marina' }],
    ['slipway', 'Boothelling', { leisure: 'slipway' }]
  ] },
  { id: 'nature', label: 'Natuurlijke objecten en geografische locaties', objects: [
    ['saddle', 'Bergpas / zadel', { natural: 'saddle' }],
    ['cave_entrance', 'Grottoegang', { natural: 'cave_entrance' }],
    ['cliff', 'Klif / rotswand', { natural: 'cliff' }],
    ['spring', 'Natuurlijke bron', { natural: 'spring' }],
    ['waterfall', 'Waterval', { waterway: 'waterfall' }],
    ['bathing_place', 'Zwemlocatie', { leisure: 'bathing_place' }],
    ['swimming_area', 'Zwemgebied', { leisure: 'swimming_area' }]
  ] },
  { id: 'sport', label: 'Sport, spel en buitenactiviteiten', objects: [
    ['tennis', 'Tennisbaan', { leisure: 'pitch', sport: 'tennis' }],
    ['padel', 'Padelbaan', { leisure: 'pitch', sport: 'padel' }],
    ['boules', 'Jeu-de-boulesbaan', { leisure: 'pitch', sport: 'boules' }],
    ['soccer', 'Voetbalveld', { leisure: 'pitch', sport: 'soccer' }],
    ['basketball', 'Basketbalveld', { leisure: 'pitch', sport: 'basketball' }],
    ['volleyball', 'Volleybalveld', { leisure: 'pitch', sport: 'volleyball' }],
    ['pitch', 'Sportveld', { leisure: 'pitch' }],
    ['playground', 'Speelplaats', { leisure: 'playground' }],
    ['playground_equipment', 'Speeltoestel', { playground: '*' }],
    ['pumptrack', 'Pumptrack', { leisure: 'track', cycling: 'pump_track' }],
    ['skatepark', 'Skatepark', { leisure: 'skate_park' }],
    ['fitness_station', 'Fitnessstation', { leisure: 'fitness_station' }],
    ['athletics_track', 'Atletiekbaan', { leisure: 'track', sport: 'athletics' }],
    ['climbing', 'Klimvoorziening', { sport: 'climbing' }]
  ] },
  { id: 'safety', label: 'Veiligheid, hulpdiensten en luchtvaart', objects: [
    ['aerodrome', 'Luchthaven / vliegveld', { aeroway: 'aerodrome' }],
    ['helipad', 'Helikopterplatform', { aeroway: 'helipad' }],
    ['emergency_phone', 'Noodtelefoon', { emergency: 'phone' }],
    ['defibrillator', 'AED', { emergency: 'defibrillator' }],
    ['lifeguard', 'Strandwachtpost', { emergency: 'lifeguard' }],
    ['fire_station', 'Brandweerkazerne', { amenity: 'fire_station' }],
    ['hospital', 'Ziekenhuis', { amenity: 'hospital' }],
    ['police', 'Politiebureau', { amenity: 'police' }],
    ['water_rescue', 'Waterreddingspost', { emergency: 'water_rescue' }],
    ['assembly_point', 'Verzamelplaats', { emergency: 'assembly_point' }],
    ['emergency_access_point', 'Hulpverleningslocatie', { highway: 'emergency_access_point' }]
  ] }
];

const definitions = OSM_CATALOGUE.flatMap(section => section.objects.map(([id, label, tags]) => ({ id, label, section: section.id, tags })));

function matches(tags, rule) {
  return Object.entries(rule).every(([key, value]) => value === '*' ? typeof tags[key] === 'string' && tags[key].length > 0 : Array.isArray(value) ? value.includes(tags[key]) : tags[key] === value);
}

export function classifyOsmTags(tags = {}) {
  const match = definitions.find(object => matches(tags, object.tags));
  if (!match) return null;
  // Preserve the four existing marker categories while attaching the exact catalog type.
  const legacyCategory = ({ drinking_water: 'water', water_point: 'water', toilets: 'toilet', shower: 'shower', swimming_area: 'swimming' })[match.id];
  return legacyCategory || match.section;
}

export function catalogObjectForTags(tags = {}) {
  return definitions.find(object => matches(tags, object.tags)) || null;
}

export function toVaskorFeature(element) {
  const tags = element.tags || {};
  // Only a node's own coordinates are a fixed point. Overpass centers and
  // way/relation geometries are derived representations, not point locations.
  if (element.type !== 'node') return null;
  const longitude = element.lon;
  const latitude = element.lat;
  const object = catalogObjectForTags(tags);
  if (!object || !Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
  const osmType = element.type;
  const osmId = element.id;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [longitude, latitude] },
    properties: {
      vaskorId: `VASKOR-OSM-${osmType}-${osmId}`,
      osmSourceId: `OSM-${osmType}-${osmId}`,
      osmType, osmId, version: element.version, timestamp: element.timestamp,
      category: classifyOsmTags(tags), catalogType: object.id, catalogLabel: object.label, tags
    }
  };
}

export function categoryLabel(category) {
  return ({
    water: 'Drinkwatervoorziening', toilet: 'Toilet', shower: 'Douche', swimming: 'Openbare zwemplek',
    orientation: 'Oriëntatie en locatie', shelter: 'Overnachten en schuilen', public: 'Water, sanitair en openbare voorzieningen',
    transport: 'Vervoer en infrastructuur', nature: 'Natuurlijke objecten en geografische locaties',
    sport: 'Sport, spel en buitenactiviteiten', safety: 'Veiligheid, hulpdiensten en luchtvaart'
  })[category] || 'Voorziening';
}
