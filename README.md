# Læsehjælper

[![CI](https://github.com/eikrad/laesehjaelper/actions/workflows/ci.yml/badge.svg)](https://github.com/eikrad/laesehjaelper/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*[English](README.en.md) · [Deutsch](README.de.md)*

Gør fotograferede sider fra børnebøger lettere at læse. Teksten bliver genkendt med OCR og erstattet direkte på siden, så billederne bliver, hvor de er, men teksten står i en letlæselig skrift med farvede stavelser eller stavelsesbuer. Alternativt kan teksten vises alene, stor og med god luft. Lavet til børn, der er ved at lære at læse, og til læsere med ordblindhed. Understøtter danske, tyske og engelske bøger.

Alt kører lokalt i browseren. Ingen billeder bliver uploadet.

**Prøv den:** https://eikrad.github.io/laesehjaelper/

## Funktioner

- To visninger: bogens side med ny skrift på den oprindelige plads, eller kun teksten
- Brugerflade på dansk, tysk eller engelsk
- Tekstgenkendelse (dansk, tysk, engelsk) med [Tesseract.js](https://github.com/naptha/tesseract.js)
- Stavelsesdeling baseret på de danske, tyske og engelske TeX-orddelingsmønstre ([hyphen](https://github.com/ytiurin/hyphen))
- Stavelser i skiftende farver (blå/rød, farverne kan vælges frit), som buer eller begge dele
- Skrifttyper: Andika (standard), OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Justerbar skriftstørrelse, bogstavafstand, linjeafstand og baggrundsfarve
- Tryk på et ord for at få det læst op, eller få hele siden læst op med markering af hvert ord
- Indstilling „Bindestreger i bogen“: til læsebøger, der selv deler ord i stavelser med bindestreg („sko-le“)
- Skæve fotos bliver rettet op, og „tekst“, som tekstgenkendelsen finder i tegningerne, bliver sorteret fra
- Hver side genkendes to gange (som den er og med udlignet baggrund), så også tekst på farvede billeder bliver fundet
- Ret den genkendte tekst; sæt selv stavelsesgrænser med `·` (f.eks. `hun·den`)
- Læsetilstand: kun teksten, i fuld skærm
- Vis den oprindelige tekst med ét tryk for at finde fejl i genkendelsen
- Bogreol: bøger gemmes på enheden, med titel, rækkefølge og læsestatus
- Beskæring: siden findes automatisk på fotoet og rettes op; hjørner og kanter kan justeres, også på buede sider
- E-bog: gem en bog som EPUB 3 (faste sider, kan åbnes i alle læse-apps) og hent den ind igen uden tab
- Kan installeres som app og bruges offline

## Udvikling

```bash
npm install
npm run build       # bygger dist/
npm run typecheck   # TypeScript (strict)
npm test            # unit-tests (Vitest)
npm run test:e2e    # end-to-end-tests i Chromium (Playwright)
```

CI (`.github/workflows/ci.yml`) kører typecheck, unit-tests, build og end-to-end-tests ved hvert push og pull request. Kun når alt er grønt, bliver `main` udgivet på GitHub Pages.

## Opbygning

Projektet er skrevet i TypeScript (strict).

- `src/index.html`: sidens HTML og CSS
- `src/app.ts`: app-logik (brugerflade, tekstgenkendelse, bogreol)
- `src/layout.ts`: gør det rå OCR-resultat til rene tekstlinjer og afsnit med position (sorterer støj fra tegninger fra)
- `src/pagedetect.ts`: finder siden på fotoet og retter den op (OpenCV), også buede sider
- `src/silben.ts`: stavelsesdeling (dansk, tysk, engelsk)
- `src/db.ts`: lagring af bøger på enheden (IndexedDB)
- `src/epub.ts`: eksport og import af EPUB
- `src/prep.ts`: billedforberedelse til tekstgenkendelse (udligning af baggrund)
- `src/sw.ts`: service worker (offline, installation)
- `src/types.ts`: fælles typer
- `build.ts`: bygger `dist/` med esbuild og kopierer Tesseract-, OpenCV- og sprogfiler
- `tests/`: unit-tests, end-to-end-tests og selvlavede testsider

## Hvad siger forskningen?

Læsehjælper er et læseværktøj, ikke en behandling. Indstillingerne bygger på det, undersøgelser af børn, der lærer at læse, og af ordblinde børn viser:

- **Afstand:** Mere afstand mellem bogstaverne hjælper mange ordblinde børn med at læse hurtigere og mere præcist (Zorzi m.fl. 2012) – men kun når ordafstanden vokser med (Galliussi m.fl. 2020). Derfor øger Læsehjælper ordafstanden automatisk.
- **Korte linjer** hjælper nogle ordblinde læsere, især dem med svag visuel opmærksomhed; andre læser bedre med almindelige linjer (Schneps m.fl. 2013).
- **Skrifttype:** Selve bogstavformen gør næppe en forskel. OpenDyslexic gav ingen fordel, og ingen af børnene foretrak den (Wery & Diliberto 2017; Galliussi m.fl. 2020). Standard er derfor Andika, en almindelig, tydelig skrift; OpenDyslexic kan vælges, hvis barnet kan lide den.
- **Farvede stavelser** hjælper nogle børn i begyndelsen og andre ikke; bindestreger i ordene gør læsningen langsommere (Häikiö m.fl. 2015; Brügelmann 2025). Prøv, hvad barnet kan lide, og slå farverne fra, når det læser flydende.
- **Oplæsning** hjælper forståelsen; markering af hvert ord giver ikke ekstra (Keelor m.fl. 2023). At læse den samme tekst flere gange, gerne efter at have hørt den, gør læsningen mere flydende (Lee & Yoon 2017).
- **Farvet baggrund eller farvede filtre** har ingen påvist effekt ud over placebo (Griffiths m.fl. 2016). Baggrundsfarven er kun et spørgsmål om, hvad der føles rart.
- **Undervisning:** Systematisk arbejde med bogstaver og lyde er den bedst dokumenterede hjælp ved ordblindhed (Galuschka m.fl. 2014). Dansk er et af de sprog, hvor det tager længst tid at lære at læse sikkert (Seymour m.fl. 2003).

Kilder:

- Zorzi m.fl. 2012, *PNAS* — [doi:10.1073/pnas.1205566109](https://doi.org/10.1073/pnas.1205566109)
- Galliussi m.fl. 2020, *Annals of Dyslexia* — [doi:10.1007/s11881-020-00194-x](https://doi.org/10.1007/s11881-020-00194-x)
- Schneps m.fl. 2013, *PLOS ONE* — [doi:10.1371/journal.pone.0071161](https://doi.org/10.1371/journal.pone.0071161), [doi:10.1371/journal.pone.0075634](https://doi.org/10.1371/journal.pone.0075634)
- Wery & Diliberto 2017, *Annals of Dyslexia* — [doi:10.1007/s11881-016-0127-1](https://doi.org/10.1007/s11881-016-0127-1)
- Häikiö m.fl. 2015, *Journal of Cognitive Psychology* — [doi:10.1080/20445911.2014.982126](https://doi.org/10.1080/20445911.2014.982126)
- Brügelmann 2025 — [pedocs.de](https://www.pedocs.de/volltexte/2025/34472/pdf/Bruegelmann_2025_Red_and_blue.pdf)
- Keelor m.fl. 2023, *Annals of Dyslexia* — [doi:10.1007/s11881-023-00281-9](https://doi.org/10.1007/s11881-023-00281-9)
- Lee & Yoon 2017, *Journal of Learning Disabilities* — [doi:10.1177/0022219415605194](https://doi.org/10.1177/0022219415605194)
- Galuschka m.fl. 2014, *PLOS ONE* — [doi:10.1371/journal.pone.0089900](https://doi.org/10.1371/journal.pone.0089900)
- Griffiths m.fl. 2016, *Ophthalmic & Physiological Optics* — [doi:10.1111/opo.12316](https://doi.org/10.1111/opo.12316)
- Seymour m.fl. 2003, *British Journal of Psychology* — [doi:10.1348/000712603321661859](https://doi.org/10.1348/000712603321661859)

## Kendte begrænsninger

- Orddelingsmønstrene deler ikke enkelte bogstaver fra i starten eller slutningen af et ord, og nogle danske delinger er forkerte (f.eks. `hund-en` i stedet for `hun-den`). Løsning: ret det i teksten med `·`.
- Tekst oven på illustrationer eller i dekorative skrifttyper bliver genkendt dårligere.
- Den gamle tekst bliver malet over med baggrundsfarven omkring den. På ensfarvet baggrund ser det pænt ud; står teksten på en illustration, får den nye tekst sin egen lyse flade.
- Den nye skrift kan kun blive så stor, som der er plads til på siden. Til rigtig stor skrift er visningen „Kun teksten“ bedre.
- Buede sider skal indtil videre rettes ud i hånden (se [#1](https://github.com/eikrad/laesehjaelper/issues/1)).

## Roadmap

Roadmappen er opdelt i epics og stories (se [CONTRIBUTING.md](CONTRIBUTING.md)). Det, der er planlagt, styres som [issues med mærket `roadmap`](https://github.com/eikrad/laesehjaelper/issues?q=is%3Aissue%20is%3Aopen%20label%3Aroadmap). Idéer og fejl meldes som [issue](https://github.com/eikrad/laesehjaelper/issues/new). Vil du bidrage, så læs [CONTRIBUTING.md](CONTRIBUTING.md).

## Ansvarsfraskrivelse

Læsehjælper er et gratis hobbyprojekt og ikke et færdigt produkt. Tekstgenkendelse og stavelsesdeling laver fejl, så tjek altid teksten, før et barn læser den. Appen erstatter ikke undervisning, læsevejledning eller en udredning for ordblindhed.

Billeder og bøger bliver kun behandlet og gemt på brugerens egen enhed. Bøger er beskyttet af ophavsret: brug kun Læsehjælper til bøger, du selv har adgang til, og kun til privat brug, og del ikke omdannede bøger uden at have rettighederne.

Softwaren stilles til rådighed, som den er, uden nogen form for garanti.

## Licens

Koden er udgivet under [MIT-licensen](LICENSE). Komponenter fra tredjepart har deres egne licenser, se [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
