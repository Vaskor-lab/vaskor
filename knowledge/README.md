# VASKOR Knowledge Layer

This directory contains the machine-readable knowledge layer used by VASKOR experiments and applications.

The knowledge layer is deliberately separated from interface and application code.

## First production test: Toprope

The first network will be built around Toprope. Knowledge is entered and reviewed by a human, represented as explicit knowledge objects and connected through explicit relationships.

No knowledge should be invented merely to make the network appear complete. Where knowledge or a relationship is not established, the absence should remain visible.

## Authoring workflow

1. Human supplies or reviews knowledge.
2. A knowledge object is drafted according to the current VASKOR model.
3. Sources/provenance are recorded where available.
4. Relationships are added explicitly rather than inferred silently.
5. Validation is performed before publication/use.
6. The resulting knowledge is versioned in Git.

The exact schema remains intentionally small and will be derived from the VASKOR source documents and the needs discovered during the Toprope test.
