/* FACEMATIC — interactions */
(function () {
  'use strict';

  /* Sticky header */
  var hdr = document.querySelector('.hdr');
  function onScroll() {
    if (!hdr) return;
    hdr.classList.toggle('on', window.scrollY > 40);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Mobile menu */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { document.body.classList.remove('menu-open'); });
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.body.classList.remove('menu-open');
  });

  /* Scroll reveal */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* Treatment filters (treatments page) */
  var pills = document.querySelectorAll('[data-filter]');
  if (pills.length) {
    pills.forEach(function (p) {
      p.addEventListener('click', function () {
        var key = p.getAttribute('data-filter');
        pills.forEach(function (o) { o.classList.toggle('active', o === p); });
        document.querySelectorAll('[data-group]').forEach(function (g) {
          g.style.display = (key === 'all' || g.getAttribute('data-group') === key) ? '' : 'none';
        });
      });
    });
  }

  /* Count-up stats */
  var nums = document.querySelectorAll('[data-count]');
  if (nums.length && 'IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target,
            end = parseFloat(el.getAttribute('data-count')),
            dec = (el.getAttribute('data-dec') === '1'),
            suf = el.getAttribute('data-suffix') || '',
            t0 = null, dur = 1400;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1),
              e = 1 - Math.pow(1 - p, 3),
              v = end * e;
          el.textContent = (dec ? v.toFixed(1) : Math.round(v)) + suf;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io2.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(function (n) { io2.observe(n); });
  }

  /* Booking form — sends the request to the clinic on WhatsApp */
  var form = document.querySelector('[data-wa-form]');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = function (n) { var el = form.elements[n]; return el ? el.value.trim() : ''; };
      var out = form.querySelector('[data-form-msg]');
      var say = function (t) { if (out) { out.textContent = t; out.style.display = 'block'; } };
      var name = val('name'), phone = val('phone');
      if (!name || !phone) {
        say('Please add your name and phone number so we can reach you.');
        (name ? form.elements.phone : form.elements.name).focus();
        return;
      }
      var lines = ['Hi Facematic, I would like to book a consultation.', '', 'Name: ' + name, 'Phone: ' + phone];
      if (val('email')) lines.push('Email: ' + val('email'));
      if (val('service')) lines.push('About: ' + val('service'));
      if (val('date')) lines.push('Preferred day: ' + val('date'));
      if (val('message')) lines.push('', val('message'));
      var number = form.getAttribute('data-wa-form') || '919163707021';
      say('Opening WhatsApp with your details filled in. Just press send.');
      window.open('https://wa.me/' + number + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  }

  /* Temporary festive offer — removes itself after data-offer-ends (YYYY-MM-DD) */
  document.querySelectorAll('[data-offer-ends]').forEach(function (el) {
    var end = new Date(el.getAttribute('data-offer-ends') + 'T23:59:59');
    if (!isNaN(end.getTime()) && new Date() > end) el.parentNode.removeChild(el);
  });

  /* Google review carousel — arrows, swipe, gentle autoplay */
  /* Google reviews — auto-scrolling marquee: tap to pause, swipe to browse */
  var gm = document.querySelector('[data-grevmarq]');
  if (gm) {
    var gTrack = gm.querySelector('.grev-track');
    var gCards = gTrack.querySelectorAll('.grev');
    var gReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var gHold = false;      /* pointer down or hovering */
    var gStopped = false;   /* user tapped to stop */
    var gExpect = 0;        /* scrollLeft we last set ourselves */
    var gIdle = null;
    var SPEED = 0.03;       /* px per ms */

    var gLoopWidth = function () {
      var first = gCards[7];                       /* start of the second copy */
      return first ? first.offsetLeft : gTrack.scrollWidth / 3;
    };
    var gSet = function (v) { gExpect = v; gm.scrollLeft = v; };

    /* open on the middle copy, so a backwards swipe has somewhere to go */
    var gStart = function () {
      var loop = gLoopWidth();
      if (loop) gSet(loop);
      else setTimeout(gStart, 120);
    };
    gStart();
    window.addEventListener('resize', function () {
      var loop = gLoopWidth();
      if (loop && (gm.scrollLeft < loop * 0.5 || gm.scrollLeft > loop * 1.5)) gSet(loop);
    });

    var gLast = null, gAcc = 0;
    var gTick = function (ts) {
      if (gLast === null) gLast = ts;
      var dt = Math.min(ts - gLast, 64);
      gLast = ts;
      var loop = gLoopWidth();
      if (!gHold && !gStopped && !gReduce && !document.hidden && loop) {
        gAcc += dt * SPEED;
        var px = Math.floor(gAcc);
        if (px > 0) { gAcc -= px; gSet(gm.scrollLeft + px); }
      }
      /* keep the viewport inside the middle copy so it can wrap either way */
      if (loop) {
        if (gm.scrollLeft > loop * 1.5) gSet(gm.scrollLeft - loop);
        else if (gm.scrollLeft < loop * 0.5) gSet(gm.scrollLeft + loop);
      }
      requestAnimationFrame(gTick);
    };
    requestAnimationFrame(gTick);

    ['mouseenter', 'focusin'].forEach(function (ev) {
      gm.addEventListener(ev, function () { gHold = true; });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      gm.addEventListener(ev, function () { gHold = false; });
    });

    var gDownX = 0, gDownY = 0, gDownT = 0;
    gm.addEventListener('pointerdown', function (e) {
      gHold = true;
      gm.classList.add('is-held');
      gDownX = e.clientX; gDownY = e.clientY; gDownT = Date.now();
    }, { passive: true });
    var gUp = function (e) {
      gm.classList.remove('is-held');
      var moved = Math.abs(e.clientX - gDownX) + Math.abs(e.clientY - gDownY);
      if (moved < 10 && Date.now() - gDownT < 600) gStopped = !gStopped;
      if (e.pointerType === 'mouse') {
        gHold = gm.matches(':hover');
      } else {
        /* after a swipe, let it settle before it drifts on again */
        gHold = true;
        clearTimeout(gIdle);
        gIdle = setTimeout(function () { gHold = false; }, 1400);
      }
    };
    gm.addEventListener('pointerup', gUp, { passive: true });
    gm.addEventListener('pointercancel', function () {
      gm.classList.remove('is-held');
      gHold = false;
    }, { passive: true });

    /* a swipe or wheel pauses briefly, then it drifts on again */
    gm.addEventListener('scroll', function () {
      if (Math.abs(gm.scrollLeft - gExpect) <= 2) return;   /* our own scroll */
      gHold = true;
      clearTimeout(gIdle);
      gIdle = setTimeout(function () { gHold = false; }, 1600);
    }, { passive: true });
  }

  /* Before / after results — category filter + lightbox */
  var baFilters = document.querySelectorAll('[data-ba-filter]');
  baFilters.forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-ba-filter');
      baFilters.forEach(function (o) { o.classList.toggle('active', o === b); });
      document.querySelectorAll('.ba-tile').forEach(function (t) {
        t.hidden = !(k === 'all' || t.getAttribute('data-cat') === k);
      });
    });
  });

  var lb = document.querySelector('[data-lb]');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lb-cap');
    var lbList = [], lbIdx = 0, lbLast = null;
    var lbShow = function (i) {
      lbIdx = (i + lbList.length) % lbList.length;
      var b = lbList[lbIdx];
      lbImg.src = b.getAttribute('data-full');
      lbImg.alt = b.querySelector('img').alt;
      lbCap.textContent = b.getAttribute('data-caption') || '';
    };
    var lbClose = function () {
      if (lb.hidden) return;
      lb.hidden = true;
      lbImg.removeAttribute('src');
      document.body.style.overflow = '';
      if (lbLast) lbLast.focus();
    };
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.ba-open');
      if (!b) return;
      var grp = b.closest('[data-lb-group]') || document;
      lbList = Array.prototype.filter.call(grp.querySelectorAll('.ba-open'), function (x) {
        var t = x.closest('.ba-tile');
        return !t || !t.hidden;
      });
      lbLast = b;
      lbShow(lbList.indexOf(b));
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    });
    lb.addEventListener('click', function (e) {
      if (e.target.closest('.lb-prev')) { lbShow(lbIdx - 1); return; }
      if (e.target.closest('.lb-next')) { lbShow(lbIdx + 1); return; }
      if (e.target === lb || e.target.closest('.lb-close')) lbClose();
    });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') lbClose();
      else if (e.key === 'ArrowLeft') lbShow(lbIdx - 1);
      else if (e.key === 'ArrowRight') lbShow(lbIdx + 1);
    });
  }

  /* Video testimonials — seamless marquee + player */
  var vm = document.querySelector('[data-vmarq]');
  var modal = document.querySelector('[data-vmodal]');
  if (vm) {
    var track = vm.querySelector('.vtrack');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      Array.prototype.slice.call(track.children).forEach(function (c) {
        var k = c.cloneNode(true);
        k.setAttribute('aria-hidden', 'true');
        k.tabIndex = -1;
        track.appendChild(k);
      });
    }

    var stage = modal && modal.querySelector('.vmodal-stage');
    var lastCard = null;

    var closeVideo = function () {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      stage.innerHTML = '';
      vm.classList.remove('paused');
      document.body.style.overflow = '';
      if (lastCard) lastCard.focus();
    };

    track.addEventListener('click', function (e) {
      var card = e.target.closest('.vcard');
      if (!card || !modal) return;
      lastCard = card;
      var src = card.getAttribute('data-video');
      var title = card.getAttribute('data-title') || '';
      stage.innerHTML = '';
      if (src) {
        var v = document.createElement('video');
        v.src = src;
        v.controls = true;
        v.autoplay = true;
        v.playsInline = true;
        stage.appendChild(v);
      } else {
        stage.innerHTML =
          '<div class="vmodal-empty"><img src="assets/img/mark-gold.png" alt="">' +
          '<p class="vmodal-t"></p>' +
          '<p class="vmodal-s">This patient video will play here once the clinic’s testimonial videos are added.</p></div>';
        stage.querySelector('.vmodal-t').textContent = title;
      }
      modal.hidden = false;
      vm.classList.add('paused');
      document.body.style.overflow = 'hidden';
      var btn = modal.querySelector('.vmodal-close');
      if (btn) btn.focus();
    });

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal || e.target.closest('.vmodal-close')) closeVideo();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeVideo();
      });
    }
  }
})();
