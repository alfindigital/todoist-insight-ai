# CLAUDE.md — Todoist Insight AI

> **Handoff / project memory.** This single file is everything needed to continue this
> project in a new account or a fresh session. It is auto-read by Claude Code.
>
> _Catatan (ID): file ini berisi ringkasan, riwayat, pengetahuan teknis, dan panduan lanjutan
> untuk melanjutkan project di akun baru. Cukup buka repo ini di akun baru — Claude akan membaca
> file ini otomatis._

---

## 1. Summary

**Todoist Insight AI** is a fork of the open-source **Todoist Dashboard**
(`uncazzy/todoist-dashboard`, MIT) that adds an **AI Productivity Coach** powered by Claude.

- **Repo:** `alfindigital/todoist-insight-ai`
- **What the base app does:** you log in with Todoist (OAuth), it pulls your completed +
  active tasks and renders analytics (productivity score, focus times, streaks, project
  distribution, neglected tasks, heatmaps, etc.). All base analytics are plain client-side math.
- **What we added:** an opt-in panel near the top of the dashboard. Click **"✨ Analyze with
  AI"** → a compact summary of your Todoist data is sent to Claude → you get a short,
  personalized assessment + 3–5 concrete recommendations (rendered as Markdown).
- **Status:** feature built, local `next build` passes, deployed green on Vercel.
  Draft **PR #1**: https://github.com/alfindigital/todoist-insight-ai/pull/1
- **Owner is a non-coder** — explain things in plain language and guide click-by-click.

---

## 2. History (what happened so far)

1. **Assessed the fork.** Confirmed it's a complete, up-to-date copy of Todoist Dashboard
   (v0.7.0, Next.js 14). No AI existed. Architecture is ideal for AI (server API routes for
   secret-safe calls; data already aggregated; `react-markdown` already a dependency).
2. **Chose the first feature** (with the owner): **AI Productivity Coach** (a one-click
   narrative analysis), over chat / weekly-review / smart-prioritization. Those remain as
   future options.
3. **Built it.** Added the Anthropic SDK, a server route, a client panel, wired it into the
   dashboard, documented env + setup. Verified with a full `npm run build` (lint + strict
   type-check + compile all pass). Committed (`635d54a`) and pushed to the dev branch.
4. **Opened draft PR #1.** Repo has **no GitHub Actions**; the de-facto CI is the **Vercel**
   preview deploy, which went **`success`** for this branch.
5. **Auth debugging (in progress, owner's task).** Owner reported: after authorizing Todoist
   on the deployment, it loops back to login. Diagnosed as a config issue (NOT a code bug) —
   see Knowledge §“Auth & the login-loop”. Fix is env + Todoist redirect-URL + use a stable
   domain. Awaiting owner to confirm their `NEXTAUTH_URL` and which URL they log in on.

---

## 3. Knowledge (architecture, code, gotchas)

### Tech stack
- **Next.js 14.2.23** (Pages Router, _not_ App Router → no `"use client"` directives), React 18,
  **TypeScript (very strict)**, Tailwind CSS, **NextAuth v4** (Todoist OAuth, **JWT** session
  strategy), ECharts/D3, `react-markdown` v8, `framer-motion`. **Node 22**, npm.
- `@anthropic-ai/sdk` `^0.104.2` (added by us; server-side only).
- `prisma` / `@next-auth/prisma-adapter` are in `package.json` but **NOT used** by the auth
  config — no database is required.

### Repo & branches
- Dev branch: **`claude/youthful-brown-167lf2`** (all work + PR #1 live here). Develop here,
  commit, push, keep the PR updated. Don't push to `main` without explicit permission.
- GitHub access in-session is via the GitHub MCP tools (`mcp__github__*`), scoped to
  `alfindigital/todoist-insight-ai`. There is no `gh` CLI.

### Base data flow (how the dashboard gets data)
- `hooks/useDashboardData.ts` → `GET /api/getTasks` → Todoist Sync API v9 (uses the OAuth
  access token from the NextAuth JWT). Caches in `localStorage` (`CACHE_DURATION` 30 min,
  `STALE_DURATION` 24 h, `MAX_TASKS` 2500). See `utils/constants.ts`.
- `DashboardData` (in `types/index.ts`) is the central shape: `allCompletedTasks`,
  `activeTasks`, `projectData`, `karma`, goals, etc.
- Analytics live in `utils/calculate*.ts` and are reused by the AI summary builder.

### The AI feature (what / where / how)
- **`pages/api/ai-insights.ts`** (server route):
  - `POST` only; auth-gated with `getToken({ req })` (same pattern as `getStats`/`getTasks`).
  - Reads `ANTHROPIC_API_KEY` (server-side; never exposed to browser). If missing → friendly
    **503 "AI not configured"** (dashboard still works without it).
  - Model from `ANTHROPIC_MODEL`, default **`claude-sonnet-4-6`**.
  - Calls `client.messages.create({ model, max_tokens: 2048, system, messages })`
    (non-streaming — output is short). Returns `{ insight, model }`.
  - Typed error handling: `Anthropic.AuthenticationError` → 502, `RateLimitError` → 429,
    `APIError` → 502, else 500.
- **`components/AICoach.tsx`** (client panel):
  - `buildSummary(allData)` produces a compact, **privacy-conscious** `AIInsightSummary`
    (aggregates + small samples, NOT raw history): productivity score (mirrors the Insights
    formula), completion rates, most-productive day/time, best day of week, top projects,
    ~15 recent completed task titles, ~8 oldest active ("neglected") tasks, tasks-by-priority,
    last-7-days counts. Reuses `utils/calculate*` + `getDayOfWeekName`.
  - Button-triggered only (never auto-runs → no surprise cost). Renders the Markdown reply via
    `react-markdown` with a `components` map styled for the dark theme. Has loading/error/empty
    states.
- **`types/index.ts`**: `AIInsightSummary` interface (shared client + server).
- **`components/Dashboard.tsx`**: `<AICoach allData={…filtered data…} />` mounted right after
  `<QuickStats>`, respecting the project-picker filter.
- **Docs:** `.env.example` and `README.md` document the keys + setup + cost/privacy.
- The SDK is bundled **server-side only** (the `/api/ai-insights` route ships 0 B of client JS);
  the browser bundle is unaffected and the key stays secret.

### Environment variables (all set in Vercel → Settings → Environment Variables)
| Var | Purpose | Notes |
|---|---|---|
| `TODOIST_CLIENT_ID` / `TODOIST_CLIENT_SECRET` | Todoist OAuth app | from developer.todoist.com/appconsole.html |
| `NEXTAUTH_URL` | Base URL of the deployment | **must exactly match the URL you browse**; `https://…`, no trailing slash |
| `NEXTAUTH_SECRET` | Encrypts the session JWT | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | Enables the AI panel | optional; without it the panel shows "not configured" |
| `ANTHROPIC_MODEL` | Which Claude model | optional; default `claude-sonnet-4-6` |
- `pages/api/auth/[...nextauth].ts` **throws at module load** if any of the 4 auth vars
  (`NEXTAUTH_SECRET`, `TODOIST_CLIENT_ID`, `TODOIST_CLIENT_SECRET`, `NEXTAUTH_URL`) is missing →
  `/api/auth/*` would 500. So if OAuth even starts, those 4 are set.

### Auth & the login-loop issue (owner's current blocker)
- **Symptom:** after approving Todoist, the app returns to the login screen (loop).
- **Why:** `pages/api/auth/[...nextauth].ts` builds the OAuth redirect as
  `` `${process.env.NEXTAUTH_URL}/api/auth/callback/todoist` ``. Session is a **JWT cookie set
  on the `NEXTAUTH_URL` domain**. If you browse a **different** domain than `NEXTAUTH_URL`
  (classically a **Vercel per-branch preview URL** like `…-git-<hash>-….vercel.app`), the OAuth
  state / session cookie is set on the wrong host → on return the app sees "not logged in" →
  login again. **Not a code bug** — the upstream app works fine in production.
- **Fix:** use ONE stable domain (the Vercel **Production** domain or a custom domain). Then:
  1. `NEXTAUTH_URL` = that exact domain (https, no trailing slash).
  2. Todoist App Console → **OAuth redirect URL** = `<NEXTAUTH_URL>/api/auth/callback/todoist`.
  3. Ensure `NEXTAUTH_SECRET`, `TODOIST_CLIENT_ID/SECRET` set; **Redeploy**; log in on that
     same domain.
  - Preview URLs can't be used for OAuth (Todoist allows only one redirect URL). For quick
    testing, run locally with `NEXTAUTH_URL=http://localhost:3000` and a matching Todoist
    redirect URL.
- **Quick check:** on the Todoist consent page, the `redirect_uri=…` in the address must match
  the domain in your browser's address bar.

### Deployment (Vercel)
- The repo is connected to Vercel; **every push auto-deploys**. Per-branch = preview;
  `main`/production = stable domain (see Vercel → Domains).
- **CI = the Vercel commit status** (context `"Vercel"`). There are **no GitHub Actions**.
  Read it via `mcp__github__pull_request_read` (`get_status` / `get_check_runs`).
- Webhooks deliver **CI failures + review comments**, but **not** CI success, new pushes, or
  merge-conflict transitions. `send_later` was **not available** this session, so periodic
  self-rechecks couldn't be scheduled.

### Claude API notes (for any future AI work)
- Use the official **`@anthropic-ai/sdk`** (this is a TS project). Don't hand-roll HTTP.
- A bundled **`claude-api` skill** exists in Claude Code — invoke it before writing AI code;
  it has authoritative model IDs, SDK syntax, pricing, streaming, tool-use, etc.
- Model IDs (as of this session): `claude-opus-4-8` (most capable Opus / Anthropic's default
  recommendation), `claude-sonnet-4-6` (balanced — **our chosen default** for cost, owner-approved),
  `claude-haiku-4-5` (cheapest), `claude-fable-5` (most capable overall, priciest).
  Use exact strings; never add date suffixes.
- For short single-shot outputs (like the coach), non-streaming + `max_tokens: 2048` is fine.
  For long outputs (>~16K tokens) you must stream. Adaptive thinking
  (`thinking: {type:"adaptive"}`) is available but we omitted it here to keep it fast/cheap.
- Cost: one coach call ≈ a fraction of a cent. Set a spending cap in console.anthropic.com.

### TypeScript strictness gotchas (tsconfig is very strict)
Flags on: `noUnusedLocals`, `noUnusedParameters`, `exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`, `useUnknownInCatchVariables`, `strict`, `noImplicitReturns`, …
- **Unused vars error.** Prefix intentionally-unused params with `_`; for react-markdown
  component overrides, destructure only the props you use (`{ children }`) — do **not** spread
  `{...props}` (it leaks the `node` prop and risks unused-var / DOM warnings).
- **`catch (e)` is `unknown`** → narrow with `e instanceof Error` / `instanceof Anthropic.X`.
- **Array access returns `T | undefined`** (`noUncheckedIndexedAccess`) — guard it.
- **react-markdown v8:** `import ReactMarkdown, { Components } from 'react-markdown'`; default
  export; style via the `components` prop.
- **ESLint `react/no-unescaped-entities`:** escape quotes/apostrophes in JSX
  (`&apos;`, `&ldquo;`, `&rdquo;`).
- Always run `npm run build` before pushing — it runs lint + type-check + compile.

---

## 4. Skills & Playbook (how to continue)

### Local dev
```bash
npm install
# create .env.local with the 5 env vars above (NEXTAUTH_URL=http://localhost:3000 for local)
npm run dev          # http://localhost:3000
```

### Build & verify (do this before every push)
```bash
npm run build        # lint + strict type-check + compile; must pass
npm run lint         # lint only
```

### Git / PR workflow
- Work on **`claude/youthful-brown-167lf2`**. Commit with clear messages; push with
  `git push -u origin claude/youthful-brown-167lf2`; PR #1 updates automatically.
- Create PRs as **drafts**. Don't push to `main` without explicit permission.

### Deploy & turn the AI on
1. Push → Vercel auto-deploys. Check status via the Vercel commit status (or the dashboard).
2. In Vercel env vars, set `ANTHROPIC_API_KEY` (+ optional `ANTHROPIC_MODEL`) → **Redeploy**.
3. Without the key the app runs fine; the AI panel just says "not configured".

### Immediate next step (owner's blocker)
Get login working: set `NEXTAUTH_URL` to the stable production domain, set the matching Todoist
**OAuth redirect URL**, redeploy, and log in on that same domain. See Knowledge §Auth.

### Roadmap / future AI features (owner was interested)
- **Chat Q&A** ("ask your tasks") — needs conversation state; can reuse the summary + the
  existing API-route pattern.
- **Weekly Review generator** — scheduled or on-demand reflective summary.
- **Smart prioritization** — rank neglected/active tasks with reasons.
- All can follow the same architecture: build a compact summary client-side → POST to a
  server route → call Claude → render Markdown. Keep keys server-side; keep it button-triggered.

### Migration checklist (new account)
1. Ensure the new account has access to the GitHub repo `alfindigital/todoist-insight-ai`
   (and Vercel project, if continuing deploys).
2. Clone the repo and open it in Claude Code — this `CLAUDE.md` loads automatically.
3. `npm install`, copy env vars into `.env.local` (and into the new Vercel project if needed).
4. If continuing PR #1, re-subscribe to its activity to keep auto-handling CI/review events.
5. Pick up at "Immediate next step" (auth), then the roadmap.

---

_Upstream: https://github.com/uncazzy/todoist-dashboard (MIT). This file is the project handoff;
keep it updated as the project evolves._
