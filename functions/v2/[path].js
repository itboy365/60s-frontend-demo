export async function onRequest(context) {
  const { request, params } = context;
  const path = params.path;
  const url = new URL(request.url);
  const target = `http://api.wvip.top/v2/${path}${url.search}`;
  const response = await fetch(target);
  const data = await response.text();
  return new Response(data, {
    headers: { 'Content-Type': 'application/json' }
  });
}
