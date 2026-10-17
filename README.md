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

## Promo codes
Edit `functions/_lib/promos.js` (the list at the top). Codes are checked on the server, so customers can't see the list.
Share a code directly or add it to a link: `yoursite.com/book.html?promo=WELCOME10` fills it in automatically.

## Commercial / residential
The quote box has a Residential / Commercial toggle. Commercial costs the same by default. To charge more,
set `commercialPercent` in `public/pricing.js` AND `COMMERCIAL_PERCENT` at the top of `functions/api/book.js`.

## "Booking received" messages to customers
Sent automatically when someone books. Each one only turns on when its settings exist (Cloudflare > Settings > Variables and Secrets):
- Email: `RESEND_API_KEY`, `FROM_EMAIL` (must be an address on a domain verified in Resend, or emails to customers won't send). `OWNER_EMAIL` gets your alert.
- Text: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` (your Twilio number). US business texting requires registering your number with Twilio first.

## Database update (run once)
`npx wrangler d1 execute window-washing --remote --file=add-commercial-promo.sql`
(Bookings still save if you forget, but property and promo then go into the notes instead of their own fields.)
