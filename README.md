# Læsehjælper

*[English](README.en.md)*

Gør fotograferede sider fra børnebøger lettere at læse. Teksten bliver genkendt med OCR og sat op på ny i en letlæselig skrift, større, med mere luft og med farvede stavelser eller stavelsesbuer. Lavet til børn, der er ved at lære at læse, og til læsere med ordblindhed. Understøtter danske og tyske bøger.

Alt kører lokalt i browseren. Ingen billeder bliver uploadet.

**Prøv den:** https://eikrad.github.io/laesehjaelper/

## Funktioner

- Brugerflade på dansk eller tysk
- Tekstgenkendelse (dansk, tysk) med [Tesseract.js](https://github.com/naptha/tesseract.js)
- Stavelsesdeling baseret på de danske og tyske TeX-orddelingsmønstre ([hyphen](https://github.com/ytiurin/hyphen))
- Stavelser i skiftende farver (blå/rød), som buer eller begge dele
- Skrifttyper: Andika, OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Justerbar skriftstørrelse, bogstavafstand, linjeafstand og baggrundsfarve
- Tryk på et ord for at få det læst op, eller få hele siden læst op med markering af hvert ord
- Ret den genkendte tekst; sæt selv stavelsesgrænser med `·` (f.eks. `hun·den`)
- Læsetilstand: kun teksten, i fuld skærm

## Udvikling

```bash
npm install
npm run build      # bygger dist/
npx serve dist     # eller en anden statisk webserver
```

Ved hvert push til `main` bliver appen automatisk bygget og udgivet på GitHub Pages.

## Opbygning

- `src/index.html`: brugerflade og app-logik
- `src/silben.js`: stavelsesdeling (samles med esbuild)
- `build.mjs`: bygger `dist/`, indlejrer stavelseskoden og skrifttypen OpenDyslexic og kopierer Tesseract-filer og sprogdata

## Kendte begrænsninger

- Orddelingsmønstrene deler ikke enkelte bogstaver fra i starten eller slutningen af et ord, og nogle danske delinger er forkerte (f.eks. `hund-en` i stedet for `hun-den`). Løsning: ret det i teksten med `·`.
- Tekst oven på illustrationer eller i dekorative skrifttyper bliver genkendt dårligere.
- Originalsiden vises som foto; illustrationer bliver endnu ikke klippet ud automatisk.

## Idéer

- Klip illustrationer ud automatisk og placér dem ved siden af teksten
- Erstat teksten direkte i billedet (inpainting)
- Gem bøger lokalt, eksport som PDF
- Læselineal, linje-for-linje-tilstand
