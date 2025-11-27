/**
 * Next.js API Route: /api/substances/search
 * 
 * Proxy route to search substances from Cloudflare Worker backend.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { SearchResult, SubstanceListResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubstanceListResponse<SearchResult>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: [],
      pagination: { page: 1, pageSize: 0, total: 0, hasNextPage: false },
      error: 'Method not allowed'
    });
  }

  try {
    // Forward query parameters
    const queryString = new URLSearchParams();
    
    if (req.query.q) queryString.set('q', String(req.query.q));
    if (req.query.type) queryString.set('type', String(req.query.type));
    if (req.query.page) queryString.set('page', String(req.query.page));
    if (req.query.pageSize) queryString.set('pageSize', String(req.query.pageSize));

    const response = await fetch(
      `${API_BASE_URL}/api/substances/search?${queryString.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        data: [],
        pagination: { page: 1, pageSize: 0, total: 0, hasNextPage: false },
        error: data.error || 'Search failed'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({
      success: false,
      data: [],
      pagination: { page: 1, pageSize: 0, total: 0, hasNextPage: false },
      error: 'Internal server error'
    });
  }
}
