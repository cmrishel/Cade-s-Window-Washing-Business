import { findPromo } from '../_lib/promos.js';
export async function onRequestGet({ request }) {
  const p = findPromo(new URL(request.url).searchParams.get('code'));
  return Response.json(p ? { ok: true, type: p.type, value: p.value, label: p.label } : { ok: false });
}
