
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { allMockData } from '../services/apiService'; // A bit of a hack to get all data
import { Article, Product, Tutorial, Video, NutritionInfo, TipCard } from '../types';

type BookmarkableItem = Article | Product | Tutorial | Video | NutritionInfo | TipCard;

interface BookmarkContextType {
  bookmarkedIds: Set<string>;
  bookmarkedItems: BookmarkableItem[];
  addBookmark: (id: string) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

const getInitialBookmarks = (): Set<string> => {
    try {
        const item = window.localStorage.getItem('bookmarked_items');
        return item ? new Set(JSON.parse(item)) : new Set();
    } catch (error) {
        console.error("Could not access localStorage for bookmarks", error);
        return new Set();
    }
}

export const BookmarkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(getInitialBookmarks);
  const [bookmarkedItems, setBookmarkedItems] = useState<BookmarkableItem[]>([]);

  useEffect(() => {
    try {
      window.localStorage.setItem('bookmarked_items', JSON.stringify(Array.from(bookmarkedIds)));
      const items = allMockData.filter(item => bookmarkedIds.has(item.id));
      setBookmarkedItems(items);
    } catch (error) {
        console.error("Could not access localStorage for bookmarks", error);
    }
  }, [bookmarkedIds]);

  const addBookmark = useCallback((id: string) => {
    setBookmarkedIds(prev => new Set(prev).add(id));
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);
  
  const isBookmarked = useCallback((id: string) => bookmarkedIds.has(id), [bookmarkedIds]);

  const value = { bookmarkedIds, bookmarkedItems, addBookmark, removeBookmark, isBookmarked };

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
