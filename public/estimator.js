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
  var heightLegend = q('[data-height-legend]');
  var wasEl = q('[data-out="was"]');   // promo: the price before the discount (booking page only)
  var promoInput = q('[data-promo-input]');
  var promoBtn = q('[data-promo-apply]');
  var promoMsg = q('[data-promo-msg]');
  var promo = null;

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

  function promoSay(text, ok) {
    if (!promoMsg) { return; }
    promoMsg.textContent = text;
    promoMsg.classList.toggle('ok', !!ok);
  }
  // asks the server if the code is real (the codes are not stored in the browser)
  function applyCode() {
    var code = promoInput.value.trim();
    if (!code) { promo = null; promoSay(''); update(); return; }
    promoSay('Checking...');
    fetch('/api/promo?code=' + encodeURIComponent(code))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) { promo = { type: d.type, value: d.value }; promoSay(d.label + ' applied.', true); }
        else { promo = null; promoSay("That code isn't valid."); }
        update();
      })
      .catch(function () { promo = null; promoSay("Couldn't check that code. Try again."); update(); });
  }

  function finish(state) {
    root.quoteState = state;   // the booking page reads this
    root.dispatchEvent(new CustomEvent('quotechange', { detail: state }));
  }

  function update() {
    var service = checked('service') || 'exterior';
    var stories = checked('stories') || '1';
    var property = checked('property') || 'residential';
    if (heightLegend) { heightLegend.textContent = property === 'commercial' ? 'Building height' : 'Home height'; }
    if (wasEl) { wasEl.hidden = true; }
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
        : '3-story buildings are on the way. For now we offer 1 and 2 story properties.';
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

    var result = window.calcQuote(small, standard, Number(stories), property);
    var off = window.promoDiscount(result.price, promo);
    var finalPrice = result.price - off;
    priceEl.textContent = '$' + finalPrice;
    if (wasEl && off > 0) { wasEl.hidden = false; wasEl.textContent = '$' + result.price; }
    var kind = property === 'commercial' ? 'Commercial estimate' : 'Exterior only';
    say(noteEl, result.subtotal < window.PRICING.minimum
      ? '$' + window.PRICING.minimum + ' minimum visit. Tracks and screens included.'
      : kind + '. Tracks and screens included.');
    setBook('/book.html?small=' + small + '&standard=' + standard + '&stories=' + stories + '&property=' + property);
    finish({ ready: true, soon: false, price: finalPrice });
  }

  // If we arrived from the home page, fill in the choices
  if (root.hasAttribute('data-prefill')) {
    var params = new URLSearchParams(location.search);
    if (params.has('small')) { smallSlider.value = Math.min(whole(params.get('small')), smallSlider.max); }
    if (params.has('standard')) { standardSlider.value = Math.min(whole(params.get('standard')), standardSlider.max); }
    var pr = params.get('property');
    if (pr === 'residential' || pr === 'commercial') {
      var pp = root.querySelector('input[name="property"][value="' + pr + '"]');
      if (pp) { pp.checked = true; }
    }
    var st = params.get('stories');
    if (st === '1' || st === '2') {
      var r = root.querySelector('input[name="stories"][value="' + st + '"]');
      if (r) { r.checked = true; }
    }
  }

  if (promoInput) {
    promoBtn.addEventListener('click', applyCode);
    promoInput.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); applyCode(); } });
    promoInput.addEventListener('input', function () { promo = null; promoSay(''); });
    promoInput.addEventListener('change', applyCode);
    var urlCode = new URLSearchParams(location.search).get('promo');
    if (urlCode) { promoInput.value = urlCode.slice(0, 30); }
  }

  root.addEventListener('input', update);
  root.addEventListener('change', update);
  update();
  if (promoInput && promoInput.value) { applyCode(); }
})();
