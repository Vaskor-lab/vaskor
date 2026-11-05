# VASKOR

Technical development environment for VASKOR knowledge infrastructure.

## Purpose

This repository contains the technical implementation and test environment of VASKOR. It does not replace the VASKOR source documents. The VASKOR documentary foundation remains the authoritative source for architecture, principles and governance.

## Current development focus

The first production-oriented test is the construction of a small, sourceable knowledge network around **Toprope**.

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

The initial map screen is a static page in `index.html`; it adds no framework or build step. MapLibre GL JS is loaded from the UNPKG CDN (version 6.16.0). The map style and vector tiles are served by the public OpenFreeMap service, using its Positron style. The browser only requests location after the visitor presses **Mijn locatie**.

These external services are required for the map. The public OpenFreeMap service is provided without an uptime guarantee, so the map may be unavailable or change; the page displays a small status message if the map cannot load. Browser location also depends on permission, device settings, and a secure origin (HTTPS, or localhost).

### Preview

From the repository root, run:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). Stop the local server with Ctrl+C.

### Publishing

The repository contains a `CNAME` for `vaskor.org`, but that file alone does not confirm that GitHub Pages is enabled or that the domain currently serves this branch. To publish through GitHub Pages, open **Settings → Pages**, select deployment from branch, choose `main` and `/(root)`, and save. Confirm the custom domain and HTTPS status there before sharing a public test URL.

## Repository status

Initial development environment established September 2026.
