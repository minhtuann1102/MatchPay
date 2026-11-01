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
