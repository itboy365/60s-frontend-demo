// functions/v2/[path].js - 调试版（会返回详细错误信息）
export async function onRequest(context) {
  try {
    const { request, env, params } = context;
    const path = params.path;

    // 检查 KV 是否绑定
    if (!env.MY_KV) {
      return new Response(JSON.stringify({ error: 'KV not bound', fix: '请在项目设置中绑定 KV，变量名必须为 MY_KV' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const search = url.search;
    const originUrl = `http://api.wvip.top/v2/${path}${search}`;

    // 尝试读缓存
    let cached = null;
    try {
      const raw = await env.MY_KV.get(path);
      if (raw) cached = JSON.parse(raw);
    } catch (e) {
      return new Response(JSON.stringify({ error: 'KV 读取失败', detail: e.message }), { status: 500 });
    }

    if (cached && (Date.now() - cached.timestamp < 3600000)) {
      return new Response(JSON.stringify(cached.data), {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
      });
    }

    // 请求源站
    const resp = await fetch(originUrl);
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `源站返回 ${resp.status}`, url: originUrl }), { status: 500 });
    }
    const data = await resp.json();

    // 写入 KV
    await env.MY_KV.put(path, JSON.stringify({ timestamp: Date.now(), data: data }));

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
