"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
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

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setError(null);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateSearchQuery(query);
    if (!validation.valid) {
      setError(validation.error || "Invalid search query");
      toast.error(validation.error || "Invalid search query");
      return;
    }
    
    const trimmed = query.trim();
    
    // Navigate to marketplace with search query
    router.push(`/marketplace?search=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    const validation = validateSearchQuery(suggestion);
    if (validation.valid) {
      router.push(`/marketplace?search=${encodeURIComponent(suggestion)}`);
      onClose();
    } else {
      setError(validation.error || "Invalid search query");
      toast.error(validation.error || "Invalid search query");
    }
  };

  const validation = validateSearchQuery(query);
  const isValid = validation.valid;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white shadow-xl rounded-lg border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Search</h2>
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
              }}
              className={`pl-10 pr-4 py-3 text-base ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              autoFocus
              maxLength={100}
            />
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          {query.trim().length > 0 && query.trim().length < 2 && !error && (
            <p className="mt-2 text-xs text-gray-500">
              Enter at least 2 characters to search
            </p>
          )}
          <div className="flex items-center gap-3 mt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!isValid}
            >
              Search
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>

        {/* Quick Suggestions */}
        <div className="p-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Popular searches:</p>
          <div className="flex flex-wrap gap-2">
            {["Electronics", "Fashion", "Home & Garden", "Sports", "Books"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}






