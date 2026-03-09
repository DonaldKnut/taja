"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}

interface SearchSuggestion {
  type: 'suggestion' | 'recent' | 'popular';
  text: string;
}

// Validation: minimum 2 characters, max 100 characters
const validateSearchQuery = (query: string): { valid: boolean; error?: string } => {
  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Search query cannot be empty" };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: "Search query must be at least 2 characters" };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: "Search query must be less than 100 characters" };
  }

  // Check for only whitespace
  if (!trimmed.replace(/\s+/g, '').length) {
    return { valid: false, error: "Search query cannot be only spaces" };
  }

  return { valid: true };
};

export function SearchModal({ open, onClose, initialQuery = "" }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedQuery = useDebounce(query, 200);

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved).slice(0, 5));
        } catch {
          setRecentSearches([]);
        }
      }
    }
  }, []);

  // Fetch suggestions when query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}&limit=5`);
        const data = await response.json();

        if (data.success) {
          setSuggestions(data.data.suggestions || []);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setError(null);
      setSuggestions([]);
      setSelectedIndex(-1);
      // Focus the input when modal opens
      setTimeout(() => {
        const input = document.getElementById("search-input");
        input?.focus();
      }, 100);
    }
  }, [open, initialQuery]);

  useEffect(() => {
    // Clear error when query changes and becomes valid
    if (error) {
      const validation = validateSearchQuery(query);
      if (validation.valid) {
        setError(null);
      }
    }
  }, [query, error]);

  const saveRecentSearch = (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = (e?: React.FormEvent, searchQuery?: string) => {
    e?.preventDefault();

    const targetQuery = searchQuery || query;

    const validation = validateSearchQuery(targetQuery);
    if (!validation.valid) {
      setError(validation.error || "Invalid search query");
      toast.error(validation.error || "Invalid search query");
      return;
    }

    const trimmed = targetQuery.trim();
    saveRecentSearch(trimmed);

    // Navigate to marketplace with search query
    router.push(`/marketplace?search=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(undefined, suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allSuggestions = [...suggestions, ...recentSearches.filter(r => !suggestions.includes(r))];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > -1 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          handleSuggestionClick(allSuggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const validation = validateSearchQuery(query);
  const isValid = validation.valid;

  // Combine suggestions and recent searches for display
  const displaySuggestions = query.length >= 2
    ? suggestions
    : recentSearches;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-[#020617] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2rem] border border-slate-800 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px]" />
          <div className="absolute inset-0 motif-blanc opacity-[0.03]" />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-6 border-b border-slate-800/50 bg-slate-950/40 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="h-1 w-6 bg-taja-primary rounded-full" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Search</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative z-10 p-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 group-focus-within:text-taja-primary transition-colors h-5 w-5" />
            <input
              id="search-input"
              type="text"
              placeholder="Search for something special..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              className={`w-full h-16 pl-12 pr-12 bg-slate-900/50 border-2 transition-all rounded-2xl text-base font-bold text-white placeholder:text-slate-600 focus:outline-none focus:bg-slate-900 ${error
                ? 'border-rose-500/50 focus:border-rose-500 ring-4 ring-rose-500/5'
                : 'border-slate-800 focus:border-taja-primary ring-4 ring-transparent focus:ring-taja-primary/10'
                }`}
              autoFocus
              maxLength={100}
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-slate-700 border-t-taja-primary rounded-full" />
              </div>
            )}
          </div>
          {error && (
            <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-xs font-bold text-rose-500 uppercase tracking-widest ml-1">
              {error}
            </motion.p>
          )}
          {query.trim().length > 0 && query.trim().length < 2 && !error && (
            <p className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Minimum 2 characters required
            </p>
          )}
        </form>

        {/* Suggestions / Recent Searches */}
        {displaySuggestions.length > 0 && (
          <div className="relative z-10 border-t border-slate-800/50">
            <div className="px-6 py-3 bg-slate-950/40 flex items-center justify-between">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {query.length >= 2 ? 'Search Suggestions' : 'Recent Searches'}
              </p>
              {query.length < 2 && recentSearches.length > 0 && (
                <button
                  onClick={clearRecentSearches}
                  className="text-[9px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>
            <ul className="max-h-64 overflow-y-auto scrollbar-hide py-2">
              {displaySuggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-6 py-4 cursor-pointer flex items-center gap-4 transition-all group ${selectedIndex === index
                    ? 'bg-taja-primary/10 border-l-4 border-taja-primary'
                    : 'hover:bg-white/5 border-l-4 border-transparent'
                    }`}
                >
                  <div className={`p-2 rounded-xl transition-colors ${selectedIndex === index ? 'bg-taja-primary text-white' : 'bg-slate-900 text-slate-500 group-hover:text-slate-300'}`}>
                    {query.length >= 2 ? (
                      <Search className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <span className={`flex-1 text-sm font-bold tracking-tight transition-colors ${selectedIndex === index ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {suggestion}
                  </span>
                  <ArrowRight className={`h-4 w-4 transition-all ${selectedIndex === index ? 'text-taja-primary translate-x-0 opacity-100' : 'text-slate-700 -translate-x-2 opacity-0'}`} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Popular Categories */}
        {!query && (
          <div className="relative z-10 p-6 border-t border-slate-800/50">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Popular Categories</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Electronics", "Fashion", "Home & Garden", "Sports", "Beauty", "Books"].map((category) => (
                <button
                  key={category}
                  onClick={() => handleSuggestionClick(category)}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900/50 hover:bg-taja-primary hover:text-white border border-slate-800 hover:border-taja-primary rounded-xl transition-all"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="relative z-10 p-6 border-t border-slate-800/50 bg-slate-950/40 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={() => handleSearch()}
              className="flex-1 h-14 bg-white text-slate-950 hover:bg-taja-primary hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-premium transition-all"
              disabled={!isValid}
            >
              Search Now
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
          </div>
          <p className="mt-4 text-[9px] font-bold text-slate-600 text-center uppercase tracking-widest">
            Enter to Search • ↑↓ to Navigate • ESC to Close
          </p>
        </div>
      </div>
    </div>
  );
}






