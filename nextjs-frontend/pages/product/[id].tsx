import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next';
import { searchBeautyProducts, getBeautyProductDetail } from '@/services/apiService';
import { ProductCard, BookmarkButton } from '@/components';
import type { EbayProductDetail, EbayProductSummary, EbayPrice } from '@/types';

interface ProductPageProps {
  product: EbayProductDetail;
  relatedProducts: EbayProductSummary[];
}

// Generate paths at build time
// Note: We return empty paths because eBay product IDs contain special characters (|)
// that are invalid in Windows file paths. All pages will be generated on-demand.
export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking', // Generate all pages on-demand for SEO
  };
};

export const getStaticProps: GetStaticProps<ProductPageProps> = async ({ params }) => {
  const id = params?.id as string;

  if (!id) {
    return { notFound: true };
  }

  try {
    const product = await getBeautyProductDetail(decodeURIComponent(id));

    if (!product) {
      return { notFound: true };
    }

    // Fetch related products
    const result = await searchBeautyProducts({ pageSize: 8 });
    const relatedProducts = result.items.filter((p) => p.id !== product.id).slice(0, 4);

    return {
      props: {
        product,
        relatedProducts,
      },
      revalidate: 3600, // Re-generate every hour
    };
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return { notFound: true };
  }
};

// Star Rating Component
const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="material-symbols-outlined !text-lg text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      ))}
      {halfStar && <span className="material-symbols-outlined !text-lg text-yellow-500">star_half</span>}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="material-symbols-outlined !text-lg text-gray-300">star</span>
      ))}
    </div>
  );
};

export default function ProductPage({ product, relatedProducts }: InferGetStaticPropsType<typeof getStaticProps>) {
  const [selectedImage, setSelectedImage] = useState(product.images[0] || '');
  const [showLightbox, setShowLightbox] = useState(false);

  // Map EbayProductSummary to internal Product type for ProductCard
  const mapToProduct = (p: EbayProductSummary) => ({
    id: p.id,
    name: p.title,
    description: p.title,
    price: p.price?.value || 0,
    imageUrl: p.imageUrl || '',
    category: 'Beauty',
    brand: 'Unknown',
    rating: 4.5,
    reviews: 0,
  });

  return (
    <>
      <Head>
        <title>{product.title} | Blush & Breathe</title>
        <meta name="description" content={product.shortDescription || product.title} />
        {/* Open Graph */}
        <meta property="og:title" content={product.title} />
        <meta property="og:description" content={product.shortDescription || product.title} />
        <meta property="og:image" content={product.images[0] || ''} />
        <meta property="og:type" content="product" />
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={product.title} />
        <meta name="twitter:description" content={product.shortDescription || product.title} />
        <meta name="twitter:image" content={product.images[0] || ''} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-subtle-light dark:text-text-subtle-dark mb-6">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link href="/beauty" className="hover:text-primary transition-colors">Beauty</Link>
          <span>/</span>
          <span className="text-text-light dark:text-text-dark truncate">{product.title}</span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div 
              className="aspect-square w-full rounded-xl overflow-hidden bg-gray-100 cursor-zoom-in"
              onClick={() => setShowLightbox(true)}
            >
              <img
                src={selectedImage || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === img ? 'border-secondary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-1">
                  {product.seller?.username || 'Seller'}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">{product.title}</h1>
              </div>
              <BookmarkButton 
                item={{ 
                  id: product.id, 
                  title: product.title, 
                  price: product.price,
                  imageUrl: product.images[0] || '',
                  condition: product.condition,
                  webUrl: product.webUrl,
                  contentType: 'BeautyProduct' 
                }}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
              />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <StarRating rating={4.5} />
              <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                ({product.seller?.feedbackScore || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {product.price?.currency === 'USD' ? '$' : product.price?.currency}
                {product.price?.value?.toFixed(2) || 'N/A'}
              </span>
              <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                {product.condition}
              </span>
            </div>

            {/* Description */}
            {product.shortDescription && (
              <div className="prose prose-sm dark:prose-invert">
                <p>{product.shortDescription}</p>
              </div>
            )}

            {/* Specifications */}
            {Object.keys(product.itemSpecifics).length > 0 && (
              <div className="border-t border-border-light dark:border-border-dark pt-6">
                <h3 className="font-semibold mb-4">Product Specifications</h3>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(product.itemSpecifics).slice(0, 8).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                      <dt className="text-text-subtle-light dark:text-text-subtle-dark">{key}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <a
                href={product.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-white rounded-full font-medium hover:bg-secondary/90 transition-colors"
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                Buy Now
              </a>
              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-border-light dark:border-border-dark rounded-full font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined">share</span>
                Share
              </button>
            </div>

            {/* Seller Info */}
            {product.seller && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">storefront</span>
                </div>
                <div>
                  <p className="font-semibold">{product.seller.username}</p>
                  <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
                    {product.seller.feedbackPercentage}% positive feedback
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border-light dark:border-border-dark">
            <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={mapToProduct(relatedProduct)} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setShowLightbox(false)}
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <img
            src={selectedImage || product.images[0]}
            alt={product.title}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
