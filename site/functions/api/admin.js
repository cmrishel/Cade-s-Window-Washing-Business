// Protect /admin* and /api/admin* with Cloudflare Access.
export async function onRequestGet({ env }) {
  const r = await env.DB.prepare('SELECT * FROM bookings ORDER BY id DESC LIMIT 200').all();
  return Response.json(r.results);
}
export async function onRequestPatch({ request, env }) {
  const b = await request.json();
  if (b.status) {
    if (!['requested', 'confirmed', 'completed', 'cancelled'].includes(b.status)) return new Response('bad', { status: 400 });
    await env.DB.prepare('UPDATE bookings SET status=? WHERE id=?').bind(b.status, b.id).run();
  }
  if (b.paid !== undefined) await env.DB.prepare('UPDATE bookings SET paid=? WHERE id=?').bind(b.paid ? 1 : 0, b.id).run();
  return Response.json({ ok: true });
}
