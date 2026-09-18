# CODEX AUTONOMOUS ITERATIVE MASTER PROMPT — PART 01 OF 10
## ToolsApp — Foundation, Architecture, Design System & Homepage

You are working on **Part 01 of a 10-part implementation program** for a production-quality multi-tool web platform.

Your responsibility in this part is to establish a clean technical foundation and build the **Homepage** to a high degree of visual fidelity against the supplied locked reference image.

Do not attempt to complete later phases in this prompt. Do not redesign the product. Do not invent a final brand name or logo. Do not ignore the reference image.

---

# 0. ABSOLUTE PROJECT CONTEXT

## Local project root

`E:\Projects\ToolsApp`

All commands, file changes, installations, tests, screenshots, commits, and documentation must operate from this project root unless a tool absolutely requires otherwise.

## GitHub repository

`https://github.com/fahadkhalid22/ToolsApp.git`

## Git requirements

The project must remain connected to the repository above.

After **every atomic, meaningful, validated change**, you must:

1. inspect `git status` and `git diff`;
2. ensure no secrets, generated junk, build artifacts, local environment files, or unrelated changes are being committed;
3. run the validation appropriate to that change;
4. create a descriptive Git commit;
5. push the commit to the active remote branch when authentication and repository permissions allow it.

Do **not** accumulate the entire Part 01 into one giant commit.

Prefer a sequence similar to:

- `chore: bootstrap ToolsApp foundation`
- `feat: add shared design tokens and typography`
- `feat: add responsive application shell`
- `feat: build homepage from locked reference`
- `fix: refine homepage responsive behavior and accessibility`

The exact messages may differ based on the repository's actual state.

If push authentication fails, do not discard or rewrite valid local commits. Continue safely, keep the commits, and report the exact push blocker in the final report.

Never run destructive Git commands such as `git reset --hard`, force-push, delete branches, or discard user work unless the repository itself clearly requires a safe repair and no user work would be lost.

---

# 1. REFERENCE PACK — MANDATORY SOURCE OF VISUAL TRUTH

The UI reference pack is expected under:

`E:\Projects\ToolsApp\UI_References`

Before writing UI code, read:

- `UI_References\00_Design_System\DESIGN_SYSTEM.md`
- the project reference manifest if present in the repository root
- the Part 01 homepage reference:
  `UI_References\01_Foundation_Home\01_Homepage_Reference.png`

## Critical reference rule

The homepage reference image is the **primary visual source of truth for the homepage**.

You must faithfully translate its:

- overall page composition;
- left / center / right panel relationship;
- whitespace density;
- rounded container treatment;
- sidebar proportions;
- center hero placement;
- quick-action/tool-card placement;
- search/command bar placement;
- right-side recent/history panel;
- typography hierarchy;
- border/subtle-shadow language;
- visual calmness and premium SaaS feel.

Do **not** copy the source product's branding, logos, names, avatars, proprietary wording, or unrelated AI-chat product content.

The correct task is:

**preserve the reference's visual system and layout, but adapt the content to a 100+ online tools platform.**

If the design in your implementation starts drifting toward a generic template that merely has a sidebar and some cards, stop and compare it again against the reference image.

---

# 2. BRANDING IS INTENTIONALLY DEFERRED

The final website name, logo, and brand mark have **not** been chosen.

Do not spend time creating branding.

Until a final brand is provided:

- use `ToolsApp` only as a neutral temporary development placeholder;
- keep the placeholder name in a centralized constant/component so it can be replaced later in one location;
- use a simple neutral geometric placeholder icon or text mark;
- do not generate a logo;
- do not design a mascot;
- do not create a permanent wordmark;
- do not bake `ToolsApp` into dozens of files.

The visual color and typography system **is already locked**, even though the final name/logo is not.

---

# 3. LOCKED DESIGN SYSTEM

Use the values from `UI_References\00_Design_System\DESIGN_SYSTEM.md` as the authoritative source.

The key locked values are:

## Color theme — Sunset Orange

- Primary: `#F97316`
- Primary hover / pressed: `#EA580C`
- Secondary orange: `#FB923C`
- Soft orange: `#FFF1E6`
- Warm highlight: `#FFEDD5`
- App background: `#F8FAFC`
- Surface: `#FFFFFF`
- Main text: `#0F172A`
- Secondary text: `#64748B`
- Border: `#E2E8F0`
- Success: `#22C55E`
- Warning: `#F59E0B`
- Error: `#EF4444`

Primary gradient, only where visually justified:

`linear-gradient(135deg, #F97316 0%, #FB923C 100%)`

Orange is an **accent**, not a page-filling color.

Most of the interface should remain white / off-white / slate, matching the calm tone of the selected reference.

## Typography

- Headings: **Sora**
- Body / UI: **Inter**

Prefer framework-native optimized font loading such as `next/font/google` if the project is Next.js.

Do not substitute random fonts.

## Shape language

- controls: approximately 10–12px radius;
- cards: approximately 14–18px radius;
- primary shell / major panels: approximately 20–24px radius;
- subtle 1px borders;
- restrained shadows;
- no exaggerated glassmorphism;
- no neon gradients;
- no excessive decorative effects.

---

# 4. ENVIRONMENT GATE — DO THIS FIRST

Before implementing anything, determine the actual repository state.

## 4.1 Verify local path

Confirm that you are working in:

`E:\Projects\ToolsApp`

If the directory does not exist and you have permission to create it, create the parent path and clone the repository there.

If the directory exists:

- inspect it before cloning;
- do not overwrite existing files;
- if it is already the correct Git repository, use it;
- if it contains uncommitted user work, preserve it;
- if it is empty, clone the repository;
- if it is a Git repo with a different remote, stop destructive action and report that specific blocker.

## 4.2 Verify Git

Check:

- current branch;
- `git status`;
- configured remotes;
- whether `origin` points to `https://github.com/fahadkhalid22/ToolsApp.git` or its authenticated equivalent;
- whether there are pre-existing changes.

Do not blindly switch branches if doing so would risk work.

## 4.3 Inspect existing project

Read the repository before deciding what to initialize.

At minimum inspect:

- root files;
- package manager lockfile;
- `package.json` if present;
- existing framework configuration;
- source folder structure;
- README / governing docs;
- lint / format / test configuration;
- existing routes/components;
- `.gitignore`;
- environment templates.

## 4.4 Framework decision

If a valid web application already exists, preserve its stack unless there is a strong technical reason not to.

If the repository is effectively empty, bootstrap a modern production-ready frontend using:

- Next.js App Router;
- TypeScript;
- Tailwind CSS;
- ESLint;
- a clean `src/` structure;
- npm unless the repository already establishes another package manager.

Use the latest stable versions that work together at execution time. Do not pin arbitrary outdated versions from memory.

For icons, a lightweight consistent library such as `lucide-react` is acceptable.

Do not add large UI frameworks solely to avoid reproducing the reference accurately.

## 4.5 Reference availability

Confirm the following file can be opened/read:

`E:\Projects\ToolsApp\UI_References\01_Foundation_Home\01_Homepage_Reference.png`

If the reference pack is absent, do not invent the homepage and claim reference accuracy. Continue only with safe repository/environment preparation, then report the missing reference pack as the blocker.

---

# 5. PART 01 SCOPE

Part 01 must deliver all of the following:

1. safe project/repository foundation;
2. clean scalable frontend architecture;
3. global design tokens and typography;
4. global reset/base styles;
5. reusable shell/components needed by the homepage;
6. a faithful responsive homepage;
7. foundational tool metadata for the initial 15 tools;
8. navigation structure prepared for later phases;
9. accessibility baseline;
10. validation/build cleanliness;
11. atomic commits and pushes.

Part 01 must **not** fully implement:

- authentication screens;
- All Tools directory;
- category pages;
- file processing tools;
- image/PDF/calculator logic;
- AI provider integration;
- pricing/payment logic;
- Supabase production schema;
- final logo/name;
- later-phase support/legal pages.

You may create minimal route-safe placeholders only when necessary to prevent broken navigation, but do not spend time designing future pages before their reference phase.

---

# 6. REQUIRED ARCHITECTURE

Adapt to the existing project if necessary, but aim for a structure conceptually similar to:

```text
src/
  app/
    layout.tsx
    page.tsx
    globals.css
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      RecentToolsPanel.tsx
    home/
      HomeHero.tsx
      QuickToolCard.tsx
      ToolCommandBar.tsx
    shared/
      IconButton.tsx
      Badge.tsx
      ...
  data/
    tools.ts
    navigation.ts
  lib/
    constants.ts
    utils.ts
  types/
    tool.ts
```

Do not create abstraction for abstraction's sake.

The homepage should be composed from reusable pieces because later parts will reuse:

- the sidebar;
- tool cards;
- search;
- recent/history patterns;
- categories;
- badges;
- shell layout.

Keep the code readable and maintainable.

---

# 7. INITIAL 15 TOOL DATA — FOUNDATION ONLY

Create a typed data definition for the initial tool catalog so the homepage can render real tool names and future phases can reuse it.

The initial 15 tools are:

1. Image Compressor
2. Image Resizer
3. JPG → PNG Converter
4. PNG → JPG Converter
5. Passport & Visa Photo Maker
6. PDF Compressor
7. Merge PDF
8. JPG/PNG → PDF Converter
9. PDF → Word Converter
10. QR Code Generator
11. Word & Character Counter
12. Percentage Calculator
13. GPA / CGPA Calculator
14. JSON Formatter & Validator
15. AI UGC Ad Script Generator

Each tool record should support at least:

- id;
- slug;
- name;
- short description;
- category;
- icon identifier or icon component strategy;
- optional `featured`;
- optional `popular`;
- route.

Do not hardcode the same metadata independently across multiple components.

The catalog should be easy to extend from 15 to 100+ tools.

---

# 8. HOMEPAGE — STRICT VISUAL IMPLEMENTATION

The homepage route is `/`.

## 8.1 Overall canvas

Match the reference's desktop composition:

- soft neutral outer background;
- one dominant rounded application surface centered within the viewport;
- subtle border/shadow;
- substantial surrounding breathing room on desktop;
- three major regions inside the shell:
  - left navigation sidebar;
  - central content/workspace;
  - right recent/history panel.

The shell should feel like a polished standalone web app, not a conventional marketing landing page with a giant top nav.

## 8.2 Left sidebar

Adapt the reference while keeping its density and proportions.

Recommended content:

### Main navigation
- Home
- All Tools
- Favorites
- History
- Notifications
- Settings

### Category group
Use a small section heading such as `Categories` and include a subset fitting the reference height:

- Image Tools
- PDF Tools
- Calculators
- Student Tools
- Developer Tools
- AI Tools

Do not cram every future category into the sidebar if it makes the reference proportions inaccurate.

Use icons consistently.

Active Home item should visually match the reference's active pill treatment but use the locked orange system.

At the bottom, preserve the visual concept of a compact account/promo card, but do not assume a logged-in real user.

A suitable temporary state is:

- neutral avatar/icon;
- `Guest` or `Sign in to sync`;
- a small CTA such as `Sign in`;

or a compact `Pro` teaser, provided it does not dominate the UI.

Do not create fake personal data.

## 8.3 Central workspace

The central area must preserve the reference's clean vertical balance.

Include:

### Decorative focal mark
A small abstract CSS/icon motif in the area where the reference has its central visual mark.

This is **not** the final logo.

It can be a subtle orange/peach multi-point sparkle or geometric accent.

### Main heading
Use a concise heading appropriate to the tools platform, for example:

`What would you like to do today?`

Do not use a fake person's name.

### Supporting copy
Something short and neutral, for example:

`Search, convert, calculate, create, and get things done.`

Keep it understated like the reference.

### Quick tool cards
Match the reference's compact card row and card proportions.

Use three featured actions from the real 15-tool catalog, for example:

- Compress Image
- Merge PDF
- Calculate GPA

Cards should include:

- small icon/visual;
- tool name;
- one-line supporting description;
- hover/focus state;
- route target.

Do not turn them into oversized marketing cards.

### Bottom command/search bar
This is one of the homepage's most important interactions.

Match the reference's long, low-profile command input near the bottom of the central workspace.

Suggested placeholder:

`Search tools or type what you want to do...`

Include supporting controls only if they preserve the visual simplicity, such as:

- category/filter button;
- keyboard shortcut hint;
- search/submit icon.

Do not make it look like a chatbot input.

The interaction should be clearly a **tool finder**.

In Part 01, it may support basic client-side searching of the 15-tool dataset and present a compact suggestion popover. The complete global search experience belongs to Part 03.

## 8.4 Right recent/history panel

Adapt the reference's `Chat history` panel into a `Recent tools` / `Recent activity` panel.

Preserve:

- title row;
- small utility button/icon;
- compact search field;
- vertically stacked items;
- dividers/spacing;
- metadata timestamps/status;
- prominent bottom action.

Use plausible static/demo entries drawn from the real tool catalog, for example:

- Image Compressor
- Passport Photo Maker
- GPA Calculator
- PDF Compressor
- QR Code Generator

Do not fabricate user-specific private content.

The bottom action can be:

`View all tools`

or

`Open history`

depending on route readiness.

## 8.5 Visual fidelity expectations

Do not settle for merely having the same pieces.

Iteratively refine:

- sidebar width;
- right-panel width;
- card size;
- central content vertical position;
- search bar width/height;
- panel borders;
- outer radius;
- internal spacing;
- font weights;
- muted text values;
- icon sizing;
- shadow softness;
- whitespace.

The result should be immediately recognizable as an adaptation of the selected reference image.

---

# 9. RESPONSIVE BEHAVIOR

The desktop reference is the visual source of truth, but the application must be usable at all required breakpoints.

Verify at minimum:

- 1440px;
- 1280px;
- 1024px;
- 768px;
- 390px.

## Desktop

Keep the three-column composition where space allows.

## Medium screens

- reduce sidebar/right-panel widths carefully;
- avoid text clipping;
- keep quick cards readable;
- preserve hierarchy.

## Tablet

A sensible adaptation may be:

- sidebar collapses into an accessible drawer;
- center remains primary;
- recent tools moves below the center or into a toggle/panel.

## Mobile

At ~390px:

- use a compact top row/menu trigger instead of a permanently wide sidebar;
- use one-column quick tool cards;
- make search full width;
- move recent tools below main content;
- retain the same orange/neutral design language;
- no horizontal page scrolling;
- maintain 44px touch targets.

Do not simply scale the desktop page down until it becomes unreadable.

---

# 10. INTERACTION REQUIREMENTS FOR PART 01

The homepage should not be a dead mockup.

Implement at least:

- active navigation state;
- hover/focus states;
- keyboard-accessible sidebar/menu controls;
- homepage quick-tool card links;
- basic tool-search suggestions over the initial 15-tool data;
- escape/click-outside close for the suggestion popover if present;
- responsive sidebar drawer behavior;
- working recent-panel action where route availability permits.

Future routes may be minimal safe placeholders, but clicking an interactive element must not cause a runtime error.

---

# 11. ACCESSIBILITY REQUIREMENTS

Part 01 must establish good defaults for later phases.

At minimum:

- semantic `nav`, `main`, `aside`, headings and buttons;
- one meaningful H1;
- labels/accessible names for icon-only buttons;
- keyboard navigation;
- visible focus states;
- sufficient color contrast;
- no information encoded by color alone;
- responsive text without clipping;
- support `prefers-reduced-motion`;
- avoid unnecessary ARIA when native semantics work.

If you add a menu/drawer/popover, manage focus appropriately.

---

# 12. PERFORMANCE & QUALITY RULES

- Avoid loading giant image assets for UI decoration.
- Do not embed the reference screenshot in the finished page.
- Do not fake the UI by using the screenshot as a background.
- Recreate the layout with real semantic HTML/CSS/components.
- Prefer CSS and icon components for the abstract visual motif.
- Avoid unnecessary client components; use client-side code only where interaction requires it.
- Keep dependencies minimal.
- Do not introduce known-vulnerable or abandoned packages when a simpler approach exists.
- Do not expose secrets.
- Do not create `.env` values with real credentials.

---

# 13. ITERATIVE IMPLEMENTATION LOOP — MANDATORY

This is not a one-pass task.

Use the following loop repeatedly until the Part 01 acceptance criteria are satisfied.

## LOOP A — Inspect

1. Read the relevant existing files.
2. Open the reference image again.
3. Identify the largest current mismatch or missing requirement.
4. Choose one contained implementation unit.

## LOOP B — Implement

5. Make the smallest coherent set of changes needed for that unit.
6. Keep code maintainable and consistent with the established architecture.
7. Do not opportunistically redesign unrelated parts.

## LOOP C — Validate technically

8. Run the appropriate formatter/linter/type checks.
9. Run tests if present.
10. Run a production build at meaningful checkpoints.
11. Resolve warnings/errors introduced by your changes.

## LOOP D — Validate visually

12. Render the page locally.
13. If browser/screenshot capability is available, capture the homepage at desktop size and compare it directly with the locked reference image.
14. Inspect at 1440, 1280, 1024, 768 and 390 widths.
15. Compare composition rather than just text content.
16. Record the remaining visual mismatches internally.

## LOOP E — Refine

17. Fix the largest visual or interaction mismatch.
18. Repeat technical and visual validation.
19. Continue until improvements become minor and all acceptance criteria are met.

## LOOP F — Commit

20. Inspect the diff.
21. Ensure the change is coherent and validated.
22. Commit that atomic change.
23. Push it to the remote branch when possible.
24. Continue the next loop.

Do not claim the page is reference-accurate without actually performing a comparison.

---

# 14. VALIDATION COMMANDS

Use commands appropriate to the repository's package manager and scripts.

For a typical npm/Next.js project, validation should include equivalents of:

```powershell
npm run lint
npm run build
```

If a dedicated typecheck script does not exist, use:

```powershell
npx tsc --noEmit
```

If a formatter is configured, check it.

Do not add a redundant tool solely to satisfy this prompt if the repository already has an established equivalent.

Run a dev server for visual QA when necessary.

---

# 15. GIT DISCIPLINE

After each validated atomic change:

```powershell
git status
git diff
```

Then stage only intended files.

Never commit:

- `.env.local`;
- API keys;
- tokens;
- secrets;
- `.next/`;
- `node_modules/`;
- local screenshots unless intentionally part of project docs;
- editor junk;
- OS junk.

Push each commit when possible.

Before Part 01 is declared complete:

- working tree should be clean except intentionally uncommitted user changes that predated your work;
- all your commits should be present locally;
- remote should be up to date if push access is available.

---

# 16. PART 01 ACCEPTANCE CRITERIA

Do not stop until every applicable item below is true.

## Repository / architecture

- [ ] Work occurred in `E:\Projects\ToolsApp`.
- [ ] Git remote points to the specified ToolsApp repository.
- [ ] Pre-existing user work was preserved.
- [ ] Project has a clean scalable architecture.
- [ ] No secrets were committed.
- [ ] Initial 15-tool metadata is centralized and typed.

## Design system

- [ ] Sunset Orange theme is implemented consistently.
- [ ] Sora is used for headings.
- [ ] Inter is used for body/UI.
- [ ] Shared color/radius/spacing tokens exist.
- [ ] Final name/logo has not been invented.

## Homepage fidelity

- [ ] Overall shell matches the locked reference composition.
- [ ] Left sidebar proportions and density are faithful.
- [ ] Central hero placement is faithful.
- [ ] Quick tool cards match the reference's scale and spacing.
- [ ] Tool command/search bar matches the reference's placement and visual weight.
- [ ] Right recent-tools panel matches the reference structure.
- [ ] Neutral/orange adaptation feels cohesive and premium.
- [ ] Source product branding/content has not been copied.

## Responsiveness

- [ ] 1440 looks polished.
- [ ] 1280 looks polished.
- [ ] 1024 remains usable.
- [ ] 768 adapts intentionally.
- [ ] 390 has no horizontal overflow and remains fully usable.

## Interaction & accessibility

- [ ] Keyboard focus is visible.
- [ ] Main navigation is keyboard accessible.
- [ ] Mobile navigation is operable.
- [ ] Quick-tool cards work.
- [ ] Basic homepage tool search works.
- [ ] Icon-only controls have accessible names.
- [ ] No obvious contrast failure.

## Engineering quality

- [ ] Lint passes.
- [ ] Type check passes.
- [ ] Production build passes.
- [ ] No runtime console errors caused by Part 01.
- [ ] No broken imports/routes from Part 01.
- [ ] No screenshot-as-background shortcuts.
- [ ] No giant unnecessary dependencies.

## Git

- [ ] Work is split into logical commits.
- [ ] Each completed logical change was committed after validation.
- [ ] Commits were pushed when access permitted.

---

# 17. DO NOT DO THESE THINGS

Do **not**:

- ask the user to choose a final website name;
- design a final logo;
- change the locked Sunset Orange theme;
- change Sora/Inter;
- replace the chosen homepage layout with your own idea;
- use a generic dashboard template just because it is faster;
- implement all ten phases now;
- add payment processing;
- add an AI provider API in Part 01;
- create fake user accounts;
- claim visual accuracy without comparison;
- leave the build broken;
- commit secrets;
- make one giant end-of-task commit;
- push destructive history rewrites.

---

# 18. FINAL SELF-AUDIT BEFORE STOPPING

Before reporting completion, perform one last end-to-end audit.

1. Re-open the homepage reference image.
2. Render the implemented homepage.
3. Compare the two side-by-side if tooling permits.
4. Check panel proportions.
5. Check vertical alignment.
6. Check whitespace.
7. Check font scale and weight.
8. Check orange usage is restrained and consistent.
9. Check the tool cards and search bar.
10. Check right-panel density.
11. Check mobile behavior.
12. Run lint/typecheck/build again.
13. Check `git status`.
14. Push final validated Part 01 commit if needed.

If any significant mismatch remains, fix it and repeat the audit.

---

# 19. FINAL REPORT FORMAT

When Part 01 is actually complete, provide a concise truthful report with:

### Part 01 status
`COMPLETE` or `BLOCKED`

### Implemented
Briefly list the foundation/homepage work completed.

### Reference fidelity
State how the locked homepage reference was applied and what responsive adaptations were made.

### Validation
Report actual results for:

- lint;
- type check;
- build;
- responsive checks;
- accessibility checks performed.

### Git
List:

- branch;
- commit hashes/messages created in Part 01;
- whether each was pushed;
- any push/auth blocker if applicable.

### Remaining work
List only work intentionally deferred to Parts 02–10.

Do not claim later phases are complete.

---

# EXECUTION DIRECTIVE

Begin now with the environment gate.

Do not redesign the homepage.
Do not wait for naming/branding decisions.
Use `ToolsApp` as a replaceable placeholder only.
Strictly follow the locked reference image and the shared Sunset Orange + Sora/Inter design system.
Build, compare, fix, validate, commit, push, and repeat until **Part 01 is genuinely complete**.
