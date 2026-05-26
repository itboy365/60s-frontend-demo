export async function onRequest({ request, params, env }) {
  const path = params.path;
  const url = new URL(request.url);
  const search = url.search;

  // ---------- 1. 缓存时间配置 ----------
  const TTL_MAP = {
    moyu: 3600,               // 摸鱼日报：1小时
    '60s': 3600,              // 60秒新闻：1小时
    'today-in-history': 86400, // 历史上的今天：24小时
    'fuel-price': 600,        // 油价：10分钟
    'gold-price': 600,        // 金价：10分钟
    hitokoto: 600             // 一言：10分钟
  };
  const ttl = TTL_MAP[path] || 3600;

  // ---------- 2. 构建缓存 key（油价区分地区） ----------
  let cacheKey = path;
  if (path === 'fuel-price') {
    const region = new URLSearchParams(search).get('region') || '北京';
    cacheKey = `fuel-price:${region}`;
  }

  // ---------- 3. 尝试从 KV 读取缓存 ----------
  // 检查 KV 是否可用
  if (env.MY_KV) {
    try {
      const cached = await env.MY_KV.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
        });
      }
    } catch (err) {
      console.error('KV read error:', err);
      // 继续执行，不中断
    }
  }

  // ---------- 4. 回源函数：支持 HTTPS 自动降级 HTTP ----------
  async function fetchWithFallback(targetUrl) {
    // 先尝试 HTTPS
    let httpsUrl = targetUrl.replace('http://', 'https://');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      const response = await fetch(httpsUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        return { data: await response.text(), protocol: 'https' };
      }
      // 状态码异常，记录并尝试 HTTP
      console.warn(`HTTPS returned ${response.status}, fallback to HTTP`);
    } catch (err) {
      console.warn(`HTTPS fetch failed: ${err.message}, fallback to HTTP`);
    }

    // 降级到 HTTP
    let httpUrl = targetUrl.replace('https://', 'http://');
    const response = await fetch(httpUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { data: await response.text(), protocol: 'http' };
  }

  // 基础 URL（先用 HTTP 占位，fetchWithFallback 会自动转换为 HTTPS 再降级）
  const baseTarget = `http://api.wvip.top/v2/${path}${search}`;
  let result;
  try {
    result = await fetchWithFallback(baseTarget);
  } catch (err) {
    // 彻底失败，返回错误信息
    return new Response(JSON.stringify({ error: '源站不可用', detail: err.message }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ---------- 5. 写入 KV 缓存 ----------
  if (env.MY_KV) {
    try {
      await env.MY_KV.put(cacheKey, result.data, { expirationTtl: ttl });
    } catch (err) {
      console.error('KV write error:', err);
    }
  }

  // ---------- 6. 返回响应 ----------
  return new Response(result.data, {
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'MISS',
      'X-Protocol': result.protocol   // 可选：标记实际使用的协议
    }
  });
}
