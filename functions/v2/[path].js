export async function onRequest({ request, params, env }) {
  const path = params.path;
  const url = new URL(request.url);
  const search = url.search;

  // 1. 尝试从 KV 读取缓存
  let cached = await env.MY_KV.get(path);
  if (cached) {
    // 直接返回缓存数据
    return new Response(cached, {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
    });
  }

  // 2. 缓存不存在，请求源站
  const target = `https://api.wvip.top/v2/${path}${search}`;
  const response = await fetch(target);
  const data = await response.text();

  // 3. 写入 KV（缓存 1 小时）
  await env.MY_KV.put(path, data, { expirationTtl: 3600 });

  return new Response(data, {
    headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
  });
}
