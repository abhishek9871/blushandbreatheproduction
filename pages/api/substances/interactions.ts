/**
 * Next.js API Route: /api/substances/interactions
 * 
 * Proxy route to check drug interactions from Cloudflare Worker backend.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { DrugInteraction } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com';

interface InteractionResponse {
  success: boolean;
  data: DrugInteraction[];
  drugs?: string[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InteractionResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: [],
      error: 'Method not allowed'
    });
  }

  const { drugA, drugB } = req.query;

  if (!drugA || !drugB) {
    return res.status(400).json({
      success: false,
      data: [],
      error: 'Both drugA and drugB parameters are required'
    });
  }

  try {
    const queryString = new URLSearchParams({
      drugA: String(drugA),
      drugB: String(drugB),
    });

    const response = await fetch(
      `${API_BASE_URL}/api/interactions/check?${queryString.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    const data = await response.json();

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        data: [],
        error: data.error || 'Interaction check failed'
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Interaction API error:', error);
    return res.status(500).json({
      success: false,
      data: [],
      error: 'Internal server error'
    });
  }
}
