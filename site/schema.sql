CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT, created TEXT DEFAULT CURRENT_TIMESTAMP,
  name TEXT, phone TEXT, email TEXT, address TEXT, small INTEGER, standard INTEGER, estimate INTEGER,
  pref_date TEXT, pref_time TEXT, notes TEXT, status TEXT DEFAULT 'requested', paid INTEGER DEFAULT 0);
