export async function onRequest({ request, params }) {
  const path = params.path;
  const url = new URL(request.url);
  const search = url.search;
  const target = `http://api.wvip.top/v2/${path}${search}`;

  return new Response(JSON.stringify({
    target: target,
    path: path,
    search: search,
    message: '这是调试信息，请检查 target 是否正确'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
