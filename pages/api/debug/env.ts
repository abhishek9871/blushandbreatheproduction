import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.status(200).json({
    message: 'Debug endpoint - development only',
    nodeEnv: process.env.NODE_ENV,
  });
}