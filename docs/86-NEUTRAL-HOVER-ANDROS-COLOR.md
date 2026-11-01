# Neutral hover and Andros red — 2026-11-01

## UX Research → UI/UX Design

Owner feedback: routine hover states turn red unnecessarily; use Andros red for actual brand accents. Shared UI primitives/tokens, not a business feature. Existing font sizes, spacing and layout remain unchanged.

Design: routine hover uses neutral gray surfaces/borders and normal foreground. Selected navigation and primary actions retain brand emphasis. Error/destructive colors retain their semantic purpose. Keyboard focus remains visible.

## Design Audit

The shadcn accent token was mapped to brand red/pink, affecting ghost/outline buttons and menu highlights. Legacy CSS separately colored table rows, profile links, toolbox, Flow palette, quick links, formula suggestions and form-card hover. These now use shared neutral hover tokens. Hover-only red text in Field/Empty links is removed.

Brand source: [Andros official logo SVG](https://www.andros.fr/wp-content/uploads/2023/04/Andros-new-logo.svg), linked from the official website's organization metadata. The asset contains `#E20E17` (also other artwork colors); this is the chosen Andros red for this app, not a claim of a published brand guideline. No upstream logo artwork is copied into the product.

## Interactive Prototype → Design to Code

The running app is the interaction harness. Shared tokens: `--fd-brand-solid: #e20e17`, light text accent `--fd-color-brand: #e20e17`, dark text accent `#ff8a8f`; neutral hover surfaces `#f1f1f1` / `#303030`, borders `#bdbdbd` / `#696969`. Solid brand fills keep white text in both themes. Separate semantic `text-brand` handles theme-aware link foregrounds. Updated favicon color.

Reusable component impact: shared `@flowdocker/ui` token mapping, button/badge link variants, Field/Empty hover styling. Host-specific form catalog uses the same border token; Forms suggestions use the same surface token. No Props/API/schema/engine/storage/authorization/Temporal/Teams/migration changes. No new dependencies.

## Verification

- Real browser via Playwright CLI: catalog hover at **1440×900, 1366×768, 390×844**, VI/light and EN/dark; neutral border colors verified and no page horizontal overflow.
- Designer toolbox hover verified in VI/light and EN/dark using actual pointer interaction.
- Screenshots: `output/playwright/neutral-hover-*.png`; interaction script: `output/playwright/neutral-hover-qa.cjs` (local QA artifacts).
- `npm run typecheck`, `npm run lint` including i18n, `npm run format:check`, `git diff --check`: PASS.
- `npm run build`: PASS with existing large-chunk warnings.
- No new unit tests for this reversible visual-only adjustment; browser interaction provides the relevant evidence. Owner visual review remains pending.
