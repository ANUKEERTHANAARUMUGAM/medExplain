import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  SEARCH_LIMIT,
  loadPublishedTerms,
  searchTermsInMemory,
  searchTermsRpc
} from './medicalSearch';

const DEBOUNCE_MS = 200;

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// mode="client": loads published terms once and filters in memory (small/medium data).
// mode="rpc":    calls the search_medical_terms Postgres function per query (large data).
export function MedicalSearchInput({
  supabase,
  mode = 'client',
  onSelect,
  limit = SEARCH_LIMIT,
  placeholder = 'Search English, Tamil or transliteration…'
}) {
  const [input, setInput] = useState('');
  const query = useDebouncedValue(input, DEBOUNCE_MS);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [cache, setCache] = useState(null);
  const [rpcResults, setRpcResults] = useState([]);
  const [rpcLoading, setRpcLoading] = useState(false);
  const [error, setError] = useState(null);

  const wrapperRef = useRef(null);
  const requestIdRef = useRef(0);
  const listId = useId();

  // Client mode: fetch all published terms once.
  useEffect(() => {
    if (mode !== 'client') return;
    let active = true;
    loadPublishedTerms(supabase)
      .then(rows => { if (active) setCache(rows); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [mode, supabase]);

  // RPC mode: query on each debounced value; ignore responses to stale queries.
  useEffect(() => {
    if (mode !== 'rpc') return;
    const id = ++requestIdRef.current;
    if (!query.trim()) {
      setRpcResults([]);
      setRpcLoading(false);
      return;
    }
    setRpcLoading(true);
    searchTermsRpc(supabase, query, limit)
      .then(rows => {
        if (id !== requestIdRef.current) return;
        setRpcResults(rows);
        setError(null);
      })
      .catch(e => { if (id === requestIdRef.current) setError(e.message); })
      .finally(() => { if (id === requestIdRef.current) setRpcLoading(false); });
  }, [mode, supabase, query, limit]);

  const results = useMemo(() => {
    if (mode === 'rpc') return rpcResults;
    return cache ? searchTermsInMemory(cache, query, limit) : [];
  }, [mode, cache, query, limit, rpcResults]);

  const loading = mode === 'rpc' ? rpcLoading : cache === null && !error;

  // A new query means the old highlighted index no longer points at the same row.
  useEffect(() => { setActiveIndex(-1); }, [query]);

  // Close when clicking anywhere outside the component.
  useEffect(() => {
    const onMouseDown = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const select = term => {
    setInput(term.english_term);
    setOpen(false);
    setActiveIndex(-1);
    onSelect?.(term);
  };

  const handleKeyDown = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(i => (results.length ? (i + 1) % results.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActiveIndex(i => (results.length ? (i <= 0 ? results.length - 1 : i - 1) : -1));
    } else if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        select(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const showDropdown = open && input.trim() !== '';
  const optionId = i => `${listId}-option-${i}`;

  return (
    <div ref={wrapperRef} style={styles.wrapper}>
      <input
        type="text"
        role="combobox"
        aria-label="Search medical terms"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={listId}
        aria-activedescendant={showDropdown && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        value={input}
        placeholder={placeholder}
        onChange={e => { setInput(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        style={styles.input}
      />

      {showDropdown && (
        <ul id={listId} role="listbox" style={styles.list}>
          {loading && <li style={styles.status}>Searching…</li>}
          {!loading && error && <li style={styles.status}>Search failed: {error}</li>}
          {!loading && !error && results.length === 0 && (
            <li style={styles.status}>No matching terms</li>
          )}
          {!loading && !error && results.map((term, i) => {
            const active = i === activeIndex;
            return (
              <li
                key={term.id}
                id={optionId(i)}
                role="option"
                aria-selected={active}
                onMouseDown={e => e.preventDefault()} // keep focus in the input
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => select(term)}
                style={{ ...styles.option, ...(active ? styles.optionActive : null) }}
              >
                <div style={styles.englishRow}>{term.english_term}</div>
                <div style={styles.tamilRow}>
                  <span>{term.tamil_term}</span>
                  {term.tamil_transliteration && (
                    <span style={styles.translit}>({term.tamil_transliteration})</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const styles = {
  wrapper: { position: 'relative', width: '100%', maxWidth: 520 },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '10px 14px',
    fontSize: 15,
    borderRadius: 10,
    border: '1px solid #334155',
    background: '#1E293B',
    color: '#F8FAFC',
    outline: 'none'
  },
  list: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    zIndex: 20,
    margin: 0,
    padding: 4,
    listStyle: 'none',
    background: '#0F172A',
    border: '1px solid #334155',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
    maxHeight: 360,
    overflowY: 'auto'
  },
  option: { padding: '8px 10px', borderRadius: 8, cursor: 'pointer', color: '#E2E8F0' },
  optionActive: { background: '#134E4A', outline: '2px solid #2DD4BF' },
  englishRow: { fontSize: 14, fontWeight: 600 },
  tamilRow: { fontSize: 12, color: '#94A3B8', marginTop: 2, display: 'flex', gap: 6, flexWrap: 'wrap' },
  translit: { color: '#64748B' },
  status: { padding: '8px 10px', fontSize: 13, color: '#94A3B8' }
};
