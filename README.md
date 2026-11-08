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
- “Hyphens in the book” setting: for early readers that split words into syllables with hyphens or dots themselves (“sko-le”, “sko·le”); marks that text recognition misses are found in the photo
- Tilted photos are straightened, and “text” that OCR finds inside illustrations is filtered out
- Every page is recognized twice (as is and with a flattened background), so text on tinted pictures is found too
- Correct the recognized text; set your own syllable breaks with `·` (e.g. `hun·den`)
- Move or resize text boxes on the book page with your finger (under “Check and correct the text”), e.g. if the new text runs into a picture
- Headings stay larger than body text, and bold words are detected and set in bold (editable with `*word*`)
- Reading mode: just the text. On tablets and laptops it fills the whole screen without browser bars (Fullscreen API), and leaving fullscreen with the system gesture also ends reading mode. iPhone and the installed app keep the plain reading mode
- Show the original text with one tap to spot recognition errors
- Bookshelf first: stored books open from large covers and show the page where reading stopped. “New book” stays secondary; with no books yet, taking a photo is the main action. Books, page order and reading positions stay on the device.
- Reading and preparing books have separate views. Reading has page turning, read-aloud and Aa settings; “Edit book” opens the workshop. Back returns through reading to the bookshelf, and page links survive reload.
- The book workshop keeps page thumbnails and recognition status together with crop, text correction, moving text boxes, page order, title, EPUB export and deletion. Wide screens put the list beside the selected-page editor; narrow screens put it first. “Back to reading” returns to the selected page. From reading, “Edit book” → “Correct this page” focuses the current page’s text in two taps, and returns to that page after correction.
- An optional parent gate under More settings asks for a two-second hold on “Edit book”, with visible progress. It works with touch, mouse, Enter and Space and is off by default. This prevents accidental taps; it is not a security lock.
- Cropping: automatically suggests corners and curved edges from the outline of a central page and straightens it, including when one edge leaves the photo. Corners and curved edges can be adjusted; manual adjustments take priority over detection and are saved for later recropping.
- In the workshop, select a page and use ‹ / › under its thumbnail to reorder it. “Insert page before” and “Insert page after” add missing photos at that position, including multiple photos in selection order. “Replace photo” keeps the page’s position and link; the new photo and its recognised text replace the old content only after you accept the crop. Manual text corrections on the replaced page are discarded.
- E-book: save a book as EPUB 3 (fixed layout, opens in any reading app) and import it again losslessly
- Installable as an app and usable offline
- The screen stays on while a book is open, so it does not go dark in the middle of a page; after 10 minutes without a touch or reading aloud it may turn off again (in browsers with the Screen Wake Lock API)

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
- `src/pagecurve.ts`: fits smooth page-edge curves to the detected outline
- `src/silben.ts`: syllable splitting (Danish, German, English)
- `src/db.ts`: stores books on the device (IndexedDB)
- `src/epub.ts`: EPUB export and import
- `src/prep.ts`: image preparation for OCR (background flattening)
- `src/sw.ts`: service worker (offline, installation)
- `src/types.ts`: shared types
- `build.ts`: builds `dist/` with esbuild and copies Tesseract, OpenCV and language files
- `tests/`: unit tests, end-to-end tests and self-made test pages
- `docs/research/`: literature reviews behind "What does the research say?"

## What does the research say?

Læsehjælper is a reading tool, not a treatment. Its settings are based on what studies of beginning readers and children with dyslexia show. The full literature reviews, with every source checked, are in [docs/research](docs/research/README.md).

**What helps most is not a setting on the screen.**

- **Teaching:** Systematic, early teaching of letters, sounds and sounding out is the best-supported help for dyslexia. Effects are moderate, and larger in the first school years and with more hours (Hall et al. 2023; McArthur et al. 2018; Galuschka et al. 2014). In a Danish trial, small-group lessons in grade 1 cut the share of at-risk children who could hardly read from 37 % to 15 % (Gellert et al. 2024). Læsehjælper does not replace this teaching. Danish is one of the languages in which children take longest to read accurately (Seymour et al. 2003).
- **Practice with an adult:** Parents help most when they listen to their child read and help with specific skills, more than when they only read to the child (Sénéchal & Young 2008). In a Danish trial with 1,587 second graders, a few books and simple advice – praise effort, talk about the story, don't correct every slip – improved reading (Andersen & Nielsen 2016). Reading apps work far better with an adult involved (McTigue et al. 2020).

**The settings help less, and not every child:**

- **Spacing:** More space between letters reduces reading errors for some children, but studies disagree, many find no change in speed, and the benefit is not specific to dyslexia (Zorzi et al. 2012; Hakvoort et al. 2017; Łuniewska et al. 2022). Widening letter spacing without widening the gaps between words slows reading (Galliussi et al. 2020), so Læsehjælper widens word spacing automatically.
- **Short lines** help some readers with dyslexia, especially those with weak visual attention; others read better with normal lines. The studies tested teenagers, not young children (Schneps et al. 2013).
- **Font:** Special dyslexia fonts do not improve reading speed or accuracy (meta-analysis: Azzarello et al. 2026), and children often prefer ordinary fonts (Wery & Diliberto 2017). The default is therefore Andika, a plain, clear font; OpenDyslexic can be chosen if your child likes it.
- **Coloured syllables** made no difference to reading speed in an eye-tracking study (Häikiö et al. 2015). Some weaker beginners read single words more accurately with them (Lopes & Barrera 2019). A separate German class study found a small gain in grade 2 using syllable arcs, not colours (Dreschinski 2022, a dissertation); this does not establish a benefit from coloured syllables. Any benefit from colours seems to be early, small and mainly for long words. Coloured syllables have never been tested in Danish, where written and spoken syllables often differ. A review recommends them only for some children and only while they move on to fluent reading (Brügelmann 2025, a report, not peer-reviewed). Hyphens inside words slow reading down (Häikiö et al. 2015). That is why syllable colours start switched off: they are one tap away under “Syllables” → “Colour” in the settings, and each new reader starts without them. Devices that used the app before keep their own choice. A further option per reader, “Long words only”, marks syllables (colours or arcs) only on words with three or more syllables, where the aids seem to help most (Brügelmann 2025).
- **Word parts (Danish):** Teaching children to notice word parts helps them read and spell long words, also in Danish (Goodwin & Ahn 2010; Arnbak & Elbro 2000; Gellert et al. 2021). Showing word parts on the page builds on this but has not been tested itself.
- **Reading aloud** helps children understand a text, though the effect is modest (Wood et al. 2018), and listening alone does not teach reading. Highlighting each word did not add to comprehension in a small study (Keelor et al. 2023) and did not help children learn new words (Gerbier et al. 2018). In that study the children were pulled along by the voice, and most preferred no highlighting, though the weakest readers tended to like it. Word highlighting during read-aloud is therefore a setting per reader, off for new readers; devices that used the app before keep it on.
- **Listen first, then read:** Reading the same text again after hearing it makes reading more fluent, mostly on the practised text (Lee & Yoon 2017); in whole classes the effect is small (Lauer-Schmaltz et al. 2014). Reading new pages helps about as much (Zimmermann et al. 2021).
- **Tap a word:** Hearing hard words on request while reading helped children in training studies, including Danish pupils who heard the word in parts and then whole (Olson & Wise 1992; Elbro et al. 1996).
- **Coloured backgrounds or overlays** have no proven effect beyond placebo (Griffiths et al. 2016; Suttle et al. 2018). The background colour is purely a matter of comfort.
- **A calm reading screen:** Interactive extras in digital storybooks do not help children understand the story, and mini-games harm understanding (Takacs, Swart & Bus 2015; Bus et al. 2026). Keeping adult tools in a separate workshop is a design inference from that research; the studies did not test this navigation.
- **Reading together:** Talking about a book with open questions helps young children's vocabulary (Mol et al. 2008), but mainly at age 2–3, and later studies find smaller effects (Noble et al. 2019). The questions in Læsehjælper are therefore optional and off by default.

Sources:

- Hall et al. 2023, *Reading Research Quarterly* — [doi:10.1002/rrq.477](https://doi.org/10.1002/rrq.477)
- McArthur et al. 2018, *Cochrane Database of Systematic Reviews* — [doi:10.1002/14651858.CD009115.pub3](https://doi.org/10.1002/14651858.CD009115.pub3)
- Galuschka et al. 2014, *PLOS ONE* — [doi:10.1371/journal.pone.0089900](https://doi.org/10.1371/journal.pone.0089900)
- Gellert et al. 2024, *NyS – Nydanske Sprogstudier* — [doi:10.7146/nys.v1i66.148749](https://doi.org/10.7146/nys.v1i66.148749)
- Seymour et al. 2003, *British Journal of Psychology* — [doi:10.1348/000712603321661859](https://doi.org/10.1348/000712603321661859)
- Sénéchal & Young 2008, *Review of Educational Research* — [doi:10.3102/0034654308320319](https://doi.org/10.3102/0034654308320319)
- Andersen & Nielsen 2016, *PNAS* — [doi:10.1073/pnas.1607946113](https://doi.org/10.1073/pnas.1607946113)
- McTigue et al. 2020, *Reading Research Quarterly* — [doi:10.1002/rrq.256](https://doi.org/10.1002/rrq.256)
- Zorzi et al. 2012, *PNAS* — [doi:10.1073/pnas.1205566109](https://doi.org/10.1073/pnas.1205566109)
- Hakvoort et al. 2017, *Journal of Experimental Child Psychology* — [doi:10.1016/j.jecp.2017.07.010](https://doi.org/10.1016/j.jecp.2017.07.010)
- Łuniewska et al. 2022, *Learning and Instruction* — [doi:10.1016/j.learninstruc.2021.101576](https://doi.org/10.1016/j.learninstruc.2021.101576)
- Galliussi et al. 2020, *Annals of Dyslexia* — [doi:10.1007/s11881-020-00194-x](https://doi.org/10.1007/s11881-020-00194-x)
- Schneps et al. 2013, *PLOS ONE* — [doi:10.1371/journal.pone.0071161](https://doi.org/10.1371/journal.pone.0071161), [doi:10.1371/journal.pone.0075634](https://doi.org/10.1371/journal.pone.0075634)
- Azzarello et al. 2026, *Annals of Dyslexia* — [doi:10.1007/s11881-026-00389-8](https://doi.org/10.1007/s11881-026-00389-8)
- Wery & Diliberto 2017, *Annals of Dyslexia* — [doi:10.1007/s11881-016-0127-1](https://doi.org/10.1007/s11881-016-0127-1)
- Häikiö et al. 2015, *Journal of Cognitive Psychology* — [doi:10.1080/20445911.2014.982126](https://doi.org/10.1080/20445911.2014.982126)
- Lopes & Barrera 2019, *Estudos de Psicologia (Natal)* — [doi:10.22491/1678-4669.20190035](https://doi.org/10.22491/1678-4669.20190035)
- Dreschinski 2022, dissertation, PH Heidelberg — [doi:10.46586/SLLD.254](https://doi.org/10.46586/SLLD.254)
- Brügelmann 2025, report on peDOCS, not peer-reviewed — [doi:10.25656/01:34472](https://doi.org/10.25656/01:34472)
- Goodwin & Ahn 2010, *Annals of Dyslexia* — [doi:10.1007/s11881-010-0041-x](https://doi.org/10.1007/s11881-010-0041-x)
- Arnbak & Elbro 2000, *Scandinavian Journal of Educational Research* — [doi:10.1080/00313830050154485](https://doi.org/10.1080/00313830050154485)
- Gellert et al. 2021, *Reading Research Quarterly* — [doi:10.1002/rrq.325](https://doi.org/10.1002/rrq.325)
- Wood et al. 2018, *Journal of Learning Disabilities* — [doi:10.1177/0022219416688170](https://doi.org/10.1177/0022219416688170)
- Keelor et al. 2023, *Annals of Dyslexia* — [doi:10.1007/s11881-023-00281-9](https://doi.org/10.1007/s11881-023-00281-9)
- Gerbier et al. 2018, *Computer Speech & Language* — [doi:10.1016/j.csl.2017.07.003](https://doi.org/10.1016/j.csl.2017.07.003)
- Lee & Yoon 2017, *Journal of Learning Disabilities* — [doi:10.1177/0022219415605194](https://doi.org/10.1177/0022219415605194)
- Lauer-Schmaltz et al. 2014, *Didaktik Deutsch* — [doi:10.25656/01:17152](https://doi.org/10.25656/01:17152)
- Zimmermann et al. 2021, *Remedial and Special Education* — [doi:10.1177/0741932519855058](https://doi.org/10.1177/0741932519855058)
- Olson & Wise 1992, *Reading and Writing* — [doi:10.1007/BF01027488](https://doi.org/10.1007/BF01027488)
- Elbro et al. 1996, *Scandinavian Journal of Psychology* — [doi:10.1111/j.1467-9450.1996.tb00647.x](https://doi.org/10.1111/j.1467-9450.1996.tb00647.x)
- Griffiths et al. 2016, *Ophthalmic & Physiological Optics* — [doi:10.1111/opo.12316](https://doi.org/10.1111/opo.12316)
- Suttle et al. 2018, *Clinical and Experimental Optometry* — [doi:10.1111/cxo.12676](https://doi.org/10.1111/cxo.12676)
- Takacs, Swart & Bus 2015, *Review of Educational Research* — [doi:10.3102/0034654314566989](https://doi.org/10.3102/0034654314566989)
- Bus et al. 2026, *Early Education and Development* — [doi:10.1080/10409289.2025.2571978](https://doi.org/10.1080/10409289.2025.2571978)
- Mol et al. 2008, *Early Education and Development* — [doi:10.1080/10409280701838603](https://doi.org/10.1080/10409280701838603)
- Noble et al. 2019, *Educational Research Review* — [doi:10.1016/j.edurev.2019.100290](https://doi.org/10.1016/j.edurev.2019.100290)

## Known limitations

- Word parts rely on a word list and simple rules: words not on the list stay whole, and ambiguous words (e.g. “anden”) are not split. Danish only so far.
- The hyphenation patterns don't split off single letters at the start or end of a word, and some Danish splits are off (e.g. `hund-en` instead of `hun-den`). Workaround: fix it in the text with `·`.
- Text on top of illustrations or in decorative fonts is recognized less reliably.
- Only the old letters are removed: the paper or picture under them is filled in from their surroundings (inpainting), so uneven light and paper texture stay as they were. On an illustration, the new text gets a soft light halo. Fine, regular patterns can look a little blurred where the text was.
- On the book page, text size and spacing apply as far as the page has room: the size comes first, then as much of the spacing as fits. When the page has no room for the chosen size, the settings say so; for really large text, use the text-only view.
- Page detection is conservative: aim at one page in the middle of the photo, with at least three edges visible. Shadows, illustrations and two-page spreads can still confuse it. Check the frame before accepting.
- Automatic curvature follows the visible page edges. A hidden or clipped edge gives no curvature information; folds inside the page and complex bends can still need manual adjustment of the edge midpoints.

## Roadmap

The roadmap is organised into epics and stories (see [CONTRIBUTING.md](CONTRIBUTING.md)). What is planned is tracked as [issues labelled `roadmap`](https://github.com/eikrad/laesehjaelper/issues?q=is%3Aissue%20is%3Aopen%20label%3Aroadmap). Report ideas and bugs as an [issue](https://github.com/eikrad/laesehjaelper/issues/new). Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md).

## Disclaimer

Læsehjælper is a free hobby project, not a finished product. Text recognition and syllable splitting make mistakes, so always check the text before a child reads it. The app does not replace teaching, reading support or a dyslexia assessment.

Photos and books are processed and stored only on the user's own device. Books are protected by copyright: only use Læsehjælper for books you have access to, for private use, and do not share converted books unless you hold the rights.

The software is provided as is, without warranty of any kind.

## License

The code is released under the [MIT License](LICENSE). Third-party components have their own licenses, see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
