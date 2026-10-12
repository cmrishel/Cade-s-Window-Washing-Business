// ONE place for the prices the WEBSITE uses (home page box + booking page).
// IMPORTANT: when you change a number here, change the same number at the
// top of functions/api/book.js too. That file does the official math.
window.PRICING = {
  small: 5,          // dollars per small window
  standard: 10,      // dollars per standard or large window
  twoStoryExtra: 2,  // extra dollars per window for a 2-story home
  minimum: 50        // lowest price for any visit
};

// Works out the estimate. Returns { subtotal, price }.
// "price" is what the customer sees (never below the minimum).
window.calcQuote = function (small, standard, stories) {
  var p = window.PRICING;
  var total = small + standard;
  var subtotal = small * p.small + standard * p.standard;
  if (stories === 2) { subtotal += total * p.twoStoryExtra; }
  return { subtotal: subtotal, price: Math.max(Math.round(subtotal), p.minimum) };
};

// Fills in any <b data-price="small">$5</b> style spots from the numbers above.
document.querySelectorAll('[data-price]').forEach(function (el) {
  var v = window.PRICING[el.getAttribute('data-price')];
  if (v !== undefined) { el.textContent = '$' + v; }
});
