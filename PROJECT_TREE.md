# Project Structure - Helix Foundation

Below is the complete file directory tree for the **helix-foundation** project:

```text
helix-foundation/
├── .lovable/
│   └── project.json
├── public/
│   ├── favicon.jpg
│   └── robots.txt
├── src/
│   ├── app/
│   │   └── config/
│   │       ├── modules.ts
│   │       └── navigation.ts
│   ├── components/
│   │   ├── data-table/
│   │   │   ├── column-filter.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── index.ts
│   │   │   ├── table-pagination.tsx
│   │   │   └── types.ts
│   │   ├── hemp/
│   │   │   └── brand.tsx
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── module-placeholder.tsx
│   │   │   ├── page-header.tsx
│   │   │   └── topbar.tsx
│   │   ├── shared/
│   │   │   └── confirm-dialog.tsx
│   │   └── ui/
│   │       ├── accordion.tsx
│   │       ├── alert-dialog.tsx
│   │       ├── alert.tsx
│   │       ├── aspect-ratio.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── breadcrumb.tsx
│   │       ├── button.tsx
│   │       ├── calendar.tsx
│   │       ├── card.tsx
│   │       ├── carousel.tsx
│   │       ├── chart.tsx
│   │       ├── checkbox.tsx
│   │       ├── collapsible.tsx
│   │       ├── command.tsx
│   │       ├── context-menu.tsx
│   │       ├── dialog.tsx
│   │       ├── drawer.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── empty-state.tsx
│   │       ├── form.tsx
│   │       ├── hover-card.tsx
│   │       ├── input-otp.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── loading.tsx
│   │       ├── menubar.tsx
│   │       ├── navigation-menu.tsx
│   │       ├── pagination.tsx
│   │       ├── password-input.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── resizable.tsx
│   │       ├── scroll-area.tsx
│   │       ├── select.tsx
│   │       ├── separator.tsx
│   │       ├── sheet.tsx
│   │       ├── sidebar.tsx
│   │       ├── skeleton.tsx
│   │       ├── slider.tsx
│   │       ├── sonner.tsx
│   │       ├── status-badge.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       ├── textarea.tsx
│   │       ├── toggle-group.tsx
│   │       ├── toggle.tsx
│   │       └── tooltip.tsx
│   ├── features/
│   │   └── auth/
│   │       ├── auth-context.tsx
│   │       ├── mock-auth.ts
│   │       └── types.ts
│   ├── hooks/
│   │   └── use-mobile.tsx
│   ├── lib/
│   │   ├── error-capture.ts
│   │   ├── error-page.ts
│   │   ├── lovable-error-reporting.ts
│   │   └── utils.ts
│   ├── modules/
│   │   ├── quality/
│   │   │   ├── mocks/
│   │   │   │   └── quality-data.ts
│   │   │   ├── services/
│   │   │   │   └── quality-service.ts
│   │   │   └── types.ts
│   │   └── settings/
│   │       ├── components/
│   │       │   ├── config-form-modal.tsx
│   │       │   └── config-workspace.tsx
│   │       ├── mocks/
│   │       │   ├── audit.ts
│   │       │   ├── config-records.ts
│   │       │   ├── personnel.ts
│   │       │   └── user-accounts.ts
│   │       ├── services/
│   │       │   ├── audit-service.ts
│   │       │   ├── config-service.ts
│   │       │   ├── personnel-service.ts
│   │       │   └── user-account-service.ts
│   │       └── types.ts
│   ├── routes/
│   │   ├── README.md
│   │   ├── __root.tsx
│   │   ├── app.index.tsx
│   │   ├── app.quality.approvals.tsx
│   │   ├── app.quality.archive.tsx
│   │   ├── app.quality.checklists.tsx
│   │   ├── app.quality.dashboard.tsx
│   │   ├── app.quality.index.tsx
│   │   ├── app.quality.my-tasks.tsx
│   │   ├── app.quality.policy-documents.tsx
│   │   ├── app.quality.reviews.tsx
│   │   ├── app.quality.tsx
│   │   ├── app.settings.audit-log.tsx
│   │   ├── app.settings.dashboard.tsx
│   │   ├── app.settings.debrief.tsx
│   │   ├── app.settings.index.tsx
│   │   ├── app.settings.parts-inventory.tsx
│   │   ├── app.settings.personnel.tsx
│   │   ├── app.settings.quality.tsx
│   │   ├── app.settings.tools.tsx
│   │   ├── app.settings.training.tsx
│   │   ├── app.settings.tsx
│   │   ├── app.settings.user-accounts.tsx
│   │   ├── app.tsx
│   │   ├── index.tsx
│   │   └── login.tsx
│   ├── services/
│   │   └── api/
│   │       └── client.ts
│   ├── types/
│   │   └── index.ts
│   ├── routeTree.gen.ts
│   ├── router.tsx
│   ├── server.ts
│   ├── start.ts
│   └── styles.css
├── .gitignore
├── .prettierignore
├── .prettierrc
├── AGENTS.md
├── bunfig.toml
├── components.json
├── eslint.config.js
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
└── vite.config.ts
```
