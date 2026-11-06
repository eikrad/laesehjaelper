# Registered trials and extra literature from Amass

*Supplement to [`dyslexia-reading-support.md`](dyslexia-reading-support.md), as of 5 November 2026.*

## What was searched
This search used **Amass** (platform.amass.tech) through its MCP connector:
- **TrialCore:** about 1.2 million trial registrations from ClinicalTrials.gov and the WHO ICTRP, including ISRCTN, DRKS and EUCTR.
- **BiomedCore:** about 43 million PubMed and PMC records, with journal-quality ratings from the Finnish Publication Forum (JUFO, 0–3).

It adds two things the earlier searches could not:
- **Registered trials,** including unfinished and unpublished ones.
- **A journal-quality filter.**

Every DOI below was checked against Crossref (title, first author, year). Unless marked otherwise, each finding comes from the abstract in the Amass/PubMed record. Trial details come from the registry entry.

**Queries:**
- *TrialCore:*
  - "dyslexia reading intervention children" (interventional, age group child, start ≥ 2015, 40 results);
  - "reading difficulties dyslexia literacy" with sites in Denmark;
  - "text-to-speech assistive technology reading comprehension dyslexia";
  - "dyslexia letter spacing font typography visual crowding reading".
- *BiomedCore:*
  - Danish authors (Elbro, Poulsen, Juul, Gellert, Arnbak, Bleses);
  - meta-analyses and systematic reviews since 2022 with JUFO ≥ 2;
  - "set for variability";
  - visual cues (syllable highlighting, colour coding, diacritics);
  - coloured filters.

---

## 1. Registered trials worth knowing about

| Trial | What | Status | Why it matters |
|---|---|---|---|
| **NCT06947512**, IRCCS Eugenio Medea, Italy | 90 students aged 7–15: personalised font, size, spacing and text-to-speech voice ("Seleggo") vs standard settings, within-subject | Recruiting, planned end Dec 2025; **no results yet** | The first registered trial of *per-child* display and voice settings, which is what Læsehjælper's reader profiles do. Follows Lorusso et al. 2024. Watch for results. |
| **ISRCTN39964318**, Dyslexia Research Trust (Stein), UK | 200 children aged 7–11: blue or yellow filters vs placebo grey filters for 3 months | Completed Oct 2024; **no results and no publication** in the registry (checked through the ISRCTN API on 5 Nov 2026) | A placebo-controlled trial from a group that favours filters, still unreported two years after completion. Until results appear it adds nothing to the case for coloured backgrounds. Amass marks it "has results", but the registry entry is empty. |
| **NCT06403007**, York University and others, Canada | Cluster RCT, 964 children aged 6–9 in 100 schools: phonics + morphology vs phonics + "set for variability" | Completed Aug 2026; **results pending** | The largest trial of set-for-variability teaching (see section 2). |
| **NCT04618822**, PLAYMORE, University of Copenhagen | 149 Danish grade-0 children (5–6 years): letter–sound teaching with whole-body movements, hand movements, or seated | Completed; published (Damsgaard et al. 2022) | A Danish RCT on early letter learning (section 3). |
| **NCT04384952**, AP-HP, France | 22 dyslexic children in grades 3–5: parents ran repeated reading for 15 minutes a day over the summer vs a holiday workbook | Completed; published (Kerjean et al. 2023) | Parent-led repeated reading (section 4). |

The child dyslexia trial landscape since 2015 (40 trials) is dominated by:
- **Brain stimulation** (tDCS, tRNS, rTMS, taVNS);
- **Visual and attention devices,** e.g. MAEVAD and visual attention span training in France;
- **Small multi-component programmes,** many of them in Iran.

No registered trial was found on syllable colouring, letter spacing for children, word highlighting during read-aloud, or reading apps of Læsehjælper's kind.

## 2. Set for variability: relevant for Danish

"Set for variability" (SfV) is a child's ability to turn a word's spelling-based pronunciation into the real word. For example, after decoding *wasp* to rhyme with *clasp*, the child recognises the actual word. Danish, with its many context-dependent vowel and consonant pronunciations, should need this step at least as much as English.

- **Steacy et al. 2022, *Reading Research Quarterly*** (JUFO 3), doi:10.1002/rrq.475: in 489 children in grades 2–5, SfV explained 15 % unique variance in word reading, against 1 % for phonological awareness. It was a stronger predictor at lower reading levels. (Correlational, L5.)
- **Basma et al. 2026, *Dyslexia*** (JUFO 2), doi:10.1002/dys.70025: a preregistered RCT with 30 children (mean age 9) with persistent word-reading difficulties. Fifteen hours of online SfV teaching beat synthetic phonics plus sight words on irregular-word reading. (L3, small.)
- **Dunn et al. 2024, *Journal of Learning Disabilities*** (JUFO 3), doi:10.1177/00222194241297058: a cluster RCT with 273 struggling readers in grades 2–3. Phonics + SfV and phonics + morphology both gave large pre–post gains (g ≈ 0.74–1.54), with **no difference between the two**. There was no business-as-usual control. (L2/L3.)
- The 964-child trial above will be the decisive test.

**Danish link:** Elbro and colleagues described the same "second step" of decoding, from spelling pronunciation to the stored word. The Danish/Nordic review should be checked for that work.

**Design inference:** Læsehjælper's tap-a-word sequence (whole word → slow syllables → whole word again) already ends on the real pronunciation, which is the SfV step. That makes the final "whole again" part worth keeping. The teaching evidence is still mixed, so this does not justify a new feature yet. **Watch, no issue.**

## 3. Danish research found through Amass

- **Danish is hard before reading starts:**
  - Danish children had the lowest vocabulary comprehension among 18 comparable studies of early vocabulary in different languages (Bleses et al. 2008, *Journal of Child Language*, JUFO 3, doi:10.1017/S0305000908008714).
  - Eye-tracking studies link this to Danish sound structure: many vowels and glides at word boundaries slow toddlers' word processing and word learning (Trecca et al. 2018, doi:10.1016/j.jecp.2017.10.011; Trecca et al. 2020, *Language and Speech*, JUFO 3, doi:10.1177/0023830919893390).

  Together with Juul & Sigurðsson 2005 (Danish vs Icelandic spelling), this is a distinctive Danish research strength, and it backs the idea that Danish beginners need more support than German or Finnish ones.
- **SPELL long term** (Bleses et al. 2021, *PLOS ONE*, doi:10.1371/journal.pone.0258287):
  - Follow-up of 2,700 children from the 7,076-child preschool trial.
  - No overall difference in grade-2 reading.
  - Sustained and mostly large effects for children whose mothers had low to middle education. (L2.)
- **PLAYMORE** (Damsgaard et al. 2022, *Educational Psychology Review*, JUFO 2, doi:10.1007/s10648-022-09671-8; protocol Gejl et al. 2021, doi:10.1186/s12887-020-02430-0):
  - 149 Danish grade-0 children.
  - Whole-body movements during letter–sound teaching improved letter-sound naming, still visible 17–22 weeks later.
  - No effect on word reading. (L3.)
- **Early identification:** Poulsen et al. 2017 (*Dyslexia*, doi:10.1002/dys.1560; 164 Danish children) found that reading measures six months into grade 1 predicted later difficulties as well as the whole early battery did. They proposed screening at several points with increasing sensitivity.
- **Who responds to early intervention:** Gellert, Petersen & Elbro 2026 (already in the main review) found pronunciation accuracy to be a strong predictor.

## 4. Parents doing the practice

**Kerjean, Benard & Peyre 2023, *L'Encéphale*,** doi:10.1016/j.encep.2022.08.016 (RCT, n = 22, grades 3–5, France):
- Parents ran repeated reading for 15 minutes a day, 5 days a week, for 6 weeks over the summer.
- Primary outcome: no group difference.
- Secondary fluency measure: +0.17 SD vs −0.24 SD for the workbook group (p = .015).
- Dropout was 9 %. (L3, very small.)

This supports the feasibility of parent-led repeated reading at home, not its effect. It fits #113 (tips for the adult) and #114 (next page alone).

## 5. Visual cues across languages

Studies in other scripts show a consistent pattern: **spaces help as a segmentation cue, colour alternation does not.**
- **Chinese:** spaces helped recognition of individual words, while grey or red highlighting gave no benefit and slowed reading (Ma et al. 2019, *Ergonomics*, doi:10.1080/00140139.2019.1608315).
- **Tibetan:** spaces between words improved reading; colour alternation did not (Niu et al. 2025, doi:10.3390/jemr18040033).
- **German skilled readers:** colour alternation at syllable or morpheme boundaries did not change eye movements (De Simone et al. 2023, already in the main review).
- **The exception:** in adult readers of a spaced script, alternating word colours could largely stand in for missing spaces (Perea et al. 2015, *Acta Psychologica*, doi:10.1016/j.actpsy.2015.05.005).

The children's evidence points the same way, plus two further results:
- **Long words are harder in themselves:** for children in grades 2–4, each extra syllable made a word harder, beyond the number of letters and morphemes (Kearns et al. 2026, *Frontiers in Psychology*, doi:10.3389/fpsyg.2026.1852797; n = 123).
- **Syllables as a bridge:** teaching letters-to-syllable correspondences improved phonemic awareness more than letter-to-phoneme teaching in 222 French prereaders (Vazeux et al. 2020, *Scientific Reports*, doi:10.1038/s41598-020-79240-y). This is teaching, not a display aid.

**Design inference:**
- This adds weight to #111 (colour off by default) and to #112 (support aimed at long words).
- It also suggests that, of the app's visual aids, spacing is the better-supported one.

## 6. A recent meta-analysis not in the main review

**Boucher et al. 2023, *Journal of Learning Disabilities*** (JUFO 3), doi:10.1177/00222194231207556: 22 studies of students in grades 3–12 with significant word-reading difficulties.
- Mean effect g = 0.14 [0.04, 0.23]; pseudoword reading 0.38.
- More hours gave more effect.
- This confirms Hall et al. 2023: older struggling readers gain much less than young ones, so early support matters most.

## 7. Coloured filters: one more review

**Evans & Allen 2016, *Journal of Optometry*,** doi:10.1016/j.optom.2016.04.002, a systematic review by researchers sympathetic to filters:
- "Visual stress" may affect a minority (about 20 %) of people with dyslexia.
- Individually prescribed filters may help that condition.
- They are **not a treatment for dyslexia.**

This does not change the main review's verdict.

---

## Issue candidates
None new. The Amass results strengthen the case for #111, #112, #113 and #114. Set for variability is a "watch" item until the Canadian trial (NCT06403007) reports.
