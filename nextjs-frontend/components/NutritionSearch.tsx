'use client';

import React, { useState, useEffect, useRef } from 'react';

interface NutritionSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

const NutritionSearch: React.FC<NutritionSearchProps> = ({ value, onChange, onClear }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const popularFoods = [
    'apple', 'banana', 'orange', 'strawberry', 'blueberry',
    'broccoli', 'spinach', 'kale', 'carrot', 'sweet potato',
    'chicken breast', 'salmon', 'eggs', 'greek yogurt', 'almonds',
    'brown rice', 'quinoa', 'oats', 'whole wheat bread', 'avocado',
    'beef steak', 'tofu', 'lentils', 'black beans', 'chickpeas'
  ];

  useEffect(() => {
    if (value.trim()) {
      const filtered = popularFoods.filter(food =>
        food.toLowerCase().includes(value.toLowerCase()) &&
        food.toLowerCase() !== value.toLowerCase()
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [value]);

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSuggestions([]);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-text-subtle-light dark:text-text-subtle-dark">
            search
          </span>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search for foods, nutrients, or health tips..."
          className="w-full pl-12 pr-12 py-4 text-lg bg-white dark:bg-[#1C2C1F] border-2 border-border-light dark:border-border-dark rounded-xl shadow-sm focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 placeholder:text-text-subtle-light dark:placeholder:text-text-subtle-dark"
        />

        {value && (
          <button
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl transition-colors"
          >
            <span className="material-symbols-outlined text-text-subtle-light dark:text-text-subtle-dark">
              close
            </span>
          </button>
        )}
      </div>

      {isFocused && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1C2C1F] border border-border-light dark:border-border-dark rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-accent/10 transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-text-subtle-light dark:text-text-subtle-dark text-lg">
                restaurant
              </span>
              <span className="capitalize text-text-light dark:text-text-dark">
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      )}

      {!value && !isFocused && (
        <div className="flex flex-wrap justify-center gap-2 mt-4 text-sm text-text-subtle-light dark:text-text-subtle-dark">
          <span>Try:</span>
          {['protein', 'vitamin C', 'healthy fats', 'fiber rich'].map((tip) => (
            <button
              key={tip}
              onClick={() => onChange(tip)}
              className="px-3 py-1 bg-accent/10 hover:bg-accent/20 text-accent rounded-full transition-colors"
            >
              {tip}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NutritionSearch;
