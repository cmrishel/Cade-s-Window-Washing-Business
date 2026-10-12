// Powers the estimate box on the home page.
// Prices come from pricing.js, so you never edit numbers here.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var smallSlider = $('e-small'), standardSlider = $('e-standard');
  var priceText = $('e-price'), noteText = $('e-note'), bookButton = $('e-book');

  function getStories() {
    var r = document.querySelector('input[name="stories"]:checked');
    return r ? Number(r.value) : 1;
  }

  function update() {
    var small = Number(smallSlider.value);
    var standard = Number(standardSlider.value);
    var stories = getStories();

    $('e-small-v').textContent = small;
    $('e-standard-v').textContent = standard;

    // No windows chosen
    if (small + standard === 0) {
      priceText.textContent = '$0';
      noteText.textContent = 'Slide to count your windows.';
      bookButton.setAttribute('aria-disabled', 'true');
      bookButton.removeAttribute('href');
      return;
    }

    var q = window.calcQuote(small, standard, stories);
    priceText.textContent = '$' + q.price;

    if (q.subtotal < window.PRICING.minimum) {
      noteText.textContent = '$' + window.PRICING.minimum + ' minimum visit. Exterior only. You pay after the job.';
    } else {
      noteText.textContent = 'Exterior only. Tracks and screens included. You pay after the job.';
    }

    // The booking page reads these and fills in its form
    bookButton.href = '/book.html?small=' + small + '&standard=' + standard + '&stories=' + stories;
    bookButton.setAttribute('aria-disabled', 'false');
  }

  smallSlider.addEventListener('input', update);
  standardSlider.addEventListener('input', update);
  document.querySelectorAll('input[name="stories"]').forEach(function (r) {
    r.addEventListener('change', update);
  });
  update();
})();
