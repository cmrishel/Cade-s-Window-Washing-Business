// Calendar and time picker for the booking page.
(function () {
  /* =====================================================
     YOUR BOOKING RULES: change these any time.
     IMPORTANT: also change ALLOWED_DAYS and ALLOWED_TIMES at the
     top of functions/api/book.js so the server agrees.
     ===================================================== */
  var DAYS = [1, 2, 3, 4, 5];            // days you work: 0 = Sunday ... 6 = Saturday (1-5 = Mon to Fri)
  var TIMES = ['8:00 AM'];               // times people CAN book
  var SHOW_TIMES = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM']; // all times shown (the rest are grayed out)
  var MIN_DAYS_AHEAD = 1;                // 1 = earliest is tomorrow
  var MAX_DAYS_AHEAD = 90;               // how far ahead people can book

  var grid = document.getElementById('cal-grid');
  if (!grid) { return; }
  var title = document.getElementById('cal-title');
  var prev = document.getElementById('cal-prev');
  var next = document.getElementById('cal-next');
  var timesHead = document.getElementById('times-head');
  var timeList = document.getElementById('time-list');
  var message = document.getElementById('sched-msg');
  var dateField = document.getElementById('pref_date');
  var timeField = document.getElementById('pref_time');

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pretty(d) { return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }

  var today = startOfDay(new Date());
  var first = addDays(today, MIN_DAYS_AHEAD);
  var last = addDays(today, MAX_DAYS_AHEAD);
  var firstMonth = new Date(first.getFullYear(), first.getMonth(), 1);
  var lastMonth = new Date(last.getFullYear(), last.getMonth(), 1);
  var view = new Date(firstMonth.getTime());
  var selected = null;     // a Date
  var selectedTime = '';

  function isOpen(d) { return d >= first && d <= last && DAYS.indexOf(d.getDay()) !== -1; }

  function renderCalendar() {
    title.textContent = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    prev.disabled = view <= firstMonth;
    next.disabled = view >= lastMonth;
    grid.textContent = '';

    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (letter) {
      var s = document.createElement('span');
      s.className = 'cal-dow';
      s.textContent = letter;
      grid.appendChild(s);
    });
    for (var i = 0; i < view.getDay(); i++) { grid.appendChild(document.createElement('span')); }

    var count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (var day = 1; day <= count; day++) {
      (function (date) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'cal-day';
        b.textContent = date.getDate();
        b.disabled = !isOpen(date);
        b.setAttribute('aria-label', pretty(date) + (b.disabled ? ', not available' : ''));
        if (selected && iso(selected) === iso(date)) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
        b.addEventListener('click', function () { choose(date); });
        grid.appendChild(b);
      })(new Date(view.getFullYear(), view.getMonth(), day));
    }
  }

  function renderTimes() {
    timesHead.textContent = selected ? pretty(selected) : 'Pick a day to see times';
    timeList.textContent = '';
    SHOW_TIMES.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'time';
      b.textContent = t;
      b.disabled = !selected || TIMES.indexOf(t) === -1;
      if (selectedTime === t) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
      b.addEventListener('click', function () { selectedTime = t; sync(); });
      timeList.appendChild(b);
    });
  }

  function sync() {
    dateField.value = selected ? iso(selected) : '';
    timeField.value = selected ? selectedTime : '';
    message.className = 'sched-msg';
    message.textContent = selected && selectedTime ? 'Selected: ' + pretty(selected) + ' at ' + selectedTime : '';
    renderCalendar();
    renderTimes();
  }

  function choose(date) {
    selected = date;
    selectedTime = TIMES.length === 1 ? TIMES[0] : '';   // only one time? pick it for them
    sync();
  }

  prev.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCalendar(); });
  next.addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCalendar(); });

  // Don't let the form go through without a day and time
  var form = grid.closest('form');
  if (form) {
    form.addEventListener('submit', function (e) {
      if (!dateField.value || !timeField.value) {
        e.preventDefault();
        message.className = 'sched-msg error';
        message.textContent = 'Please pick a day and a time.';
        document.getElementById('sched').scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  renderCalendar();
  renderTimes();
})();
