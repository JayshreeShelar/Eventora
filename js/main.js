/* EVENTORA — shared UI behaviour. Exposes window.Eventora for components.js */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = document.querySelectorAll('[data-reveal]:not([data-reveal-ready])');
    if (!items.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.setAttribute('data-reveal-ready', ''); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    items.forEach(function (el) {
      el.setAttribute('data-reveal-ready', '');
      el.classList.add('reveal');
      observer.observe(el);
    });
  }

  /* ---------- Smooth scrolling for in-page links (delegated, works for injected links) ---------- */
  function initSmoothScroll() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      var hash = link.getAttribute('href');
      if (hash.length < 2) return;
      var target = document.getElementById(hash.slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      if (history.pushState) history.pushState(null, '', hash);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  /* ---------- Header (runs after components/header.html is injected) ---------- */
  function initHeader() {
    var header = document.querySelector('.site-header');
    if (!header) return;

    // Active navigation
    var page = document.body.getAttribute('data-page') || 'index';
    header.querySelectorAll('[data-nav]').forEach(function (link) {
      var active = link.getAttribute('data-nav') === page;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    // Fixed header: turns solid after scrolling + thin progress line
    var bar = document.createElement('span');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    header.appendChild(bar);
    function onScroll() {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? Math.min(100, window.scrollY / max * 100) : 0) + '%';
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    // Mobile menu
    var toggle = header.querySelector('#menu-toggle');
    var menu = header.querySelector('#mobile-menu');
    if (!toggle || !menu) return;

    function setMenu(open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
      header.classList.toggle('is-menu-open', open);
    }
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1280px)').addEventListener('change', function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ---------- Footer (runs after components/footer.html is injected) ---------- */
  function initFooter() {
    document.querySelectorAll('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------- Home hero slider (3 banners) ---------- */
  function initSlider() {
    var root = document.querySelector('[data-slider]');
    if (!root) return;
    var slides = Array.prototype.slice.call(root.querySelectorAll('.slide'));
    var dots = Array.prototype.slice.call(root.querySelectorAll('.hero-dot'));
    var DELAY = 7000, current = 0, timer = null;
    root.style.setProperty('--slide-ms', DELAY + 'ms');

    function go(n) {
      current = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        s.classList.toggle('is-active', i === current);
        s.setAttribute('aria-hidden', String(i !== current));
      });
      dots.forEach(function (d, i) {
        d.classList.remove('is-active', 'is-done');
        d.removeAttribute('aria-current');
        if (i < current) d.classList.add('is-done');
      });
      void root.offsetWidth; // restart the progress animation
      dots[current].classList.add('is-active');
      dots[current].setAttribute('aria-current', 'true');
    }
    function start() { if (reduceMotion) return; stop(); timer = window.setInterval(function () { go(current + 1); }, DELAY); }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

    root.querySelector('.hero-ctrl--prev').addEventListener('click', function () { go(current - 1); start(); });
    root.querySelector('.hero-ctrl--next').addEventListener('click', function () { go(current + 1); start(); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); start(); }); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { go(dx < 0 ? current + 1 : current - 1); start(); }
      x0 = null;
    }, { passive: true });

    go(0); start();
  }

  /* ---------- Back-to-top button ---------- */
  function initToTop() {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
    document.body.appendChild(btn);
    btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
    window.addEventListener('scroll', function () { btn.classList.toggle('is-shown', window.scrollY > 700); }, { passive: true });
  }

  window.Eventora = { initHeader: initHeader, initFooter: initFooter };

  document.addEventListener('DOMContentLoaded', function () {
    initSlider();
    initToTop();
    initReveal();
    initSmoothScroll();
    initFooter();
  });
})();
