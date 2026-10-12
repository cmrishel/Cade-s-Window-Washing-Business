# Cade's Window Washing site

Static site on Cloudflare Pages, with a small database (D1) for booking requests.

## Where things are
- `public/index.html` home page with the instant estimate box
- `public/book.html` booking form (fills itself in from the estimate box)
- `public/admin/` your bookings page (password protected)
- `functions/api/book.js` saves bookings and does the official price math
- `functions/api/calendar.js` calendar feed for your phone

## Changing prices
Edit the numbers in TWO files, keeping them the same:
1. `public/pricing.js` (what customers see on the site)
2. `functions/api/book.js` (top of the file; the official math)

The price list on the home page and the booking form update by themselves.

## Settings in Cloudflare (Pages project > Settings)
- D1 binding named `DB` pointing to `window-washing`
- Secrets: `ADMIN_PASSWORD` (admin login), `CALENDAR_KEY` (calendar feed link)
- Optional email alerts: `RESEND_API_KEY`, `FROM_EMAIL`, `OWNER_EMAIL`

## First-time setup (already done for this site)
1. `npx wrangler d1 create window-washing` and paste the database_id into `wrangler.toml`
2. `npx wrangler d1 execute window-washing --remote --file=schema.sql`
3. Connect the GitHub repo in Cloudflare Pages. Build command: none. Output directory: `public`.

## One-time database update for 1-story / 2-story (do this BEFORE uploading the new code)
`npx wrangler d1 execute window-washing --remote --file=add-stories.sql`
Run it once only. Running it twice shows a "duplicate column" error, which is harmless.
