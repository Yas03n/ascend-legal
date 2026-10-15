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
    // every screen is there twice (dark + light app captures): order the unique names
    var order = pics.map(function (p) { return p.getAttribute('data-screen'); }).filter(function (n, i, a) { return a.indexOf(n) === i; });
    var current = 0, timer = null, visible = true, userPicked = false;
    var show = function (i) {
      current = (i + order.length) % order.length;
      pics.forEach(function (p) { p.classList.toggle('is-on', p.getAttribute('data-screen') === order[current]); });
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

  /* ── Light / dark toggle with the "sunrise" reveal (founder, 2026-10-14) ──
     The new theme grows as a circle from the toggle (top right) until it
     covers the far bottom-left corner — slow (1.5 s) and eased, never a
     blink. View Transitions draw it in Chrome/Edge/Safari 18+; older browsers
     get the same circle as an overlay of the new ground; reduced motion
     switches instantly. The <head> script already set the starting theme. */
  var root = document.documentElement;
  var toggle = document.querySelector('.theme-toggle');
  var meta = document.querySelector('meta[name="theme-color"]');
  var SWEEP_MS = 1500, SWEEP_EASE = 'cubic-bezier(.65,0,.35,1)';
  var GROUND = { light: '#f5f5f7', dark: '#06070b' };
  var busy = false;
  var currentTheme = function () { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; };
  var reflect = function () {
    var dark = currentTheme() === 'dark';
    if (toggle) {
      toggle.setAttribute('aria-checked', String(dark));
      toggle.setAttribute('aria-label', 'Dark mode');
    }
    if (meta) meta.setAttribute('content', GROUND[currentTheme()]);
  };
  var apply = function (t) {
    root.setAttribute('data-theme', t);
    try { localStorage.setItem('ascend-theme', t); } catch (e) { /* private mode: this visit only */ }
    reflect();
  };
  /* where the circle starts (the toggle's centre) and how big it must grow
     to reach the farthest corner of the screen */
  var origin = function () {
    var r = toggle.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    return { x: x, y: y, r: Math.ceil(radius) };
  };
  /* The phones show the app in the page's theme. Before the reveal starts,
     make sure the other theme's screens that are on screen are fetched and
     decoded, so the phones inside the growing circle are already switched.
     Reaching for the toggle (hover / focus / touch) starts the fetch early. */
  var shotsFor = function (t) { return Array.prototype.slice.call(document.querySelectorAll('.shot-' + t + ' img')); };
  var warm = function (t) {
    shotsFor(t).forEach(function (img) { if (img.loading === 'lazy') img.loading = 'eager'; });
  };
  var readyOnScreen = function (t) {
    var vh = innerHeight;
    var visible = shotsFor(t).filter(function (img) {
      var r = img.closest('.iphone').getBoundingClientRect();
      return r.bottom > -vh * 0.25 && r.top < vh * 1.25;
    });
    var decoded = Promise.all(visible.map(function (img) {
      if (img.loading === 'lazy') img.loading = 'eager';
      return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
    }));
    return Promise.race([decoded, new Promise(function (r) { setTimeout(r, 700); })]);
  };
  var switchTheme = function () {
    if (busy) return;
    busy = true;
    var target = currentTheme() === 'dark' ? 'light' : 'dark';
    readyOnScreen(target).then(function () { busy = false; runSwitch(); });
  };
  var runSwitch = function () {
    if (busy) return;
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (reduce) { apply(next); return; }
    var o = origin();
    var from = 'circle(0px at ' + o.x + 'px ' + o.y + 'px)';
    var to = 'circle(' + o.r + 'px at ' + o.x + 'px ' + o.y + 'px)';
    busy = true;
    root.classList.add('theme-swapping');
    var done = function () { busy = false; root.classList.remove('theme-swapping'); };
    if (document.startViewTransition) {
      var vt = document.startViewTransition(function () { apply(next); });
      vt.ready.then(function () {
        root.animate({ clipPath: [from, to] }, { duration: SWEEP_MS, easing: SWEEP_EASE, pseudoElement: '::view-transition-new(root)' });
      }).catch(done);
      vt.finished.then(done, done);
      return;
    }
    // Fallback: grow a circle of the new ground over the page, swap the theme
    // underneath once it covers everything, then let the circle melt away.
    var sweep = document.createElement('div');
    sweep.className = 'theme-sweep';
    sweep.style.background = GROUND[next];
    sweep.style.clipPath = sweep.style.webkitClipPath = from;
    document.body.appendChild(sweep);
    var grow = sweep.animate
      ? sweep.animate({ clipPath: [from, to] }, { duration: SWEEP_MS, easing: SWEEP_EASE, fill: 'forwards' })
      : null;
    var finish = function () {
      apply(next);
      sweep.style.transition = 'opacity .35s ease';
      requestAnimationFrame(function () { sweep.style.opacity = '0'; });
      setTimeout(function () { sweep.remove(); done(); }, 400);
    };
    if (grow) grow.onfinish = finish; else setTimeout(finish, 10);
  };
  if (toggle) {
    reflect();
    toggle.addEventListener('click', switchTheme);   // <button>: Enter and Space work too
    var warmOther = function () { warm(currentTheme() === 'dark' ? 'light' : 'dark'); };
    ['pointerenter', 'focus', 'touchstart'].forEach(function (ev) { toggle.addEventListener(ev, warmOther, { passive: true }); });
  }
  // Follow the device while the visitor has not picked a theme themselves.
  try {
    var saved = localStorage.getItem('ascend-theme');
    if (!saved && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
        var stillUnset = true;
        try { stillUnset = !localStorage.getItem('ascend-theme'); } catch (err) {}
        if (stillUnset) { root.setAttribute('data-theme', e.matches ? 'light' : 'dark'); reflect(); }
      });
    }
  } catch (e) { /* storage blocked: the head script's choice stands */ }

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
