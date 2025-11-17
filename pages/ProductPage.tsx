import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductById, getProducts } from '../services/apiService';
import type { Product, Review } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import BookmarkButton from '../components/BookmarkButton';
import ProductCard from '../components/ProductCard';
import OffersModal from '../components/OffersModal';
import { getLocalReviews, saveLocalReview, computeAverageRating, getUsageGuideline } from '../utils/productUtils';

interface MergedProduct {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  images: {
    hero: string | null;
    gallery: string[];
  };
  ingredients: string | null;
  labels: string[];
  allergens: string[];
  offers: {
    primary: {
      price: { value: string; currency: string };
      seller: string;
      affiliateUrl: string;
      itemId: string;
      image: string;
    } | null;
    others: any[];
  };
  source: {
    obf: { available: boolean };
    ebay: { available: boolean };
  };
  cachedAt: string;
}

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const decodedId = id ? decodeURIComponent(id) : '';
  const [product, setProduct] = useState<Product | null>(null);
  const [mergedData, setMergedData] = useState<MergedProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [showLightbox, setShowLightbox] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showSuggestForm, setShowSuggestForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ author: 'Anonymous', rating: 5, title: '', body: '' });
  const [suggestForm, setSuggestForm] = useState({ name: '', info: '' });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [affiliateStats, setAffiliateStats] = useState<any>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!decodedId) {
        setError('Product ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        
        // Load basic product info
        const basicProduct = await getProductById(decodedId);
        if (!basicProduct) {
          setError('Product not found.');
          return;
        }
        setProduct(basicProduct);
        
        // Load merged data from Cloudflare Worker
        try {
          const response = await fetch(`/api/products/${decodedId}/merged`);
          if (response.ok) {
            const merged = await response.json();
            setMergedData(merged);
            setSelectedImage(merged.images.hero || basicProduct.imageUrl);
          }
        } catch (mergedError) {
          console.warn('Could not load merged data:', mergedError);
        }
        
        // Load reviews
        const localReviews = getLocalReviews(decodedId);
        setReviews(localReviews);
        
        // Load related products
        const { data: allProducts } = await getProducts(1);
        const related = allProducts
          .filter(p => p.id !== decodedId && (p.category === basicProduct.category || p.brand === basicProduct.brand))
          .slice(0, 4);
        setRelatedProducts(related);
      } catch (e) {
        setError('Failed to fetch product.');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [decodedId]);

  const handleAddReview = () => {
    if (!reviewForm.body.trim()) return;
    const newReview = saveLocalReview(decodedId, reviewForm);
    setReviews([...reviews, newReview]);
    setReviewForm({ author: 'Anonymous', rating: 5, title: '', body: '' });
    setShowReviewForm(false);
  };

  const fetchAffiliateStats = async (password: string) => {
    try {
      const response = await fetch(`/admin/products/${decodedId}/stats`, {
        headers: { 'Authorization': `Bearer ${password}` }
      });
      if (response.ok) {
        const stats = await response.json();
        setAffiliateStats(stats);
      } else {
        console.error('Failed to fetch affiliate stats');
      }
    } catch (error) {
      console.error('Error fetching affiliate stats:', error);
    }
  };

  const handleSuggestDetails = async () => {
    if (!suggestForm.info.trim()) return;
    try {
      await fetch(`/api/products/${decodedId}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestForm)
      });
      setSuggestForm({ name: '', info: '' });
      setShowSuggestForm(false);
      // Simple toast
      const toast = document.createElement('div');
      toast.textContent = 'Suggestion submitted. Thank you!';
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
    }
  };

  const handleAffiliateClick = async (offer: any) => {
    try {
      await fetch('/api/affiliate/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: decodedId,
          offerItemId: offer.itemId,
          affiliateUrl: offer.affiliateUrl,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to track affiliate click:', error);
    }
    // Open affiliate link in new tab
    window.open(offer.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  const StarRating = ({ rating, interactive = false, onChange }: { rating: number; interactive?: boolean; onChange?: (rating: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => interactive && onChange?.(star)}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <span className={`material-symbols-outlined text-lg ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`} style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}>star</span>
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) return <div className="max-w-6xl mx-auto p-8"><ErrorMessage message={error} /></div>;
  if (!product) return null;

  const displayName = mergedData?.name || product.name;
  const displayBrand = mergedData?.brand || product.brand;
  const displayCategory = mergedData?.category || product.category;
  const images = mergedData?.images || { hero: product.imageUrl, gallery: [] };
  const currentImage = selectedImage || images.hero || product.imageUrl;
  const uniqueImages = [images.hero, ...images.gallery].filter(Boolean).filter((url, index, arr) => arr.indexOf(url) === index);
  const averageRating = computeAverageRating(reviews);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/beauty" className="text-primary font-semibold hover:underline mb-6 inline-block">&larr; Back to products</Link>
      
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer" onClick={() => setShowLightbox(true)}>
            <img src={currentImage} alt={displayName} className="w-full h-full object-cover hover:scale-105 transition-transform" />
          </div>
          {uniqueImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {uniqueImages.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(img)} className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${selectedImage === img ? 'border-secondary' : 'border-gray-200'}`}>
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{displayBrand}</p>
              <h1 className="text-3xl font-bold mt-1">{displayName}</h1>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{displayCategory}</p>
              </div>
            </div>
            <BookmarkButton itemId={product.id} />
          </div>

          {/* Offers Preview */}
          {mergedData?.offers.primary ? (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-text-subtle-light dark:text-text-subtle-dark mb-3">Best offer</p>
              <div className="flex items-center gap-3 mb-3">
                {mergedData.offers.primary.image && (
                  <img src={mergedData.offers.primary.image} alt="Offer" className="w-12 h-12 object-cover rounded-lg" />
                )}
                <div className="flex-1">
                  <p className="text-xl font-bold text-green-600">
                    {mergedData.offers.primary.price?.currency} {mergedData.offers.primary.price?.value}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">via {mergedData.offers.primary.seller}</p>
                </div>
              </div>
              <button 
                onClick={() => handleAffiliateClick(mergedData.offers.primary)}
                className="w-full bg-secondary text-white py-2 rounded-lg hover:opacity-90 font-medium mb-2"
              >
                Buy now
              </button>
              <button 
                onClick={() => setShowOffersModal(true)}
                className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 font-medium"
              >
                View all offers ({1 + mergedData.offers.others.length})
              </button>
              <p className="text-xs text-orange-600 mt-2">We may earn a commission if you buy through these links.</p>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <p className="text-sm font-medium text-text-subtle-light dark:text-text-subtle-dark mb-1">Price</p>
              <div className="flex items-center justify-between">
                <p className="text-lg text-text-subtle-light dark:text-text-subtle-dark italic">Price on request</p>
                <button onClick={() => setShowPriceModal(true)} className="text-sm text-primary hover:underline">Search on eBay</button>
              </div>
            </div>
          )}

          {/* Admin Panel */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Admin</p>
              <button onClick={() => setShowAdminPanel(true)} className="text-sm text-primary hover:underline">Affiliate stats</button>
            </div>
          </div>

          {/* Ratings */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">Community reviews on this device</p>
              <button onClick={() => setShowReviewForm(true)} className="text-sm text-primary hover:underline">Add review</button>
            </div>
            {averageRating ? (
              <div className="flex items-center gap-3 mb-3">
                <StarRating rating={Math.round(averageRating)} />
                <span className="text-lg font-semibold">{averageRating}</span>
                <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            ) : (
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mb-3">No ratings yet — be the first to review.</p>
            )}
          </div>

          {/* Highlights */}
          {mergedData?.labels && mergedData.labels.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Highlights</p>
              <div className="flex flex-wrap gap-2">
                {mergedData.labels.map((label, idx) => (
                  <span key={idx} className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">{label}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Reviews</h2>
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating rating={review.rating} />
                      <span className="font-medium">{review.author}</span>
                    </div>
                    {review.title && <p className="font-medium">{review.title}</p>}
                  </div>
                  <span className="text-xs text-text-subtle-light dark:text-text-subtle-dark">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm">{review.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ingredients */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Ingredients</h2>
          {(!mergedData?.ingredients || !mergedData?.labels?.length || !mergedData?.allergens?.length) && (
            <button 
              onClick={() => setShowSuggestForm(true)}
              className="text-sm text-primary hover:underline"
            >
              Suggest details
            </button>
          )}
        </div>
        {mergedData?.ingredients ? (
          <div className="border rounded-lg p-4">
            <p className="text-sm leading-relaxed">
              {showIngredients ? mergedData.ingredients : `${mergedData.ingredients.slice(0, 200)}${mergedData.ingredients.length > 200 ? '...' : ''}`}
            </p>
            {mergedData.ingredients.length > 200 && (
              <button onClick={() => setShowIngredients(!showIngredients)} className="text-sm text-primary hover:underline mt-2">
                {showIngredients ? 'Show less' : 'Show full ingredients'}
              </button>
            )}
          </div>
        ) : (
          <div className="border rounded-lg p-4 text-center text-gray-500">
            <p className="text-sm">Ingredients information not available</p>
          </div>
        )}
      </section>

      {/* Safety & Allergens */}
      {mergedData?.allergens && mergedData.allergens.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Allergens & warnings</h2>
          <div className="border rounded-lg p-4">
            <ul className="space-y-1">
              {mergedData.allergens.map((allergen, idx) => (
                <li key={idx} className="text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-orange-500 text-sm">warning</span>
                  {allergen}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* How to use */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">How to use</h2>
        <div className="border rounded-lg p-4">
          <p className="text-sm">{getUsageGuideline(displayCategory)}</p>
          <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-2">This is a general guideline. Always follow product-specific instructions.</p>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4">You may also like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map(relatedProduct => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowLightbox(false)}>
          <img src={currentImage} alt="Zoomed view" className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {showPriceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Store Availability</h3>
            <p className="text-sm mb-4">Search for this product on eBay to find current pricing and availability.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowPriceModal(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <a 
                href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(displayName + ' ' + displayBrand)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-secondary text-white py-2 rounded-lg hover:opacity-90 text-center"
              >
                Search on eBay
              </a>
            </div>
          </div>
        </div>
      )}

      {showReviewForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Your Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name (optional)</label>
                <input value={reviewForm.author} onChange={e => setReviewForm({...reviewForm, author: e.target.value || 'Anonymous'})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Anonymous" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <StarRating rating={reviewForm.rating} interactive onChange={rating => setReviewForm({...reviewForm, rating})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title (optional)</label>
                <input value={reviewForm.title} onChange={e => setReviewForm({...reviewForm, title: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Great product!" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Review</label>
                <textarea value={reviewForm.body} onChange={e => setReviewForm({...reviewForm, body: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm h-20" placeholder="Share your experience..." required />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowReviewForm(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAddReview} disabled={!reviewForm.body.trim()} className="flex-1 bg-secondary text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-50">Submit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offers Modal */}
      {mergedData && (
        <OffersModal 
          isOpen={showOffersModal}
          onClose={() => setShowOffersModal(false)}
          offers={[mergedData.offers.primary, ...mergedData.offers.others].filter(Boolean)}
          barcode={decodedId}
          onAffiliateClick={handleAffiliateClick}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Admin - Affiliate Stats</h3>
            {!adminToken ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Admin Password</label>
                  <input 
                    type="password"
                    value={adminPassword} 
                    onChange={e => setAdminPassword(e.target.value)} 
                    className="w-full border rounded-lg px-3 py-2 text-sm" 
                    placeholder="Enter admin password" 
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAdminPanel(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button 
                    onClick={() => {
                      setAdminToken(adminPassword);
                      fetchAffiliateStats(adminPassword);
                    }}
                    disabled={!adminPassword.trim()}
                    className="flex-1 bg-secondary text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    Login
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {affiliateStats ? (
                  <div>
                    <p className="text-sm font-medium mb-2">Total clicks: {affiliateStats.count || 0}</p>
                    {affiliateStats.fallback && <p className="text-xs text-orange-600 mb-2">Using KV fallback</p>}
                    <div className="text-sm">
                      <p className="font-medium mb-1">Last 5 clicks:</p>
                      {affiliateStats.lastClicks?.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {affiliateStats.lastClicks.slice(0, 5).map((click: any, idx: number) => (
                            <div key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                              <div>Time: {new Date(click.ts).toLocaleString()}</div>
                              <div>Offer: {click.offerItemId}</div>
                              <div>URL: {click.urlTruncated || click.affiliateUrl}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">No clicks yet</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">Loading stats...</p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowAdminPanel(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">Close</button>
                  <button 
                    onClick={() => fetchAffiliateStats(adminToken)}
                    className="flex-1 bg-secondary text-white py-2 rounded-lg hover:opacity-90"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggest Details Modal */}
      {showSuggestForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Suggest Product Details</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Help improve this product page by suggesting missing ingredients, labels, or allergen information.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Your name (optional)</label>
                <input 
                  value={suggestForm.name} 
                  onChange={e => setSuggestForm({...suggestForm, name: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2 text-sm" 
                  placeholder="Anonymous" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Information to add</label>
                <textarea 
                  value={suggestForm.info} 
                  onChange={e => setSuggestForm({...suggestForm, info: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2 text-sm h-24" 
                  placeholder="Please provide ingredients, labels, allergens, or other product details..."
                  required 
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSuggestForm(false)} 
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSuggestDetails} 
                  disabled={!suggestForm.info.trim()} 
                  className="flex-1 bg-secondary text-white py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProductPage;