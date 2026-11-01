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
- Schriften: Andika, OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Schriftgröße, Buchstaben- und Zeilenabstand sowie Hintergrundfarbe einstellbar
- Wort antippen zum Vorlesen oder die ganze Seite vorlesen lassen, mit Markierung des gerade gelesenen Worts
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

## Bekannte Grenzen

- Die Trennmuster trennen keine einzelnen Buchstaben am Wortanfang oder -ende ab („Oma“ bleibt ungetrennt), und manche dänischen Trennungen sind falsch (z. B. `hund-en` statt `hun-den`). Abhilfe: im Text mit `·` korrigieren.
- Text auf Illustrationen oder in Zierschriften wird weniger zuverlässig erkannt.
- Die alte Schrift wird mit der umgebenden Hintergrundfarbe übermalt. Auf einfarbigem Hintergrund sieht das sauber aus; Text auf einer Illustration bekommt eine eigene helle Fläche.
- Der neue Text kann nur so groß werden, wie auf der Seite Platz ist. Für richtig große Schrift ist die Ansicht „Nur Text“ besser.
- Gewölbte Seiten muss man bisher von Hand glattziehen (siehe [#1](https://github.com/eikrad/laesehjaelper/issues/1)).

## Ideen

- Wölbung der Seite automatisch erkennen ([#1](https://github.com/eikrad/laesehjaelper/issues/1))
- Text auf Illustrationen besser entfernen (Inpainting)
- Export als PDF
- Leselineal, Zeile-für-Zeile-Modus

## Haftungsausschluss

Læsehjælper ist ein kostenloses Hobbyprojekt und kein fertiges Produkt. Texterkennung und Silbentrennung machen Fehler; prüfe den Text deshalb immer, bevor ein Kind ihn liest. Die App ersetzt keinen Unterricht, keine Leseförderung und keine Diagnostik bei Legasthenie.

Fotos und Bücher werden nur auf dem eigenen Gerät verarbeitet und gespeichert. Bücher sind urheberrechtlich geschützt: Nutze Læsehjælper nur für Bücher, auf die du selbst Zugriff hast, und nur privat, und gib umgewandelte Bücher nicht weiter, außer du hast die Rechte dazu.

Die Software wird so bereitgestellt, wie sie ist, ohne jede Gewährleistung.

## Lizenz

Der Code steht unter der [MIT-Lizenz](LICENSE). Komponenten von Dritten haben eigene Lizenzen, siehe [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
