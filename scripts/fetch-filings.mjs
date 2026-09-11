#!/usr/bin/env node
/**
 * Regenerates src/data/filings.json from the Federal Register API.
 *
 * This is the tracker's only data path — the dashboard renders whatever this
 * script writes, merged with the hand-curated context in src/data/overrides.json.
 * Run it locally with `npm run update-data`; CI runs it on a schedule and commits
 * the result, which in turn triggers the Pages deploy.
 *
 * Exits non-zero on API failure so a bad run never commits a truncated file.
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { FR_API, FR_AGENCIES_API, FR_TERMS, FR_SINCE, frSearchParams } from "../src/frQuery.js";

const OVERRIDES_PATH = fileURLToPath(new URL("../src/data/overrides.json", import.meta.url));
const OUT_PATH = fileURLToPath(new URL("../src/data/filings.json", import.meta.url));

const today = process.env.DNP_TODAY ?? new Date().toISOString().slice(0, 10);

// ── Federal Register fetching ──────────────────────────────────────────────

async function getJSON(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

/** Every notice matching `term`, following pagination to the end. */
async function fetchTerm(term) {
  const out = [];
  for (let page = 1; page <= 50; page++) {
    const data = await getJSON(`${FR_API}?${frSearchParams(term, { page })}`);
    const results = data.results ?? [];
    out.push(...results);
    if (!results.length || out.length >= (data.count ?? 0)) break;
  }
  return out;
}

// ── Agency rollup ──────────────────────────────────────────────────────────

/**
 * Attribute a notice to the agency the dashboard tracks: walk up the parent
 * chain and stop at the first agency named in overrides, otherwise stop at the
 * top-level parent. Without this, FERC's notices fold into the Energy
 * Department and Fiscal Service's fold into Treasury under the same rule.
 */
function rollup(agency, byId, tracked) {
  let cur = agency;
  const seen = new Set();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (tracked.has(cur.slug)) return cur;
    if (cur.parent_id == null) return cur;
    const parent = byId.get(cur.parent_id);
    if (!parent) return cur;
    cur = parent;
  }
  return cur;
}

// ── Status derivation ──────────────────────────────────────────────────────

/**
 * Status is derived, never stored — a hardcoded status is what left Peace Corps
 * and FERC showing "Comment Period" months after their windows closed.
 *
 *   Not Filed      — no notice located
 *   Comment Period — at least one notice whose comment window is still open
 *   Effective      — notices exist and no comment window is open
 */
function deriveStatus(filings, asOf) {
  if (!filings.length) return "Not Filed";
  if (filings.some(f => f.commentsCloseOn && f.commentsCloseOn >= asOf)) return "Comment Period";
  return "Effective";
}

/** Matching programs are a different instrument than SORN routine-use mods. */
function classify(doc) {
  const text = `${doc.action ?? ""} ${doc.title ?? ""}`.toLowerCase();
  if (text.includes("matching program")) return "Matching Program";
  if (text.includes("rescind")) return "Rescindment";
  if (text.includes("new system")) return "New SORN";
  return "SORN Modification";
}

// ── Main ───────────────────────────────────────────────────────────────────

const overridesRaw = JSON.parse(readFileSync(OVERRIDES_PATH, "utf8"));
const overrides = Object.fromEntries(
  Object.entries(overridesRaw).filter(([k]) => !k.startsWith("_"))
);
const tracked = new Set(Object.keys(overrides));

console.log(`Querying Federal Register (${FR_TERMS.length} terms, since ${FR_SINCE})…`);

const [agencyIndex, ...termResults] = await Promise.all([
  getJSON(FR_AGENCIES_API),
  ...FR_TERMS.map(fetchTerm),
]);

const byId = new Map(agencyIndex.map(a => [a.id, a]));

// Union the term results; a notice matching several terms is still one notice.
const docs = new Map();
FR_TERMS.forEach((term, i) => {
  console.log(`  ${termResults[i].length.toString().padStart(4)}  ${term}`);
  for (const d of termResults[i]) docs.set(d.document_number, d);
});
console.log(`  ${docs.size} unique notices after dedupe`);

if (docs.size === 0) throw new Error("Federal Register returned zero notices — refusing to write an empty dataset");

// Group notices under their tracked agency.
const groups = new Map();
for (const doc of docs.values()) {
  const roots = new Map();
  for (const a of doc.agencies ?? []) {
    const resolved = rollup(byId.get(a.id) ?? a, byId, tracked);
    if (resolved?.slug) roots.set(resolved.slug, resolved);
  }
  if (!roots.size) {
    console.warn(`  ! ${doc.document_number}: no resolvable agency, skipped`);
    continue;
  }
  const filing = {
    frDoc: doc.document_number,
    frCitation: doc.citation ?? null,
    pubDate: doc.publication_date ?? null,
    effectiveDate: doc.effective_on ?? null,
    commentsCloseOn: doc.comments_close_on ?? null,
    title: doc.title ?? null,
    action: doc.action ?? null,
    kind: classify(doc),
    frUrl: doc.html_url ?? null,
  };
  for (const [slug, agency] of roots) {
    if (!groups.has(slug)) groups.set(slug, { agency, filings: [] });
    groups.get(slug).filings.push(filing);
  }
}

// Agencies tracked in overrides always appear, even with zero filings.
for (const slug of tracked) {
  if (!groups.has(slug)) {
    const agency = agencyIndex.find(a => a.slug === slug);
    if (!agency) { console.warn(`  ! overrides slug not found in FR agency index: ${slug}`); continue; }
    groups.set(slug, { agency, filings: [] });
  }
}

const agencies = [...groups.entries()].map(([slug, { agency, filings }]) => {
  const o = overrides[slug] ?? {};
  const all = [...filings, ...(o.extraFilings ?? [])]
    .sort((a, b) => (b.pubDate ?? "").localeCompare(a.pubDate ?? ""));
  return {
    slug,
    agency: o.name ?? agency.name,
    abbr: o.abbr ?? agency.short_name ?? agency.name,
    type: o.type ?? "Independent",
    curated: Boolean(overrides[slug]),
    notes: o.notes ?? null,
    sorns: o.sorns ?? [],
    filings: all,
    filingCount: all.length,
    latest: all[0] ?? null,
    status: deriveStatus(all, today),
  };
}).sort((a, b) => a.agency.localeCompare(b.agency));

const payload = {
  asOf: today,
  source: { api: FR_API, terms: FR_TERMS, since: FR_SINCE },
  totals: {
    agencies: agencies.length,
    filings: agencies.reduce((n, a) => n + a.filingCount, 0),
    uniqueNotices: docs.size,
  },
  agencies,
};

// Carry the previous generatedAt forward when nothing substantive changed, so
// the twice-daily run does not produce a commit whose only diff is a timestamp.
let previous = null;
try { previous = JSON.parse(readFileSync(OUT_PATH, "utf8")); } catch { /* first run */ }

const unchanged =
  previous && JSON.stringify({ ...previous, generatedAt: undefined }) === JSON.stringify({ ...payload, generatedAt: undefined });

const out = { generatedAt: unchanged ? previous.generatedAt : new Date().toISOString(), ...payload };

writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n");
if (unchanged) console.log("\nNo substantive change since last run — generatedAt preserved.");

const byStatus = s => agencies.filter(a => a.status === s).length;
console.log(
  `\nWrote ${OUT_PATH}\n` +
  `  ${agencies.length} agencies · ${out.totals.filings} filings\n` +
  `  Effective ${byStatus("Effective")} · Comment Period ${byStatus("Comment Period")} · Not Filed ${byStatus("Not Filed")}`
);

const uncurated = agencies.filter(a => !a.curated && a.filingCount);
if (uncurated.length) {
  console.log(`\n${uncurated.length} agencies filed but have no curated notes in src/data/overrides.json:`);
  for (const a of uncurated) console.log(`  ${a.slug} (${a.filingCount})`);
}
