-- Run this ONCE on your existing database (see README). It adds the 1/2-story column.
ALTER TABLE bookings ADD COLUMN stories INTEGER DEFAULT 1;
