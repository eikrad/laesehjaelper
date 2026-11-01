# Læsehjælper

Fotografierte Kinderbuchseiten (Dänisch und Deutsch) leichter lesbar machen: Der Text wird per OCR erkannt und neu gesetzt, in gut lesbarer Schrift, groß, mit mehr Abstand und mit farbigen Silben oder Silbenbögen.

Alles läuft lokal im Browser. Es werden keine Fotos hochgeladen.

## Funktionen

- Oberfläche auf Dänisch oder Deutsch
- Texterkennung (Dänisch, Deutsch) mit [Tesseract.js](https://github.com/naptha/tesseract.js)
- Silbentrennung mit den dänischen und deutschen TeX-Trennmustern ([hyphen](https://github.com/ytiurin/hyphen))
- Silben farbig (blau/rot), als Bögen oder beides
- Schriften: Andika, OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Schriftgröße, Buchstaben- und Zeilenabstand, Hintergrundfarbe einstellbar
- Wort antippen zum Vorlesen, ganze Seite vorlesen mit Mitlese-Markierung
- Erkannten Text korrigieren; eigene Silbengrenzen mit `·` setzen (z. B. `O·ma`)
- Lesemodus: nur der Text, bildschirmfüllend

## Entwickeln

```bash
npm install
npm run build      # erzeugt dist/
npx serve dist     # oder ein anderer statischer Webserver
```

`dist/` ist eine statische Seite und lässt sich z. B. mit GitHub Pages hosten.

## Aufbau

- `src/index.html` – Oberfläche und App-Logik
- `src/silben.js` – Silbentrennung (wird mit esbuild gebündelt)
- `build.mjs` – baut `dist/`: bettet Silbentrennung und OpenDyslexic ein, kopiert Tesseract-Dateien und Sprachdaten

## Bekannte Grenzen

- Die Trennmuster trennen keine einzelnen Buchstaben am Wortrand ab („Oma“ bleibt ungetrennt). Abhilfe: `O·ma` im Text.
- Text über Illustrationen oder in Schmuckschriften wird schlechter erkannt.
- Die Originalseite wird als Foto angezeigt; Illustrationen werden noch nicht automatisch ausgeschnitten.

## Ideen

- Illustrationen automatisch ausschneiden und neben den Text setzen
- Text direkt im Bild ersetzen (Inpainting)
- Bücher lokal speichern, Export als PDF
- Leselineal, Zeile-für-Zeile-Modus
