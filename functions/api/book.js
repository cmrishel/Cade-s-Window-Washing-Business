import { findPromo, discountFor } from '../_lib/promos.js';

// PRICES: the website's numbers live in public/pricing.js. Keep these the same.
// This file does the OFFICIAL math, so a customer can't change their price in the browser.
const PRICE_SMALL = 5, PRICE_STANDARD = 10, TWO_STORY_PERCENT = 25, COMMERCIAL_PERCENT = 0, MIN_CHARGE = 100;
// BOOKING RULES: keep these the same as the top of public/scheduler.js
const ALLOWED_DAYS = [1, 2, 3, 4, 5];   // 0 = Sunday ... 6 = Saturday (1-5 = Mon to Fri)
const ALLOWED_TIMES = ['8:00 AM'];
const BUSINESS_PHONE = '(208) 480-2233';
const clean = (v, n = 300) => String(v || '').trim().slice(0, n);
const bad = msg => new Response(msg, { status: 400 });

// Optional: customer email (needs RESEND_API_KEY + FROM_EMAIL) and customer text (needs Twilio keys).
// Anything not set up is skipped quietly. The booking is always saved first.
async function sendEmail(env, to, subject, text) {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL || !to) return;
  await fetch('https://api.resend.com/emails', { method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env.FROM_EMAIL, to, subject, text }) }).catch(() => {});
}
async function sendText(env, phone, body) {
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM) return;
  const digits = String(phone).replace(/\D/g, '');
  const to = digits.length === 10 ? '+1' + digits : digits.length === 11 && digits[0] === '1' ? '+' + digits : null;
  if (!to) return;
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, { method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ To: to, From: env.TWILIO_FROM, Body: body }) }).catch(() => {});
}

export async function onRequestPost({ request, env, waitUntil }) {
  const f = await request.formData();
  const done = Response.redirect(new URL('/thanks.html', request.url), 303);
  if (f.get('website')) return done; // honeypot: bots fill this

  if ((f.get('service') || 'exterior') !== 'exterior') return bad('Interior cleaning is coming soon.');
  const st = f.get('stories') || '1';
  if (st !== '1' && st !== '2') return bad('3-story buildings are coming soon.');
  const stories = Number(st);
  const property = f.get('property') === 'commercial' ? 'commercial' : 'residential';

  const small = Math.min(Math.max(parseInt(f.get('small')) || 0, 0), 200);
  const standard = Math.min(Math.max(parseInt(f.get('standard')) || 0, 0), 200);
  if (!small && !standard) return bad('Please enter at least one window.');
  let subtotal = small * PRICE_SMALL + standard * PRICE_STANDARD;
  if (stories === 2) subtotal = subtotal * (1 + TWO_STORY_PERCENT / 100);
  if (property === 'commercial') subtotal = subtotal * (1 + COMMERCIAL_PERCENT / 100);
  const base = Math.max(Math.round(subtotal), MIN_CHARGE);
  const promo = findPromo(f.get('promo'));          // checked here, so the price can't be faked in the browser
  const discount = discountFor(base, promo);
  const estimate = base - discount;

  const [name, phone, email, address, pref_date, pref_time, notes] =
    ['name', 'phone', 'email', 'address', 'pref_date', 'pref_time', 'notes'].map(k => clean(f.get(k), k === 'notes' ? 1000 : 200));
  if (!name || !phone || !email || !address) return bad('Please fill in your name, phone, email, and address.');

  // the day must be a real date, a working day, and after today (Boise time)
  const d = new Date(pref_date + 'T12:00:00Z');
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Boise' });
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(pref_date) && !isNaN(d) && d.toISOString().slice(0, 10) === pref_date
    && ALLOWED_DAYS.includes(d.getUTCDay()) && pref_date > today;
  if (!dateOk || !ALLOWED_TIMES.includes(pref_time)) return bad('Please pick an available day and time.');

  try {
    await env.DB.prepare('INSERT INTO bookings (name,phone,email,address,small,standard,stories,estimate,pref_date,pref_time,notes,property,promo,discount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .bind(name, phone, email, address, small, standard, stories, estimate, pref_date, pref_time, notes, property, promo ? promo.code : null, discount).run();
  } catch (err) {
    // The new columns aren't in the database yet (add-commercial-promo.sql not run). Save the booking anyway.
    const tag = `${property === 'commercial' ? '[COMMERCIAL] ' : ''}${promo ? `[PROMO ${promo.code} -$${discount}] ` : ''}`;
    await env.DB.prepare('INSERT INTO bookings (name,phone,email,address,small,standard,stories,estimate,pref_date,pref_time,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .bind(name, phone, email, address, small, standard, stories, estimate, pref_date, pref_time, (tag + notes).slice(0, 1000)).run();
  }

  const when = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  const first = name.split(' ')[0];
  const msg = `Hi ${first}, we received your booking request for ${when} at ${pref_time}. Your estimate is $${estimate}` +
    `${promo ? ` (code ${promo.code} applied)` : ''}. We don't confirm by text or email: your day, time, and final price are confirmed when we arrive for the job. ` +
    `Questions? Call or text ${BUSINESS_PHONE}. Sightline Window Cleaning`;
  const jobs = [
    sendEmail(env, email, 'We received your booking request', msg),
    sendText(env, phone, msg),
    env.OWNER_EMAIL ? sendEmail(env, env.OWNER_EMAIL, `New booking: ${name}`,
      `${name} ${phone}\n${address}\n${property}: ${small} small, ${standard} standard, ${stories}-story = $${estimate}` +
      `${promo ? ` (promo ${promo.code}, -$${discount})` : ''}\n${pref_date} ${pref_time}\n${notes}`) : null,
  ];
  const all = Promise.all(jobs);
  if (waitUntil) waitUntil(all); else await all;
  return done;
}
