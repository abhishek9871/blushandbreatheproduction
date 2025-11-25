import type { Review } from '@/types';

interface ProductImageData {
  image_front_url?: string;
  image_ingredients_url?: string;
  image_packaging_url?: string;
  image_front_small_url?: string;
}

export const getLocalReviews = (productId: string): Review[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(`beauty_reviews:${productId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveLocalReview = (productId: string, review: Omit<Review, 'id' | 'createdAt'>) => {
  const reviews = getLocalReviews(productId);
  const newReview: Review = {
    ...review,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  reviews.push(newReview);
  localStorage.setItem(`beauty_reviews:${productId}`, JSON.stringify(reviews));
  return newReview;
};

export const computeAverageRating = (reviews: Review[]): number | null => {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

export const mapLabelsToHuman = (tags: string[]): string[] => {
  const labelMap: Record<string, string> = {
    'en:vegan': 'Vegan-friendly',
    'en:organic': 'Organic',
    'en:cruelty-free': 'Cruelty-free',
    'en:natural': 'Natural',
    'en:paraben-free': 'Paraben-free',
    'en:sulfate-free': 'Sulfate-free',
  };
  
  return tags
    .map(tag => labelMap[tag] || tag.replace('en:', '').replace(/-/g, ' '))
    .filter(label => label.length > 0)
    .slice(0, 6);
};

export const mapCategoriesToHuman = (tags: string[]): string => {
  const categoryMap: Record<string, string> = {
    'en:face-foundations': 'Face • Foundation',
    'en:lipsticks': 'Lips • Lipstick',
    'en:mascaras': 'Eyes • Mascara',
    'en:face-creams': 'Face • Cream',
    'en:cleansers': 'Skincare • Cleanser',
  };
  
  const firstTag = tags[0];
  return firstTag ? (categoryMap[firstTag] || firstTag.replace('en:', '').replace(/-/g, ' ')) : 'Beauty';
};

export const extractImages = (productData: ProductImageData): { heroImage: string; altImages: string[] } => {
  const images: string[] = [];
  
  if (productData.image_front_url) images.push(productData.image_front_url);
  if (productData.image_ingredients_url) images.push(productData.image_ingredients_url);
  if (productData.image_packaging_url) images.push(productData.image_packaging_url);
  if (productData.image_front_small_url && !images.includes(productData.image_front_small_url)) {
    images.push(productData.image_front_small_url);
  }
  
  return {
    heroImage: images[0] || '/placeholder-product.jpg',
    altImages: images.slice(1),
  };
};

export const getUsageGuideline = (category: string): string => {
  const guidelines: Record<string, string> = {
    'foundation': 'Apply a small amount to clean, moisturized skin and blend evenly.',
    'lipstick': 'Apply directly to lips or use a lip brush for precise application.',
    'mascara': 'Apply from base to tips of lashes in upward strokes.',
    'cleanser': 'Apply to damp skin, massage gently, then rinse thoroughly.',
    'cream': 'Apply to clean skin and massage until absorbed.',
  };

  const key = Object.keys(guidelines).find(k => category.toLowerCase().includes(k));
  return key ? guidelines[key] : 'Follow product instructions for best results.';
};

/**
 * Transforms eBay image URLs to request higher quality/larger versions.
 */
export const getHighQualityEbayImage = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return 'https://via.placeholder.com/800';

  let highQualityUrl = imageUrl;

  // Pattern 1: Replace s-lXXX.jpg/png/webp with s-l1600
  highQualityUrl = highQualityUrl.replace(/\/s-l\d+\.(jpg|jpeg|png|webp)/gi, '/s-l1600.$1');

  // Pattern 2: Replace /thumbs/ path with /images/ for full-size images
  highQualityUrl = highQualityUrl.replace('/thumbs/images/', '/images/');

  // Pattern 3: Handle images without size parameters
  if (!highQualityUrl.includes('s-l') && highQualityUrl.includes('ebayimg.com')) {
    highQualityUrl = highQualityUrl.replace(/\.(jpg|jpeg|png|webp)$/i, '/s-l1600.$1');
  }

  return highQualityUrl;
};
