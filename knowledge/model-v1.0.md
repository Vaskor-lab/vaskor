# VASKOR Kennismodel v1.0 implementatiespecificatie

Status: implementatie van de in de ontwerpbespreking goedgekeurde grondslag.

## Model

- Een `knowledge_object` heeft een eigen identiteit en beschrijft een herkenbare zaak in de werkelijkheid, onafhankelijk van bronregistraties.
- Een `source_representation` heeft een eigen identiteit en bewaart wat een geïdentificeerde bron representeert. Een werkelijk object hoeft nog niet bekend te zijn.
- Een `claim` beschrijft één eigenschap van een kennisobject met een concrete waarde of een expliciete `unknown`-waarde. Iedere bewering kan haar eigen bronverwijzingen, onderbouwing en tijdscontext dragen. Bronnen worden niet door VASKOR gerangschikt.
- Een `relation` benoemt een relatie tussen twee bestaande kennisobjecten of een bronrepresentatie en een kennisobject. Koppeling aan een werkelijk object vereist ten minste één verwijzing naar onderbouwende bewering(en).
- Typebeschrijvingen horen bij het model. Invoersjablonen zijn optioneel en maken geen deel uit van de validatie-eenheid.

JSON-objecten staan samen in een dataset met `model_version`, `type_definitions`, `knowledge_objects`, `source_representations`, `claims` en `relations`. Elk kennisobject verwijst naar een typebeschrijving; die beschrijft de soort zaak en de toegestane eigenschapsnamen. Een typebeschrijving heeft daarom een label en een lijst `properties` (die lijst mag leeg zijn). Kennisobjecten hebben een label en typeverwijzing; bronrepresentaties hebben een bronidentiteit (`provider` en `record_id`). Claims leggen subject, eigenschap en waarde vast; relaties leggen twee eindpunten, een predicaat en verwijzingen naar onderbouwende claims vast. Een relatie kan twee kennisobjecten of een bronrepresentatie en een kennisobject verbinden. Identifiers zijn datasetbreed uniek. Afwezige informatie wordt weggelaten; lege strings en `null` zijn geen waarden. Expliciete onbekendheid gebruikt `{ "state": "unknown" }`. Meerdere bronrepresentaties mogen één object betreffen en één representatie mag naar meerdere objecten verwijzen, mits elke koppeling onderbouwd is. Tegenstrijdige beweringen blijven naast elkaar bestaan.

## Harde validatie

De validator faalt bij ongeldige of dubbele identifiers, ontbrekende verplichte velden, lege/null-waarden, verwijzingen naar niet-bestaande records, een eigenschap die niet bij het type van het claim-object hoort, een relatie tussen twee bronrepresentaties, of een relatie zonder bestaande onderbouwende claim die een relatie-eindpunt beschrijft. Een claim die bronverwijzingen bevat, moet ook onderbouwing vastleggen. De validator kiest of verzoent geen waarheidsclaim.

## Kwaliteitswaarschuwingen

Ontbrekende bronverwijzing bij een claim en tegenstrijdige waarden voor dezelfde objecteigenschap geven waarschuwingen. Waarschuwingen blokkeren de dataset niet en verwijderen geen kennis. Expliciet onbekende waarden zijn geldig en op zichzelf geen fout.

## Reikwijdte

De validatie geldt voor de v1.0-JSON-dataset en claimonderbouwing; zij bewijst niet dat een bewering waar, actueel of inhoudelijk voldoende sterk is. Voorbeelden onder `tests/fixtures` zijn uitsluitend synthetische testdata. Er is geen Spaanse pilotlocatie of voorziening als feit opgenomen.
