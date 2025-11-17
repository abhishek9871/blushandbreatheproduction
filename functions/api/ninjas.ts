export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const query = url.searchParams.get('query');
  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing query parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = env.VITE_API_NINJAS_KEY || env.API_NINJAS_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiUrl = `https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`;
  
  const response = await fetch(apiUrl, {
    headers: {
      'X-Api-Key': apiKey,
    },
  });
  
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
