import { DurableObject } from 'cloudflare:workers';

/**
 * AffiliateCounter Durable Object
 * 
 * Storage keys used:
 * - "count": integer counter for total clicks
 * - "clicks": array of last 200 click records
 */
export class AffiliateCounter extends DurableObject {
  constructor(state, env) {
    super(state, env);
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      switch (request.method) {
        case 'POST':
          if (path === '/click') {
            return await this.handleClick(request);
          }
          if (path === '/clear') {
            return await this.handleClear();
          }
          break;
        case 'GET':
          if (path === '/stats') {
            return await this.handleStats();
          }
          break;
      }
      
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('AffiliateCounter error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async handleClick(request) {
    const body = await request.json();
    const { barcode, offerItemId, affiliateUrl, timestamp, ip, userAgent } = body;

    // Get current count and increment atomically
    const currentCount = await this.state.storage.get('count') || 0;
    const newCount = currentCount + 1;
    
    // Get current clicks array
    const clicks = await this.state.storage.get('clicks') || [];
    
    // Create new click record with truncated URL for storage efficiency
    const newClick = {
      ts: timestamp || new Date().toISOString(),
      offerItemId,
      src: 'affiliate',
      ip: ip || 'unknown',
      ua: userAgent ? userAgent.substring(0, 100) : 'unknown',
      urlTruncated: affiliateUrl ? affiliateUrl.substring(0, 256) : ''
    };
    
    // Keep only last 200 clicks
    const updatedClicks = [newClick, ...clicks].slice(0, 200);
    
    // Atomic update of both count and clicks
    await this.state.storage.put('count', newCount);
    await this.state.storage.put('clicks', updatedClicks);
    
    return new Response(JSON.stringify({ ok: true, newCount }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async handleStats() {
    const count = await this.state.storage.get('count') || 0;
    const clicks = await this.state.storage.get('clicks') || [];
    
    return new Response(JSON.stringify({ 
      count, 
      lastClicks: clicks.slice(0, 10) // Return last 10 for stats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async handleClear() {
    await this.state.storage.deleteAll();
    return new Response(JSON.stringify({ ok: true, cleared: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}