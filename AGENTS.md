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

## Code generation expectations

- Match existing project conventions.
- Prefer simple, readable solutions.
- Avoid unnecessary abstractions.
- When a file grows too much, split it into smaller components.

## Final check

- Verify generated code follows all rules in this file.
