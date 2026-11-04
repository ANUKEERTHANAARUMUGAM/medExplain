import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const REQUEST_TIMEOUT_MS = 5000;

const supabase = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

const withTimeout = (promise, ms) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase request timed out')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Runs a query against Supabase. Errors are thrown, not replaced with bundled
// data, so the UI can show what went wrong.
async function fetchRows(table, columns, orderBy, query = q => q) {
  if (!supabase) {
    throw new Error('Supabase is not configured: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }

  const { data, error } = await withTimeout(
    query(supabase.from(table).select(columns)).order(orderBy),
    REQUEST_TIMEOUT_MS
  );
  if (error) throw error;
  return data ?? [];
}

// Tables with a review_status column only expose rows marked as published.
const fetchPublished = (table, columns, orderBy) =>
  fetchRows(table, columns, orderBy, q => q.eq('review_status', 'published'));

export const fetchMedicines = () => fetchPublished(
  'medicines',
  'id, generic_name, brand_names, name_ta, uses_en, uses_ta, side_effects, precautions',
  'generic_name'
);

// medical_terms stores category_id; join categories so each term carries its name.
export const fetchTerms = async () => {
  const rows = await fetchPublished(
    'medical_terms',
    'id, english_term, tamil_term, tamil_transliteration, simple_english, simple_tamil, medical_definition, category_id, categories(name)',
    'english_term'
  );
  return rows.map(({ categories, ...term }) => ({
    ...term,
    category: categories?.name ?? null
  }));
};

// body_parts has no review_status column, so every row is returned.
export const fetchBodyParts = () => fetchRows(
  'body_parts',
  'id, name_en, name_ta, body_system, description_en, description_ta',
  'name_en'
);
