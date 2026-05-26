export async function onRequest({ request, params, env }) {
  try {
    const path = params.path;
    // 1. 检查 KV 是否绑定
    if (!env.MY_KV) {
      return new Response(JSON.stringify({ error: 'KV not bound' }), { status: 500 });
    }
    // 2. 尝试写入测试数据
    await env.MY_KV.put('test', 'ok');
    // 3. 尝试读取测试数据
    const test = await env.MY_KV.get('test');
    // 4. 返回成功信息
    return new Response(JSON.stringify({ bound: true, test: test }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
