// Pages Function - proxy all /api/* requests to backend Worker
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Forward to backend Worker
  const backendUrl = `https://jyotilalchandani-backend.sparshrajput088.workers.dev${path}${url.search}`;
  
  const backendRequest = new Request(backendUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' ? request.body : undefined
  });
  
  try {
    const response = await fetch(backendRequest);
    // Add a header to verify proxy update
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Proxy-Version', 'v2-force-update');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  } catch (err) {
    console.error('Backend proxy error:', err);
    return new Response(JSON.stringify({ error: 'Backend unavailable', detail: String(err) }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
