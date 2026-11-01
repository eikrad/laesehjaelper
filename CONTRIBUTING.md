# Contributing to Læsehjælper

Thanks for wanting to help! Contributions are welcome – bug reports, ideas, translations and code.

*Deutsch: Beiträge sind willkommen, auf Deutsch, Dänisch oder Englisch. · Dansk: Bidrag er velkomne, på dansk, tysk eller engelsk.*

## How decisions are made

Læsehjælper is maintained by [@eikrad](https://github.com/eikrad). Anyone can open issues and pull requests, but **only the maintainer merges into `main`** and decides what goes in. Please don't be discouraged if a pull request is declined or changed – it's about keeping the app simple and focused on young readers.

## Before you start

- **Roadmap:** planned work is tracked as [issues labelled `roadmap`](https://github.com/eikrad/laesehjaelper/issues?q=is%3Aissue%20is%3Aopen%20label%3Aroadmap).
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
5. Open a pull request against `main` and fill in the template. CI must be green.

## Guidelines

- **TypeScript only** (strict mode). The build output in `dist/` is generated and not committed.
- **Privacy first:** everything runs on the user's device. No servers, no tracking, no uploads.
- **No copyrighted material:** never commit photos or text from real books, not even as test fixtures. Use self-made test pages (see `tests/fixtures/`).
- **UI texts** exist in Danish, German and English (`T` in `src/app.ts`); please add all three, or ask for help with translations.
- Keep the interface calm and simple – it is used by children who are learning to read.

## License

By contributing, you agree that your contribution is licensed under the project's [MIT License](LICENSE).
