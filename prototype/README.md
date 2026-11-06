# MatchPay interactive prototype

A clickable front-end prototype of MatchPay with an in-browser mock API. It is not the production code.

- Stack: Vite, React 18, TypeScript (strict), Ant Design 5 (with `@ant-design/icons` and `dayjs`), react-router-dom (HashRouter), TanStack Query.
- All UI copy is Vietnamese and lives in `src/i18n/vi.ts`. Seed free text (notes, mail subjects) lives in `src/mock/`.
- Data is seeded from the fictional Calderwood Group, kept in `localStorage` (key `matchpay-proto-v1`) and reset from the demo toolbar.
- Look: a neutral enterprise style, so the prototype can sit next to a company ERP (D-212..D-221). Ant Design 5 components themed from one token file, `src/theme/theme.ts` (primary `#0058B8`, system font stack, radius 6 and 8); no color is defined anywhere else, and a customer palette is applied by editing that file. Status is a colored dot plus text (`StatusDot` and the badges in `src/components/Tags.tsx`); the three hands (AI, Rule Engine, Person) are `Tag` variants in the same file; a signature is the static signed line `SignedMark` in `src/components/Bits.tsx`. `src/styles/matchpay.css` holds only what the library does not cover (layout helpers, invoice number, hand tags, uppercase labels, a few page rails). The prototype differs from the wireframes in look, not in content or states.
- Source of truth for layout and behaviour: `docs/04-uiux/` and `docs/03-information-architecture/`; operation names follow `docs/06-api/openapi.yaml`.

```bash
npm install
npm run dev      # development server
npm run build    # type check and production build into dist/
npm run preview  # serve dist/
```

Demo time is fixed at 31/10/2026 10:30 and advances one minute for each change. The demo toolbar (floating button, bottom right) resets data, switches persona, forces a page state, and shows the one-time code for signing.

## Screenshots

`scripts/screenshots.mjs` takes the PNGs in `docs/images/prototype/<role folder>/` (1440x900, full page, fresh seed data for each role; `50c-signing-queue-signed` is a viewport shot of the signed mark in the sign dialog; `12c-invoice-detail-match` is a viewport shot of the Three-way match popup of the invoice detail, `/invoices/inv-123?match=1&mark=1`, D-230). It needs Playwright installed in some folder and a running preview; point `NODE_PATH` at that folder's `node_modules`:

```bash
npm run build
npm run preview -- --port 4173 &
NODE_PATH=/path/to/folder-with-playwright/node_modules node scripts/screenshots.mjs
```

Set `BASE_URL` to use another address. The script overwrites files with the same names. Set `OUT_DIR` to write the PNGs to another folder instead. Set `ONLY=pilot` to take just the AP Accountant worklist (`10-invoice-worklist`), the invoice detail (`12-invoice-detail`), the reject dialog (`12b-invoice-detail-reject`), and the Chief Accountant hold page (`12-invoice-detail-hold`), then exit.

## Language rule

Vietnamese letters may appear only in `src/i18n/` and `src/mock/`. `python -X utf8 tools/check_docs.py` (repo root) fails otherwise.
