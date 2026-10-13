// Runs the quote box on the home page and the booking page.
// Prices come from pricing.js, so you never edit numbers here.
(function () {
  var root = document.querySelector('[data-quote]');
  if (!root) { return; }

  var q = function (sel) { return root.querySelector(sel); };
  var smallSlider = q('input[name="small"]');
  var standardSlider = q('input[name="standard"]');
  var slidersBox = q('[data-sliders]');
  var soonBox = q('[data-soon]');
  var soonText = q('[data-soon-text]');
  var priceEl = q('[data-out="price"]');
  var noteEl = q('[data-out="note"]');
  var smallOut = q('[data-out="small"]');
  var standardOut = q('[data-out="standard"]');
  var bookLink = q('[data-book]');   // only on the home page

  function checked(name) {
    var r = root.querySelector('input[name="' + name + '"]:checked');
    return r ? r.value : null;
  }
  function whole(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : Math.min(Math.max(n, 0), 200); }
  // colors the filled part of a slider's track
  function paint(el) {
    el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
  }

  function say(el, text) { if (el) { el.textContent = text; } }

  function setBook(href) {
    if (!bookLink) { return; }
    if (href) { bookLink.href = href; bookLink.setAttribute('aria-disabled', 'false'); }
    else { bookLink.removeAttribute('href'); bookLink.setAttribute('aria-disabled', 'true'); }
  }

  function finish(state) {
    root.quoteState = state;   // the booking page reads this
    root.dispatchEvent(new CustomEvent('quotechange', { detail: state }));
  }

  function update() {
    var service = checked('service') || 'exterior';
    var stories = checked('stories') || '1';
    var small = whole(smallSlider.value);
    var standard = whole(standardSlider.value);

    paint(smallSlider); paint(standardSlider);
    smallOut.textContent = small;
    standardOut.textContent = standard;

    // "Coming soon" options replace the sliders
    var soon = service === 'interior' || stories === '3';
    slidersBox.hidden = soon;
    soonBox.hidden = !soon;
    if (soon) {
      soonText.textContent = service === 'interior'
        ? 'Interior window cleaning is on the way. For now we offer exterior cleaning.'
        : '3-story homes are on the way. For now we offer 1 and 2 story homes.';
      priceEl.textContent = '\u2014';
      say(noteEl, '');
      setBook(null);
      finish({ ready: false, soon: true, price: 0 });
      return;
    }

    if (small + standard === 0) {
      priceEl.textContent = '$0';
      say(noteEl, 'Slide to count your windows.');
      setBook(null);
      finish({ ready: false, soon: false, price: 0 });
      return;
    }

    var result = window.calcQuote(small, standard, Number(stories));
    priceEl.textContent = '$' + result.price;
    say(noteEl, result.subtotal < window.PRICING.minimum
      ? '$' + window.PRICING.minimum + ' minimum visit. Tracks and screens included.'
      : 'Exterior only. Tracks and screens included.');
    setBook('/book.html?small=' + small + '&standard=' + standard + '&stories=' + stories);
    finish({ ready: true, soon: false, price: result.price });
  }

  // If we arrived from the home page, fill in the choices
  if (root.hasAttribute('data-prefill')) {
    var params = new URLSearchParams(location.search);
    if (params.has('small')) { smallSlider.value = Math.min(whole(params.get('small')), smallSlider.max); }
    if (params.has('standard')) { standardSlider.value = Math.min(whole(params.get('standard')), standardSlider.max); }
    var st = params.get('stories');
    if (st === '1' || st === '2') {
      var r = root.querySelector('input[name="stories"][value="' + st + '"]');
      if (r) { r.checked = true; }
    }
  }

  root.addEventListener('input', update);
  root.addEventListener('change', update);
  update();
})();
