'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { searchAll } from '@/services/apiService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResultItemType {
  id: string;
  contentType: string;
  title?: string;
  name?: string;
  description?: string;
  imageUrl?: string;
}

const SearchResultItem: React.FC<{ item: SearchResultItemType; onClose: () => void }> = ({ item, onClose }) => {
  const link = item.contentType === 'Article' ? `/article/${item.id}` : '#';

  return (
    <li className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <Link href={link} onClick={onClose} className="flex items-center gap-4">
        <img src={item.imageUrl} alt={item.title || item.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0 bg-gray-200" />
        <div className="overflow-hidden">
          <p className="font-bold truncate text-gray-900 dark:text-gray-100">{item.title || item.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.description}</p>
          <p className="text-xs font-bold uppercase mt-1 text-primary">{item.contentType}</p>
        </div>
      </Link>
    </li>
  );
};

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ type: 'All', sort: 'Relevance' });

  useEffect(() => {
    const performSearch = async () => {
      if (query.length > 2) {
        setLoading(true);
        const searchResults = await searchAll(query, filters);
        setResults(searchResults);
        setLoading(false);
      } else {
        setResults([]);
      }
    };
    const handler = setTimeout(performSearch, 300);
    return () => clearTimeout(handler);
  }, [query, filters]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl h-full max-h-[80vh] rounded-xl shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
          <span className="material-symbols-outlined text-xl text-gray-500 dark:text-gray-400 mr-2">search</span>
          <input
            type="text"
            placeholder="Search for articles, products, videos..."
            className="w-full bg-transparent focus:outline-none text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} className="ml-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close search">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-2 text-sm">
          <select value={filters.type} onChange={e => setFilters(f => ({...f, type: e.target.value}))} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md p-2 border-transparent focus:border-primary focus:ring-primary">
            <option>All</option>
            <option>Article</option>
            <option>Product</option>
            <option>Video</option>
          </select>
          <select value={filters.sort} onChange={e => setFilters(f => ({...f, sort: e.target.value}))} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md p-2 border-transparent focus:border-primary focus:ring-primary">
            <option>Relevance</option>
            <option>Newest</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && <div className="text-center p-4 text-gray-600 dark:text-gray-400">Searching...</div>}
          {!loading && results.length === 0 && query.length > 2 && <div className="text-center p-4 text-gray-600 dark:text-gray-400">No results found for &quot;{query}&quot;.</div>}
          {!loading && results.length > 0 && (
            <ul className="space-y-4">
              {results.map((item, index) => <SearchResultItem key={`${item.id}-${index}`} item={item} onClose={onClose} />)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
