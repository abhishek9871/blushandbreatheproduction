import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { getHealthProductDetail } from '@/services/apiService';
import { BookmarkButton, ErrorMessage } from '@/components';
import type { EbayProductDetail } from '@/types';
import { getHighQualityEbayImage } from '@/utils/productUtils';

interface HealthProductPageProps {
  product: EbayProductDetail;
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps<HealthProductPageProps> = async ({ params }) => {
  const id = params?.id as string;

  if (!id) {
    return { notFound: true };
  }

  try {
    const product = await getHealthProductDetail(decodeURIComponent(id));

    if (!product) {
      return { notFound: true };
    }

    return {
      props: {
        product,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error('Failed to fetch health product:', error);
    return { notFound: true };
  }
};

export default function HealthProductPage({ product }: InferGetStaticPropsType<typeof getStaticProps>) {
    const [selectedImage, setSelectedImage] = useState(0);

    if (!product) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <ErrorMessage message="Product not found" />
                <Link
                    href="/health-store"
                    className="mt-4 inline-block px-6 py-3 rounded-full bg-[#2C7A7B] text-white hover:bg-[#2C7A7B]/90 transition-colors"
                >
                    Back to Health Products
                </Link>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>{product.title} | Blush & Breathe Health Store</title>
                <meta name="description" content={product.shortDescription || product.title} />
                <meta property="og:title" content={product.title} />
                <meta property="og:description" content={product.shortDescription || product.title} />
                <meta property="og:image" content={product.images[0] || ''} />
                <meta property="og:type" content="product" />
            </Head>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm mb-6">
                    <Link href="/health-store" className="text-[#2C7A7B] hover:underline">Health Store</Link>
                    <span className="text-text-subtle-light dark:text-text-subtle-dark">/</span>
                    <span className="text-text-subtle-light dark:text-text-subtle-dark truncate">{product.title}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Images Section */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square w-full overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-gray-100">
                            <img
                                src={getHighQualityEbayImage(product.images[selectedImage] || product.images[0])}
                                alt={product.title}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Thumbnail Strip */}
                        {product.images.length > 1 && (
                            <div className="grid grid-cols-5 gap-2">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                                            selectedImage === idx
                                                ? 'border-[#2C7A7B]'
                                                : 'border-border-light dark:border-border-dark hover:border-[#2C7A7B]/50'
                                        }`}
                                    >
                                        <img
                                            src={getHighQualityEbayImage(img)}
                                            alt={`${product.title} - ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info Section */}
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

                        <div className="flex items-baseline gap-4 mb-6">
                            <span className="text-4xl font-bold text-[#2C7A7B]">
                                ${product.price.value.toFixed(2)}
                            </span>
                            <span className="text-lg text-text-subtle-light dark:text-text-subtle-dark">
                                {product.price.currency}
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Condition:</span>
                                <span className="px-3 py-1 rounded-full bg-[#2C7A7B]/10 text-[#2C7A7B] text-sm">
                                    {product.condition}
                                </span>
                            </div>

                            {product.seller && (
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Seller:</span>
                                    <span>{product.seller.username}</span>
                                    {product.seller.feedbackPercentage > 0 && (
                                        <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                                            ({product.seller.feedbackPercentage}% positive)
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {product.shortDescription && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-3">Description</h2>
                                <p className="text-text-subtle-light dark:text-text-subtle-dark leading-relaxed">
                                    {product.shortDescription}
                                </p>
                            </div>
                        )}

                        {/* Item Specifics */}
                        {Object.keys(product.itemSpecifics).length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold mb-3">Product Details</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Object.entries(product.itemSpecifics).map(([key, value]) => (
                                        <div key={key} className="flex flex-col">
                                            <span className="text-sm font-medium text-text-subtle-light dark:text-text-subtle-dark">
                                                {key}
                                            </span>
                                            <span className="text-base">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Call to Action */}
                        <div className="mt-auto pt-6 space-y-3">
                            <a
                                href={product.webUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center px-8 py-4 rounded-full bg-[#2C7A7B] text-white font-semibold hover:bg-[#2C7A7B]/90 transition-colors shadow-lg hover:shadow-xl"
                            >
                                Buy on eBay
                                <span className="material-symbols-outlined align-middle ml-2 text-sm">open_in_new</span>
                            </a>
                            <Link
                                href="/health-store"
                                className="block w-full text-center px-8 py-3 rounded-full border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Editorial Content Section - Placeholder for future customization */}
                <div className="border-t border-border-light dark:border-border-dark pt-8">
                    <h2 className="text-2xl font-bold mb-4">Why We Recommend This Product</h2>
                    <div className="bg-[#2C7A7B]/5 rounded-xl p-6">
                        <p className="text-text-subtle-light dark:text-text-subtle-dark">
                            This is where you can add your own editorial content, health benefits, usage recommendations,
                            or expert insights for this product. This space is reserved for your unique perspective that
                            complements the eBay product data.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
