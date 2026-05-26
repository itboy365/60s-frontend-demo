export async function onRequest({ request, params, env }) {
  // 1. 获取基本参数
  const path = params.path;
  const url = new URL(request.url);
  const search = url.search; // 包含 ?t=xxx

  // 2. 生成缓存 KEY (重点!)
  let cacheKey = path;
  if (path === 'fuel-price') {
    const region = new URLSearchParams(search).get('region') || '北京';
    cacheKey = `fuel-price:${region}`;
  } else {
    // 🚀 关键修改：为其他接口也生成 KEY
    cacheKey = `${path}:core`;
  }

  // 📝 记录日志：看看生成的 KEY 是什么
  console.log(`Generated Cache Key: ${cacheKey}`);

  // 3. 尝试从 KV 读取缓存
  if (env.MY_KV) {
    try {
      const cached = await env.MY_KV.get(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT', 'X-Key': cacheKey }
        });
      }
    } catch (err) {
      console.error(`KV Read Error for key ${cacheKey}:`, err);
    }
  } else {
    // 📝 记录日志：检查 KV 是否成功绑定
    console.error('KV binding (MY_KV) is missing!');
  }

  // 4. 请求源站
  const target = `http://api.wvip.top/v2/${path}${search}`;
  const response = await fetch(target);
  const data = await response.text();

  // 5. 写入 KV (仅在源站请求成功时)
  if (response.ok && env.MY_KV) {
    try {
      await env.MY_KV.put(cacheKey, data);
      // 📝 记录日志：确认数据已写入
      console.log(`Cached data for key ${cacheKey}`);
    } catch (err) {
      console.error(`KV Write Error for key ${cacheKey}:`, err);
    }
  }

  // 6. 返回数据 (这里可以暂时先不返回自定义头)
  return new Response(data, {
    headers: { 'Content-Type': 'application/json' }
  });
}
