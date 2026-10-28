# Bilingual foundation — Vietnamese / English

## UX / scope
Owner request: reusable bilingual i18n foundation. Existing screen structure is retained. Language selector is in the persistent topbar and works by keyboard through the existing Radix Select adapter. No interviews or operator UAT claimed. Design audit: avoid clearing edits on language switch, localize accessible names, keep technical identifiers and user-entered data unchanged, keep selector available on narrow screens.

## Shared API: @flowdocker/i18n
Private workspace package; depends only on React. `I18nProvider` wraps the host once. `useI18n()` exposes `locale`, `setLocale`, `t`, `validation`, `number`, `date`, `storageWarning`.

```tsx
const { t, number, date } = useI18n();
t("Bản ghi ({{count}})", { count: 3 });
number(1234.5);
date(new Date(), { dateStyle: "medium" });
```

The Vietnamese source message is its lookup key and fallback. Add the English translation in `packages/i18n/src/en.ts`. `MessageKey` exports the known key union. Parameter interpolation uses `{{name}}`; use complete messages, not concatenated translated fragments. Render translations through React text nodes, never raw HTML. Do not translate user names, entity/field labels, stored records, keys, enum/API values, or manifest JSON. Missing translations display the Vietnamese source. Dynamic validation currently has a narrow adapter for existing source-string errors; future backend contracts should use stable error codes and parameters.

Default: Vietnamese. `flowdocker.locale` stores only `vi` or `en`; unsupported values fall back to Vietnamese. Storage failure keeps switching usable in the current session and displays a notice. `document.documentElement.lang` follows selection. Intl helpers use vi-VN/en-US and default date timezone Asia/Ho_Chi_Minh; callers may explicitly override timezone. Switching language does not remount the app.

## Coverage
Translated: AppShell/navigation, Overview, Master Data Builder, Application Builder, Connection Manager (all four wizard steps), Permission Builder (matrix, scopes and simulated decisions), Profile/password dialog, Flow Studio (palette, default node metadata, mapping, structure errors and dry run feedback), shared UI default states, React Flow controls/keyboard hints, and isolated UI examples. Both VI and EN are required for new UI.

Stored record content, user-entered names/labels, technical IDs, enum values and manifest/input/output JSON remain unchanged. Display captions for technical enum values are translated without mutating the values. Only known default graph labels declare labelKey/detailKey; user labels remain verbatim. No backend/API/DB/Temporal/Teams/authorization or migrations changed.

## Reusable component impact
New shared i18n package consumed by AppShell, UI kit, Master Builder and E-Request host. UI wrappers depend on its public export only. No new third-party library or license introduced. Package version 0.1.0, private; platform readiness and independent second host validation remain pending.

## Evidence
Base SHA c6bd7f7, uncommitted changes. `npm run typecheck`, `npm run lint`, `npm test`: 6 files / 20 tests passed; `npm run build` passed. Tests cover interpolation/fallback, parameterized validation, document language, Intl number/date, storage denial, saved locale and preserving edits while switching.
Browser Playwright: switched VI→EN from Master Data, opened localized creation dialog, reloaded to confirm English persisted; switched EN→VI and reopened draft with input preserved; selector used at 375px. This is local frontend QA, not CI, backend integration or production UAT.
Visual QA at 375px found long English tabs and topbar labels overflowing. The topbar now retains language/theme controls while hiding its redundant demo badge on phones; tabs scroll inside their own container.

## Flag-only language picker refinement
Owner requested same topbar location, flags instead of visible language names and subtle animation. Added shared LanguagePicker using existing Radix Select: original SVG VN/UK flags, accessible names and typeahead labels, 180–220ms transitions, animated selection/chevron, and prefers-reduced-motion support. No emoji dependency or external image assets. Browser QA: pointer selection, keyboard Space/Home/Enter selection and switching at 375px with reduced-motion enabled passed. Typecheck, lint and build passed. No data/backend changes.


## Full current UI migration and ongoing gate
Owner instruction: all current UI and all future features must be bilingual. en.ts holds translations; vi.ts supplies source-message defaults plus Vietnamese captions for English-origin UI terms. Message placeholders are checked for parity and English catalog values are checked for untranslated Vietnamese.

`npm run i18n:check` scans application and package TSX (excluding tests) for direct JSX text, literal label/title/placeholder/accessible-name props, and missing literal `t()` keys. It runs as part of `npm run lint`. This static gate does not prove that every dynamic string or third-party label is localized, so changed workflows still require a bilingual interaction review. Native language names in the flag picker are intentionally retained for accessible language selection. Brand names and API/technical identifiers are invariant.

Impact: private i18n dependency added to Permission Builder and Flow Canvas; new optional node display-key metadata is additive. No executor, authorization, API or persisted enum changes. No new external dependency. UX evidence is based on owner instruction and code/browser audit; no fabricated research participants or production evidence.

Verification: typecheck, lint including i18n gate, 22 tests (6 files), build passed. Browser QA opened all seven routes in both languages, checked password dialog, Connection Wizard error and input preservation while switching, permission simulation reason, and nested dry-run mapping error switching EN→VI without resetting graph state. Changes remain uncommitted on base c6bd7f7.

## Owner reference correction
Latest visual reference supersedes the earlier flag-only presentation: trigger shows flag + VI/EN code; dropdown shows flags with native language names; selected option uses brand-tinted background and text, with no redundant check icon. Location and reduced-motion behavior retained. Compared the rendered open menu against the supplied image; typecheck and lint/i18n gate passed.
