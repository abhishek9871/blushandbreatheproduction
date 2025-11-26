'use client';

import React, { useState } from 'react';
import type { ShoppingItem } from '@/types';

interface ShoppingListProps {
  shoppingList: ShoppingItem[];
}

const ShoppingList: React.FC<ShoppingListProps> = ({ shoppingList }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Items', icon: 'list' },
    { id: 'produce', label: 'Produce', icon: 'eco' },
    { id: 'protein', label: 'Protein', icon: 'restaurant' },
    { id: 'dairy', label: 'Dairy', icon: 'egg' },
    { id: 'grains', label: 'Grains', icon: 'grain' },
    { id: 'spices', label: 'Spices', icon: 'local_florist' },
    { id: 'other', label: 'Other', icon: 'inventory_2' }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'produce': return 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-200 dark:border-green-800';
      case 'protein': return 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200 dark:border-red-800';
      case 'dairy': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border-blue-200 dark:border-blue-800';
      case 'grains': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 border-yellow-200 dark:border-yellow-800';
      case 'spices': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 border-purple-200 dark:border-purple-800';
      case 'other': return 'bg-gray-100 dark:bg-gray-800 text-gray-600 border-gray-200 dark:border-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const toggleItem = (itemName: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  const clearAllChecked = () => {
    setCheckedItems(new Set());
  };

  const markAllChecked = () => {
    setCheckedItems(new Set(shoppingList.map(item => item.name)));
  };

  const filteredItems = filter === 'all' 
    ? shoppingList 
    : shoppingList.filter(item => item.category === filter);

  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const totalItems = shoppingList.length;
  const checkedCount = checkedItems.size;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const copyToClipboard = () => {
    const text = shoppingList
      .map(item => `${checkedItems.has(item.name) ? '✓' : '○'} ${item.name} - ${item.quantity}`)
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-sm border border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center space-x-2">
              <span className="material-symbols-outlined text-accent">shopping_cart</span>
              <span>Shopping List</span>
            </h2>
            <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">
              {checkedCount} of {totalItems} items checked
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={clearAllChecked}
              className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-accent/10 text-sm"
            >
              Clear All
            </button>
            <button
              onClick={markAllChecked}
              className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark hover:bg-accent/10 text-sm"
            >
              Check All
            </button>
            <button
              onClick={copyToClipboard}
              className="px-3 py-2 rounded-lg bg-accent text-white hover:opacity-90 text-sm flex items-center space-x-1"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>Copy</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white dark:bg-card-dark rounded-xl p-2 shadow-sm border border-border-light dark:border-border-dark overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {categories.map(cat => {
            const count = cat.id === 'all' 
              ? shoppingList.length 
              : shoppingList.filter(item => item.category === cat.id).length;
            
            if (cat.id !== 'all' && count === 0) return null;
            
            return (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-2 ${
                  filter === cat.id
                    ? 'bg-accent text-white'
                    : 'hover:bg-accent/10'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  filter === cat.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shopping Items */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category}>
            <h3 className="font-semibold mb-3 capitalize flex items-center space-x-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center ${getCategoryColor(category)}`}>
                <span className="material-symbols-outlined text-sm">
                  {categories.find(c => c.id === category)?.icon || 'inventory_2'}
                </span>
              </span>
              <span>{category}</span>
              <span className="text-sm text-text-subtle-light dark:text-text-subtle-dark font-normal">
                ({items.length} items)
              </span>
            </h3>
            <div className="bg-white dark:bg-card-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark divide-y divide-border-light dark:divide-border-dark">
              {items.map((item, i) => (
                <div
                  key={`${item.name}-${i}`}
                  onClick={() => toggleItem(item.name)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-all ${
                    checkedItems.has(item.name) ? 'bg-gray-50 dark:bg-gray-800/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      checkedItems.has(item.name)
                        ? 'bg-accent border-accent'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {checkedItems.has(item.name) && (
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      )}
                    </div>
                    <span className={`font-medium ${
                      checkedItems.has(item.name) ? 'line-through text-text-subtle-light dark:text-text-subtle-dark' : ''
                    }`}>
                      {item.name}
                    </span>
                  </div>
                  <span className={`text-sm ${
                    checkedItems.has(item.name) ? 'text-text-subtle-light dark:text-text-subtle-dark' : 'text-accent font-medium'
                  }`}>
                    {item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-gray-400">shopping_cart</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No items in this category</h3>
          <p className="text-text-subtle-light dark:text-text-subtle-dark">
            Try selecting a different category
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
        <h3 className="font-semibold mb-3 flex items-center space-x-2">
          <span className="material-symbols-outlined text-accent">summarize</span>
          <span>Shopping Summary</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-accent">{totalItems}</div>
            <div className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Total Items</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{checkedCount}</div>
            <div className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Checked</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{totalItems - checkedCount}</div>
            <div className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{Object.keys(groupedItems).length}</div>
            <div className="text-xs text-text-subtle-light dark:text-text-subtle-dark">Categories</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingList;
