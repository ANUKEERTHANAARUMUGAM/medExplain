import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import {
  SEARCH_LIMIT,
  loadPublishedTerms,
  searchTermsInMemory,
  searchTermsRpc
} from '../services/medicalSearch';

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
// Arrow keys only work on the web build; on a phone, the user taps a suggestion.
export const MedicalSearchInput = ({
  supabase,
  mode = 'client',
  onSelect,
  limit = SEARCH_LIMIT,
  placeholder = 'Search English, Tamil or transliteration...'
}) => {
  const [input, setInput] = useState('');
  const query = useDebouncedValue(input, DEBOUNCE_MS);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [cache, setCache] = useState(null);
  const [rpcResults, setRpcResults] = useState([]);
  const [rpcLoading, setRpcLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestIdRef = useRef(0);

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

  const select = term => {
    setInput(term.english_term);
    setOpen(false);
    setActiveIndex(-1);
    onSelect?.(term);
  };

  // Web build only: react-native-web forwards key presses from a hardware keyboard.
  const handleKeyPress = ({ nativeEvent: { key } }) => {
    if (key === 'ArrowDown') {
      setOpen(true);
      setActiveIndex(i => (results.length ? (i + 1) % results.length : -1));
    } else if (key === 'ArrowUp') {
      setOpen(true);
      setActiveIndex(i => (results.length ? (i <= 0 ? results.length - 1 : i - 1) : -1));
    } else if (key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  // Enter: select the highlighted suggestion (web keyboard or keyboard "Done" on phone).
  const handleSubmit = () => {
    if (open && activeIndex >= 0 && results[activeIndex]) select(results[activeIndex]);
  };

  const showDropdown = open && input.trim() !== '';

  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        value={input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onChangeText={text => { setInput(text); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyPress={handleKeyPress}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Search medical terms"
      />

      {showDropdown && (
        <View style={styles.list}>
          {loading && <Text style={styles.status}>Searching...</Text>}
          {!loading && error && <Text style={styles.status}>Search failed: {error}</Text>}
          {!loading && !error && results.length === 0 && (
            <Text style={styles.status}>No matching terms</Text>
          )}
          {!loading && !error && results.map((term, i) => {
            const active = i === activeIndex;
            return (
              <TouchableOpacity
                key={term.id}
                activeOpacity={0.7}
                onPress={() => select(term)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text style={styles.englishText}>{term.english_term}</Text>
                <View style={styles.tamilRow}>
                  <Text style={styles.tamilText}>{term.tamil_term}</Text>
                  {term.tamil_transliteration ? (
                    <Text style={styles.translitText}>({term.tamil_transliteration})</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 20
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textWhite
  },
  list: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    padding: 4,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 6,
    zIndex: 20
  },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: borderRadius.sm
  },
  optionActive: {
    backgroundColor: colors.primaryLight
  },
  englishText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  tamilRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2
  },
  tamilText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.tamilAccent
  },
  translitText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 6
  },
  status: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textSecondary
  }
});
