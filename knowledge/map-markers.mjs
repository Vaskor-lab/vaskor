const iconPaths = {
  water: '<path d="M12 2.1S5.7 9.5 5.7 13.8a6.3 6.3 0 1 0 12.6 0C18.3 9.5 12 2.1 12 2.1Z" fill="currentColor"/><path d="M9.1 14.2c0 1.6 1 2.7 2.5 3.1" fill="none" stroke="#E37400" stroke-linecap="round" stroke-width="1.5"/>',
  toilet: '<path d="M7 3h10v2h-2v2h6v2.5c0 4.1-2.9 7.5-6.7 8.3L16 21h-3l-2-3H9v-7h6V9H7v2H5V5c0-1.1.9-2 2-2Z" fill="currentColor"/>',
  shower: '<path d="M5 10a7 7 0 0 1 14 0v1h-2v-1a5 5 0 0 0-10 0v1H5v-1Zm1 4h2l-.5 2H6.5L6 14Zm5 0h2l-.5 2h-1L11 14Zm5 0h2l-.5 2h-1l-.5-2Zm-9 5h2l-.5 2h-1L7 19Zm5 0h2l-.5 2h-1l-.5-2Z" fill="currentColor"/>',
  swimming: '<path d="M3 10c2.2 0 2.2-2 4.5-2S9.7 10 12 10s2.2-2 4.5-2S18.7 10 21 10v2c-2.2 0-2.2-2-4.5-2S14.3 12 12 12s-2.2-2-4.5-2S5.3 12 3 12v-2Zm0 5c2.2 0 2.2-2 4.5-2S9.7 15 12 15s2.2-2 4.5-2S18.7 15 21 15v2c-2.2 0-2.2-2-4.5-2S14.3 17 12 17s-2.2-2-4.5-2S5.3 17 3 17v-2Z" fill="currentColor"/>',
};

const materialSymbols = {
  orientation: 'explore', shelter: 'cabin', public: 'water_drop', transport: 'directions_bus',
  nature: 'landscape', sport: 'sports_soccer', safety: 'health_and_safety'
};

export function markerIconSvg(category) {
  if (materialSymbols[category]) {
    return `<svg viewBox="0 0 40 48" aria-hidden="true" focusable="false"><path d="M20 47C16.5 40.7 3 27.2 3 18A17 17 0 1 1 37 18c0 9.2-13.5 22.7-17 29Z" fill="#fff"/><circle cx="20" cy="18" r="13.3" fill="#E37400"/><text x="20" y="24" text-anchor="middle" fill="#fff" font-family="Material Symbols Rounded" font-size="18" font-variation-settings="'FILL' 1">${materialSymbols[category]}</text></svg>`;
  }
  const icon = iconPaths[category] || iconPaths.water;
  return `<svg viewBox="0 0 40 48" aria-hidden="true" focusable="false"><path d="M20 47C16.5 40.7 3 27.2 3 18A17 17 0 1 1 37 18c0 9.2-13.5 22.7-17 29Z" fill="#fff"/><circle cx="20" cy="18" r="13.3" fill="#E37400"/><g transform="translate(10 8) scale(.83)" color="#fff">${icon}</g></svg>`;
}

export function createPoiMarkerElement(feature, documentImpl = document) {
  const category = feature.properties.category || 'water';
  const label = feature.properties.catalogLabel || ({ water: 'Drinkwaterpunt', toilet: 'Toilet', shower: 'Douche', swimming: 'Zwemplek' })[category] || 'Voorziening';
  const marker = documentImpl.createElement('button');
  marker.type = 'button';
  marker.className = 'poi-marker';
  marker.setAttribute('aria-label', label);
  marker.innerHTML = markerIconSvg(category);
  return marker;
}
