"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Loader2, X } from "lucide-react";

interface SearchComboboxProps<T> {
  placeholder?: string;
  selectedLabel?: string;
  onSearch: (query: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  onClear?: () => void;
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
  selected?: T | null;
  renderSelected?: (item: T) => React.ReactNode;
  disabled?: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function SearchCombobox<T>({
  placeholder = "Buscar...",
  onSearch,
  onSelect,
  onClear,
  renderItem,
  getKey,
  selected,
  renderSelected,
  disabled,
}: SearchComboboxProps<T>) {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<T[]>([]);
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const data = await onSearch(q);
      setResults(data);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onSearch]);

  useEffect(() => {
    if (debouncedQuery.length >= 1) search(debouncedQuery);
    else { setResults([]); setOpen(false); }
  }, [debouncedQuery, search]);

  if (selected) {
    return (
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-xl"
        style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE" }}
      >
        <div className="flex-1 min-w-0">
          {renderSelected ? renderSelected(selected) : null}
        </div>
        {onClear && !disabled && (
          <button
            type="button"
            onClick={() => { onClear(); setQuery(""); }}
            className="w-5 h-5 flex items-center justify-center rounded ml-2 shrink-0"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        className="flex items-center gap-2 px-3 rounded-xl transition-all"
        style={{
          background: "#fff",
          border: `1.5px solid ${open ? "#1D4ED8" : "#E2E8F0"}`,
          height: "42px",
          boxShadow: open ? "0 0 0 3px rgba(29,78,216,0.1)" : "none",
        }}
      >
        {loading
          ? <Loader2 size={15} className="animate-spin shrink-0" style={{ color: "#94A3B8" }} />
          : <Search size={15} className="shrink-0" style={{ color: open ? "#1D4ED8" : "#94A3B8" }} />
        }
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          disabled={disabled}
          className="flex-1 text-sm outline-none"
          style={{ background: "transparent", border: "none", color: "#0F172A" }}
        />
        {query && (
          <button type="button" onClick={() => { setQuery(""); setOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8" }}>
            <X size={13} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 200,
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
            maxHeight: "220px",
            overflowY: "auto",
            padding: "4px",
          }}
        >
          {results.map(item => (
            <button
              key={getKey(item)}
              type="button"
              onClick={() => { onSelect(item); setQuery(""); setOpen(false); setResults([]); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ background: "none", border: "none", cursor: "pointer", display: "block" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      )}

      {open && !loading && results.length === 0 && query.length >= 1 && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200, background: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
          <p className="text-xs" style={{ color: "#94A3B8" }}>Nenhum resultado para &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
