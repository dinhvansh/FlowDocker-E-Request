# Form header and footer designer

## UX Research → UI/UX Design → Design Audit

Owner requests logo/images, aligned text and editable header/footer in place of the hardcoded canvas title/help. Evidence: owner annotated screenshot and existing FormCanvas/FormRenderer code. This is task feedback and a code audit, not interviews. Reuse shadcn Field/FieldGroup/Select/Checkbox/Modal/Tabs and shared tokens; add no primitive/dependency.

Design: one toolbar entry, Header/Footer tabs, enable/divider toggles, 1–3 columns, column selector and title/text/image content. VI/EN text, left/center/right alignment, three authored content sizes and bold. Immediate visual/code synchronization and existing designer undo; no Apply step. Presets for logo/title/information and signature areas. Signature areas are presentation only, not digital signing. Authoring hint/version stay outside the document paper. Preview uses the same renderer.

Audit: retain hidden column slots when narrowing layout, preserve old forms, never inject HTML/CSS or fetch remote images, bound content/images and reject SVG. Local raster upload is resized/embedded; no upload service. Cancelled/stale image tasks must not overwrite another cell or closed editor. Mobile keeps column layout but wraps text and constrains images. Verify keyboard/modal close, disabled state, both languages/themes, responsive layouts and code round-trip.

## Impact map

- Reusable domain UI: FormBandView, FormDecorationEditor and typed optional FormDefinition.decoration; exported from existing Forms package, used by both E-Request and existing independent Forms example through FormDesigner/FormRenderer.
- Schema/API: additive optional metadata; old definitions render their normal title. Align import guards, authoring JSON schema and code completion; no field/validation/calculation rewrite. Existing schemaVersion 1/2 retained, no saved-data migration.
- Storage: images are part of authored local schema; existing save/export/recovery applies. No runtime values, identity or provider data added.
- Security: only bounded embedded PNG/JPEG/WebP data URLs; no external URLs, HTML, SVG or code execution. No new authentication/authorization enforcement.
- Temporal/Teams/backend: no change, no PDF-generation or actual signing claim.

## Interactive Prototype → Design to Code

Existing designer is the interactive harness. Actual verification and owner acceptance tracked below after implementation.

## Verification evidence

- `npm run typecheck`: PASS.
- `npm run lint` (including i18n): PASS.
- `npm run format:check`: PASS.
- Browser: `output/playwright/form-decoration-qa.cjs` PASS. Actual raster upload/resizing, three-column header/footer, VI/EN text, undo/redo, visual/code synchronization, save/reload and shared preview rendering verified. No page errors or horizontal overflow at 1440×900 VI/light, 1366×768 EN/dark and 390×844 EN/dark; mobile editor fits.
- Independent package consumer: `output/playwright/form-decoration-independent-qa.cjs` PASS on the existing standalone Forms example. Public designer editor and live footer work without E-Request imports.
- Screenshots/logs use synthetic test data only. Browser automation ran in an isolated session; owner acceptance is pending.
- Initial targeted failures exposed an empty-field test fixture and completion cursor offsets; both tests were corrected. Two existing canvas test timeouts were raised from 15 to 60 seconds for this constrained machine; assertions are unchanged.
- Reusable Forms package version: 0.4.0. This is a local reusable package, not a public registry publication.
- Final regression: `npm test -- --maxWorkers=1 --testTimeout=60000` PASS, 42 files / 196 tests, 1202.97 seconds. Full log: `output/playwright/form-decoration-full-tests.txt`. Initial targeted-run failures are retained separately as `form-decoration-initial-tests.txt`; they are not the final result.
- `npm run build`: PASS (1m 15s). Vite reports existing large-chunk warnings; no build failure.
- `npm run build:forms`: PASS (1m 5s); prepared private `@flowdocker/forms` 0.4.0 with 76 bundled license entries.
- `npm pack ./dist/forms-library --pack-destination ./dist --json`: PASS; local artifact `dist/flowdocker-forms-0.4.0.tgz`. Package inventory/checksum recorded in `output/playwright/form-decoration-package-log.json`; no registry publication.
