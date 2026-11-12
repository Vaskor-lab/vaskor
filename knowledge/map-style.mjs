function paintForLayer(layer) {
  const id = layer.id.toLowerCase();
  const sourceLayer = (layer['source-layer'] || '').toLowerCase();
  const hint = `${id} ${JSON.stringify(layer.filter || '')}`.toLowerCase();
  const paint = {};

  if (layer.type === 'background') paint['background-color'] = '#F2F4F1';

  if (layer.type === 'fill') {
    if (sourceLayer === 'water' || /(^|[_-])water([_-]|$)/.test(id)) paint['fill-color'] = '#B7E1E3';
    else if (sourceLayer === 'park' || /park|forest|wood|grass|meadow|vegetation/.test(id)) {
      paint['fill-color'] = /park/.test(`${id} ${sourceLayer}`) ? '#D5EBD8' : '#DFEDDF';
      if (layer.paint?.['fill-outline-color'] !== undefined) paint['fill-outline-color'] = '#D1E2D4';
    } else if (/building/.test(id) || sourceLayer === 'building') {
      paint['fill-color'] = '#E5E8E6';
      if (layer.paint?.['fill-outline-color'] !== undefined) paint['fill-outline-color'] = '#D5DCDA';
    }
  }

  if (layer.type === 'line') {
    if (sourceLayer === 'waterway' || /waterway|river|stream/.test(id)) paint['line-color'] = '#A9DDE1';
    else if (sourceLayer === 'transportation' || /highway|motorway/.test(id)) {
      const casing = /casing|_case(?:_|$)/.test(id);
      if (/motorway/.test(hint)) paint['line-color'] = casing ? '#FFF0CB' : '#E5C976';
      else if (/primary|secondary|tertiary|major/.test(hint)) paint['line-color'] = casing ? '#F9F5E9' : '#E8D79E';
      else if (/path|footway|pedestrian/.test(hint)) {
        paint['line-color'] = '#94A7B0';
        paint['line-dasharray'] = [1.2, 1.6];
      } else paint['line-color'] = casing ? '#F8FAF9' : '#BECBD1';
    }
  }

  if (layer.type === 'symbol' && layer.paint?.['text-color'] !== undefined) {
    paint['text-color'] = '#53636C';
    if (layer.paint?.['text-halo-color'] !== undefined) paint['text-halo-color'] = '#F8F9F7';
    if (layer.paint?.['text-halo-width'] !== undefined) paint['text-halo-width'] = 1.1;
  }

  return paint;
}

export function applyVaskorMapStyle(map) {
  const layers = map.getStyle()?.layers || [];
  let changedProperties = 0;
  for (const layer of layers) {
    for (const [property, value] of Object.entries(paintForLayer(layer))) {
      map.setPaintProperty(layer.id, property, value);
      changedProperties += 1;
    }
  }
  return changedProperties;
}
