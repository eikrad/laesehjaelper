# Reading support for beginning readers and children with dyslexia: what the research says

*Literature review for Læsehjælper, as of 4 November 2026. Research notes only: nothing here changes the README or the code. Statements marked **Design inference** are suggestions for the app. They are not findings of the studies.*

Evidence levels used throughout:

| Level | Meaning |
|---|---|
| **L1** | Meta-analysis or systematic review (Cochrane/Campbell where available) |
| **L2** | Preregistered or large randomised controlled trial (RCT) |
| **L3** | Smaller RCT |
| **L4** | Quasi-experiment or within-subject lab study (one or a few sessions) |
| **L5** | Correlational work, expert opinion, non-peer-reviewed report |

"Full text" means the relevant parts of the paper were read. "Abstract only" means only the publisher, PubMed, Europe PMC or repository abstract was read. See section 7.

---

## 1. Summary

In plain language, for parents:

- **Læsehjælper is a reading aid, not a treatment.** The best-proven help for dyslexia is still systematic teaching of letters, sounds and how to blend them, given early, often, and ideally one-to-one or in small groups. Typical effects are moderate (about a third of a standard deviation). The app cannot replace this teaching. It can give the child more reading practice in between.
- **Special "dyslexia fonts" do not help.** A 2026 meta-analysis of 15 studies found no effect on speed or accuracy. A plain, clear font the child likes is fine, so Andika as the default is reasonable.
- **Coloured overlays, tinted glasses and flicker lamps do not help beyond placebo.** A background colour is only a matter of comfort.
- **Extra space between letters gives small and inconsistent benefits.** Some studies find fewer reading errors. Many find no change in speed, and the benefit is not specific to dyslexia. If letters are spaced out, the gaps between words must grow too, or reading gets slower. Try it, and keep it only if your child reads better with it.
- **Hearing the text read aloud helps children understand it, but only a little.** Following highlighted words while listening has not been shown to add anything, and listening alone does not teach decoding. It is a support, not reading practice.
- **Reading the same page again after hearing it read is one of the best-supported ways to build fluency.** Much of the gain shows on the page that was practised. Reading plenty of new text works about as well.
- **The evidence for coloured syllables is weak.** They may help some beginners with long words for a short time and do nothing for others. Hyphens inside words slow reading down. Switch the colours off once reading flows.
- **Parents matter most when they listen to the child read and help with specific skills.** This works better than only reading *to* the child. A large Danish trial found that a few books, plus advice to praise effort and not to correct every mistake, improved second graders' reading.
- **Keep reading calm.** Games and pop-ups in digital books do not help children understand stories and can harm understanding. An adult talking about the book helps more.
- **Reading difficulties often come with worry and low confidence.** Encouragement and a sense of progress are worth protecting.

### Existing claims at a glance

| # | Claim (README / code comments) | Verdict | Best evidence |
|---|---|---|---|
| 1a | Extra letter spacing helps many children with dyslexia read faster and more accurately (Zorzi 2012) | **Weakened** | Replications are mixed (L4). Accuracy gains are seen more often than speed gains and are not dyslexia-specific (Hakvoort 2017). Nulls: Łuniewska 2022, Galliussi 2020, van den Boer & Hakvoort 2015. No meta-analysis exists. |
| 1b | …but only if word spacing grows too (Galliussi 2020) | **Holds with caveats** (README overstates) | In Galliussi 2020, letter spacing without wider word spacing slowed reading slightly. Widening both gave *no* gain over default spacing. |
| 2 | Short lines help some readers with dyslexia, especially with weak visual attention; others read better with normal lines (Schneps 2013a, b) | **Holds with caveats** | Two within-subject studies from one lab, with US high-school students (L4). No replication in young children was found. Katzir 2013 (Hebrew 2nd graders) gives indirect support. |
| 3 | Letter shapes make little difference; OpenDyslexic gave no advantage and no child preferred it (Wery & Diliberto 2017; Galliussi 2020) | **Holds (strengthened)** | Meta-analysis by Azzarello et al. 2026 (L1): g = −0.04 [−0.15, 0.07]. Kuster et al. 2018, n = 170. |
| 4a | Coloured syllables help some children at the start and not others (Häikiö 2015; Brügelmann 2025) | **Unclear** | Häikiö 2015 found *no* effect of colouring, so it does not support "help some". Lopes & Barrera found benefits on isolated words (L4). Brügelmann 2025 is not peer-reviewed and argues *against* routine colouring. No RCT and no Danish data. |
| 4b | Hyphens inside words slow reading (Häikiö 2015) | **Holds** | Häikiö 2015 and 2018 (Finnish children), De Simone 2023 (German adults), all L4. |
| 4c | Brügelmann 2025: what kind of publication? | **Non-peer-reviewed** | A 3-page self-archived English report on the peDOCS repository (DIPF), doi:10.25656/01:34472. A longer German version exists (doi:10.25656/01:33973). |
| 5a | Reading aloud helps comprehension; highlighting each word adds nothing (Keelor 2023) | **Holds with caveats** (the highlighting part overstates) | Wood et al. 2018 meta-analysis (L1): d = 0.35. Reading-while-listening gives g = 0.18 overall and ≈0 when self-paced (Clinton-Lisell 2023). The "no added value of highlighting" rests on one small study of comprehension. |
| 5b | Repeated reading, ideally after hearing the text, builds fluency (Lee & Yoon 2017) | **Holds with caveats** | Large effects on practised passages, about half as large on new passages. Non-repetitive practice works about as well (Zimmermann 2021). Fluency training was not significant in an RCT-only meta-analysis (Galuschka 2014). Effects fade (Suggate 2016). |
| 6 | Coloured overlays or backgrounds have no proven effect beyond placebo (Griffiths 2016) | **Holds (strengthened)** | Overview of systematic reviews by Suttle 2018 (L1). Double-masked crossover by Suttle & Conway 2025: "optimal" and placebo tints did equally well. German S3 guideline. |
| 7a | Systematic letter–sound (phonics) work is the best-supported help (Galuschka 2014) | **Holds (strengthened)** | Hall et al. 2023 (53 studies, g = 0.33). Cochrane review by McArthur 2018. A critique by Bowers 2020 concerns phonics *versus other methods*, not phonics versus nothing. |
| 7b | Danish is among the slowest languages for learning to read accurately (Seymour 2003) | **Holds** (abstract-only check) | Seymour 2003 names Danish with French and Portuguese among the slower orthographies, English being slowest. No contradicting later cross-national work was found. |
| 8 | Interactive extras in digital storybooks distract from the story (Takacs 2015) | **Holds (strengthened)** | Furenes 2021 (L1), Bus et al. 2026 (L1): interactive features average ≈0 and mini-games harm comprehension. The book-menu design remains an inference. |
| 9 | Dialogic reading improves expressive vocabulary, d = 0.59 (Mol 2008; cited in `src/together.ts`) | **Holds with caveats** | d = 0.59 applies mostly to 2–3-year-olds and is much smaller at age 4–5. Later meta-analyses find shared-reading effects of g ≈ 0.2 overall and ≈0 against active controls (Noble 2019). |
| + | Larger type helps young readers (Hughes & Wilkins 2000; knowledge-base note) | **Holds with caveats** | 120 UK children; type size and spacing were confounded (L4). Supported by Katzir 2013. O'Brien 2005: dyslexic children need a larger critical print size. |
| + | Red/blue syllable colouring helps weak beginners (Lopes & Barrera 2019; knowledge-base note) | **Holds with caveats (narrow)** | Single-session crossover, isolated words and pseudowords, Brazilian Portuguese, 72 second graders (L4). |
| + | Enlarging font beyond the familiar size lowers accuracy (Liao & Hsiao 2023; knowledge-base note) | **Weak / unclear** | Conference paper. 55 Hong Kong children reading English as a *second* language. p = .047. Should not set defaults. |

---

## 2. Existing claims, one by one

### Claim 1a: Extra letter spacing (Zorzi et al. 2012)

**README:** More space between letters helps many children with dyslexia read faster and more accurately.

**What the source says.** Full text read. 74 children with diagnosed dyslexia took part, aged 8–14 (mean 10.4), 34 Italian and 40 French. Each child read a text twice, two weeks apart, once in normal print (Times, 14 pt) and once with letter spacing widened by 2.5 pt. Word spacing (three space characters) and line spacing (doubled) were also widened in the spaced version. Errors roughly halved. Speed rose by about 0.3 syllables/s when the two first-session groups were compared. A second experiment matched line spacing between conditions and still found the benefit. A comparison with younger, reading-level-matched typical readers suggested that the benefit was larger in the dyslexic group. Level L4: a within-subject manipulation in one sitting per condition, not an intervention.

**What later work found.** No meta-analysis of letter spacing was found (PubMed search on spacing × dyslexia × review returned none). Within-subject studies point both ways:
- *Benefit:* Marinus et al. 2016 found that low-progress English readers (n = 39) read 7 % more words per minute in Dyslexie than in Arial. The advantage disappeared once Arial got the same spacing, so the spacing did the work. Stagg & Kiss 2021 (32 dyslexic adolescents, mean age 13) found extra-large letter spacing raised speed more in the dyslexic group. Sjoblom et al. 2016 found faster reading with large spacing in 24 dyslexic university students. Duranovic et al. 2018 (Bosnian children) found that only spacing, not font, mattered.
- *Accuracy only, not specific to dyslexia:* Hakvoort et al. 2017 tested 30 dyslexic and 30 typical Dutch children (mean age 9;11) plus 189 unselected readers. Wider spacing reduced errors in all groups and did not change speed. The effect appeared only in full sentences, not in word-by-word presentation, which suggests it works between words. Dotan & Katzir 2018 (132 Hebrew first and third graders, isolated words) also found accuracy gains without speed gains, for all first graders and for low-achieving third graders.
- *No benefit:* van den Boer & Hakvoort 2015 (Dutch grades 2 and 4, word naming): spacing tighter than default hurt, wider spacing gave nothing. Łuniewska et al. 2022 (38 dyslexic and 32 typical Polish children, aged 10–14, +2.5 pt): no effect on accuracy, comprehension or speed. Galliussi et al. 2020: no general advantage (see 1b). Korinth et al. 2020 (German adults): wider spacing slowed fast readers.
- *Subgroups:* Joo et al. 2018 (adults with dyslexia) found a benefit from wider letter, word and line spacing only in those with elevated crowding. Schneps et al. 2013a found that extra spacing *slowed* readers with a small visual attention span.

**Verdict: Weakened.** The original finding was a striking single study. Later studies give, at best, a modest accuracy benefit that is not specific to dyslexia, and an inconsistent speed benefit. "Helps many children read faster" goes further than the evidence.

**Suggested README wording:** "More space between letters reduces reading errors for some children, but studies disagree and many find no change in speed (Zorzi et al. 2012; Hakvoort et al. 2017; Łuniewska et al. 2022). Try it and keep it if your child reads better with it."

### Claim 1b: Word spacing must grow too (Galliussi et al. 2020)

**README:** …but only if word spacing grows too. Læsehjælper therefore increases word spacing automatically. Code comment in `src/spacing.ts`: "increasing both together helps (Zorzi et al. 2012)".

**What the source says.** Full text read. 64 Italian children with dyslexia and 64 age-matched controls, mean age 12.4 (middle school), read eight texts aloud. Letterform (standard Verdana-like font vs. a "dyslexia-friendly" font similar to EasyReading), letter spacing (default/increased) and word spacing (default/increased) were crossed. In the dyslexic group, wider letter spacing with default word spacing slowed reading: 3.04 vs. 3.22 syllables/s, d = −0.53. Widening both letter and word spacing gave 3.23 syllables/s, which is **no faster than default spacing**. Accuracy did not change in any condition. The authors say that the spacing increase was smaller than Zorzi's, that a general spacing benefit was not found, and that all spacing effects were too small to matter in practice (≤ 0.20 syllables/s). Level L4.

**What later work found.** Hakvoort et al. 2017 also locate the spacing effect at the level of word gaps. No study was found that tests the exact coupling rule (word spacing + 2 × letter spacing).

**Verdict: Holds with caveats.** The design rule is well supported: never widen letters without widening word gaps. "Only helps if word spacing grows too" suggests that the combination helps, but Galliussi found that it merely did not hurt. The `spacing.ts` comment should not credit Zorzi with showing that "both together helps". Zorzi did widen both, but did not test them separately.

**Suggested README wording:** "Widening letter spacing without widening the gaps between words slows reading (Galliussi et al. 2020), so Læsehjælper widens word spacing automatically."

### Claim 2: Short lines (Schneps et al. 2013a, 2013b)

**README:** Short lines help some readers with dyslexia, especially those with weak visual attention; others read better with normal lines.

**What the sources say.** Full text of both read.
- **2013a** (doi:10.1371/journal.pone.0071161) was an eye-tracking study of 27 US high-school students with dyslexia. Reading on a small device (about 2.2 words or 13 characters per line) instead of a tablet (about 11.6 words per line) raised reading speed by 27 %, cut fixations by 11 % and more than halved regressions, with no loss of comprehension. Extra letter spacing *slowed* students with a small visual attention span.
- **2013b** (doi:10.1371/journal.pone.0075634) compared paper (about 14 words per line) with an iPod showing a few words per line in 103 high-school students with dyslexia. The device helped specific subgroups. Students with poorer decoding or sight-word reading read faster on it, and students with a small visual attention span understood more. The interaction suggests that students with a larger span did relatively better on paper.
- Both studies are L4 and come from one lab. Line length was confounded with device and scrolling. The readers were adolescents at a special school, not beginners.

**What later work found.** No independent replication with children was found (PubMed search on line length × dyslexia/children). Katzir et al. 2013 offers indirect support: among Hebrew-reading second graders (100 children across grades 2 and 5), longer lines and smaller type lowered comprehension, and line spacing had no effect. In fifth graders, line length did not matter.

**Verdict: Holds with caveats.** The wording is fair ("some readers"), but the evidence comes from US teenagers and one lab. It is right to keep short lines optional and off by default, as `src/lines.ts` does.

**Suggested README addition:** "…(Schneps et al. 2013, high-school students; not yet tested with young children)."

### Claim 3: Font (Wery & Diliberto 2017; Galliussi et al. 2020)

**README:** Letter shapes make little difference. OpenDyslexic gave no advantage, and no child preferred it.

**What the sources say.** Wery & Diliberto (full text) used a single-subject alternating-treatment design with 12 US students with dyslexia in grades 3–6. OpenDyslexic gave no gain in letter naming, word or nonword reading over Arial or Times New Roman, and none of the 12 preferred it (L4, n = 12). Galliussi 2020 (above) found no effect of letterform.

**What later work found.**
- **Azzarello et al. 2026, Annals of Dyslexia** (abstract only), a meta-analysis of 15 studies (91 effect sizes, N = 688), found dyslexia-friendly fonts such as OpenDyslexic and Dyslexie had no reliable effect on speed or accuracy: g = −0.04, 95 % CI [−0.15, 0.07]. (L1)
- Kuster et al. 2018 (abstract only) tested 170 Dutch dyslexic children: Dyslexie was not faster or more accurate than Arial, and most children preferred Arial. Preference did not predict performance.
- Marinus et al. 2016 and Duranovic et al. 2018: what helped in Dyslexie was its spacing, not its letter shapes.
- The narrative review by Austin et al. 2026 classes dyslexia fonts as unsupported (L5).

**Verdict: Holds (strengthened).** Cite Azzarello et al. 2026 as the main source.

**Andika, Lexend, Atkinson Hyperlegible.** No peer-reviewed reading study of Andika, Lexend or Atkinson Hyperlegible with children or with readers with dyslexia was found (Europe PMC and Semantic Scholar/OpenAlex searches). Lexend's claims trace back to its designer's own unpublished doctoral work, which could not be checked here. Atkinson Hyperlegible was designed for low vision. **Design inference:** offering these fonts as options is harmless, but the README should not suggest that any of them improves reading.

**Suggested README wording:** "Special 'dyslexia fonts' do not improve reading speed or accuracy (meta-analysis: Azzarello et al. 2026), and children often prefer ordinary fonts (Wery & Diliberto 2017; Kuster et al. 2018)."

### Claim 4a: Coloured syllables (Häikiö et al. 2015; Brügelmann 2025)

**README:** Coloured syllables help some children at the start and not others.

**What the sources say.**
- **Häikiö, Hyönä & Bertram 2015** (abstract only; the knowledge-base note agrees) was an eye-tracking study of Finnish first and second graders reading sentences. Polysyllabic words appeared hyphenated at syllable boundaries, coloured in alternate syllables (black/red), or unmarked. **Colouring did not change reading speed**, whether or not the colours matched syllables. Hyphens slowed reading, and hyphens placed inside a syllable slowed it more. Level L4, typical readers, transparent orthography. This study does **not** support "coloured syllables help some children". It shows they are neutral for speed.
- **Brügelmann 2025** (see 4c; repository abstract only): own study plus other studies. The overall conclusion is *against* consistently marking syllables in colour. Graphic syllable aids should be used selectively: for individual children, only in the transition from sounding out to fluent word reading, and mainly for words of three or more syllables. Digital texts make this kind of adjustment easy. The knowledge-base note states that the author's own study involved 21 dyslexic children in grades 2–3 with mixed effects. That could not be checked because the PDF could not be downloaded.

**What later work found.**
- Lopes & Barrera 2019 (abstract only) ran a crossover with 72 Brazilian second graders (mean age 7.7) reading words and pseudowords. Red/blue syllable highlighting improved reading performance, most for less skilled readers (L4, one session, isolated words).
- De Simone et al. 2023 (abstract only) tracked the eyes of German skilled readers. Colour alternation at syllable or morpheme boundaries did not change eye movements (L4).
- Syllable-based *training*, as opposed to colour display, has RCT support in German. Müller et al. 2017 randomised 75 poor-reading fourth graders to 16 sessions and found a strong effect on word-reading fluency but none on comprehension. Müller, Richter & Karageorgos 2020 ran 24 sessions with second graders against a wait-list and found gains in decoding, word recognition and comprehension (L3). These studies taught syllable segmentation and did not colour text.
- No study of syllable colouring in Danish or English was found.

**Verdict: Unclear.** The claim is plausible and matches Brügelmann's recommendation, but it rests on lab studies and a non-peer-reviewed report, and the cited Häikiö study points the other way.

**Design inference (important):** the app's default is `mode: "farbe"`, which means coloured syllables are **on** by default (`src/app.ts`, defaults). AGENTS.md says that features without clear evidence are optional and off by default. On the current evidence, colouring should be **off by default** or limited to long words (three or more syllables), with an easy switch per profile. Brügelmann's own recommendation points the same way.

**Suggested README wording:** "Coloured syllables made no difference to reading speed in an eye-tracking study (Häikiö et al. 2015). Some weaker beginners read single words more accurately with them (Lopes & Barrera 2019). A review recommends using them only for some children, for long words, and only during the transition to fluent reading (Brügelmann 2025, not peer-reviewed)."

### Claim 4b: Hyphens inside words (Häikiö et al. 2015)

**What the sources say.** Hyphens at syllable boundaries slowed Finnish first and second graders, and hyphens inside a syllable slowed them more (see above). Häikiö & Vainio 2018 (abstract only) found that hyphenation slowed second graders more than first graders. A syllable-incongruent hyphen that fell on a morpheme boundary caused no slowdown. De Simone et al. 2023 found in German adults that hyphens disrupting syllables cost more than hyphens disrupting morphemes.

**Verdict: Holds** (L4, typical readers, Finnish and German). This supports the app's setting for books that print hyphens ("sko-le"), which removes them for display.

### Claim 4c: What kind of publication is Brügelmann 2025?

- **Type:** a self-archived report on **peDOCS**, the open-access repository of DIPF (Leibniz Institute for Research and Information in Education). DataCite lists it as resource type "Book"/misc. OpenAlex lists it as a "submittedVersion" of 3 pages with no journal or publisher. DOI: **10.25656/01:34472**, title *Red and blue is my reading book… Is it really helpful to mark syllables by color in beginner reading books?*
- **German version:** *Farbige Silbengliederung in Texten für Leseanfänger\*innen. Eine zusammenfassende Auswertung erster empirischer Studien*, 11 pages, DOI **10.25656/01:33973**. Same type, same repository.
- **Peer review:** none indicated. Nothing suggests a journal or editorial review. Treat it as expert opinion with an own small study (L5).
- **What was read:** the repository abstracts via DataCite and OpenAlex. The PDF server (pedocs.de, HTTPS) could not be reached from this session, so the full text was **not** read.
- **Suggestion:** cite it in the README by DOI with "(report, not peer-reviewed)".

### Claim 5a: Reading aloud and word highlighting (Keelor et al. 2023)

**README:** Reading aloud helps comprehension; highlighting each word adds nothing extra.

**What the source says** (abstract only). Students aged 8–12 with reading and language difficulties read passages under five conditions: silent reading, reading aloud, listening only, TTS without highlighting, and TTS with highlighting. Both TTS conditions gave higher comprehension than silent reading, and the two TTS conditions did not differ. Children with dyslexia only benefited more than children with combined reading and language impairment. The authors call for more research on highlighting. The sample size is not given in the abstract and was not checked. Level L4.

**What later work found.**
- **Wood et al. 2018** (PMC author manuscript, partly read) meta-analysed 22 studies of grade 3 and above. TTS and read-aloud tools improved reading comprehension in students with reading difficulties: d = 0.35, 95 % CI [0.14, 0.56]. Trim-and-fill correction lowered this to 0.24 [0.02, 0.45]. Between-subject studies gave 0.61, within-subject studies 0.15 (not significant). (L1)
- **Clinton-Lisell 2022, Review of Educational Research** (abstract only; 46 studies, N = 4,687) found reading and listening comprehension do not differ overall (g = 0.07).
- **Clinton-Lisell 2023, Educational Research: Theory and Practice** (ERIC abstract; 30 studies, N = 1,945) found that reading while listening beats reading alone only slightly (g = 0.18). The benefit appeared only when the experimenter set the pace (g = 0.41). When readers set their own pace there was no reliable effect (g = 0.06, 95 % CI [−0.07, 0.19]). There were too few studies to say much about struggling readers.
- Lopukhina et al. 2026 was an RCT with 127 British children in Years 2–3. About 66 hours of same-language subtitles over 6 weeks did not improve reading fluency (L3). Passive exposure to print alongside sound is not enough to teach reading.
- Gerbier, Bailly & Bosse 2018 studied karaoke-style synchronisation in reading while listening. The DOI resolves, but no abstract or full text was accessible, so it is not used here.

**Verdict: Holds with caveats.** "Reading aloud helps comprehension" is supported by a meta-analysis, with a modest effect. "Highlighting each word adds nothing" rests on one small study of comprehension only. No study was found showing that highlighting helps either, so "has not been shown to add anything" is the accurate wording.

**Suggested README wording:** "Listening to the text helps children understand it, though the effect is modest (Wood et al. 2018). Highlighting each word did not add to comprehension in a small study (Keelor et al. 2023). Listening supports understanding but does not replace the child's own reading."

### Claim 5b: Repeated reading (Lee & Yoon 2017)

**README / `src/readflow.ts`:** Reading the same text several times, ideally after hearing it, makes reading more fluent.

**What the source says** (abstract only, plus the ASHA Evidence Map summary, a secondary source). This was a systematic review and meta-analysis of 34 studies from 1990–2014 (39 effect sizes) on students with reading disabilities in grades K–12. Repeated reading improved correct words per minute, with a larger effect at elementary level, and combining it with a listening passage preview worked best. According to the ASHA summary: overall g = 1.41; elementary g = 1.63 vs. secondary 0.86; with listening preview 1.95 vs. 0.94 without; practised passages 1.94 vs. new (transfer) passages 0.97. The authors flag small samples and possible publication bias. Level L1, but the effects are inflated by small studies and by measuring progress on practised text.

**What later work found.**
- Stevens, Walker & Vaughn 2017 (abstract only): 19 studies of K–5 students with learning disabilities. Repeated reading remained the most effective fluency method. A fluent model, feedback and easier texts helped, and assisted reading with audiobooks also worked. Only three studies used a group design.
- Hudson et al. 2020 (abstract only): 16 studies, 2000–2019. Most interventions used repeated reading. Effect sizes ranged from 0.01 to 1.18. One-to-one sessions with a trained model of fluent reading worked best.
- **Zimmermann, Reed & Aloe 2021** (abstract only): 8 studies. Non-repetitive fluency practice (reading more new text) gave d = 0.18, and in head-to-head studies it was about as effective as repeated reading.
- Maki & Hammerschmidt-Snidarich 2022 (abstract only): 33 studies, K–12. Fluency interventions had moderate effects (0.46 [0.23, 0.68]; group designs 0.41), and more practice time gave more growth.
- Galuschka et al. 2014 (full text), using RCTs only: five fluency-training comparisons, g' = 0.30 [−0.11, 0.71], not significant.
- Suggate 2016 (abstract only): 71 intervention–control comparisons. Effects shrank from 0.37 at posttest to 0.22 at follow-up, and phonics and fluency gains held up less well than comprehension gains.

**Verdict: Holds with caveats.** Repeated reading after a model is well supported for fluency on the practised text and moderately supported for new text. It is not uniquely effective: reading more new text works too. The "your turn" feature fits the evidence.

**Design inference:** keep "your turn". Consider also encouraging the child to read the *next* page alone after the model (non-repetitive practice). Avoid presenting gains on the re-read page as proof of general progress.

### Claim 6: Coloured overlays and backgrounds (Griffiths et al. 2016)

**What the source says** (abstract only). This systematic review covered 51 publications (54 data sets) graded with the Cochrane risk-of-bias tool. Most studies were at high or unclear risk of bias, and the better studies supported overlays less. Effects were small or similar to placebo. The authors conclude that overlays and lenses cannot be endorsed. (L1)

**What later work found.**
- Suttle, Lawrenson & Conway 2018 (abstract only) is a preregistered overview of four systematic reviews (PROSPERO CRD42017059172). Three of the four found insufficient evidence, and on balance there is no reliable basis for recommending overlays. (L1)
- Suttle, Barbur & Conway 2017 (abstract only): when 21 people with "visual stress" chose an overlay twice, about 25 days apart, 11 chose a completely different colour.
- Suttle & Conway 2025 (abstract only) was a double-masked randomised crossover with 29 participants aged 11–72. Reading speed and comfort were better with *any* tint than without, but the precisely chosen tint was no better than a deliberately sub-optimal placebo tint. (L3)
- Galuschka et al. 2014: four overlay or lens comparisons, not significant. The German S3 guideline (Galuschka & Schulte-Körne 2016) recommends, at grade A, against Irlen lenses. Stagg & Kiss 2021 found no effect of overlays on speed or errors in 59 adolescents.

**Verdict: Holds (strengthened).** The README's phrasing ("purely a matter of comfort") is right.

### Claim 7a: Phonics is the best-supported help (Galuschka et al. 2014)

**What the source says** (full text). A meta-analysis of 22 RCTs with 49 comparisons in children and adolescents with reading disabilities. Phonics instruction (29 comparisons) was the only approach with a statistically confirmed effect: g' = 0.32, 95 % CI [0.18, 0.47], I² = 0 %. Fluency training, phonemic awareness training, comprehension training, auditory training, medical treatments and coloured overlays did not reach significance. Included studies came from English-speaking countries, Finland, Italy, Spain and Brazil, but could not be analysed by language. A 2014 correction fixed only a typo in the effect-size formula. (L1)

**What later work found.**
- **Hall et al. 2023, Reading Research Quarterly** (PMC, partly read): 53 experimental or quasi-experimental studies from 1980–2020 with N = 6,053 K–5 students with or at risk for dyslexia. Effect on norm-referenced reading outcomes: g = 0.33 [0.25, 0.41]. In K–2 the effect was 0.36, in grades 3–5 0.16 (not significant). More hours gave larger effects. Approaches labelled "multisensory" did no better. (L1)
- **McArthur et al. 2018, Cochrane** (abstract only): 14 RCTs or quasi-RCTs with 923 English-speaking poor readers. Phonics training improved regular-word reading accuracy (SMD 0.51 [0.13, 0.90], low-quality evidence), irregular-word accuracy, and word and nonword fluency (SMD 0.39–0.84, low to moderate quality). The effect on comprehension was small and uncertain (0.28 [−0.07, 0.62]). (L1)
- Galuschka & Schulte-Körne 2016, the German S3 guideline (abstract only): systematic letter–sound instruction combined with syllable and morpheme synthesis and analysis (g' = 0.32) is a grade-A recommendation, and so is spelling-rule training. Irlen lenses, visual or auditory perceptual training, hemispheric stimulation, piracetam and prism spectacles should not be used (grade A).
- Galuschka et al. 2020 (abstract only), on spelling: 34 controlled trials. Phonics, orthographic-rule and morphological instruction had moderate to large effects on spelling. Memorisation strategies did not.
- Bowers 2020 (abstract of the preprint): a critique arguing that meta-analyses overstate the advantage of *systematic phonics over other structured methods*. It does not claim that phonics instruction is ineffective.

**Verdict: Holds (strengthened).** Precise wording would add that effects are moderate, larger in the early grades, and depend on dosage.

### Claim 7b: Danish learns slowly (Seymour et al. 2003)

**What the source says** (abstract only). Children learning to read in 13 European orthographies (English and 12 others) were assessed on letter knowledge, familiar-word reading and simple nonword reading in the early (foundation) phase. Most reached accurate, fluent foundation-level reading within the first year. The exceptions were French, Portuguese, Danish and especially English, where development was more than twice as slow as in shallow orthographies. The authors attribute this to syllable complexity and orthographic depth, not to school starting age or letter knowledge. (L4/L5: cross-sectional comparison.)

**What later work found.** No later cross-national study was found that re-ranks Danish. Danish work since then has focused on early identification, dynamic assessment and a national dyslexia test (Poulsen, Juul & Elbro 2023; Gellert & Elbro 2017, 2018) and on early-intervention trials (Gellert, Petersen & Elbro 2026; 101 at-risk Danish first graders, 76 sessions), not on re-ranking orthographies.

**Verdict: Holds.** The full paper was not read, so sample sizes per language were not checked.

### Claim 8: Interactive extras distract (Takacs, Swart & Bus 2015)

**What the source says** (full text, partly read). A meta-analysis of 43 studies with 2,147 young children compared technology-enhanced stories with traditional storybook reading. There was a small benefit for story comprehension (g+ = 0.17) and expressive vocabulary (g+ = 0.20). Multimedia features (animated pictures, music, sound) helped. Interactive elements (hotspots, games, dictionaries) distracted, especially for disadvantaged children. (L1)

**What later work found.**
- **Furenes, Kucirkova & Bus 2021** (abstract only): 39 studies, 1,812 children aged 1–8. Digitising a book with nothing added lowered comprehension compared with paper. Story-congruent enhancements made digital books better than paper. An adult reading a print book with the child helped more than digital enhancements used alone. Built-in dictionaries did not help comprehension, or harmed it, but helped vocabulary. (L1)
- **Bus, Kucirkova, Ten Braak & Ciesielska 2026** (abstract only): 20 articles, 1,978 children aged 2–8. On average, interactive features had about zero effect on story comprehension. Mini-games harmed comprehension. Hotspots and embedded questions did not help, probably because they interrupt the story. Actions that mirror what the protagonist does helped. (L1)
- Delgado et al. 2018 (abstract only; 54 studies, 171,055 participants, not limited to children) found paper better than screens for comprehension (g = −0.21), but not for purely narrative texts, with a larger gap under time pressure. Clinton 2019 (abstract only; 33 studies) found a similar pattern: g = −0.25 overall, −0.32 for expository texts, −0.04 for narrative.

**Verdict: Holds (strengthened).** The menu design is, as the README already says, an inference. The 2026 finding that embedded *questions* do not help applies to questions the device puts to the child mid-story. It does not apply to an adult's conversation (see claim 9), but it is a reason to keep the "Read together" prompts addressed to the adult and out of the child's way.

### Claim 9: Dialogic reading, d = 0.59 (Mol et al. 2008; `src/together.ts`)

**What the source says** (abstract only). This meta-analysis compared dialogic reading with ordinary shared reading in 16 studies. For expressive vocabulary (k = 9, n = 322) the effect was d = 0.59 (SE 0.08; 95 % CI 0.44–0.75). The effect was **much smaller for 4- to 5-year-olds and for children at risk** for language and literacy problems. (L1, small total n.)

**What later work found.**
- **Noble et al. 2019** (abstract only): shared-reading interventions improve language with g ≈ 0.22, less than earlier meta-analyses suggested, and ≈ 0.02 against active control groups. The use of dialogic techniques did not moderate the effect. (L1)
- Dowdall et al. 2020 (abstract only): 19 RCTs, N = 2,594, ages 1–6. Training parents in book sharing improved expressive language (d = 0.41) and receptive language (d = 0.26), with low doses having minimal effect. (L1)
- Pillinger & Vardy 2022 (abstract only): 46 studies. Dialogic reading helps under-5s, but evidence for older children is thin and methods are weak. (L1, narrative)
- Bleses et al. 2018, the SPELL trial in Denmark (abstract only): 6,483 children aged 3–6 in 144 childcare centres. The storybook-based programme improved preliteracy (d = 0.21–0.27) but not language (d = 0.04–0.16). (L2)

**Verdict: Holds with caveats.** The number is quoted correctly, but it applies to toddlers and 2- to 3-year-olds, not to the 5- to 8-year-old beginning readers who use the app. Keeping "Read together" off by default fits the evidence.

**Suggested wording (code comment / README):** "Dialogic reading improves young children's expressive vocabulary (Mol et al. 2008, d = 0.59, mainly 2–3-year-olds; smaller at 4–5). Later meta-analyses find smaller effects of shared reading overall (Noble et al. 2019; Dowdall et al. 2020)."

### Extra sources from the knowledge base

**Hughes & Wilkins 2000, J Research in Reading** (abstract only). 120 children read passages typeset like four stages of two UK reading schemes. Text size and spacing shrink across the stages. Children aged 5–7 read more slowly as the text got smaller and were fastest with the typography meant for 5- to 6-year-olds. Children aged 8–11 were unaffected. All ages made more errors on smaller text. Size and spacing were confounded (L4). Further support: Katzir et al. 2013 (smaller type lowered comprehension in Hebrew second graders, though it raised it in fifth graders) and O'Brien, Mansfield & Legge 2005 (abstract only; dyslexic children aged 7–10 needed a larger critical print size to reach maximum reading speed). **Verdict: holds with caveats.** A generous default size for beginners is reasonable, and the size slider is justified.

**Lopes & Barrera 2019, Estudos de Psicologia (Natal) 24(4)**, doi:10.22491/1678-4669.20190035 (abstract only). Note that the knowledge-base note links to the underlying master's thesis, not to the article. 72 Brazilian second graders read words and pseudowords with and without red/blue syllable highlighting in a crossover design. Highlighting improved performance, especially for weaker readers, and the effect grew with repetition. **Verdict: holds with caveats (narrow).** The study used one session, isolated words and a fairly transparent orthography, and did not measure running text or learning over time.

**Liao & Hsiao 2023, Proceedings of CogSci 45** (full text). eScholarship marks it as peer-reviewed. 55 Hong Kong first and second graders (aged 6–8) reading English as a **second language** were eye-tracked reading words and sentences in 18 pt (the familiar textbook size) and in a 31 % larger size. Word pronunciation accuracy was lower in the larger size (F(1,53) = 4.18, p = .047), and gaze transitions between words were less consistent. **Verdict: weak / unclear.** It is a conference paper with a single, marginal effect in L2 readers, and it does not transfer to native Danish or German beginners. The knowledge-base note omits that the children were L2 readers. It is at most a reason not to make very large type the *default*.

**Corrections to the knowledge-base notes:**
- (a) `Spacing-Galliussi2020` says dyslexic children "read faster when both letter and word spacing were increased". That holds only against increased letter spacing with default word spacing. Against default spacing there was no gain (3.23 vs. 3.22 syllables/s).
- (b) `SyllableHighlight-Lopes2019`: the article DOI is 10.22491/1678-4669.20190035.
- (c) `FontSize-Liao2023`: the participants were second-language readers of English.
- (d) The concept note's summary ("spacing, short lines, read-aloud and repeated reading have the best support") overstates spacing and short lines.

---

## 3. New, well-proven findings (ranked by strength of evidence)

### 3.1 Structured, explicit decoding instruction is the core treatment (L1, several meta-analyses and a Cochrane review)

- Hall et al. 2023: g = 0.33 [0.25, 0.41], 53 studies, N = 6,053, K–5 with or at risk for dyslexia, mostly English. Larger in K–2 (0.36) and with more hours. "Multisensory" labels added nothing.
- McArthur et al. 2018 (Cochrane): word-reading accuracy and fluency gains of about 0.4–0.8 SMD, low to moderate certainty, English.
- Galuschka et al. 2014: phonics g' = 0.32, the only approach confirmed in RCTs. The German S3 guideline turns this into a grade-A recommendation that also covers syllable and morpheme work.
- Galuschka et al. 2020: phonics, orthographic-rule and morphological instruction help spelling.
- Dissent: Bowers 2020 argues that the advantage over *other structured methods* is overstated.

**What it could mean for Læsehjælper (design inference):** no change to the app's scope. The README should keep saying that the app does not replace this teaching. The tap-a-word sequence (whole → slow syllables → whole) is consistent with decoding support, but it has not itself been tested. Adding a short "what helps" note for parents that points to structured teaching would be low-cost.

### 3.2 Dyslexia fonts do not work (L1)

Azzarello et al. 2026: 15 studies, N = 688, g = −0.04 [−0.15, 0.07]. **Design inference:** keep Andika as the default and keep OpenDyslexic as an option for children who like it. Do not describe any font as helping reading.

### 3.3 Read-aloud tools help comprehension modestly; listening does not teach decoding (L1, plus one RCT)

Wood et al. 2018: d = 0.35 (grade 3 and above). Clinton-Lisell 2022: listening ≈ reading for comprehension. Clinton-Lisell 2023: reading while listening adds g = 0.18 overall and ≈ 0 when self-paced. Lopukhina et al. 2026 RCT: subtitles did not improve fluency.

**Design inference:** keep "read the page aloud" as an access and comprehension aid. Keep word highlighting optional rather than presenting it as a learning feature. The "your turn" step, where the child reads, is what turns listening into practice, so keep it on by default.

### 3.4 Fluency practice works; the practised text shows the biggest gains (L1, several reviews)

The reviews are Lee & Yoon 2017, Stevens et al. 2017, Hudson et al. 2020, Zimmermann et al. 2021, Maki & Hammerschmidt-Snidarich 2022 and Suggate 2016 (see claim 5b). Gains are about twice as large on practised passages as on new ones. Non-repetitive wide reading is about as effective. More practice time helps, and effects fade without continued practice.

**Design inference:** after "your turn", an optional "now try the next page yourself" would add non-repetitive practice. Any progress display should measure reading on *new* pages, not only on re-read ones.

### 3.5 Parent involvement: tutoring and listening beat being read to (L1, plus a large Danish RCT)

- Sénéchal & Young 2008 (abstract only): 16 studies, 1,340 families, kindergarten to grade 3. Parent involvement improved reading acquisition. Parents tutoring specific literacy skills had larger effects than parents listening to their child read. In the three studies where parents only read *to* their children, there were no significant reading gains. (L1)
- **Andersen & Nielsen 2016, PNAS** (full text, partly read): a classroom-randomised trial in Aarhus with 72 classrooms and 1,587 Danish second graders. Parents received a few books and advice: reading ability can grow; talk about the content and ask open questions; do not correct mistakes unless they affect understanding; praise effort, not performance. Reading improved by about 2 months' worth of progress after 2 months and about 1 month after 7 months (roughly 0.1 SD at 7 months). The gain was about 0.3 SD for children whose parents had believed reading ability to be fixed, and at least as large for immigrant children and children of less-educated mothers. (L2)
- Fikrat-Wevers et al. 2021 (abstract only): family literacy programmes for low-SES children aged 0–6 have d = 0.50 immediately but only 0.16 at follow-up. (L1)

**Design inference:** Læsehjælper already puts an adult next to the child. A short, optional parent guide fits the evidence: listen while your child reads, help with the hard word, praise effort, do not correct every slip, talk about the story. It could be shown once, or sit in the adult menu. Keeping reading by the child (not only *to* the child) at the centre is well supported.

### 3.6 Technology helps only a little, and works best with an adult involved (L1)

- McTigue et al. 2020: 28 GraphoGame studies; the meta-analysis of 19 found no effect on word reading (g = −0.02). Studies with high adult interaction showed g = 0.48.
- Neitzel et al. 2022: 65 rigorous studies of 51 programmes for struggling readers. One-to-one tutoring had clear positive effects. Technology-supported adaptive instruction had no significant positive outcomes.
- Cheung & Slavin 2013: 20 studies, about 7,000 students; educational technology ES = 0.14.
- Verhoeven, Voeten & Segers 2022: 67 studies, N = 10,734; computer-assisted word-reading interventions ES = 0.36, with transfer to comprehension of 0.21, but smaller against active controls.
- Glatz et al. 2023: a cluster RCT with 247 Dutch-speaking first graders (Netherlands and Flanders). A literacy game improved letter knowledge and gave a small fluency benefit. (L2/L3)

**Design inference:** no gamification for its own sake. Design for an adult and child reading together, which the app already does.

### 3.7 Digital storybooks: plain digitisation and interactive extras do not help comprehension (L1)

See claim 8: Furenes et al. 2021 and Bus et al. 2026. **Design inference:** keep the calm reading screen. Avoid adding games, hotspots or reward animations to the reading view. Any future "story" features should follow the story itself, as with the protagonist-aligned actions that helped in Bus et al. 2026.

### 3.8 Morphological instruction helps struggling readers (L1)

- Goodwin & Ahn 2010: 17 studies of children with literacy difficulties; overall d = 0.33.
- Goodwin & Ahn 2013: 30 studies in English; d = 0.32 overall and 0.59 for decoding, with no effect on fluency or comprehension.
- Bowers, Kirby & Deacon 2010: 22 studies; morphological instruction especially benefits less able readers and works best combined with other literacy instruction.
- Galuschka et al. 2020: morphological instruction helps spelling.
- Danish background: Elbro & Arnbak 1996, from a Danish research group, found that dyslexic adolescents use root-morpheme recognition as a compensatory reading strategy (L4).

**Design inference:** this supports the *idea* behind the Danish word-part display (sommer|fugl|ene). The studies, however, tested **teaching**, not visual marking, so the display itself is unproven. Keep it optional. Adding German word parts later would be consistent with the same evidence.

### 3.9 Reading difficulties, motivation and wellbeing are linked (L1)

- Toste et al. 2020: 132 articles. Motivation and reading achievement correlate at r = .22, and earlier reading predicts later motivation more strongly than the reverse.
- Francis et al. 2019: 34 studies, 16,275 participants. Poor readers show more internalising problems (d = 0.41) and more anxiety (d = 0.41).
- Donolato et al. 2022: children with language and learning disorders show more internalising problems (g = 0.36).
- Unrau et al. 2018: 30 studies. Interventions can raise reading self-efficacy (g = 0.24 [0.10, 0.39], treatment vs. control).

**Design inference:** avoid scores, timers and error counts in the child's view. Successful reading is the best motivator, which supports the model-then-"your turn" flow and books at a manageable level. An adult-only progress view, if one is ever added, should show effort and pages read.

---

## 4. Promising but not yet proven

*These findings are interesting but rest on lab studies, small samples, single labs or non-peer-reviewed work. They justify optional settings, not defaults or claims.*

- **Spacing for a subgroup.** Extra letter, word and line spacing helped adults with dyslexia who had elevated crowding (Joo et al. 2018, L4). Choosing personalised display and voice settings in a web app helped 78 primary and middle-school students more than standard settings did (Lorusso et al. 2024, L4). Hebrew second graders understood more with 150 % letter spacing, but third graders did not, and most children preferred standard spacing (Dotan & Katzir 2025, L4). *Design inference:* this supports per-profile settings, which the app already has.
- **Short lines** (Schneps 2013a, b; Katzir 2013). See claim 2.
- **Syllable colouring for the weakest beginners, long words only** (Lopes & Barrera 2019; Brügelmann 2025). See claim 4a.
- **Word-part display for Danish.** The rationale comes from morphology teaching (3.8) and eye-movement data: hyphens at morpheme boundaries did not slow Finnish children (Häikiö & Vainio 2018). No study of *displaying* morpheme boundaries to Danish children was found.
- **Larger type for beginners and dyslexic readers** (Hughes & Wilkins 2000; Katzir et al. 2013; O'Brien et al. 2005). Liao & Hsiao 2023 is a weak counter-signal.
- **Gaze-adaptive read-aloud**, where the voice waits for the reader's eyes, raised comprehension in 20 children with dyslexia aged 8–10 (Schiavo et al. 2021, L4). It needs eye tracking and is not relevant now.
- **Word highlighting during read-aloud.** It has not been shown to help comprehension (Keelor 2023) and has not been shown to harm. Its effect on attention to print and word learning in beginners is untested in any study checked here.
- **Action video games** (contested). Small RCTs from one research network report reading gains: Franceschini et al. 2013, and Peters et al. 2021 (64 children, 5 hours of play). An independent trial with 54 Polish children found that action and phonological games did no better than no training (Łuniewska et al. 2018), and a 2026 review classes the approach as not established (Austin et al. 2026). Not relevant to the app.
- **Dialogic reading with school-age beginners.** It is well supported for toddlers. For 5- to 8-year-olds the evidence is thin (Mol 2008; Pillinger & Vardy 2022). One RCT with 364 Chinese kindergarteners found that parental prompts with corrective feedback (PEER) beat prompts alone (Dong et al. 2024, L3).

---

## 5. Myths: widely claimed, shown not to work

| Claim | Evidence against | Level |
|---|---|---|
| "Dyslexia fonts" (OpenDyslexic, Dyslexie) improve reading | Azzarello et al. 2026 meta-analysis, g = −0.04. Kuster et al. 2018: n = 170, no benefit, children preferred Arial. Marinus et al. 2016: any benefit came from spacing. | L1 |
| Coloured overlays, tinted or "precision" lenses (Irlen) treat dyslexia or visual stress | Griffiths 2016; Suttle 2018 overview; Suttle & Conway 2025 double-masked RCT (precision tint = placebo tint); Suttle 2017 (chosen colour not repeatable); German S3 guideline advises against them | L1/L3 |
| Flickering lamps or glasses (Lexilight, Lexilens) help dyslexic readers | Lubineau et al. 2023: low-frequency flicker slowed 375 adult readers, had no effect in 20 dyslexic children, and the commercial lamp and glasses had no detectable effect in 22 dyslexic children | L4 |
| "Bionic Reading" (bold word beginnings) speeds reading | Snell 2024: no difference. Spear et al. 2025: costs relative to normal text. Beelders 2025, Zhang et al. 2026: no benefit. All in adults; no child studies. | L4 |
| Dyslexia is a vision problem; vision therapy, eye-movement exercises or prism glasses treat it | Joint statement of the American Academy of Pediatrics and ophthalmology societies (Handler & Fierson 2011). German S3 guideline (grade A against visual perceptual training and prism spectacles). Austin et al. 2026. | L5 / guideline |
| Action video games are a treatment for dyslexia | Independent replication failed (Łuniewska et al. 2018); not established (Austin et al. 2026) | L3 |
| Interactive e-book extras (hotspots, games) support understanding | Takacs 2015; Furenes 2021; Bus et al. 2026: ≈0 on average, games harmful | L1 |
| Watching subtitled TV teaches children to read | Lopukhina et al. 2026 RCT: no fluency gain after about 66 hours | L3 |
| The "multisensory" element is what makes Orton–Gillingham-type programmes work | Hall et al. 2023: programmes labelled multisensory did no better. Austin et al. 2026. | L1 |
| Lexend "improves reading proficiency" | No peer-reviewed independent test found; claims trace to the designer's unpublished dissertation (not checked) | — |

---

## 6. Method

- **Date range:** mainly 2015 to November 2026, with most weight on 2021–2026. Older anchor papers were included where the README cites them or where they remain the main synthesis (Mol 2008, Sénéchal & Young 2008, Goodwin & Ahn 2010, Bowers et al. 2010).
- **Databases and tools:**
  - Europe PMC REST API (includes PubMed/MEDLINE and PMC full texts) and PubMed E-utilities.
  - Crossref API, used to verify every DOI's title, authors and year.
  - OpenAlex.
  - DataCite and doi.org handle resolution, for the peDOCS DOIs.
  - Semantic Scholar, OpenAlex and arXiv through a paper-search tool.
  - The ERIC API.
  - General web search, used only to locate primary records.
  - Publisher and PMC pages for full texts.
- **Example search strings (PubMed / Europe PMC):**
  - `("letter spacing" OR "inter-letter spacing") AND (dyslexi* OR child*)`
  - `("line length" OR "short lines" OR "words per line") AND (dyslexi* OR child*)`
  - `syllab* AND (colour* OR color* OR highlight* OR hyphen*) AND read* AND (child* OR dyslex*)`
  - `("text-to-speech" OR "read-aloud") AND "reading comprehension" AND (meta-analysis OR "systematic review")`
  - `fluency AND ("repeated reading" OR "fluency intervention*") AND (meta-analysis OR synthesis)`
  - `"bionic reading"`
  - `"action video game*" AND (dyslexi* OR reading)`
  - `(overlay* OR "tinted lens*" OR Irlen) AND reading`
  - Author searches for Elbro, Gellert and Arnbak (Danish work)
  - Title searches for each named lead.
- **Verification:** every DOI listed in section 7 was resolved through Crossref (or DataCite for peDOCS), and its title, first authors and year were checked against what is cited. The two peDOCS DOIs were checked through doi.org and DataCite.
- **Leads from the brief that were checked and kept:** Marinus et al. on Dyslexie and spacing; O'Brien et al. on print size; Wood et al. 2018; Stevens et al. 2017; Hudson et al. 2020; McArthur et al. 2018; Goodwin & Ahn; Delgado et al. 2018; Furenes, Kucirkova & Bus 2021; McTigue et al. 2020; Sénéchal & Young 2008; Noble et al. 2019; action video games; Elbro and colleagues.
- **Leads not found in primary sources:** no meta-analysis of letter spacing; no peer-reviewed evaluation of Lexend or Atkinson Hyperlegible for reading; no study of syllable colouring or morpheme display in Danish.
- **Limitations:**
  - One reviewer, no formal risk-of-bias rating beyond what the reviews themselves report, and no duplicate screening.
  - Many papers are paywalled and were read as **abstract only**, so their effect sizes and samples are as stated in abstracts. Lee & Yoon's numbers come partly from the ASHA Evidence Map summary, a secondary source.
  - The peDOCS server could not be reached, so Brügelmann 2025 was assessed from repository metadata and abstracts only.
  - Crossref and OpenAlex rate limits slowed some lookups. No verification was skipped because of this; sources that could not be verified were left out or marked.
  - Danish- and German-language grey literature (e.g. Nationalt Videncenter for Læsning reports, German *Lesedidaktik* journals) was searched only lightly. Relevant local studies may be missing.
  - Most evidence is from English, with some Italian, Dutch, German, Finnish, Hebrew and Polish. Effects in Danish, a deep orthography, may differ.
  - Most typography studies are single-session lab manipulations. They show what happens on the day, not whether a setting helps children learn to read over months.

---

## 7. Sources

Marks: **[full]** = relevant parts of the full text read; **[abstract]** = abstract only; **[metadata]** = bibliographic record only (no abstract or full text accessible); **[secondary]** = numbers taken from a secondary summary in addition to the abstract. All DOIs resolve as of 4 November 2026.

### Sources the README or code already cites
- Zorzi, M., Barbiero, C., Facoetti, A., et al. (2012). Extra-large letter spacing improves reading in dyslexia. *PNAS*, 109, 11455–11459. https://doi.org/10.1073/pnas.1205566109 **[full]**
- Galliussi, J., Perondi, L., Chia, G., Gerbino, W., & Bernardis, P. (2020). Inter-letter spacing, inter-word spacing, and font with dyslexia-friendly features. *Annals of Dyslexia*, 70, 141–152. https://doi.org/10.1007/s11881-020-00194-x **[full]**
- Schneps, M. H., Thomson, J. M., Sonnert, G., et al. (2013a). Shorter lines facilitate reading in those who struggle. *PLOS ONE*, 8, e71161. https://doi.org/10.1371/journal.pone.0071161 **[full]**
- Schneps, M. H., Thomson, J. M., Chen, C., Sonnert, G., & Pomplun, M. (2013b). E-readers are more effective than paper for some with dyslexia. *PLOS ONE*, 8, e75634. https://doi.org/10.1371/journal.pone.0075634 **[full]**
- Wery, J. J., & Diliberto, J. A. (2017). The effect of a specialized dyslexia font, OpenDyslexic, on reading rate and accuracy. *Annals of Dyslexia*, 67, 114–127. https://doi.org/10.1007/s11881-016-0127-1 **[full]**
- Häikiö, T., Hyönä, J., & Bertram, R. (2015). The role of syllables in word recognition among beginning Finnish readers. *Journal of Cognitive Psychology*, 27, 562–577. https://doi.org/10.1080/20445911.2014.982126 **[abstract]**
- Brügelmann, H. (2025). *Red and blue is my reading book… Is it really helpful to mark syllables by color in beginner reading books?* peDOCS report, not peer-reviewed. https://doi.org/10.25656/01:34472 **[abstract]** (PDF unreachable)
- Brügelmann, H. (2025). *Farbige Silbengliederung in Texten für Leseanfänger\*innen. Eine zusammenfassende Auswertung erster empirischer Studien.* peDOCS report, not peer-reviewed. https://doi.org/10.25656/01:33973 **[abstract]**
- Keelor, J. L., Creaghead, N. A., Silbert, N. H., Breit, A. D., & Horowitz-Kraus, T. (2023). Impact of text-to-speech features on the reading comprehension of children with reading and language difficulties. *Annals of Dyslexia*, 73, 469–486. https://doi.org/10.1007/s11881-023-00281-9 **[abstract]**
- Lee, J., & Yoon, S. Y. (2017). The effects of repeated reading on reading fluency for students with reading disabilities: A meta-analysis. *Journal of Learning Disabilities*, 50, 213–224. https://doi.org/10.1177/0022219415605194 **[abstract] [secondary: ASHA Evidence Map summary]**
- Griffiths, P. G., Taylor, R. H., Henderson, L. M., & Barrett, B. T. (2016). The effect of coloured overlays and lenses on reading: a systematic review of the literature. *Ophthalmic & Physiological Optics*, 36, 519–544. https://doi.org/10.1111/opo.12316 **[abstract]**
- Galuschka, K., Ise, E., Krick, K., & Schulte-Körne, G. (2014). Effectiveness of treatment approaches for children and adolescents with reading disabilities: A meta-analysis of randomized controlled trials. *PLOS ONE*, 9, e89900. https://doi.org/10.1371/journal.pone.0089900 **[full]**; correction: https://doi.org/10.1371/journal.pone.0105843 **[full]**
- Seymour, P. H. K., Aro, M., & Erskine, J. M. (2003). Foundation literacy acquisition in European orthographies. *British Journal of Psychology*, 94, 143–174. https://doi.org/10.1348/000712603321661859 **[abstract]**
- Takacs, Z. K., Swart, E. K., & Bus, A. G. (2015). Benefits and pitfalls of multimedia and interactive features in technology-enhanced storybooks: A meta-analysis. *Review of Educational Research*, 85, 698–739. https://doi.org/10.3102/0034654314566989 **[full]**
- Mol, S. E., Bus, A. G., de Jong, M. T., & Smeets, D. J. H. (2008). Added value of dialogic parent–child book readings: A meta-analysis. *Early Education and Development*, 19, 7–26. https://doi.org/10.1080/10409280701838603 **[abstract]**

### Sources from the knowledge base (not in the README)
- Hughes, L. E., & Wilkins, A. J. (2000). Typography in children's reading schemes may be suboptimal. *Journal of Research in Reading*, 23, 314–324. https://doi.org/10.1111/1467-9817.00126 **[abstract]**
- Lopes, W. N., & Barrera, S. D. (2019; Crossref date 2020). Effects of a syllabic highlight technique in word reading of beginning readers. *Estudos de Psicologia (Natal)*, 24(4). https://doi.org/10.22491/1678-4669.20190035 **[abstract]**
- Liao, W., & Hsiao, J. H. (2023). Does enlarging font size facilitate English word and sentence reading in children as beginning readers? *Proceedings of the Annual Meeting of the Cognitive Science Society*, 45. https://escholarship.org/uc/item/5m91913s (no DOI) **[full]**
- Gerbier, E., Bailly, G., & Bosse, M.-L. (2018). Audio–visual synchronization in reading while listening to texts. *Computer Speech & Language*, 47, 74–92. https://doi.org/10.1016/j.csl.2017.07.003 **[metadata]** (not used for conclusions)

### Spacing, print size, line length, fonts
- Azzarello, C., Paek, S., Hodge, C., Jameson, M., & Lewis, J. (2026). Does font improve reading in dyslexic children? Meta-analysis of dyslexia-friendly fonts. *Annals of Dyslexia*. https://doi.org/10.1007/s11881-026-00389-8 **[abstract]**
- Kuster, S. M., van Weerdenburg, M., Gompel, M., & Bosman, A. M. T. (2018). Dyslexie font does not benefit reading in children with or without dyslexia. *Annals of Dyslexia*, 68, 25–42. https://doi.org/10.1007/s11881-017-0154-6 **[abstract]**
- Marinus, E., Mostard, M., Segers, E., et al. (2016). A special font for people with dyslexia: Does it work and, if so, why? *Dyslexia*, 22, 233–244. https://doi.org/10.1002/dys.1527 **[abstract]**
- Duranovic, M., Senka, S., & Babic-Gavric, B. (2018). Influence of increased letter spacing and font type on the reading ability of dyslexic children. *Annals of Dyslexia*, 68, 218–228. https://doi.org/10.1007/s11881-018-0164-z **[abstract]**
- Hakvoort, B., van den Boer, M., Leenaars, T., Bos, P., & Tijms, J. (2017). Improvements in reading accuracy as a result of increased interletter spacing are not specific to children with dyslexia. *J Experimental Child Psychology*, 164, 101–116. https://doi.org/10.1016/j.jecp.2017.07.010 **[abstract]**
- van den Boer, M., & Hakvoort, B. E. (2015). Default spacing is the optimal spacing for word reading. *Quarterly J Experimental Psychology*, 68, 697–709. https://doi.org/10.1080/17470218.2014.964272 **[abstract]**
- Łuniewska, M., Wójcik, M., & Jednoróg, K. (2022). The effect of inter-letter spacing on reading performance and eye movements in typically reading and dyslexic children. *Learning and Instruction*, 80, 101576. https://doi.org/10.1016/j.learninstruc.2021.101576 **[abstract]**
- Joo, S. J., White, A. L., Strodtman, D. J., & Yeatman, J. D. (2018). Optimizing text for an individual's visual system: The contribution of visual crowding to reading difficulties. *Cortex*, 103, 291–301. https://doi.org/10.1016/j.cortex.2018.03.013 **[abstract]**
- Stagg, S. D., & Kiss, N. (2021). Room to read: extra-large letter spacing and coloured overlays in adolescents with dyslexia. *Research in Developmental Disabilities*, 119, 104065. https://doi.org/10.1016/j.ridd.2021.104065 **[abstract]**
- Sjoblom, A. M., Eaton, E., & Stagg, S. D. (2016). The effects of letter spacing and coloured overlays on reading speed and accuracy in adult dyslexia. *British J Educational Psychology*, 86, 630–639. https://doi.org/10.1111/bjep.12127 **[abstract]**
- Dotan, S., & Katzir, T. (2018). Mind the gap: Increased inter-letter spacing as a means of improving reading performance. *J Experimental Child Psychology*, 174, 13–28. https://doi.org/10.1016/j.jecp.2018.04.010 **[abstract]**
- Dotan, S., & Katzir, T. (2025). Effects of increased letter spacing on digital text reading comprehension, calibration, and preferences in young readers. *Education Sciences*, 15, 1306. https://doi.org/10.3390/educsci15101306 **[abstract]**
- Korinth, S. P., Gerstenberger, K., & Fiebach, C. J. (2020). Wider letter-spacing facilitates word processing but impairs reading rates of fast readers. *Frontiers in Psychology*, 11, 444. https://doi.org/10.3389/fpsyg.2020.00444 **[abstract]**
- Katzir, T., Hershko, S., & Halamish, V. (2013). The effect of font size on reading comprehension on second and fifth grade children: Bigger is not always better. *PLOS ONE*, 8, e74061. https://doi.org/10.1371/journal.pone.0074061 **[abstract]**
- O'Brien, B. A., Mansfield, J. S., & Legge, G. E. (2005). The effect of print size on reading speed in dyslexia. *Journal of Research in Reading*, 28, 332–349. https://doi.org/10.1111/j.1467-9817.2005.00273.x **[abstract]**
- Lorusso, M. L., Borasio, F., Panetto, P., et al. (2024). Validation of a web app enabling children with dyslexia to identify personalized visual and auditory parameters. *Multimodal Technologies and Interaction*, 8, 5. https://doi.org/10.3390/mti8010005 **[abstract]**

### Syllables and word parts
- Häikiö, T., & Vainio, S. (2018). Syllables and inflectional morphemes in early Finnish readers: evidence from eye-movements. *Journal of Child Language*, 45, 1227–1245. https://doi.org/10.1017/S0305000918000132 **[abstract]**
- De Simone, E., Moll, K., Feldmann, L., Schmalz, X., & Beyersmann, E. (2023). The role of syllables and morphemes in silent reading: An eye-tracking study. *Quarterly J Experimental Psychology*, 76, 2493–2513. https://doi.org/10.1177/17470218231160638 **[abstract]**
- Müller, B., Richter, T., Karageorgos, P., Krawietz, S., & Ennemoser, M. (2017). Effects of a syllable-based reading intervention in poor-reading fourth graders. *Frontiers in Psychology*, 8, 1635. https://doi.org/10.3389/fpsyg.2017.01635 **[abstract]**
- Müller, B., Richter, T., & Karageorgos, P. (2020). Syllable-based reading improvement: Effects on word reading and reading comprehension in Grade 2. *Learning and Instruction*, 66, 101304. https://doi.org/10.1016/j.learninstruc.2020.101304 **[abstract]**
- Goodwin, A. P., & Ahn, S. (2010). A meta-analysis of morphological interventions: effects on literacy achievement of children with literacy difficulties. *Annals of Dyslexia*, 60, 183–208. https://doi.org/10.1007/s11881-010-0041-x **[abstract]**
- Goodwin, A. P., & Ahn, S. (2013). A meta-analysis of morphological interventions in English. *Scientific Studies of Reading*, 17, 257–285. https://doi.org/10.1080/10888438.2012.689791 **[abstract]**
- Bowers, P. N., Kirby, J. R., & Deacon, S. H. (2010). The effects of morphological instruction on literacy skills: A systematic review of the literature. *Review of Educational Research*, 80, 144–179. https://doi.org/10.3102/0034654309359353 **[abstract]**
- Elbro, C., & Arnbak, E. (1996). The role of morpheme recognition and morphological awareness in dyslexia. *Annals of Dyslexia*, 46, 209–240. https://doi.org/10.1007/BF02648177 **[abstract]**

### Read-aloud, listening, fluency
- Wood, S. G., Moxley, J. H., Tighe, E. L., & Wagner, R. K. (2018). Does use of text-to-speech and related read-aloud tools improve reading comprehension for students with reading disabilities? A meta-analysis. *Journal of Learning Disabilities*, 51, 73–84. https://doi.org/10.1177/0022219416688170 **[full]** (PMC author manuscript)
- Clinton-Lisell, V. (2022). Listening ears or reading eyes: A meta-analysis of reading and listening comprehension comparisons. *Review of Educational Research*, 92, 543–582. https://doi.org/10.3102/00346543211060871 **[abstract]**
- Clinton-Lisell, V. (2023). Does reading while listening to text improve comprehension compared to reading only? A systematic review and meta-analysis. *Educational Research: Theory and Practice*, 34(3), 133–155. ERIC EJ1403866, https://files.eric.ed.gov/fulltext/EJ1403866.pdf (no DOI found; preprint https://doi.org/10.31219/osf.io/ku6tv) **[abstract]**
- Lopukhina, A., Cooper, H., Hsieh, C.-Y., van Heuven, W. J. B., & Rastle, K. (2026). No evidence that same-language subtitles improve children's reading fluency. *British Journal of Psychology*, 117, 1308–1325. https://doi.org/10.1111/bjop.70066 **[abstract]**
- Schiavo, G., Mana, N., Mich, O., Zancanaro, M., & Job, R. (2021). Attention-driven read-aloud technology increases reading comprehension in children with reading disabilities. *J Computer Assisted Learning*, 37, 875–886. https://doi.org/10.1111/jcal.12530 **[abstract]**
- Stevens, E. A., Walker, M. A., & Vaughn, S. (2017). The effects of reading fluency interventions on the reading fluency and reading comprehension performance of elementary students with learning disabilities. *Journal of Learning Disabilities*, 50, 576–590. https://doi.org/10.1177/0022219416638028 **[abstract]**
- Hudson, A., Koh, P. W., Moore, K. A., & Binks-Cantrell, E. (2020). Fluency interventions for elementary students with reading difficulties: A synthesis of research from 2000–2019. *Education Sciences*, 10, 52. https://doi.org/10.3390/educsci10030052 **[abstract]**
- Zimmermann, L. M., Reed, D. K., & Aloe, A. M. (2021). A meta-analysis of non-repetitive reading fluency interventions for students with reading difficulties. *Remedial and Special Education*, 42, 78–93. https://doi.org/10.1177/0741932519855058 **[abstract]**
- Maki, K. E., & Hammerschmidt-Snidarich, S. (2022). Reading fluency intervention dosage: A novel meta-analysis and research synthesis. *Journal of School Psychology*, 92, 148–165. https://doi.org/10.1016/j.jsp.2022.03.008 **[abstract]**
- Suggate, S. P. (2016). A meta-analysis of the long-term effects of phonemic awareness, phonics, fluency, and reading comprehension interventions. *Journal of Learning Disabilities*, 49, 77–96. https://doi.org/10.1177/0022219414528540 **[abstract]**
- Swanson, E., Vaughn, S., Wanzek, J., et al. (2011). A synthesis of read-aloud interventions on early reading outcomes among preschool through third graders at risk for reading difficulties. *Journal of Learning Disabilities*, 44, 258–275. https://doi.org/10.1177/0022219410378444 **[abstract]**

### Teaching and treatment of dyslexia
- Hall, C., Dahl-Leonard, K., Cho, E., et al. (2023). Forty years of reading intervention research for elementary students with or at risk for dyslexia: A systematic review and meta-analysis. *Reading Research Quarterly*, 58, 285–312. https://doi.org/10.1002/rrq.477 **[full]** (PMC)
- McArthur, G., Sheehan, Y., Badcock, N. A., et al. (2018). Phonics training for English-speaking poor readers. *Cochrane Database of Systematic Reviews*, CD009115.pub3. https://doi.org/10.1002/14651858.CD009115.pub3 **[abstract]**
- Galuschka, K., & Schulte-Körne, G. (2016). The diagnosis and treatment of reading and/or spelling disorders in children and adolescents (S3 guideline). *Deutsches Ärzteblatt International*, 113, 279–286. https://doi.org/10.3238/arztebl.2016.0279 **[abstract]**
- Galuschka, K., Görgen, R., Kalmar, J., et al. (2020). Effectiveness of spelling interventions for learners with dyslexia: A meta-analysis and systematic review. *Educational Psychologist*, 55, 1–20. https://doi.org/10.1080/00461520.2019.1659794 **[abstract]**
- Bowers, J. S. (2020). Reconsidering the evidence that systematic phonics is more effective than alternative methods of reading instruction. *Educational Psychology Review*, 32, 681–705. https://doi.org/10.1007/s10648-019-09515-y **[abstract]** (preprint abstract)
- Austin, C. R., Filderman, M. J., Raine, D., Kjesbo, R., & Boman, C. D. (2026). Dispelling myths and misunderstandings about defining and remediating dyslexia. *Dyslexia*, 32(4), e70049. https://doi.org/10.1002/dys.70049 **[full]** (relevant sections)
- Handler, S. M., Fierson, W. M., et al. (2011). Learning disabilities, dyslexia, and vision. *Pediatrics*, 127, e818–e856. https://doi.org/10.1542/peds.2010-3670 **[abstract]**

### Danish research
- Gellert, A. S., & Elbro, C. (2017). Does a dynamic test of phonological awareness predict early reading difficulties? *Journal of Learning Disabilities*, 50, 227–237. https://doi.org/10.1177/0022219415609185 **[metadata]**
- Gellert, A. S., & Elbro, C. (2018). Predicting reading disabilities using dynamic assessment of decoding before and after the onset of reading instruction. *Annals of Dyslexia*, 68, 126–144. https://doi.org/10.1007/s11881-018-0159-9 **[metadata]**
- Poulsen, M., Juul, H., & Elbro, C. (2023). A national test of dyslexia. *Annals of Dyslexia*, 73, 337–355. https://doi.org/10.1007/s11881-023-00285-5 **[abstract]**
- Gellert, A. S., Petersen, D. K., & Elbro, C. (2026). Predicting response to early reading intervention for children at risk for dyslexia: the importance of pronunciation accuracy. *Annals of Dyslexia*. https://doi.org/10.1007/s11881-026-00388-9 **[abstract]**
- Gellert, A. S. (2023). Predicting children's long-term knowledge of taught words and transfer words after a morphological vocabulary intervention. *Language, Speech, and Hearing Services in Schools*, 54, 472–488. https://doi.org/10.1044/2022_LSHSS-22-00002 **[abstract]**
- Bleses, D., Højen, A., Justice, L. M., et al. (2018). The effectiveness of a large-scale language and preliteracy intervention: The SPELL randomized controlled trial in Denmark. *Child Development*, 89, e342–e363. https://doi.org/10.1111/cdev.12859 **[abstract]**
- Andersen, S. C., & Nielsen, H. S. (2016). Reading intervention with a growth mindset approach improves children's skills. *PNAS*, 113, 12111–12113. https://doi.org/10.1073/pnas.1607946113 **[full]** (PMC)

### Parents and shared reading
- Sénéchal, M., & Young, L. (2008). The effect of family literacy interventions on children's acquisition of reading from kindergarten to grade 3: A meta-analytic review. *Review of Educational Research*, 78, 880–907. https://doi.org/10.3102/0034654308320319 **[abstract]**
- Noble, C., Sala, G., Peter, M., et al. (2019). The impact of shared book reading on children's language skills: A meta-analysis. *Educational Research Review*, 28, 100290. https://doi.org/10.1016/j.edurev.2019.100290 **[abstract]**
- Dowdall, N., Melendez-Torres, G. J., Murray, L., et al. (2020). Shared picture book reading interventions for child language development: A systematic review and meta-analysis. *Child Development*, 91, e383–e399. https://doi.org/10.1111/cdev.13225 **[abstract]**
- Fikrat-Wevers, S., van Steensel, R., & Arends, L. (2021). Effects of family literacy programs on the emergent literacy skills of children from low-SES families: A meta-analysis. *Review of Educational Research*, 91, 577–613. https://doi.org/10.3102/0034654321998075 **[abstract]**
- Pillinger, C., & Vardy, E. J. (2022). The story so far: A systematic review of the dialogic reading literature. *Journal of Research in Reading*, 45, 533–548. https://doi.org/10.1111/1467-9817.12407 **[abstract]**
- Dong, Y., Chow, B. W.-Y., Mo, J., et al. (2024). Effects of dialogic reading elements on children's language development. *Journal of Research in Reading*, 47, 181–200. https://doi.org/10.1111/1467-9817.12447 **[abstract]**

### Digital reading, apps and games
- Furenes, M. I., Kucirkova, N., & Bus, A. G. (2021). A comparison of children's reading on paper versus screen: A meta-analysis. *Review of Educational Research*, 91, 483–517. https://doi.org/10.3102/0034654321998074 **[abstract]**
- Bus, A. G., Kucirkova, N., Ten Braak, D., & Ciesielska, M. (2026). Which interactive features in children's digital picture books promote reading comprehension? A meta-analysis. *Early Education and Development*, 37, 269–288. https://doi.org/10.1080/10409289.2025.2571978 **[abstract]**
- Delgado, P., Vargas, C., Ackerman, R., & Salmerón, L. (2018). Don't throw away your printed books: A meta-analysis on the effects of reading media on reading comprehension. *Educational Research Review*, 25, 23–38. https://doi.org/10.1016/j.edurev.2018.09.003 **[abstract]**
- Clinton, V. (2019). Reading from paper compared to screens: A systematic review and meta-analysis. *Journal of Research in Reading*, 42, 288–325. https://doi.org/10.1111/1467-9817.12269 **[abstract]**
- McTigue, E. M., Solheim, O. J., Zimmer, W. K., & Uppstad, P. H. (2020). Critically reviewing GraphoGame across the world. *Reading Research Quarterly*, 55, 45–73. https://doi.org/10.1002/rrq.256 **[abstract]**
- Neitzel, A. J., Lake, C., Pellegrini, M., & Slavin, R. E. (2022). A synthesis of quantitative research on programs for struggling readers in elementary schools. *Reading Research Quarterly*, 57, 149–179. https://doi.org/10.1002/rrq.379 **[abstract]**
- Cheung, A. C. K., & Slavin, R. E. (2013). Effects of educational technology applications on reading outcomes for struggling readers: A best-evidence synthesis. *Reading Research Quarterly*, 48, 277–299. https://doi.org/10.1002/rrq.50 **[abstract]**
- Verhoeven, L., Voeten, M., & Segers, E. (2022). Computer-assisted word reading intervention effects throughout the primary grades: A meta-analysis. *Educational Research Review*, 37, 100486. https://doi.org/10.1016/j.edurev.2022.100486 **[abstract]**
- Verhoeven, L., Voeten, M., van Setten, E., & Segers, E. (2020). Computer-supported early literacy intervention effects in preschool and kindergarten: A meta-analysis. *Educational Research Review*, 30, 100325. https://doi.org/10.1016/j.edurev.2020.100325 **[abstract]**
- Glatz, T., Tops, W., Borleffs, E., et al. (2023). Dynamic assessment of the effectiveness of digital game-based literacy training in beginning readers: a cluster randomised controlled trial. *PeerJ*, 11, e15499. https://doi.org/10.7717/peerj.15499 **[abstract]**
- Franceschini, S., Gori, S., Ruffino, M., et al. (2013). Action video games make dyslexic children read better. *Current Biology*, 23, 462–466. https://doi.org/10.1016/j.cub.2013.01.044 **[metadata]**
- Peters, J. L., Crewther, S. G., Murphy, M. J., & Bavin, E. L. (2021). Action video game training improves text reading accuracy, rate and comprehension in children with dyslexia: a randomized controlled trial. *Scientific Reports*, 11, 18584. https://doi.org/10.1038/s41598-021-98146-x **[abstract]**
- Łuniewska, M., Chyl, K., Dębska, A., et al. (2018). Neither action nor phonological video games make dyslexic children read better. *Scientific Reports*, 8, 549. https://doi.org/10.1038/s41598-017-18878-7 **[abstract]**

### Overlays, lenses, flicker, bionic reading
- Suttle, C. M., Lawrenson, J. G., & Conway, M. L. (2018). Efficacy of coloured overlays and lenses for treating reading difficulty: an overview of systematic reviews. *Clinical and Experimental Optometry*, 101, 514–520. https://doi.org/10.1111/cxo.12676 **[abstract]**
- Suttle, C. M., Barbur, J. L., & Conway, M. L. (2017). Coloured overlays and precision-tinted lenses: poor repeatability in a sample of adults and children diagnosed with visual stress. *Ophthalmic & Physiological Optics*, 37, 542–548. https://doi.org/10.1111/opo.12389 **[abstract]**
- Suttle, C. M., & Conway, M. L. (2025). Efficacy of coloured lenses for patients diagnosed with visual stress. *Clinical and Experimental Optometry*, 108, 72–78. https://doi.org/10.1080/08164622.2024.2302822 **[abstract]**
- Lubineau, M., Potier Watkins, C., Glasel, H., & Dehaene, S. (2023). Does word flickering improve reading? Negative evidence from four experiments. *Proceedings of the Royal Society B*, 290. https://doi.org/10.1098/rspb.2023.1665 **[abstract]**
- Snell, J. (2024). No, Bionic Reading does not work. *Acta Psychologica*, 247, 104304. https://doi.org/10.1016/j.actpsy.2024.104304 **[abstract]**
- Spear, A. I., Johnson, R. L., Yun, H., Ashby, J., & Kleinsmith, A. L. (2025). To boldly go where no text has gone before: The effects of boldface letters on eye movements in reading. *Attention, Perception, & Psychophysics*, 87, 1270–1286. https://doi.org/10.3758/s13414-025-03067-w **[abstract]**
- Beelders, T. R. (2025). Guiding the gaze: How Bionic Reading influences eye movements. *Journal of Eye Movement Research*, 18, 49. https://doi.org/10.3390/jemr18050049 **[abstract]**
- Zhang, Z., Zhao, H., & Wang, Y. (2026). Bionic Reading in L2 academic contexts: An eye-tracking study. *Acta Psychologica*, 270, 107723. https://doi.org/10.1016/j.actpsy.2026.107723 **[abstract]**

### Motivation and wellbeing
- Toste, J. R., Didion, L., Peng, P., Filderman, M. J., & McClelland, A. M. (2020). A meta-analytic review of the relations between motivation and reading achievement for K–12 students. *Review of Educational Research*, 90, 420–456. https://doi.org/10.3102/0034654320919352 **[abstract]**
- Francis, D. A., Caruana, N., Hudson, J. L., & McArthur, G. M. (2019). The association between poor reading and internalising problems: A systematic review and meta-analysis. *Clinical Psychology Review*, 67, 45–60. https://doi.org/10.1016/j.cpr.2018.09.002 **[abstract]**
- Donolato, E., Cardillo, R., Mammarella, I. C., & Melby-Lervåg, M. (2022). Language and specific learning disorders in children and their co-occurrence with internalizing and externalizing problems: a systematic review and meta-analysis. *J Child Psychology and Psychiatry*, 63, 507–518. https://doi.org/10.1111/jcpp.13536 **[abstract]**
- Unrau, N. J., Rueda, R. S., Son, E., Polanin, J. R., Lundeen, R. J., & Muraszewski, A. K. (2018). Can reading self-efficacy be modified? A meta-analysis of the impact of interventions on reading self-efficacy. *Review of Educational Research*, 88, 167–204. https://doi.org/10.3102/0034654317743199 **[abstract]**
