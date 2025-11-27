/**
 * Next.js API Route: /api/substances/affiliate/[slug]
 * 
 * Proxy route to fetch affiliate products for a supplement from Cloudflare Worker backend.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { AffiliateProduct } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com';

interface AffiliateResponse {
  success: boolean;
  data: AffiliateProduct[];
  ingredient?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AffiliateResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: [],
      error: 'Method not allowed'
    });
  }

  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({
      success: false,
      data: [],
      error: 'Supplement slug is required'
    });
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/affiliate/${encodeURIComponent(slug)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();

    // Cache for 6 hours (affiliate data changes less frequently)
    res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate');

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        data: [],
        error: data.error || 'Failed to fetch affiliate products'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Affiliate API error:', error);
    return res.status(500).json({
      success: false,
      data: [],
      error: 'Internal server error'
    });
  }
}
