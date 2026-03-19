import { useState, useEffect, useCallback } from "react";

const FR_API = "https://www.federalregister.gov/api/v1/documents.json";
const FIELDS = ["document_number", "title", "publication_date", "effective_on", "html_url", "agencies"];

export function useFRLiveSearch(knownFrDocs = []) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        "conditions[term]": '"Do Not Pay Working System" "routine use"',
        "conditions[type][]": "NOTICE",
        "per_page": "20",
        "order": "newest",
      });
      FIELDS.forEach(f => params.append("fields[]", f));

      const res = await fetch(`${FR_API}?${params}`);
      if (!res.ok) throw new Error(`FR API responded with ${res.status}`);
      const data = await res.json();

      setResults(
        (data.results ?? []).map(doc => ({
          ...doc,
          isNew: !knownFrDocs.includes(doc.document_number),
          agencyNames: doc.agencies?.map(a => a.name).join(", ") ?? "Unknown",
        }))
      );
      setLastChecked(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [knownFrDocs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { results, loading, error, lastChecked, refetch: fetch_ };
}
