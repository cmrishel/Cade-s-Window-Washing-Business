// PRICES: the website's numbers live in public/pricing.js. Keep these the same.
// This file does the OFFICIAL math, so a customer can't change their price in the browser.
const PRICE_SMALL = 5, PRICE_STANDARD = 10, TWO_STORY_PERCENT = 25, MIN_CHARGE = 100;
// BOOKING RULES: keep these the same as the top of public/scheduler.js
const ALLOWED_DAYS = [1, 2, 3, 4, 5];   // 0 = Sunday ... 6 = Saturday (1-5 = Mon to Fri)
const ALLOWED_TIMES = ['8:00 AM'];
const clean = (v, n = 300) => String(v || '').trim().slice(0, n);
const bad = msg => new Response(msg, { status: 400 });

export async function onRequestPost({ request, env }) {
  const f = await request.formData();
  const done = Response.redirect(new URL('/thanks.html', request.url), 303);
  if (f.get('website')) return done; // honeypot: bots fill this

  if ((f.get('service') || 'exterior') !== 'exterior') return bad('Interior cleaning is coming soon.');
  const st = f.get('stories') || '1';
  if (st !== '1' && st !== '2') return bad('3-story homes are coming soon.');
  const stories = Number(st);

  const small = Math.min(Math.max(parseInt(f.get('small')) || 0, 0), 200);
  const standard = Math.min(Math.max(parseInt(f.get('standard')) || 0, 0), 200);
  if (!small && !standard) return bad('Please enter at least one window.');
  let subtotal = small * PRICE_SMALL + standard * PRICE_STANDARD;
  if (stories === 2) subtotal = subtotal * (1 + TWO_STORY_PERCENT / 100);
  const estimate = Math.max(Math.round(subtotal), MIN_CHARGE);

  const [name, phone, email, address, pref_date, pref_time, notes] =
    ['name', 'phone', 'email', 'address', 'pref_date', 'pref_time', 'notes'].map(k => clean(f.get(k), k === 'notes' ? 1000 : 200));
  if (!name || !phone || !email || !address) return bad('Please fill in your name, phone, email, and address.');

  // the day must be a real date, a working day, and after today (Boise time)
  const d = new Date(pref_date + 'T12:00:00Z');
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Boise' });
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(pref_date) && !isNaN(d) && d.toISOString().slice(0, 10) === pref_date
    && ALLOWED_DAYS.includes(d.getUTCDay()) && pref_date > today;
  if (!dateOk || !ALLOWED_TIMES.includes(pref_time)) return bad('Please pick an available day and time.');

  await env.DB.prepare('INSERT INTO bookings (name,phone,email,address,small,standard,stories,estimate,pref_date,pref_time,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .bind(name, phone, email, address, small, standard, stories, estimate, pref_date, pref_time, notes).run();
  if (env.RESEND_API_KEY && env.OWNER_EMAIL) { // optional email alert
    await fetch('https://api.resend.com/emails', { method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.FROM_EMAIL, to: env.OWNER_EMAIL, subject: `New booking: ${name}`,
        text: `${name} ${phone}\n${address}\n${small} small, ${standard} standard, ${stories}-story = $${estimate}\n${pref_date} ${pref_time}\n${notes}` }) }).catch(() => {});
  }
  return done;
}
