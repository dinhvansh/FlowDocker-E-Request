# Third-party UI source and fonts

- `packages/ui/src/components/ui/*`: generated with `shadcn@4.23.0 add` (shadcn/ui registry source, MIT). Adapted locally for FlowDocker package and theme integration. https://ui.shadcn.com/
- `radix-ui`: MIT, Copyright WorkOS. Used by shadcn Select, Dialog, Tabs and Checkbox.
- Calendar and Popover were added from the shadcn/ui registry (MIT); Calendar uses `react-day-picker` (MIT, Copyright Giacomo Petrucci) and `date-fns` (MIT). FlowDocker owns its controlled DatePicker wrapper, not these upstream implementations. Bundled license texts are collected by the Forms library packaging step.
- `cn`: MIT, Copyright shadcn. Used by the generated components.
- `class-variance-authority`: Apache-2.0. Used for component variants.
- `@fontsource/inter`: bundles Inter by the Inter Project Authors under SIL Open Font License 1.1.
- `@xyflow/react` 12.12.0: MIT. Used by the original FlowDocker graph editor UI; React Flow attribution remains visible. The visual library does not include a connector or execution runtime.

The original license texts are present in the corresponding installed packages. FlowDocker owns its wrapper API and theme, not the upstream component or font source.
