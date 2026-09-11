# DNP SORN Compliance Tracker

A React dashboard for tracking federal agency compliance with **Executive Order 14249** and **OMB Memorandum M-25-32**, which require all executive agencies to add a standardized "Do Not Pay (DNP) routine use" to their Privacy Act Systems of Records Notices (SORNs).

## What It Does

The app provides a real-time compliance scoreboard showing which federal agencies have published Federal Register notices modifying their SORNs to include the Treasury Do Not Pay Working System routine use — and which have not.

For each tracked agency the dashboard displays:

- **Filing status** — Effective, In Comment Period, or Not Filed
- **Publication and effective dates** from the Federal Register
- **Specific SORNs modified** (e.g., `CFTC-5`, `GSA/PPFM-11`)
- **FR Doc number and citation** with a direct link to the notice
- **Compliance context** for agencies that have not yet filed, including an assessment of why their payment programs are in scope

Summary statistics at the top show overall progress across all 25+ tracked CFO Act and independent agencies, including a progress bar and confirmed SORN count.

## Background

- **EO 14249** (signed 2025) directed agencies to update their SORNs to allow disclosure to Treasury's Do Not Pay Working System.
- **OMB M-25-32** issued a standardized routine use language that agencies must adopt verbatim.
- The **Do Not Pay Working System** is used to identify, prevent, and recover improper payments to applicants for or recipients of federal funds.

## Tech Stack

- [React 19](https://react.dev/) with [Vite 8](https://vitejs.dev/)
- No external UI libraries — all styling is inline
- No runtime backend: agency data is generated at build time into `src/data/filings.json`

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the dashboard.

## How the Data Updates

The dashboard is generated, not hand-maintained. Three pieces:

| File | Written by | Purpose |
|------|-----------|---------|
| `src/frQuery.js` | you | The Federal Register query — search terms, fields, date floor. Shared by the generator and the in-app live feed so they can't drift. |
| `src/data/overrides.json` | you | Hand-curated agency context: `abbr`, `type`, `notes`, curated `sorns`, and `extraFilings` for notices that don't exist in the FR API (e.g. SEC's own Privacy Act releases). |
| `src/data/filings.json` | the generator | **Never hand-edit.** Produced by `scripts/fetch-filings.mjs`. |

Refresh locally:

```bash
npm run update-data
```

`.github/workflows/update-filings.yml` runs the same command twice daily, commits
`src/data/filings.json` if it changed, and then invokes the Pages deploy workflow
directly — a commit made with `GITHUB_TOKEN` does not fire the `push` event, so the
deploy has to be called rather than triggered.

### Why the query uses several search terms

Agencies do not spell the program name consistently. DOL's September 2026 notice
([2026-17838](https://www.federalregister.gov/documents/2026/09/01/2026-17838/privacy-act-of-1974-system-of-records))
writes "Do Not Pay **(DNP)** Working System", which does not match the literal phrase
`"Do Not Pay Working System"`. `FR_TERMS` queries several phrasings and unions the
results by document number. Adding a term is the right fix when a known filing is missing.

### Status is derived, never stored

Status is computed from Federal Register dates at generation time, against `asOf`:

- **Comment Period** — at least one notice whose comment window is still open
- **Effective** — notices located, no comment window open
- **Not Filed** — no matching notice located

Nothing in the repo hardcodes a status, so a comment window closing can't leave a
stale badge behind.

### Agency rollup

A notice filed by a component agency is attributed to the nearest ancestor listed in
`overrides.json`, otherwise to its top-level parent. This keeps Bureau of the Fiscal
Service notices under Treasury while leaving FERC — whose FR parent is the Energy
Department — as its own line.

### Adding an agency

Agencies file automatically once the Federal Register has a matching notice; nothing
is needed to make them appear. Add an entry to `overrides.json` keyed by
[FR agency slug](https://www.federalregister.gov/api/v1/agencies.json) to attach
curated notes, or to pin an agency to the dashboard *before* it has filed so the
compliance gap stays visible.

### If the tracker stops updating

1. Check the Actions tab. GitHub disables scheduled workflows after 60 days of repo
   inactivity — re-enable it there. (The workflow's own commits normally keep the
   schedule alive.)
2. Open the **Live FR Feed** panel on the site. Notices badged `NEW` are in the
   Federal Register but not in the committed dataset, which means the workflow has
   stopped rather than the query being wrong.
3. If a known filing appears in neither, the query missed it — add a phrasing to
   `FR_TERMS` in `src/frQuery.js`.

## Data Sources

- [Federal Register API](https://www.federalregister.gov/developers/documentation/api/v1) — `documents.json` and `agencies.json`
- [Federal Register — Do Not Pay notices](https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=%22Do+Not+Pay%22&conditions%5Btype%5D%5B%5D=NOTICE)
- Individual agency Privacy Act pages and regulations.gov dockets
