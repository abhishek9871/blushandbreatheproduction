/**
 * MediVault - Advanced Medicine Search Page
 * 
 * Real-time search with RxNorm autocomplete.
 * Users can search any FDA-approved drug.
 * 
 * Route: /medicines/search
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface SearchResult {
  name: string;
  slug: string;
  rxcui?: string;
  type: 'brand' | 'generic' | 'ingredient';
}

export default function MedicineSearchPage() {
  const router = useRouter();
  const { q } = router.query;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Initialize search from URL query
  useEffect(() => {
    if (typeof q === 'string' && q.trim()) {
      setSearchQuery(q);
      performSearch(q);
    }
  }, [q]);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      // Search RxNorm for drug names
      const rxNormResponse = await fetch(
        `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(query)}`
      );
      
      if (rxNormResponse.ok) {
        const rxNormData = await rxNormResponse.json();
        const suggestions = rxNormData?.suggestionGroup?.suggestionList?.suggestion || [];
        
        // Also search for exact and approximate matches
        const approxResponse = await fetch(
          `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=10`
        );
        
        let approxResults: string[] = [];
        if (approxResponse.ok) {
          const approxData = await approxResponse.json();
          approxResults = approxData?.approximateGroup?.candidate?.map((c: any) => c.name) || [];
        }

        // Combine and deduplicate results
        const allNames = [...new Set([...suggestions, ...approxResults])].slice(0, 20);
        
        const formattedResults: SearchResult[] = allNames.map((name: string) => ({
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          type: 'generic' as const,
        }));

        setResults(formattedResults);
      } else {
        // Fallback: just create a direct search result
        setResults([{
          name: query,
          slug: query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          type: 'generic',
        }]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search temporarily unavailable. Please try again.');
      // Still allow direct navigation
      setResults([{
        name: query,
        slug: query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        type: 'generic',
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/medicines/search?q=${encodeURIComponent(searchQuery.trim())}`, undefined, { shallow: true });
      performSearch(searchQuery.trim());
    }
  };

  return (
    <>
      <Head>
        <title>Search Medicines - MediVault | HealthBeauty Hub</title>
        <meta name="description" content="Search any FDA-approved medicine. Get comprehensive drug information, dosage, side effects, and interactions." />
        <meta name="robots" content="index, follow" />
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-8">
          <div className="max-w-4xl mx-auto px-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400">Home</Link>
              <span>/</span>
              <Link href="/medicines" className="hover:text-blue-600 dark:hover:text-blue-400">MediVault</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">Search</span>
            </nav>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-blue-600 text-4xl">search</span>
              Search Medicines
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Search any FDA-approved drug by name, brand, or active ingredient.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type a medicine name (e.g., Modafinil, Lisinopril, Metformin...)"
                  className="w-full pl-12 pr-28 py-4 text-lg rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Results Section */}
        <section className="py-8">
          <div className="max-w-4xl mx-auto px-4">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Searching RxNorm database...</span>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Found {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
                </p>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <Link
                      key={`${result.slug}-${index}`}
                      href={`/medicine/${result.slug}`}
                      className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">
                            medication
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {result.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Click to view full drug information
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-500 transition-colors">
                          arrow_forward
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!loading && searched && results.length === 0 && searchQuery.length >= 2 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                  search_off
                </span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We couldn&apos;t find &ldquo;{searchQuery}&rdquo; in our database.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                  Try a different spelling or search on the official FDA website:
                </p>
                <a
                  href={`https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&term=${encodeURIComponent(searchQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Search on FDA.gov
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                </a>
              </div>
            )}

            {/* Initial State */}
            {!loading && !searched && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                  medication
                </span>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Search Any Medicine
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Type at least 2 characters to start searching
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Info Footer */}
        <section className="py-8 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl flex-shrink-0">info</span>
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">About MediVault Search</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    MediVault uses the RxNorm database from the National Library of Medicine and OpenFDA for comprehensive drug information. 
                    Results are cached for fast access. If a medicine page doesn&apos;t exist yet, it will be generated automatically from FDA data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
