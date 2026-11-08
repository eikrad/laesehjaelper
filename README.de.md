# Læsehjælper

[![CI](https://github.com/eikrad/laesehjaelper/actions/workflows/ci.yml/badge.svg)](https://github.com/eikrad/laesehjaelper/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*Dänisch für „Lesehelfer“. · [Dansk](README.da.md) · [English](README.md)*

Fotografierte Seiten aus Kinderbüchern leichter lesbar machen. Der Text wird per Texterkennung (OCR) erkannt und direkt auf der Seite ersetzt: Die Bilder bleiben, wo sie sind, aber der Text steht in einer gut lesbaren Schrift mit farbigen Silben oder Silbenbögen. Alternativ lässt sich der Text allein anzeigen, groß und mit viel Abstand. Gedacht für Kinder, die lesen lernen, und für Menschen mit Legasthenie. Unterstützt dänische, deutsche und englische Bücher.

Alles läuft lokal im Browser. Es werden keine Fotos hochgeladen.

**Ausprobieren:** https://eikrad.github.io/laesehjaelper/

## Funktionen

- Zwei Ansichten: die Buchseite mit dem neuen Text an der ursprünglichen Stelle oder nur der Text
- Oberfläche auf Dänisch, Deutsch oder Englisch
- Texterkennung (Dänisch, Deutsch, Englisch) mit [Tesseract.js](https://github.com/naptha/tesseract.js)
- Silbentrennung auf Basis der TeX-Trennmuster für Dänisch, Deutsch und Englisch ([hyphen](https://github.com/ytiurin/hyphen))
- Silben in abwechselnden Farben (blau/rot, Farben frei wählbar), als Bögen oder beides
- Wortteile (Dänisch): zusammengesetzte Wörter werden in bekannte Teile zerlegt, Beugungsendungen gedämpft (z. B. sommer|fugl|ene)
- Schriften: Andika (Standard), OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Schriftgröße, Buchstaben- und Zeilenabstand sowie Hintergrundfarbe einstellbar
- Kurze Zeilen mit 2–3 Wörtern in der Textansicht (wählbar)
- Mehrere Leser: Jedes Kind hat eigene Einstellungen für Schrift, Abstände, Silben und Vorlesen
- Gemeinsam lesen: ein paar offene Fragen pro Seite für den Erwachsenen, auch eigene Fragen (zuschaltbar)
- Wort antippen und hören – erst ganz, dann langsam Silbe für Silbe, dann wieder ganz
- Die ganze Seite vorlesen lassen, mit Markierung des gerade gelesenen Worts, langsam oder normal; danach ist das Kind dran („Noch mal hören“)
- Einstellung „Bindestriche im Buch“: für Lesebücher, die Wörter selbst mit Bindestrich oder Punkt in Silben trennen („Scho-ko-la-de“, „Scho·ko·la·de“); Zeichen, die die Texterkennung übersieht, werden im Foto gefunden
- Schräge Fotos werden gerade gerückt, und vermeintlicher „Text“ in Zeichnungen wird aussortiert
- Jede Seite wird zweimal erkannt (normal und mit ausgeglichenem Hintergrund), damit auch Text auf getönten Bildern erkannt wird
- Erkannten Text korrigieren; eigene Silbengrenzen mit `·` setzen (z. B. `O·ma`)
- Textfelder auf der Buchseite mit dem Finger verschieben oder vergrößern (unter „Text prüfen und korrigieren“), z. B. wenn der neue Text in ein Bild ragt
- Überschriften bleiben größer als der Fließtext, fett Gedrucktes wird erkannt und fett gesetzt (korrigierbar mit `*Wort*`)
- Mit einem Tipp den Originaltext einblenden, um Erkennungsfehler zu finden
- Lesemodus: nur der Text. Auf Tablets und Laptops füllt er den ganzen Bildschirm ohne Browserleisten (Fullscreen API), und wer den Vollbildmodus mit der Systemgeste verlässt, beendet auch den Lesemodus. Auf dem iPhone und in der installierten App bleibt der Lesemodus wie bisher
- Bücherregal zuerst: Gespeicherte Bücher lassen sich über große Cover öffnen und zeigen die zuletzt gelesene Seite. „Neues Buch“ bleibt eine Nebenaktion; ohne Bücher steht das Fotografieren im Vordergrund. Bücher, Seitenreihenfolge und Lesestand bleiben auf dem Gerät.
- Lesen und Bücher vorbereiten haben getrennte Ansichten. Beim Lesen gibt es Blättern, Vorlesen und Aa-Einstellungen; „Buch bearbeiten“ öffnet die Werkstatt. Zurück führt über das Lesen zum Regal, und Seitenlinks bleiben nach dem Neuladen erhalten.
- Die Buchwerkstatt vereint Seitenvorschauen und Erkennungsstatus mit Zuschnitt, Textkorrektur, Textfeldern, Seitenreihenfolge, Titel, EPUB-Export und Löschen. Breite Bildschirme zeigen die Liste neben dem Editor, schmale davor. „Zurück zum Lesen“ führt zur ausgewählten Seite zurück. Beim Lesen fokussiert „Buch bearbeiten“ → „Diese Seite korrigieren“ in zwei Schritten den Text der aktuellen Seite; danach geht es zur selben Seite zurück.
- Ein optionaler Elternschutz unter „Weitere Einstellungen“ verlangt, „Buch bearbeiten“ zwei Sekunden gedrückt zu halten, und zeigt den Fortschritt. Das funktioniert mit Touch, Maus, Enter und Leertaste und ist standardmäßig aus. Es verhindert versehentliches Tippen und ist keine Sicherheitssperre.
- Zuschneiden: Ecken und gebogene Kanten einer Seite in der Bildmitte werden anhand ihres Umrisses automatisch vorgeschlagen und entzerrt, auch wenn ein Rand aus dem Foto läuft. Ecken und gebogene Kanten lassen sich nachziehen; manuelle Korrekturen haben Vorrang vor der Automatik und bleiben für späteren Zuschnitt gespeichert.
- Wähle in der Werkstatt eine Seite aus und nutze ‹ / › unter der Vorschau zum Sortieren. „Seite davor einfügen“ und „Seite danach einfügen“ ergänzen fehlende Fotos an dieser Stelle, auch mehrere in der gewählten Reihenfolge. „Foto ersetzen“ behält die Position und den Seitenlink bei; erst nach dem Bestätigen des Zuschnitts ersetzen das neue Foto und der erkannte Text den bisherigen Inhalt. Manuelle Textkorrekturen auf der ersetzten Seite gehen dabei verloren.
- E-Book: ein Buch als EPUB 3 speichern (feste Seiten, lässt sich in jeder Lese-App öffnen) und verlustfrei wieder laden
- Als App installierbar und offline nutzbar
- Der Bildschirm bleibt an, solange ein Buch offen ist, damit er nicht mitten auf einer Seite dunkel wird; nach 10 Minuten ohne Berührung oder Vorlesen darf er wieder ausgehen (in Browsern mit der Screen Wake Lock API)

## Entwicklung

```bash
npm install
npm run build       # erzeugt dist/
npm run typecheck   # TypeScript (strict)
npm run lint        # Biome für TypeScript
npm test            # Unit-Tests (Vitest)
npm run test:e2e    # End-to-End-Tests in Chromium (Playwright)
```

Die CI (`.github/workflows/ci.yml`) führt bei jedem Push und Pull Request Lint, Typ-Check, Unit-Tests, Build und End-to-End-Tests aus. `main` wird nur dann auf GitHub Pages veröffentlicht, wenn alles grün ist.

## Aufbau

Das Projekt ist in TypeScript geschrieben (strict).

- `src/index.html`: HTML und CSS der Seite
- `src/app.ts`: App-Logik (Oberfläche, Texterkennung, Bücherregal)
- `src/layout.ts`: macht aus dem rohen OCR-Ergebnis saubere Textzeilen und Absätze mit Position (filtert Bildrauschen)
- `src/pagedetect.ts`: findet die Seite auf dem Foto und entzerrt sie (OpenCV), auch gewölbte Seiten
- `src/pagecurve.ts`: passt glatte Kantenkurven an den erkannten Seitenumriss an
- `src/silben.ts`: Silbentrennung (Dänisch, Deutsch, Englisch)
- `src/db.ts`: Speicherung der Bücher auf dem Gerät (IndexedDB)
- `src/epub.ts`: EPUB-Export und -Import
- `src/prep.ts`: Bildaufbereitung für die Texterkennung (Hintergrundausgleich)
- `src/sw.ts`: Service Worker (offline, Installation)
- `src/types.ts`: gemeinsame Typen
- `build.ts`: baut `dist/` mit esbuild und kopiert Tesseract-, OpenCV- und Sprachdateien
- `tests/`: Unit-Tests, End-to-End-Tests und selbst erstellte Testseiten
- `docs/research/`: die Literaturübersichten hinter „Was sagt die Forschung?“ (auf Englisch)

## Was sagt die Forschung?

Læsehjælper ist ein Lesewerkzeug, keine Behandlung. Die Einstellungen beruhen auf dem, was Studien mit Leseanfängern und Kindern mit Legasthenie zeigen. Die vollständigen Literaturübersichten mit allen Quellen (auf Englisch) liegen in [docs/research](docs/research/README.md).

**Am meisten hilft keine Einstellung auf dem Bildschirm.**

- **Unterricht:** Systematisches, frühes Üben von Buchstaben, Lauten und Lautieren ist die am besten belegte Hilfe bei Legasthenie. Die Effekte sind mittelgroß und in den ersten Schuljahren und mit mehr Stunden größer (Hall u. a. 2023; McArthur u. a. 2018; Galuschka u. a. 2014). In einer dänischen Studie sank mit Kleingruppenunterricht der Anteil der Risikokinder, die am Ende der 1. Klasse kaum lesen konnten, von 37 % auf 15 % (Gellert u. a. 2024). Læsehjælper ersetzt diesen Unterricht nicht. Dänisch gehört zu den Sprachen, in denen sicheres Lesen am längsten dauert (Seymour u. a. 2003).
- **Üben mit einem Erwachsenen:** Eltern helfen am meisten, wenn sie zuhören, während ihr Kind liest, und bei bestimmten Fertigkeiten helfen – mehr als wenn sie nur vorlesen (Sénéchal & Young 2008). In einer dänischen Studie mit 1.587 Zweitklässlern verbesserten ein paar Bücher und einfache Tipps das Lesen: die Mühe loben, über die Geschichte sprechen, nicht jeden kleinen Fehler verbessern (Andersen & Nielsen 2016). Lese-Apps wirken viel besser, wenn ein Erwachsener dabei ist (McTigue u. a. 2020).

**Die Einstellungen helfen weniger, und nicht jedem Kind:**

- **Abstand:** Mehr Abstand zwischen den Buchstaben verringert bei manchen Kindern die Lesefehler, aber die Studien sind uneinig, viele finden keinen Unterschied im Tempo, und der Effekt betrifft nicht nur Kinder mit Legasthenie (Zorzi u. a. 2012; Hakvoort u. a. 2017; Łuniewska u. a. 2022). Mehr Buchstabenabstand ohne mehr Wortabstand bremst das Lesen (Galliussi u. a. 2020); Læsehjælper vergrößert den Wortabstand deshalb automatisch.
- **Kurze Zeilen** helfen manchen Kindern mit Legasthenie, vor allem bei schwacher visueller Aufmerksamkeit; andere lesen mit normalen Zeilen besser. Die Studien untersuchten Jugendliche, keine jungen Kinder (Schneps u. a. 2013).
- **Schrift:** Spezielle Legasthenie-Schriften verbessern weder Tempo noch Genauigkeit (Metaanalyse: Azzarello u. a. 2026), und Kinder mögen oft gewöhnliche Schriften lieber (Wery & Diliberto 2017). Standard ist deshalb Andika, eine klare, gewöhnliche Schrift; OpenDyslexic lässt sich wählen, wenn das Kind sie mag.
- **Farbige Silben** machten in einer Blickbewegungsstudie keinen Unterschied für das Lesetempo (Häikiö u. a. 2015). Manche schwächeren Leseanfänger lasen einzelne Wörter damit genauer (Lopes & Barrera 2019). Eine separate deutsche Klassenstudie fand einen kleinen Gewinn in der 2. Klasse mit Silbenbögen statt Farben (Dreschinski 2022, eine Dissertation); das belegt keinen Nutzen farbiger Silben. Ein möglicher Nutzen der Farben scheint früh, klein und vor allem bei langen Wörtern zu liegen. Im Dänischen, wo geschriebene und gesprochene Silben oft nicht übereinstimmen, wurden farbige Silben nie untersucht. Eine Übersicht empfiehlt sie nur für manche Kinder und nur im Übergang zum flüssigen Lesen (Brügelmann 2025, ein Bericht, nicht begutachtet). Bindestriche in den Wörtern bremsen das Lesen (Häikiö u. a. 2015). Deshalb sind farbige Silben zu Beginn aus: Sie lassen sich mit einem Tipp unter „Silben“ → „Farbe“ in den Einstellungen einschalten, und jeder neue Leser startet ohne sie. Geräte, auf denen die App schon benutzt wurde, behalten ihre eigene Einstellung. Eine weitere Wahl pro Leser, „Nur lange Wörter“, markiert Silben (Farben oder Bögen) nur in Wörtern mit drei oder mehr Silben, wo die Hilfe am ehesten wirkt (Brügelmann 2025).
- **Wortteile (Dänisch):** Wer lernt, auf Wortteile zu achten, liest und schreibt lange Wörter besser, auch im Dänischen (Goodwin & Ahn 2010; Arnbak & Elbro 2000; Gellert u. a. 2021). Die Anzeige der Wortteile auf der Seite baut darauf auf, wurde aber selbst nicht untersucht.
- **Vorlesen** hilft Kindern, einen Text zu verstehen, allerdings nur mäßig (Wood u. a. 2018), und Zuhören allein bringt das Lesen nicht bei. Eine Markierung jedes Worts verbesserte das Verstehen in einer kleinen Studie nicht (Keelor u. a. 2023) und half Kindern nicht, neue Wörter zu lernen (Gerbier u. a. 2018). In dieser Studie wurden die Kinder von der Stimme mitgezogen, und die meisten mochten es lieber ohne Markierung, auch wenn die schwächsten Leser sie eher mochten. Das Markieren der Wörter beim Vorlesen ist deshalb eine Einstellung pro Leser, für neue Leser aus; Geräte, auf denen die App schon benutzt wurde, behalten es an.
- **Erst hören, dann selbst lesen:** Denselben Text nach dem Hören noch einmal zu lesen, macht das Lesen flüssiger, vor allem beim geübten Text (Lee & Yoon 2017); in ganzen Klassen ist der Effekt klein (Lauer-Schmaltz u. a. 2014). Neue Seiten zu lesen hilft etwa genauso (Zimmermann u. a. 2021).
- **Wort antippen:** Schwere Wörter beim Lesen auf Wunsch zu hören, half in Trainingsstudien – auch dänischen Schülern, die das Wort erst in Teilen und dann ganz hörten (Olson & Wise 1992; Elbro u. a. 1996).
- **Farbiger Hintergrund oder Farbfolien** haben keine nachgewiesene Wirkung über Placebo hinaus (Griffiths u. a. 2016; Suttle u. a. 2018). Die Hintergrundfarbe ist nur eine Frage dessen, was sich angenehm anfühlt.
- **Eine ruhige Leseansicht:** Interaktive Zusatzfunktionen in digitalen Bilderbüchern helfen Kindern nicht, die Geschichte zu verstehen, und Minispiele schaden dem Verstehen (Takacs, Swart & Bus 2015; Bus u. a. 2026). Erwachsenenwerkzeuge in eine getrennte Werkstatt zu verlegen, ist eine daraus abgeleitete Gestaltungsentscheidung; die Studien haben diese Navigation nicht untersucht.
- **Gemeinsam lesen:** Mit offenen Fragen über ein Buch zu sprechen, stärkt den Wortschatz kleiner Kinder (Mol u. a. 2008), vor allem im Alter von 2–3 Jahren; neuere Studien finden kleinere Effekte (Noble u. a. 2019). Die Fragen in Læsehjælper sind deshalb freiwillig und standardmäßig aus.

Quellen:

- Hall u. a. 2023, *Reading Research Quarterly* — [doi:10.1002/rrq.477](https://doi.org/10.1002/rrq.477)
- McArthur u. a. 2018, *Cochrane Database of Systematic Reviews* — [doi:10.1002/14651858.CD009115.pub3](https://doi.org/10.1002/14651858.CD009115.pub3)
- Galuschka u. a. 2014, *PLOS ONE* — [doi:10.1371/journal.pone.0089900](https://doi.org/10.1371/journal.pone.0089900)
- Gellert u. a. 2024, *NyS – Nydanske Sprogstudier* — [doi:10.7146/nys.v1i66.148749](https://doi.org/10.7146/nys.v1i66.148749)
- Seymour u. a. 2003, *British Journal of Psychology* — [doi:10.1348/000712603321661859](https://doi.org/10.1348/000712603321661859)
- Sénéchal & Young 2008, *Review of Educational Research* — [doi:10.3102/0034654308320319](https://doi.org/10.3102/0034654308320319)
- Andersen & Nielsen 2016, *PNAS* — [doi:10.1073/pnas.1607946113](https://doi.org/10.1073/pnas.1607946113)
- McTigue u. a. 2020, *Reading Research Quarterly* — [doi:10.1002/rrq.256](https://doi.org/10.1002/rrq.256)
- Zorzi u. a. 2012, *PNAS* — [doi:10.1073/pnas.1205566109](https://doi.org/10.1073/pnas.1205566109)
- Hakvoort u. a. 2017, *Journal of Experimental Child Psychology* — [doi:10.1016/j.jecp.2017.07.010](https://doi.org/10.1016/j.jecp.2017.07.010)
- Łuniewska u. a. 2022, *Learning and Instruction* — [doi:10.1016/j.learninstruc.2021.101576](https://doi.org/10.1016/j.learninstruc.2021.101576)
- Galliussi u. a. 2020, *Annals of Dyslexia* — [doi:10.1007/s11881-020-00194-x](https://doi.org/10.1007/s11881-020-00194-x)
- Schneps u. a. 2013, *PLOS ONE* — [doi:10.1371/journal.pone.0071161](https://doi.org/10.1371/journal.pone.0071161), [doi:10.1371/journal.pone.0075634](https://doi.org/10.1371/journal.pone.0075634)
- Azzarello u. a. 2026, *Annals of Dyslexia* — [doi:10.1007/s11881-026-00389-8](https://doi.org/10.1007/s11881-026-00389-8)
- Wery & Diliberto 2017, *Annals of Dyslexia* — [doi:10.1007/s11881-016-0127-1](https://doi.org/10.1007/s11881-016-0127-1)
- Häikiö u. a. 2015, *Journal of Cognitive Psychology* — [doi:10.1080/20445911.2014.982126](https://doi.org/10.1080/20445911.2014.982126)
- Lopes & Barrera 2019, *Estudos de Psicologia (Natal)* — [doi:10.22491/1678-4669.20190035](https://doi.org/10.22491/1678-4669.20190035)
- Dreschinski 2022, Dissertation, PH Heidelberg — [doi:10.46586/SLLD.254](https://doi.org/10.46586/SLLD.254)
- Brügelmann 2025, Bericht auf peDOCS, nicht begutachtet — [doi:10.25656/01:34472](https://doi.org/10.25656/01:34472)
- Goodwin & Ahn 2010, *Annals of Dyslexia* — [doi:10.1007/s11881-010-0041-x](https://doi.org/10.1007/s11881-010-0041-x)
- Arnbak & Elbro 2000, *Scandinavian Journal of Educational Research* — [doi:10.1080/00313830050154485](https://doi.org/10.1080/00313830050154485)
- Gellert u. a. 2021, *Reading Research Quarterly* — [doi:10.1002/rrq.325](https://doi.org/10.1002/rrq.325)
- Wood u. a. 2018, *Journal of Learning Disabilities* — [doi:10.1177/0022219416688170](https://doi.org/10.1177/0022219416688170)
- Keelor u. a. 2023, *Annals of Dyslexia* — [doi:10.1007/s11881-023-00281-9](https://doi.org/10.1007/s11881-023-00281-9)
- Gerbier u. a. 2018, *Computer Speech & Language* — [doi:10.1016/j.csl.2017.07.003](https://doi.org/10.1016/j.csl.2017.07.003)
- Lee & Yoon 2017, *Journal of Learning Disabilities* — [doi:10.1177/0022219415605194](https://doi.org/10.1177/0022219415605194)
- Lauer-Schmaltz u. a. 2014, *Didaktik Deutsch* — [doi:10.25656/01:17152](https://doi.org/10.25656/01:17152)
- Zimmermann u. a. 2021, *Remedial and Special Education* — [doi:10.1177/0741932519855058](https://doi.org/10.1177/0741932519855058)
- Olson & Wise 1992, *Reading and Writing* — [doi:10.1007/BF01027488](https://doi.org/10.1007/BF01027488)
- Elbro u. a. 1996, *Scandinavian Journal of Psychology* — [doi:10.1111/j.1467-9450.1996.tb00647.x](https://doi.org/10.1111/j.1467-9450.1996.tb00647.x)
- Griffiths u. a. 2016, *Ophthalmic & Physiological Optics* — [doi:10.1111/opo.12316](https://doi.org/10.1111/opo.12316)
- Suttle u. a. 2018, *Clinical and Experimental Optometry* — [doi:10.1111/cxo.12676](https://doi.org/10.1111/cxo.12676)
- Takacs, Swart & Bus 2015, *Review of Educational Research* — [doi:10.3102/0034654314566989](https://doi.org/10.3102/0034654314566989)
- Bus u. a. 2026, *Early Education and Development* — [doi:10.1080/10409289.2025.2571978](https://doi.org/10.1080/10409289.2025.2571978)
- Mol u. a. 2008, *Early Education and Development* — [doi:10.1080/10409280701838603](https://doi.org/10.1080/10409280701838603)
- Noble u. a. 2019, *Educational Research Review* — [doi:10.1016/j.edurev.2019.100290](https://doi.org/10.1016/j.edurev.2019.100290)

## Bekannte Grenzen

- Wortteile beruhen auf einer Wortliste und einfachen Regeln: Wörter, die nicht in der Liste stehen, bleiben ganz, und mehrdeutige Wörter (z. B. „anden“) werden nicht zerlegt. Bisher nur Dänisch.
- Die Trennmuster trennen keine einzelnen Buchstaben am Wortanfang oder -ende ab („Oma“ bleibt ungetrennt), und manche dänischen Trennungen sind falsch (z. B. `hund-en` statt `hun-den`). Abhilfe: im Text mit `·` korrigieren.
- Text auf Illustrationen oder in Zierschriften wird weniger zuverlässig erkannt.
- Nur die alten Buchstaben werden entfernt: Papier oder Bild darunter werden aus der Umgebung ergänzt (Inpainting), sodass ungleichmäßiges Licht und die Papierstruktur erhalten bleiben. Steht die Schrift auf einer Illustration, bekommt der neue Text einen weichen, hellen Schein. Feine, regelmäßige Muster können dort, wo der Text stand, etwas verwischt aussehen.
- Auf der Buchseite gelten Schriftgröße und Abstände, soweit Platz ist: zuerst die Größe, dann so viel Abstand, wie passt. Ist für die gewählte Größe kein Platz, sagen es die Einstellungen; für richtig große Schrift ist die Ansicht „Nur Text“ besser.
- Die Seitenerkennung ist vorsichtig: Fotografiere eine Seite in der Bildmitte mit mindestens drei sichtbaren Rändern. Schatten, Illustrationen und Doppelseiten können sie weiterhin verwirren. Prüfe den Rahmen vor dem Bestätigen.
- Die automatische Wölbung folgt den sichtbaren Seitenrändern. Ein verdeckter oder abgeschnittener Rand liefert keine Information über die Wölbung; innere Knicke und komplizierte Verformungen können weiterhin manuelles Nachziehen der Kantenmittelpunkte erfordern.

## Roadmap

Die Roadmap ist in Epics und Stories gegliedert (siehe [CONTRIBUTING.md](CONTRIBUTING.md)). Was geplant ist, steht als [Issues mit dem Label `roadmap`](https://github.com/eikrad/laesehjaelper/issues?q=is%3Aissue%20is%3Aopen%20label%3Aroadmap) auf GitHub. Ideen und Fehler bitte als [Issue](https://github.com/eikrad/laesehjaelper/issues/new) melden. Wer beitragen möchte: siehe [CONTRIBUTING.md](CONTRIBUTING.md).

## Haftungsausschluss

Læsehjælper ist ein kostenloses Hobbyprojekt und kein fertiges Produkt. Texterkennung und Silbentrennung machen Fehler; prüfe den Text deshalb immer, bevor ein Kind ihn liest. Die App ersetzt keinen Unterricht, keine Leseförderung und keine Diagnostik bei Legasthenie.

Fotos und Bücher werden nur auf dem eigenen Gerät verarbeitet und gespeichert. Bücher sind urheberrechtlich geschützt: Nutze Læsehjælper nur für Bücher, auf die du selbst Zugriff hast, und nur privat, und gib umgewandelte Bücher nicht weiter, außer du hast die Rechte dazu.

Die Software wird so bereitgestellt, wie sie ist, ohne jede Gewährleistung.

## Lizenz

Der Code steht unter der [MIT-Lizenz](LICENSE). Komponenten von Dritten haben eigene Lizenzen, siehe [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
