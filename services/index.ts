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
  getShorts,
  getLongVideos,
  searchVideos,
  fetchVideosFromAPI,
  
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
