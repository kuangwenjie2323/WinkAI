# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds the React app: `components/` for UI sections (chat, media generators, panels), `store/` for Zustand state, `services/` for model integrations and streaming wrappers, `utils/` for helpers, and `locales/` + `i18n.js` for translations. Tests live alongside code as `*.test.js` (e.g., `src/store/useStore.test.js`, `src/services/aiService.test.js`).
- `public/` contains static assets; `functions/` includes Vercel serverless handlers for file storage and proxy needs; `scripts/` has maintenance tasks like vertex verification. Avoid manual edits in `dist/`.

## Build, Test, and Development Commands
- `npm run dev` — start Vite dev server with hot reload.
- `npm run build` — produce production assets in `dist/`.
- `npm run preview` — serve the built output locally for validation.
- `npm run lint` — run ESLint (JS/JSX with React Hooks rules).
- `npm test` — run Vitest (includes React Testing Library setup).
- `npm run verify:vertex` — sanity-check Google Vertex env/config before deploying.

## Coding Style & Naming Conventions
- JavaScript/JSX with ES modules; prefer `const`/`let`, 2-space indentation, single quotes, and no semicolons to match existing files.
- Components in PascalCase (`ChatContainer.jsx`), hooks prefixed with `use`, Zustand slices kept small and testable. Pair styles with their component (`Component.css`) when possible.
- Run `npm run lint` before PRs; React Hooks rules and `no-unused-vars` (except ALL_CAPS globals) are enforced.

## Testing Guidelines
- Framework: Vitest + React Testing Library + `@testing-library/jest-dom`.
- Naming: co-locate `*.test.js` next to source. Use descriptive `describe/it` blocks focused on behavior (streaming, persistence, localization).
- Commands: `npm test` for full suite; `npx vitest src/services/aiService.test.js -t "streaming"` for a targeted spec.
- Keep coverage strong on `services/` (API payloads, streaming) and `store/` (state hydration/persistence). Mock network calls; avoid real API keys in tests.

## Commit & Pull Request Guidelines
- Commits: concise, imperative summaries; prefer scopes when helpful (e.g., `feat: add multimodal toast`, `fix: guard empty image uploads`).
- PRs: include a short description, test evidence (`npm test`, `npm run lint`), and UI screenshots/GIFs for visible changes. Link issues or tasks; note any new env vars (`VITE_*`). Do not include secrets or generated `dist/` artifacts.

## Security & Configuration Tips
- Configure API keys via `.env` (`VITE_OPENAI_API_KEY`, `VITE_ANTHROPIC_API_KEY`, `VITE_GOOGLE_API_KEY`, etc.) or the in-app Settings panel; never commit credentials.
- The app stores settings/history in browser LocalStorage—avoid logging keys or payloads in production builds. Keep serverless responses in `functions/api/` consistent with existing JSON shapes to prevent client breakage.

## Upload & Asset Storage (R2)
- Pages Functions for R2 uploads: `functions/api/upload/direct.js` returns a single-part presigned `PUT` URL; `functions/api/upload/multipart-init.js` issues per-part URLs plus `uploadId`; `functions/api/upload/multipart-complete.js` finalizes with `{ key, uploadId, parts: [{ partNumber, eTag }] }`.
- Env vars (Pages project): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, optional `R2_PUBLIC_URL` for public asset links. Existing `WINKAI_BUCKET` endpoints remain for small uploads/compat.
- Use direct upload for images/small files; large videos should go multipart: `PUT` each part URL, capture `ETag` from response headers, then call multipart complete.
