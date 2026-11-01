# Læsehjælper

*Danish for "reading helper". · [Dansk](README.md)*

Make photographed children's book pages easier to read. The text is recognized with OCR and replaced right on the page: the pictures stay where they are, but the text is set in a highly legible font with colored syllables or syllable arcs. Alternatively, the text can be shown on its own, large and with generous spacing. Built for children learning to read and for readers with dyslexia. Supports Danish and German books.

Everything runs locally in the browser. No photos are uploaded anywhere.

**Try it:** https://eikrad.github.io/laesehjaelper/

## Features

- Two views: the book page with the new text in its original place, or text only
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
- The old text is painted over with the surrounding background color. This looks clean on plain backgrounds; text on top of an illustration gets its own light panel.
- The new text can only be as large as the page has room for. For really large text, use the text-only view.

## Ideas

- Better removal of text on illustrations (inpainting)
- Save books locally, export as PDF
- Reading ruler, line-by-line mode
