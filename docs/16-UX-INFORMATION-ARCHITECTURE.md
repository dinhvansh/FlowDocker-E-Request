# Information Architecture and Screen Contracts

**Status:** UX target, not implemented screens.

## Navigation
```text
E-Request Portal
├── Dashboard
│   ├── My Pending Actions / KPI
│   └── Latest Requests
├── Create Request
│   ├── Payment Request
│   ├── Business Trip
│   └── Other Published Request Types
├── My Requests
│   ├── Drafts
│   ├── In Approval
│   ├── Changes Requested
│   └── Completed / Rejected
├── My Tasks
│   ├── Awaiting My Decision
│   └── My Completed Decisions
├── Request Detail
│   ├── Form Data (locked revision)
│   ├── Attachments
│   ├── Approval Timeline
│   ├── Payment/Trip status where relevant
│   └── Final PDFs
└── Administration
    ├── Form Studio
    ├── Workflow Studio
    ├── Request Types / Bindings
    ├── Organization / Users / Roles
    ├── Teams Integration
    └── Audit / Operations
```

## Form Studio screen
Three zones: left component palette, central sortable form canvas, right field properties. Top: Draft, Preview, Validate, Publish, Version history. Supported properties: stable key, localized labels, type, required, defaults, role visibility, validation, condition builder, lookup source. Show publish blockers inline. Avoid accepting untrusted executable rules.

## Workflow Studio screen
Left node palette (start/end, approval, condition, parallel/join, finance, PDF, notification, webhook). Center workflow graph (zoom/minimap, accessible status). Right node properties (assignee policy, field expression, TRUE/FALSE branches, returns/rejects, business status). Top: Save Draft, Validate, Preview Path, Publish, Versions. Preview paths should show matched conditions using synthetic fixtures; not imply execution has happened.

## Employee request UI
Select request type → display published Form.io render → attach supporting files → save draft → submit with confirmation → view request number/current step/history. Returned request opens a **new editable revision** with reviewer feedback and explicit resubmit.

## Approver UI
My Tasks list: type, request no., requester, department, amount (if permitted), received time, due time if configured. Detail: summary, expanded data, attachments, prior decisions, comments. Bottom actions Approve, Reject, Return for Changes; require comment on reject/return. Show concurrent-state conflict and refresh rather than retrying blindly.

## Finance UI
Separate tabs `Waiting for Review`, `Approved / Awaiting Payment`, `Processing`, `Paid / Failed`. Only designated Finance roles can set settlement state. Display approval and payment dates separately; mask account fields for non-Finance users.

## Teams card UX
Card summary + safe details + two decisions + deep link to full request. Once decided, replace buttons with actor/time/status. Do not embed secure attachment tokens or private beneficiary account data.

## Responsive/accessibility
Desktop-first admin studios with keyboard navigation, low-complexity mobile reading/approval screens, focus labels, validation summary, non-color status indicators, loading/empty/error states. Admin graph editor mobile support can be read-only in V1, but actual approval pages should be responsive.
