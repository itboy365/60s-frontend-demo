// functions/v2/[path].js - 增强版（最终形态）
export async function onRequest({ request, params, env }) {
  const path = params.path;
  const url = new URL(request.url);
  const search = url.search;

  // 1. 定义缓存 TTL
  const TTL_MAP = { moyu: 3600, '60s': 3600, 'today-in-history': 86400, 'fuel-price': 600, 'gold-price': 600, hitokoto: 600 };
  const ttl = TTL_MAP[path] || 3600;

  // 2. 构建缓存 key
  let cacheKey = path;
  if (path === 'fuel-price') {
    const region = new URLSearchParams(search).get('region') || '北京';
    cacheKey = `fuel-price:${region}`;
  }

  // 3. 尝试读取 KV
  if (env.MY_KV) {
    try {
      const cached = await env.MY_KV.get(cacheKey);
      if (cached) {
        return new Response(cached, { headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' } });
      }
    } catch (err) { console.error('KV read error:', err); }
  }

  // 4. 请求源站（带上关键请求头）
  const apiUrl = `http://api.wvip.top/v2/${path}${search}`;
  const response = await fetch(apiUrl, {
    headers: {
      'Host': 'api.wvip.top',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    }
  });
  const data = await response.text();

  // 5. 写入 KV
  if (env.MY_KV) {
    try {
      await env.MY_KV.put(cacheKey, data, { expirationTtl: ttl });
    } catch (err) { console.error('KV write error:', err); }
  }

  return new Response(data, { headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' } });
}
