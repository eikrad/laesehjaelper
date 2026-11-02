# Læsehjælper

[![CI](https://github.com/eikrad/laesehjaelper/actions/workflows/ci.yml/badge.svg)](https://github.com/eikrad/laesehjaelper/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*Dänisch für „Lesehelfer“. · [Dansk](README.md) · [English](README.en.md)*

Fotografierte Seiten aus Kinderbüchern leichter lesbar machen. Der Text wird per Texterkennung (OCR) erkannt und direkt auf der Seite ersetzt: Die Bilder bleiben, wo sie sind, aber der Text steht in einer gut lesbaren Schrift mit farbigen Silben oder Silbenbögen. Alternativ lässt sich der Text allein anzeigen, groß und mit viel Abstand. Gedacht für Kinder, die lesen lernen, und für Menschen mit Legasthenie. Unterstützt dänische, deutsche und englische Bücher.

Alles läuft lokal im Browser. Es werden keine Fotos hochgeladen.

**Ausprobieren:** https://eikrad.github.io/laesehjaelper/

## Funktionen

- Zwei Ansichten: die Buchseite mit dem neuen Text an der ursprünglichen Stelle oder nur der Text
- Oberfläche auf Dänisch, Deutsch oder Englisch
- Texterkennung (Dänisch, Deutsch, Englisch) mit [Tesseract.js](https://github.com/naptha/tesseract.js)
- Silbentrennung auf Basis der TeX-Trennmuster für Dänisch, Deutsch und Englisch ([hyphen](https://github.com/ytiurin/hyphen))
- Silben in abwechselnden Farben (blau/rot, Farben frei wählbar), als Bögen oder beides
- Schriften: Andika (Standard), OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Schriftgröße, Buchstaben- und Zeilenabstand sowie Hintergrundfarbe einstellbar
- Wort antippen und hören – erst ganz, dann langsam Silbe für Silbe, dann wieder ganz
- Die ganze Seite vorlesen lassen, mit Markierung des gerade gelesenen Worts, langsam oder normal; danach ist das Kind dran („Noch mal hören“)
- Einstellung „Bindestriche im Buch“: für Lesebücher, die Wörter selbst mit Bindestrich in Silben trennen („Scho-ko-la-de“)
- Schräge Fotos werden gerade gerückt, und vermeintlicher „Text“ in Zeichnungen wird aussortiert
- Jede Seite wird zweimal erkannt (normal und mit ausgeglichenem Hintergrund), damit auch Text auf getönten Bildern erkannt wird
- Erkannten Text korrigieren; eigene Silbengrenzen mit `·` setzen (z. B. `O·ma`)
- Mit einem Tipp den Originaltext einblenden, um Erkennungsfehler zu finden
- Lesemodus: nur der Text, bildschirmfüllend
- Bücherregal: Bücher werden auf dem Gerät gespeichert, mit Titel, Seitenreihenfolge und Lesestand
- Zuschneiden: Die Seite wird auf dem Foto automatisch gefunden und entzerrt; Ecken und Kanten lassen sich nachziehen, auch bei gewölbten Seiten
- E-Book: ein Buch als EPUB 3 speichern (feste Seiten, lässt sich in jeder Lese-App öffnen) und verlustfrei wieder laden
- Als App installierbar und offline nutzbar

## Entwicklung

```bash
npm install
npm run build       # erzeugt dist/
npm run typecheck   # TypeScript (strict)
npm test            # Unit-Tests (Vitest)
npm run test:e2e    # End-to-End-Tests in Chromium (Playwright)
```

Die CI (`.github/workflows/ci.yml`) führt bei jedem Push und Pull Request Typ-Check, Unit-Tests, Build und End-to-End-Tests aus. `main` wird nur dann auf GitHub Pages veröffentlicht, wenn alles grün ist.

## Aufbau

Das Projekt ist in TypeScript geschrieben (strict).

- `src/index.html`: HTML und CSS der Seite
- `src/app.ts`: App-Logik (Oberfläche, Texterkennung, Bücherregal)
- `src/layout.ts`: macht aus dem rohen OCR-Ergebnis saubere Textzeilen und Absätze mit Position (filtert Bildrauschen)
- `src/pagedetect.ts`: findet die Seite auf dem Foto und entzerrt sie (OpenCV), auch gewölbte Seiten
- `src/silben.ts`: Silbentrennung (Dänisch, Deutsch, Englisch)
- `src/db.ts`: Speicherung der Bücher auf dem Gerät (IndexedDB)
- `src/epub.ts`: EPUB-Export und -Import
- `src/prep.ts`: Bildaufbereitung für die Texterkennung (Hintergrundausgleich)
- `src/sw.ts`: Service Worker (offline, Installation)
- `src/types.ts`: gemeinsame Typen
- `build.ts`: baut `dist/` mit esbuild und kopiert Tesseract-, OpenCV- und Sprachdateien
- `tests/`: Unit-Tests, End-to-End-Tests und selbst erstellte Testseiten

## Was sagt die Forschung?

Læsehjælper ist ein Lesewerkzeug, keine Behandlung. Die Einstellungen beruhen auf dem, was Studien mit Leseanfängern und Kindern mit Legasthenie zeigen:

- **Abstand:** Mehr Abstand zwischen den Buchstaben hilft vielen Kindern mit Legasthenie, schneller und genauer zu lesen (Zorzi u. a. 2012) – aber nur, wenn der Wortabstand mitwächst (Galliussi u. a. 2020). Læsehjælper vergrößert den Wortabstand deshalb automatisch.
- **Kurze Zeilen** helfen manchen Kindern mit Legasthenie, vor allem bei schwacher visueller Aufmerksamkeit; andere lesen mit normalen Zeilen besser (Schneps u. a. 2013).
- **Schrift:** Die Buchstabenform selbst macht kaum einen Unterschied. OpenDyslexic brachte keinen Vorteil, und kein Kind las lieber darin (Wery & Diliberto 2017; Galliussi u. a. 2020). Standard ist deshalb Andika, eine klare, gewöhnliche Schrift; OpenDyslexic lässt sich wählen, wenn das Kind sie mag.
- **Farbige Silben** helfen manchen Kindern am Anfang, anderen nicht; Bindestriche in den Wörtern bremsen das Lesen (Häikiö u. a. 2015; Brügelmann 2025). Probiere aus, was das Kind mag, und schalte die Farben ab, sobald es flüssig liest.
- **Vorlesen** hilft beim Verstehen; eine Markierung jedes Worts bringt nichts zusätzlich (Keelor u. a. 2023). Denselben Text mehrmals zu lesen, am besten nachdem man ihn gehört hat, macht das Lesen flüssiger (Lee & Yoon 2017).
- **Farbiger Hintergrund oder Farbfolien** haben keine nachgewiesene Wirkung über Placebo hinaus (Griffiths u. a. 2016). Die Hintergrundfarbe ist nur eine Frage dessen, was sich angenehm anfühlt.
- **Unterricht:** Systematisches Üben von Buchstaben und Lauten ist die am besten belegte Hilfe bei Legasthenie (Galuschka u. a. 2014). Dänisch gehört zu den Sprachen, in denen sicheres Lesen am längsten dauert (Seymour u. a. 2003).

Quellen:

- Zorzi u. a. 2012, *PNAS* — [doi:10.1073/pnas.1205566109](https://doi.org/10.1073/pnas.1205566109)
- Galliussi u. a. 2020, *Annals of Dyslexia* — [doi:10.1007/s11881-020-00194-x](https://doi.org/10.1007/s11881-020-00194-x)
- Schneps u. a. 2013, *PLOS ONE* — [doi:10.1371/journal.pone.0071161](https://doi.org/10.1371/journal.pone.0071161), [doi:10.1371/journal.pone.0075634](https://doi.org/10.1371/journal.pone.0075634)
- Wery & Diliberto 2017, *Annals of Dyslexia* — [doi:10.1007/s11881-016-0127-1](https://doi.org/10.1007/s11881-016-0127-1)
- Häikiö u. a. 2015, *Journal of Cognitive Psychology* — [doi:10.1080/20445911.2014.982126](https://doi.org/10.1080/20445911.2014.982126)
- Brügelmann 2025 — [pedocs.de](https://www.pedocs.de/volltexte/2025/34472/pdf/Bruegelmann_2025_Red_and_blue.pdf)
- Keelor u. a. 2023, *Annals of Dyslexia* — [doi:10.1007/s11881-023-00281-9](https://doi.org/10.1007/s11881-023-00281-9)
- Lee & Yoon 2017, *Journal of Learning Disabilities* — [doi:10.1177/0022219415605194](https://doi.org/10.1177/0022219415605194)
- Galuschka u. a. 2014, *PLOS ONE* — [doi:10.1371/journal.pone.0089900](https://doi.org/10.1371/journal.pone.0089900)
- Griffiths u. a. 2016, *Ophthalmic & Physiological Optics* — [doi:10.1111/opo.12316](https://doi.org/10.1111/opo.12316)
- Seymour u. a. 2003, *British Journal of Psychology* — [doi:10.1348/000712603321661859](https://doi.org/10.1348/000712603321661859)

## Bekannte Grenzen

- Die Trennmuster trennen keine einzelnen Buchstaben am Wortanfang oder -ende ab („Oma“ bleibt ungetrennt), und manche dänischen Trennungen sind falsch (z. B. `hund-en` statt `hun-den`). Abhilfe: im Text mit `·` korrigieren.
- Text auf Illustrationen oder in Zierschriften wird weniger zuverlässig erkannt.
- Die alte Schrift wird mit der umgebenden Hintergrundfarbe übermalt. Auf einfarbigem Hintergrund sieht das sauber aus; Text auf einer Illustration bekommt eine eigene helle Fläche.
- Der neue Text kann nur so groß werden, wie auf der Seite Platz ist. Für richtig große Schrift ist die Ansicht „Nur Text“ besser.
- Gewölbte Seiten muss man bisher von Hand glattziehen (siehe [#1](https://github.com/eikrad/laesehjaelper/issues/1)).

## Roadmap

Die Roadmap ist in Epics und Stories gegliedert (siehe [CONTRIBUTING.md](CONTRIBUTING.md)). Was geplant ist, steht als [Issues mit dem Label `roadmap`](https://github.com/eikrad/laesehjaelper/issues?q=is%3Aissue%20is%3Aopen%20label%3Aroadmap) auf GitHub. Ideen und Fehler bitte als [Issue](https://github.com/eikrad/laesehjaelper/issues/new) melden. Wer beitragen möchte: siehe [CONTRIBUTING.md](CONTRIBUTING.md).

## Haftungsausschluss

Læsehjælper ist ein kostenloses Hobbyprojekt und kein fertiges Produkt. Texterkennung und Silbentrennung machen Fehler; prüfe den Text deshalb immer, bevor ein Kind ihn liest. Die App ersetzt keinen Unterricht, keine Leseförderung und keine Diagnostik bei Legasthenie.

Fotos und Bücher werden nur auf dem eigenen Gerät verarbeitet und gespeichert. Bücher sind urheberrechtlich geschützt: Nutze Læsehjælper nur für Bücher, auf die du selbst Zugriff hast, und nur privat, und gib umgewandelte Bücher nicht weiter, außer du hast die Rechte dazu.

Die Software wird so bereitgestellt, wie sie ist, ohne jede Gewährleistung.

## Lizenz

Der Code steht unter der [MIT-Lizenz](LICENSE). Komponenten von Dritten haben eigene Lizenzen, siehe [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
