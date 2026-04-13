"use client";

import { useState, useRef, useEffect } from "react";
import { searchCities } from "@/lib/city-matching";
import { ChevronDown, X } from "lucide-react";

interface CitySearchProps {
  cities: string[];
  carrefourCities?: string[];
  value: string | null;
  onChange: (city: string | null) => void;
  placeholder?: string;
}

export function CitySearch({
  cities,
  carrefourCities = [],
  value,
  onChange,
  placeholder = "חפש עיר...",
}: CitySearchProps) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setResults(searchCities(query, cities, carrefourCities, 8));
  }, [query, cities, carrefourCities]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(city: string) {
    setQuery(city);
    onChange(city);
    setOpen(false);
  }

  function handleClear() {
    setQuery("");
    onChange(null);
    inputRef.current?.focus();
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    // If cleared, reset value
    if (!val) onChange(null);
    else {
      // Check exact match
      const exact = cities.find(
        (c) => c.toLowerCase() === val.toLowerCase()
      );
      if (exact) onChange(exact);
      else onChange(null);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full h-11 px-4 pr-9 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          aria-label="חיפוש עיר"
          aria-expanded={open}
          aria-haspopup="listbox"
          role="combobox"
        />
        <span className="absolute left-3 text-muted-foreground pointer-events-none">
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors pointer-events-auto"
              aria-label="נקה בחירה"
            >
              <X size={16} />
            </button>
          ) : (
            <ChevronDown size={16} />
          )}
        </span>
      </div>

      {open && results.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-md max-h-52 overflow-auto py-1"
        >
          {results.map((city) => (
            <li
              key={city}
              role="option"
              aria-selected={city === value}
              onClick={() => handleSelect(city)}
              className="px-4 py-2.5 text-sm cursor-pointer hover:bg-muted transition-colors data-[selected=true]:bg-muted font-medium"
              data-selected={city === value}
            >
              {city}
            </li>
          ))}
        </ul>
      )}

      {open && query && results.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-md px-4 py-3 text-sm text-muted-foreground">
          לא נמצאו תוצאות
        </div>
      )}
    </div>
  );
}
