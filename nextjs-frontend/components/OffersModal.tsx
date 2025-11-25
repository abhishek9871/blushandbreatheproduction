'use client';

import React, { useEffect, useRef } from 'react';

interface Offer {
  title: string;
  price: { value: string; currency: string } | null;
  seller: string;
  itemWebUrl: string;
  affiliateUrl: string;
  itemId: string;
  image: string | null;
}

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  offers: Offer[];
  barcode: string;
  onAffiliateClick?: (offer: Offer) => void;
}

const OffersModal: React.FC<OffersModalProps> = ({ isOpen, onClose, offers, barcode, onAffiliateClick }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleBuyClick = async (offer: Offer) => {
    if (onAffiliateClick) {
      onAffiliateClick(offer);
    } else {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        await fetch(`${apiUrl}/api/affiliate/click`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode,
            offerItemId: offer.itemId,
            affiliateUrl: offer.affiliateUrl,
            timestamp: new Date().toISOString()
          })
        });
      } catch (error) {
        console.warn('Failed to track affiliate click:', error);
      }
      if (typeof window !== 'undefined') {
        window.open(offer.affiliateUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const copyLink = async (url: string) => {
    if (typeof navigator === 'undefined' || typeof document === 'undefined') return;
    
    try {
      await navigator.clipboard.writeText(url);
      const toast = document.createElement('div');
      toast.textContent = 'Link copied';
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg z-50';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 2000);
    } catch (error) {
      console.warn('Failed to copy link:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Compare Offers</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mb-6">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <span className="material-symbols-outlined text-sm mr-1">info</span>
              We may earn commission if you buy through these links. Prices are fetched from eBay and may change.
            </p>
          </div>

          <div className="space-y-4">
            {offers.map((offer, idx) => (
              <div key={offer.itemId} className={`border rounded-lg p-4 ${idx === 0 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
                <div className="flex gap-4">
                  {offer.image && (
                    <img src={offer.image} alt={offer.title} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2">{offer.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Sold by {offer.seller}</p>
                    {offer.price && (
                      <p className={`font-bold mt-2 ${idx === 0 ? 'text-green-600 text-lg' : 'text-gray-900 dark:text-gray-100'}`}>
                        {offer.price.currency} {offer.price.value}
                        {idx === 0 && <span className="text-xs font-normal text-green-600 ml-2">Best Price</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleBuyClick(offer)}
                      className="bg-secondary text-white px-4 py-2 rounded-lg hover:opacity-90 text-sm font-medium"
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => copyLink(offer.affiliateUrl)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title="Copy link"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersModal;
