/**
 * API Services Export
 * 
 * All API calls route through the Cloudflare Worker backend
 * configured via NEXT_PUBLIC_API_URL environment variable.
 */

export {
  // Articles
  getArticles,
  getArticleById,
  getFeaturedArticles,
  fetchArticlesFromAPI,
  
  // Videos
  getVideos,
  fetchVideosFromYouTube,
  
  // Nutrition
  getNutritionData,
  fetchNutritionData,
  searchUSDAFoods,
  getNutrientInfo,
  
  // eBay Beauty Products
  searchBeautyProducts,
  getBeautyProductDetail,
  
  // eBay Health Products
  searchHealthProducts,
  getHealthProductDetail,
  
  // Search
  searchAll,
} from './apiService';
