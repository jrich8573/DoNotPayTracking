/**
 * Shared Federal Register query definition.
 *
 * Used by both the build-time generator (scripts/fetch-filings.mjs) and the
 * in-app live feed (src/useFRLiveSearch.js) so the two can never drift apart.
 *
 * Why several terms instead of one: agencies do not write the program name
 * consistently. DOL's Sept. 2026 notice says "Do Not Pay (DNP) Working System",
 * which does not match the literal phrase "Do Not Pay Working System" — a
 * single-phrase query silently drops it. The union of these terms is
 * deduplicated by document number.
 */

export const FR_API = "https://www.federalregister.gov/api/v1/documents.json";
export const FR_AGENCIES_API = "https://www.federalregister.gov/api/v1/agencies.json";

export const FR_TERMS = [
  '"Do Not Pay Working System"',
  '"Do Not Pay (DNP) Working System"',
  '"Do Not Pay" "routine use"',
  '"Do Not Pay" "matching program"',
];

export const FR_FIELDS = [
  "document_number",
  "title",
  "action",
  "publication_date",
  "effective_on",
  "comments_close_on",
  "citation",
  "html_url",
  "agencies",
];

/** Earliest publication date worth scanning (EO 14249 predates no filings). */
export const FR_SINCE = "2025-01-01";

export function frSearchParams(term, { perPage = 100, page = 1, since = FR_SINCE } = {}) {
  const params = new URLSearchParams({
    "conditions[term]": term,
    "conditions[type][]": "NOTICE",
    "conditions[publication_date][gte]": since,
    per_page: String(perPage),
    page: String(page),
    order: "newest",
  });
  FR_FIELDS.forEach(f => params.append("fields[]", f));
  return params;
}

/** Human-facing FR website search URL for the same union of terms. */
export const FR_SEARCH_URL =
  "https://www.federalregister.gov/documents/search?" +
  new URLSearchParams({
    "conditions[term]": '"Do Not Pay"',
    "conditions[type][]": "NOTICE",
    "conditions[publication_date][gte]": FR_SINCE,
  });
