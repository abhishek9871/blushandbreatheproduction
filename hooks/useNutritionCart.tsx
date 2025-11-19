import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { NutritionInfo } from '../types';

export interface CartItem extends NutritionInfo {
  cartItemId: string; // Unique identifier for cart items
  addedAt: Date;
  portionSize: number; // in grams
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  plannedFor?: Date; // for meal planning
}

interface NutritionCartState {
  items: CartItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  isDirty: boolean; // for sync status
}

interface NutritionCartContextType {
  state: NutritionCartState;
  addItem: (item: NutritionInfo, portionSize?: number) => void;
  removeItem: (itemId: string) => void;
  updatePortion: (itemId: string, portionSize: number) => void;
  setMealType: (itemId: string, mealType: CartItem['mealType']) => void;
  planForDate: (itemId: string, date: Date) => void;
  clearCart: () => void;
  getItemCount: () => number;
  isInCart: (itemId: string) => boolean;
  getItemsForMeal: (mealType: CartItem['mealType']) => CartItem[];
  getItemsForDate: (date: Date) => CartItem[];
  exportCart: () => string;
  importCart: (data: string) => boolean;
}

const STORAGE_KEY = 'nutrition_cart_v2';
const SYNC_DEBOUNCE = 1000; // 1 second debounce for localStorage writes

type CartAction =
  | { type: 'ADD_ITEM'; payload: { item: NutritionInfo; portionSize?: number } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'UPDATE_PORTION'; payload: { itemId: string; portionSize: number } }
  | { type: 'SET_MEAL_TYPE'; payload: { itemId: string; mealType: CartItem['mealType'] } }
  | { type: 'PLAN_FOR_DATE'; payload: { itemId: string; date: Date } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: { items: CartItem[] } }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_CLEAN' };

const calculateTotals = (items: CartItem[]) => {
  return items.reduce(
    (acc, item) => {
      const multiplier = item.portionSize / 100; // nutrients are per 100g
      return {
        totalCalories: acc.totalCalories + (item.calories || 0) * multiplier,
        totalProtein: acc.totalProtein + item.nutrients.protein * multiplier,
        totalCarbs: acc.totalCarbs + item.nutrients.carbs * multiplier,
        totalFats: acc.totalFats + item.nutrients.fats * multiplier,
      };
    },
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0 }
  );
};

// Generate unique cart item ID
const generateCartItemId = () => {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const cartReducer = (state: NutritionCartState, action: CartAction): NutritionCartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Always add as new item with unique ID to allow multiple portions of same food
      const cartItem: CartItem = {
        ...action.payload.item,
        cartItemId: generateCartItemId(),
        addedAt: new Date(),
        portionSize: action.payload.portionSize || 100,
      };
      const newItems = [...state.items, cartItem];
      
      const totals = calculateTotals(newItems);
      return {
        ...state,
        items: newItems,
        ...totals,
        isDirty: true,
      };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.cartItemId !== action.payload.itemId);
      const totals = calculateTotals(newItems);
      return {
        ...state,
        items: newItems,
        ...totals,
        isDirty: true,
      };
    }

    case 'UPDATE_PORTION': {
      const newItems = state.items.map(item =>
        item.cartItemId === action.payload.itemId
          ? { ...item, portionSize: action.payload.portionSize, isDirty: true }
          : item
      );
      const totals = calculateTotals(newItems);
      return {
        ...state,
        items: newItems,
        ...totals,
        isDirty: true,
      };
    }

    case 'SET_MEAL_TYPE': {
      const newItems = state.items.map(item =>
        item.cartItemId === action.payload.itemId
          ? { ...item, mealType: action.payload.mealType, isDirty: true }
          : item
      );
      return {
        ...state,
        items: newItems,
        isDirty: true,
      };
    }

    case 'PLAN_FOR_DATE': {
      const newItems = state.items.map(item =>
        item.cartItemId === action.payload.itemId
          ? { ...item, plannedFor: action.payload.date, isDirty: true }
          : item
      );
      return {
        ...state,
        items: newItems,
        isDirty: true,
      };
    }

    case 'CLEAR_CART':
      return {
        items: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
        isDirty: true,
      };

    case 'LOAD_CART': {
      const totals = calculateTotals(action.payload.items);
      return {
        items: action.payload.items,
        ...totals,
        isDirty: false,
      };
    }

    case 'MARK_DIRTY':
      return { ...state, isDirty: true };

    case 'MARK_CLEAN':
      return { ...state, isDirty: false };

    default:
      return state;
  }
};

const NutritionCartContext = createContext<NutritionCartContextType | undefined>(undefined);

interface NutritionCartProviderProps {
  children: ReactNode;
}

export const NutritionCartProvider: React.FC<NutritionCartProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFats: 0,
    isDirty: false,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        // Convert string dates back to Date objects
        const items = parsed.items.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
          plannedFor: item.plannedFor ? new Date(item.plannedFor) : undefined,
        }));
        dispatch({ type: 'LOAD_CART', payload: { items } });
      }
    } catch (error) {
      console.warn('Failed to load cart from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save cart to localStorage with debouncing
  useEffect(() => {
    if (!state.isDirty) return;

    const timeoutId = setTimeout(() => {
      try {
        const dataToSave = {
          items: state.items,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        dispatch({ type: 'MARK_CLEAN' });
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
        // Handle quota exceeded error
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          // Clear old items or implement cleanup strategy
          console.warn('Storage quota exceeded, consider clearing old data');
        }
      }
    }, SYNC_DEBOUNCE);

    return () => clearTimeout(timeoutId);
  }, [state]);

  const addItem = (item: NutritionInfo, portionSize: number = 100) => {
    dispatch({ type: 'ADD_ITEM', payload: { item, portionSize } });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } });
  };

  const updatePortion = (itemId: string, portionSize: number) => {
    dispatch({ type: 'UPDATE_PORTION', payload: { itemId, portionSize } });
  };

  const setMealType = (itemId: string, mealType: CartItem['mealType']) => {
    dispatch({ type: 'SET_MEAL_TYPE', payload: { itemId, mealType } });
  };

  const planForDate = (itemId: string, date: Date) => {
    dispatch({ type: 'PLAN_FOR_DATE', payload: { itemId, date } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemCount = () => state.items.length;

  const isInCart = (itemId: string) => {
    return state.items.some(item => item.id === itemId || item.name === itemId);
  };

  const getItemsForMeal = (mealType: CartItem['mealType']) => {
    return state.items.filter(item => item.mealType === mealType);
  };

  const getItemsForDate = (date: Date) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return state.items.filter(item => {
      if (!item.plannedFor) return false;
      const itemDate = new Date(item.plannedFor);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === targetDate.getTime();
    });
  };

  const exportCart = () => {
    return JSON.stringify({
      items: state.items,
      exportedAt: new Date().toISOString(),
      version: '2.0',
    });
  };

  const importCart = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.version && parsed.items) {
        const items = parsed.items.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
          plannedFor: item.plannedFor ? new Date(item.plannedFor) : undefined,
        }));
        dispatch({ type: 'LOAD_CART', payload: { items } });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import cart:', error);
      return false;
    }
  };

  const value: NutritionCartContextType = {
    state,
    addItem,
    removeItem,
    updatePortion,
    setMealType,
    planForDate,
    clearCart,
    getItemCount,
    isInCart,
    getItemsForMeal,
    getItemsForDate,
    exportCart,
    importCart,
  };

  return (
    <NutritionCartContext.Provider value={value}>
      {children}
    </NutritionCartContext.Provider>
  );
};

export const useNutritionCart = (): NutritionCartContextType => {
  const context = useContext(NutritionCartContext);
  if (context === undefined) {
    throw new Error('useNutritionCart must be used within a NutritionCartProvider');
  }
  return context;
};

// Edge case handling utilities
export const cartUtils = {
  // Handle localStorage quota exceeded
  clearOldCartData: (daysOld: number = 30) => {
    const keys = Object.keys(localStorage);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    keys.forEach(key => {
      if (key.startsWith('nutrition_cart_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.savedAt && new Date(data.savedAt) < cutoffDate) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key); // Remove corrupted data
        }
      }
    });
  },

  // Validate cart data integrity
  validateCartData: (data: any): boolean => {
    if (!data || !Array.isArray(data.items)) return false;
    return data.items.every((item: any) => 
      item.name && 
      typeof item.portionSize === 'number' && 
      item.nutrients &&
      typeof item.nutrients.protein === 'number'
    );
  },

  // Get storage usage info
  getStorageInfo: () => {
    try {
      const cartData = localStorage.getItem(STORAGE_KEY);
      const size = cartData ? new Blob([cartData]).size : 0;
      const quota = 5 * 1024 * 1024; // 5MB typical localStorage quota
      return {
        used: size,
        quota,
        percentage: (size / quota) * 100,
      };
    } catch (error) {
      return { used: 0, quota: 0, percentage: 0 };
    }
  },
};
