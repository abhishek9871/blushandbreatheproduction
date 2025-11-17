export async function onRequest(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const apiKey = env.VITE_NEWSAPI_KEY || env.NEWSAPI_KEY;
  
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const apiUrl = new URL('https://newsapi.org/v2/top-headlines');
  url.searchParams.forEach((value, key) => {
    if (key !== 'apiKey') {
      apiUrl.searchParams.set(key, value);
    }
  });
  apiUrl.searchParams.set('apiKey', apiKey);

  const response = await fetch(apiUrl.toString(), {
    headers: {
      'User-Agent': 'HealthBeautyHub/1.0',
    },
  });
  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
