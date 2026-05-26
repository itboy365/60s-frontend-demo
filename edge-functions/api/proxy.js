// edge-functions/api/proxy.js
const API_BASE = 'https://api.wvip.top';  // ← 记得改成你自己的 API 地址
const CACHE_TTL = 600;

const routes = {
    '/api/moyu':     '/v2/moyu',
    '/api/60s':      '/v2/60s',
    '/api/history':  '/v2/today-in-history',
    '/api/oil':      '/v2/fuel-price',
    '/api/gold':     '/v2/gold-price',
    '/api/hitokoto': '/v2/hitokoto'
};

export default async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const apiPath = routes[path];
    if (!apiPath) return new Response('Not Found', { status: 404 });

    const cached = await env.NEWS_CACHE.get(path);
    if (cached) {
        return new Response(cached, {
            headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        });
    }

    const response = await fetch(`${API_BASE}${apiPath}`);
    if (!response.ok) return new Response('Upstream error', { status: 502 });
    const data = await response.text();

    await env.NEWS_CACHE.put(path, data, { expirationTtl: CACHE_TTL });

    return new Response(data, {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
}
