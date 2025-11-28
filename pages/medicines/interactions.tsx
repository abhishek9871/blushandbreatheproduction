/**
 * Drug Interaction Checker Page
 * 
 * Allows users to check potential interactions between two drugs.
 * Uses comprehensive local database + OpenFDA API for real interaction data.
 * 
 * Route: /medicines/interactions
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface InteractionResult {
  severity: 'severe' | 'moderate' | 'mild' | 'unknown';
  description: string;
  mechanism?: string;
  management?: string;
  source: string;
}

interface InteractionResponse {
  success: boolean;
  data: InteractionResult[];
  drugA: string;
  drugB: string;
  error?: string;
  sources?: string[];
}

// Comprehensive drug list with common medications
const COMMON_DRUGS = [
  // Pain & Anti-inflammatory
  'Aspirin', 'Ibuprofen', 'Naproxen', 'Acetaminophen', 'Tramadol', 'Hydrocodone', 'Oxycodone',
  'Diclofenac', 'Meloxicam', 'Celecoxib', 'Indomethacin',
  // Cardiovascular
  'Warfarin', 'Clopidogrel', 'Lisinopril', 'Enalapril', 'Losartan', 'Metoprolol', 'Atenolol',
  'Amlodipine', 'Diltiazem', 'Verapamil', 'Furosemide', 'Hydrochlorothiazide', 'Spironolactone',
  // Cholesterol
  'Simvastatin', 'Atorvastatin', 'Pravastatin', 'Rosuvastatin', 'Lovastatin',
  // Diabetes
  'Metformin', 'Glipizide', 'Glyburide', 'Insulin', 'Sitagliptin',
  // Mental Health
  'Sertraline', 'Fluoxetine', 'Escitalopram', 'Paroxetine', 'Duloxetine', 'Venlafaxine',
  'Alprazolam', 'Lorazepam', 'Diazepam', 'Clonazepam', 'Trazodone', 'Buspirone',
  'Quetiapine', 'Risperidone', 'Aripiprazole',
  // GI & Acid
  'Omeprazole', 'Pantoprazole', 'Esomeprazole', 'Ranitidine', 'Famotidine',
  // Thyroid
  'Levothyroxine',
  // Nerve/Seizure
  'Gabapentin', 'Pregabalin', 'Carbamazepine', 'Valproic Acid', 'Lamotrigine',
  // Antibiotics
  'Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Clarithromycin', 'Metronidazole',
  // Antifungal
  'Ketoconazole', 'Fluconazole', 'Itraconazole',
  // Steroids
  'Prednisone', 'Dexamethasone',
  // Other
  'Vitamin K', 'Potassium', 'Calcium', 'Iron', 'Alcohol', 'Grapefruit'
].sort();

export default function DrugInteractionsPage() {
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [results, setResults] = useState<InteractionResult | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestionsA, setShowSuggestionsA] = useState(false);
  const [showSuggestionsB, setShowSuggestionsB] = useState(false);
  const [recentSearches, setRecentSearches] = useState<Array<{drugA: string, drugB: string}>>([]);
  
  const inputARef = useRef<HTMLInputElement>(null);
  const inputBRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentInteractionSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  const saveRecentSearch = (drugA: string, drugB: string) => {
    const newSearch = { drugA, drugB };
    const updated = [newSearch, ...recentSearches.filter(
      s => !(s.drugA === drugA && s.drugB === drugB)
    )].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentInteractionSearches', JSON.stringify(updated));
  };

  const checkInteraction = useCallback(async () => {
    if (!drugA.trim() || !drugB.trim()) {
      setError('Please enter both drug names');
      return;
    }

    if (drugA.trim().toLowerCase() === drugB.trim().toLowerCase()) {
      setError('Please enter two different drugs');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setSources([]);

    try {
      // Use our new comprehensive API
      const params = new URLSearchParams({ 
        drugA: drugA.trim(), 
        drugB: drugB.trim() 
      });
      
      const response = await fetch(`/api/substances/openfda-interactions?${params}`);
      const data: InteractionResponse = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        setResults(data.data[0]);
        setSources(data.sources || []);
        saveRecentSearch(drugA.trim(), drugB.trim());
      } else if (data.error) {
        setError(data.error);
      } else {
        setResults({
          severity: 'unknown',
          description: `No documented interaction found between ${drugA} and ${drugB}. However, this does not guarantee safety.`,
          management: 'Always consult your healthcare provider or pharmacist for personalized advice.',
          source: 'No data available'
        });
      }
    } catch (err) {
      console.error('Interaction check error:', err);
      setError('Failed to check interactions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [drugA, drugB, recentSearches]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      checkInteraction();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return {
        bg: 'bg-red-50 dark:bg-red-950/50',
        border: 'border-red-500',
        text: 'text-red-800 dark:text-red-200',
        badge: 'bg-red-600 text-white'
      };
      case 'moderate': return {
        bg: 'bg-orange-50 dark:bg-orange-950/50',
        border: 'border-orange-500',
        text: 'text-orange-800 dark:text-orange-200',
        badge: 'bg-orange-500 text-white'
      };
      case 'mild': return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/50',
        border: 'border-yellow-500',
        text: 'text-yellow-800 dark:text-yellow-200',
        badge: 'bg-yellow-500 text-black'
      };
      default: return {
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        border: 'border-blue-400',
        text: 'text-blue-800 dark:text-blue-200',
        badge: 'bg-blue-500 text-white'
      };
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'severe': return 'dangerous';
      case 'moderate': return 'warning';
      case 'mild': return 'info';
      default: return 'help';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'severe': return 'Severe - Avoid Combination';
      case 'moderate': return 'Moderate - Use Caution';
      case 'mild': return 'Mild - Monitor';
      default: return 'Information';
    }
  };

  const filteredSuggestionsA = COMMON_DRUGS.filter(drug =>
    drug.toLowerCase().includes(drugA.toLowerCase()) && 
    drug.toLowerCase() !== drugA.toLowerCase()
  ).slice(0, 8);

  const filteredSuggestionsB = COMMON_DRUGS.filter(drug =>
    drug.toLowerCase().includes(drugB.toLowerCase()) && 
    drug.toLowerCase() !== drugB.toLowerCase()
  ).slice(0, 8);

  const swapDrugs = () => {
    const temp = drugA;
    setDrugA(drugB);
    setDrugB(temp);
  };

  const clearForm = () => {
    setDrugA('');
    setDrugB('');
    setResults(null);
    setError(null);
    setSources([]);
    inputARef.current?.focus();
  };

  return (
    <>
      <Head>
        <title>Drug Interaction Checker | MediVault</title>
        <meta name="description" content="Check potential drug interactions between medications. Enter two drug names to see if they have any known interactions. Powered by FDA data." />
        <meta name="keywords" content="drug interaction checker, medication interactions, drug safety, FDA drug data" />
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <nav className="flex items-center gap-2 text-sm text-blue-200 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/medicines" className="hover:text-white transition-colors">MediVault</Link>
              <span>/</span>
              <span className="text-white">Interaction Checker</span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">compare_arrows</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Drug Interaction Checker</h1>
                <p className="text-blue-200 mt-1">Check for potential interactions between medications</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 mt-6 text-sm">
              <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm align-middle mr-1">database</span>
                Curated interaction database
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm align-middle mr-1">verified</span>
                FDA drug label data
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4">
            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">info</span>
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Medical Disclaimer:</strong> This tool provides general information based on FDA drug labels and clinical references. 
                  It should not replace professional medical advice. Always consult your doctor or pharmacist before changing medications.
                </div>
              </div>
            </div>

            {/* Input Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-end mb-6">
                {/* Drug A Input */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Medication
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">medication</span>
                    <input
                      ref={inputARef}
                      type="text"
                      value={drugA}
                      onChange={(e) => setDrugA(e.target.value)}
                      onFocus={() => setShowSuggestionsA(true)}
                      onBlur={() => setTimeout(() => setShowSuggestionsA(false), 200)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., Warfarin, Aspirin"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      autoComplete="off"
                    />
                    {drugA && (
                      <button
                        onClick={() => setDrugA('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                  {showSuggestionsA && filteredSuggestionsA.length > 0 && drugA && (
                    <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredSuggestionsA.map((drug) => (
                        <li
                          key={drug}
                          onClick={() => {
                            setDrugA(drug);
                            setShowSuggestionsA(false);
                          }}
                          className="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-200 first:rounded-t-xl last:rounded-b-xl flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm text-gray-400">medication</span>
                          {drug}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Swap Button */}
                <button
                  onClick={swapDrugs}
                  className="hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors self-end mb-1.5"
                  title="Swap drugs"
                >
                  <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">swap_horiz</span>
                </button>

                {/* Drug B Input */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Second Medication
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">medication</span>
                    <input
                      ref={inputBRef}
                      type="text"
                      value={drugB}
                      onChange={(e) => setDrugB(e.target.value)}
                      onFocus={() => setShowSuggestionsB(true)}
                      onBlur={() => setTimeout(() => setShowSuggestionsB(false), 200)}
                      onKeyPress={handleKeyPress}
                      placeholder="e.g., Ibuprofen, Metformin"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      autoComplete="off"
                    />
                    {drugB && (
                      <button
                        onClick={() => setDrugB('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                  {showSuggestionsB && filteredSuggestionsB.length > 0 && drugB && (
                    <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredSuggestionsB.map((drug) => (
                        <li
                          key={drug}
                          onClick={() => {
                            setDrugB(drug);
                            setShowSuggestionsB(false);
                          }}
                          className="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-200 first:rounded-t-xl last:rounded-b-xl flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm text-gray-400">medication</span>
                          {drug}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Mobile Swap Button */}
              <div className="flex md:hidden justify-center mb-4">
                <button
                  onClick={swapDrugs}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  <span className="material-symbols-outlined text-sm">swap_vert</span>
                  Swap
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={checkInteraction}
                  disabled={loading || !drugA.trim() || !drugB.trim()}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Checking FDA Database...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">search</span>
                      Check Interaction
                    </>
                  )}
                </button>
                {(drugA || drugB || results) && (
                  <button
                    onClick={clearForm}
                    className="px-4 py-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
                    title="Clear all"
                  >
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 flex items-center gap-2">
                  <span className="material-symbols-outlined">error</span>
                  {error}
                </div>
              )}
            </div>

            {/* Results */}
            {results && (
              <div className={`rounded-2xl border-2 p-6 md:p-8 mb-8 ${getSeverityColor(results.severity).bg} ${getSeverityColor(results.severity).border}`}>
                {/* Severity Badge */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getSeverityColor(results.severity).badge}`}>
                      <span className="material-symbols-outlined text-2xl">
                        {getSeverityIcon(results.severity)}
                      </span>
                    </div>
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getSeverityColor(results.severity).badge}`}>
                        {getSeverityLabel(results.severity)}
                      </span>
                      <p className={`text-sm mt-1 ${getSeverityColor(results.severity).text} opacity-80`}>
                        {drugA} + {drugB}
                      </p>
                    </div>
                  </div>
                  
                  {sources.length > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-lg">
                      <span className="material-symbols-outlined text-xs align-middle mr-1">source</span>
                      {sources.join(', ')}
                    </div>
                  )}
                </div>

                {/* Interaction Details */}
                <div className={`space-y-4 ${getSeverityColor(results.severity).text}`}>
                  {/* Description Card */}
                  <div className="bg-white/40 dark:bg-black/20 rounded-xl p-5 border border-current/10">
                    <h3 className="font-bold text-base mb-3 flex items-center gap-2 pb-2 border-b border-current/20">
                      <span className="material-symbols-outlined text-xl">description</span>
                      Description
                    </h3>
                    <p className="leading-relaxed text-[15px]">{results.description}</p>
                  </div>

                  {results.mechanism && (
                    <div className="bg-white/40 dark:bg-black/20 rounded-xl p-5 border border-current/10">
                      <h3 className="font-bold text-base mb-3 flex items-center gap-2 pb-2 border-b border-current/20">
                        <span className="material-symbols-outlined text-xl">science</span>
                        Mechanism of Interaction
                      </h3>
                      <p className="leading-relaxed text-[15px]">{results.mechanism}</p>
                    </div>
                  )}

                  {results.management && (
                    <div className="bg-white/60 dark:bg-black/30 rounded-xl p-5 border-2 border-current/20">
                      <h3 className="font-bold text-base mb-3 flex items-center gap-2 pb-2 border-b border-current/20">
                        <span className="material-symbols-outlined text-xl">medical_information</span>
                        Clinical Recommendation
                      </h3>
                      <p className="leading-relaxed text-[15px]">{results.management}</p>
                    </div>
                  )}
                </div>

                {/* Source Attribution */}
                {results.source && (
                  <div className="mt-6 pt-4 border-t border-current/20 text-sm opacity-70">
                    <strong>Source:</strong> {results.source}
                  </div>
                )}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && !results && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-gray-400">history</span>
                  Recent Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setDrugA(search.drugA);
                        setDrugB(search.drugB);
                      }}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors"
                    >
                      {search.drugA} + {search.drugB}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Common Interaction Examples */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-500">lightbulb</span>
                Try These Common Interactions
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { a: 'Warfarin', b: 'Aspirin', type: 'severe' },
                  { a: 'Sertraline', b: 'Tramadol', type: 'severe' },
                  { a: 'Metformin', b: 'Alcohol', type: 'moderate' },
                  { a: 'Lisinopril', b: 'Potassium', type: 'moderate' },
                  { a: 'Simvastatin', b: 'Grapefruit', type: 'moderate' },
                  { a: 'Levothyroxine', b: 'Calcium', type: 'mild' },
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setDrugA(example.a);
                      setDrugB(example.b);
                    }}
                    className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      example.type === 'severe' ? 'bg-red-500' :
                      example.type === 'moderate' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`} />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {example.a} + {example.b}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500">tips_and_updates</span>
                  Tips for Safe Medication Use
                </h3>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-green-500">check_circle</span>
                    Keep an updated list of all your medications
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-green-500">check_circle</span>
                    Include supplements and OTC medications
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-green-500">check_circle</span>
                    Use one pharmacy for all prescriptions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-green-500">check_circle</span>
                    Always tell your doctor about all medications
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">emergency</span>
                  When to Seek Immediate Help
                </h3>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-red-500">warning</span>
                    Unusual bleeding or bruising
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-red-500">warning</span>
                    Severe dizziness or fainting
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-red-500">warning</span>
                    Difficulty breathing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sm mt-0.5 text-red-500">warning</span>
                    Rapid heartbeat or chest pain
                  </li>
                </ul>
                <Link
                  href="/info/emergency"
                  className="mt-4 inline-flex items-center gap-2 text-red-600 dark:text-red-400 font-medium hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  View Emergency Information
                </Link>
              </div>
            </div>

            {/* Severity Legend */}
            <div className="mt-8 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Understanding Severity Levels</h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Severe</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Avoid combination</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-orange-500 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Moderate</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Use with caution</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-yellow-500 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Mild</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Monitor closely</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white text-sm">Unknown</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">No data / consult provider</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
