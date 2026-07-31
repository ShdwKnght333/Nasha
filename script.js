/**
 * Quest Log — interaction layer.
 * Static image QR codes remain embedded directly in index.html.
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ print */
function initPrintButtons() {
  document.querySelectorAll('[data-action="print"]').forEach((btn) => {
    btn.addEventListener('click', () => window.print());
  });
}

/* ---------------------------------------------------------- smooth scroll */
function initScrollTo() {
  document.querySelectorAll('[data-action="scroll-to"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: REDUCED_MOTION ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });
}

/* -------------------------------------------------------------- countdown */
function initCountdown() {
  const root = document.getElementById('hero-countdown');
  if (!root) return;

  const target = new Date(root.dataset.target).getTime();
  if (Number.isNaN(target)) return;

  const fields = {};
  root.querySelectorAll('[data-unit]').forEach((el) => {
    fields[el.dataset.unit] = el;
  });
  const label = root.querySelector('.countdown__label');
  const pad = (n) => String(n).padStart(2, '0');

  const tick = () => {
    const remaining = target - Date.now();

    if (remaining <= 0) {
      root.classList.add('is-begun');
      label.textContent = 'The quest has begun!';
      return false;
    }

    const seconds = Math.floor(remaining / 1000);
    fields.days.textContent = pad(Math.floor(seconds / 86400));
    fields.hours.textContent = pad(Math.floor(seconds / 3600) % 24);
    fields.minutes.textContent = pad(Math.floor(seconds / 60) % 60);
    fields.seconds.textContent = pad(seconds % 60);
    return true;
  };

  if (tick()) {
    const timer = setInterval(() => {
      if (!tick()) clearInterval(timer);
    }, 1000);
  }
}

/* ----------------------------------------------------------- typed intro */
function initTypedSubtitle() {
  const el = document.querySelector('.hero__typed');
  const caret = document.querySelector('.hero__caret');
  if (!el) return;

  const text = el.dataset.text || '';

  if (REDUCED_MOTION) {
    el.textContent = text;
    if (caret) caret.hidden = true;
    return;
  }

  let index = 0;
  const type = () => {
    el.textContent = text.slice(0, (index += 1));
    if (index < text.length) {
      // Pause a beat on sentence punctuation for a more deliberate cadence.
      const char = text[index - 1];
      setTimeout(type, '.…?!'.includes(char) ? 260 : 28);
    } else if (caret) {
      setTimeout(() => { caret.hidden = true; }, 1400);
    }
  };
  setTimeout(type, 900);
}

/* --------------------------------------------------------------- parallax */
function initParallax() {
  const hero = document.getElementById('hero');
  if (!hero || REDUCED_MOTION) return;

  const layers = [...hero.querySelectorAll('[data-depth]')].map((el) => ({
    el,
    depth: parseFloat(el.dataset.depth) || 0,
  }));
  if (!layers.length) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const offset = window.scrollY;
    if (offset > window.innerHeight) return;
    layers.forEach(({ el, depth }) => {
      el.style.transform = `translate3d(0, ${offset * depth}px, 0)`;
    });
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();
}

/* -------------------------------------------------------------- particles */
function initParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas || REDUCED_MOTION) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let stars = [];
  let embers = [];
  let running = true;
  let frame = null;

  const random = (min, max) => min + Math.random() * (max - min);

  const spawnEmber = (seeded = false) => ({
    x: random(0, width),
    y: seeded ? random(0, height) : height + random(0, 40),
    size: random(1.5, 3.5),
    speed: random(12, 34),
    drift: random(-9, 9),
    life: random(0.35, 1),
    hue: random(28, 46),
  });

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const starCount = Math.round((width * height) / 9000);
    stars = Array.from({ length: starCount }, () => ({
      x: random(0, width),
      y: random(0, height * 0.62),
      radius: random(0.4, 1.3),
      phase: random(0, Math.PI * 2),
      rate: random(0.6, 2.0),
    }));

    const emberCount = Math.round(width / 26);
    embers = Array.from({ length: emberCount }, () => spawnEmber(true));
  };

  let previous = performance.now();

  const draw = (now) => {
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    ctx.clearRect(0, 0, width, height);

    const seconds = now / 1000;
    stars.forEach((star) => {
      const twinkle = 0.45 + 0.55 * Math.sin(seconds * star.rate + star.phase);
      ctx.globalAlpha = Math.max(0, twinkle) * 0.85;
      ctx.fillStyle = '#fff6d8';
      ctx.fillRect(star.x, star.y, star.radius * 2, star.radius * 2);
    });

    embers.forEach((ember, i) => {
      ember.y -= ember.speed * delta;
      ember.x += Math.sin(seconds + i) * ember.drift * delta;

      if (ember.y < height * 0.18) {
        embers[i] = spawnEmber();
        return;
      }

      const fade = Math.min(1, (ember.y - height * 0.18) / (height * 0.35));
      ctx.globalAlpha = ember.life * fade * 0.9;
      ctx.fillStyle = `hsl(${ember.hue}, 95%, 62%)`;
      ctx.fillRect(ember.x, ember.y, ember.size, ember.size);
    });

    ctx.globalAlpha = 1;
    if (running) frame = requestAnimationFrame(draw);
  };

  const start = () => {
    if (frame !== null) return;
    running = true;
    previous = performance.now();
    frame = requestAnimationFrame(draw);
  };

  const stop = () => {
    running = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };

  resize();
  window.addEventListener('resize', resize);

  // Only burn CPU while the cover is actually on screen.
  new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? start() : stop()),
    { threshold: 0 }
  ).observe(canvas);

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stop() : start();
  });
}

/* --------------------------------------------------- control panel reveal */
function initControlPanelReveal() {
  const hero = document.getElementById('hero');
  const panel = document.querySelector('.control-panel');
  if (!panel) return;

  if (!hero) {
    panel.classList.add('is-revealed');
    return;
  }

  new IntersectionObserver(
    ([entry]) => panel.classList.toggle('is-revealed', !entry.isIntersecting),
    { threshold: 0 }
  ).observe(hero);
}

/* --------------------------------------------------------- scroll reveals */

/**
 * Collect a page's animatable blocks in document order.
 * `.quest-details-stack` is transparent to the walk: its panels are staggered
 * individually so the detail sections cascade rather than arriving as a slab.
 *
 * `.divider-swirl` is deliberately excluded — it owns a `divider-wipe`
 * animation of the same specificity, and only one `animation` can win.
 */
function revealTargets(page) {
  const targets = [];

  page.querySelectorAll('.quest-header').forEach((el) => targets.push(el));

  page.querySelectorAll('.quest-intro-body > *, .quest-body > *').forEach((el) => {
    if (el.classList.contains('quest-details-stack')) {
      el.querySelectorAll(':scope > *').forEach((panel) => targets.push(panel));
    } else {
      targets.push(el);
    }
  });

  // Restore document order after the two separate queries above.
  return targets.sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  );
}

function initScrollReveal() {
  const pages = [...document.querySelectorAll('.page')];
  if (!pages.length) return;

  // Only now is it safe for the CSS to hide anything.
  document.documentElement.classList.add('has-reveal');

  pages.forEach((page) => {
    revealTargets(page).forEach((el, index) => {
      el.classList.add('reveal');
      el.style.setProperty('--i', index);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    // Chrome computes the intersection rect *after* the target's own
    // clip-path, so an unfurling page only ever reports its ~22px rod. Any
    // ratio-based threshold would deadlock: clipped forever because it can
    // never appear "enough" to unclip. Threshold 0 plus a negative bottom
    // margin fires at the same scroll position either way.
    { threshold: 0, rootMargin: '0px 0px -110px 0px' }
  );

  pages.forEach((page) => observer.observe(page));
}

/* -------------------------------------------------------- scroll progress */
function initScrollProgress() {
  const fill = document.getElementById('quest-progress-fill');
  if (!fill) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
    fill.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );

  update();
}

/* -------------------------------------------------------------------- go */
document.addEventListener('DOMContentLoaded', () => {
  initPrintButtons();
  initScrollTo();
  initCountdown();
  initTypedSubtitle();
  initParallax();
  initParticles();
  initControlPanelReveal();
  initScrollReveal();
  initScrollProgress();
});
