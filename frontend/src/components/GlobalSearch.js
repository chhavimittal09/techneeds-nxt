'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Search, X, BookOpen, Users, Compass, ChevronRight } from './Icons';

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.globalSearch(query);
        setResults(data.results || []);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (href) => {
    onClose();
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl bg-surface-200 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-surface-300/40">
          <Search size={18} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resources, cohorts, mentees..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white p-1">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <div className="p-4 text-center text-xs text-slate-400">Searching...</div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">No results found for "{query}".</div>
          )}

          {results.map((res, i) => (
            <button
              key={i}
              onClick={() => handleSelect(res.href)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 text-left transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-surface-300 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                  {res.kind === 'resource' ? <BookOpen size={16} /> : res.kind === 'mentee' ? <Users size={16} /> : <Compass size={16} />}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-white truncate">{res.title}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{res.subtitle}</p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
