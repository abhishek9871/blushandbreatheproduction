/**
 * Next.js API Route: /api/substances/medicine/[name]
 * 
 * Proxy route to fetch medicine data from Cloudflare Worker backend.
 * Keeps frontend decoupled from backend implementation.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { MedicineInfo, SubstanceAPIResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubstanceAPIResponse<MedicineInfo>>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: null,
      error: 'Method not allowed'
    });
  }

  const { name } = req.query;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Medicine name is required'
    });
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/medicine/${encodeURIComponent(name)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();

    // Set caching headers for ISR
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        data: null,
        error: data.error || 'Failed to fetch medicine data'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Medicine API error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error'
    });
  }
}
