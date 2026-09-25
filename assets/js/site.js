/* Ascend site motion + nav. Vanilla, no dependencies; every effect checks
   prefers-reduced-motion and degrades to static content. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;
  if (reduce) root.classList.add('no-motion');

  /* ── Sticky nav: solid after the hero starts scrolling ───────────────── */
  var nav = document.querySelector('.nav');
  var onScrollNav = function () { nav.classList.toggle('is-scrolled', window.scrollY > 24); };
  onScrollNav(); window.addEventListener('scroll', onScrollNav, { passive: true });

  /* ── Mobile menu ─────────────────────────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.querySelector('.mobile-menu');
  var setMenu = function (open) {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      menu.querySelectorAll('a').forEach(function (a, i) { a.style.transitionDelay = (60 + i * 45) + 'ms'; });
    }
  };
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ── Active section link ─────────────────────────────────────────────── */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var active = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { active.observe(s); });
  }

  /* ── Scroll reveals (staggered via --d) ──────────────────────────────── */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ── Parallax on glows (scroll-linked, rAF-throttled) ────────────────── */
  var parallax = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  if (!reduce && parallax.length) {
    var ticking = false;
    var render = function () {
      var y = window.scrollY;
      parallax.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
        var rect = el.getBoundingClientRect();
        var center = rect.top + rect.height / 2 - window.innerHeight / 2;
        el.style.transform = 'translate3d(0,' + (-center * speed).toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(render); } }, { passive: true });
    render();
    void y;
  }

  /* ── 3D tilt on phones/cards (pointer only) ──────────────────────────── */
  if (!reduce && finePointer) {
    document.querySelectorAll('.tilt').forEach(function (el) {
      var target = el.querySelector('.tilt-target') || el;
      var max = parseFloat(el.getAttribute('data-tilt-max')) || 8;
      var raf = null, rx = 0, ry = 0;
      var apply = function () { target.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)'; raf = null; };
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        rx = -py * max; ry = px * max;
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener('pointerleave', function () { rx = 0; ry = 0; if (!raf) raf = requestAnimationFrame(apply); });
    });
  }

  /* ── Magnetic pull on primary buttons (subtle) ───────────────────────── */
  if (!reduce && finePointer) {
    document.querySelectorAll('.btn-primary').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        b.style.transform = 'translate(' + (dx * 6).toFixed(1) + 'px,' + (dy * 6 - 2).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ── Adaptive triggers: hovering a trigger swaps the phone screen ───── */
  var triggers = document.querySelectorAll('.trigger[data-screen]');
  var adaptiveImg = document.querySelector('#adaptive-screen');
  if (triggers.length && adaptiveImg) {
    var swap = function (t) {
      var src = t.getAttribute('data-screen');
      if (!src || adaptiveImg.getAttribute('data-current') === src) return;
      adaptiveImg.setAttribute('data-current', src);
      var sources = adaptiveImg.querySelectorAll('source');
      sources.forEach(function (s) { s.setAttribute('srcset', src + '.webp'); });
      var img = adaptiveImg.querySelector('img');
      if (!reduce) { img.style.opacity = '0'; setTimeout(function () { img.src = src + '.png'; img.style.opacity = '1'; }, 160); }
      else { img.src = src + '.png'; }
      triggers.forEach(function (x) { x.classList.toggle('is-current', x === t); });
    };
    triggers.forEach(function (t) {
      t.addEventListener('mouseenter', function () { swap(t); });
      t.addEventListener('focus', function () { swap(t); });
      t.addEventListener('click', function () { swap(t); });
    });
  }

  /* ── Footer year ─────────────────────────────────────────────────────── */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();

/* ── Social links from the single config in social.js ───────────────────── */
(function () {
  var cfg = window.ASCEND_SOCIAL || {};
  document.querySelectorAll('[data-social]').forEach(function (a) {
    var key = a.getAttribute('data-social');
    var url = cfg[key];
    if (url) { a.setAttribute('href', url); a.removeAttribute('data-missing'); a.hidden = false; }
    else { a.hidden = true; a.setAttribute('data-missing', ''); }
  });
})();
