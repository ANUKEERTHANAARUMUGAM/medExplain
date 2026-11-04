export const SEARCH_LIMIT = 6;

// Lower rank is shown higher:
//   0 English prefix, 1 English substring,
//   2 Tamil / transliteration prefix, 3 Tamil / transliteration substring.
// `needle` must already be trimmed and lowercased.
export function rankTerm(term, needle) {
  const en = term.english_term.toLowerCase();
  const ta = term.tamil_term || '';
  const translit = (term.tamil_transliteration || '').toLowerCase();

  if (en.startsWith(needle)) return 0;
  if (en.includes(needle)) return 1;
  if (ta.startsWith(needle) || translit.startsWith(needle)) return 2;
  if (ta.includes(needle) || translit.includes(needle)) return 3;
  return null;
}

// Client-side mode: filters an in-memory array of published terms.
export function searchTermsInMemory(terms, query, limit = SEARCH_LIMIT) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const scored = [];
  for (const term of terms) {
    const rank = rankTerm(term, needle);
    if (rank !== null) scored.push({ term, rank });
  }

  scored.sort((a, b) =>
    a.rank - b.rank ||
    a.term.english_term.length - b.term.english_term.length ||
    a.term.english_term.localeCompare(b.term.english_term)
  );

  return scored.slice(0, limit).map(s => s.term);
}

// Client-side mode: downloads every published row once, so search runs locally.
export async function loadPublishedTerms(supabase) {
  const { data, error } = await supabase
    .from('medical_terms')
    .select('id, english_term, tamil_term, tamil_transliteration')
    .eq('review_status', 'published');
  if (error) throw error;
  return data ?? [];
}

// RPC mode: ranking and the limit run in Postgres (supabase/search_medical_terms.sql).
export async function searchTermsRpc(supabase, query, limit = SEARCH_LIMIT) {
  const { data, error } = await supabase.rpc('search_medical_terms', { q: query, lim: limit });
  if (error) throw error;
  return data ?? [];
}
