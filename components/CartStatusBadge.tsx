import React, { useState } from 'react';
import { useNutritionCart } from '../hooks/useNutritionCart';

interface CartStatusBadgeProps {
  onOpenCart: () => void;
}

const CartStatusBadge: React.FC<CartStatusBadgeProps> = ({ onOpenCart }) => {
  const { state, getItemCount } = useNutritionCart();
  const itemCount = getItemCount();

  return (
    <button
      onClick={onOpenCart}
      className="relative flex items-center gap-2 px-4 py-2 bg-accent text-text-light rounded-lg hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md group"
      title={`${itemCount} items in cart (${Math.round(state.totalCalories)} calories)`}
    >
      <span className="material-symbols-outlined text-lg">shopping_cart</span>
      <span className="font-medium text-sm">My Foods</span>
      
      {/* Item count badge */}
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}

      {/* Hover tooltip */}
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
        <div className="font-medium mb-1">Quick Summary:</div>
        <div>Calories: {Math.round(state.totalCalories)} kcal</div>
        <div>Protein: {Math.round(state.totalProtein)}g</div>
        <div>Carbs: {Math.round(state.totalCarbs)}g</div>
        <div>Fats: {Math.round(state.totalFats)}g</div>
        <div className="absolute top-full right-4 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </button>
  );
};

export default CartStatusBadge;
