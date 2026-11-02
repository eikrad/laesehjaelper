# Third-party components

Læsehjælper itself is licensed under the MIT License (see `LICENSE`). The built app (`dist/`) bundles or loads the following components, each under its own license:

| Component | Used for | License |
|---|---|---|
| [tesseract.js](https://github.com/naptha/tesseract.js) and tesseract.js-core | Text recognition | Apache-2.0 |
| [@tesseract.js-data](https://github.com/naptha/tessdata) (dan, deu) | Language data for text recognition | MIT (data originally from Tesseract, Apache-2.0) |
| [OpenCV.js](https://opencv.org/) via [@techstark/opencv-js](https://github.com/TechStark/opencv-js) | Page detection and perspective correction | Apache-2.0 |
| [fflate](https://github.com/101arrowz/fflate) | Creating and reading EPUB (ZIP) files | MIT |
| [hyphen](https://github.com/ytiurin/hyphen) | Syllable splitting | ISC |
| TeX hyphenation patterns (Danish, German), included in `hyphen` | Syllable splitting | See the [hyph-utf8 project](https://github.com/hyphenation/tex-hyphen) for the license of each pattern file |
| Danish word list from [Stavekontrolden](https://www.stavekontrolden.dk) via [dictionary-da](https://github.com/wooorm/dictionaries/tree/main/dictionaries/da) (`dist/lang/da-words.js`, base forms only) | Word parts (morphemes) for Danish | Tri-licensed GPL-2.0 / LGPL-2.1 / MPL-1.1; used here under **MPL-1.1**. © Foreningen for frit tilgængelige sprogværktøjer, based on data from Det Danske Sprog- og Litteraturselskab |
| [OpenDyslexic](https://opendyslexic.org/) via @fontsource/opendyslexic | Reading font (embedded) | SIL Open Font License 1.1 |
| Andika, Atkinson Hyperlegible, Lexend | Reading and UI fonts (loaded from Google Fonts) | SIL Open Font License 1.1 |

[Biome](https://github.com/biomejs/biome) is used for development-time linting and is not bundled into the app. License: MIT OR Apache-2.0; copyright © 2023 Biome Developers and Contributors.
