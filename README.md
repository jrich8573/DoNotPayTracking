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
- Data is maintained directly in the component (`src/dnp-sorn-tracker.jsx`)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the dashboard.

## Updating the Data

All agency data lives in the `AGENCIES` array at the top of `src/dnp-sorn-tracker.jsx`. Each entry has the following shape:

```js
{
  agency: "Agency Full Name",
  abbr: "ABBR",
  type: "CFO Act" | "Independent",
  frDoc: "2026-00000",           // Federal Register document number
  frCitation: "91 FR 12345",
  pubDate: "2026-01-01",
  effectiveDate: "2026-01-31",
  sorns: ["SORN-1", "SORN-2"],
  notes: "...",
  frUrl: "https://...",
  status: "Effective" | "Comment Period" | "Not Filed",
  sornCount: 2,                  // number or "Multiple"
}
```

Set `status` to `"Effective"` once a notice's effective date has passed, `"Comment Period"` while it is still in the public comment window, or leave as `"Not Filed"` until a notice is confirmed.

## Data Sources

- [Federal Register — Do Not Pay routine use notices](https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=%22Do+Not+Pay+Working+System%22+%22routine+use%22&conditions%5Btype%5D%5B%5D=NOTICE)
- Individual agency Privacy Act pages and regulations.gov dockets
