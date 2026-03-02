"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { useDebounce } from "@/hooks/useDebounce";

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
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Search Products</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              id="search-input"
              type="text"
              placeholder="Search products, shops, or categories..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              className={`pl-10 pr-4 py-3 text-base ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              autoFocus
              maxLength={100}
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-primary rounded-full" />
              </div>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          {query.trim().length > 0 && query.trim().length < 2 && !error && (
            <p className="mt-2 text-xs text-gray-500">
              Enter at least 2 characters to search
            </p>
          )}
        </form>

        {/* Suggestions / Recent Searches */}
        {displaySuggestions.length > 0 && (
          <div className="border-t border-gray-100">
            <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 uppercase">
                {query.length >= 2 ? 'Suggestions' : 'Recent Searches'}
              </p>
              {query.length < 2 && recentSearches.length > 0 && (
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Clear
                </button>
              )}
            </div>
            <ul className="max-h-60 overflow-y-auto">
              {displaySuggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
                    selectedIndex === index 
                      ? 'bg-primary/5' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {query.length >= 2 ? (
                    <Search className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="flex-1 text-sm text-gray-700">{suggestion}</span>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Popular Categories */}
        {!query && (
          <div className="p-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3 flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Popular Categories
            </p>
            <div className="flex flex-wrap gap-2">
              {["Electronics", "Fashion", "Home & Garden", "Sports", "Beauty", "Books"].map((category) => (
                <button
                  key={category}
                  onClick={() => handleSuggestionClick(category)}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <Button 
              type="button"
              onClick={() => handleSearch()}
              className="flex-1"
              disabled={!isValid}
            >
              Search
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Press Enter to search • ↑↓ to navigate • ESC to close
          </p>
        </div>
      </div>
    </div>
  );
}






