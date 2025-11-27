/**
 * MediVault - Medicine Encyclopedia Hub Page
 * 
 * The discovery and navigation center for the medicine database.
 * Features search, featured medicines, and category browsing.
 * 
 * Route: /medicines
 */

import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GetStaticProps } from 'next';

// Featured medicines data - Top Tier-1 drugs
const FEATURED_MEDICINES = [
  // Stimulants & Cognitive Enhancers
  { name: 'Modafinil', slug: 'modafinil', category: 'Stimulants', description: 'Wakefulness-promoting agent for narcolepsy and shift work disorder' },
  { name: 'Adderall', slug: 'adderall', category: 'Stimulants', description: 'Amphetamine-based ADHD medication' },
  { name: 'Ritalin', slug: 'ritalin', category: 'Stimulants', description: 'Methylphenidate for ADHD treatment' },
  { name: 'Vyvanse', slug: 'vyvanse', category: 'Stimulants', description: 'Lisdexamfetamine for ADHD and binge eating disorder' },
  { name: 'Concerta', slug: 'concerta', category: 'Stimulants', description: 'Extended-release methylphenidate' },
  { name: 'Armodafinil', slug: 'armodafinil', category: 'Stimulants', description: 'R-enantiomer of modafinil for wakefulness' },
  
  // Pain Management
  { name: 'Ibuprofen', slug: 'ibuprofen', category: 'Pain Relief', description: 'NSAID for pain, fever, and inflammation' },
  { name: 'Acetaminophen', slug: 'acetaminophen', category: 'Pain Relief', description: 'Common pain reliever and fever reducer' },
  { name: 'Naproxen', slug: 'naproxen', category: 'Pain Relief', description: 'NSAID for pain and inflammation' },
  { name: 'Aspirin', slug: 'aspirin', category: 'Pain Relief', description: 'Pain reliever and blood thinner' },
  
  // Mental Health
  { name: 'Sertraline', slug: 'sertraline', category: 'Mental Health', description: 'SSRI antidepressant (Zoloft)' },
  { name: 'Fluoxetine', slug: 'fluoxetine', category: 'Mental Health', description: 'SSRI antidepressant (Prozac)' },
  { name: 'Escitalopram', slug: 'escitalopram', category: 'Mental Health', description: 'SSRI for depression and anxiety (Lexapro)' },
  { name: 'Bupropion', slug: 'bupropion', category: 'Mental Health', description: 'Antidepressant and smoking cessation aid (Wellbutrin)' },
  { name: 'Alprazolam', slug: 'alprazolam', category: 'Mental Health', description: 'Benzodiazepine for anxiety (Xanax)' },
  { name: 'Lorazepam', slug: 'lorazepam', category: 'Mental Health', description: 'Benzodiazepine for anxiety (Ativan)' },
  
  // Sleep Aids
  { name: 'Zolpidem', slug: 'zolpidem', category: 'Sleep Aids', description: 'Sleep medication (Ambien)' },
  { name: 'Trazodone', slug: 'trazodone', category: 'Sleep Aids', description: 'Antidepressant used for insomnia' },
  { name: 'Melatonin', slug: 'melatonin', category: 'Sleep Aids', description: 'Natural sleep hormone supplement' },
  
  // Cardiovascular
  { name: 'Lisinopril', slug: 'lisinopril', category: 'Cardiovascular', description: 'ACE inhibitor for blood pressure' },
  { name: 'Amlodipine', slug: 'amlodipine', category: 'Cardiovascular', description: 'Calcium channel blocker for hypertension' },
  { name: 'Atorvastatin', slug: 'atorvastatin', category: 'Cardiovascular', description: 'Statin for cholesterol (Lipitor)' },
  { name: 'Metoprolol', slug: 'metoprolol', category: 'Cardiovascular', description: 'Beta-blocker for heart conditions' },
  
  // Diabetes
  { name: 'Metformin', slug: 'metformin', category: 'Diabetes', description: 'First-line treatment for type 2 diabetes' },
  { name: 'Insulin', slug: 'insulin', category: 'Diabetes', description: 'Hormone for blood sugar control' },
  
  // Gastrointestinal
  { name: 'Omeprazole', slug: 'omeprazole', category: 'Gastrointestinal', description: 'Proton pump inhibitor for acid reflux' },
  { name: 'Pantoprazole', slug: 'pantoprazole', category: 'Gastrointestinal', description: 'PPI for GERD and ulcers' },
  
  // Antibiotics
  { name: 'Amoxicillin', slug: 'amoxicillin', category: 'Antibiotics', description: 'Broad-spectrum antibiotic' },
  { name: 'Azithromycin', slug: 'azithromycin', category: 'Antibiotics', description: 'Macrolide antibiotic (Z-Pack)' },
  { name: 'Ciprofloxacin', slug: 'ciprofloxacin', category: 'Antibiotics', description: 'Fluoroquinolone antibiotic' },
  
  // Allergy & Respiratory
  { name: 'Cetirizine', slug: 'cetirizine', category: 'Allergy', description: 'Antihistamine for allergies (Zyrtec)' },
  { name: 'Loratadine', slug: 'loratadine', category: 'Allergy', description: 'Non-drowsy antihistamine (Claritin)' },
  { name: 'Albuterol', slug: 'albuterol', category: 'Respiratory', description: 'Bronchodilator for asthma' },
  { name: 'Montelukast', slug: 'montelukast', category: 'Respiratory', description: 'Leukotriene inhibitor for asthma (Singulair)' },
  
  // Thyroid
  { name: 'Levothyroxine', slug: 'levothyroxine', category: 'Thyroid', description: 'Thyroid hormone replacement' },
  
  // Other Common
  { name: 'Gabapentin', slug: 'gabapentin', category: 'Nerve Pain', description: 'For nerve pain and seizures' },
  { name: 'Pregabalin', slug: 'pregabalin', category: 'Nerve Pain', description: 'For nerve pain and fibromyalgia (Lyrica)' },
  { name: 'Prednisone', slug: 'prednisone', category: 'Anti-inflammatory', description: 'Corticosteroid for inflammation' },
  { name: 'Hydroxychloroquine', slug: 'hydroxychloroquine', category: 'Immunology', description: 'For autoimmune conditions' },
];

// Get unique categories
const CATEGORIES = [...new Set(FEATURED_MEDICINES.map(m => m.category))];

interface MedicinesPageProps {
  featuredMedicines: typeof FEATURED_MEDICINES;
}

export default function MedicinesPage({ featuredMedicines }: MedicinesPageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<typeof FEATURED_MEDICINES>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter medicines based on search and category
  const filteredMedicines = featuredMedicines.filter(medicine => {
    const matchesSearch = searchQuery === '' || 
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === null || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      const matches = featuredMedicines.filter(m => 
        m.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [featuredMedicines]);

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/medicines/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    router.push(`/medicine/${slug}`);
  };

  return (
    <>
      <Head>
        <title>MediVault - Medicine Encyclopedia | HealthBeauty Hub</title>
        <meta name="description" content="MediVault: Comprehensive medicine database powered by FDA data. Search any drug, check interactions, and get detailed medication information." />
        <meta name="keywords" content="medicine database, drug information, FDA drugs, medication guide, drug interactions, pharmacy reference" />
        <link rel="canonical" href="https://blushandbreath.com/medicines" />
        
        <meta property="og:title" content="MediVault - Medicine Encyclopedia" />
        <meta property="og:description" content="Search any FDA-approved drug. Get comprehensive medication information, interactions, and safety data." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://blushandbreath.com/medicines" />
      </Head>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-indigo-900 dark:to-slate-900 text-white py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="material-symbols-outlined text-5xl md:text-6xl text-cyan-300">local_pharmacy</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">MediVault</h1>
            </div>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Every Drug, Every Brand, Every Detail
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search any medicine (e.g., Modafinil, Ibuprofen, Lisinopril...)"
                  className="w-full pl-14 pr-32 py-4 text-lg rounded-full bg-white text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-300/50"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold transition-colors"
                >
                  Search
                </button>
              </div>
              
              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50">
                  {suggestions.map((medicine) => (
                    <button
                      key={medicine.slug}
                      type="button"
                      onClick={() => handleSuggestionClick(medicine.slug)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                    >
                      <span className="material-symbols-outlined text-blue-500">medication</span>
                      <div>
                        <p className="font-semibold text-gray-900">{medicine.name}</p>
                        <p className="text-sm text-gray-500">{medicine.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link
                href="/medicines/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-colors backdrop-blur-sm"
              >
                <span className="material-symbols-outlined">list</span>
                Browse A-Z
              </Link>
              <Link
                href="/health"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-colors backdrop-blur-sm"
              >
                <span className="material-symbols-outlined">compare_arrows</span>
                Check Interactions
              </Link>
              <Link
                href="/info/emergency"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/80 hover:bg-red-500 rounded-full font-medium transition-colors"
              >
                <span className="material-symbols-outlined">emergency</span>
                Emergency Info
              </Link>
            </div>
          </div>
        </section>

        {/* Category Filters */}
        <section className="bg-gray-50 dark:bg-gray-900 py-6 border-b border-gray-200 dark:border-gray-700 sticky top-16 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Medicines Grid */}
        <section className="py-12 bg-white dark:bg-gray-950">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {selectedCategory ? selectedCategory : 'Featured Medicines'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {filteredMedicines.length} medicines • Powered by OpenFDA
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredMedicines.map((medicine) => (
                <Link
                  key={medicine.slug}
                  href={`/medicine/${medicine.slug}`}
                  className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">
                        medication
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {medicine.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full mt-1">
                        {medicine.category}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {medicine.description}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-500 transition-colors">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {filteredMedicines.length === 0 && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                  search_off
                </span>
                <p className="text-gray-600 dark:text-gray-400">
                  No medicines found. Try a different search or category.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* DANGER ZONE - Banned Substances (High SEO Value) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <section className="py-16 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-red-950/30 dark:via-orange-950/20 dark:to-amber-950/20 border-y-4 border-red-200 dark:border-red-900">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full text-sm font-medium mb-4">
                <span className="material-symbols-outlined text-lg">warning</span>
                FDA Banned & Restricted
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Banned Supplement Ingredients
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                These substances have been flagged by the FDA, DEA, or WADA for serious safety concerns. 
                Learn about the dangers and discover safe, legal alternatives.
              </p>
            </div>

            {/* Banned Substances Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Stimulant Amines */}
              <Link href="/banned/dmaa" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 p-4 hover:shadow-lg hover:border-red-400 dark:hover:border-red-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">dangerous</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-red-600">DMAA</h3>
                    <span className="text-xs text-red-600 dark:text-red-400">5 Deaths • FDA Banned</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">1,3-Dimethylamylamine - Banned stimulant</p>
              </Link>

              <Link href="/banned/dmha" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 p-4 hover:shadow-lg hover:border-red-400 dark:hover:border-red-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">dangerous</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-red-600">DMHA</h3>
                    <span className="text-xs text-red-600 dark:text-red-400">12 Warning Letters</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Octodrine - Unsafe stimulant</p>
              </Link>

              <Link href="/banned/ephedrine" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 p-4 hover:shadow-lg hover:border-red-400 dark:hover:border-red-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">skull</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-red-600">Ephedrine</h3>
                    <span className="text-xs text-red-600 dark:text-red-400">155+ Deaths • Banned 2004</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ma Huang - Landmark FDA ban</p>
              </Link>

              <Link href="/banned/bmpea" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 p-4 hover:shadow-lg hover:border-red-400 dark:hover:border-red-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">dangerous</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-red-600">BMPEA</h3>
                    <span className="text-xs text-red-600 dark:text-red-400">Amphetamine Analog</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Synthetic adulterant in Acacia</p>
              </Link>

              {/* GABAergic */}
              <Link href="/banned/phenibut" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-orange-200 dark:border-orange-800 p-4 hover:shadow-lg hover:border-orange-400 dark:hover:border-orange-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">psychology_alt</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600">Phenibut</h3>
                    <span className="text-xs text-orange-600 dark:text-orange-400">1,320 Poison Cases</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">GABA analog - Severe withdrawal</p>
              </Link>

              <Link href="/banned/tianeptine" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-orange-200 dark:border-orange-800 p-4 hover:shadow-lg hover:border-orange-400 dark:hover:border-orange-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">skull</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600">Tianeptine</h3>
                    <span className="text-xs text-orange-600 dark:text-orange-400">&quot;Gas Station Heroin&quot;</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Zaza, Tianaa - Opioid effects</p>
              </Link>

              <Link href="/banned/kratom" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-amber-200 dark:border-amber-800 p-4 hover:shadow-lg hover:border-amber-400 dark:hover:border-amber-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">eco</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600">Kratom</h3>
                    <span className="text-xs text-amber-600 dark:text-amber-400">91 Deaths • 7 States Ban</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Mitragyna speciosa - Opioid-like</p>
              </Link>

              {/* SARMs */}
              <Link href="/banned/sarms" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-200 dark:border-purple-800 p-4 hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">fitness_center</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600">SARMs</h3>
                    <span className="text-xs text-purple-600 dark:text-purple-400">Felony • Prison Time</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Ostarine, LGD - Unapproved drugs</p>
              </Link>

              <Link href="/banned/ostarine" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-200 dark:border-purple-800 p-4 hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">science</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-purple-600">Ostarine</h3>
                    <span className="text-xs text-purple-600 dark:text-purple-400">20+ Liver Injury Cases</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">MK-2866 - Most detected SARM</p>
              </Link>

              <Link href="/banned/cardarine" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-red-200 dark:border-red-800 p-4 hover:shadow-lg hover:border-red-400 dark:hover:border-red-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">emergency</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-red-600">Cardarine</h3>
                    <span className="text-xs text-red-600 dark:text-red-400">⚠️ CAUSES CANCER</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">GW501516 - Dev abandoned</p>
              </Link>

              {/* Nootropics */}
              <Link href="/banned/adrafinil" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-4 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">neurology</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600">Adrafinil</h3>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Modafinil Prodrug</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Hepatotoxic - Prison sentences</p>
              </Link>

              <Link href="/banned/phenylpiracetam" className="group bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-4 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-600 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">psychology</span>
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600">Phenylpiracetam</h3>
                    <span className="text-xs text-blue-600 dark:text-blue-400">WADA Banned</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Carphedon - Only banned racetam</p>
              </Link>
            </div>

            {/* View All Button */}
            <div className="text-center mt-8">
              <Link
                href="/medicines/search?category=banned"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors"
              >
                <span className="material-symbols-outlined">shield</span>
                View All 30+ Banned Substances
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Advanced Features Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Infinite Medicine Database
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">search</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Search ANY FDA Drug</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Access the complete FDA drug database. Type any medicine name to get comprehensive information instantly.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-3xl">compare_arrows</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Check Drug Interactions</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Verify medication safety. Our interaction checker helps you avoid dangerous drug combinations.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-3xl">verified</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">FDA-Verified Data</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All information comes directly from the FDA&apos;s OpenFDA API and RxNorm database.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer Footer */}
        <section className="bg-blue-50 dark:bg-blue-900/20 py-6 border-t border-blue-100 dark:border-blue-800">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
              <span className="material-symbols-outlined">info</span>
              <span className="font-semibold">Medical Disclaimer</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              MediVault provides educational information only. This is not medical advice. 
              Always consult a healthcare professional before taking any medication.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<MedicinesPageProps> = async () => {
  return {
    props: {
      featuredMedicines: FEATURED_MEDICINES,
    },
    revalidate: 86400, // Revalidate daily
  };
};
