// ONE place for the prices the WEBSITE shows (home page + booking page).
// IMPORTANT: when you change a number here, change the same number at the
// top of functions/api/book.js too. That file does the official math.
window.PRICING = {
  small: 5,            // dollars per small window
  standard: 10,        // dollars per standard or large window
  twoStoryPercent: 25, // 2-story homes cost this many percent more
  minimum: 100         // lowest price for any visit
};

// Works out the estimate. Returns { subtotal, price }.
// "price" is what the customer sees (never below the minimum).
window.calcQuote = function (small, standard, stories) {
  var p = window.PRICING;
  var subtotal = small * p.small + standard * p.standard;
  if (stories === 2) { subtotal = subtotal * (1 + p.twoStoryPercent / 100); }
  return { subtotal: subtotal, price: Math.max(Math.round(subtotal), p.minimum) };
};

// Fills in any <b data-price="small">$5</b> style spots from the numbers above.
document.querySelectorAll('[data-price]').forEach(function (el) {
  var key = el.getAttribute('data-price');
  var v = window.PRICING[key];
  if (v === undefined) { return; }
  el.textContent = key === 'twoStoryPercent' ? '+' + v + '%' : '$' + v;
});
