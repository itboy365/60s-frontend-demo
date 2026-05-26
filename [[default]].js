export async function onRequestGet() {
  return new Response("🎉函数生效了！", {
    headers: { 'Content-Type': 'text/plain' }
  });
}
