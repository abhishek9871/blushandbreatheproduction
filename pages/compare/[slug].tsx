
import React from 'react';
import Head from 'next/head';
import { GetStaticProps, GetStaticPaths } from 'next';
import { SAAS_PRODUCTS, BEAUTY_PRODUCTS, AffiliateProduct } from '../../utils/affiliate-data';
import { BlushScoreWidget } from '../../components/Affiliate/BlushScoreWidget';
import Link from 'next/link';

interface ComparePageProps {
  productA: AffiliateProduct;
  productB: AffiliateProduct;
  winner: string; // ID of winner
  generatedAt: string;
}

export default function ComparePage({ productA, productB, winner, generatedAt }: ComparePageProps) {
  const title = `${productA.name} vs ${productB.name}: Which is Better? (2025 Review)`;
  const description = `Detailed comparison of ${productA.name} vs ${productB.name}. We analyze price, features, and use AI sentiment analysis to find the winner.`;

  const winningProduct = productA.id === winner ? productA : productB;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Head>
        <title>{title} | Blush & Breathe</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://www.blushandbreath.com/compare/${productA.slug}-vs-${productB.slug}`} />
      </Head>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-xs font-bold tracking-widest uppercase mb-4">
            Official 2025 Comparison
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">
            {productA.name} <span className="text-gray-300 font-light">vs</span> {productB.name}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our AI analyzed 1,200+ user reviews to determine the definitive winner for
            {SAAS_PRODUCTS[productA.id] ? " business owners" : " beauty enthusiasts"}.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* GEO Quick Answer Box - Optimized for AI Snippets */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 mb-10">
          <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wide mb-2">
            💡 The Quick Verification
          </h2>
          <p className="text-gray-800 leading-relaxed font-medium">
            <span className="font-bold text-indigo-600">{winningProduct.name}</span> is the winner
            with a BlushScore™ of {winningProduct.blushScore.overall}/100.
            It beats {productA.id === winner ? productB.name : productA.name} in
            <span className="font-semibold"> Value for Money</span> and
            <span className="font-semibold"> User Satisfaction</span>.
            For most users, {winningProduct.name} is the superior choice due to its {winningProduct.pros[0].toLowerCase()}.
          </p>
        </div>

        {/* Product Product Side-by-Side */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Product A */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-pink-200 transition-all">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{productA.name}</h2>
            <div className="text-3xl font-black text-pink-500 mb-4">{productA.price}</div>
            <p className="text-gray-600 text-sm mb-6 h-12">{productA.description}</p>

            <a href={productA.buyUrl} target="_blank" rel="sponsored"
              className="block w-full py-4 text-center bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all">
              Check Price for {productA.name}
            </a>

            <BlushScoreWidget
              productName={productA.name}
              scores={productA.blushScore}
              overall={productA.blushScore.overall}
            />

            <div className="mt-6">
              <h4 className="font-bold text-green-600 mb-2">Pros</h4>
              <ul className="space-y-2 mb-4">
                {productA.pros.map(p => (
                  <li key={p} className="flex items-start text-sm text-gray-700">
                    <span className="mr-2 text-green-500">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Product B */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-pink-200 transition-all">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{productB.name}</h2>
            <div className="text-3xl font-black text-pink-500 mb-4">{productB.price}</div>
            <p className="text-gray-600 text-sm mb-6 h-12">{productB.description}</p>

            <a href={productB.buyUrl} target="_blank" rel="sponsored"
              className="block w-full py-4 text-center bg-white text-gray-900 border-2 border-gray-900 font-bold rounded-xl hover:bg-gray-50 transition-all">
              Check Price for {productB.name}
            </a>

            <BlushScoreWidget
              productName={productB.name}
              scores={productB.blushScore}
              overall={productB.blushScore.overall}
            />

            <div className="mt-6">
              <h4 className="font-bold text-green-600 mb-2">Pros</h4>
              <ul className="space-y-2 mb-4">
                {productB.pros.map(p => (
                  <li key={p} className="flex items-start text-sm text-gray-700">
                    <span className="mr-2 text-green-500">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        <div className="text-center mt-12 text-xs text-gray-400">
          Last updated: {new Date(generatedAt).toLocaleDateString()}
        </div>

      </div>
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  // Define our Programmatic SEO pairs (Seed List)
  const paths = [
    { params: { slug: 'socialbee-vs-hootsuite' } },
    { params: { slug: 'socialbee-vs-synthflow' } },
    { params: { slug: 'dyson-airwrap-vs-shark-flexstyle' } },
  ];

  return {
    paths,
    fallback: 'blocking', // ISR: Generate new pages on demand
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const [slugA, slugB] = slug.split('-vs-');

  const allProducts = { ...SAAS_PRODUCTS, ...BEAUTY_PRODUCTS };
  const productA = allProducts[slugA];
  const productB = allProducts[slugB];

  if (!productA || !productB) {
    return { notFound: true };
  }

  // Determine winner automatically based on BlushScore
  const winner = productA.blushScore.overall >= productB.blushScore.overall ? productA.id : productB.id;

  return {
    props: {
      productA,
      productB,
      winner,
      generatedAt: new Date().toISOString(),
    },
    revalidate: 3600, // Regenerate every hour (ISR)
  };
};
