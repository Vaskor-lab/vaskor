# OSM-waterbronrepresentatie

`source_representation` is a kennisobjecttype voor een externe bronregistratie. Een individueel object bewaart de OSM-identiteit, versie, bewerkingstijd, tags en coördinaten. Het is geen vaststelling dat de werkelijke waterbron bestaat, toegankelijk is of drinkbaar water levert.

De feitelijke waterbron is een afzonderlijk kennisobject wanneer die onafhankelijk is vastgesteld. Koppel die dan expliciet vanuit de representatie via `represents` of via een betekenisvolle relatie in `related_objects`. Laat de relatie leeg zolang verificatie ontbreekt. De interface toont OSM-resultaten als ongeverifieerde brongegevens en kent zelf geen VASKOR-kwalificatie toe.

Zoeken gebeurt uitsluitend na een expliciete druk op **Zoek OSM-waterbronnen hier**. De zoekactie gebruikt het huidige kaartmiddelpunt, behoudt de vaste grens van 40 × 60 km en probeert de bestaande Overpass-fallbackservers. **Mijn locatie** vraagt alleen GPS op, bepaalt de positie, toont de grens en centreert de kaart.
