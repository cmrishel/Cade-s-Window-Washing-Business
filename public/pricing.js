// ONE place for the prices the WEBSITE shows (home page + booking page).
// IMPORTANT: when you change a number here, change the same number at the
// top of functions/api/book.js too. That file does the official math.
window.PRICING = {
  small: 5,            // dollars per small window
  standard: 10,        // dollars per standard or large window
  twoStoryPercent: 25, // 2-story homes cost this many percent more
  commercialPercent: 0, // commercial properties cost this many percent more (0 = same as residential)
  minimum: 100         // lowest price for any visit
};

// Works out the estimate. Returns { subtotal, price }.
// "price" is what the customer sees (never below the minimum).
window.calcQuote = function (small, standard, stories, property) {
  var p = window.PRICING;
  var subtotal = small * p.small + standard * p.standard;
  if (stories === 2) { subtotal = subtotal * (1 + p.twoStoryPercent / 100); }
  if (property === 'commercial') { subtotal = subtotal * (1 + p.commercialPercent / 100); }
  return { subtotal: subtotal, price: Math.max(Math.round(subtotal), p.minimum) };
};

// How many dollars a promo code takes off. promo = { type: 'percent' | 'amount', value: number } or null.
// (The codes themselves live in functions/_lib/promos.js, not in the browser.)
window.promoDiscount = function (price, promo) {
  if (!promo) { return 0; }
  var d = promo.type === 'percent' ? Math.round(price * promo.value / 100) : promo.value;
  return Math.min(Math.max(d, 0), price);
};

// Fills in any <b data-price="small">$5</b> style spots from the numbers above.
document.querySelectorAll('[data-price]').forEach(function (el) {
  var key = el.getAttribute('data-price');
  var v = window.PRICING[key];
  if (v === undefined) { return; }
  el.textContent = key === 'twoStoryPercent' ? '+' + v + '%' : '$' + v;
});
