#!/usr/bin/env node
/**
 * Queries the Federal Register API for new DNP SORN routine-use notices
 * and creates a GitHub issue for any document not already in the tracker data.
 *
 * Runs via GitHub Actions on a twice-daily cron schedule.
 * Required env vars: GH_TOKEN, REPO (e.g. "username/dnp-tracker")
 */

import { readFileSync } from "fs";

const FR_API = "https://www.federalregister.gov/api/v1/documents.json";

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchLatestNotices() {
  const params = new URLSearchParams({
    "conditions[term]": '"Do Not Pay Working System" "routine use"',
    "conditions[type][]": "NOTICE",
    "per_page": "20",
    "order": "newest",
  });
  for (const f of ["document_number", "title", "publication_date", "effective_on", "html_url", "agencies"]) {
    params.append("fields[]", f);
  }

  const res = await fetch(`${FR_API}?${params}`);
  if (!res.ok) throw new Error(`FR API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.results ?? [];
}

async function getOpenIssues(repo, token) {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/issues?state=open&labels=new-filing&per_page=50`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
  );
  if (!res.ok) throw new Error(`GitHub issues API error ${res.status}`);
  return res.json();
}

async function createIssue(repo, token, { title, body }) {
  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body, labels: ["new-filing"] }),
  });
  if (!res.ok) throw new Error(`GitHub create issue error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Main ───────────────────────────────────────────────────────────────────

const { GH_TOKEN, REPO } = process.env;
if (!GH_TOKEN || !REPO) {
  console.error("Missing required env vars: GH_TOKEN and REPO");
  process.exit(1);
}

// Extract all frDoc values already tracked in the source data
const source = readFileSync(new URL("../src/dnp-sorn-tracker.jsx", import.meta.url), "utf8");
const knownDocs = new Set([...source.matchAll(/frDoc:"([^"]+)"/g)].map(m => m[1]));

console.log(`Known FR docs in tracker: ${knownDocs.size}`);

const [notices, openIssues] = await Promise.all([
  fetchLatestNotices(),
  getOpenIssues(REPO, GH_TOKEN),
]);

// Avoid duplicate issues for the same document
const issueDocNums = new Set(
  openIssues.map(i => i.title.match(/\((\d{4}-\d+)\)/)?.[1]).filter(Boolean)
);

const newDocs = notices.filter(
  d => !knownDocs.has(d.document_number) && !issueDocNums.has(d.document_number)
);

if (newDocs.length === 0) {
  console.log(`✓ No new filings found. Checked ${notices.length} recent notices.`);
  process.exit(0);
}

console.log(`! Found ${newDocs.length} new filing(s) not yet in the tracker:`);

for (const doc of newDocs) {
  const agencies = doc.agencies?.map(a => a.name).join(", ") || "Unknown Agency";
  const title = `New DNP SORN Filing: ${agencies} (${doc.document_number})`;

  const body = [
    `## New Federal Register Filing Detected`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Document** | \`${doc.document_number}\` |`,
    `| **Title** | ${doc.title} |`,
    `| **Agency** | ${agencies} |`,
    `| **Published** | ${doc.publication_date} |`,
    `| **Effective** | ${doc.effective_on ?? "TBD"} |`,
    `| **FR URL** | [View Notice](${doc.html_url}) |`,
    ``,
    `### Action Required`,
    ``,
    `Add an entry to the \`AGENCIES\` array in \`src/dnp-sorn-tracker.jsx\`:`,
    ``,
    "```js",
    `{ agency: "${agencies}", abbr: "??", type: "CFO Act",`,
    `  frDoc: "${doc.document_number}", frCitation: "?? FR ??",`,
    `  pubDate: "${doc.publication_date}", effectiveDate: "${doc.effective_on ?? ""}",`,
    `  sorns: [], notes: "",`,
    `  frUrl: "${doc.html_url}",`,
    `  status: "Comment Period", sornCount: null },`,
    "```",
  ].join("\n");

  const issue = await createIssue(REPO, GH_TOKEN, { title, body });
  console.log(`  → Created issue #${issue.number}: ${title}`);
  console.log(`    ${issue.html_url}`);
}
