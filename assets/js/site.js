/* Ascend site behaviour (redesign 2026-10-14). Vanilla, no dependencies.
   Why it is this small: the page is static and must stay fast. Every effect
   checks prefers-reduced-motion and the page reads fine with JS off (the
   .reveal fade only exists once the inline <script> adds the "js" class). */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ── Nav hairline once the page scrolls ──────────────────────────────── */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Reveal on scroll ────────────────────────────────────────────────── */
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ── Hero phone: auto-advancing screens + the buttons under it ───────────
     Advances every 4.5 s while the hero is on screen and the tab is visible.
     Reduced motion: no auto-advance, the buttons still switch instantly.
     Once someone picks a screen themselves, the auto-advance stops for good —
     the page should never take the choice back from them. */
  var screen = document.getElementById('hero-screen');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.glass-toggle [data-show]'));
  if (screen && buttons.length) {
    var pics = Array.prototype.slice.call(screen.querySelectorAll('picture[data-screen]'));
    var order = pics.map(function (p) { return p.getAttribute('data-screen'); });
    var current = 0, timer = null, visible = true, userPicked = false;
    var show = function (i) {
      current = (i + order.length) % order.length;
      pics.forEach(function (p, j) { p.classList.toggle('is-on', j === current); });
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-show') === order[current])); });
    };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var start = function () {
      stop();
      if (reduce || userPicked || !visible || document.hidden) return;
      timer = setInterval(function () { show(current + 1); }, 4500);
    };
    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        userPicked = true; stop();
        show(order.indexOf(b.getAttribute('data-show')));
      });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting; start();
      }, { threshold: 0.25 }).observe(screen);
    }
    document.addEventListener('visibilitychange', start);
    start();
  }

  /* ── Gentle tilt on the hero phone (mouse/trackpad only) ─────────────── */
  if (!reduce && finePointer) {
    document.querySelectorAll('[data-tilt]').forEach(function (phone) {
      var area = phone.parentElement, raf = null, rx = 0, ry = 0, MAX = 6;
      var apply = function () { phone.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)'; raf = null; };
      area.addEventListener('pointermove', function (e) {
        var r = area.getBoundingClientRect();
        rx = -((e.clientY - r.top) / r.height - 0.5) * MAX;
        ry = ((e.clientX - r.left) / r.width - 0.5) * MAX;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      area.addEventListener('pointerleave', function () { rx = 0; ry = 0; if (!raf) raf = requestAnimationFrame(apply); });
    });
  }

  /* ── Footer year ─────────────────────────────────────────────────────── */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();

/* ── Social + App Store links from the single config in social.js ───────── */
(function () {
  var cfg = window.ASCEND_SOCIAL || {};
  document.querySelectorAll('[data-social]').forEach(function (a) {
    var url = cfg[a.getAttribute('data-social')];
    if (url) { a.setAttribute('href', url); a.removeAttribute('data-missing'); a.hidden = false; }
    else { a.hidden = true; a.setAttribute('data-missing', ''); }
  });
  if (window.ASCEND_APP_STORE_URL) {
    document.querySelectorAll('[data-store]').forEach(function (a) { a.setAttribute('href', window.ASCEND_APP_STORE_URL); });
  }
})();
