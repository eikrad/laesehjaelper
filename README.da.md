# Læsehjælper

[![CI](https://github.com/eikrad/laesehjaelper/actions/workflows/ci.yml/badge.svg)](https://github.com/eikrad/laesehjaelper/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*[English](README.md) · [Deutsch](README.de.md)*

Gør fotograferede sider fra børnebøger lettere at læse. Teksten bliver genkendt med OCR og erstattet direkte på siden, så billederne bliver, hvor de er, men teksten står i en letlæselig skrift med farvede stavelser eller stavelsesbuer. Alternativt kan teksten vises alene, stor og med god luft. Lavet til børn, der er ved at lære at læse, og til læsere med ordblindhed. Understøtter danske, tyske og engelske bøger.

Alt kører lokalt i browseren. Ingen billeder bliver uploadet.

**Prøv den:** https://eikrad.github.io/laesehjaelper/

## Funktioner

- To visninger: bogens side med ny skrift på den oprindelige plads, eller kun teksten
- Brugerflade på dansk, tysk eller engelsk
- Tekstgenkendelse (dansk, tysk, engelsk) med [Tesseract.js](https://github.com/naptha/tesseract.js)
- Stavelsesdeling baseret på de danske, tyske og engelske TeX-orddelingsmønstre ([hyphen](https://github.com/ytiurin/hyphen))
- Stavelser i skiftende farver (blå/rød, farverne kan vælges frit), som buer eller begge dele
- Orddele (dansk): sammensatte ord deles i kendte dele, og bøjningsendelser vises dæmpet (f.eks. sommer|fugl|ene)
- Skrifttyper: Andika (standard), OpenDyslexic, Atkinson Hyperlegible, Lexend, Verdana
- Justerbar skriftstørrelse, bogstavafstand, linjeafstand og baggrundsfarve
- Korte linjer med 2–3 ord i tekstvisningen (kan vælges)
- Flere læsere: hvert barn har sine egne indstillinger for skrift, afstand, stavelser og oplæsning
- Læs sammen: et par åbne spørgsmål til den voksne for hver side, også egne spørgsmål (kan slås til)
- Tryk på et ord for at høre det – først helt, så langsomt stavelse for stavelse, så helt igen
- Få hele siden læst op med markering af hvert ord, langsomt eller normalt; bagefter er det barnets tur („Hør igen“)
- Indstilling „Bindestreger i bogen“: til læsebøger, der selv deler ord i stavelser med bindestreg eller prik („sko-le“, „sko·le“); tegn, som tekstgenkendelsen overser, bliver fundet i fotoet
- Skæve fotos bliver rettet op, og „tekst“, som tekstgenkendelsen finder i tegningerne, bliver sorteret fra
- Hver side genkendes to gange (som den er og med udlignet baggrund), så også tekst på farvede billeder bliver fundet
- Ret den genkendte tekst; sæt selv stavelsesgrænser med `·` (f.eks. `hun·den`)
- Flyt tekstfelter på bogens side med fingeren, eller ændr deres størrelse (under „Tjek og ret teksten“), f.eks. hvis den nye tekst går ind i et billede
- Overskrifter forbliver større end brødteksten, og fed skrift bliver fundet og vist med fed (kan rettes med `*ord*`)
- Læsetilstand: kun teksten. På tablets og computere fylder den hele skærmen uden browserens bjælker (Fullscreen API), og forlader man fuld skærm med systemets bevægelse, slutter læsetilstanden også. På iPhone og i den installerede app er læsetilstanden som før
- Vis den oprindelige tekst med ét tryk for at finde fejl i genkendelsen
- Bogreolen først: gemte bøger åbnes via store forsider og viser, hvor læsningen stoppede. „Ny bog“ er en sekundær knap; uden bøger er fotografering den primære handling. Bøger, rækkefølge og læsestatus bliver på enheden.
- Læsning og klargøring af bøger har hver sin visning. Læsning har sideskift, oplæsning og Aa-indstillinger; „Rediger bog“ åbner værkstedet. Tilbage fører gennem læsning til bogreolen, og sidelinks virker efter genindlæsning.
- Bogværkstedet samler sidebilleder og genkendelsesstatus med beskæring, tekstrettelser, tekstfelter, rækkefølge, titel, EPUB-eksport og sletning. Brede skærme viser listen ved siden af editoren, smalle før den. „Tilbage til læsning“ vender tilbage til den valgte side. Under læsning fokuserer „Rediger bog“ → „Ret denne side“ den aktuelle sides tekst med to tryk; bagefter vender man tilbage til samme side.
- Et valgfrit forældresikring under „Flere indstillinger“ kræver, at „Rediger bog“ holdes nede i to sekunder, og viser fremskridtet. Det virker med berøring, mus, Enter og mellemrum og er slået fra som standard. Det forebygger utilsigtede tryk og er ikke en sikkerhedslås.
- Beskæring: foreslår automatisk hjørner og buede kanter ud fra omridset af en side i midten af fotoet og retter den op, også når én kant går ud af billedet. Hjørner og buede kanter kan justeres; manuelle rettelser har forrang for automatikken og gemmes til næste beskæring.
- Vælg en side i værkstedet, og brug ‹ / › under sidebilledet til at ændre rækkefølgen. „Indsæt side før“ og „Indsæt side efter“ tilføjer manglende fotos på den valgte plads, også flere fotos i den valgte rækkefølge. „Erstat foto“ bevarer sidens plads og link; det nye foto og den genkendte tekst erstatter først det gamle indhold, når du godkender beskæringen. Manuelle tekstrettelser på den erstattede side slettes.
- E-bog: gem en bog som EPUB 3 (faste sider, kan åbnes i alle læse-apps) og hent den ind igen uden tab
- Kan installeres som app og bruges offline
- Skærmen forbliver tændt, mens en bog er åben, så den ikke bliver mørk midt på en side; efter 10 minutter uden berøring eller oplæsning må den slukke igen (i browsere med Screen Wake Lock API)

## Udvikling

```bash
npm install
npm run build       # bygger dist/
npm run typecheck   # TypeScript (strict)
npm run lint        # Biome for TypeScript
npm test            # unit-tests (Vitest)
npm run test:e2e    # end-to-end-tests i Chromium (Playwright)
```

CI (`.github/workflows/ci.yml`) kører lint, typecheck, unit-tests, build og end-to-end-tests ved hvert push og pull request. Kun når alt er grønt, bliver `main` udgivet på GitHub Pages.

## Opbygning

Projektet er skrevet i TypeScript (strict).

- `src/index.html`: sidens HTML og CSS
- `src/app.ts`: app-logik (brugerflade, tekstgenkendelse, bogreol)
- `src/layout.ts`: gør det rå OCR-resultat til rene tekstlinjer og afsnit med position (sorterer støj fra tegninger fra)
- `src/pagedetect.ts`: finder siden på fotoet og retter den op (OpenCV), også buede sider
- `src/pagecurve.ts`: tilpasser glatte kantkurver til det fundne omrids
- `src/silben.ts`: stavelsesdeling (dansk, tysk, engelsk)
- `src/db.ts`: lagring af bøger på enheden (IndexedDB)
- `src/epub.ts`: eksport og import af EPUB
- `src/prep.ts`: billedforberedelse til tekstgenkendelse (udligning af baggrund)
- `src/sw.ts`: service worker (offline, installation)
- `src/types.ts`: fælles typer
- `build.ts`: bygger `dist/` med esbuild og kopierer Tesseract-, OpenCV- og sprogfiler
- `tests/`: unit-tests, end-to-end-tests og selvlavede testsider
- `docs/research/`: litteraturgennemgangene bag „Hvad siger forskningen?“ (på engelsk)

## Hvad siger forskningen?

Læsehjælper er et læseværktøj, ikke en behandling. Indstillingerne bygger på det, undersøgelser af børn, der lærer at læse, og af ordblinde børn viser. De fulde litteraturgennemgange med alle kilder (på engelsk) ligger i [docs/research](docs/research/README.md).

**Det, der hjælper mest, er ikke en indstilling på skærmen.**

- **Undervisning:** Systematisk, tidlig undervisning i bogstaver, lyde og lydering er den bedst dokumenterede hjælp ved ordblindhed. Effekterne er moderate og størst i de første skoleår og ved flere timer (Hall m.fl. 2023; McArthur m.fl. 2018; Galuschka m.fl. 2014). I et dansk forsøg faldt andelen af risikobørn, der næsten ikke kunne læse ved slutningen af 1. klasse, fra 37 % til 15 % med undervisning i små grupper (Gellert m.fl. 2024). Læsehjælper erstatter ikke denne undervisning. Dansk er et af de sprog, hvor det tager længst tid at lære at læse sikkert (Seymour m.fl. 2003).
- **Øvelse sammen med en voksen:** Forældre hjælper mest, når de lytter, mens barnet læser, og hjælper med konkrete færdigheder – mere end når de kun læser højt for barnet (Sénéchal & Young 2008). I et dansk forsøg med 1.587 elever i 2. klasse forbedrede nogle få bøger og enkle råd læsningen: ros indsatsen, tal om historien, og ret ikke hver lille fejl (Andersen & Nielsen 2016). Læseapps virker langt bedre, når en voksen er med (McTigue m.fl. 2020).

**Indstillingerne hjælper mindre og ikke alle børn:**

- **Afstand:** Mere afstand mellem bogstaverne giver færre læsefejl hos nogle børn, men undersøgelserne er uenige, mange finder ingen forskel i tempo, og effekten gælder ikke kun ordblinde (Zorzi m.fl. 2012; Hakvoort m.fl. 2017; Łuniewska m.fl. 2022). Mere bogstavafstand uden mere ordafstand gør læsningen langsommere (Galliussi m.fl. 2020); derfor øger Læsehjælper ordafstanden automatisk.
- **Korte linjer** hjælper nogle ordblinde læsere, især dem med svag visuel opmærksomhed; andre læser bedre med almindelige linjer. Undersøgelserne testede teenagere, ikke små børn (Schneps m.fl. 2013).
- **Skrifttype:** Særlige ordblindeskrifter forbedrer hverken læsetempo eller sikkerhed (metaanalyse: Azzarello m.fl. 2026), og børn foretrækker ofte almindelige skrifter (Wery & Diliberto 2017). Standard er derfor Andika, en almindelig, tydelig skrift; OpenDyslexic kan vælges, hvis barnet kan lide den.
- **Farvede stavelser** gjorde ingen forskel for læsetempoet i en eye-tracking-undersøgelse (Häikiö m.fl. 2015). Nogle svage begyndere læste enkeltord mere sikkert med dem (Lopes & Barrera 2019). En separat tysk klasseundersøgelse fandt en lille gevinst i 2. klasse med stavelsesbuer, ikke farver (Dreschinski 2022, en ph.d.-afhandling); det dokumenterer ikke en gevinst ved farvede stavelser. En eventuel gevinst ved farver ser ud til at være tidlig, lille og mest ved lange ord. Farvede stavelser er aldrig afprøvet på dansk, hvor skrevne og udtalte stavelser ofte er forskellige. En gennemgang anbefaler dem kun til nogle børn og kun i overgangen til flydende læsning (Brügelmann 2025, en rapport, ikke fagfællebedømt). Bindestreger i ordene gør læsningen langsommere (Häikiö m.fl. 2015). Derfor starter farvede stavelser slået fra: de slås til med ét tryk under „Stavelser“ → „Farve“ i indstillingerne, og hver ny læser starter uden dem. Enheder, der har brugt appen før, beholder deres eget valg. Et ekstra valg pr. læser, „Kun lange ord“, markerer kun stavelser (farver eller buer) i ord med tre eller flere stavelser, hvor hjælpen ser ud til at virke bedst (Brügelmann 2025).
- **Orddele (dansk):** Undervisning i orddele hjælper børn med at læse og stave lange ord, også på dansk (Goodwin & Ahn 2010; Arnbak & Elbro 2000; Gellert m.fl. 2021). Visningen af orddele på siden bygger på det, men er ikke selv afprøvet.
- **Oplæsning** hjælper børn med at forstå en tekst, men effekten er beskeden (Wood m.fl. 2018), og at lytte alene lærer ikke barnet at læse. Markering af hvert ord gav ikke bedre forståelse i en lille undersøgelse (Keelor m.fl. 2023) og hjalp ikke børn med at lære nye ord (Gerbier m.fl. 2018). I den undersøgelse blev børnene trukket med af stemmen, og de fleste foretrak ingen markering, selv om de svageste læsere var mere glade for den. Markering af ordene under oplæsning er derfor en indstilling pr. læser, slået fra for nye læsere; enheder, der har brugt appen før, beholder den slået til.
- **Lyt først, læs så selv:** At læse den samme tekst igen efter at have hørt den gør læsningen mere flydende, mest på den øvede tekst (Lee & Yoon 2017); i hele klasser er effekten lille (Lauer-Schmaltz m.fl. 2014). At læse nye sider hjælper omtrent lige så meget (Zimmermann m.fl. 2021).
- **Tryk på et ord:** At kunne høre svære ord, mens barnet læser, hjalp i træningsundersøgelser – også danske elever, der hørte ordet i dele og derefter helt (Olson & Wise 1992; Elbro m.fl. 1996).
- **Farvet baggrund eller farvede filtre** har ingen påvist effekt ud over placebo (Griffiths m.fl. 2016; Suttle m.fl. 2018). Baggrundsfarven er kun et spørgsmål om, hvad der føles rart.
- **En rolig læseskærm:** Interaktive ekstrafunktioner i digitale billedbøger hjælper ikke børn med at forstå historien, og minispil skader forståelsen (Takacs, Swart & Bus 2015; Bus m.fl. 2026). At samle voksenværktøjer i et separat værksted er et designvalg inspireret af den forskning; undersøgelserne afprøvede ikke denne navigation.
- **Læs sammen:** At tale om en bog med åbne spørgsmål styrker små børns ordforråd (Mol m.fl. 2008), men mest i 2–3-årsalderen, og senere undersøgelser finder mindre effekter (Noble m.fl. 2019). Spørgsmålene i Læsehjælper er derfor valgfrie og slået fra som standard.

Kilder:

- Hall m.fl. 2023, *Reading Research Quarterly* — [doi:10.1002/rrq.477](https://doi.org/10.1002/rrq.477)
- McArthur m.fl. 2018, *Cochrane Database of Systematic Reviews* — [doi:10.1002/14651858.CD009115.pub3](https://doi.org/10.1002/14651858.CD009115.pub3)
- Galuschka m.fl. 2014, *PLOS ONE* — [doi:10.1371/journal.pone.0089900](https://doi.org/10.1371/journal.pone.0089900)
- Gellert m.fl. 2024, *NyS – Nydanske Sprogstudier* — [doi:10.7146/nys.v1i66.148749](https://doi.org/10.7146/nys.v1i66.148749)
- Seymour m.fl. 2003, *British Journal of Psychology* — [doi:10.1348/000712603321661859](https://doi.org/10.1348/000712603321661859)
- Sénéchal & Young 2008, *Review of Educational Research* — [doi:10.3102/0034654308320319](https://doi.org/10.3102/0034654308320319)
- Andersen & Nielsen 2016, *PNAS* — [doi:10.1073/pnas.1607946113](https://doi.org/10.1073/pnas.1607946113)
- McTigue m.fl. 2020, *Reading Research Quarterly* — [doi:10.1002/rrq.256](https://doi.org/10.1002/rrq.256)
- Zorzi m.fl. 2012, *PNAS* — [doi:10.1073/pnas.1205566109](https://doi.org/10.1073/pnas.1205566109)
- Hakvoort m.fl. 2017, *Journal of Experimental Child Psychology* — [doi:10.1016/j.jecp.2017.07.010](https://doi.org/10.1016/j.jecp.2017.07.010)
- Łuniewska m.fl. 2022, *Learning and Instruction* — [doi:10.1016/j.learninstruc.2021.101576](https://doi.org/10.1016/j.learninstruc.2021.101576)
- Galliussi m.fl. 2020, *Annals of Dyslexia* — [doi:10.1007/s11881-020-00194-x](https://doi.org/10.1007/s11881-020-00194-x)
- Schneps m.fl. 2013, *PLOS ONE* — [doi:10.1371/journal.pone.0071161](https://doi.org/10.1371/journal.pone.0071161), [doi:10.1371/journal.pone.0075634](https://doi.org/10.1371/journal.pone.0075634)
- Azzarello m.fl. 2026, *Annals of Dyslexia* — [doi:10.1007/s11881-026-00389-8](https://doi.org/10.1007/s11881-026-00389-8)
- Wery & Diliberto 2017, *Annals of Dyslexia* — [doi:10.1007/s11881-016-0127-1](https://doi.org/10.1007/s11881-016-0127-1)
- Häikiö m.fl. 2015, *Journal of Cognitive Psychology* — [doi:10.1080/20445911.2014.982126](https://doi.org/10.1080/20445911.2014.982126)
- Lopes & Barrera 2019, *Estudos de Psicologia (Natal)* — [doi:10.22491/1678-4669.20190035](https://doi.org/10.22491/1678-4669.20190035)
- Dreschinski 2022, ph.d.-afhandling, PH Heidelberg — [doi:10.46586/SLLD.254](https://doi.org/10.46586/SLLD.254)
- Brügelmann 2025, rapport på peDOCS, ikke fagfællebedømt — [doi:10.25656/01:34472](https://doi.org/10.25656/01:34472)
- Goodwin & Ahn 2010, *Annals of Dyslexia* — [doi:10.1007/s11881-010-0041-x](https://doi.org/10.1007/s11881-010-0041-x)
- Arnbak & Elbro 2000, *Scandinavian Journal of Educational Research* — [doi:10.1080/00313830050154485](https://doi.org/10.1080/00313830050154485)
- Gellert m.fl. 2021, *Reading Research Quarterly* — [doi:10.1002/rrq.325](https://doi.org/10.1002/rrq.325)
- Wood m.fl. 2018, *Journal of Learning Disabilities* — [doi:10.1177/0022219416688170](https://doi.org/10.1177/0022219416688170)
- Keelor m.fl. 2023, *Annals of Dyslexia* — [doi:10.1007/s11881-023-00281-9](https://doi.org/10.1007/s11881-023-00281-9)
- Gerbier m.fl. 2018, *Computer Speech & Language* — [doi:10.1016/j.csl.2017.07.003](https://doi.org/10.1016/j.csl.2017.07.003)
- Lee & Yoon 2017, *Journal of Learning Disabilities* — [doi:10.1177/0022219415605194](https://doi.org/10.1177/0022219415605194)
- Lauer-Schmaltz m.fl. 2014, *Didaktik Deutsch* — [doi:10.25656/01:17152](https://doi.org/10.25656/01:17152)
- Zimmermann m.fl. 2021, *Remedial and Special Education* — [doi:10.1177/0741932519855058](https://doi.org/10.1177/0741932519855058)
- Olson & Wise 1992, *Reading and Writing* — [doi:10.1007/BF01027488](https://doi.org/10.1007/BF01027488)
- Elbro m.fl. 1996, *Scandinavian Journal of Psychology* — [doi:10.1111/j.1467-9450.1996.tb00647.x](https://doi.org/10.1111/j.1467-9450.1996.tb00647.x)
- Griffiths m.fl. 2016, *Ophthalmic & Physiological Optics* — [doi:10.1111/opo.12316](https://doi.org/10.1111/opo.12316)
- Suttle m.fl. 2018, *Clinical and Experimental Optometry* — [doi:10.1111/cxo.12676](https://doi.org/10.1111/cxo.12676)
- Takacs, Swart & Bus 2015, *Review of Educational Research* — [doi:10.3102/0034654314566989](https://doi.org/10.3102/0034654314566989)
- Bus m.fl. 2026, *Early Education and Development* — [doi:10.1080/10409289.2025.2571978](https://doi.org/10.1080/10409289.2025.2571978)
- Mol m.fl. 2008, *Early Education and Development* — [doi:10.1080/10409280701838603](https://doi.org/10.1080/10409280701838603)
- Noble m.fl. 2019, *Educational Research Review* — [doi:10.1016/j.edurev.2019.100290](https://doi.org/10.1016/j.edurev.2019.100290)

## Kendte begrænsninger

- Orddele bruger en ordliste og enkle regler: ord, der ikke står på listen, forbliver hele, og flertydige ord (f.eks. „anden“) deles ikke. Kun dansk indtil videre.
- Orddelingsmønstrene deler ikke enkelte bogstaver fra i starten eller slutningen af et ord, og nogle danske delinger er forkerte (f.eks. `hund-en` i stedet for `hun-den`). Løsning: ret det i teksten med `·`.
- Tekst oven på illustrationer eller i dekorative skrifttyper bliver genkendt dårligere.
- Kun de gamle bogstaver bliver fjernet: papiret eller billedet under dem bliver udfyldt ud fra omgivelserne (inpainting), så ujævnt lys og papirets struktur bliver, som de var. Står teksten på en illustration, får den nye tekst en blød, lys glorie. Fine, regelmæssige mønstre kan se lidt slørede ud, hvor teksten stod.
- På bogens side gælder skriftstørrelse og afstande, så langt der er plads: størrelsen først, derefter så meget af afstanden, som kan være der. Er der ikke plads til den valgte størrelse, siger indstillingerne det; til rigtig stor skrift er visningen „Kun teksten“ bedre.
- Sidegenkendelsen er forsigtig: fotografér én side i midten af billedet med mindst tre synlige kanter. Skygger, illustrationer og hele opslag kan stadig forvirre den. Kontrollér rammen, før du godkender.
- Den automatiske krumning følger sidens synlige kanter. En skjult eller afskåret kant giver ingen oplysninger om krumningen; folder inde på siden og komplicerede buer kan stadig kræve, at kanternes midtpunkter justeres i hånden.

## Roadmap

Roadmappen er opdelt i epics og stories (se [CONTRIBUTING.md](CONTRIBUTING.md)). Det, der er planlagt, styres som [issues med mærket `roadmap`](https://github.com/eikrad/laesehjaelper/issues?q=is%3Aissue%20is%3Aopen%20label%3Aroadmap). Idéer og fejl meldes som [issue](https://github.com/eikrad/laesehjaelper/issues/new). Vil du bidrage, så læs [CONTRIBUTING.md](CONTRIBUTING.md).

## Ansvarsfraskrivelse

Læsehjælper er et gratis hobbyprojekt og ikke et færdigt produkt. Tekstgenkendelse og stavelsesdeling laver fejl, så tjek altid teksten, før et barn læser den. Appen erstatter ikke undervisning, læsevejledning eller en udredning for ordblindhed.

Billeder og bøger bliver kun behandlet og gemt på brugerens egen enhed. Bøger er beskyttet af ophavsret: brug kun Læsehjælper til bøger, du selv har adgang til, og kun til privat brug, og del ikke omdannede bøger uden at have rettighederne.

Softwaren stilles til rådighed, som den er, uden nogen form for garanti.

## Licens

Koden er udgivet under [MIT-licensen](LICENSE). Komponenter fra tredjepart har deres egne licenser, se [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
