# FlowDocker UI

## DatePicker

Controlled date/date-time control built from the shared shadcn/Radix Popover and Calendar. Requires `I18nProvider` and the shared stylesheet; follows the containing `.fd-app` theme. Used by Form Studio's canvas and runtime. Interactive isolated examples: `npm run examples:ui`.

```tsx
<DatePicker
  label={t("Ngày")}
  value={date}
  onValueChange={setDate}
/>
```

| Prop | Contract |
| --- | --- |
| `value` | Controlled local `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm` with `withTime`; empty string clears |
| `onValueChange` | Emits the same local ISO format, without conversion to UTC |
| `label` | Required translated accessible name; use shared `Field` for a visible label |
| `withTime` | Defaults false; adds controlled hour/minute selectors and Done |
| `disabled` | Prevents opening/editing |
| `placeholder` | Optional translated empty-state text |
| `id`, `aria-invalid`, `aria-describedby` | Forwarded to the trigger; shared Field supplies validation links |

VI displays day/month/year, EN displays month/day/year. Month/year navigation supports 1900 through the current year + 100. Calendar arrows and keyboard navigation, Today, Clear and Escape dismissal are supported. This control accepts date selection rather than free-text entry. Date-only selection closes immediately; date-time stays open until Done, Clear or dismissal. Domain validation remains in the consuming engine.

Tests: leap-day ISO emission, language switching, clearing, date-time preservation and disabled/invalid states in `src/date-picker.test.tsx`. Upstream ownership and licenses: [notices](THIRD_PARTY_NOTICES.md).

CurrencyInput: shared controlled money textbox with `value: string` (canonical decimal, e.g. `1234567.80`) and `onValueChange(value: string)`, plus standard accessibility/disabled/placeholder input props. Uses the i18n locale: VI `1.234.567,80`, EN `1,234,567.80`. Type/paste using that locale's separators. Decimal strings retain precision and trailing zeroes; no rounding or JavaScript Number conversion. Grouping updates while typing and restores the caret for middle edits. Uses the existing Input tokens; all currency fields in Forms reuse it. Unit interaction coverage: `src/currency-input.test.tsx`.

Focus styling: shared focus tokens use neutral gray in Light/Dark. Within `.fd-app`, focused controls use one 2px outline with 2px offset; duplicate shadow focus rings are suppressed. Tabs use their underline alone, with no surrounding outline or border, including keyboard focus. Invalid controls retain the semantic error border via aria-invalid. Calendar captions do not add a second wrapper ring. Browser evidence: `output/playwright/focus-audit-qa.cjs`.

PeoplePicker: controlled `value: readonly string[]`, `onChange(ids: string[])`, `options: readonly ComboboxOption[]`, `label`, optional `multiple`, `disabled`, `id` and validation ARIA props. Option `description` can contain email/department; local search matches both name and description. Single choice closes the menu; multiple choice toggles IDs and keeps it open. Clear emits `[]`; Tab/Enter selects, Escape closes. Host supplies authorized options and source loading/errors. No identity provider or API calls inside the component. Isolated example: `examples/main.tsx`; interaction test: `src/people-picker.test.tsx`. Combobox additionally accepts optional `selectedValues` for multiple selection.


Form spacing: follow [shared sizing rules](../../docs/82-FORM-SPACING-AND-SIZING-RULES.md). FieldGroup owns a 16px field gap (12px in a desktop inspector); Field has zero outer margin and 6px internal gap. Sections use 24px. Single-line Input/Select/Combobox/DatePicker/PeoplePicker inside Field share 36px height, 32px compact inspector, 44px mobile; textarea min-height is 80px. Tokens are inherited by nested groups, no new props/schema changes. Legacy master fields now use FieldGroup; other existing grid parents keep their own explicit gaps. Typography is unchanged. Specialized repeating tables/document controls retain their local rules. Exact browser measurement evidence is recorded in docs/82.


Typography: [mandatory rules](../../docs/83-UI-TYPOGRAPHY-RULES.md). Inter 12/18px regular for routine UI, including portalled FlowDocker modal prose, shared hints/errors/notices/empty descriptions. Section titles 13/20px; dialog titles 14/20px; page toolbar titles 18/24px, all semibold. Use shared --fd-font-* tokens; avoid per-screen font overrides. Authored document content and technical code keep intentional local typography.
