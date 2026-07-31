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

const rand = (min, max) => min + Math.random() * (max - min);

/**
 * Mount a self-managing canvas animation.
 *
 * Handles DPR-aware sizing, the rAF loop, and pausing whenever the canvas
 * leaves the viewport or the tab is hidden — so a dozen of these can coexist
 * without any of them costing anything while off screen.
 *
 * `onResize(width, height)` seeds state; `onFrame(ctx, t, dt, w, h)` draws.
 */
function mountCanvas(canvas, { onResize, onFrame }) {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let frame = null;
  let previous = performance.now();

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    onResize(width, height);
  };

  const draw = (now) => {
    const delta = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    ctx.clearRect(0, 0, width, height);
    onFrame(ctx, now / 1000, delta, width, height);
    ctx.globalAlpha = 1;
    frame = requestAnimationFrame(draw);
  };

  const start = () => {
    if (frame !== null || !width) return;
    previous = performance.now();
    frame = requestAnimationFrame(draw);
  };

  const stop = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  };

  resize();
  window.addEventListener('resize', resize, { passive: true });

  new IntersectionObserver(
    ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
    { threshold: 0 }
  ).observe(canvas);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
}

function initParticles() {
  const canvas = document.getElementById('hero-particles');
  if (!canvas || REDUCED_MOTION) return;

  let stars = [];
  let embers = [];
  let bounds = { w: 0, h: 0 };

  const spawnEmber = (seeded = false) => ({
    x: rand(0, bounds.w),
    y: seeded ? rand(0, bounds.h) : bounds.h + rand(0, 40),
    size: rand(1.5, 3.5),
    speed: rand(12, 34),
    drift: rand(-9, 9),
    life: rand(0.35, 1),
    hue: rand(28, 46),
  });

  mountCanvas(canvas, {
    onResize(width, height) {
      bounds = { w: width, h: height };
      stars = Array.from({ length: Math.round((width * height) / 9000) }, () => ({
        x: rand(0, width),
        y: rand(0, height * 0.62),
        radius: rand(0.4, 1.3),
        phase: rand(0, Math.PI * 2),
        rate: rand(0.6, 2.0),
      }));
      embers = Array.from({ length: Math.round(width / 26) }, () => spawnEmber(true));
    },

    onFrame(ctx, seconds, delta, width, height) {
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
    },
  });
}

/* ------------------------------------------------------- quest ambience */

/**
 * Per-zone drifting motes, matched to each quest's scene band.
 *
 * Colours skew dark: these sit on light parchment, so a mid-tone mote is
 * effectively invisible. `density` is per 1000px of page height.
 */
const AMBIENCE = {
  1: { density: 26, size: [2.5, 5], rise: [14, 34], alpha: [0.3, 0.7], hue: [24, 44], sat: 88, light: 46 },
  2: { density: 14, size: [13, 21], rise: [10, 24], alpha: [0.28, 0.6], hue: [268, 296], sat: 55, light: 44, glyph: '\u266a' },
  3: { density: 30, size: [2.5, 5.5], rise: [18, 40], alpha: [0.32, 0.75], hue: [6, 30], sat: 85, light: 42 },
  4: { density: 20, size: [2.5, 5], rise: [8, 20], alpha: [0.28, 0.62], hue: [195, 215], sat: 70, light: 44 },
};

function initQuestAmbience() {
  if (REDUCED_MOTION) return;

  document.querySelectorAll('.page[data-quest]').forEach((page) => {
    const config = AMBIENCE[page.dataset.quest];
    const host = page.querySelector('.decorative-border-inner');
    if (!config || !host) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'quest-ambience screen-only';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);

    let motes = [];

    const spawn = (width, height, seeded) => ({
      x: rand(0, width),
      y: seeded ? rand(0, height) : height + rand(0, 40),
      size: rand(...config.size),
      speed: rand(...config.rise),
      drift: rand(-12, 12),
      life: rand(...config.alpha),
      hue: rand(...config.hue),
      spin: rand(-0.6, 0.6),
    });

    mountCanvas(canvas, {
      onResize(width, height) {
        const count = Math.max(8, Math.round((config.density * height) / 1000));
        motes = Array.from({ length: count }, () => spawn(width, height, true));
      },

      onFrame(ctx, seconds, delta, width, height) {
        if (config.glyph) {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
        }

        motes.forEach((mote, i) => {
          mote.y -= mote.speed * delta;
          mote.x += Math.sin(seconds * 0.7 + i) * mote.drift * delta;

          if (mote.y < -30) {
            motes[i] = spawn(width, height, false);
            return;
          }

          // Fade in from the bottom and out towards the top.
          const enter = Math.min(1, (height - mote.y) / 120);
          const exit = Math.min(1, mote.y / 160);
          const alpha = mote.life * Math.max(0, enter) * Math.max(0, exit);
          if (alpha <= 0.01) return;

          const colour = `hsl(${mote.hue}, ${config.sat}%, ${config.light}%)`;

          if (config.glyph) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = colour;
            ctx.font = `${Math.round(mote.size)}px serif`;
            ctx.save();
            ctx.translate(mote.x, mote.y);
            ctx.rotate(Math.sin(seconds * 0.5 + i) * 0.25);
            ctx.fillText(config.glyph, 0, 0);
            ctx.restore();
          } else {
            // Soft halo behind a solid core so the mote reads on parchment.
            ctx.globalAlpha = alpha * 0.28;
            ctx.fillStyle = colour;
            ctx.fillRect(
              mote.x - mote.size,
              mote.y - mote.size,
              mote.size * 3,
              mote.size * 3
            );
            ctx.globalAlpha = alpha;
            ctx.fillRect(mote.x, mote.y, mote.size, mote.size);
          }
        });
      },
    });
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

/* ------------------------------------------------------------ journey map */

function scrollToId(id) {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({
    behavior: REDUCED_MOTION ? 'auto' : 'smooth',
    block: 'start',
  });
}

function initJourneyMap() {
  const section = document.getElementById('journey-map');
  const route = document.getElementById('journey-route');
  const walker = document.getElementById('journey-walker');
  if (!section || !route) return;

  // Feed the real path length to CSS so the dash animation is exact rather
  // than relying on a guessed dasharray offset.
  const length = route.getTotalLength();
  route.style.setProperty('--route-length', length);
  route.style.strokeDasharray = `${length}`;

  // The draw needs one long dash; once it lands, hand the route back to the
  // decorative dashed pattern from the stylesheet.
  route.addEventListener('animationend', () => {
    route.style.strokeDasharray = '9 11';
    route.style.strokeDashoffset = '0';
  });

  section.querySelectorAll('.journey__pin').forEach((pin) => {
    const go = () => scrollToId(pin.dataset.target);
    pin.addEventListener('click', go);
    pin.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        go();
      }
    });
  });

  // Walk the sprite along the route as the map scrolls through the viewport.
  const placeWalker = () => {
    if (!walker || REDUCED_MOTION) return;
    const svg = route.ownerSVGElement;
    const box = section.getBoundingClientRect();
    const travelled = (window.innerHeight - box.top) / (window.innerHeight + box.height);
    const progress = Math.min(1, Math.max(0, travelled));

    const point = route.getPointAtLength(length * progress);
    const viewBox = svg.viewBox.baseVal;
    const rect = svg.getBoundingClientRect();
    const frame = section.querySelector('.journey__frame').getBoundingClientRect();
    const scale = rect.width / viewBox.width;

    walker.style.left = `${rect.left - frame.left + point.x * scale - 13}px`;
    walker.style.top = `${rect.top - frame.top + point.y * scale - 44}px`;
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      placeWalker();
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      section.classList.add('is-visible');
      observer.disconnect();
    },
    { threshold: 0, rootMargin: '0px 0px -120px 0px' }
  );
  observer.observe(section);

  placeWalker();
}

/* --------------------------------------------------------- tracker rail */
function initTracker() {
  const tracker = document.getElementById('tracker');
  const hero = document.getElementById('hero');
  if (!tracker) return;

  const nodes = [...tracker.querySelectorAll('.tracker__node')];
  const sections = nodes
    .map((node) => ({ node, el: document.getElementById(node.dataset.target) }))
    .filter((entry) => entry.el);

  nodes.forEach((node) => {
    node.addEventListener('click', () => scrollToId(node.dataset.target));
  });

  if (hero) {
    new IntersectionObserver(
      ([entry]) => tracker.classList.toggle('is-revealed', !entry.isIntersecting),
      { threshold: 0 }
    ).observe(hero);
  } else {
    tracker.classList.add('is-revealed');
  }

  // Scroll-spy: whichever section covers the middle of the viewport wins.
  let ticking = false;
  const update = () => {
    ticking = false;
    const middle = window.innerHeight / 2;
    let active = sections[0];

    sections.forEach((entry) => {
      const box = entry.el.getBoundingClientRect();
      if (box.top <= middle) active = entry;
    });

    nodes.forEach((node) => node.classList.toggle('is-current', node === active.node));
    document
      .querySelectorAll('.journey__pin')
      .forEach((pin) => pin.classList.toggle('is-current', pin.dataset.target === active.node.dataset.target));
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
  initQuestAmbience();
  initControlPanelReveal();
  initScrollReveal();
  initScrollProgress();
  initJourneyMap();
  initTracker();
});
