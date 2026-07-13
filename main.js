/* ============================================================
   WINSTAR — shared animation engine
   Scroll reveals · counters · parallax · header state ·
   scroll progress · hero word-split
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll progress bar ---------- */
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);

  /* ---------- header scrolled state ---------- */
  var header = document.querySelector('header');

  /* ---------- parallax targets ---------- */
  var parallaxEls = [].slice.call(
    document.querySelectorAll('[data-parallax], .hero-bg, .page-banner-bg')
  );

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;

      // progress
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';

      // header
      if (header) header.classList.toggle('scrolled', y > 40);

      // parallax
      if (!reduced) {
        parallaxEls.forEach(function (el) {
          var host = el.parentElement;
          var r = host.getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          var speed = parseFloat(el.getAttribute('data-parallax')) || 0.25;
          var offset = (r.top + r.height / 2 - window.innerHeight / 2) * -speed;
          el.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
        });
      }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- scroll reveals ---------- */
  var revealEls = [].slice.call(
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, [data-reveal]')
  );

  // stagger groups: children get incremental delays
  [].slice.call(document.querySelectorAll('[data-reveal-stagger]')).forEach(function (group) {
    var step = parseFloat(group.getAttribute('data-reveal-stagger')) || 0.08;
    [].slice.call(group.children).forEach(function (child, i) {
      if (!child.hasAttribute('data-reveal') && !child.classList.contains('reveal')) {
        child.setAttribute('data-reveal', '');
      }
      child.style.setProperty('--d', (i * step).toFixed(2) + 's');
      if (revealEls.indexOf(child) === -1) revealEls.push(child);
    });
  });

  if (reduced) {
    revealEls.forEach(function (el) { el.classList.add('in', 'visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in', 'visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- count-up numbers ---------- */
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));
  if (counters.length) {
    var fmt = function (n) { return n.toLocaleString('en-US'); };
    var runCounter = function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var dur = parseFloat(el.getAttribute('data-count-duration')) || 1800;
      var start = null;
      var from = 0;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(from + (target - from) * eased));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    if (reduced) {
      counters.forEach(function (el) { el.textContent = fmt(parseFloat(el.getAttribute('data-count'))); });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            cio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---------- hero word-split ---------- */
  [].slice.call(document.querySelectorAll('[data-split]')).forEach(function (el) {
    if (reduced) return;
    var delayStep = 0.075;
    var base = parseFloat(el.getAttribute('data-split-delay')) || 0.1;
    var wordIndex = 0;

    function splitNode(node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            var w = document.createElement('span');
            w.className = 'w';
            var inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--wd', (base + wordIndex * delayStep).toFixed(2) + 's');
            w.appendChild(inner);
            frag.appendChild(w);
            wordIndex++;
          }
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'SPAN') {
        [].slice.call(node.childNodes).forEach(splitNode);
      } else if (node.nodeType === 1) {
        [].slice.call(node.childNodes).forEach(splitNode);
      }
    }
    [].slice.call(el.childNodes).forEach(splitNode);
  });
})();


/* ============================================================
   GLASS FX — glare / cut reveals / tilt
   ============================================================ */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* hero shine span */
  var heroTitle = document.querySelector('.hero-title');
  if (heroTitle && !reduced) {
    var shine = document.createElement('span');
    shine.className = 'shine';
    shine.setAttribute('aria-hidden', 'true');
    heroTitle.appendChild(shine);
  }

  /* targets */
  var cards = [].slice.call(document.querySelectorAll('.showcase-card'));
  var glareEls = cards.concat(
    [].slice.call(document.querySelectorAll('.service-tile, .teaser-card, .thumb-card, .quote-form'))
  );

  /* 1) cursor glare */
  if (finePointer && !reduced) {
    glareEls.forEach(function (el) {
      el.classList.add('fx-glare');
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* 2) glass-cut reveals: tag elements; the main reveal observer adds .in */
  try {
    var cutEls = cards.concat([].slice.call(document.querySelectorAll('.gallery-thumb, .thumb-card')));
    var supportsClip = window.CSS && CSS.supports && CSS.supports('clip-path', 'polygon(0 0, 0 0, 0 0)');
    if (!reduced && supportsClip && cutEls.length) {
      cutEls.forEach(function (el, i) {
        el.classList.add('cut-reveal');
        if (!el.style.getPropertyValue('--d')) {
          el.style.setProperty('--d', ((i % 4) * 0.1).toFixed(2) + 's');
        }
      });
      // safety net: reveal anything still pending
      setTimeout(function () {
        cutEls.forEach(function (el) { el.classList.add('in'); });
      }, 1200);
    }
  } catch (err) {}

  /* 3) 3D tilt on showcase cards */
  if (finePointer && !reduced) {
    var MAX = 5; // degrees
    cards.forEach(function (el) {
      el.classList.add('fx-tilt');
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('tilting');
        el.style.transform = 'perspective(900px) rotateX(' + (-py * MAX).toFixed(2) +
                             'deg) rotateY(' + (px * MAX).toFixed(2) + 'deg) scale(1.015)';
      });
      el.addEventListener('mouseleave', function () {
        el.classList.remove('tilting');
        el.style.transform = '';
      });
    });
  }
})();
