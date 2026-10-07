# Setup
1. `npx wrangler d1 create window-washing` -> paste the database_id into wrangler.toml
2. `npx wrangler d1 execute window-washing --remote --file=schema.sql`
3. Push to GitHub. In Cloudflare: Workers & Pages > Create > Pages > connect repo. Build command: none. Output dir: public.
4. Pages project > Settings > Bindings: add D1 binding `DB` pointing to window-washing.
5. Zero Trust > Access: protect `/admin*` and `/api/admin*` with your email.
6. Optional email alerts: add env vars RESEND_API_KEY, FROM_EMAIL, OWNER_EMAIL.
Edit prices in functions/api/book.js AND public/book.html. Replace "Your Business Name" and the phone number.
