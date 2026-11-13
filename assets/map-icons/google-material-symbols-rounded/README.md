# VASKOR map icon assets

This directory contains a curated, expandable subset of Google's **Material Symbols Rounded**, rendered as filled 24 px SVG symbols. It is a source asset library only; it does not change the live map or select icons for any feature.

## Contents

- `sprite.svg`: 176 original Google SVG path designs in one compact external SVG sprite. Each `<symbol id>` retains the original Material Symbol name. The symbol's `viewBox` is retained from the Google SVG; paths use `currentColor` for color-independent rendering (set the SVG color to white for the orange map marker).
- `manifest.json`: original symbol name, VASKOR category, readable label, and sprite fragment mapping.
- `LICENSE` and `NOTICE`: upstream Apache 2.0 terms and attribution.

## Source and version

- Official upstream: https://github.com/google/material-design-icons
- Source layout: `symbols/web/{original_name}/materialsymbolsrounded/{original_name}_fill1_24px.svg`
- Upstream commit pinned for this selection: [10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7](https://github.com/google/material-design-icons/commit/10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7), dated 2026-10-23.
- License: Apache License 2.0. The SVG path designs are redistributed with no geometric edits; `currentColor` is added to make their paint color themeable.

## Selection principles and limits

The library covers sanitation and hygiene, water and food, shelter and camping, transport and navigation, public facilities, nature, health and safety, communication, services and shops, culture and religion, accessibility, weather and climate, utilities, money and budget, recreation, international orientation, and common interface/status needs. It is deliberately a broad subset rather than the full thousands-icon catalogue.

A symbol is a visual hint, not evidence that a service exists, is available, is safe, accessible, potable, open, or culturally equivalent in a given place. Local naming, interpretation, and availability vary worldwide. Use neutral pictograms when practical; religious and cultural symbols are included only as optional category resources and should be used with local context. Avoid inferring protected attributes or service quality from a pictogram.

Category counts in this snapshot:

- `sanitair-hygiene`: 8
- `drinkwater-voedsel`: 10
- `onderdak-kamperen`: 7
- `vervoer-navigatie`: 13
- `openbare-voorzieningen`: 8
- `natuur-landschap`: 8
- `gezondheid-veiligheid`: 9
- `communicatie-digitaal`: 11
- `diensten-winkels`: 10
- `cultuur-religie`: 10
- `toegankelijkheid`: 8
- `weer-klimaat`: 10
- `energie-nutsvoorzieningen`: 10
- `geld-budget`: 10
- `activiteiten-vrije-tijd`: 9
- `internationaal`: 5
- `interface-status`: 30

## Using a sprite symbol

Keep the marker foreground color controlled by the consuming SVG/CSS. For example, use an SVG wrapper whose viewBox matches the icon's `viewBox` in `sprite.svg`, then reference the corresponding fragment with `<use href="sprite.svg#water_drop" />`. For inline or encoded marker images, extract the referenced `<symbol>` and wrap its children in an SVG element with the same viewBox; set `color` on that wrapper. Check browser and map-renderer support before adopting an external `<use>` URL in the live map.

## Adding or updating icons

1. Choose an official **Material Symbols Rounded** symbol and confirm its meaning is appropriate for the intended VASKOR use.
2. Fetch the 24 px, filled SVG from the source layout above at a reviewed upstream commit. Do not substitute Outlined, Sharp, classic Material Icons, or an unfilled symbol.
3. Add its original-name symbol to `sprite.svg` without renaming the `id`; set path paint to `currentColor` if needed, while preserving the original geometry and viewBox.
4. Add an entry to `manifest.json` with the original name, plain VASKOR label, category, and `sprite.svg#original_name` asset reference. Keep names lowercase with underscores exactly as upstream.
5. Update the pinned commit, icon and category counts, and this notice if the upstream version changes. Preserve Apache 2.0 terms and attribution.

This library is not automatically synchronized with upstream. Review every addition for meaning, rendering, size, and license provenance.
