// Pages Functions 终极版 - 无 KV，纯代理转发
export async function onRequest({ request, params }) {
  const path = params.path;
  const url = new URL(request.url);
  const target = `http://api.wvip.top/v2/${path}${url.search}`;

  const response = await fetch(target, {
    headers: {
      'Host': 'api.wvip.top',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    }
  });

  const data = await response.text();
  return new Response(data, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  });
}
