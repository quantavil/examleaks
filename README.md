# Exam Leaks

**An open, source-linked record of documented paper leaks and examination-integrity failures in Indian public examinations, 2004 – present.**

110 incidents. 25 states and territories. 60 examination bodies. Every row links to the report it came from.

🔗 **[examleaks.pages.dev](https://examleaks.pages.dev)** · 📄 [Method & caveats](https://examleaks.pages.dev/about) · ➕ [Contribute](https://examleaks.pages.dev/contribute)

---

## What this is

A reading aid for public reporting — **not** an official register, not a legal finding, and not a complete census. Each row summarises one publicly reported incident and cites one primary source. It records institutions, counts and outcomes; it does not name accused individuals.

Incidents whose allegations were later *officially rejected* stay in the record, marked `Denied`. A scandal that turned out to be false is part of the story, and deleting it would quietly inflate the confirmed count.

**Please read [`/about`](https://examleaks.pages.dev/about) before quoting a number from this dataset.** The known biases — recency, English-language sourcing, undercounted convictions — are large enough to change how you should read every chart on the site.

## The data

`exam_leaks.csv` at the repository root is the **single source of truth**. There is no database and no generated copy: the site imports the CSV as raw text at build time and parses it. Edit the CSV, and every page, chart, export and share card updates.

| Where | What |
|---|---|
| [`/data/exam-leaks.json`](https://examleaks.pages.dev/data/exam-leaks.json) | The whole record, normalised — parsed dates with their precision, resolved state slugs, structured actions, permalinks |
| [`exam_leaks.csv`](https://raw.githubusercontent.com/quantavil/examleaks/main/exam_leaks.csv) | The source file itself, from GitHub |
| The record table | Exports any filtered subset to CSV, in the browser |

The site does not re-serve the CSV — that would just be a second copy of a file GitHub already serves at a canonical URL. JSON is the one artefact the site uniquely produces, so it is the one it hosts.

Column dictionary: [`/about#schema`](https://examleaks.pages.dev/about#schema).

## Contributing

The most valuable contribution is **not a new row — it is a verdict added to an old one.** Most entries were sourced from articles written days after the leak, so convictions handed down years later are missing across the board.

Three ways in, easiest first:

1. **[Open an issue](https://github.com/quantavil/examleaks/issues/new?template=new-incident.yml)** — paste a link, no code needed.
2. **[Edit the CSV in the browser](https://github.com/quantavil/examleaks/edit/main/exam_leaks.csv)** — GitHub opens the PR for you.
3. **Clone it** and run it locally (below).

See [CONTRIBUTING.md](CONTRIBUTING.md) for the acceptance rules and field-by-field guidance.

## Running it

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev        # http://localhost:5173
```

| Script | Does |
|---|---|
| `bun run dev` | Dev server with HMR |
| `bun run build` | Static build into `build/` |
| `bun run preview` | Serve the built output |
| `bun run check` | `svelte-check` — types and a11y |

> **TypeScript is deliberately pinned to `^5.9`.** TypeScript 7 is the native Go rewrite and does not expose the full compiler API (`ts.sys`) that `svelte-check` loads at startup — bumping it makes `bun run check` crash before it reads a single file. Revisit once `svelte-check` ships TS 7 support. Everything else tracks latest: Vite 8 (Rolldown), `vite-plugin-svelte` 7, SvelteKit 2, Svelte 5.

Set the canonical origin before building for production (it feeds `<link rel="canonical">`, OpenGraph URLs, `sitemap.xml` and `robots.txt`):

```bash
VITE_SITE_URL=https://examleaks.pages.dev bun run build
```

## Deploying

The build is fully static — `build/` drops onto Cloudflare Pages, GitHub Pages, Netlify, S3 or any file server.

**Cloudflare Pages** via the dashboard — connect the repo and set:

| Setting | Value |
|---|---|
| Build command | `bun run build` |
| Output directory | `build` |
| Environment variable | `VITE_SITE_URL` = your canonical origin, no trailing slash |

Every push then rebuilds automatically, which also catches a malformed CSV row before it goes live. `static/_headers` sets caching and security headers; Cloudflare Pages picks it up with no extra config.

There is no CI workflow in this repo by design — the Pages build is the check.

## Architecture

```
exam_leaks.csv              ← the dataset. Everything derives from this.
src/lib/data/
  csv.ts                    RFC 4180 parser (no dependencies)
  normalize.ts              raw row → typed Incident; parses actions, infers date precision
  places.ts                 state registry + free-text area → canonical slug
  bodies.ts                 merges renamed bodies (Vyapam ≡ MPPEB ≡ MP ESB)
  stats.ts                  aggregations, all taking a filtered list
src/lib/components/
  ColumnChart / BarChart    hand-rolled SVG, no chart library
src/routes/
  /                         the story — KPIs, four charts, accountability, deaths.
                            Filters drive the charts; the selection hands off to…
  /record                   …the tool — search + filters with the table directly
                            below. Filters round-trip through the query string, so
                            /record?place=rajasthan&status=Confirmed is shareable
  /incident/[id]            110 prerendered pages
  /state/[slug]             25
  /year/[year]              21
  /og/**/*.svg              prerendered share cards
```

**No runtime dependencies.** Svelte 5 + SvelteKit + Vite at build time; the shipped bundle has no chart library, no CSS framework, no webfonts, no analytics and makes no third-party requests.

### Design notes

- `leak_status` is encoded as a **single-hue ordinal ramp** (Confirmed darkest → Suspected lightest) with neutral grey for `Denied`, which sits *outside* the scale rather than at the bottom of it. It is an evidentiary scale, so it looks like one.
- Charts of different measures never share an axis. Incident counts and candidates-affected are deliberately separate figures.
- `linked_deaths` is excluded from every aggregate. See [`/about`](https://examleaks.pages.dev/about#on-deaths) for why summing those four numbers would be arithmetically correct and substantively false.
- Blank is never rendered as `0`. An empty `arrests` cell means the source did not say.
- Rows with placeholder dates render as `≈ 2012`, read back from the prose note in the CSV.
- The narrative and the query tool are **separate pages on purpose**. Bolted together, the search box sat 6,922px above its own results and half the page was a single table.
- Only source citations open in a new tab — you are mid-research and losing the record would be hostile. GitHub and docs links stay in the same tab; `↗` marks "leaves the site", not "opens a tab".

### A note on the share cards

`/og/**/*.svg` are generated at build time. **X/Twitter, Facebook and LinkedIn do not rasterise SVG `og:image` values** — Discord, Slack and in-browser previews do. To get PNGs for full coverage:

```bash
bun add -d @resvg/resvg-js
bun run scripts/og-png.mjs        # writes build/og/**/*.png
```

Then change `image={...svg}` to `.png` in `src/lib/components/Seo.svelte`.

## Licence

- **Code** — [GPL-3.0](LICENSE)
- **Data** — [CC BY 4.0](LICENSE-DATA). Credit *Exam Leaks* and link back, so corrections reach your readers.
- **Linked articles** remain the copyright of their publishers. This project licenses the index, not the sources it points at.

---

If you or someone you know is struggling: **Tele-MANAS**, India's national mental-health helpline — **14416**, free, 24×7.
