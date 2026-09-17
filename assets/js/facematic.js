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
  var grev = document.querySelector('[data-grev]');
  if (grev) {
    var gTrack = grev.querySelector('.grev-track');
    var gPrev = grev.querySelector('[data-grev-prev]');
    var gNext = grev.querySelector('[data-grev-next]');
    var gPaused = false;
    var gStep = function () {
      var c = gTrack.querySelector('.grev');
      var gap = parseFloat(getComputedStyle(gTrack).columnGap) || 0;
      return c ? c.getBoundingClientRect().width + gap : gTrack.clientWidth;
    };
    var gUpdate = function () {
      var over = gTrack.scrollWidth > gTrack.clientWidth + 2;
      grev.classList.toggle('no-overflow', !over);
      if (gPrev) gPrev.disabled = gTrack.scrollLeft <= 2;
      if (gNext) gNext.disabled = gTrack.scrollLeft + gTrack.clientWidth >= gTrack.scrollWidth - 2;
    };
    if (gPrev) gPrev.addEventListener('click', function () { gTrack.scrollBy({ left: -gStep(), behavior: 'smooth' }); });
    if (gNext) gNext.addEventListener('click', function () { gTrack.scrollBy({ left: gStep(), behavior: 'smooth' }); });
    gTrack.addEventListener('scroll', gUpdate, { passive: true });
    window.addEventListener('resize', gUpdate);
    gUpdate();

    ['mouseenter', 'focusin', 'touchstart'].forEach(function (ev) {
      grev.addEventListener(ev, function () { gPaused = true; }, { passive: true });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      grev.addEventListener(ev, function () { gPaused = false; });
    });
    var gReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!gReduce) {
      setInterval(function () {
        if (gPaused || document.hidden || gTrack.scrollWidth <= gTrack.clientWidth + 2) return;
        if (gTrack.scrollLeft + gTrack.clientWidth >= gTrack.scrollWidth - 2) {
          gTrack.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          gTrack.scrollBy({ left: gStep(), behavior: 'smooth' });
        }
      }, 6000);
    }
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
      lbList = Array.prototype.filter.call(document.querySelectorAll('.ba-open'), function (x) {
        return !x.closest('.ba-tile').hidden;
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
