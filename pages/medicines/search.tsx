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

  // Debounced search function - queries OpenFDA directly (free public API)
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    const createSlug = (name: string) => 
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    try {
      // Search OpenFDA directly - this is the actual FDA drug database (free, no API key required)
      // This will find all drugs including nootropics, supplements registered as drugs, etc.
      const searchTerm = encodeURIComponent(query);
      const openFDAUrl = `https://api.fda.gov/drug/label.json?search=(openfda.brand_name:${searchTerm}+openfda.generic_name:${searchTerm}+openfda.substance_name:${searchTerm})&limit=15`;
      
      const openFDAResponse = await fetch(openFDAUrl);
      
      let fdaResults: SearchResult[] = [];
      
      if (openFDAResponse.ok) {
        const fdaData = await openFDAResponse.json();
        const results = fdaData?.results || [];
        
        // Extract unique drug names from FDA results
        const seenNames = new Set<string>();
        
        for (const result of results) {
          const openfda = result.openfda || {};
          
          // Get brand names
          const brandNames = openfda.brand_name || [];
          for (const name of brandNames) {
            const normalizedName = name.trim();
            if (normalizedName && !seenNames.has(normalizedName.toLowerCase())) {
              seenNames.add(normalizedName.toLowerCase());
              fdaResults.push({
                name: normalizedName,
                slug: createSlug(normalizedName),
                type: 'brand',
              });
            }
          }
          
          // Get generic names
          const genericNames = openfda.generic_name || [];
          for (const name of genericNames) {
            const normalizedName = name.trim();
            if (normalizedName && !seenNames.has(normalizedName.toLowerCase())) {
              seenNames.add(normalizedName.toLowerCase());
              fdaResults.push({
                name: normalizedName,
                slug: createSlug(normalizedName),
                type: 'generic',
              });
            }
          }
        }
      }

      // Also try RxNorm for additional suggestions (especially for common drug names)
      try {
        const rxNormResponse = await fetch(
          `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=5`
        );
        
        if (rxNormResponse.ok) {
          const rxNormData = await rxNormResponse.json();
          const candidates = rxNormData?.approximateGroup?.candidate || [];
          
          for (const candidate of candidates) {
            const name = candidate.name;
            if (name && !fdaResults.some(r => r.name.toLowerCase() === name.toLowerCase())) {
              fdaResults.push({
                name,
                slug: createSlug(name),
                rxcui: candidate.rxcui,
                type: 'generic',
              });
            }
          }
        }
      } catch (rxErr) {
        // RxNorm is supplementary, don't fail if it errors
        console.log('RxNorm supplementary search failed:', rxErr);
      }

      // Search PubChem for non-FDA compounds (nootropics, international drugs, research chemicals)
      // PubChem is a free NIH database with millions of compounds
      try {
        const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/synonyms/JSON`;
        const pubchemResponse = await fetch(pubchemUrl);
        
        if (pubchemResponse.ok) {
          const pubchemData = await pubchemResponse.json();
          const synonyms = pubchemData?.InformationList?.Information?.[0]?.Synonym || [];
          
          // Add the primary compound name if found
          if (synonyms.length > 0) {
            // Get the first synonym as the primary name (usually the most common)
            const primaryName = synonyms[0];
            if (!fdaResults.some(r => r.name.toLowerCase() === primaryName.toLowerCase())) {
              fdaResults.push({
                name: primaryName,
                slug: createSlug(primaryName),
                type: 'generic',
              });
            }
            
            // Add a few more relevant synonyms (limit to avoid clutter)
            const additionalSynonyms = synonyms.slice(1, 4);
            for (const synonym of additionalSynonyms) {
              // Only add if it's a readable name (not a chemical formula or ID)
              if (synonym.length < 50 && !synonym.match(/^\d+$/) && !synonym.match(/^[A-Z]{2,}-/)) {
                if (!fdaResults.some(r => r.name.toLowerCase() === synonym.toLowerCase())) {
                  fdaResults.push({
                    name: synonym,
                    slug: createSlug(synonym),
                    type: 'generic',
                  });
                }
              }
            }
          }
        }
      } catch (pubchemErr) {
        // PubChem is supplementary, don't fail if it errors
        console.log('PubChem supplementary search failed:', pubchemErr);
      }

      // Always add the user's exact query as an option (in case they know the exact drug name)
      // This allows users to navigate directly to drugs that might not appear in search results
      const userQuery = query.trim();
      if (!fdaResults.some(r => r.name.toLowerCase() === userQuery.toLowerCase())) {
        fdaResults.unshift({
          name: userQuery,
          slug: createSlug(userQuery),
          type: 'generic',
        });
      }

      // Limit results
      setResults(fdaResults.slice(0, 20));
      
    } catch (err) {
      console.error('Search error:', err);
      // On error, still allow direct navigation with user's query
      setResults([{
        name: query.trim(),
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
                <span className="ml-3 text-gray-600 dark:text-gray-400">Searching FDA database...</span>
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
                    MediVault searches multiple databases: <strong>OpenFDA</strong> (FDA-approved drugs), 
                    <strong>RxNorm</strong> (US prescription drugs), and <strong>PubChem</strong> (NIH database with 100M+ compounds including nootropics, 
                    international drugs, and research chemicals). This comprehensive search covers both FDA-approved medications 
                    and substances like Phenylpiracetam, Piracetam, and other nootropics.
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
