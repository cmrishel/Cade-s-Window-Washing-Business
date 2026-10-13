# Sightline Window Cleaning site

Static site on Cloudflare Pages, with a small database (D1) for bookings.

## Where things are
- `public/index.html` home page with the instant estimate box
- `public/book.html` booking page (sliders, calendar and time picker, your details)
- `public/admin/` your bookings page (password protected)
- `public/pricing.js` prices shown on the site
- `public/scheduler.js` the days and times people can book
- `functions/api/book.js` saves bookings and does the official price and schedule checks
- `functions/api/calendar.js` calendar feed for your phone

## Changing prices
Edit the numbers in TWO files, keeping them the same:
1. `public/pricing.js` (what customers see)
2. `functions/api/book.js` (top of the file; the official math)

Current prices: $5 small window, $10 standard/large window, 2-story homes +25%, $100 minimum.
The price tiles on the home page and the booking form update by themselves.

## Changing the days and times you take bookings
Edit the "YOUR BOOKING RULES" at the top of TWO files, keeping them the same:
1. `public/scheduler.js` (what the calendar allows)
2. `functions/api/book.js` (`ALLOWED_DAYS` and `ALLOWED_TIMES`)

Currently Monday to Friday at 8:00 AM only. Other days and times show grayed out.
To open more times, add them to `TIMES` in both files (for example `'8:00 AM', '10:00 AM'`).

## "Coming soon" options
Interior cleaning and 3-story homes show "Coming soon" in the quote box and can't be booked
(the server also refuses them). When you're ready to offer them, they need to be turned on in
`public/estimator.js` and `functions/api/book.js`.

## Settings in Cloudflare (Pages project > Settings)
- D1 binding named `DB` pointing to `window-washing`
- Secrets: `ADMIN_PASSWORD` (admin login), `CALENDAR_KEY` (calendar feed link)
- Optional email alerts: `RESEND_API_KEY`, `FROM_EMAIL`, `OWNER_EMAIL`

## First-time setup (already done for this site)
1. `npx wrangler d1 create window-washing` and paste the database_id into `wrangler.toml`
2. `npx wrangler d1 execute window-washing --remote --file=schema.sql`
3. Connect the GitHub repo in Cloudflare Pages. Build command: none. Output directory: `public`.
4. 1/2-story column: run `add-stories.sql` once (skip if you already did).
