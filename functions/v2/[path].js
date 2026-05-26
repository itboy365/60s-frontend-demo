// functions/v2/[path].js
export async function onRequest({ request, params, env }) {
  const path = params.path;
  const url = new URL(request.url);
  const search = url.search;

  // 缓存时间配置（秒）
  const TTL_MAP = {
    moyu: 3600,               // 摸鱼日报：1小时
    '60s': 3600,              // 60秒新闻：1小时
    'today-in-history': 86400, // 历史上的今天：24小时
    'fuel-price': 600,        // 油价：10分钟
    'gold-price': 600,        // 金价：10分钟
    hitokoto: 600             // 一言：10分钟
  };
  const ttl = TTL_MAP[path] || 3600;

  // 构造缓存key（油价需要区分地区）
  let cacheKey = path;
  if (path === 'fuel-price') {
    const region = new URLSearchParams(search).get('region') || '北京';
    cacheKey = `fuel-price:${region}`;
  }

  // 尝试从 KV 读取缓存
  const cached = await env.MY_KV.get(cacheKey);
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  // 缓存不存在或已过期，请求源站（使用 HTTP，因为您的源站 HTTP 工作正常）
  const target = `http://api.wvip.top/v2/${path}${search}`;
  const response = await fetch(target);
  const data = await response.text();

  // 写入 KV，设置过期时间
  await env.MY_KV.put(cacheKey, data, { expirationTtl: ttl });

  return new Response(data, {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
  });
}
