// functions/v2/[path].js - 极简版（首选方案）
export async function onRequest({ request, params }) {
  const path = params.path;
  const url = new URL(request.url);
  const apiUrl = `http://api.wvip.top/v2/${path}${url.search}`;

  // 核心：模拟浏览器请求头
  const response = await fetch(apiUrl, {
    headers: {
      'Host': 'api.wvip.top', 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    }
  });
  
  const data = await response.text();
  return new Response(data, {
    headers: { 'Content-Type': 'application/json' }
  });
}
