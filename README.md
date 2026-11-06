# Læsehjælper

[![CI](https://github.com/eikrad/laesehjaelper/actions/workflows/ci.yml/badge.svg)](https://github.com/eikrad/laesehjaelper/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*Danish for "reading helper". · [Dansk](README.da.md) · [Deutsch](README.de.md)*

Make photographed children's book pages easier to read. The text is recognized with OCR and replaced right on the page: the pictures stay where they are, but the text is set in a highly legible font with colored syllables or syllable arcs. Alternatively, the text can be shown on its own, large and with generous spacing. Built for children learning to read and for readers with dyslexia. Supports Danish, German and English books.

Everything runs locally in the browser. No photos are uploaded anywhere.

**Try it:** https://eikrad.github.io/laesehjaelper/

## Features

- Two views: the book page with the new text in its original place, or text only
- Interface in Danish, German or English
- Text recognition (Danish, German, English) with [Tesseract.js](https://github.com/naptha/tesseract.js)
- Syllable splitting based on the Danish, German and English TeX hyphenation patterns ([hyphen](https://github.com/ytiurin/hyphen))
- Syllables shown in alternating colors (blue/red, colors adjustable), as arcs, or both
- Word parts (Danish): compound words are split into known parts, and inflection endings are shown muted (e.g. sommer|fugl|ene)
- Fonts: Andika (default), OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Adjustable font size, letter spacing, line spacing and background color
- Short lines with 2–3 words in the text view (optional)
- Several readers: each child has their own settings for font, spacing, syllables and reading aloud
- Read together: a few open questions per page for the adult, including your own (optional)
- Tap a word to hear it – first whole, then slowly syllable by syllable, then whole again
- Have the whole page read aloud with word-by-word highlighting, slow or normal; afterwards it's the child's turn ("Listen again")
- “Hyphens in the book” setting: for early readers that split words into syllables with hyphens themselves (“sko-le”)
- Tilted photos are straightened, and “text” that OCR finds inside illustrations is filtered out
- Every page is recognized twice (as is and with a flattened background), so text on tinted pictures is found too
- Correct the recognized text; set your own syllable breaks with `·` (e.g. `hun·den`)
- Move or resize text boxes on the book page with your finger (under “Check and correct the text”), e.g. if the new text runs into a picture
- Headings stay larger than body text, and bold words are detected and set in bold (editable with `*word*`)
- Focus mode: just the text, full screen
- Show the original text with one tap to spot recognition errors
- Bookshelf first: stored books open from large covers and show the page where reading stopped. “New book” stays secondary; with no books yet, taking a photo is the main action. Books, page order and reading positions stay on the device.
- Reading and preparing books have separate views. Reading has page turning, read-aloud and Aa settings; “Edit book” opens the workshop. Back returns through reading to the bookshelf, and page links survive reload.
- The book workshop keeps page thumbnails and recognition status together with crop, text correction, moving text boxes, page order, title, EPUB export and deletion. Wide screens put the list beside the selected-page editor; narrow screens put it first. “Back to reading” returns to the selected page. From reading, “Edit book” → “Correct this page” focuses the current page’s text in two taps, and returns to that page after correction.
- An optional parent gate under More settings asks for a two-second hold on “Edit book”, with visible progress. It works with touch, mouse, Enter and Space and is off by default. This prevents accidental taps; it is not a security lock.
- Cropping: the page is found in the photo automatically and straightened; corners and edges can be adjusted, including for curved pages
- E-book: save a book as EPUB 3 (fixed layout, opens in any reading app) and import it again losslessly
- Installable as an app and usable offline

## Development

```bash
npm install
npm run build       # outputs dist/
npm run typecheck   # TypeScript (strict)
npm run lint        # Biome for TypeScript
npm test            # unit tests (Vitest)
npm run test:e2e    # end-to-end tests in Chromium (Playwright)
```

CI (`.github/workflows/ci.yml`) runs lint, the type check, unit tests, build and end-to-end tests on every push and pull request. `main` is only deployed to GitHub Pages when everything passes.

## Structure

The project is written in TypeScript (strict).

- `src/index.html`: page HTML and CSS
- `src/app.ts`: app logic (UI, text recognition, bookshelf)
- `src/layout.ts`: turns raw OCR output into clean text lines and paragraphs with positions (filters illustration noise)
- `src/pagedetect.ts`: finds the page in the photo and straightens it (OpenCV), including curved pages
- `src/silben.ts`: syllable splitting (Danish, German, English)
- `src/db.ts`: stores books on the device (IndexedDB)
- `src/epub.ts`: EPUB export and import
- `src/prep.ts`: image preparation for OCR (background flattening)
- `src/sw.ts`: service worker (offline, installation)
- `src/types.ts`: shared types
- `build.ts`: builds `dist/` with esbuild and copies Tesseract, OpenCV and language files
- `tests/`: unit tests, end-to-end tests and self-made test pages

## What does the research say?

Læsehjælper is a reading tool, not a treatment. Its settings are based on what studies of beginning readers and children with dyslexia show:

- **Spacing:** More space between letters helps many children with dyslexia read faster and more accurately (Zorzi et al. 2012) – but only if word spacing grows too (Galliussi et al. 2020). Læsehjælper therefore increases word spacing automatically.
- **Short lines** help some readers with dyslexia, especially those with weak visual attention; others read better with normal lines (Schneps et al. 2013).
- **Font:** The letter shapes themselves make little difference. OpenDyslexic gave no advantage, and no child preferred it (Wery & Diliberto 2017; Galliussi et al. 2020). The default is therefore Andika, a plain, clear font; OpenDyslexic can be chosen if your child likes it.
- **Coloured syllables** help some children at the start and not others; hyphens inside words slow reading down (Häikiö et al. 2015; Brügelmann 2025). Try what your child likes, and switch the colours off once reading is fluent.
- **Reading aloud** helps comprehension; highlighting each word adds nothing extra (Keelor et al. 2023). Reading the same text several times, ideally after hearing it, makes reading more fluent (Lee & Yoon 2017).
- **Coloured backgrounds or overlays** have no proven effect beyond placebo (Griffiths et al. 2016). The background colour is purely a matter of comfort.
- **Teaching:** Systematic work on letters and sounds is the best-supported help for dyslexia (Galuschka et al. 2014). Danish is one of the languages in which children take longest to read accurately (Seymour et al. 2003).
- **A calm reading screen:** Interactive extras in digital storybooks can distract from the story (Takacs, Swart & Bus 2015). Keeping adult tools in a separate workshop is a design inference from that research; the study did not test this navigation or establish that it improves reading.

Sources:

- Takacs, Swart & Bus 2015, *Review of Educational Research* — [doi:10.3102/0034654314566989](https://doi.org/10.3102/0034654314566989)
- Zorzi et al. 2012, *PNAS* — [doi:10.1073/pnas.1205566109](https://doi.org/10.1073/pnas.1205566109)
- Galliussi et al. 2020, *Annals of Dyslexia* — [doi:10.1007/s11881-020-00194-x](https://doi.org/10.1007/s11881-020-00194-x)
- Schneps et al. 2013, *PLOS ONE* — [doi:10.1371/journal.pone.0071161](https://doi.org/10.1371/journal.pone.0071161), [doi:10.1371/journal.pone.0075634](https://doi.org/10.1371/journal.pone.0075634)
- Wery & Diliberto 2017, *Annals of Dyslexia* — [doi:10.1007/s11881-016-0127-1](https://doi.org/10.1007/s11881-016-0127-1)
- Häikiö et al. 2015, *Journal of Cognitive Psychology* — [doi:10.1080/20445911.2014.982126](https://doi.org/10.1080/20445911.2014.982126)
- Brügelmann 2025 — [pedocs.de](https://www.pedocs.de/volltexte/2025/34472/pdf/Bruegelmann_2025_Red_and_blue.pdf)
- Keelor et al. 2023, *Annals of Dyslexia* — [doi:10.1007/s11881-023-00281-9](https://doi.org/10.1007/s11881-023-00281-9)
- Lee & Yoon 2017, *Journal of Learning Disabilities* — [doi:10.1177/0022219415605194](https://doi.org/10.1177/0022219415605194)
- Galuschka et al. 2014, *PLOS ONE* — [doi:10.1371/journal.pone.0089900](https://doi.org/10.1371/journal.pone.0089900)
- Griffiths et al. 2016, *Ophthalmic & Physiological Optics* — [doi:10.1111/opo.12316](https://doi.org/10.1111/opo.12316)
- Seymour et al. 2003, *British Journal of Psychology* — [doi:10.1348/000712603321661859](https://doi.org/10.1348/000712603321661859)

## Known limitations

- Word parts rely on a word list and simple rules: words not on the list stay whole, and ambiguous words (e.g. “anden”) are not split. Danish only so far.
- The hyphenation patterns don't split off single letters at the start or end of a word, and some Danish splits are off (e.g. `hund-en` instead of `hun-den`). Workaround: fix it in the text with `·`.
- Text on top of illustrations or in decorative fonts is recognized less reliably.
- The old text is painted over with the surrounding background color. This looks clean on plain backgrounds; text on top of an illustration gets its own light panel.
- The new text can only be as large as the page has room for. For really large text, use the text-only view.
- Curved pages currently have to be straightened by hand (see [#1](https://github.com/eikrad/laesehjaelper/issues/1)).

## Roadmap

The roadmap is organised into epics and stories (see [CONTRIBUTING.md](CONTRIBUTING.md)). What is planned is tracked as [issues labelled `roadmap`](https://github.com/eikrad/laesehjaelper/issues?q=is%3Aissue%20is%3Aopen%20label%3Aroadmap). Report ideas and bugs as an [issue](https://github.com/eikrad/laesehjaelper/issues/new). Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

Læsehjælper is a free hobby project, not a finished product. Text recognition and syllable splitting make mistakes, so always check the text before a child reads it. The app does not replace teaching, reading support or a dyslexia assessment.

Photos and books are processed and stored only on the user's own device. Books are protected by copyright: only use Læsehjælper for books you have access to, for private use, and do not share converted books unless you hold the rights.

The software is provided as is, without warranty of any kind.

## License

The code is released under the [MIT License](LICENSE). Third-party components have their own licenses, see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
