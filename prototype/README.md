# MatchPay interactive prototype

A clickable front-end prototype of MatchPay with an in-browser mock API. It is not the production code.

- Stack: Vite, React 18, TypeScript (strict), react-router-dom (HashRouter), TanStack Query.
- All UI copy is Vietnamese and lives in `src/i18n/vi.ts`. Seed free text (notes, mail subjects) lives in `src/mock/`.
- Data is seeded from the fictional Calderwood Group, kept in `localStorage` (key `matchpay-proto-v1`) and reset from the demo toolbar.
- Source of truth for layout and behaviour: `docs/04-uiux/` and `docs/03-information-architecture/`; operation names follow `docs/06-api/openapi.yaml`.

```bash
npm install
npm run dev      # development server
npm run build    # type check and production build into dist/
npm run preview  # serve dist/
```

Demo time is fixed at 31/10/2026 10:30 and advances one minute for each change. The demo toolbar (bottom right) resets data, switches persona, forces a page state, and shows the one-time code for signing.

## Screenshots

`scripts/screenshots.mjs` takes the PNGs in `docs/images/prototype/<role folder>/` (1440x900, full page, fresh seed data for each role). It needs a global Playwright and a running preview:

```bash
npm run build
npm run preview -- --port 4173 &
NODE_PATH=$(npm root -g) node scripts/screenshots.mjs
```

Set `BASE_URL` to use another address. The script overwrites files with the same names.

## Language rule

Vietnamese letters may appear only in `src/i18n/` and `src/mock/`. `python -X utf8 tools/check_docs.py` (repo root) fails otherwise.
