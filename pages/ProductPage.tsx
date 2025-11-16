
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProductById } from '../services/apiService';
import type { Product } from '../types';
import ErrorMessage from '../components/ErrorMessage';
import BookmarkButton from '../components/BookmarkButton';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const decodedId = id ? decodeURIComponent(id) : '';
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!decodedId) {
        setError('Product ID is missing.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const p = await getProductById(decodedId);
        if (p) setProduct(p);
        else setError('Product not found.');
      } catch (e) {
        setError('Failed to fetch product.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [decodedId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full aspect-video rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-8 w-2/3 mt-6 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    );
  }
  if (error) return <div className="max-w-5xl mx-auto p-8"><ErrorMessage message={error} /></div>;
  if (!product) return null;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/beauty" className="text-primary font-semibold hover:underline">&larr; Back to products</Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        <div className="w-full overflow-hidden rounded-xl bg-gray-100">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark">{product.brand}</p>
              <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
              <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mt-1">{product.category}</p>
            </div>
            <BookmarkButton itemId={product.id} />
          </div>
          <p className="text-2xl font-black">${product.price.toFixed(2)}</p>
          <div className="text-sm text-text-subtle-light dark:text-text-subtle-dark">Rating: {product.rating} • Reviews: {product.reviews.toLocaleString()}</div>
          <div className="mt-6">
            <button className="h-11 px-6 rounded-md bg-secondary text-white font-semibold hover:opacity-90">Add to Cart</button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProductPage;
