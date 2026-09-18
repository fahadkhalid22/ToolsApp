# ToolsApp

ToolsApp is a production-oriented multi-tool web platform built with Next.js,
TypeScript, and Tailwind CSS. The product name and logo are temporary
placeholders until final branding is selected.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Authentication

The account-entry routes live under `/login`, `/signup`, `/forgot-password`,
`/reset-password`, and `/verify-email`. UI components call the typed service
boundary in `src/lib/auth/`; they do not call a provider SDK directly.

Local development uses a deterministic in-browser mock when Supabase is not
configured. Production builds remain unconfigured instead of simulating a live
account. Copy `.env.example` and provide the public Supabase project URL and
publishable key when the provider adapter is implemented. Never expose a secret
or service-role key to the browser.

## Validation

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The locked visual references and design-system specification live in
`UI_References/`.
