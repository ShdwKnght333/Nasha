/**
 * Quest Log — interaction layer.
 * Static image QR codes remain embedded directly in index.html.
 */

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let playSoundEffect = () => {};

/* ------------------------------------------------------------------ print */
function initPrintButtons() {
  document.querySelectorAll('[data-action="print"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      playSoundEffect('blip');
      window.print();
    });
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

/* -------------------------------------------------------------- calendar */
const CALENDAR_EVENTS = {
  'quest-1': { title: 'Quest 1 - Forging Magical Armor', start: '20261204T033000Z', end: '20261204T073000Z', location: 'Sheshanaga, Ullur-74', details: 'Naandi Ceremony and final feast.' },
  'quest-2': { title: 'Quest 2 - The Dance Begins', start: '20261205T133000Z', end: '20261205T163000Z', location: 'Shree Maatha Mangalya Mandira, Shivamogga', details: 'Sangeet Ceremony with performances and a meal.' },
  'quest-3': { title: 'Quest 3 - The Ceremony', start: '20261206T013000Z', end: '20261206T083000Z', location: 'Shree Matha Mangalya Mandira', details: 'Wedding ceremony, breakfast, and victory feast.' },
  'quest-4': { title: 'Quest 4 - The Afterparty', start: '20261209T133000Z', end: '20261209T173000Z', location: 'Venkata Laxmi Gardens', details: 'Reception Ceremony and final grand feast.' },
};

function initCalendarMenus() {
  const encode = encodeURIComponent;
  const toIso = (value) => `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(9, 11)}:${value.slice(11, 13)}:${value.slice(13, 15)}Z`;
  const usesPhoneCalendarFlow = () => window.matchMedia('(max-width: 600px), (pointer: coarse)').matches;

  document.querySelectorAll('.calendar-menu[data-calendar]').forEach((menu) => {
    const event = CALENDAR_EVENTS[menu.dataset.calendar];
    const toggle = menu.querySelector('[data-calendar-toggle]');
    const panel = menu.querySelector('.calendar-menu__panel');
    if (!event || !toggle || !panel) return;

    const ics = `calendar/${menu.dataset.calendar}.ics`;
    const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encode(event.title)}&dates=${event.start}/${event.end}&location=${encode(event.location)}&details=${encode(event.details)}`;
    const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encode(event.title)}&startdt=${encode(toIso(event.start))}&enddt=${encode(toIso(event.end))}&location=${encode(event.location)}&body=${encode(event.details)}`;
    const yahoo = `https://calendar.yahoo.com/?v=60&title=${encode(event.title)}&st=${event.start}&et=${event.end}&in_loc=${encode(event.location)}&desc=${encode(event.details)}`;
    panel.innerHTML = `<a href="${google}" target="_blank" rel="noopener noreferrer">Google Calendar</a><a href="${ics}" download>Apple Calendar (.ics)</a><a href="${outlook}" target="_blank" rel="noopener noreferrer">Outlook</a><a href="${yahoo}" target="_blank" rel="noopener noreferrer">Yahoo Calendar</a>`;

    toggle.addEventListener('click', () => {
      playSoundEffect('calendar');
      // Mobile calendar apps handle .ics files natively. Opening it directly
      // avoids a small provider menu obscuring the page's lower inventory.
      if (usesPhoneCalendarFlow()) {
        window.location.assign(ics);
        return;
      }
      const open = panel.hidden;
      document.querySelectorAll('.calendar-menu__panel').forEach((other) => { other.hidden = true; });
      document.querySelectorAll('[data-calendar-toggle]').forEach((other) => other.setAttribute('aria-expanded', 'false'));
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    });
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('.calendar-menu')) return;
    document.querySelectorAll('.calendar-menu__panel').forEach((panel) => { panel.hidden = true; });
    document.querySelectorAll('[data-calendar-toggle]').forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
  });
}

/* ------------------------------------------------------------------ share */
function initShare() {
  const button = document.querySelector('[data-action="share"]');
  const status = document.getElementById('share-status');
  if (!button || !status) return;

  const label = button.querySelector('[data-share-label]');
  let resetTimer;
  const showResult = (visible, announced) => {
    status.textContent = announced;
    if (!label) return;
    clearTimeout(resetTimer);
    label.textContent = visible;
    resetTimer = setTimeout(() => { label.textContent = 'Share'; }, 2200);
  };

  const shareData = {
    title: 'A New Beginning - Quest Log',
    text: 'Join Namratha and Shreyas on their wedding quest.',
    url: window.location.href,
  };

  button.addEventListener('click', async () => {
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        playSoundEffect('share');
        showResult('Shared', 'Quest shared.');
        return;
      }
      let copied = false;
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(shareData.url);
          copied = true;
        } catch {
          copied = false;
        }
      }
      if (!copied) {
        const input = document.createElement('textarea');
        input.value = shareData.url;
        document.body.append(input);
        input.select();
        copied = document.execCommand('copy');
        input.remove();
      }
      if (!copied) throw new Error('Copy failed');
      playSoundEffect('share');
      showResult('Link Copied', 'Quest link copied to the clipboard.');
    } catch {
      showResult('Try Again', 'Unable to share the quest right now.');
    }
  });
}

/* ------------------------------------------------------------------ sound */
const SOUND_STORAGE_KEY = 'questlog.sound';

function initSound() {
  const toggle = document.querySelector('[data-action="sound"]');
  const label = toggle?.querySelector('[data-sound-label]');
  if (!toggle || !label) return;

  let enabled = false;
  let context;
  try { enabled = localStorage.getItem(SOUND_STORAGE_KEY) === 'on'; } catch { /* Sound defaults to off. */ }

  const updateToggle = () => {
    toggle.setAttribute('aria-pressed', String(enabled));
    label.textContent = enabled ? 'Sound On' : 'Sound Off';
  };

  const tone = (frequency, start, duration, { type = 'square', gain = 0.035, endFrequency = frequency } = {}) => {
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    volume.gain.setValueAtTime(gain, start);
    volume.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(volume).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  };

  playSoundEffect = (kind) => {
    if (!enabled || !window.AudioContext) return;
    context ||= new AudioContext();
    const now = context.currentTime;
    const playNotes = (notes, step = 0.07, options = {}) => notes.forEach((note, index) => tone(note, now + index * step, options.duration || 0.075, options));

    if (kind === 'turn') tone(280, now, 0.16, { gain: 0.035, endFrequency: 130 });
    else if (kind === 'objective') playNotes([523, 659, 784], 0.055, { gain: 0.035 });
    else if (kind === 'objective-undo') playNotes([392, 294], 0.075, { gain: 0.028 });
    else if (kind === 'level-up') playNotes([523, 659, 784, 1047], 0.07, { gain: 0.04, duration: 0.13 });
    else if (kind === 'calendar') playNotes([659, 880], 0.075, { gain: 0.032 });
    else if (kind === 'share') playNotes([784, 1047], 0.06, { gain: 0.032, type: 'triangle' });
    else if (kind === 'menu-open') playNotes([330, 440], 0.06, { gain: 0.025 });
    else if (kind === 'menu-close') playNotes([440, 330], 0.06, { gain: 0.022 });
    else if (kind === 'step-up') tone(600, now, 0.05, { gain: 0.025, endFrequency: 700 });
    else if (kind === 'step-down') tone(420, now, 0.05, { gain: 0.025, endFrequency: 340 });
    else if (kind === 'toggle') tone(560, now, 0.06, { gain: 0.025, type: 'triangle' });
    else if (kind === 'fanfare') playNotes([523, 659, 784, 1047], 0.1, { gain: 0.045, duration: 0.18 });
    else if (kind === 'warp') playNotes([392, 523, 784], 0.045, { gain: 0.025, type: 'triangle' });
    else if (kind === 'boss-hit') tone(150, now, 0.12, { gain: 0.05, type: 'sawtooth', endFrequency: 80 });
    else if (kind === 'boss-defeat') {
      tone(110, now, 0.22, { gain: 0.055, type: 'sawtooth', endFrequency: 60 });
      playNotes([392, 523, 784], 0.09, { gain: 0.04, duration: 0.15 });
    } else tone(520, now, 0.09, { gain: 0.03, endFrequency: 730 });
  };

  toggle.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'on' : 'off'); } catch { /* Preference remains for this visit. */ }
    updateToggle();
    playSoundEffect('blip');
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-action], [data-calendar-toggle], [data-rsvp-step], .objective, .journey__pin, .tracker__node, .rsvp-quests input')) return;
    if (event.target.closest('button, a')) playSoundEffect('blip');
  });

  updateToggle();
}

/* ------------------------------------------------------------------- RSVP */
const RSVP_STORAGE_KEY = 'questlog.rsvp';

function initRsvp() {
  const modal = document.getElementById('rsvp-modal');
  const form = document.getElementById('rsvp-form');
  const success = document.getElementById('rsvp-success');
  const error = document.getElementById('rsvp-error');
  const sheet = modal?.querySelector('.rsvp-modal__sheet');
  if (!modal || !form || !success || !error || !sheet) return;

  const openers = [...document.querySelectorAll('[data-action="rsvp"]')];
  const closers = [...modal.querySelectorAll('[data-action="close-rsvp"]')];
  let previousFocus = null;

  const isAccepted = () => {
    try { return localStorage.getItem(RSVP_STORAGE_KEY) === 'accepted'; } catch { return false; }
  };

  const showAccepted = () => {
    form.hidden = true;
    success.hidden = false;
  };

  const close = () => {
    playSoundEffect('menu-close');
    modal.hidden = true;
    document.body.style.removeProperty('overflow');
    previousFocus?.focus();
  };

  const open = (opener) => {
    playSoundEffect('menu-open');
    previousFocus = opener;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (isAccepted()) showAccepted();
    else {
      form.hidden = false;
      success.hidden = true;
    }
    (success.hidden ? form.querySelector('[name="guest_name"]') : success).focus();
  };

  openers.forEach((opener) => opener.addEventListener('click', () => open(opener)));
  closers.forEach((closer) => closer.addEventListener('click', close));

  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...sheet.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]')]
      .filter((el) => !el.closest('[hidden]'));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  form.querySelectorAll('[data-rsvp-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = form.elements.party_size;
      const next = Math.min(20, Math.max(1, Number(input.value || 1) + Number(button.dataset.rsvpStep)));
      input.value = next;
      playSoundEffect(Number(button.dataset.rsvpStep) > 0 ? 'step-up' : 'step-down');
    });
  });

  form.querySelectorAll('.rsvp-quests input').forEach((input) => {
    input.addEventListener('change', () => playSoundEffect('toggle'));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    const data = new FormData(form);
    const quests = ['quest_1', 'quest_2', 'quest_3', 'quest_4'];
    if (!quests.some((quest) => data.get(quest))) {
      error.textContent = 'Choose at least one quest to attend.';
      error.hidden = false;
      return;
    }

    const config = window.QUESTLOG_CONFIG;
    if (!config?.SUPABASE_URL || !config?.SUPABASE_ANON_KEY) {
      error.textContent = 'RSVP is not configured yet. Please try again later.';
      error.hidden = false;
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Sending...';
    const payload = {
      guest_name: data.get('guest_name').trim(),
      contact: data.get('contact').trim() || null,
      party_size: Number(data.get('party_size')),
      quest_1: data.has('quest_1'),
      quest_2: data.has('quest_2'),
      quest_3: data.has('quest_3'),
      quest_4: data.has('quest_4'),
      message: data.get('message').trim() || null,
    };

    try {
      const response = await fetch(`${config.SUPABASE_URL}/rest/v1/rsvps`, {
        method: 'POST',
        headers: {
          apikey: config.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Submission failed');
      try { localStorage.setItem(RSVP_STORAGE_KEY, 'accepted'); } catch { /* State remains for this visit. */ }
      showAccepted();
      playSoundEffect('fanfare');
      success.focus();
    } catch {
      error.textContent = 'The quest could not be accepted. Please check your connection and try again.';
      error.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Send RSVP';
    }
  });
}

/* ------------------------------------------------------------- objectives */
const OBJECTIVES_STORAGE_KEY = 'questlog.objectives';

function readCompletedObjectives() {
  try {
    const stored = JSON.parse(localStorage.getItem(OBJECTIVES_STORAGE_KEY));
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

function saveCompletedObjectives(completed) {
  try {
    localStorage.setItem(OBJECTIVES_STORAGE_KEY, JSON.stringify([...completed]));
  } catch {
    // Private browsing can disable storage; objectives still work for this visit.
  }
}

function initObjectives() {
  const objectives = [...document.querySelectorAll('.objective[data-id]')];
  if (!objectives.length) return;

  const completed = readCompletedObjectives();

  const updateQuestXp = (quest) => {
    const root = document.querySelector(`[data-quest-xp="${quest}"]`);
    const list = document.querySelector(`.objectives[data-quest="${quest}"]`);
    if (!root || !list) return;

    const questObjectives = [...list.querySelectorAll('.objective')];
    const total = questObjectives.reduce((sum, objective) => sum + Number(objective.dataset.xp || 0), 0);
    const earned = questObjectives.reduce(
      (sum, objective) => sum + (completed.has(objective.dataset.id) ? Number(objective.dataset.xp || 0) : 0),
      0
    );
    const value = root.querySelector('.quest-xp__value');
    const totalEl = root.querySelector('.quest-xp__total');
    const fill = root.querySelector('.quest-xp__fill');
    if (value) value.value = value.textContent = earned;
    if (totalEl) totalEl.textContent = total;
    if (fill) fill.style.transform = `scaleX(${total ? earned / total : 0})`;
    root.setAttribute('aria-label', `Quest ${quest} experience: ${earned} of ${total}`);
  };

  const renderObjective = (objective, shouldAnimate = false) => {
    const isComplete = completed.has(objective.dataset.id);
    objective.classList.toggle('is-complete', isComplete);
    objective.setAttribute('aria-pressed', String(isComplete));
    if (shouldAnimate && isComplete && !REDUCED_MOTION) {
      objective.classList.remove('is-just-completed');
      void objective.offsetWidth;
      objective.classList.add('is-just-completed');
      objective.addEventListener('animationend', () => objective.classList.remove('is-just-completed'), { once: true });
    }
  };

  objectives.forEach((objective) => {
    renderObjective(objective);
    objective.addEventListener('click', () => {
      const id = objective.dataset.id;
      const isComplete = completed.has(id);
      if (isComplete) completed.delete(id);
      else completed.add(id);
      renderObjective(objective, !isComplete);
      updateQuestXp(objective.closest('.objectives').dataset.quest);
      saveCompletedObjectives(completed);
      if (isComplete) {
        playSoundEffect('objective-undo');
      } else {
        const list = objective.closest('.objectives');
        const complete = [...list.querySelectorAll('.objective')].every((item) => completed.has(item.dataset.id));
        playSoundEffect(complete ? 'level-up' : 'objective');
      }
    });
  });

  document.querySelectorAll('.objectives[data-quest]').forEach((list) => updateQuestXp(list.dataset.quest));
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

/* ------------------------------------------------------------- dialogue */
function initDialogue() {
  const dialogue = document.getElementById('intro-dialogue');
  const textEl = dialogue?.querySelector('.dialogue__text');
  if (!dialogue || !textEl) return;

  const text = textEl.dataset.text || textEl.textContent.trim();
  let started = false;
  let complete = false;
  let timer;

  const finish = () => {
    clearTimeout(timer);
    complete = true;
    textEl.textContent = text;
    dialogue.classList.add('is-complete');
  };

  const start = () => {
    if (started) return;
    started = true;
    if (REDUCED_MOTION) {
      finish();
      return;
    }

    textEl.textContent = '';
    let index = 0;
    const type = () => {
      textEl.textContent = text.slice(0, (index += 1));
      if (index < text.length) timer = setTimeout(type, '.?!'.includes(text[index - 1]) ? 180 : 16);
      else finish();
    };
    type();
  };

  dialogue.addEventListener('click', () => {
    if (!complete) finish();
  });

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      start();
      observer.disconnect();
    },
    { threshold: 0, rootMargin: '0px 0px -80px 0px' }
  );
  observer.observe(dialogue);
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
        playSoundEffect('turn');
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

/* --------------------------------------------------------------- boss HP */
function initBossHp() {
  const page = document.getElementById('quest-3-page');
  const root = document.getElementById('boss-hp');
  if (!page || !root || REDUCED_MOTION) return;

  const fill = root.querySelector('.boss-hp__fill');
  const value = root.querySelector('.boss-hp__value');
  const damage = root.querySelector('.boss-hp__damage');
  const milestones = [75, 50, 25, 0];
  let triggered = new Set();
  let ticking = false;

  const update = () => {
    ticking = false;
    const box = page.getBoundingClientRect();
    const travelled = (window.innerHeight - box.top) / (window.innerHeight + box.height);
    const progress = Math.min(1, Math.max(0, travelled));
    const hp = Math.round((1 - progress) * 100);
    fill.style.transform = `scaleX(${hp / 100})`;
    value.textContent = `HP ${hp} / 100`;
    root.setAttribute('aria-label', `The Marriage Dragon health: ${hp} percent`);

    milestones.forEach((milestone) => {
      if (hp > milestone || triggered.has(milestone)) return;
      triggered.add(milestone);
      damage.textContent = milestone === 0 ? 'DEFEATED!' : `-${100 - milestone} DMG`;
      root.classList.remove('is-damaged');
      void root.offsetWidth;
      root.classList.add('is-damaged');
      playSoundEffect(milestone === 0 ? 'boss-defeat' : 'boss-hit');
    });
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
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
    const go = () => {
      playSoundEffect('warp');
      scrollToId(pin.dataset.target);
    };
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
    node.addEventListener('click', () => {
      playSoundEffect('warp');
      scrollToId(node.dataset.target);
    });
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
  initCalendarMenus();
  initShare();
  initSound();
  initRsvp();
  initObjectives();
  initCountdown();
  initTypedSubtitle();
  initDialogue();
  initParallax();
  initParticles();
  initQuestAmbience();
  initControlPanelReveal();
  initScrollReveal();
  initScrollProgress();
  initBossHp();
  initJourneyMap();
  initTracker();
});
