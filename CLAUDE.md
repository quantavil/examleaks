# CLAUDE.md

Project memory for Claude Code. Read this before changing anything.

## What this is

An open, source-linked record of documented paper leaks and examination-integrity
failures in Indian public examinations, 2004–present. A static SvelteKit site
deployed to Cloudflare Pages.

It is a **reading aid for public reporting** — not an official register, not a
legal finding, not a complete census. The project's only asset is its
credibility, so accuracy beats features every time.

## The data model — the thing to understand first

`exam_leaks.csv` at the repository root is the **single source of truth**.

```
exam_leaks.csv
  └─ imported by src/lib/data/index.ts via Vite `?raw`
     └─ parsed at module load by src/lib/data/csv.ts   (RFC 4180, no deps)
        └─ normalised by src/lib/data/normalize.ts     (→ typed Incident[])
           └─ every page, chart, export, share card and sitemap entry
```

There is **no database and no generated file**. A contributor edits one CSV row
and opens a PR; the next build regenerates the entire site from it.

**Everything on the site is data-derived. There are no hardcoded counts in any
rendered page** — verified by grep. If you write a number into prose, compute it.
`README.md` and `CONTRIBUTING.md` are the only places with literal figures, and
they are docs, not pages.

Adding one CSV row automatically produces: a `/incident/PL-XXXX` page, an SVG
share card, a row in `/record`, a bar in every chart, an entry on the relevant
`/state/…` and `/year/…` pages, a sitemap entry, and a line in the JSON export.
Removing a row removes all of it. Do not add manual steps to that pipeline.

## Editorial rules — non-negotiable

These look like missing features. They are deliberate. Do not "fix" them.

- **`linked_deaths` is excluded from every aggregate.** The four figures measure
  different things: Vyapam's 23 span a decade-long scam with foul play ruled out
  by the CBI; RAS 2013's 1 is the accused mastermind, not a candidate; both NEET
  figures are contested press tallies. Each renders only beside its own caveat.
  Summing them is arithmetically correct and substantively false.
- **`Denied` rows stay in the dataset.** Deleting disproved scandals (UGC-NET
  2024, Rajasthan Patwari 2021) would silently inflate the confirmed count.
- **Blank never renders as `0`.** An empty `arrests` cell means the source did
  not say. A literal `0` appears only where a source reported none.
- **No named individuals.** Institutions, counts and outcomes only. An arrest is
  not a conviction.
- **Recency and language bias are stated on the page**, not just in the docs.
  The upward trend is partly an artefact of what is findable in English.
- **Date precision is honoured.** Rows whose note says "Jan placeholder" or "day
  approximate" render as `≈ 2012`, never a fabricated exact day. The heuristic
  lives in `datePrecisionFrom()` in `normalize.ts`.

The reasoning is written up at `/about` and in `CONTRIBUTING.md`.

## Architecture

```
/                  the story — KPIs, four charts, accountability, deaths
/record            the tool — search + filters, table directly below
/incident/[id]     110 prerendered pages
/state/[slug]      25    /year/[year]  21    /states  /years
/about  /contribute
/og/**/*.svg       prerendered share cards
/data/exam-leaks.json   normalised export
```

**The narrative and the query tool are separate pages on purpose.** Bolted
together, the search box sat 6,922px above its own results and the table was 52%
of a 17,897px page. Do not merge them back.

Filters round-trip through the query string (`src/lib/filters.ts`), so
`/record?place=rajasthan&status=Confirmed` is shareable. The dashboard filters
its own charts, then hands the selection to `/record` explicitly rather than
silently mutating a table off-screen.

**No runtime dependencies.** No chart library, no CSS framework, no webfonts, no
analytics, no third-party requests. Charts are hand-rolled SVG in
`src/lib/components/{Column,Bar}Chart.svelte`. Keep it that way.

## Design system

- Chart colour comes from CSS custom properties (`--st-*`, `--cat-*`), never
  hardcoded hex, so light and dark stay in sync.
- `leak_status` is a **single-hue ordinal ramp** (Confirmed darkest → Suspected
  lightest) with neutral grey for `Denied`, which sits *outside* the scale. It is
  an evidentiary scale, so it looks like one. Not a categorical rainbow.
- `--accent` (ink red) is **UI chrome only** and never encodes data.
- Two measures never share an axis. Need a second scale? Make a second figure.
- Light is the default theme; dark is opt-in via the toggle, never inferred from
  the OS. There is only one dark token block, scoped to `[data-theme='dark']`.

## Commands

```bash
bun install
bun run dev
bun run build      # → build/
bun run check      # must be 0 errors AND 0 warnings (types + a11y)
```

## Gotchas that have already bitten

- **TypeScript is pinned to `^5.9`.** TS 7 is the Go rewrite and does not expose
  the full compiler API (`ts.sys`); `svelte-check` crashes at startup. Everything
  else tracks latest (Vite 8 / Rolldown, vite-plugin-svelte 7).
- **`.prose a` must stay `:not(.btn)`.** At 0,1,1 it out-specifies `.btn-accent`
  at 0,1,0 and paints red text onto the red button.
- **Never wrap `.records` in an `overflow-x` container.** Sticky headers then
  stick to the wrapper instead of the viewport and cover the first row. The card
  layout takes over below 1024px instead.
- **The era "rate per year" panel ignores the era and year facets.** Filtering to
  NDA would otherwise zero the UPA row and leave nothing to compare.
- **`vite preview` does not serve `build/`** for adapter-static. To test the real
  output, serve `build/` with Cloudflare-Pages-style routing (exact file →
  `<path>.html` → `404.html`).
- Prerendered pages must not touch `url.searchParams` during SSR. `/record` reads
  them inside a `$effect`, which never runs on the server.
- **The masthead never hides a nav link.** Below 760px the nav drops to its own
  full-width second row. `display:none` on "optional" links used to make States
  and Method unreachable on every phone, and the row still overflowed 320px by
  125px, pushing the theme toggle off-screen.
- **`--masthead-h` is the single source of the sticky header's height.**
  `scroll-padding-top` and `.records thead th`'s `top` both read it, because the
  masthead is 3.5rem on desktop and 5.25rem once the nav wraps.
- **No `text-rendering: optimizeLegibility` and no `-webkit-font-smoothing`.**
  Both are deliberately absent. `optimizeLegibility` shifts Gecko's font
  fallback and is what made the type look wrong on Firefox for Android;
  `antialiased` is Blink/WebKit-only, so it thinned the serif in Chrome and
  left Firefox heavier. `text-size-adjust` must stay set **unprefixed** — Gecko
  ignores the `-webkit-` form and applies its own font inflation without it.
- **`BarChart` flips layout under 520px**: labels move above their bars instead
  of into a left gutter. SVG text neither wraps nor clips, so long names — the
  conducting bodies especially — used to run off the side of the page. The
  `CHAR_W` truncation is an estimate and a safety net, not a measurement; it
  should only ever trip on names that clearly do not fit.
- **`ColumnChart` drops the regular tick before the final one** when they would
  collide. On a phone 2024 and 2026 sit 24px apart and printed on top of each
  other.

## Deployment

Cloudflare Pages via the dashboard — build `bun run build`, output `build`, env
`VITE_SITE_URL`. There is **no CI workflow by design**; the Pages build on every
push is the check, including for PRs.

## Licensing

Code GPL-3.0 (`LICENSE`). Data CC BY 4.0 (`LICENSE-DATA`). Linked articles remain
their publishers' copyright — this project licenses the index, not the sources.
