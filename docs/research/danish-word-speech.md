# Danish tapped-word speech check (#115)

## What was checked

On 10 November 2026, a self-made six-page book with 30 Danish words was generated and imported into the app. Every word was tapped in a browser; the resulting utterance texts were captured at the speech-engine boundary. This checks the requested text, not its pronunciation.

Words: pige, kage, gade, katten, hoppe, hunden, appelsin, mælkebøtte, elefanten, sover, skole, løbe, øjnene, pigerne, legetøj, cykel, bogen, huset, æble, biler, blomsterne, sommerfuglene, lille, morgen, regner, læser, hovedet, vandet, siger, kommer.

The project maintainer reported that isolated syllables sometimes sounded different from their sounds in the whole word. They explicitly identified themselves as a non-native speaker. After local speech setup, they preferred the Danish Piper `da_DK-talesyntese-medium` voice to eSpeak and reported that the split-word sequence sounded slow and strained.

These are qualitative user observations, not a recorded native-speaker judgment of every item. A complete per-word listening assessment remains open. The headless-browser tests use fake speech and cannot supply those judgments.

## Earlier decision (#171) and limits

Keep Danish pronunciation context by speaking a multisyllabic tapped word whole, repeating it at 90% of the chosen reading rate, then speaking it whole again. Highlight the whole word for these steps; keep the written syllables, colours and manual boundaries visible. Do not invent syllable timings: browser speech services do not reliably provide them. Words with only one written part remain a single utterance. German and English keep the existing segmented sequence and 75% slow-step multiplier.

The 90% multiplier is a conservative response to the strained-speech feedback, not a research-derived optimum. Linguistic motivation: Trecca et al. (2021), *Danish as a window onto language processing and learning*, doi:[10.1111/lang.12450](https://doi.org/10.1111/lang.12450). Neither that review nor the listening feedback demonstrates that this exact playback sequence improves reading.

The maintainer's Linux Piper setup also exposed two independent configuration issues: reloading the neural model for each utterance and an incorrect conversion from Speech Dispatcher's rate into Piper length scale. Those were corrected in the local speech configuration; they are separate from this app change and add no runtime dependency to Læsehjælper.

## Playback choice update (#186)

The maintainer subsequently rejected the three intact-word repetitions as unhelpful. Tapped words now play once by default. Each reader can explicitly choose whole word → individual slow syllables → whole word in Danish, German or English. A word with only one usable part still plays once. Missing settings on older profiles adopt single-word playback. The speech-rate multipliers remain unchanged.

The earlier listening observations and linguistic caveat remain relevant: isolated written parts can sound different from the word. This is explained beside the optional setting; it no longer silently replaces syllables with whole-word repetitions. No learning benefit or pronunciation accuracy of the exact optional sequence is claimed.
