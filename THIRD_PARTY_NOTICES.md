# Third-party components

Læsehjælper itself is licensed under the MIT License (see `LICENSE`). The built app (`dist/`) bundles or loads the following components, each under its own license:

Full font and PDF-component licence texts and copyright notices are kept in `licenses/`.
The build includes these texts in `licenses.html`, linked under “Licences and fonts” in
the start page's about section and available offline. The site also includes the primary
licence texts for OCR, OpenCV, syllable splitting and the Danish dictionary.

| Component | Used for | License |
|---|---|---|
| [tesseract.js](https://github.com/naptha/tesseract.js) and tesseract.js-core | Text recognition | Apache-2.0 |
| [@tesseract.js-data](https://github.com/naptha/tessdata) (dan, deu) | Language data for text recognition | MIT (data originally from Tesseract, Apache-2.0) |
| [OpenCV.js](https://opencv.org/) via [@techstark/opencv-js](https://github.com/TechStark/opencv-js) | Page detection and perspective correction | Apache-2.0 |
| [fflate](https://github.com/101arrowz/fflate) | Creating and reading EPUB (ZIP) files | MIT |
| [pdf-lib](https://github.com/Hopding/pdf-lib) and [@pdf-lib/fontkit](https://github.com/Hopding/fontkit) | Creating PDFs with embedded reading fonts on the device | MIT |
| Components already embedded in the upstream fontkit bundle (including its Brotli port and Node polyfills) | Font decoding and subsetting | MIT, BSD and Apache-2.0; individual notices in `licenses/fontkit-*.txt` |
| [woff2-encoder](https://github.com/itskyedo/woff2-encoder), including Google's [WOFF2](https://github.com/google/woff2) and [Brotli](https://github.com/google/brotli) decoders | Restoring webfont outlines before PDF embedding | MIT |
| [hyphen](https://github.com/ytiurin/hyphen) | Syllable splitting | ISC |
| TeX hyphenation patterns (Danish, reformed German, British English), included in `hyphen` | Syllable splitting | MIT; original notices in `licenses/hyphen-patterns-*.txt` |
| Danish word list from [Stavekontrolden](https://www.stavekontrolden.dk) via [dictionary-da](https://github.com/wooorm/dictionaries/tree/main/dictionaries/da) (`dist/lang/da-words.js`, base forms only) | Word parts (morphemes) for Danish | Tri-licensed GPL-2.0 / LGPL-2.1 / MPL-1.1; used here under **MPL-1.1**. © Foreningen for frit tilgængelige sprogværktøjer, based on data from Det Danske Sprog- og Litteraturselskab |
| [OpenDyslexic](https://opendyslexic.org/) via @fontsource/opendyslexic | Reading font (embedded) | SIL Open Font License 1.1 |
| Andika, Atkinson Hyperlegible, Lexend | Reading and UI fonts (loaded from Google Fonts) | SIL Open Font License 1.1 |

The Andika webfonts in `tests/fixtures/fonts/` are unmodified Latin subsets from Google Fonts
([regular](https://fonts.gstatic.com/s/andika/v27/mem_Ya6iyW-LwqgwarYQ.woff2),
[bold](https://fonts.gstatic.com/s/andika/v27/mem8Ya6iyW-Lwqg40ZMFVZ0b.woff2)).
Their copyright notice and OFL are included in `tests/fixtures/fonts/OFL.txt`.

[Biome](https://github.com/biomejs/biome) is used for development-time linting and is not bundled into the app. License: MIT OR Apache-2.0; copyright © 2023 Biome Developers and Contributors.

OFL fonts may be embedded or subset in the exported PDF without adding a visible credit page
or applying the OFL to the book itself (see the [OFL FAQ, 1.10–1.13](https://openfontlicense.org/ofl-faq/)).
The licence texts in `licenses/` cover distribution of font files with the app. EPUB exports
retain the original font bytes, including their authorship and licence metadata.

The generated Danish base-form list remains under MPL-1.1. Its source is
[`dictionary-da`](https://github.com/wooorm/dictionaries/tree/main/dictionaries/da);
the transformation (lowercase base forms, no affix flags) is in this project's
[`build.ts`](https://github.com/eikrad/laesehjaelper/blob/main/build.ts).
The original attribution and the full MPL-1.1 are included in `licenses/`.
