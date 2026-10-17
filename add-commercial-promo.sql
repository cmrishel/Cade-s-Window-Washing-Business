-- Run ONCE (existing database): npx wrangler d1 execute window-washing --remote --file=add-commercial-promo.sql
ALTER TABLE bookings ADD COLUMN property TEXT DEFAULT 'residential';
ALTER TABLE bookings ADD COLUMN promo TEXT;
ALTER TABLE bookings ADD COLUMN discount INTEGER DEFAULT 0;
