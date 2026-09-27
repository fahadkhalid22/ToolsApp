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

## Discovery and local library

The centralized catalog in `src/data/` powers the tool directory, eight category
pages, global command palette, favorites, and history. Favorites, recent tool
activity, recent searches, and notification preferences are versioned in browser
local storage so the Part 03 experience works without an account or database.
Available tool routes include image and PDF workflows, percentage and GPA/CGPA
calculators, plus the local-first Word & Character Counter, QR Code Generator,
and JSON Formatter & Validator. The AI UGC Ad Script Generator includes a
server-side generation workflow; it requires the optional provider configuration
described below.
Text, JSON, and QR payloads stay in page memory; history stores only tool IDs,
timestamps, and high-level opened/completed status.

## AI generation boundary

The existing UGC script endpoint calls Gemini 3.8 Flash server-side when
`GOOGLE_AI_API_KEY` is configured in the ignored `.env.local` file (restart
the development server after changing it), or in deployment secrets. Never
use a `NEXT_PUBLIC_` prefix for this key. The key travels only in the upstream
request header, not URLs, browser responses or logs. Product briefs are sent
to Google for generation; consult Google's API data policies before sending
sensitive information. Structured JSON is validated before display. Without a key, the endpoint
reports that generation is unavailable; it never returns a fabricated script.

Until durable account persistence is available, the free allowance is a
**soft** limit of three successful generations per UTC day, tracked in server
memory by an anonymous HTTP-only session cookie. Failed requests do not consume
it. Clearing cookies, restarting the server, or running multiple server
instances can reset or bypass this allowance; it is not a billing entitlement
or abuse-proof rate limit. Do not treat it as a paid-plan control.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The locked visual references and design-system specification live in
`UI_References/`.
