# AGENTS.md

## Frontend rules

- Use arrow functions only.
- Keep components small and focused.
- Extract reusable UI into separate components.
- Separate presentation from logic when practical.

## Import order

- Group imports in this order:
  1. React and framework imports
  2. External libraries
  3. Internal absolute imports
  4. Relative imports
  5. CSS / style imports

## Styling

- Define colors in `:root`.
- Use hex values only for colors.
- Do not hardcode colors inside components or scattered CSS files unless adding a new root variable.

- Shared building blocks (`.panel`, `.button`, `.text-input`, …) live in
  `@layer base` in `src/globals.css`; component stylesheets refine them without
  fighting over import order.
- Seal colours are `--seal-*` tokens; the SVG uses classes, never inline colours.

## Architecture

- Keep framework-free logic (DSP, beat tracking, API mapping, parsing) in plain
  `.ts` modules under `src/audio`, `src/services`, `src/utils` and `src/lib`.
- Those modules import siblings with an explicit `.ts` extension so Node's
  built-in TypeScript support can run their tests.
- Anything that plays music implements `PlaybackSource` (`src/audio/types.ts`).
- Never put per-frame values (beat phase, animation) in React state; write to
  DOM nodes from a `requestAnimationFrame` loop instead.

## Testing & formatting

- Unit-test pure logic in a sibling `*.test.ts` file using `node:test` and
  `node:assert/strict`; run `npm test`.
- Run `npm run typecheck`, `npm test` and `npm run lint` before committing.
- Format with Prettier (`.prettierrc.json`: single quotes).

## Code generation expectations

- Match existing project conventions.
- Prefer simple, readable solutions.
- Avoid unnecessary abstractions.
- When a file grows too much, split it into smaller components.

## Final check

- Verify generated code follows all rules in this file.
