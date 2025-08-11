Styling System

Hybrid Tailwind + SCSS approach:

- Tokens via CSS variables are defined in `src/app/globals.css` and extended in `styles/_tokens.scss`.
- Component primitives are defined in `styles/_components.scss` under `@layer components` with Tailwind `@apply`.
- Base import is wired through `src/app/globals.css` importing `../../styles/base.scss`.
- Use primitives for composition: `.card`, `.card--gradient`, `.table`, `.btn`, `.btn--tab`, `.select`, `.input`, `.badge`, `.chip`, `.modal-overlay`, `.modal`.
- Keep Tailwind utilities for layout (flex/grid/gap), responsive, and state variants.

When to use what:
- Use primitives for recurring visual shells, buttons, tables, and form controls.
- Keep page-specific layout utilities inline.
- Prefer SCSS Modules only for component-specific overrides.

Linting & formatting:
- Stylelint config: `.stylelintrc.json` (SCSS + Tailwind).
- Prettier sorts Tailwind classes via `prettier-plugin-tailwindcss`.


