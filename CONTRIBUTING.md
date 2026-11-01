# Contributing to Læsehjælper

Thanks for wanting to help! Contributions are welcome – bug reports, ideas, translations and code.

*Deutsch: Beiträge sind willkommen, auf Deutsch, Dänisch oder Englisch. · Dansk: Bidrag er velkomne, på dansk, tysk eller engelsk.*

## How decisions are made

Læsehjælper is maintained by [@eikrad](https://github.com/eikrad). Anyone can open issues and pull requests, but **only the maintainer merges into `main`** and decides what goes in. Please don't be discouraged if a pull request is declined or changed – it's about keeping the app simple and focused on young readers.

## Roadmap: epics, stories and bugs

All planning happens in GitHub issues – there is no separate list anywhere else. The [roadmap](https://github.com/eikrad/laesehjaelper/issues?q=is%3Aissue%20is%3Aopen%20label%3Aroadmap) is simply every open issue labelled `roadmap`.

| Type | Label | What it is | Who creates it |
|---|---|---|---|
| **Epic** | `epic` + `roadmap` | A larger goal from the user's point of view (“As a parent I want …”). Has no code of its own; it is done when its stories are done. | Maintainer |
| **Story** | `story` (+ `roadmap` when planned) | One deliverable piece of an epic, small enough for one pull request. Linked to its epic as a **sub-issue**. Has acceptance criteria. | Anyone (proposal), maintainer decides |
| **Bug** | `bug` | Something that does not work as intended. Linked to an epic as a sub-issue when it belongs to one. | Anyone |

Rules:

- Every story and every planned bug belongs to exactly one epic (as a sub-issue).
- Only the maintainer adds or removes the `roadmap` label – that is what puts something on the roadmap.
- A pull request closes one story or bug (`Closes #…` in the description). Bigger stories are split into several stories rather than one huge pull request.
- Use the issue templates (Epic, Story, Bug).

## Before you start

- For anything bigger than a small fix, **open or comment on an issue first** so we can agree on the approach.

## Making a change

1. Fork the repository and create a branch from `main`.
2. `npm install`, then make your change.
3. Run the checks:
   ```bash
   npm run typecheck   # TypeScript (strict), no JavaScript files in the project
   npm test            # unit tests (Vitest)
   npm run build
   npm run test:e2e    # end-to-end tests (Playwright)
   ```
4. Add or update tests for what you changed.
5. Open a pull request against `main`, fill in the template and reference the story or bug it closes. CI must be green.

## Guidelines

- **TypeScript only** (strict mode). The build output in `dist/` is generated and not committed.
- **Privacy first:** everything runs on the user's device. No servers, no tracking, no uploads.
- **No copyrighted material:** never commit photos or text from real books, not even as test fixtures. Use self-made test pages (see `tests/fixtures/`).
- **UI texts** exist in Danish, German and English (`T` in `src/app.ts`); please add all three, or ask for help with translations.
- Keep the interface calm and simple – it is used by children who are learning to read.

## License

By contributing, you agree that your contribution is licensed under the project's [MIT License](LICENSE).
