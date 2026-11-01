# Læsehjælper

*Danish for "reading helper".*

Make photographed children's book pages easier to read. The text is recognized with OCR and re-typeset in a highly legible font, larger, with more spacing, and with colored syllables or syllable arcs. Built for children learning to read and for readers with dyslexia. Supports Danish and German books.

Everything runs locally in the browser. No photos are uploaded anywhere.

**Try it:** https://eikrad.github.io/laesehjaelper/

## Features

- Interface in Danish or German
- Text recognition (Danish, German) with [Tesseract.js](https://github.com/naptha/tesseract.js)
- Syllable splitting based on the Danish and German TeX hyphenation patterns ([hyphen](https://github.com/ytiurin/hyphen))
- Syllables shown in alternating colors (blue/red), as arcs, or both
- Fonts: Andika, OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Adjustable font size, letter spacing, line spacing and background color
- Tap a word to hear it read aloud, or read the whole page with word-by-word highlighting
- Correct the recognized text; set your own syllable breaks with `·` (e.g. `hun·den`)
- Focus mode: just the text, full screen

## Development

```bash
npm install
npm run build      # outputs dist/
npx serve dist     # or any other static web server
```

Every push to `main` builds the app and deploys it to GitHub Pages automatically.

## Structure

- `src/index.html`: UI and app logic
- `src/silben.js`: syllable splitting (bundled with esbuild)
- `build.mjs`: builds `dist/`, inlines the syllable code and the OpenDyslexic font, and copies the Tesseract files and language data

## Known limitations

- The hyphenation patterns don't split off single letters at the start or end of a word, and some Danish splits are off (e.g. `hund-en` instead of `hun-den`). Workaround: fix it in the text with `·`.
- Text on top of illustrations or in decorative fonts is recognized less reliably.
- The original page is shown as a photo; illustrations are not yet cropped out automatically.

## Ideas

- Automatically crop illustrations and place them next to the text
- Replace the text directly in the image (inpainting)
- Save books locally, export as PDF
- Reading ruler, line-by-line mode
