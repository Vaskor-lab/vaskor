# OSM-waterbronrepresentatie

`source_representation` is a kennisobjecttype voor een externe bronregistratie. Een individueel object bewaart de OSM-identiteit, versie, bewerkingstijd, tags en coördinaten. Het is geen vaststelling dat de werkelijke waterbron bestaat, toegankelijk is of drinkbaar water levert.

De feitelijke waterbron is een afzonderlijk kennisobject wanneer die onafhankelijk is vastgesteld. Koppel die dan expliciet vanuit de representatie via `represents` of via een betekenisvolle relatie in `related_objects`. Laat de relatie leeg zolang verificatie ontbreekt. De interface toont OSM-resultaten als ongeverifieerde brongegevens en kent zelf geen VASKOR-kwalificatie toe.

Zoeken gebeurt uitsluitend na een expliciete druk op **Zoek voorzieningen**. De zoekactie vraagt een verse GPS-fix op en gebruikt die als middelpunt van een cirkel met straal 20 km standaard of 50 km uitgebreid. Overpass haalt kandidaten in de omhullende rechthoek op; de lokale afstandsfilter houdt uitsluitend objecten binnen de cirkel. De interface onderscheidt drinkwater, toiletten, douches en openbare zwemplekken. **Mijn locatie** vraagt GPS op, bepaalt de positie, toont de cirkel en centreert de kaart.
