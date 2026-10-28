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
