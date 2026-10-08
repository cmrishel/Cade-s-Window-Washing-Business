// Calendar feed: subscribe to /api/calendar?key=YOUR_CALENDAR_KEY in your phone's calendar app.
export async function onRequestGet({ request, env }) {
  const key = new URL(request.url).searchParams.get('key');
  if (!env.CALENDAR_KEY || key !== env.CALENDAR_KEY) return new Response('Not found', { status: 404 });
  const { results } = await env.DB.prepare("SELECT * FROM bookings WHERE status != 'cancelled'").all();
  const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  const fold = l => (l.match(/.{1,70}/g) || ['']).join('\r\n ');
  const slot = { Morning: ['090000', '120000'], Afternoon: ['130000', '160000'] }; // "Any time" uses 9-12
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//window-washing//EN', 'X-WR-CALNAME:Window Washing', 'X-PUBLISHED-TTL:PT1H', 'REFRESH-INTERVAL;VALUE=DURATION:PT1H'];
  for (const b of results) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.pref_date || '')) continue;
    const d = b.pref_date.replace(/-/g, ''), [s, e] = slot[b.pref_time] || slot.Morning;
    const maps = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(b.address);
    const tag = b.status === 'requested' ? '[Requested] ' : b.status === 'completed' ? '[Done] ' : '';
    lines.push('BEGIN:VEVENT', `UID:booking-${b.id}@window-washing`, `DTSTAMP:${stamp}`, `DTSTART:${d}T${s}`, `DTEND:${d}T${e}`,
      `SUMMARY:${esc(`${tag}${b.name} - $${b.estimate}`)}`, `LOCATION:${esc(b.address)}`,
      `DESCRIPTION:${esc(`${b.phone}\n${b.small} small, ${b.standard} standard\nTime wanted: ${b.pref_time}\n${b.notes || ''}\nDirections: ${maps}`)}`,
      `STATUS:${b.status === 'requested' ? 'TENTATIVE' : 'CONFIRMED'}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return new Response(lines.map(fold).join('\r\n') + '\r\n', { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } });
}
