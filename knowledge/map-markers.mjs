const symbolIds = {
  water: 'water_drop',
  toilet: 'wc',
  shower: 'shower',
  swimming: 'waves',
};
const spritePath = './assets/map-icons/google-material-symbols-rounded/sprite.svg';

export function markerIconSvg(category) {
  const symbol = symbolIds[category] || symbolIds.water;
  return `<svg viewBox="0 0 40 48" aria-hidden="true" focusable="false"><path d="M20 47C16.5 40.7 3 27.2 3 18A17 17 0 1 1 37 18c0 9.2-13.5 22.7-17 29Z" fill="#fff"/><circle cx="20" cy="18" r="13.3" fill="#E37400"/><svg x="10" y="8" width="20" height="20" viewBox="0 -960 960 960" color="#fff"><use href="${spritePath}#${symbol}"></use></svg></svg>`;
}

export function createPoiMarkerElement(feature, documentImpl = document) {
  const category = feature.properties.category || 'water';
  const label = ({ water: 'Drinkwaterpunt', toilet: 'Toilet', shower: 'Douche', swimming: 'Zwemplek' })[category] || 'Voorziening';
  const marker = documentImpl.createElement('button');
  marker.type = 'button';
  marker.className = 'poi-marker';
  marker.setAttribute('aria-label', label);
  marker.innerHTML = markerIconSvg(category);
  return marker;
}
