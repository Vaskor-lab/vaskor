# VASKOR

Technical development environment for VASKOR knowledge infrastructure.

## Purpose

This repository contains the technical implementation and test environment of VASKOR. It does not replace the VASKOR source documents. The VASKOR documentary foundation remains the authoritative source for architecture, principles and governance.

## Current development focus

The current model test uses real-world drinking-water and sanitary facilities as examples. It tests whether one general knowledge structure can distinguish source records, observed objects, claims and supported relations across categories.

The goal is not to create a large dataset. The goal is to test whether VASKOR can support a disciplined workflow in which human knowledge is turned into reusable knowledge objects and explicit relationships, then exposed through a minimal technical implementation.

## Development principles

- Quality over quantity.
- Knowledge is separate from presentation and application code.
- Knowledge objects are explicit, atomic and reusable.
- Relationships are explicit and meaningful.
- Sources and provenance matter.
- Experiments remain traceable.
- Technology serves VASKOR; technology does not redefine VASKOR.
- Keep it small until evidence requires expansion.

## Map start screen

The map is a static page in `index.html`; it adds no framework or build step. MapLibre GL JS is loaded from the UNPKG CDN (version 6.16.0). The map style and vector tiles are served by the public OpenFreeMap service, using its Positron style. The browser requests location only after the visitor presses **Mijn locatie**, explicitly searches, or records a field observation. A search asks for a fresh GPS fix and uses that exact fix as its origin; it does not use the map center or an estimated location.

These external services are required for the map. The public OpenFreeMap service is provided without an uptime guarantee, so the map may be unavailable or change; the page displays a small status message if the map cannot load. Browser location also depends on permission, device settings, and a secure origin (HTTPS, or localhost).

### Preview

From the repository root, run:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Stop the local server with Ctrl+C.

### Publishing

The public repository is `Vaskor-lab/vaskor`; its default branch is `main`, GitHub Pages is enabled, and the repository's Pages build-and-deployment workflow has completed successfully for recent `main` commits. The root `CNAME` names `vaskor.org`. DNS remains managed separately at TransIP and is not changed as part of repository publishing.

## Repository status

Initial development environment established September 2026.

## Kennismodel v1.0

The v1.0 implementation specification is in `knowledge/model-v1.0.md`. Validate its standalone JSON datasets with the dependency-free Node.js validator:

```sh
node knowledge/validator.mjs tests/fixtures/representative-v1.0.json
node --test tests/validator.test.mjs
```

The fixture contains synthetic test data only. The existing `knowledge/objects`, `knowledge/types`, and `knowledge/relations` files are retained as the legacy knowledge layer and have not been silently migrated.

### Phone field test

The live map can search OpenStreetMap for drinking-water points and toilets. Tap a candidate only when you are physically there and can confirm that the facility is visible. The phone records its current GPS position and accuracy as support for that observation. This records presence at that moment; it does not establish drinking-water quality, free access, opening hours, or continued availability.

Each phone keeps its test records in that browser only. Use **Exporteer veldtest** to download a v1.0 JSON dataset from each device. The page does not upload observations. Validate an exported file on a computer with:

```sh
node knowledge/validator.mjs path/to/vaskor-field-pilot.json
```

The pilot data stays outside the repository unless it is deliberately reviewed and added later. Do not treat raw OSM candidates as confirmed real-world objects; the explicit field observation creates the object and the supported `represents` relation.

### Manual map regression checks

- Open the page without granting location access. Confirm no location prompt or OSM search occurs on load.
- Pan the map away from your device. Tap **Mijn locatie** and confirm the map follows the GPS position; tap **Stop volgen** and confirm updates stop without navigation.
- Collapse and reopen the status and search-area panels using their arrow icons.
- Tap **Zoek voorzieningen** and confirm the browser asks for a fresh location only then; the search recenters on that fix.
- Confirm the displayed rectangle is labeled 30 km east-west by 60 km north-south from GPS and that status messages identify the GPS origin. Deny location or disable GPS and confirm no search runs.
- If the first Overpass server is unavailable or slow while the second succeeds, confirm there is no intermediate failure message and only the result count appears. Confirm an error appears only when both servers fail.
- Confirm water and toilet candidates appear only after the explicit search, and that the result status calls them unverified OSM candidates.
- In browser developer tools, block local storage writes and try to record a field observation. Confirm the export count stays unchanged; restore storage and retry, then confirm exactly one observation is exported.

