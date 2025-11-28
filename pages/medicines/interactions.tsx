/**
 * Drug Interaction Checker Page
 * 
 * Allows users to check potential interactions between two drugs.
 * Uses OpenFDA data via the existing API endpoint.
 * 
 * Route: /medicines/interactions
 */

import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface InteractionResult {
  severity: 'severe' | 'moderate' | 'mild' | 'unknown';
  description: string;
  mechanism?: string;
  management?: string;
}

// Common drug suggestions for autocomplete
const COMMON_DRUGS = [
  'Aspirin', 'Ibuprofen', 'Acetaminophen', 'Warfarin', 'Metformin',
  'Lisinopril', 'Atorvastatin', 'Omeprazole', 'Metoprolol', 'Amlodipine',
  'Losartan', 'Gabapentin', 'Hydrochlorothiazide', 'Sertraline', 'Simvastatin',
  'Levothyroxine', 'Pantoprazole', 'Furosemide', 'Prednisone', 'Tramadol',
  'Clopidogrel', 'Alprazolam', 'Duloxetine', 'Escitalopram', 'Trazodone'
];

// Known interaction database (common interactions)
const KNOWN_INTERACTIONS: Record<string, Record<string, InteractionResult>> = {
  'warfarin': {
    'aspirin': {
      severity: 'severe',
      description: 'Increased risk of bleeding when Warfarin is combined with Aspirin.',
      mechanism: 'Both drugs affect blood clotting through different mechanisms. Warfarin inhibits vitamin K-dependent clotting factors while Aspirin inhibits platelet aggregation.',
      management: 'Avoid combination if possible. If necessary, use lowest effective aspirin dose and monitor INR frequently. Watch for signs of bleeding.'
    },
    'ibuprofen': {
      severity: 'severe',
      description: 'NSAIDs like Ibuprofen can increase the anticoagulant effect of Warfarin and increase bleeding risk.',
      mechanism: 'Ibuprofen inhibits platelet function and may displace Warfarin from protein binding sites.',
      management: 'Avoid combination. Consider acetaminophen as alternative pain reliever. If NSAID necessary, use lowest dose for shortest duration.'
    }
  },
  'metformin': {
    'alcohol': {
      severity: 'moderate',
      description: 'Alcohol can increase the risk of lactic acidosis when taken with Metformin.',
      mechanism: 'Both alcohol and Metformin affect lactate metabolism in the liver.',
      management: 'Limit alcohol consumption. Avoid excessive or binge drinking while on Metformin.'
    }
  },
  'sertraline': {
    'tramadol': {
      severity: 'severe',
      description: 'Risk of serotonin syndrome when combining Sertraline with Tramadol.',
      mechanism: 'Both drugs increase serotonin levels. Combined use can lead to dangerous serotonin accumulation.',
      management: 'Avoid combination if possible. If used together, start with low doses and monitor for signs of serotonin syndrome (agitation, tremor, hyperthermia).'
    },
    'ibuprofen': {
      severity: 'moderate',
      description: 'Increased risk of bleeding, especially gastrointestinal bleeding.',
      mechanism: 'SSRIs like Sertraline inhibit platelet serotonin uptake, and NSAIDs affect prostaglandin-mediated gastric protection.',
      management: 'Use with caution. Consider gastroprotective therapy if combination necessary.'
    }
  },
  'lisinopril': {
    'potassium': {
      severity: 'moderate',
      description: 'ACE inhibitors can increase potassium levels. Supplements may cause hyperkalemia.',
      mechanism: 'ACE inhibitors reduce aldosterone secretion, leading to potassium retention.',
      management: 'Monitor potassium levels regularly. Avoid potassium supplements unless prescribed and monitored.'
    }
  }
};

export default function DrugInteractionsPage() {
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [results, setResults] = useState<InteractionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestionsA, setShowSuggestionsA] = useState(false);
  const [showSuggestionsB, setShowSuggestionsB] = useState(false);

  const checkInteraction = useCallback(async () => {
    if (!drugA.trim() || !drugB.trim()) {
      setError('Please enter both drug names');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    // Check local known interactions first
    const drugALower = drugA.toLowerCase().trim();
    const drugBLower = drugB.toLowerCase().trim();

    // Check both directions
    let localResult = KNOWN_INTERACTIONS[drugALower]?.[drugBLower] ||
                      KNOWN_INTERACTIONS[drugBLower]?.[drugALower];

    if (localResult) {
      setResults(localResult);
      setLoading(false);
      return;
    }

    // Try the API for more interactions
    try {
      const params = new URLSearchParams({ drugA, drugB });
      const response = await fetch(`/api/substances/interactions?${params}`);
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        setResults({
          severity: data.data[0].severity || 'unknown',
          description: data.data[0].description || 'Potential interaction found.',
          mechanism: data.data[0].mechanism,
          management: data.data[0].management
        });
      } else {
        // No interaction found
        setResults({
          severity: 'unknown',
          description: `No known significant interactions found between ${drugA} and ${drugB}. However, this does not guarantee safety. Always consult a healthcare professional or pharmacist.`,
          management: 'Even if no interaction is listed, always inform your doctor and pharmacist about all medications you take.'
        });
      }
    } catch (err) {
      // Fallback to no interaction found message
      setResults({
        severity: 'unknown',
        description: `Unable to find interaction data for ${drugA} and ${drugB}. This does not mean they are safe to combine.`,
        management: 'Please consult your doctor or pharmacist for personalized advice about drug interactions.'
      });
    } finally {
      setLoading(false);
    }
  }, [drugA, drugB]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'moderate': return 'bg-orange-100 border-orange-500 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'mild': return 'bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default: return 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
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

  const filteredSuggestionsA = COMMON_DRUGS.filter(drug =>
    drug.toLowerCase().includes(drugA.toLowerCase()) && drug.toLowerCase() !== drugA.toLowerCase()
  ).slice(0, 5);

  const filteredSuggestionsB = COMMON_DRUGS.filter(drug =>
    drug.toLowerCase().includes(drugB.toLowerCase()) && drug.toLowerCase() !== drugB.toLowerCase()
  ).slice(0, 5);

  return (
    <>
      <Head>
        <title>Drug Interaction Checker | MediVault</title>
        <meta name="description" content="Check potential drug interactions between medications. Enter two drug names to see if they have any known interactions." />
      </Head>

      <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-12">
          <div className="max-w-4xl mx-auto px-4">
            <nav className="flex items-center gap-2 text-sm text-blue-200 mb-6">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <Link href="/medicines" className="hover:text-white">MediVault</Link>
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
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4">
            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 mb-8">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 flex-shrink-0">info</span>
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Important Disclaimer:</strong> This tool provides general information only and should not replace professional medical advice. Always consult your doctor or pharmacist before making any changes to your medications.
                </div>
              </div>
            </div>

            {/* Input Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8 mb-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Drug A Input */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Drug
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">medication</span>
                    <input
                      type="text"
                      value={drugA}
                      onChange={(e) => setDrugA(e.target.value)}
                      onFocus={() => setShowSuggestionsA(true)}
                      onBlur={() => setTimeout(() => setShowSuggestionsA(false), 200)}
                      placeholder="e.g., Aspirin"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {showSuggestionsA && filteredSuggestionsA.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                      {filteredSuggestionsA.map((drug) => (
                        <li
                          key={drug}
                          onClick={() => {
                            setDrugA(drug);
                            setShowSuggestionsA(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-200"
                        >
                          {drug}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Drug B Input */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Second Drug
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">medication</span>
                    <input
                      type="text"
                      value={drugB}
                      onChange={(e) => setDrugB(e.target.value)}
                      onFocus={() => setShowSuggestionsB(true)}
                      onBlur={() => setTimeout(() => setShowSuggestionsB(false), 200)}
                      placeholder="e.g., Ibuprofen"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {showSuggestionsB && filteredSuggestionsB.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                      {filteredSuggestionsB.map((drug) => (
                        <li
                          key={drug}
                          onClick={() => {
                            setDrugB(drug);
                            setShowSuggestionsB(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-200"
                        >
                          {drug}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <button
                onClick={checkInteraction}
                disabled={loading || !drugA.trim() || !drugB.trim()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Checking...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">search</span>
                    Check Interaction
                  </>
                )}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
            </div>

            {/* Results */}
            {results && (
              <div className={`rounded-2xl border-2 p-6 md:p-8 ${getSeverityColor(results.severity)}`}>
                <div className="flex items-start gap-4 mb-4">
                  <span className="material-symbols-outlined text-3xl">
                    {getSeverityIcon(results.severity)}
                  </span>
                  <div>
                    <h2 className="text-xl font-bold capitalize mb-1">
                      {results.severity === 'unknown' ? 'Information' : `${results.severity} Interaction`}
                    </h2>
                    <p className="text-sm opacity-80">
                      {drugA} + {drugB}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Description</h3>
                    <p>{results.description}</p>
                  </div>

                  {results.mechanism && (
                    <div>
                      <h3 className="font-semibold mb-1">Mechanism</h3>
                      <p>{results.mechanism}</p>
                    </div>
                  )}

                  {results.management && (
                    <div>
                      <h3 className="font-semibold mb-1">Management</h3>
                      <p>{results.management}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500">tips_and_updates</span>
                  Tips for Safe Medication Use
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-1 text-green-500">check_circle</span>
                    Keep an updated list of all your medications
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-1 text-green-500">check_circle</span>
                    Include supplements and over-the-counter drugs
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-1 text-green-500">check_circle</span>
                    Use one pharmacy for all prescriptions when possible
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-1 text-green-500">check_circle</span>
                    Ask your pharmacist about interactions
                  </li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">emergency</span>
                  When to Seek Help
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-1 text-red-500">warning</span>
                    Unusual bleeding or bruising
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-1 text-red-500">warning</span>
                    Severe dizziness or fainting
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-1 text-red-500">warning</span>
                    Difficulty breathing
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-xs mt-1 text-red-500">warning</span>
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
          </div>
        </section>
      </main>
    </>
  );
}
