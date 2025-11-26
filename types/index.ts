export interface Article {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  date: string;
  content: string;
}

export interface Product {
  id: string;
  brand: string;
  category: string;
  name: string;
  rating: number | null;
  reviews: number;
  price: number | null;
  imageUrl: string;
}

export interface Tutorial {
  id: string;
  category: 'Tutorial' | 'Tips' | 'Advice';
  title: string;
  description: string;
  date: string;
  imageUrl: string;
}

export interface NutritionInfo {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  nutrients: {
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface TipCard {
  id: string;
  type: 'tip';
  title: string;
  description: string;
  icon: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: string;
  durationSeconds?: number; // Duration in seconds for filtering
  viewCount?: number;
  channelTitle?: string;
  publishedAt?: string;
  isShort?: boolean; // Videos under 60 seconds
}

export interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  category: string;
  images: {
    heroImage: string;
    altImages: string[];
  };
  ingredientsText: string | null;
  ingredientsList: string[] | null;
  labels: string[];
  allergens: string[];
  countries: string[];
  genericName: string | null;
  averageRating: number | null;
  reviewCount: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  createdAt: string;
}

// eBay Types
export interface EbayPrice {
  value: number;
  currency: string;
}

export interface EbayProductSummary {
  id: string;
  title: string;
  price: EbayPrice;
  imageUrl: string;
  condition: string;
  webUrl: string;
}

export interface EbaySearchPagination {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
}

export interface EbayRefinementValue {
  value: string;
  count: number;
}

export interface EbayAspectRefinement {
  name: string;
  values: EbayRefinementValue[];
}

export interface EbaySearchRefinements {
  conditions: EbayRefinementValue[];
  aspects: EbayAspectRefinement[];
}

export interface EbaySearchResponse {
  items: EbayProductSummary[];
  pagination: EbaySearchPagination;
  refinements: EbaySearchRefinements;
}

export interface EbaySearchParams {
  q?: string;
  category?: 'all' | 'makeup' | 'skincare' | 'hair' | 'fragrance' | 'nails' | 'vitamins' | 'fitness' | 'supplements' | 'medical' | 'wellness';
  sort?: 'best' | 'priceAsc' | 'priceDesc' | 'newest';
  minPrice?: number;
  maxPrice?: number;
  condition?: 'new' | 'used' | 'refurbished';
  page?: number;
  pageSize?: number;
}

export interface EbaySeller {
  username: string;
  feedbackPercentage: number;
  feedbackScore: number;
}

export interface EbayProductDetail {
  id: string;
  title: string;
  price: EbayPrice;
  condition: string;
  images: string[];
  shortDescription: string;
  itemSpecifics: Record<string, string>;
  webUrl: string;
  seller: EbaySeller;
}

// API Resource Types
export type ApiResourceKey = 'articles' | 'products' | 'tutorials' | 'nutrition' | 'videos';

// ═══════════════════════════════════════════════════════════════════
// AI DIET PLAN TYPES
// ═══════════════════════════════════════════════════════════════════

export interface EnhancedUserProfile {
  // Basic info
  isSetup: boolean;
  primaryGoal: 'weight_loss' | 'aggressive_weight_loss' | 'muscle_gain' | 'bulk' | 'maintenance' | 'health' | '';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | '';
  dietaryRestrictions: string[];
  preferredMealTypes: string[];
  
  // Physical metrics
  weight?: number;           // kg
  height?: number;           // cm
  age?: number;
  gender?: 'male' | 'female' | 'other';
  targetWeight?: number;     // optional goal weight
  
  // Health & Preferences
  healthConditions: string[];
  allergies: string[];
  cuisinePreferences: string[];
  mealsPerDay: 3 | 4 | 5 | 6;
  cookingTime: 'minimal' | 'moderate' | 'flexible';
  budget: 'budget' | 'moderate' | 'premium';
  
  // Calculated values (filled by API)
  bmr?: number;
  tdee?: number;
  dailyCalorieTarget?: number;
  macroTargets?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  macroPercentages?: {
    protein: number;
    carbs: number;
    fats: number;
  };
  bmi?: number;
  bmiCategory?: string;
  idealWeightRange?: { min: number; max: number };
  weeklyWeightChange?: number;
  weeksToGoal?: number | null;
  hydrationGoal?: number;
  
  setupDate?: string;
  calculatedAt?: string;
}

export interface MealIngredient {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
}

export interface Meal {
  type: 'breakfast' | 'morning_snack' | 'lunch' | 'evening_snack' | 'dinner';
  time: string;
  name: string;
  description: string;
  ingredients: MealIngredient[];
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  prepTime: number;
  instructions?: string;
  alternatives: string[];
}

export interface DayPlan {
  day: string;
  meals: Meal[];
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface ShoppingItem {
  name: string;
  quantity: string;
  category: 'produce' | 'dairy' | 'protein' | 'grains' | 'spices' | 'other';
}

export interface DietPlan {
  id: string;
  weeklyPlan: DayPlan[];
  shoppingList: ShoppingItem[];
  mealPrepTips: string[];
  weeklyNotes?: string;
  generatedAt: string;
  validUntil: string;
  userTargets: {
    dailyCalories: number;
    macros: {
      protein: number;
      carbs: number;
      fats: number;
    };
  };
  duration: 'day' | 'week';
  aiModel: string;
  fromCache?: boolean;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  macroTargets: {
    protein: number;
    carbs: number;
    fats: number;
  };
  macroPercentages: {
    protein: number;
    carbs: number;
    fats: number;
  };
  weeklyWeightChange: number;
  weeksToGoal: number | null;
  bmi: number;
  bmiCategory: string;
  idealWeightRange: { min: number; max: number };
  hydrationGoal: number;
  calculatedAt: string;
}
