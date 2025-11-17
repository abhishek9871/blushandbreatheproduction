
export interface Article {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  date: string;
  content: string; // Added for full article page
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
  id:string;
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