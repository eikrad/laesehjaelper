# Læsehjælper

*[English](README.en.md)*

Gør fotograferede sider fra børnebøger lettere at læse. Teksten bliver genkendt med OCR og erstattet direkte på siden, så billederne bliver, hvor de er, men teksten står i en letlæselig skrift med farvede stavelser eller stavelsesbuer. Alternativt kan teksten vises alene, stor og med god luft. Lavet til børn, der er ved at lære at læse, og til læsere med ordblindhed. Understøtter danske, tyske og engelske bøger.

Alt kører lokalt i browseren. Ingen billeder bliver uploadet.

**Prøv den:** https://eikrad.github.io/laesehjaelper/

## Funktioner

- To visninger: bogens side med ny skrift på den oprindelige plads, eller kun teksten
- Brugerflade på dansk, tysk eller engelsk
- Tekstgenkendelse (dansk, tysk, engelsk) med [Tesseract.js](https://github.com/naptha/tesseract.js)
- Stavelsesdeling baseret på de danske og tyske TeX-orddelingsmønstre ([hyphen](https://github.com/ytiurin/hyphen))
- Stavelser i skiftende farver (blå/rød), som buer eller begge dele
- Skrifttyper: Andika, OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Justerbar skriftstørrelse, bogstavafstand, linjeafstand og baggrundsfarve
- Tryk på et ord for at få det læst op, eller få hele siden læst op med markering af hvert ord
- Indstilling „Bindestreger i bogen“: til læsebøger, der selv deler ord i stavelser med bindestreg („sko-le“)
- Skæve fotos bliver rettet op, og „tekst“, som tekstgenkendelsen finder i tegningerne, bliver sorteret fra
- Ret den genkendte tekst; sæt selv stavelsesgrænser med `·` (f.eks. `hun·den`)
- Læsetilstand: kun teksten, i fuld skærm
- Vis den oprindelige tekst med ét tryk for at finde fejl i genkendelsen
- Bogreol: bøger gemmes på enheden, med titel, rækkefølge og læsestatus
- Beskæring: siden findes automatisk på fotoet og rettes op; hjørnerne kan justeres

## Udvikling

```bash
npm install
npm run build      # bygger dist/
npx serve dist     # eller en anden statisk webserver
```

Ved hvert push til `main` bliver appen automatisk bygget og udgivet på GitHub Pages.

## Opbygning

Projektet er skrevet i TypeScript (strict).

- `src/index.html`: sidens HTML og CSS
- `src/app.ts`: app-logik (brugerflade, tekstgenkendelse, bogreol)
- `src/layout.ts`: gør det rå OCR-resultat til rene tekstlinjer og afsnit med position (sorterer støj fra tegninger fra)
- `src/pagedetect.ts`: finder siden på fotoet og retter den op (OpenCV)
- `src/silben.ts`: stavelsesdeling (dansk, tysk, engelsk)
- `src/db.ts`: lagring af bøger på enheden (IndexedDB)
- `src/types.ts`: fælles typer
- `build.ts`: bygger `dist/` med esbuild og kopierer Tesseract-, OpenCV- og sprogfiler

`npm run typecheck` tjekker typerne.

## Kendte begrænsninger

- Orddelingsmønstrene deler ikke enkelte bogstaver fra i starten eller slutningen af et ord, og nogle danske delinger er forkerte (f.eks. `hund-en` i stedet for `hun-den`). Løsning: ret det i teksten med `·`.
- Tekst oven på illustrationer eller i dekorative skrifttyper bliver genkendt dårligere.
- Den gamle tekst bliver malet over med baggrundsfarven omkring den. På ensfarvet baggrund ser det pænt ud; står teksten på en illustration, får den nye tekst sin egen lyse flade.
- Den nye skrift kan kun blive så stor, som der er plads til på siden. Til rigtig stor skrift er visningen „Kun teksten“ bedre.

## Idéer

- Bedre fjernelse af tekst på illustrationer (inpainting)
- Gem bøger lokalt, eksport som PDF
- Læselineal, linje-for-linje-tilstand

## Ansvarsfraskrivelse

Læsehjælper er et gratis hobbyprojekt og ikke et færdigt produkt. Tekstgenkendelse og stavelsesdeling laver fejl, så tjek altid teksten, før et barn læser den. Appen erstatter ikke undervisning, læsevejledning eller en udredning for ordblindhed.

Billeder og bøger bliver kun behandlet og gemt på brugerens egen enhed. Bøger er beskyttet af ophavsret: brug kun Læsehjælper til bøger, du selv har adgang til, og kun til privat brug, og del ikke omdannede bøger uden at have rettighederne.

Softwaren stilles til rådighed, som den er, uden nogen form for garanti.

## Licens

Koden er udgivet under [MIT-licensen](LICENSE). Komponenter fra tredjepart har deres egne licenser, se [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
