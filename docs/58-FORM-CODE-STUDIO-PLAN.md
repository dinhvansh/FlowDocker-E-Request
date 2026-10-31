# Form Code Studio implementation plan

## Contract
- The visual designer and code view edit the same FormDefinition, including all field settings.
- Valid code updates the canvas immediately. Invalid intermediate code stays editable while the canvas retains the last valid form.
- Keep all existing drag/drop, field inspectors and runtime capabilities.
- No Apply button, arbitrary JavaScript execution or backend dependency.

## Slices
1. Shared schema editor and live visual editing, invalid-code recovery and identity preservation.
2. Dedicated code editor: syntax colors, JSON schema autocomplete, precise diagnostics, undo history and split layout.
3. Field selection maps to code locations; code locations select fields; preserve cursor and unsaved drafts.
4. Consolidate advanced configuration and test-data preview using the existing engine.
5. AI-ready schema documentation and exportable context; actual provider integration is a separate step.
6. Responsive, VI/EN, light/dark and keyboard audit with browser screenshots.

Each finished slice is verified, committed and pushed before the next slice.
