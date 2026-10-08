// Password-protects /admin and /api/admin. Browser shows a login box.
// Username can be anything; password is the ADMIN_PASSWORD secret.
export async function onRequest({ request, env, next }) {
  const p = new URL(request.url).pathname;
  if (!(p === '/admin' || p.startsWith('/admin/') || p.startsWith('/api/admin'))) return next();
  const deny = () => new Response('Login required', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Admin"' } });
  if (!env.ADMIN_PASSWORD) return deny(); // no password set = locked
  const h = request.headers.get('Authorization') || '';
  if (!h.startsWith('Basic ')) return deny();
  let given = '';
  try { given = atob(h.slice(6)).split(':').slice(1).join(':'); } catch { return deny(); }
  const e = new TextEncoder(), a = e.encode(given), b = e.encode(env.ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.subtle.timingSafeEqual(a, b)) return deny();
  return next();
}
