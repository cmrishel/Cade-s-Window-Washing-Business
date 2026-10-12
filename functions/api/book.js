// PRICES: the website's numbers live in public/pricing.js. Keep these the same.
// This file does the OFFICIAL math, so a customer can't change their price in the browser.
const PRICE_SMALL = 5, PRICE_STANDARD = 10, TWO_STORY_EXTRA = 2, MIN_CHARGE = 50;
const TIMES = ['Any time', 'Morning', 'Afternoon'];
const clean = (v, n = 300) => String(v || '').trim().slice(0, n);
export async function onRequestPost({ request, env }) {
  const f = await request.formData();
  const done = Response.redirect(new URL('/thanks.html', request.url), 303);
  if (f.get('website')) return done; // honeypot: bots fill this
  const small = Math.min(Math.max(parseInt(f.get('small')) || 0, 0), 200);
  const standard = Math.min(Math.max(parseInt(f.get('standard')) || 0, 0), 200);
  if (!small && !standard) return new Response('Please enter at least one window.', { status: 400 });
  const stories = f.get('stories') === '2' ? 2 : 1;
  const subtotal = small * PRICE_SMALL + standard * PRICE_STANDARD + (stories === 2 ? (small + standard) * TWO_STORY_EXTRA : 0);
  const estimate = Math.max(Math.round(subtotal), MIN_CHARGE);
  const [name, phone, email, address, pref_date, pref_time, notes] =
    ['name', 'phone', 'email', 'address', 'pref_date', 'pref_time', 'notes'].map(k => clean(f.get(k), k === 'notes' ? 1000 : 200));
  if (!name || !phone || !email || !address) return new Response('Please fill in your name, phone, email, and address.', { status: 400 });
  const date = /^\d{4}-\d{2}-\d{2}$/.test(pref_date) ? pref_date : '';
  const time = TIMES.includes(pref_time) ? pref_time : 'Any time';
  await env.DB.prepare('INSERT INTO bookings (name,phone,email,address,small,standard,stories,estimate,pref_date,pref_time,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .bind(name, phone, email, address, small, standard, stories, estimate, date, time, notes).run();
  if (env.RESEND_API_KEY && env.OWNER_EMAIL) { // optional email alert
    await fetch('https://api.resend.com/emails', { method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.FROM_EMAIL, to: env.OWNER_EMAIL, subject: `New wash request: ${name}`,
        text: `${name} ${phone}\n${address}\n${small} small, ${standard} standard, ${stories}-story = $${estimate}\n${date} ${time}\n${notes}` }) }).catch(() => {});
  }
  return done;
}
