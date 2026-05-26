// functions/v2/[path].js
const ORIGIN_API = 'https://api.wvip.top';

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = params.path;

  const url = new URL(request.url);
  const apiUrl = `${ORIGIN_API}/v2/${path}${url.search}`;

  const cachedData = await env.MY_KV.get(path);
  if (cachedData) {
    return new Response(cachedData, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  const response = await fetch(apiUrl);
  const data = await response.json();
  const dataStr = JSON.stringify(data);

  await env.MY_KV.put(path, dataStr);
  return new Response(dataStr, {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
  });
}
