# Danish and Nordic research on reading support: what it adds for Læsehjælper

*Literature review for Læsehjælper, as of 5 November 2026. It builds on [`dyslexia-reading-support.md`](dyslexia-reading-support.md) (the "first review") and does not repeat it. Research notes only: nothing here changes the README or the code. Statements marked **Design inference** are suggestions for the app, not findings of the studies.*

Evidence levels (same as the first review):

| Level | Meaning |
|---|---|
| **L1** | Meta-analysis or systematic review |
| **L2** | Preregistered or large randomised controlled trial (RCT) |
| **L3** | Smaller RCT |
| **L4** | Quasi-experiment, matched-control study or within-subject lab study |
| **L5** | Correlational work, expert opinion, report |

Reading marks: **[full]** = relevant parts of the full text read; **[abstract]** = abstract only; **[metadata]** = bibliographic record only; **[grey]** = report, working paper or practitioner article, not peer-reviewed. Grey literature is kept apart from peer-reviewed findings and is never the only basis for a claim that something works.

---

## 1. Summary

### For parents, in plain language

- **Danish is a hard language to learn to read.** Danish spelling is far from the way words sound, and spoken Danish swallows many sounds. Danish children need more time to read words accurately than Norwegian, Swedish or Icelandic children. A slow start is common and is not by itself a sign of dyslexia.
- **Danish research on early help is strong.** Several Danish trials show that teaching letter sounds and sounding out in kindergarten and grade 1, often in small groups, helps children at risk. In the newest trial, among children at risk, the share who could hardly read any words at the end of grade 1 fell from about a third to about one in seven.
- **Ask the school early.** Danish schools can use a risk test for dyslexia in kindergarten class and grade 1, and a national dyslexia test from grade 3. Parents can ask for the national test at least once.
- **Word parts are a good fit for Danish.** Danish studies show that teaching children to notice word parts (e.g. *sommer + fugl + ene*) helps them understand and spell long words. The app's word-part display builds on this idea, but the display itself has not been tested.
- **Coloured syllables come mainly from German-language practice and have not been tested in Danish.** In Danish, the written syllable and the spoken syllable often do not match (*pige* has two written syllables, but the *g* is silent). Danish beginner teaching mostly works with letter sounds and frequent whole words rather than syllables.
- **Text-to-speech helps children follow a text but does not teach reading by itself.** International studies show a modest gain in understanding, and a Danish school trial points the same way. Danish and Swedish studies also show that many children with dyslexia rarely use their read-aloud tools unless an adult helps them get started.
- **Let your child try a word before the app reads it.** A Danish trial of a reading tool that had children work out the spelling patterns in a word before they could hear it read aloud found that children decoded as well as with an ordinary phonics programme and understood more.
- **Highlighting can help, but children like plain text.** In a Danish lab study, second graders read faster when the word they were looking at changed colour, without understanding less; most still preferred plain black text.
- **What you say matters.** A large Danish trial found that a few books and simple advice (praise effort, talk about the story, do not correct every small mistake) improved second graders' reading.

### Is Denmark behind?

**Partly, and less than it looks.** Measured by research on dyslexia specifically, Denmark publishes the least of the four larger Nordic countries: about 17 dyslexia papers per million inhabitants in 2000–2025, against about 20 in Sweden, 34 in Norway and 53 in Finland (OpenAlex; section 3.1). Danish studies are almost absent from the big international meta-analyses. A Danish-led Campbell review found 1 Danish study good enough to analyse, against 10 Swedish ones. Research on display aids with Danish children is almost absent: one eye-tracking study of word highlighting in second graders from Denmark's single typography lab, and nothing on spacing, fonts or syllable colours. There is also very little on read-aloud technology, even though Denmark gives this technology to many pupils.

But Denmark is **not** behind in several areas that matter for this app. Denmark has the most school RCTs in Scandinavia (27, against 17 in Sweden and 11 in Norway, by 2018). It has a national, validated dyslexia test (since 2015) and an early risk test (since 2016); this review found no single national equivalent in Norway or Sweden. One research group (Elbro and colleagues, Copenhagen) has produced a long line of internationally cited work on early identification, early intervention and morphology. Danish children's reading scores in PIRLS (539 in 2021) are level with Norway and close to Sweden, whereas in the 1991 IEA study Danish 9-year-olds were among the lowest-scoring groups in Europe. The fair summary is: **strong on early identification, early intervention and large trials; weak on reading aids, technology and the Danish-specific questions that this app raises.**

---

## 2. Danish research by topic

### 2.1 Why Danish is hard to read and spell

**Orthography.** Seymour, Aro & Erskine 2003 (L5, cross-sectional; **[abstract]**) compared grade 1 children in 13 European orthographies. Most groups read familiar words and simple nonwords accurately before the end of the first school year; the clear exceptions were French, Portuguese, Danish and above all English. The authors attribute the delay to syllable complexity (which mainly slows decoding) and orthographic depth (which slows both word and nonword reading), not to school starting age. The full paper, with per-language percentages, could not be read here, so the exact Danish figures are not reported.

Juul & Sigurðsson 2005 (L4/L5; **[abstract]**) compared nonword spelling in 115 Danish and 77 Icelandic children, mostly in grades 3–4. Danish children made more errors on doubled medial consonants and on initial consonant clusters, even when matched with Icelandic children on simpler spelling. The consonant clusters are spelt regularly in both languages, so the authors conclude that even regular sound–letter mappings may be learnt more slowly in a deep orthography.

Juul 2005 (L5; **[abstract]**) tested 104 Danish children in grades 4–6 and found that they rely on units larger than single phonemes: context-sensitive spellings (where the spelling of a sound depends on its neighbours) form a separate, intermediate level of skill between phoneme-level and word-specific spelling.

**Spoken Danish.** Danish is also unusual as a spoken language. In a comparison of 18 studies using the same parent questionnaire (CDI), Danish children had the lowest vocabulary comprehension scores from age 1;0 (Bleses et al. 2008, L5, **[abstract]**). Danish 4-, 6- and 8-year-olds scored lowest on past-tense tasks compared with Icelandic, Norwegian and Swedish children (Bleses, Basbøll & Vach 2011, L5, **[abstract]**). A conceptual review links these delays to the very reduced phonetic structure of Danish (many vowels, weakened consonants, few clear boundaries between sounds and words) and argues that Danish listeners depend more on context (Trecca et al. 2021, L5 narrative review, **[abstract]**).

**How accuracy and speed develop.** Juul, Poulsen & Elbro 2014 (L5, longitudinal, 172 Danish beginners; **[abstract]**) found that word-reading speed mainly started to develop after a child reached about 70 % accuracy. The time it took to reach that threshold was best predicted by phoneme awareness; once it was controlled, rapid naming (RAN) was the only predictor of later speed. The authors advise teachers to build basic accuracy before speed.

**From sounded-out to real word.** Elbro, de Jong, Houter & Nielsen 2012 (L5; **[abstract]**) describe a second step in decoding: getting from a sounded-out "spelling pronunciation" to the real word (their example is the gap between a sounded-out *was* and its real pronunciation). Ease of this step predicted word decoding independently, both in a regular orthography (74 grade 1 children) and in a deep one (187 children followed from preschool into grade 1; the paper's affiliation and the deep orthography point to Danish, but this was not checked in the full text).

**Design inference.** The app's tap sequence (whole word → slow syllables → whole word again) ends with the real word, which is the bridging step that Elbro et al. 2012 describe. In Danish the gap between a segmented and a real pronunciation is unusually large, so the final "whole again" is worth keeping.

### 2.2 Early identification and the national tests

Denmark's strongest contribution is early identification, mostly from the Centre for Reading Research at the University of Copenhagen.

- **Familial risk and phonological representations.** Elbro, Borstrøm & Petersen 1998 (L5, longitudinal; **[abstract]**) followed children of dyslexic and of typically reading parents from kindergarten (age 6) to grade 2. Familial risk raised the odds of dyslexia about 4-fold (odds ratio 4.3). Letter naming, phoneme identification and the *distinctness* of the child's spoken word forms each predicted dyslexia independently. The paper is cited more than 480 times (OpenAlex).
- **Dynamic tests.** Instead of measuring what a child already knows, a dynamic test teaches something new (e.g. three unfamiliar letters) and measures how quickly the child learns it. A dynamic test of phonological awareness added to prediction in kindergarten and early grade 1, but not by the end of grade 1 (Gellert & Elbro 2017, *J Learning Disabilities*, 160 children, L5, **[abstract]**). A dynamic test of decoding added to the prediction of word reading difficulties at the end of grade 1 after controlling for standard predictors (Gellert & Elbro 2017, *Scientific Studies of Reading*, 171 children, L5, **[abstract]**), and was followed into grade 2 (Gellert & Elbro 2018, **[metadata]**). In adult second-language learners (88) and native speakers (65), the dynamic decoding test reduced the influence of second-language vocabulary and schooling, so the same cut-off worked for both groups (Elbro, Daugaard & Gellert 2012, L5, **[abstract]**).
- **When to screen.** Poulsen, Nielsen, Juul & Elbro 2017 (L5, 164 children from end of grade 0 to end of grade 2; **[abstract]**) found that reading measures taken six months into grade 1 predicted as well as a full battery of earlier measures. They propose screening at several points with increasing sensitivity, instead of a single early screening.
- **The national dyslexia test (Ordblindetesten).** Poulsen, Juul & Elbro 2023 (L4/L5 test validation; **[full]**). Before 2015, Danish municipalities used different definitions; around 2002 some did not recognise dyslexia at all, and support ranged from roughly 2 to 87 hours per pupil per year. Parliament ordered a single test in 2012, and it was released in February 2015 for grade 3 up to university. It defines dyslexia narrowly as slow and/or inaccurate mapping of letters onto sounds and uses two computer-administered tasks: picking which of five nonwords sounds like a real word, and picking the right spelling of a spoken nonword. In 1,564 students across 10 educational levels, agreement with prior special-needs status was excellent from grade 5 upward (AUC .93–.97) but weaker in grade 3 (AUC .85 [.77–.92], sensitivity .43, specificity .96) and in vocational education (AUC .76). The Ministry set the cut-off so that the total number of people with a diagnosis stayed the same as before ("economically neutral"), which the authors note is a political, not a scientific, choice. A separate report found that only 61 % (49 of 81) of pupils whom municipalities had labelled dyslexic met the national test criterion (Arnbak & Petersen 2017, **[grey]**, [full]).
- **How many children.** EVA 2020 (**[grey]**) gives a rough estimate of about 7 % of a year group, citing a 2018 report in which 7 % of Danish adults described themselves as dyslexic and 8 % of pupils received support for severe reading difficulties in 2014.
- **The risk test (Risikotest for ordblindhed).** An optional test for kindergarten class and grade 1 based on Gellert & Elbro's dynamic decoding test, published by the Ministry's agency in 2016 (updated 2022) according to Gellert et al. 2024 and Poulsen et al. 2023. It is a test of *risk*, not a diagnosis.
- **Who responds to early help.** Gellert, Petersen & Elbro 2026 (L5, prediction within the intervention arm of the trial in 2.3; 101 at-risk grade 1 children, 68 first-language and 33 second-language learners of Danish; **[abstract]**) found that phonological awareness, letter knowledge, letter–sound knowledge and *pronunciation accuracy* predicted response best. Letter–sound knowledge plus pronunciation accuracy classified poor and adequate responders reasonably well, in both language groups.

**What it could mean for Læsehjælper (design inference).** The app cannot screen children and should not try. A short Danish note for parents that points to the risk test and the national test, and that says early help works, would be accurate and useful (Issue candidate 4).

### 2.3 Early intervention: letters, sounds and sounding out

- **Elbro & Petersen 2004** (L3; **[abstract]**, design details from Pontoppidan et al. 2018 **[full]**). Denmark's first educational RCT (started 1992). 35 children of dyslexic parents received a 17-week phoneme awareness and letter–sound programme in their regular kindergarten classes. Compared with 47 untrained at-risk controls, they read words and nonwords better in grades 2, 3 and 7, and the weakest readers even had better reading comprehension in grade 7. They still lagged behind 41 children without familial risk. Children who did not respond had poorer spoken word representations.
- **Møller, Mortensen & Elbro 2022** (L3; **[abstract]**). 65 kindergarteners with little letter knowledge were randomised individually to one of four conditions (four 20-minute sessions). Phonics with integrated spelling beat letter–sound *recognition* practice (d = 0.38–0.86) and business as usual (d = 0.54–1.21) on phoneme awareness, spelling and reading. Producing letter sounds worked slightly better than only recognising them.
- **Gellert, Petersen, Borstrøm, Poulsen & Elbro 2024** (L3, cluster-randomised with 30 schools; **[full]** of the Danish article, English abstract checked). Schools from 12 municipalities on Zealand were paired on parental income and share of second-language pupils, and one school in each pair was drawn by lot to deliver the programme (30 schools, 34 sites). The lowest scorers on the risk test at the end of kindergarten class took part: 252 were selected, and 111 programme pupils and 96 controls with business as usual were analysed. The programme had 76 small-group lessons across grade 1 on letter sounds, sound analysis, blending short words and scaffolded reading of short texts, partly replacing classroom teaching. Effects at the end of grade 1 (Cohen's d, adjusted for pretest): letter–sound knowledge 0.85; word reading accuracy 0.47 and speed 0.42; nonword reading accuracy 0.54 and speed 0.49; phonological blending 0.33 (all p < .05). The share of children who could read at most two words fell from 37 % to 15 % (nonwords: 35 % to 13 %), and the share still at high risk fell from 80 % to 59 %. Limitations: published in a Danish-language journal, no preregistration was mentioned in the parts read, and no long-term follow-up yet. Gellert et al. 2026 (above) analyses the same programme arm.
- **Long-term effects of phonics readers.** Elbro, Kristensen & Skov 2025 (**[grey]**, working paper; **[abstract]**) link the choice of a phonics-compatible grade 1 basal reader to better grade 9 results and labour-market outcomes 23 years later, using Danish register data. Not peer-reviewed and quasi-experimental; it is mentioned only because it shows a typical Danish strength: very long follow-up through national registers.

Swedish and Norwegian trials point the same way: a 10-week one-to-one or one-to-two phonics programme in 12 Swedish schools gave large gains in decoding (g = 1.07) and letter knowledge (g = 1.03) (Bøg, Dietrichson & Isaksson 2021, n = 161, L3, **[abstract]**; led by researchers at VIVE in Copenhagen). In Norway, the "On Track" trial (13 schools randomised, 140 at-risk first graders) improved reading and spelling, with or without an adaptive computer component (Solheim et al. 2018, L3, **[abstract]**). A Swedish grade 3 RCT (57 vs 55) gave gains in spelling, speed and comprehension at post-test, but after 5 years only word decoding still differed (Wolff 2016, which also summarises Wolff 2011; L3, **[abstract]**).

**What it could mean for Læsehjælper (design inference).** No change of scope: these are teaching programmes, not reading aids. The findings support the first review's message that the app supplements and does not replace structured teaching. Møller et al. 2022 (production beats recognition) is consistent with keeping "your turn", where the child produces the words aloud.

### 2.4 Morphology and compound words

Danish has long compounds and many inflectional endings, and Danish researchers were early in studying morphology in dyslexia.

- **Elbro & Arnbak 1996** (L4; already in the first review): dyslexic adolescents used root-morpheme recognition to compensate in reading.
- **Arnbak & Elbro 2000** (L3; **[abstract]**). 33 dyslexic pupils in grades 4–5 received 36 short (about 15 minutes) oral lessons on the meaning of morphemes; 27 similar pupils were untrained controls. The trained group gained more in reading comprehension and in spelling morphologically complex words, while phonological measures improved equally in both groups. Cited by the meta-analyses of Goodwin & Ahn 2010 and Galuschka et al. 2020 (section 3.2).
- **Gellert, Arnbak, Wischmann & Elbro 2021** (L2, n = 332 grade 5 pupils with limited vocabulary, randomised to morphology, alternative vocabulary teaching or control; **[abstract]**). Large short-term effects on segmenting and explaining taught and untaught words with taught morphemes; medium effects on guessing the meaning of pseudowords with known roots; medium to large effects still present 10 months later. Only a small effect on comprehension of texts with trained words and none on standard comprehension or vocabulary tests.
- **Gellert 2023** (already in the first review, **[abstract]**): predictors of long-term knowledge of taught and transfer words after a morphological vocabulary intervention.
- **Norway.** Preschool morphological training produced better word and text reading at the end of grade 1 and better reading comprehension in grade 6, compared with an untrained group; phonological training did not differ from controls in grade 6 (Lyster, Lervåg & Hulme 2016, L4 for the comparison with controls, which was quasi-experimental; **[abstract]**; building on Lyster 2002, **[metadata]**).

**What it could mean for Læsehjælper (design inference).** Of all the app's features, the Danish word-part display (sommer|fugl|ene) has the most Danish and Nordic background. But every study above *taught* morphology; none tested whether *showing* word boundaries in text helps a child read. Juul 2005 (Danish spellers use units larger than the phoneme) is a further reason why larger units are a natural fit for Danish. The display remains an inference and should stay optional.

### 2.5 Syllables in Danish

This is where Danish research is thinnest.

- **Elbro, Rasmussen & Spelling 1996** (L3/L4; **[abstract]**). 30 Danish pupils with language and reading impairments (grades 2–8) read with a computer program that gave synthetic-speech feedback on words, about 20 minutes a day for 40 days. One group got feedback segmented visually and auditorily into **syllables**; the other got feedback as **letter names**. In both, the child had to blend the segments and then compare with whole-word feedback. Both groups progressed more than 35 age- and reading-level-matched controls in ordinary remedial teaching, and the syllable group gained slightly more in nonword reading and syllable segmentation. This is the only Danish study found that tests a syllable-based reading aid, and it is close to the app's tap sequence (segments, then whole word). It is 30 years old, small, used 1990s speech synthesis, and the control group was matched rather than randomised according to the abstract (Pontoppidan et al. 2018 list it among Danish RCTs).
- **Gissel 2015** (L5, design-based study in one grade 2 class, 14 children; **[full]**). A Danish e-book prototype split multi-syllable words with regular or frequent parts into syllables or morphemes as one level of graded support, before text-to-speech. The author could not tell from screen recordings whether children used the syllable split; teachers and children said some did. In a teacher survey cited in the paper (Lewin 1998, England), only about 20 % of teachers saw syllable division as a valuable e-book feature.
- **No Danish study of coloured syllables** was found in Crossref, OpenAlex, Danish journals or the Danish reading centre's publications. A search for Danish beginner books with coloured syllables found phonically regular ("lydrette") books and lists of the 120 most frequent words instead, which matches how Danish beginners are usually taught (practice observation, not research).
- In OpenAlex, only 2 papers with Danish affiliations matched a search for syllables in children's reading in 2000–2025, against 17 Finnish and 47 German ones (section 3.1).

**Linguistic background (not a study of reading).** Three features of Danish make syllable division less clear than in German or Finnish:
1. Doubled consonants mark a short vowel and stand for one sound shared by two syllables, so a written split like *kat|ten* or *hop|pe* has no clear spoken counterpart. Juul & Sigurðsson 2005 found these doublets hard for Danish children to spell.
2. Many final syllables have a reduced vowel (schwa), and some written consonants are silent or turn into vowel-like sounds (*pige*, *bogen*, *gade*). The written syllable *ge* in *pi|ge* is not pronounced as written.
3. Spoken Danish has a very reduced sound structure (Trecca et al. 2021).

**Check of the app's own output (not research).** The app splits Danish words with the TeX hyphenation patterns (`hyphen/da`, `src/silben.ts`), which follow line-breaking conventions, not speech. A quick run on sample words gave *ka|ge*, *pi|ge*, *bo|gen*, *kat|ten*, *hop|pe*, *som|mer|fug|le|ne*, but also *hund|en*, *ap|pels|in* and *mæl|kebøt|te*. In the tap sequence (`src/readflow.ts`), each of these parts is sent to the speech engine as a separate utterance, so a Danish voice is asked to say *ge*, *ne* or *pe* on their own. How Danish voices pronounce such fragments was not tested here, but they are not the sounds those letters have inside the word (Issue candidate 1).

### 2.6 Read-aloud and assistive reading technology (LST)

In Denmark, pupils with dyslexia are usually given "læse- og skriveteknologi" (LST): text-to-speech, word prediction and scanning tools such as CD-ORD, AppWriter or IntoWords. Schools decide case by case; there is no fixed national entitlement to particular tools (Petersen 2019, **[grey]**).

**Peer-reviewed**
- **Elbro, Rasmussen & Spelling 1996** (above): segmented speech feedback, used as a training tool, helped.
- **Gissel & Andersen 2021** (L2; **[abstract]**; the full text was behind a bot check). Cluster-randomised field trial with 47 grade 2 classrooms and 1,013 eight-year-olds. The treatment was a digital reading material with three levels of text-to-speech support and attention to spelling patterns. To stop children from simply letting the computer read, access to having a word read aloud was **postponed**: children were first directed to identify and practise the relevant spelling pattern. The active control used the most common Danish phonics programme. Decoding did not differ; reading comprehension was better in the treatment group. Effect sizes are not given in the abstract.
- **Gissel 2015** (L5; **[full]**). Background to the trial above. In an earlier study by the same author (Gissel 2014, cited there, not read), only 4 of 15 children aged 7–8 tried to decode words on their own (and these hardly used the support); others pressed text-to-speech too quickly, guessed, or found the text too hard. The prototype therefore sorted words into categories (rhyme families, frequent irregular words, regular multi-syllable words, hard words) and gave different support for each, with text-to-speech as the last step for most categories.

**Grey literature (reports, not peer-reviewed)**
- **SFI 2014, "Effekten af it-støtte på elevers læsefærdigheder. Et felteksperiment i Horsens Kommune"** ("The effect of IT support on pupils' reading skills: a field experiment in Horsens Municipality"; Christensen, Andersen, Bingley & Sonne-Schmidt; **[grey]**, [full summary and design]). 11 of 19 municipal schools were randomised (waiting-list design), and pupils in grades 4–6 at intervention schools were offered a text-to-speech program (CD-ORD) in 2010–2012; 490 pupils, 1,249 national-test observations. Estimated effects on the national test scale (1–100, where 50 is age-typical): text comprehension +7.5 points (plausible range about 1 to 14), decoding +4 (about −4 to 12), language comprehension unclear. Effects were largest for weak and middle readers and appeared even when pupils could **not** use the program during the test. Pupils already given text-to-speech before the trial (the weakest readers) could not be studied, and teachers' actual use was not recorded.
- **Petersen & Arnbak 2018, "Brug af it i den første læse- og staveundervisning"** ("Use of IT in early reading and spelling teaching"; **[grey]**, summarised by Petersen 2019, [full]). 522 pupils followed from the end of kindergarten class to the end of grade 3; half the classes used text-to-speech and word prediction in at least two Danish lessons a week. Not randomised, and the groups differed at baseline. No effect on reading or language skills, including for children with weak language skills; a positive effect on motivation (children found reading and writing more fun and rated their own skills higher, without scoring higher).
- **Arnbak & Petersen 2017, "Projekt It og Ordblindhed"** ("Project IT and dyslexia"; **[grey]**, [full summary sections]). More than 100 pupils with dyslexia in three municipalities, followed in grades 5–6 after getting LST in grade 4. Most hardly used their LST, so the planned long-term comparison was dropped. In tasks done with and without the tools, text-to-speech raised their reading comprehension to the level of average readers, and word prediction improved spelling. Only about a third of Danish teachers felt prepared to support the tools, and fewer than half the pupils used individual settings.
- **EVA 2020, "Undervisning af ordblinde elever i folkeskolen"** ("Teaching pupils with dyslexia in primary school"; **[grey]**, knowledge memo; 2,900 records screened, 27 studies kept after full-text screening plus reference searches). Concludes that a thorough introduction to the tools is a precondition for use, and that pupils need to learn *when* to use text-to-speech and when to read themselves, alongside continued teaching of phonology and morphology.

**Swedish evidence**
- Svensson et al. 2021 (L3/L4, n = 149, allocation method not checked; **[abstract]**): 24 sessions of training with tablet-based text-to-speech and speech-to-text apps. Both groups improved as much as the norm population in a year, but gains did **not** differ from treatment as usual, directly after or one year later; motivation for schoolwork rose. The full text, which would show whether allocation was random, sat behind a bot check.
- Lindeblad et al. 2017 (L4, uncontrolled pilot, 35 pupils aged 10–12; **[abstract]**): reading improved at the rate of typical readers, with better motivation and independence.
- SBU 2014 (L1, Swedish health technology assessment; **[grey]** as an agency report, [abstract via INAHTA]): only structured letter–sound training had scientific support; evidence on assistive technology was insufficient for any conclusion.

**Nordic collaboration on writing technology.** Recent Danish–Norwegian–Swedish work looks at writing rather than reading: a review of spelling and speech tools in nine programmes for three Nordic languages found that the best spelling aids give accurate spelling for moderate difficulties but cost time and attention that can disrupt writing (Mossige et al. 2023, L5, **[abstract]**), and a protocol describes single-case studies of speech-to-text with 15 pupils aged 10–12 in the three countries (Mossige et al. 2023, **[metadata]**). Neither concerns reading aids for beginners.

**What it could mean for Læsehjælper (design inference).** The Danish and Swedish data agree with the first review: listening helps a child get through and understand a text, and may support reading in weak readers when the tool is part of daily school life (Horsens), but it does not by itself build reading skill (Petersen & Arnbak 2018; Svensson et al. 2021). Two Danish findings are new and specific:
1. Children often press "read aloud" before trying (Gissel), and a design that asks them to look first worked in a large trial (Gissel & Andersen 2021). This supports an optional "try first" step for tap-a-word (Issue candidate 3).
2. Children with dyslexia often do not use their tools at all unless adults help them start (Arnbak & Petersen 2017; EVA 2020). An app used together with a parent avoids part of this problem.

### 2.7 Parents and reading at home

- **Andersen & Nielsen 2016** (L2; full text in the first review): growth-mindset advice and books for parents of 1,587 Danish second graders; about 0.1 SD at 7 months, about 0.3 SD where parents had believed reading ability was fixed.
- **Bleses et al. 2018, SPELL** (L2; **[full]** partly read): 6,483 children aged 3–6 in 144 Danish childcare centres; 20-week storybook programme; preliteracy d = 0.21–0.27, language d = 0.04–0.16. A version with a parallel home programme (parents read SPELL books twice a week, with model videos but no training) did not add clearly to the base programme. Parent checklists were rarely returned, so home fidelity is unknown.
- **Andersen, Humlum & Nandrup 2016** (L2; **[abstract]**): in a large cluster-randomised trial in Danish schools, extra instruction time increased pupils' learning, and a general increase in time worked at least as well as an expert-designed teaching programme using the same time. The subject, grade and effect sizes are not in the abstract and were not checked. Relevant mainly as a sign that *more learning time* helps.
- Danish RCTs of the UK "Letterbox Club" and "Paired Reading" programmes for children in care were registered (AEA registry, 2016–2019), but no results were found.

**What it could mean for Læsehjælper (design inference).** The Danish trials support short, concrete parent advice (as in READ) more than structured home programmes that need parents to keep records. This agrees with the parent-guide idea in the first review.

### 2.8 Digital books

No Danish study of digital picture books or e-book features for beginning readers was found apart from Gissel's work. The international meta-analyses in the first review that warn against interactive extras were led partly from Norway (Furenes, Kucirkova & Bus 2021, University of Stavanger; McTigue et al. 2020 on GraphoGame, also Stavanger). Their conclusions are not language-specific and transfer to Danish.

### 2.9 Typography and display

Denmark has one active legibility group (Sofie Beier and colleagues, Royal Danish Academy, Copenhagen). Its work bears on the app's display settings, but only one study involves Danish children.

- **Rummens & Beier 2026** (L4, within-subject, one session; **[abstract]**; online 2025). 70 Danish second graders read a short story aloud twice, once in plain black text and once with gaze-based highlighting: an eye tracker turned each word blue once the child had looked at it, giving a cue similar to pointing with a finger. With highlighting, reading was faster, with shorter fixations, fewer regressions and less re-reading; pronunciation accuracy and comprehension did not suffer. Most children nevertheless *preferred* the static black text. This is the only Danish study found that tests a display aid with beginning readers. It used an eye tracker, typical readers and one session, and the highlight followed the child's own eyes, not a voice.
- **Sheppard et al. 2023** (L4; **[abstract]**; US study with a Danish co-author). 94 children from kindergarten to grade 8 read six variations of letter width and letter spacing. About 58 % had a stable "personal best" variation, which gave higher comprehension than their worst variation (and faster passage reading). This supports per-child settings rather than one optimal layout, but comparing a personal best with a personal worst overstates what a sensible default would gain.
- **Adults and low vision** (L4; **[metadata]** or **[abstract]**): wider letters improved letter recognition away from the point of fixation (Oderkerk & Beier 2022), and wider letter spacing and letters improved reading acuity in low-vision readers (Beier et al. 2021). A 2026 review by Beier & Thiessen (L5, **[abstract]**) concludes that no typeface is most legible in general; legibility depends on the reading situation.

**What it could mean for Læsehjælper (design inference).**
- The app's per-profile settings fit Sheppard et al. 2023 and the first review's conclusion that spacing helps some children and not others.
- Rummens & Beier support the idea that a word-level cue that follows the *child's* pace helps beginners. The app highlights words at the *voice's* pace while reading aloud, which is a different situation. A child-paced variant (e.g. the child or parent taps forward word by word in "your turn") would be closer to the finger-pointing cue, but this is untested.
- The children's preference for plain black text echoes Kuster et al. 2018 (first review): children often prefer ordinary text even when a variant helps. Preferences should not be read as effects, in either direction.

---

## 3. Denmark compared with the Nordic countries

### 3.1 Publication counts (OpenAlex)

**Method.** OpenAlex API, queried on 5 November 2026 without an API key. Each query counts works published 2000–2025 with at least one author affiliated to an institution in the country (`group_by=institutions.country_code`); a work with authors in two countries counts for both. Rates are given per 10,000 works of the country's total output in the same years and per million inhabitants (rounded 2024 populations: DK 5.96 M, NO 5.55 M, SE 10.55 M, FI 5.60 M, NL 17.9 M, UK 68.3 M; used only for normalisation). "UK" is OpenAlex country code GB. Exact filters:

| # | Query (`filter=` value) |
|---|---|
| A | `title_and_abstract.search:dyslexia OR dyslexic,publication_year:2000-2025` |
| B | `concepts.id:C506058694,publication_year:2000-2025` (concept "Dyslexia") |
| C | `topics.id:T10103,publication_year:2000-2025` (topic "Reading and Literacy Development") |
| D | `title_and_abstract.search:(dyslexia OR dyslexic OR "reading disability" OR "reading difficulties") AND ("assistive technology" OR "text-to-speech" OR "speech synthesis" OR "read-aloud"),publication_year:2000-2025` |
| E | `title_and_abstract.search:("reading intervention" OR "reading instruction" OR "phonics" OR "early literacy") AND (randomized OR randomised OR trial),publication_year:2000-2025` |
| F | `title_and_abstract.search:(syllable OR syllables) AND (reading OR readers) AND (children OR dyslexia),publication_year:2000-2025` |
| G | `title_and_abstract.search:(morphological OR morpheme OR compound) AND (reading OR dyslexia) AND children,publication_year:2000-2025` |
| H | `title_and_abstract.search:(typography OR "letter spacing" OR font OR "line length") AND (reading OR dyslexia) AND children,publication_year:2000-2025` |
| T | `publication_year:2000-2025` (all works; denominator) |
| L | Local-language works on dyslexia, any year, counted by language, not affiliation: `language:da,title_and_abstract.search:ordblind OR ordblinde OR ordblindhed OR dysleksi`; `language:no,…:dysleksi OR lesevansker`; `language:sv,…:dyslexi OR läs- och skrivsvårigheter`; `language:fi,…:lukivaikeus OR dysleksia` |

**Raw counts (2000–2025)**

| Query | DK | NO | SE | FI | NL | UK |
|---|---|---|---|---|---|---|
| A Dyslexia (title/abstract) | 103 | 191 | 209 | 296 | 484 | 2,446 |
| B Dyslexia (concept) | 102 | 173 | 199 | 286 | 497 | 2,144 |
| C Reading & literacy (topic) | 1,066 | 1,064 | 1,131 | 1,279 | 4,376 | 10,918 |
| D Reading difficulty × read-aloud/assistive technology | 6 | 7 | 11 | 1 | 3 | 44 |
| E Reading intervention × trial | 8 | 17 | 15 | 11 | 24 | 91 |
| F Syllables × children's reading | 2 | 7 | 4 | 17 | 24 | 84 |
| G Morphology/compounds × children's reading | 10 | 20 | 8 | 22 | 43 | 201 |
| H Typography × children's reading | 3 | 1 | 0 | 4 | 7 | 21 |
| T All works | 886,186 | 565,594 | 1,076,071 | 557,790 | 1,679,707 | 6,057,021 |

**Normalised**

| Measure | DK | NO | SE | FI | NL | UK |
|---|---|---|---|---|---|---|
| A per million inhabitants | **17** | 34 | 20 | 53 | 27 | 36 |
| A per 10,000 works | **1.2** | 3.4 | 1.9 | 5.3 | 2.9 | 4.0 |
| C per million inhabitants | 179 | 192 | 107 | 228 | 244 | 160 |
| C per 10,000 works | 12.0 | 18.8 | **10.5** | 22.9 | 26.1 | 18.0 |
| D per million inhabitants | 1.0 | 1.3 | 1.0 | 0.2 | 0.2 | 0.6 |
| E per million inhabitants | **1.3** | 3.1 | 1.4 | 2.0 | 1.3 | 1.3 |
| F per million inhabitants | **0.3** | 1.3 | 0.4 | 3.0 | 1.3 | 1.2 |
| G per million inhabitants | 1.7 | 3.6 | **0.8** | 3.9 | 2.4 | 2.9 |
| H per million inhabitants | 0.5 | 0.2 | 0 | 0.7 | 0.4 | 0.3 |

**Trend (query A per 10,000 works, 2000–2012 → 2013–2025):** DK 1.4 → 1.1; NO 3.7 → 3.2; SE 2.8 → 1.5; FI 9.2 → 3.5; NL 2.8 → 2.9; UK 5.1 → 3.4. In absolute numbers Denmark nearly doubled (35 → 68), but its total output grew faster. On the broad reading topic (C), Denmark's share rose from 9.0 to 13.2 per 10,000 works, still below Norway (13.8 → 20.8) and Finland (26.4 → 21.3).

**Reading the numbers.**
- On dyslexia, Denmark has the lowest rate in the Nordic comparison by both measures. Finland's lead reflects the Jyväskylä Longitudinal Study of Dyslexia and GraphoGame (Lyytinen et al. 2015, **[metadata]**).
- On reading research in general, Denmark is in the middle per inhabitant (close to Norway, above Sweden and the UK) but low relative to its large total research output, which is dominated by health and natural sciences.
- On read-aloud and assistive technology (D), Denmark is level with Norway and Sweden, but the numbers are tiny.
- **Local-language literature (L).** OpenAlex indexes 89 Danish-language works on dyslexia, 111 Norwegian, 898 Swedish and 59 Finnish (any year). The search terms are not equivalent (the Norwegian and Swedish terms also cover general reading and writing difficulties), and the Swedish count is swollen by student theses in DiVA. Danish-language work therefore does not close the gap to Norway in this index, but much Danish practitioner literature (e.g. *Viden om Literacy*) is not indexed at all.
- On typography (H), all six countries have very few hits. Of the 3 Danish ones, only one concerns children's reading (Sheppard et al. 2023, US children, Danish co-author). The Danish study of word highlighting in second graders (Rummens & Beier 2026, section 2.9) was **missed** by this query because its abstract does not use the word "children"; it was found by an author search. Keyword counts this small should not be over-read.
- On syllables (F), Denmark has almost nothing. On morphology in children's reading (G), Denmark is mid-table (ahead of Sweden, behind Norway and Finland), which fits its known strength in this area.
- **Caveats.** OpenAlex attributes many works to no country (the six countries above plus Germany and the US account for far fewer than the 24,805 works found by query A), so counts are underestimates and best used for comparison. English keywords miss Danish-language publications (e.g. *NyS*, *Viden om Literacy*, *Pædagogisk Psykologisk Tidsskrift*) and reports, which is where much Danish applied work appears (sections 2.3 and 2.6). The concept and keyword versions of the dyslexia count agree closely, which suggests the comparison is robust.

### 3.2 Danish studies in the major meta-analyses

**Method.** For each review, OpenAlex was asked for the works it cites (`filter=cited_by:<review id>`), grouped by country; Danish-affiliated cited works were then listed by title. A cited work is not necessarily an included study, but in a meta-analysis most cited intervention studies are.

| Review (first review's source list) | Cited works | DK | NO | SE | FI | Danish reading studies among them |
|---|---|---|---|---|---|---|
| Galuschka et al. 2014 (RCTs for reading disability) | 61 | 1 | 0 | 1 | 5 | none (the Danish item is a methods paper) |
| Hall et al. 2023 (dyslexia interventions, K–5) | 137 | 1 | 0 | 1 | 0 | none (PRISMA statement) |
| McArthur et al. 2018 (Cochrane, phonics) | 101 | 0 | 0 | 0 | 0 | none (English-speaking only by design) |
| Goodwin & Ahn 2010 (morphology) | 81 | 2 | 0 | 0 | 0 | Elbro & Arnbak 1996; Arnbak & Elbro 2000 |
| Bowers, Kirby & Deacon 2010 (morphology) | 95 | 2 | 2 | 0 | 2 | (titles not checked) |
| Galuschka et al. 2020 (spelling) | 135 | 1 | 1 | 2 | 2 | Arnbak & Elbro 2000 |
| Suggate 2016 (long-term effects) | 112 | 1 | 3 | 3 | 3 | Elbro & Petersen 2004 |
| Verhoeven et al. 2022 (computer-assisted word reading) | 119 | 1 | 3 | 1 | 10 | Elbro, Rasmussen & Spelling 1996 |
| Wood et al. 2018 (text-to-speech) | 65 | 0 | 1 | 1 | 0 | none |
| Lee & Yoon 2017 (repeated reading) | 68 | 0 | 0 | 0 | 0 | none |
| Takacs et al. 2015 (digital storybooks) | 113 | 0 | 0 | 0 | 0 | none |
| Furenes et al. 2021 (paper vs screen) | 89 | 0 | 4 | 0 | 1 | none |
| Dietrichson et al. 2021 (Campbell, K–6) | 601 | 8 | 3 | 10 | 7 | Elbro & Petersen 2004; Arnbak & Elbro 2000 (plus VIVE's own reviews) |

In the Danish-led Campbell K–6 review itself, the 205 studies of sufficient quality that entered the meta-analysis came from the US (175), **Sweden (10)**, the UK (7), the Netherlands (3) and **Denmark (1)**, among others (Dietrichson et al. 2021, **[full]**). Danish reading research therefore enters international syntheses through four Copenhagen studies from 1996–2004, mainly on morphology and early phonics. No Danish study appears in the syntheses on text-to-speech, fluency or digital books.

### 3.3 Randomised trials and evidence infrastructure

**RCTs.** Pontoppidan et al. 2018 (L5, systematic mapping; **[full]**) counted RCTs in compulsory schools (grades 0–10) up to about 2017: **Denmark 27** (14 researcher-initiated, 13 policy-initiated), **Sweden 17** (16 researcher-initiated) and **Norway 11**. Denmark's first trial was Elbro & Petersen's (1992), and the early Danish trials were all on dyslexia or language disorders. From 2012, the Ministry of Education funded large trials, many of them run by TrygFonden's Centre for Child Research in Aarhus (e.g. READ, Andersen & Nielsen 2016; teacher's aides, Andersen et al. 2020, **[metadata]**; and the grade 2 digital-learning trial with 1,013 pupils published as Gissel & Andersen 2021). The authors explain Sweden's lower count by a lack of government initiative; Sweden's national agency had stated it could not require schools to use programmes of uncertain effect. Since then, Norway has run several very large literacy trials, for example "Two Teachers" (about 6,000 pupils in 300 classrooms; no average effect, but +0.12 SD for boys and +0.23 SD for low-skilled boys; Haaland, Rege & Solheim 2024, L2, **[abstract]**).

**Infrastructure compared**

| | Denmark | Norway | Sweden | Finland | Netherlands, UK (brief) |
|---|---|---|---|---|---|
| National dyslexia test or care | Yes, since 2015, validated, grade 3 to university (Poulsen et al. 2023) | No single national test found (validated Norwegian tests exist, e.g. those cited by Poulsen et al. 2023) | SBU 2014: few of the diagnostic tests reviewed had been scientifically evaluated | Not checked | NL: since 2009, diagnosis and treatment of severe dyslexia paid by health insurance and bound to a national protocol (Staatscourant 2009) |
| Early risk screening or early help | Risk test for grade 0–1 since 2016, based on Danish research | Law since 2018 requires intensive help in grades 1–4 for pupils falling behind in reading, writing or arithmetic (Stortinget, **[grey]**, search result only) | Not checked | Family-risk research: Jyväskylä Longitudinal Study of Dyslexia (Lyytinen et al. 2015) | England: statutory Year 1 phonics screening check since 2012 (DfE, search result only) |
| Systematic reviews of dyslexia interventions | None national; VIVE Campbell reviews cover all low achievers | Campbell reviews from Oslo (e.g. Hjetland et al. 2017) | **SBU 2014** HTA on dyslexia tests and interventions | – | – |
| Evidence organisations | Nordic Campbell Centre (2002, now VIVE), Danish Clearinghouse for Educational Research (2006), TrygFonden's Centre for Child Research (2013), National Centre for Reading (2006, dissemination) | Campbell Collaboration secretariat (2007), Knowledge Centre for Education (2013), National Reading Centre (Stavanger) | IFAU, Institute for Educational Research | Not checked | – |
| Large literacy RCTs | READ, SPELL, instruction time, digital tool, early intervention | On Track, Two Teachers | Several small RCTs | GraphoGame studies (reviewed by McTigue et al. 2020) | – |

Sources for the evidence organisations: Pontoppidan et al. 2018; the National Centre for Reading's own website (founded 2006 on the Ministry's initiative, run by six university colleges). No Danish Clearinghouse review on dyslexia or reading support was found. Finland, the Netherlands and the UK were checked only for the points shown; they are context, not a basis for conclusions.

### 3.4 Outcomes: PIRLS

**PIRLS, grade 4, average reading scores** (IEA, *PIRLS 2021 International Results*, Exhibit 2.1; **[full]** table read):

| | 2001 | 2006 | 2011 | 2016 | 2021 |
|---|---|---|---|---|---|
| Denmark | – | 546 | 554 | 547 | 539 |
| Norway (grade 5) | – | – | – | 559 | 539 |
| Sweden | 561 | 549 | 542 | 555 | 544 |
| Finland | – | – | 568 | 566 | 549 |
| Netherlands | 554 | 547 | 546 | 545 | 527 |
| England | 553 | 539 | 552 | 559 | 558 |

Standard errors are about 2 points. Denmark's 2021 sample carries IEA footnotes on coverage and participation. Denmark's 2021 score equals Norway's and is close to Sweden's, below Finland's and England's, and above the Netherlands'. All Nordic countries fell between 2016 and 2021.

**Historical context.** In the 1991 IEA Reading Literacy Study, Danish 9-year-olds scored 475, against 569 in Finland, 539 in Sweden and 524 in Norway; among the 26 systems with age-9 data, only a few (e.g. Portugal 478, Trinidad, Venezuela) scored lower (NCES table, a secondary source, **[grey]**). The 1991 and PIRLS scales are different tests, so the scores cannot be compared directly, but Denmark's *position* relative to its neighbours has clearly improved: today Danish grade 4 results are on a par with Norway and Sweden.

### 3.5 Verdict: where Denmark is strong, where the gaps are

**Strong**
- **Early identification:** familial risk, phonological representations, dynamic tests, multi-point screening, a validated national test and a risk test, all from Danish data.
- **Early intervention trials:** from Elbro & Petersen 2004 (started 1992, the earliest school RCT in Pontoppidan et al.'s Scandinavian mapping) to Gellert et al. 2024.
- **Morphology:** Arnbak & Elbro 2000 and Gellert et al. 2021 are among the few morphology trials outside English.
- **Large trials and registers:** TrygFonden's Centre and VIVE run trials with thousands of pupils (READ, instruction time, SPELL, digital tools); register data allow follow-up into adulthood.
- **Systematic reviews of interventions for low achievers:** the VIVE Campbell reviews.
- **Legibility research:** a small typography group at the Royal Danish Academy (Beier and colleagues) publishes internationally on letter width, spacing and crowding, so far mostly with adults and low-vision readers.

**Gaps**
- **Display aids:** one Danish eye-tracking study with children (gaze-based word highlighting, Rummens & Beier 2026); no Danish study of spacing, font, line length, syllable colouring, voice-paced highlighting or type size with children. Denmark's typography research (Royal Danish Academy) works mainly with adults and low-vision readers.
- **Syllables:** one small 1996 study; no work on how Danish written and spoken syllables relate in beginners' reading.
- **Read-aloud technology (LST):** widely provided, but the LST that pupils actually receive has only one randomised evaluation (a 2014 report, never published in a journal) and one quasi-experiment, both grey literature. There is no peer-reviewed trial with dyslexic children and current tools (IntoWords, AppWriter); Sweden has one (Svensson et al. 2021). Gissel & Andersen 2021 is peer-reviewed but tested a purpose-built learning tool, not LST.
- **Fluency and repeated reading in Danish:** no intervention study found.
- **Cross-linguistic studies:** Danish children are missing from the main multi-language predictor studies (Landerl et al. 2013; Ziegler et al. 2010; Caravolas et al. 2012, 2013).
- **Dyslexia research volume:** the lowest of the four larger Nordic countries relative to population and to research output.

So the maintainer's impression is **right about the questions this app raises** and **wrong about Danish reading research in general**.

---

## 4. Transfer to Danish

### 4.1 What cross-linguistic research says

- **Speed of learning.** Danish is among the slowest European orthographies to learn (Seymour et al. 2003), and the delay reaches even regular spellings (Juul & Sigurðsson 2005). Findings from English, also slow, are therefore more relevant for Danish beginners than findings from Finnish, Italian or German.
- **The same predictors everywhere, with more weight in deep orthographies.** Phoneme awareness, letter–sound knowledge and rapid naming predict reading in all alphabetic orthographies studied (Caravolas et al. 2012, 2013, English vs Spanish, Czech, Slovak; L5, **[abstract]**). Phonological awareness matters more where spelling is less transparent (Ziegler et al. 2010, 1,265 grade 2 children in five languages; L5, **[abstract]**). Across 1,114 dyslexic and 1,138 control children in six languages, phoneme deletion and rapid naming predicted dyslexia more strongly in complex orthographies, and more children were classified correctly there (Landerl et al. 2013; L5, **[abstract]**). Danish was not in any of these samples, but by its depth it should behave like English and French (inference): phonological skills matter longer and more strongly.
- **Scandinavian neighbours are shallower.** In Norwegian and Swedish children, phonological awareness predicted reading difficulties only up to grade 1, whereas in English it kept predicting into grade 2; rapid naming predicted in both (Furnes & Samuelsson 2010; L5, **[abstract]**; see also Furnes & Samuelsson 2011). Danish was not included. Findings from Norway and Sweden (e.g. On Track) should transfer to Danish in direction but may underestimate how long Danish children need phonics support.
- **Grain size.** In deep orthographies, larger units (rimes, morphemes, whole words) carry more of the regularity than single letters. Danish spellers already use context-sensitive units (Juul 2005), and Danish morphology training works (Arnbak & Elbro 2000; Gellert et al. 2021). Syllables are a useful unit in languages with simple, clearly bounded syllables (Finnish, Spanish, Italian) and in German, where syllable-based teaching has its own tradition and RCTs (Müller et al. 2017, 2020, in the first review). Danish has complex syllables (consonant clusters, many closed syllables), ambiguous boundaries at doubled consonants and many reduced syllables, which makes the syllable a weaker unit for Danish than for German.

### 4.2 Verdict per app feature

| Feature | Evidence from the first review | Danish/Nordic evidence | Verdict for Danish |
|---|---|---|---|
| Extra letter spacing (with automatic word spacing) | Weakened; small, inconsistent accuracy benefit; not dyslexia-specific (L4) | No study with Danish children; Danish lab work in low-vision adults (L4) and a US child study with a Danish co-author (personal best spacing/width, L4) | **Transfers as far as it goes.** Visual crowding does not depend on language; the weak international evidence applies unchanged. Keep optional and per profile. |
| Line spacing, short lines, type size | Short lines: US teenagers only; larger type for beginners: holds with caveats (L4) | None | **Transfers** (visual, language-independent), with the same weak evidence. |
| Font (Andika default, OpenDyslexic option) | Dyslexia fonts do not help (L1) | None | **Transfers.** No reason to expect Danish to differ. |
| Coloured syllables (default on) | Unclear; Finnish eye-tracking found no effect of colour; weak lab support for weak beginners (L4) | No Danish study; one 1996 study supports *spoken* syllable segmentation with whole-word feedback (L3/L4) | **Doubtful for Danish.** Written syllables often do not match spoken ones (*pi-ge*, *kat-ten*), Danish teaching rarely uses syllables, and the German and Finnish evidence comes from languages with clearer syllables. Should be off by default for Danish (Issue candidate 2). |
| Danish word parts, muted endings | Morphology teaching helps (L1); display untested | Danish RCTs of morphology teaching (L2, L3); Norwegian long-term effect (L4); Danish spellers use larger units (L5) | **Good fit, still unproven as a display.** Better grounded for Danish than syllable colours. Keep optional; could be offered as the Danish alternative to syllable colours. |
| Tap a word: whole → slow syllables → whole | Consistent with decoding support; untested | Segmented speech feedback helped Danish pupils (1996, L3/L4); the final whole word matches the "spelling pronunciation → real word" step (L5); children overuse text-to-speech (L5) | **Transfers in principle, with a Danish-specific risk.** Isolated Danish syllables, especially those with a schwa or a silent consonant, may be mispronounced by speech engines (Issue candidate 1). A "try first" option is supported by a Danish RCT (Issue candidate 3). |
| Read page aloud with word highlighting | Listening helps comprehension modestly (L1); highlighting adds nothing shown | Gaze-based highlighting made Danish second graders read faster without loss of accuracy (L4, but paced by the eyes, not a voice); text-to-speech offer improved comprehension in a Danish randomised field trial (grey); no effect on reading development in Danish grades 0–3 (grey, quasi-experimental) or in a Swedish controlled trial (L3/L4) | **Transfers.** Danish data agree: an access and comprehension aid, not reading teaching. Because spoken Danish is hard to segment (Trecca et al. 2021), a slower speech rate may help Danish listeners (inference; the app already has a rate setting). |
| "Your turn" (child re-reads after hearing) | Repeated reading after a model builds fluency on the practised text (L1) | No Danish fluency study; Danish beginners reach speed only after about 70 % accuracy (L5); producing sounds beats recognising them (L3) | **Transfers.** In Danish, the main gain for weak readers may be accuracy rather than speed for a long time. Any future progress display should not focus on speed. |
| "Read together" questions for the adult | Dialogic reading effects mostly in toddlers (L1) | Danish READ trial: talk about the content, praise effort, few corrections (L2) | **Transfers**, and the Danish READ trial is a better source than Mol 2008 for school-age children. |
| Calm reading screen | Interactive extras do not help comprehension (L1) | Norwegian-led meta-analysis (Furenes et al. 2021) | **Transfers** (not language-specific). |
| Removing in-word hyphens from books | Hyphens slow reading (Finnish, German; L4) | None | **Transfers**, though Danish children's books rarely print syllable hyphens (impression, not checked). |

---

## 5. Issue candidates

Each candidate states the evidence level that would justify the change. None of them is a finding that the app's current design harms children.

1. **Check how the Danish voice says isolated syllables in tap-a-word; fall back to word parts or the whole word when fragments would be mispronounced.**
   *Why:* The slow step sends orthographic fragments such as *ge* (from *pi|ge*), *ne* or *pe* to the speech engine one at a time (`src/readflow.ts`, `src/silben.ts`). In Danish these letters do not sound like that inside the word (schwa, silent or softened consonants, ambisyllabic doubled consonants). The TeX patterns also give splits that are not spoken syllables at all (*ap|pels|in*, *mæl|kebøt|te*). The concept of segmented speech followed by the whole word is supported for Danish (Elbro et al. 1996; Elbro et al. 2012); the concern is the quality of the fragments.
   *Evidence level:* L5 (linguistic reasoning plus a check of the app's output) for the problem; L3/L4 for the value of segmented feedback. This is a correctness check more than an effectiveness claim, so a manual listening test with common Danish words is enough to decide.
   *Possible change:* for Danish, speak word parts (`src/morpheme.ts`) in the slow step where available, keep the visual syllable highlight without separate audio for fragments ending in a reduced vowel, or speak the whole word slowly.

2. **Make coloured syllables off by default for Danish books (keep them as an option, perhaps for long words only).**
   *Why:* No study of syllable colouring in Danish was found; Danish written syllables often differ from spoken ones; Danish beginner teaching mostly works with letter sounds and frequent words (practice observation). AGENTS.md requires features without clear evidence to be optional and off by default. The first review already made this point on international evidence; the Danish evidence adds language-specific reasons.
   *Evidence level:* L5 (absence of evidence, linguistic reasoning). Justified by the project rule, not by a trial.

3. **Optional "try first" mode for tap-a-word: first tap highlights the word and its parts; the audio plays only on a second tap or after a short pause.**
   *Why:* Danish 7- to 8-year-olds often used text-to-speech before trying to read (Gissel 2015, citing Gissel 2014). A grade 2 reading tool that postponed text-to-speech and directed attention to spelling patterns matched a phonics programme on decoding and improved comprehension in a cluster RCT with 1,013 pupils (Gissel & Andersen 2021). Unrestricted text-to-speech and word prediction in grades 0–3 showed no effect on reading skills (Petersen & Arnbak 2018, grey, quasi-experimental).
   *Evidence level:* L2 for the package (the delay cannot be separated from the other parts of the tool); L5 for the overuse problem. Enough for an optional setting, not for a default.

4. **Danish parent note: early help works, and the school can test for risk.**
   *Why:* A risk test exists for kindergarten class and grade 1, and a validated national dyslexia test from grade 3, which parents can request at least once (Poulsen et al. 2023). Early small-group teaching more than halved the share of non-readers at the end of grade 1 (Gellert et al. 2024). The Danish READ trial gives concrete, effective advice for parents (Andersen & Nielsen 2016).
   *Evidence level:* L2 (READ), L3 (Gellert et al. 2024, cluster-randomised), L4 (test validation). The note is informational and makes no claim about the app.
   *Scope:* Danish UI only; German and English users need their own national information, which this review did not research.

5. **Add Danish sources to the README and code comments where they are stronger than the current ones.**
   *Why:* `src/morpheme.ts` cites only Seymour et al. 2003. Arnbak & Elbro 2000 and Gellert et al. 2021 are Danish RCTs on morphology and fit the word-part feature better. The tap sequence in `src/readflow.ts` could cite Elbro, Rasmussen & Spelling 1996 (segmented speech feedback with whole-word check, Danish) and Elbro et al. 2012 (the step from sounded-out to real word). `src/together.ts` could cite Andersen & Nielsen 2016 next to Mol et al. 2008, since it concerns school-age children. Grey reports (SFI 2014, Petersen & Arnbak 2018) should not be cited as evidence of effectiveness in the README.
   *Evidence level:* L2/L3 sources; documentation only.

---

## 6. Gaps: what nobody has studied for Danish

- **Syllable colouring, letter and word spacing, fonts, line length and type size** with Danish children: no study found. Word highlighting has one Danish lab study, but with gaze-based highlighting, not highlighting paced by a voice, and no study with children with dyslexia.
- **How Danish beginners segment written words:** no study compares syllables, rimes and morphemes as reading units for Danish children. The 1996 speech-feedback study is the only one that used syllables.
- **Danish text-to-speech quality:** no study of how Danish speech engines pronounce isolated syllables or word parts, or of whether segmented Danish speech helps or confuses beginners.
- **Current LST tools** (IntoWords, AppWriter, CD-ORD) for children with dyslexia: no peer-reviewed effect study; one randomised field trial (SFI 2014) remained a report.
- **Display of compound boundaries** (as opposed to morphology teaching): no study in Danish or any Nordic language.
- **Repeated reading and fluency interventions** in Danish: none found.
- **Digital picture books and reading apps for Danish beginners:** only Gissel's work.
- **Parent–child reading with technology:** no Danish study; READ and SPELL used paper books.
- **Danish in cross-linguistic studies:** apart from Seymour et al. 2003, Danish is missing from the large multi-language studies of dyslexia predictors.
- **Long-term outcomes of the risk test and national test:** whether earlier identification leads to better reading later has not been shown for Denmark.

---

## 7. Method and limitations

- **Date of searches:** 5 November 2026. Date range mostly 1990–2026, with the Danish anchor studies from the 1990s included because later work builds on them.
- **Sources and tools:**
  - Crossref REST API for every DOI (title, authors, year, journal, pages); bibliographic queries for each lead and for author searches (e.g. all Crossref records with author "Elbro" since 2005).
  - OpenAlex API for abstracts, open-access locations, country counts (section 3.1) and cited-work analysis (section 3.2).
  - PubMed E-utilities and NCBI PMC (full texts of Poulsen et al. 2023 and the Campbell K–6 review). Europe PMC returned "temporarily unavailable" on the day, and some PubMed searches failed with server errors.
  - NVA (Norway's research archive) for the full text of Pontoppidan et al. 2018.
  - Danish university and publisher sites (nys.dk, arts.au.dk, vive.dk, jite.org), the IEA PIRLS site, INAHTA (SBU summary) and general web search to locate primary records.
- **Leads from the brief:**
  - *Verified and used:* Elbro & Petersen 2004; Arnbak & Elbro 2000; Juul & Sigurðsson 2005; Elbro, Daugaard & Gellert 2012; Gellert & Elbro 2017 (two papers) and 2018; Poulsen, Juul & Elbro 2023; Gellert, Petersen & Elbro 2026; Bleses et al. 2018; Andersen & Nielsen 2016; Andersen, Humlum & Nandrup 2016; Dietrichson et al. 2020, 2021 (Campbell); the Danish Clearinghouse (existence and founding year only); Nationalt Videncenter for Læsning; EVA 2020; the risk test; Solheim et al. 2018 (On Track); Haaland, Rege & Solheim 2024 (Two Teachers); SBU 2014; Seymour et al. 2003; Landerl et al. 2013; Caravolas et al. 2012, 2013.
  - *Not found or not used:* a Danish Clearinghouse review on dyslexia or reading support; a VIVE evaluation specific to LST (the 2014 SFI report, now published by VIVE, is the closest); results of the Danish Letterbox Club and Paired Reading trials; the current legal status of mandatory reading screening in grade 1 (a parliamentary answer mentioning a grade 1 reading screening from 2025/26 could not be opened).
- **Author searches (Crossref):** Elbro (all records since 2005), Beier, Rummens.
- **Read in full:** Pontoppidan et al. 2018; Dietrichson et al. 2021 (results and country sections); Poulsen, Juul & Elbro 2023; Gellert et al. 2024 (Danish version); Gissel 2015; Bleses et al. 2018 (parts); SFI 2014 (summary and design); Arnbak & Petersen 2017 (summary sections); Petersen 2019; EVA 2020 (section on IT aids); PIRLS 2021 exhibit.
- **Not read in full** (bot checks or paywalls; not bypassed): Gissel & Andersen 2021 (bot check at the repository), Svensson et al. 2021 (bot check at DiVA), Solheim et al. 2018, Seymour et al. 2003, Andersen, Humlum & Nandrup 2016, the SBU report itself. Their numbers come from abstracts.
- **Limitations:**
  - One reviewer, no duplicate screening, no formal risk-of-bias rating.
  - OpenAlex counts depend on affiliation matching and English keywords; Danish-language work is undercounted. The country comparison shows relative size, not quality.
  - Danish grey literature was searched more thoroughly than in the first review but not exhaustively; reports by municipalities, university colleges and Ordblindeforeningen were not covered.
  - The phonological points about Danish syllables (section 2.5) are standard descriptions of Danish, not results of reading studies; no phonology textbook was checked for this review.
  - The check of the app's hyphenation output used a handful of words and did not test any speech engine.
  - Keyword searches miss relevant work: the only Danish display study with children (Rummens & Beier 2026) did not match the typography query and was found through an author search. Other Danish studies may have been missed in the same way.
  - Norwegian and Swedish sources were found mainly through English-language channels; Cristin/NVA and DiVA were not searched systematically.

---

## 8. Sources

All DOIs were checked against Crossref on 5 November 2026 (title, authors, year). Years are print years where Crossref gives one.

### 8.1 Danish research, peer-reviewed
- Arnbak, E., & Elbro, C. (2000). The effects of morphological awareness training on the reading and spelling skills of young dyslexics. *Scandinavian Journal of Educational Research*, 44(3), 229–251. https://doi.org/10.1080/00313830050154485 **[abstract]**
- Andersen, S. C., Beuchert, L., Nielsen, H. S., & Thomsen, M. K. (2020). The effect of teacher's aides in the classroom: Evidence from a randomized trial. *Journal of the European Economic Association*, 18(1), 469–505. https://doi.org/10.1093/jeea/jvy048 **[metadata]**
- Andersen, S. C., Humlum, M. K., & Nandrup, A. B. (2016). Increasing instruction time in school does increase learning. *PNAS*, 113(27), 7481–7484. https://doi.org/10.1073/pnas.1516686113 **[abstract]**
- Andersen, S. C., & Nielsen, H. S. (2016). Reading intervention with a growth mindset approach improves children's skills. *PNAS*, 113(43), 12111–12113. https://doi.org/10.1073/pnas.1607946113 (read in full for the first review)
- Bleses, D., Basbøll, H., & Vach, W. (2011). Is Danish difficult to acquire? Evidence from Nordic past-tense studies. *Language and Cognitive Processes*, 26(8), 1193–1231. https://doi.org/10.1080/01690965.2010.515107 **[abstract]**
- Bleses, D., Højen, A., Justice, L. M., Dale, P. S., Dybdal, L., Piasta, S. B., Markussen-Brown, J., et al. (2018). The effectiveness of a large-scale language and preliteracy intervention: The SPELL randomized controlled trial in Denmark. *Child Development*, 89(4), e342–e363. https://doi.org/10.1111/cdev.12859 **[full]** (parts)
- Bleses, D., Vach, W., Slott, M., Wehberg, S., Thomsen, P., Madsen, T. O., & Basbøll, H. (2008). Early vocabulary development in Danish and other languages: A CDI-based comparison. *Journal of Child Language*, 35(3), 619–650. https://doi.org/10.1017/S0305000908008714 **[abstract]**
- Elbro, C., Borstrøm, I., & Petersen, D. K. (1998). Predicting dyslexia from kindergarten: The importance of distinctness of phonological representations of lexical items. *Reading Research Quarterly*, 33(1), 36–60. https://doi.org/10.1598/RRQ.33.1.3 **[abstract]**
- Elbro, C., Daugaard, H. T., & Gellert, A. S. (2012). Dyslexia in a second language? A dynamic test of reading acquisition may provide a fair answer. *Annals of Dyslexia*, 62(3), 172–185. https://doi.org/10.1007/s11881-012-0071-7 **[abstract]**
- Elbro, C., de Jong, P. F., Houter, D., & Nielsen, A.-M. (2012). From spelling pronunciation to lexical access: A second step in word decoding? *Scientific Studies of Reading*, 16(4), 341–359. https://doi.org/10.1080/10888438.2011.568556 **[abstract]**
- Elbro, C., & Petersen, D. K. (2004). Long-term effects of phoneme awareness and letter sound training: An intervention study with children at risk for dyslexia. *Journal of Educational Psychology*, 96(4), 660–670. https://doi.org/10.1037/0022-0663.96.4.660 **[abstract]**
- Elbro, C., Rasmussen, I., & Spelling, B. (1996). Teaching reading to disabled readers with language disorders: A controlled evaluation of synthetic speech feedback. *Scandinavian Journal of Psychology*, 37(2), 140–155. https://doi.org/10.1111/j.1467-9450.1996.tb00647.x **[abstract]**
- Gellert, A. S., Arnbak, E., Wischmann, S., & Elbro, C. (2021). Morphological intervention for students with limited vocabulary knowledge: Short- and long-term transfer effects. *Reading Research Quarterly*, 56(3), 583–601. https://doi.org/10.1002/rrq.325 **[abstract]**
- Gellert, A. S., & Elbro, C. (2017). Does a dynamic test of phonological awareness predict early reading difficulties? *Journal of Learning Disabilities*, 50(3), 227–237. https://doi.org/10.1177/0022219415609185 **[abstract]**
- Gellert, A. S., & Elbro, C. (2017). Try a little bit of teaching: A dynamic assessment of word decoding as a kindergarten predictor of word reading difficulties at the end of Grade 1. *Scientific Studies of Reading*, 21(4), 277–291. https://doi.org/10.1080/10888438.2017.1287187 **[abstract]**
- Gellert, A. S., & Elbro, C. (2018). Predicting reading disabilities using dynamic assessment of decoding before and after the onset of reading instruction: A longitudinal study from kindergarten through grade 2. *Annals of Dyslexia*, 68(2), 126–144. https://doi.org/10.1007/s11881-018-0159-9 **[metadata]**
- Gellert, A. S., Petersen, D. K., Borstrøm, I., Poulsen, M., & Elbro, C. (2024). Tidlig indsats mod ordblindhed – en effektundersøgelse med elever i 1. klasse [Early intervention against dyslexia: an effect study with grade 1 pupils]. *NyS, Nydanske Sprogstudier*, 66, 36–65. https://doi.org/10.7146/nys.v1i66.148749 **[full]**; English abstract: Effects of an intervention for first-grade students at risk for dyslexia, *NyS* 66, 217. https://doi.org/10.7146/nys.v1i66.150496 **[abstract]**
- Gellert, A. S., Petersen, D. K., & Elbro, C. (2026). Predicting response to early reading intervention for children at risk for dyslexia: The importance of pronunciation accuracy. *Annals of Dyslexia*, online ahead of print. https://doi.org/10.1007/s11881-026-00388-9 **[abstract]**
- Gissel, S. T. (2015). Scaffolding students' independent decoding of unfamiliar text with a prototype of an eBook-feature. *Journal of Information Technology Education: Research*, 14, 439–470. https://doi.org/10.28945/2317 **[full]**
- Gissel, S. T., & Andersen, S. C. (2021). A cluster-randomized trial measuring the effects of a digital learning tool supporting decoding and reading for meaning in grade 2. *Journal of Computer Assisted Learning*, 37(2), 287–304. https://doi.org/10.1111/jcal.12488 **[abstract]**
- Juul, H. (2005). Knowledge of context sensitive spellings as a component of spelling competence: Evidence from Danish. *Applied Psycholinguistics*, 26(2), 249–265. https://doi.org/10.1017/S0142716405050162 **[abstract]**
- Juul, H., Poulsen, M., & Elbro, C. (2014). Separating speed from accuracy in beginning reading development. *Journal of Educational Psychology*, 106(4), 1096–1106. https://doi.org/10.1037/a0037100 **[abstract]**
- Juul, H., & Sigurðsson, B. (2005). Orthography as a handicap? A direct comparison of spelling acquisition in Danish and Icelandic. *Scandinavian Journal of Psychology*, 46(3), 263–272. https://doi.org/10.1111/j.1467-9450.2005.00456.x **[abstract]**
- Møller, H. L., Mortensen, J. O., & Elbro, C. (2022). Effects of integrated spelling in phonics instruction for at-risk children in kindergarten. *Reading & Writing Quarterly*, 38(1), 67–82. https://doi.org/10.1080/10573569.2021.1907638 **[abstract]**
- Poulsen, M., Juul, H., & Elbro, C. (2023). A national test of dyslexia. *Annals of Dyslexia*, 73(3), 337–355. https://doi.org/10.1007/s11881-023-00285-5 **[full]**
- Poulsen, M., Nielsen, A.-M. V., Juul, H., & Elbro, C. (2017). Early identification of reading difficulties: A screening strategy that adjusts the sensitivity to the level of prediction accuracy. *Dyslexia*, 23(3), 251–267. https://doi.org/10.1002/dys.1560 **[abstract]**
- Trecca, F., Tylén, K., Højen, A., & Christiansen, M. H. (2021). Danish as a window onto language processing and learning. *Language Learning*, 71(3), 799–833. https://doi.org/10.1111/lang.12450 **[abstract]**

Already in the first review and used here: Elbro & Arnbak 1996 (https://doi.org/10.1007/BF02648177); Gellert 2023 (https://doi.org/10.1044/2022_LSHSS-22-00002).

### 8.2 Danish research, grey literature
- Arnbak, E., & Petersen, D. K. (2017). *Projekt It og Ordblindhed. En undersøgelse af it-støtte til ordblinde elever på mellemtrinnet* [Project IT and dyslexia: a study of IT support for pupils with dyslexia in grades 4–6]. DPU, Aarhus University. https://arts.au.dk/fileadmin/edu/Udgivelser/Rapporter/Projekt_It_og_ordblindhed_slutrapport.pdf **[grey]** [full summary sections]
- Christensen, C. P., Andersen, I. G., Bingley, P., & Sonne-Schmidt, C. S. (2014). *Effekten af it-støtte på elevers læsefærdigheder. Et felteksperiment i Horsens Kommune* [The effect of IT support on pupils' reading skills: a field experiment in Horsens Municipality]. SFI report 14:25. https://www.vive.dk/en/publications/the-effect-of-it-support-on-the-reading-skills-of-pupils-0xg3rgzk/ **[grey]** [summary and design]
- Danmarks Evalueringsinstitut (EVA) (2020). *Undervisning af ordblinde elever i folkeskolen* [Teaching pupils with dyslexia in primary school]. Knowledge memo, with a separate method note. https://uvm.dk/media/2lljpkov/200928-bilag-metodebeskrivelse-for-vidensnotat-om-ordblinde-elever-i-folkeskolen-1.pdf **[grey]** [method note and IT section]
- Elbro, C., Kristensen, N., & Skov, P. (2025). *Long-term effects of phonics approaches to the development of reading skills*. SSRN working paper. https://doi.org/10.2139/ssrn.5204823 **[grey]** [abstract]
- Petersen, D. K. (2019). Oplæsning og ordforslag til ordblinde og begynderlæsere [Text-to-speech and word prediction for pupils with dyslexia and beginning readers]. *Viden om Literacy*, 26, 40–44. Nationalt Videncenter for Læsning. https://www.videnomlaesning.dk/media/2948/26_dorthe-klint-petersen-1.pdf **[grey]** [full]; summarises Petersen, D. K., & Arnbak, E. (2018), *Brug af it i den første læse- og staveundervisning* [Use of IT in early reading and spelling teaching], DPU, Aarhus University (report not read directly).
- Nationalt Videncenter for Læsning, "About us" page. https://videnomlaesning.dk/om-os/ **[grey]**

### 8.3 Nordic research
- Bøg, M., Dietrichson, J., & Isaksson, A. A. (2021). A multi-sensory tutoring program for students at risk of reading difficulties: Evidence from a randomized field experiment. *The Journal of Educational Research*, 114(3), 233–251. https://doi.org/10.1080/00220671.2021.1902254 **[abstract]**
- Dietrichson, J., Bøg, M., Filges, T., & Klint Jørgensen, A.-M. (2017). Academic interventions for elementary and middle school students with low socioeconomic status: A systematic review and meta-analysis. *Review of Educational Research*, 87(2), 243–282. https://doi.org/10.3102/0034654316687036 **[abstract]**
- Dietrichson, J., Filges, T., Klokker, R. H., Viinholt, B. C. A., Bøg, M., & Jensen, U. H. (2020). Targeted school-based interventions for improving reading and mathematics for students with, or at risk of, academic difficulties in Grades 7–12: A systematic review. *Campbell Systematic Reviews*, 16(2), e1081. https://doi.org/10.1002/cl2.1081 **[abstract]**
- Dietrichson, J., Filges, T., Seerup, J. K., Klokker, R. H., Viinholt, B. C. A., Bøg, M., & Eiberg, M. (2021). Targeted school-based interventions for improving reading and mathematics for students with or at risk of academic difficulties in Grades K–6: A systematic review. *Campbell Systematic Reviews*, 17(2), e1152. https://doi.org/10.1002/cl2.1152 **[full]** (results and country sections)
- Furnes, B., & Samuelsson, S. (2010). Predicting reading and spelling difficulties in transparent and opaque orthographies: A comparison between Scandinavian and US/Australian children. *Dyslexia*, 16(2), 119–142. https://doi.org/10.1002/dys.401 **[abstract]**
- Furnes, B., & Samuelsson, S. (2011). Phonological awareness and rapid automatized naming predicting early development in reading and spelling: Results from a cross-linguistic longitudinal study. *Learning and Individual Differences*, 21(1), 85–95. https://doi.org/10.1016/j.lindif.2010.10.005 **[metadata]**
- Haaland, V. F., Rege, M., & Solheim, O. J. (2024). Do students learn more with an additional teacher in the classroom? Evidence from a field experiment. *The Economic Journal*, 134(657), 418–435. https://doi.org/10.1093/ej/uead074 **[abstract]**
- Hjetland, H. N., Brinchmann, E. I., Scherer, R., & Melby-Lervåg, M. (2017). Preschool predictors of later reading comprehension ability: A systematic review. *Campbell Systematic Reviews*, 13(1). https://doi.org/10.4073/csr.2017.14 **[metadata]**
- Lindeblad, E., Nilsson, S., Gustafson, S., & Svensson, I. (2017). Assistive technology as reading interventions for children with reading impairments with a one-year follow-up. *Disability and Rehabilitation: Assistive Technology*, 12(7), 713–724. https://doi.org/10.1080/17483107.2016.1253116 **[abstract]**
- Lundetræ, K., Solheim, O. J., Schwippert, K., & Uppstad, P. H. (2017). Protocol: 'On Track', a group-randomized controlled trial of an early reading intervention. *International Journal of Educational Research*, 86, 87–95. https://doi.org/10.1016/j.ijer.2017.08.011 **[metadata]**
- Lyster, S.-A. H. (2002). The effects of morphological versus phonological awareness training in kindergarten on reading development. *Reading and Writing*, 15(3–4), 261–294. https://doi.org/10.1023/A:1015272516220 **[metadata]**
- Lyster, S.-A. H., Lervåg, A. O., & Hulme, C. (2016). Preschool morphological training produces long-term improvements in reading comprehension. *Reading and Writing*, 29(6), 1269–1288. https://doi.org/10.1007/s11145-016-9636-x **[abstract]**
- Lyytinen, H., Erskine, J., Hämäläinen, J., Torppa, M., & Ronimus, M. (2015). Dyslexia—early identification and prevention: Highlights from the Jyväskylä Longitudinal Study of Dyslexia. *Current Developmental Disorders Reports*, 2(4), 330–338. https://doi.org/10.1007/s40474-015-0067-1 **[metadata]**
- Melby-Lervåg, M., Lyster, S.-A. H., & Hulme, C. (2012). Phonological skills and their role in learning to read: A meta-analytic review. *Psychological Bulletin*, 138(2), 322–352. https://doi.org/10.1037/a0026744 **[metadata]**
- Pontoppidan, M., Keilow, M., Dietrichson, J., Solheim, O. J., Opheim, V., Gustafson, S., & Andersen, S. C. (2018). Randomised controlled trials in Scandinavian educational research. *Educational Research*, 60(3), 311–335. https://doi.org/10.1080/00131881.2018.1493351 **[full]**
- Solheim, O. J., Frijters, J. C., Lundetræ, K., & Uppstad, P. H. (2018). Effectiveness of an early reading intervention in a semi-transparent orthography: A group randomised controlled trial. *Learning and Instruction*, 58, 65–79. https://doi.org/10.1016/j.learninstruc.2018.05.004 **[abstract]**
- Solheim, O. J., Rege, M., & McTigue, E. (2017). Study protocol: "Two Teachers". *International Journal of Educational Research*, 86, 122–130. https://doi.org/10.1016/j.ijer.2017.09.002 **[metadata]**
- Mossige, M., Arendal, E., Kongskov, L., & Svendsen, H. B. (2023). How do technologies meet the needs of the writer with dyslexia? An examination of functions scaffolding the transcription and proofreading in text production aimed towards researchers and practitioners in education. *Dyslexia*, 29(4), 408–425. https://doi.org/10.1002/dys.1752 **[abstract]**
- Mossige, M., Bundgaard Svendsen, H., Almgren Bäck, G., Svensson, I., Dolmer, G., Fälth, L., Berg Gøttsche, N., et al. (2023). Study protocol: Text Performers—Using speech-to-text technology to support students with dyslexia during text production. *Nordic Journal of Literacy Research*, 9(2). https://doi.org/10.23865/njlr.v9.3768 **[abstract]**
- Svensson, I., Nordström, T., Lindeblad, E., Gustafson, S., Björn, M., Sand, C., Almgren/Bäck, G., & Nilsson, S. (2021). Effects of assistive technology for students with reading and writing disabilities. *Disability and Rehabilitation: Assistive Technology*, 16(2), 196–208. https://doi.org/10.1080/17483107.2019.1646821 **[abstract]**
- Wolff, U. (2011). Effects of a randomised reading intervention study: An application of structural equation modelling. *Dyslexia*, 17(4), 295–311. https://doi.org/10.1002/dys.438 **[metadata]**
- Wolff, U. (2016). Effects of a randomized reading intervention study aimed at 9-year-olds: A 5-year follow-up. *Dyslexia*, 22(2), 85–100. https://doi.org/10.1002/dys.1529 **[abstract]**
- SBU (2014). *Dyslexi hos barn och ungdomar – tester och insatser* [Dyslexia in children and adolescents – tests and interventions]. SBU report 225, Swedish Council on Health Technology Assessment. INAHTA record: https://database.inahta.org/article/13339 **[grey]** (agency systematic review) [summary only]
- Nederlandse Zorgautoriteit (2009). *Tijdelijke regeling dyslexie onder/in de DBC geestelijke gezondheidszorg* [Temporary regulation on dyslexia care]. Staatscourant 2009, 13366. https://zoek.officielebekendmakingen.nl/stcrt-2009-13366.html **[grey]** [explanatory notes]
- Department for Education (2012). *Phonics screening check 2012: technical report*. https://assets.publishing.service.gov.uk/media/5a74caeded915d502d6cb0ca/Phonics_screening_check-2012_technical_report.pdf **[grey]** [search result only; not opened]
- Stortinget (2018). Law decision amending the Norwegian Education Act (intensive training in grades 1–4). https://www.stortinget.no/globalassets/pdf/lovvedtak/2017-2018/vedtak-201718-057.pdf **[grey]** [search-result summary only; not opened]

### 8.4 Danish typography research
- Beier, S., Oderkerk, C. A. T., Bay, B., & Larsen, M. (2021). Increased letter spacing and greater letter width improve reading acuity in low vision readers. *Information Design Journal*, 26(1), 73–88. https://doi.org/10.1075/idj.19033.bei **[metadata]**
- Beier, S., & Thiessen, M. (2026). Applying cognitive and perceptual science to typeface choices. *Ergonomics*, 69(9), 1943–1955. https://doi.org/10.1080/00140139.2025.2541255 **[abstract]**
- Oderkerk, C. A. T., & Beier, S. (2022). Fonts of wider letter shapes improve letter recognition in parafovea and periphery. *Ergonomics*, 65(5), 753–761. https://doi.org/10.1080/00140139.2021.1991001 **[metadata]**
- Rummens, K., & Beier, S. (2026; online 2025). Gaze-based word highlighting boosts reading performance: An eye tracking study in second graders. *Ergonomics*, 69(7), 1253–1265. https://doi.org/10.1080/00140139.2025.2514600 **[abstract]**
- Sheppard, S. M., Nobles, S. L., Palma, A., Kajfez, S., Jordan, M., Crowley, K., & Beier, S. (2023). One font doesn't fit all: The influence of digital text personalization on comprehension in child and adolescent readers. *Education Sciences*, 13(9), 864. https://doi.org/10.3390/educsci13090864 **[abstract]**

### 8.5 Cross-linguistic research
- Caravolas, M., Lervåg, A., Mousikou, P., Efrim, C., Litavský, M., Onochie-Quintanilla, E., Salas, N., et al. (2012). Common patterns of prediction of literacy development in different alphabetic orthographies. *Psychological Science*, 23(6), 678–686. https://doi.org/10.1177/0956797611434536 **[abstract]**
- Caravolas, M., Lervåg, A., Defior, S., Seidlová Málková, G., & Hulme, C. (2013). Different patterns, but equivalent predictors, of growth in reading in consistent and inconsistent orthographies. *Psychological Science*, 24(8), 1398–1407. https://doi.org/10.1177/0956797612473122 **[abstract]**
- Landerl, K., Ramus, F., Moll, K., Lyytinen, H., Leppänen, P. H. T., Lohvansuu, K., O'Donovan, M., et al. (2013). Predictors of developmental dyslexia in European orthographies with varying complexity. *Journal of Child Psychology and Psychiatry*, 54(6), 686–694. https://doi.org/10.1111/jcpp.12029 **[abstract]**
- Seymour, P. H. K., Aro, M., & Erskine, J. M. (2003). Foundation literacy acquisition in European orthographies. *British Journal of Psychology*, 94(2), 143–174. https://doi.org/10.1348/000712603321661859 **[abstract]**
- Ziegler, J. C., Bertrand, D., Tóth, D., Csépe, V., Reis, A., Faísca, L., Saine, N., et al. (2010). Orthographic depth and its impact on universal predictors of reading: A cross-language investigation. *Psychological Science*, 21(4), 551–559. https://doi.org/10.1177/0956797610363406 **[abstract]**

### 8.6 International comparisons
- IEA (2023). *PIRLS 2021 International Results in Reading*, Exhibit 2.1 (achievement trends). https://pirls2021.org/results/trends/overall **[full]** (exhibit table)
- National Center for Education Statistics. *Education Indicators: An International Perspective*, Table 7a (IEA Reading Literacy Study 1991, age 9). https://nces.ed.gov/pubs/eiip/eiipid07.asp **[grey]** (secondary source)

### 8.7 Data
- OpenAlex API (https://api.openalex.org), queries in section 3.1, run on 5 November 2026.
