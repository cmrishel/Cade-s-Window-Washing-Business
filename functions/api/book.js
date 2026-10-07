const PRICE_SMALL = 5, PRICE_STANDARD = 10, MIN_CHARGE = 50; // keep in sync with public/book.html
const clean = (v, n = 300) => String(v || '').trim().slice(0, n);
export async function onRequestPost({ request, env }) {
  const f = await request.formData();
  const done = Response.redirect(new URL('/thanks.html', request.url), 303);
  if (f.get('website')) return done; // honeypot: bots fill this
  const small = Math.min(Math.max(parseInt(f.get('small')) || 0, 0), 200);
  const standard = Math.min(Math.max(parseInt(f.get('standard')) || 0, 0), 200);
  if (!small && !standard) return new Response('Please enter at least one window.', { status: 400 });
  const estimate = Math.max(small * PRICE_SMALL + standard * PRICE_STANDARD, MIN_CHARGE);
  const b = ['name', 'phone', 'email', 'address', 'pref_date', 'pref_time', 'notes'].map(k => clean(f.get(k), k === 'notes' ? 1000 : 200));
  await env.DB.prepare('INSERT INTO bookings (name,phone,email,address,small,standard,estimate,pref_date,pref_time,notes) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .bind(b[0], b[1], b[2], b[3], small, standard, estimate, b[4], b[5], b[6]).run();
  if (env.RESEND_API_KEY && env.OWNER_EMAIL) { // optional email alert
    await fetch('https://api.resend.com/emails', { method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.FROM_EMAIL, to: env.OWNER_EMAIL, subject: `New wash request: ${b[0]}`,
        text: `${b[0]} ${b[1]}\n${b[3]}\n${small} small, ${standard} standard = $${estimate}\n${b[4]} ${b[5]}\n${b[6]}` }) }).catch(() => {});
  }
  return done;
}
