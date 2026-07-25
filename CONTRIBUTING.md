# Contributing

The whole dataset is one file: **`exam_leaks.csv`** at the repository root. No database, no login, no submission portal.

## Three ways in, easiest first

**A. Open an issue — no code needed.**
[New incident form](https://github.com/quantavil/examleaks/issues/new?template=new-incident.yml). Paste the link and whatever you know; someone will transcribe it. This is a completely legitimate way to contribute and it is how most rows should arrive.

**B. Edit the CSV in GitHub's web editor.**
[Click here](https://github.com/quantavil/examleaks/edit/main/exam_leaks.csv), add your row at the bottom, and GitHub opens a pull request for you.

**C. Clone it.**

```bash
git clone https://github.com/quantavil/examleaks.git
cd examleaks
bun install
bun run dev
```

## What makes a row acceptable

- **One citable public source** — a named news report, court order, official notice, commission finding or RTI reply. Not a forum post, not a WhatsApp forward, not a YouTube claim, not an anonymous tip.
- **A public examination** — government recruitment, entrance, eligibility or school-board tests. Private and corporate testing is out of scope.
- **An organised integrity failure** — a leak, an answer-key sale, marks or OMR manipulation, an impersonation racket, remote access to exam terminals. One student copying is not an incident. Organised copying is.
- **No named individuals.** Record the institution, the counts and the outcome. Do not add the names of accused people, even when the source prints them.

## The most valuable contribution

**A verdict added to an old row**, not a new row.

Most entries here were sourced from articles written days after the leak. Convictions handed down years later are missing across the board — only 8 of 110 incidents currently carry a conviction count, and that is a limitation of one-source-per-row, not a finding about Indian courts. If you can point to a judgment for a case from 2013 or 2017, that improves the dataset in a way a new 2026 row does not.

## Field rules that actually trip people up

Full column dictionary: [`/about#schema`](https://examleaks.pages.dev/about#schema).

- **Blank beats a guess.** An empty `arrests` cell means "the source does not say". Never write `0` unless the source explicitly reports none.
- **Pick the status honestly.**
  - `Confirmed` — an official finding: a cancellation citing a leak, a court order, a police confirmation.
  - `Alleged` — a credible public allegation with an FIR, arrests or a probe, but no established finding.
  - `Suspected` — authorities acted pre-emptively (postponement, withheld results) on suspicion.
  - `Denied` — investigated and officially rejected, or the "leaked" paper turned out to be fake. **These rows stay in the file.**
- **Say so when the date is fuzzy.** If the source gives only a year, use `YYYY-01-01` and write "Only year of exam known, Jan placeholder." in the note. The site parses that sentence and renders the date as `≈ YYYY` rather than implying a precision nobody established. Same for "day approximate" and "1st of month used".
- **Any death figure needs its caveat.** `linked_deaths` may never be filled in without a `deaths_note` explaining whose deaths, how contested the link is, and what the number does not mean. These figures are excluded from every aggregate on the site.
- **Use the next free ID** — sequential, zero-padded, never reused.
- **Quoting.** Free text containing commas must be wrapped in double quotes; a literal quote inside a quoted field is doubled (`""`).

### A worked example

One row (wrapped here for readability — a single line in the file):

```
PL-0111,2026-08-14,NDA (May2014-now),Example State Clerk Recruitment Exam 2026,
Example Staff Selection Commission (ESSC),State,Example State (Capital City),Confirmed,
Exam cancelled + Arrests-FIR,"Question paper circulated on Telegram 40 minutes before the
shift began; the board cancelled that shift the same evening and police arrested 4. Day
known.",4,,52000,,,The Example Herald,https://example.com/article,High
```

## What happens to your pull request

1. CI parses the CSV and rebuilds the site — a malformed row fails the build immediately.
2. A maintainer opens your source and checks it says what the row says. **Rows are rejected for overstating the source far more often than for anything else.**
3. Once merged, your incident gets a permanent page at `/incident/PL-XXXX`, a share card, and a place in every chart and download.

## Gaps we know about

- **Pre-2015 state recruitment exams.** The record thins out badly before the mid-2010s, far too steeply to be real.
- **Regional-language reporting.** Sources skew to English national dailies. Incidents covered only in Hindi, Marathi, Telugu, Tamil, Bengali or Odia press are systematically missing.
- **States with no entries at all** — see the bottom of [`/states`](https://examleaks.pages.dev/states). Empty almost certainly means unfound, not clean.
- **Outcomes.** Convictions, acquittals, quashed recruitments, boards dissolved.

## Code contributions

Code is GPL-3.0; the dataset is CC BY 4.0 (see `LICENSE-DATA`).

Run `bun run check` before opening a PR — it must report **0 errors, 0 warnings** (types and accessibility).

Conventions worth knowing:

- Charts are hand-rolled SVG. Please don't add a charting library.
- Chart colour comes from CSS custom properties (`--st-*`, `--cat-*`), never hard-coded hex, so light and dark themes stay in sync.
- The editorial accent (`--accent`) is for UI chrome only and never encodes data.
- Two measures never share an axis. If you need a second scale, make a second figure.
