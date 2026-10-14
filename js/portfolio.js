/* EVENTORA — portfolio filtering + lightbox */
(function () {
  'use strict';

  var filterButtons = document.querySelectorAll('.filter-btn');
  var items = Array.prototype.slice.call(document.querySelectorAll('.masonry-item'));
  var emptyMessage = document.getElementById('portfolio-empty');
  var FADE_MS = 380;
  if (!filterButtons.length || !items.length) return;

  /* ---------- Filtering ---------- */
  function applyFilter(category) {
    var shown = 0;
    items.forEach(function (item) {
      var match = category === 'all' || item.getAttribute('data-category') === category;
      window.clearTimeout(item._timer);

      if (match) {
        shown += 1;
        if (item.hidden) {
          item.hidden = false;
          item.classList.add('is-filtered-out');
          void item.offsetWidth; // force reflow so the transition runs
        }
        item.classList.remove('is-filtered-out');
      } else {
        item.classList.add('is-filtered-out');
        item._timer = window.setTimeout(function () { item.hidden = true; }, FADE_MS);
      }
    });
    if (emptyMessage) emptyMessage.hidden = shown !== 0;
  }

  filterButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      filterButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === button)); });
      applyFilter(button.getAttribute('data-filter'));
    });
  });

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  var lbImg = document.getElementById('lightbox-img');
  var lbTitle = document.getElementById('lightbox-title');
  var lbCategory = document.getElementById('lightbox-category');
  var lbCount = document.getElementById('lightbox-count');
  var btnClose = document.getElementById('lightbox-close');
  var btnPrev = document.getElementById('lightbox-prev');
  var btnNext = document.getElementById('lightbox-next');
  var current = 0;
  var lastFocus = null;
  var touchStartX = null;

  function visibleItems() {
    return items.filter(function (item) { return !item.hidden && !item.classList.contains('is-filtered-out'); });
  }

  function show(list, index) {
    current = (index + list.length) % list.length;
    var item = list[current];
    var source = item.querySelector('.portfolio-btn');
    var thumb = item.querySelector('img');
    lbImg.src = source.getAttribute('data-full') || thumb.src;
    lbImg.alt = thumb.alt;
    lbTitle.textContent = source.getAttribute('data-title');
    lbCategory.textContent = source.getAttribute('data-label');
    lbCount.textContent = (current + 1) + ' / ' + list.length;
    var multiple = list.length > 1;
    btnPrev.hidden = !multiple;
    btnNext.hidden = !multiple;
  }

  function open(item) {
    var list = visibleItems();
    var index = list.indexOf(item);
    if (index < 0) return;
    lastFocus = document.activeElement;
    show(list, index);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    window.requestAnimationFrame(function () { lightbox.classList.add('is-visible'); });
    btnClose.focus();
  }

  function close() {
    lightbox.classList.remove('is-visible');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    window.setTimeout(function () {
      lightbox.classList.remove('is-open');
      lbImg.removeAttribute('src');
    }, 300);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function step(direction) {
    var list = visibleItems();
    if (list.length < 2) return;
    show(list, current + direction);
  }

  items.forEach(function (item) {
    item.querySelector('.portfolio-btn').addEventListener('click', function () { open(item); });
  });
  btnClose.addEventListener('click', close);
  btnPrev.addEventListener('click', function () { step(-1); });
  btnNext.addEventListener('click', function () { step(1); });
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'Tab') { // keep focus inside the dialog
      var focusable = [btnClose, btnPrev, btnNext].filter(function (b) { return !b.hidden; });
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  lightbox.addEventListener('touchstart', function (e) { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (touchStartX === null) return;
    var delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) step(delta < 0 ? 1 : -1);
    touchStartX = null;
  }, { passive: true });
})();
