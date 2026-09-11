import { useState, useEffect, useCallback } from "react";
import { FR_API, FR_TERMS, frSearchParams } from "./frQuery";

/**
 * Live Federal Register feed, run client-side on every page load.
 *
 * Uses the same union of search terms as the build-time generator, so a notice
 * that shows up here but is flagged NEW means the committed dataset is behind —
 * not that the query missed it.
 */
export function useFRLiveSearch(knownFrDocs = []) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const knownKey = knownFrDocs.join(",");

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const known = new Set(knownKey ? knownKey.split(",") : []);

      // One request per term, unioned by document number — a single phrase
      // query silently drops notices that spell the program name differently.
      const pages = await Promise.all(
        FR_TERMS.map(async term => {
          const res = await fetch(`${FR_API}?${frSearchParams(term, { perPage: 40 })}`);
          if (!res.ok) throw new Error(`FR API responded with ${res.status}`);
          return (await res.json()).results ?? [];
        })
      );

      const merged = new Map();
      for (const doc of pages.flat()) merged.set(doc.document_number, doc);

      setResults(
        [...merged.values()]
          .sort((a, b) => (b.publication_date ?? "").localeCompare(a.publication_date ?? ""))
          .slice(0, 25)
          .map(doc => ({
            ...doc,
            isNew: !known.has(doc.document_number),
            agencyNames: doc.agencies?.map(a => a.name).join(", ") ?? "Unknown",
          }))
      );
      setLastChecked(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [knownKey]);

  useEffect(() => { run(); }, [run]);

  return { results, loading, error, lastChecked, refetch: run };
}
