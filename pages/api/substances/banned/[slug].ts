/**
 * Next.js API Route: /api/substances/banned/[slug]
 * 
 * Fetches banned substance data from local JSON file.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { BannedSubstance } from '@/types';
import bannedSubstancesData from '@/lib/data/banned-substances.json';

interface SubstanceAPIResponse {
  success: boolean;
  data: BannedSubstance | null;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubstanceAPIResponse>
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
    // Find substance by slug in local data
    const substance = bannedSubstancesData.substances.find(
      (s: any) => s.slug.toLowerCase() === slug.toLowerCase()
    );

    // Set caching headers
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    if (!substance) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Substance not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: substance as BannedSubstance
    });
  } catch (error) {
    console.error('Banned substance API error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error'
    });
  }
}
