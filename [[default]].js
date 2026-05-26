const API_BASE = 'https://你的真实API地址'   // ← 改这里
const CACHE_TTL = 600

// 前端实际请求路径 → 源站真实路径
const routes = {
  '/moyu':             '/v2/moyu',
  '/60s':              '/v2/60s',
  '/today-in-history': '/v2/today-in-history',
  '/fuel-price':       '/v2/fuel-price',
  '/gold-price':       '/v2/gold-price',
  '/hitokoto':         '/v2/hitokoto'
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url)
  const path = url.pathname

  const apiPath = routes[path]
  if (!apiPath) return env.NEXT.fetch(request)   // 非 API 请求交给静态页面

  // 查 KV 缓存
  try {
    const cached = await env.NEWS_CACHE.get(path)
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
      })
    }
  } catch (e) {}

  // 请求源站
  try {
    const res = await fetch(`${API_BASE}${apiPath}`)
    if (!res.ok) return new Response('源站失败', { status: 502 })
    const data = await res.text()

    // 写入 KV
    try { await env.NEWS_CACHE.put(path, data, { expirationTtl: CACHE_TTL }) } catch (e) {}

    return new Response(data, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    })
  } catch (e) {
    return new Response('源站不可达', { status: 502 })
  }
}

// 也支持 OPTIONS（CORS 预检）
export async function onRequestOptions() {
  return new Response(null, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,OPTIONS' }
  })
}
