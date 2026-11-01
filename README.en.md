# Læsehjælper

*Danish for "reading helper". · [Dansk](README.md)*

Make photographed children's book pages easier to read. The text is recognized with OCR and replaced right on the page: the pictures stay where they are, but the text is set in a highly legible font with colored syllables or syllable arcs. Alternatively, the text can be shown on its own, large and with generous spacing. Built for children learning to read and for readers with dyslexia. Supports Danish, German and English books.

Everything runs locally in the browser. No photos are uploaded anywhere.

**Try it:** https://eikrad.github.io/laesehjaelper/

## Features

- Two views: the book page with the new text in its original place, or text only
- Interface in Danish, German or English
- Text recognition (Danish, German, English) with [Tesseract.js](https://github.com/naptha/tesseract.js)
- Syllable splitting based on the Danish and German TeX hyphenation patterns ([hyphen](https://github.com/ytiurin/hyphen))
- Syllables shown in alternating colors (blue/red), as arcs, or both
- Fonts: Andika, OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Adjustable font size, letter spacing, line spacing and background color
- Tap a word to hear it read aloud, or read the whole page with word-by-word highlighting
- “Hyphens in the book” setting: for early readers that split words into syllables with hyphens themselves (“sko-le”)
- Tilted photos are straightened, and “text” that OCR finds inside illustrations is filtered out
- Correct the recognized text; set your own syllable breaks with `·` (e.g. `hun·den`)
- Focus mode: just the text, full screen
- Show the original text with one tap to spot recognition errors
- Bookshelf: books are stored on the device, with title, page order and reading position
- Cropping: the page is found in the photo automatically and straightened; corners can be adjusted
- E-book: save a book as EPUB 3 (fixed layout, opens in any reading app) and import it again losslessly
- Installable as an app and usable offline

## Development

```bash
npm install
npm run build       # outputs dist/
npm run typecheck   # TypeScript (strict)
npm test            # unit tests (Vitest)
npm run test:e2e    # end-to-end tests in Chromium (Playwright)
```

CI (`.github/workflows/ci.yml`) runs the type check, unit tests, build and end-to-end tests on every push and pull request. `main` is only deployed to GitHub Pages when everything passes.

## Structure

The project is written in TypeScript (strict).

- `src/index.html`: page HTML and CSS
- `src/app.ts`: app logic (UI, text recognition, bookshelf)
- `src/layout.ts`: turns raw OCR output into clean text lines and paragraphs with positions (filters illustration noise)
- `src/pagedetect.ts`: finds the page in the photo and straightens it (OpenCV)
- `src/silben.ts`: syllable splitting (Danish, German, English)
- `src/db.ts`: stores books on the device (IndexedDB)
- `src/epub.ts`: EPUB export and import
- `src/prep.ts`: image preparation for OCR (background flattening)
- `src/sw.ts`: service worker (offline, installation)
- `src/types.ts`: shared types
- `build.ts`: builds `dist/` with esbuild and copies Tesseract, OpenCV and language files

`npm run typecheck` checks the types.

## Known limitations

- The hyphenation patterns don't split off single letters at the start or end of a word, and some Danish splits are off (e.g. `hund-en` instead of `hun-den`). Workaround: fix it in the text with `·`.
- Text on top of illustrations or in decorative fonts is recognized less reliably.
- The old text is painted over with the surrounding background color. This looks clean on plain backgrounds; text on top of an illustration gets its own light panel.
- The new text can only be as large as the page has room for. For really large text, use the text-only view.

## Ideas

- Better removal of text on illustrations (inpainting)
- Save books locally, export as PDF
- Reading ruler, line-by-line mode

## Disclaimer

Læsehjælper is a free hobby project, not a finished product. Text recognition and syllable splitting make mistakes, so always check the text before a child reads it. The app does not replace teaching, reading support or a dyslexia assessment.

Photos and books are processed and stored only on the user's own device. Books are protected by copyright: only use Læsehjælper for books you have access to, for private use, and do not share converted books unless you hold the rights.

The software is provided as is, without warranty of any kind.

## License

The code is released under the [MIT License](LICENSE). Third-party components have their own licenses, see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
