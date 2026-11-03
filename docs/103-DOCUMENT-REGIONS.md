# Optional document header and footer

Owner requests Word-like header/footer frames with drag/drop and optional use.
Reuse section fields and the existing nested field designer, not a separate band
editor or copied content renderer. Add root-only `documentRegion` (header/footer)
and `regionEnabled` metadata. One of each; disabling retains authored children.
Designer shows framed, labelled drop areas; runtime hides labels and disabled
regions. Header/body/footer ordering is shared, and wizard steps count only body
fields while the bands remain visible. Existing legacy decoration is preserved.

Impact: reusable Forms schema/code assistance, renderer, validation/submission
visibility, designer history/drag targets; app sample demonstrates both regions.
No backend, API, identity, workflow, storage reset or document pagination/PDF work.
Additive metadata requires new strict clients; old drafts require no migration.
Use existing compact UI tokens, bilingual labels, keyboard insertion/parent
selection and undo. Test schema roundtrip, disabled-region validation/submission,
wizard behavior, field moves, and browser drop/optional toggle. Owner acceptance
pending; actual evidence appended after verification.

Verification 2026-11-03: 18 focused tests passed across document regions, direct content, code model and app drafts (output/playwright/document-regions-tests.log). Typecheck and lint/i18n passed. App and standalone Forms builds passed (logs under output/playwright). Designer screenshot captured; real pointer drop and owner visual acceptance remain pending. This is frontend-only; no printed-page repetition claim.
