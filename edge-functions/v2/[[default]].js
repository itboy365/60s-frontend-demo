// edge-functions/v2/[[default]].js
const API_BASE = 'https://api.wvip.top';  // 改成你的真实 API 地址
const CACHE_TTL = 600; // 缓存 10 分钟

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname; // 比如 /v2/60s

    // 1. 从 KV 缓存读取
    try {
      const cached = await env.NEWS_CACHE.get(path);
      if (cached) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'HIT'
          }
        });
      }
    } catch (e) {
      // KV 读取失败，继续请求源站
    }

    // 2. 请求源站 API
    try {
      const response = await fetch(`${API_BASE}${path}`);
      if (!response.ok) {
        return new Response('Upstream error', { status: 502 });
      }
      const data = await response.text();

      // 3. 写入 KV 缓存
      try {
        await env.NEWS_CACHE.put(path, data, { expirationTtl: CACHE_TTL });
      } catch (e) {
        // KV 写入失败不影响返回
      }

      return new Response(data, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'MISS'
        }
      });
    } catch (e) {
      return new Response('Upstream unreachable', { status: 502 });
    }
  }
};
