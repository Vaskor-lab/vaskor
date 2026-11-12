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

The map is a static page in `index.html`; it adds no framework or build step. MapLibre GL JS is loaded from the UNPKG CDN (version 6.16.0). The map style and vector tiles are served by the public OpenFreeMap service, using its Positron style. Location tracking starts only when the visitor turns on **Locatie**. **Zoek voorzieningen** requests a fresh GPS fix only after the visitor chooses to search.

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

### Manual map regression checks

- Open the page without granting location access. Confirm no location prompt or search occurs on load.
- Confirm **Locatie** stays off until tapped, then starts tracking and switches off again when tapped a second time.
- Drag the map with one finger and pinch with two; check that controls remain tappable and the location marker stays at its measured position while the map moves.
- Tap **Zoek voorzieningen** and confirm the browser asks for a fresh location only then; the search recenters on that fix.
- Confirm the displayed circle is 20 km by default; choose 50 km and verify the boundary and subsequent results use the expanded radius. Deny location or disable GPS and confirm no search runs.
- Confirm fixed facility markers appear only after the explicit search. The only map-source notice is the small required attribution at the bottom right.
- Confirm the heading wedge appears only when the device provides compass or GPS heading data; otherwise the marker remains a blue dot.
