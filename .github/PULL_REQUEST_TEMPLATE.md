<!-- Thanks for contributing. Delete whichever section does not apply. -->

## Data change

**Incident ID(s):**
**Source link(s):**

- [ ] Every claim in the row is supported by the linked source (this is the most common reason a PR is sent back)
- [ ] No accused individuals are named
- [ ] Blank fields are blank because the source does not say — not because I guessed zero
- [ ] `leak_status` reflects the strength of the *evidence*, not the severity of the allegation
- [ ] If the date is a placeholder, the note says so ("Only year of exam known…", "day approximate")
- [ ] Any `linked_deaths` figure has a `deaths_note` explaining whose deaths and how contested the link is
- [ ] `bun run build` passes

## Code change

**What and why:**

- [ ] `bun run check` reports 0 errors and 0 warnings
- [ ] `bun run build` passes
- [ ] Chart colours come from CSS custom properties, not hard-coded hex
- [ ] No new runtime dependencies (no chart library, no CSS framework, no webfonts)
- [ ] Checked in both light and dark themes, and at a narrow viewport
