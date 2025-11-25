import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Article, Product, Tutorial, Video, NutritionInfo, TipCard, EbayProductSummary } from '../types';

// Define a union type for all bookmarkable items
// We extend the base types to ensure they have a contentType
export type BookmarkableItem = 
  | (Article & { contentType: 'Article' })
  | (Product & { contentType: 'Product' })
  | (Tutorial & { contentType: 'Tutorial' })
  | (Video & { contentType: 'Video' })
  | (NutritionInfo & { contentType: 'Nutrition' })
  | (TipCard & { contentType: 'Nutrition' })
  | (EbayProductSummary & { contentType: 'HealthProduct' | 'BeautyProduct' });

interface BookmarkContextType {
  bookmarkedItems: BookmarkableItem[];
  addBookmark: (item: BookmarkableItem) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

const getInitialBookmarks = (): BookmarkableItem[] => {
    try {
        const item = window.localStorage.getItem('bookmarked_items_v2');
        const parsed = item ? JSON.parse(item) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not access localStorage for bookmarks", error);
        return [];
    }
}

export const BookmarkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookmarkedItems, setBookmarkedItems] = useState<BookmarkableItem[]>(getInitialBookmarks);

  useEffect(() => {
    try {
      window.localStorage.setItem('bookmarked_items_v2', JSON.stringify(bookmarkedItems));
    } catch (error) {
        console.error("Could not access localStorage for bookmarks", error);
    }
  }, [bookmarkedItems]);

  const addBookmark = useCallback((item: BookmarkableItem) => {
    setBookmarkedItems(prev => {
      if (prev.some(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarkedItems(prev => prev.filter(item => item.id !== id));
  }, []);
  
  const isBookmarked = useCallback((id: string) => {
    return bookmarkedItems.some(item => item.id === id);
  }, [bookmarkedItems]);

  const value = { bookmarkedItems, addBookmark, removeBookmark, isBookmarked };

  return (
    <BookmarkContext.Provider value={value}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = (): BookmarkContextType => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};
