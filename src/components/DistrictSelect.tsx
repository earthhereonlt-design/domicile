import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// Static list of Uttar Pradesh districts in Hindi & English
export const UP_DISTRICTS = [
  { hindi: 'खीरी', english: 'Kheri' },
  { hindi: 'लखनऊ', english: 'Lucknow' },
  { hindi: 'कानपूर नगर', english: 'Kanpur Nagar' },
  { hindi: 'प्रयागराज', english: 'Prayagraj' },
  { hindi: 'वाराणसी', english: 'Varanasi' },
  { hindi: 'गोरखपुर', english: 'Gorakhpur' },
  { hindi: 'गौतम बुद्ध नगर', english: 'Gautam Buddha Nagar' },
  { hindi: 'गाजियाबाद', english: 'Ghaziabad' },
  { hindi: 'आगरा', english: 'Agra' },
  { hindi: 'मेरठ', english: 'Meerut' },
  { hindi: 'बरेली', english: 'Bareilly' },
  { hindi: 'अलीगढ़', english: 'Aligarh' },
  { hindi: 'झांसी', english: 'Jhansi' },
  { hindi: 'अयोध्या', english: 'Ayodhya' },
  { hindi: 'मथुरा', english: 'Mathura' },
  { hindi: 'मुरादाबाद', english: 'Moradabad' },
  { hindi: 'सहारनपुर', english: 'Saharanpur' },
  { hindi: 'जौनपुर', english: 'Jaunpur' },
  { hindi: 'बिजनौर', english: 'Bijnor' },
  { hindi: 'मुजफ्फरनगर', english: 'Muzaffarnagar' },
  { hindi: 'देवरिया', english: 'Deoria' },
  { hindi: 'गोंडा', english: 'Gonda' },
  { hindi: 'आजमगढ़', english: 'Azamgarh' },
  { hindi: 'उन्नाव', english: 'Unnao' },
  { hindi: 'सीतापुर', english: 'Sitapur' },
  { hindi: 'बस्ती', english: 'Basti' },
];

interface DistrictSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function DistrictSelect({ value, onChange, error }: DistrictSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter districts based on search term
  const filteredDistricts = UP_DISTRICTS.filter(
    (d) =>
      d.hindi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.english.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search term when value changes
  useEffect(() => {
    if (value) {
      const match = UP_DISTRICTS.find((d) => `${d.hindi} / ${d.english}` === value || d.hindi === value || d.english === value);
      if (match) {
        setSearchTerm(`${match.hindi} / ${match.english}`);
      }
    } else {
      setSearchTerm('');
    }
  }, [value]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredDistricts.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredDistricts.length) % filteredDistricts.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredDistricts[highlightedIndex]) {
          selectDistrict(filteredDistricts[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
    }
  };

  const selectDistrict = (district: typeof UP_DISTRICTS[0]) => {
    const displayVal = `${district.hindi} / ${district.english}`;
    onChange(displayVal);
    setSearchTerm(displayVal);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-text mb-2">
        Select District
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm(''); // Clear on focus to let search immediately
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type or select a district (e.g. खीरी / Kheri)"
          className={cn(
            "w-full px-4 py-3 bg-white dark:bg-stone-900 border text-foreground text-sm rounded-lg outline-hidden transition-border shadow-2xs",
            error
              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-border-color focus:border-foreground/45"
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-muted-text">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15l7.5-7.5-7.5-7.5" className="rotate-90 origin-center" />
          </svg>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {/* Dropdown menu */}
      {isOpen && filteredDistricts.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white dark:bg-stone-900 border border-border-color rounded-lg shadow-md max-h-60 overflow-y-auto overflow-x-hidden py-1">
          {filteredDistricts.map((district, index) => {
            const displayStr = `${district.hindi} / ${district.english}`;
            return (
              <li
                key={displayStr}
                onClick={() => selectDistrict(district)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  "px-4 py-2 text-sm cursor-pointer transition-colors text-foreground",
                  index === highlightedIndex
                    ? "bg-stone-100 dark:bg-stone-800 font-medium"
                    : "hover:bg-stone-50 dark:hover:bg-stone-950/30"
                )}
              >
                <div className="flex justify-between items-center">
                  <span>{district.hindi}</span>
                  <span className="text-xs text-muted-text">{district.english}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isOpen && filteredDistricts.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-stone-900 border border-border-color rounded-lg shadow-md p-4 text-center text-sm text-muted-text">
          No districts found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
}
