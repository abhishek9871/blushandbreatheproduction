/**
 * Next.js API Route: /api/substances/banned/[slug]
 * 
 * Proxy route to fetch banned substance data from Cloudflare Worker backend.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { BannedSubstance, SubstanceAPIResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubstanceAPIResponse<BannedSubstance>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: null,
      error: 'Method not allowed'
    });
  }

  const { slug } = req.query;
  
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Substance slug is required'
    });
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/banned/${encodeURIComponent(slug)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();

    // Set caching headers
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        data: null,
        error: data.error || 'Failed to fetch substance data'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Banned substance API error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error'
    });
  }
}
