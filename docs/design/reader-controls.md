# Page-first reader controls

Agreed with the maintainer on 13 November 2026; implementation story #198, part of #103.

Tablets in portrait, usually showing the original book-page layout, are the primary case. The intended children are beginning readers who need pictures or spoken help with labels. Children control simple reading aids and playback; adults configure detailed settings.

## Reading

Fit the complete book page into the available width and the height above the bottom bar. Preserve its proportions; do not crop, stretch or reflow the original layout to fill a differently shaped screen. Keep a small book header and small outer gaps. On a tall phone the source proportions can leave unused height even when the page already fills the available width.

One bottom bar contains previous/next page arrows and two direct picture helpers: read aloud and follow a line. Stop replaces read aloud during playback. The line-help switch restores the reader's chosen ruler or one-line mode. Switching off and on on the same page keeps the current line. Line movement controls appear only while help is active; narrow screens can use a second row. Words keep their existing speech action.

The earlier side-rail/Tools-handle exploration was superseded by this direction. The compact helpers stay visible in this implementation. There is no inactivity timer, hidden gesture or new reading intervention.

## Settings and preparation

Aa is a compact presentation panel: text size, book-page/text-only view, and applicable text-only controls. Detailed settings live under **For adults → Reading setup**, grouped as appearance, reading aids, audio, reading together/practice, reader profiles and app/information. The same optional adult gate protects setup and workshop entry, including the shortcut from Aa. Closing setup returns focus to the adult entry.

Book language and printed syllable separators remain preparation choices, in workshop book settings. Correction still opens the selected page in the workshop and returns to reading. Existing settings, profiles, export data and optional aid defaults remain compatible.

## Implementation and validation

1. Shared UI: compact reader bar, direct help, profile preference and available-area page fitting (`src/app.ts`, `src/index.html`, `src/profiles.ts`).
2. Shared UI: compact Aa and grouped adult setup, retaining the existing gate and workshop boundaries.
3. DA/DE/EN documentation and responsive/regression checks.

The maintainer confirmed these test boundaries before new tests: browser reading flows, settings/adult-gate flows, and visible geometry across phone, portrait/landscape tablet and laptop in all three UI languages. Existing unit tests continue to cover fitting and guide logic. Browser tests do not prove usability with children or support on physical iPad/Android devices; those require device checks and observation.

This is a control reorganization, not a claim that the layout or any optional aid improves reading attainment. Existing research qualifications and opt-in defaults continue to apply.
