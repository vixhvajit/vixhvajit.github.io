// Scroll choreography: Lenis smooth scroll + GSAP ScrollTrigger.
// The drone's position is a pure function of scroll: each section owns a
// segment that moves it from the previous pose to the next one.

const root = document.documentElement;
const { gsap, ScrollTrigger, Lenis } = window;

// Normalised screen coordinates: x and y run -1..1 from centre to edge (y up).
// `m` overrides apply on narrow screens.
const POSES = {
  hero0:    { x: -0.32, y: 0.42,  z: 0, scale: 1.2,  rx: 0.45, ry: -0.6, rz: 0,     prop: 1,   m: { x: -0.5, y: 0.66, scale: 0.75 } },
  hero1:    { x: 0.95,  y: -2.3,  z: 0, scale: 3.4,  rx: 1.15, ry: 0.4,  rz: -0.25, prop: 2.4 },
  stats:    { x: 0.62,  y: 0.02,  z: 0, scale: 1.0,  rx: 0.32, ry: -0.8, rz: 0.28,  prop: 1.2, m: { x: 0.3, y: -0.62, scale: 0.8 } },
  comp0:    { x: 0.8,   y: 0.64,  z: 0, scale: 0.55, rx: 0.28, ry: -1.6, rz: 0.12,  prop: 1.4, m: { x: 0.3, y: -1.0, scale: 0.45 } },
  comp1:    { x: 0.74,  y: 0.6,   z: 0, scale: 0.6,  rx: 0.28, ry: 1.6,  rz: -0.18, prop: 1.6, m: { x: -0.3, y: -1.0, scale: 0.45 } },
  feat0:    { x: 0.86,  y: 0.74,  z: 0, scale: 0.42, rx: 0.3,  ry: 2.2,  rz: 0.1,   prop: 1.2, m: { x: 0.6, y: 0.8, scale: 0.4 } },
  feat1:    { x: 0.86,  y: -0.7,  z: 0, scale: 0.42, rx: 0.3,  ry: 3.4,  rz: -0.1,  prop: 1.2, m: { x: 0.6, y: 0.8, scale: 0.4 } },
  projects: { x: 0.8,   y: 0.72,  z: 0, scale: 0.45, rx: 0.3,  ry: 4.2,  rz: -0.12, prop: 1.3, m: { x: 0.6, y: 0.8, scale: 0.4 } },
  pilot:    { x: 0.0,   y: 0.82,   z: 0, scale: 0.42, rx: 0.35, ry: 4.6,  rz: 0.1,   prop: 1.4, m: { x: 0.55, y: 0.84, scale: 0.38 } },
  skills:   { x: 0.62,  y: 0.6,   z: 0, scale: 0.7,  rx: 0.5,  ry: 5.0,  rz: 0.1,   prop: 1.6, m: { x: 0.5, y: 0.78, scale: 0.5 } },
  about:    { x: 0.74,  y: 0.84,  z: 0, scale: 0.6,  rx: 0.3,  ry: 5.8,  rz: 0.2,   prop: 1.2, m: { x: 0.55, y: 0.8, scale: 0.45 } },
  contact0: { x: 0,     y: -0.74, z: 0, scale: 0.95, rx: 0.42, ry: 6.6,  rz: 0,     prop: 1.3, m: { y: -0.7, scale: 1 } },
  contact1: { x: 0.05,  y: 2.0,   z: 0, scale: 0.9,  rx: -0.2, ry: 7.4,  rz: 0.05,  prop: 3.2 },
};
const KEYS = ['x', 'y', 'z', 'scale', 'rx', 'ry', 'rz', 'prop'];
const NARROW = '(max-width: 760px)';

let segments = [];
let lenis = null;
const pose = {};

function getPose() {
  let from = POSES.hero0;
  let to = POSES.hero0;
  let p = 1;
  for (const s of segments) {
    const sp = s.st.progress;
    if (sp <= 0) break;
    from = s.from;
    to = s.to;
    p = sp;
  }
  const e = p * p * (3 - 2 * p);
  const narrow = window.matchMedia(NARROW).matches;
  for (const k of KEYS) {
    const a = narrow && from.m && k in from.m ? from.m[k] : from[k];
    const b = narrow && to.m && k in to.m ? to.m[k] : to[k];
    pose[k] = a + (b - a) * e;
  }
  return pose;
}

function segment(from, to, st) {
  segments.push({ from: POSES[from], to: POSES[to], st });
}

if (!gsap || !ScrollTrigger) {
  root.classList.remove('js', 'motion');
  startDrone(false);
} else {
  init();
}

function init() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  splitWords(document.querySelector('.about__statement'));

  const nav = document.querySelector('.nav');
  ScrollTrigger.create({ start: 40, end: 'max', onToggle: (self) => nav.classList.toggle('nav--scrolled', self.isActive) });

  const mm = gsap.matchMedia();
  mm.add({ motion: '(prefers-reduced-motion: no-preference)' }, (ctx) => {
    if (!ctx.conditions.motion) {
      root.classList.remove('motion');
      return;
    }
    root.classList.add('motion');
    lenis = startLenis();
    buildChoreography();
    return () => {
      root.classList.remove('motion');
      segments = [];
      lenis?.destroy();
      lenis = null;
    };
  });

  startDrone(!window.matchMedia('(prefers-reduced-motion: no-preference)').matches);
  wireAnchors();
  wireFilters();
  refreshWhenLayoutSettles();
}

function startLenis() {
  if (!Lenis) return null;
  const instance = new Lenis({ duration: 1.15, smoothWheel: true });
  instance.on('scroll', ScrollTrigger.update);
  const raf = (time) => instance.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return {
    scrollTo: (target, opts) => instance.scrollTo(target, opts),
    destroy() {
      gsap.ticker.remove(raf);
      instance.destroy();
    },
  };
}

function buildChoreography() {
  segments = [];

  // The drone finishes its dive before the headline lands. Created before the
  // hero pin so its range is not pushed back by the pin's own spacing.
  segment('hero0', 'hero1', ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: '+=95%' }));

  // Hero: pin, fly through the name, reveal the headline.
  const hero = gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=140%', pin: true, scrub: true },
  });
  hero
    .to('.hero__name', { scale: 4.2, opacity: 0, ease: 'power2.in', duration: 0.6 }, 0)
    .to(['.hero__chip', '.hero__scroll'], { opacity: 0, y: -30, ease: 'none', duration: 0.25 }, 0)
    .to('.hero__portrait', { yPercent: 8, scale: 1.06, opacity: 0, ease: 'power1.in', duration: 0.5 }, 0)
    .fromTo('.hero__line', { opacity: 0, y: 70, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, ease: 'power2.out', duration: 0.35 }, 0.5)
    .to({}, { duration: 0.15 });

  // Stats: count up, drone banks in from the right.
  segment('hero1', 'stats', ScrollTrigger.create({ trigger: '.stats', start: 'top bottom', end: 'center center' }));
  gsap.utils.toArray('.stat').forEach((stat, i) => {
    const num = stat.querySelector('.stat__num');
    const { to, prefix = '', suffix = '' } = num.dataset;
    const counter = { v: 0 };
    gsap.from(stat, { y: 50, opacity: 0, duration: 0.9, delay: i * 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 75%', once: true } });
    // Stats without a number (RPC) only rise in; numeric ones also count up.
    if (to === undefined) return;
    gsap.to(counter, {
      v: Number(to),
      duration: 1.4,
      delay: 0.15 + i * 0.08,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.stats', start: 'top 75%', once: true },
      onUpdate: () => { num.textContent = prefix + Math.round(counter.v) + suffix; },
    });
  });

  // Competitions: pin and slide the track sideways.
  const track = document.querySelector('.comp__track');
  const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
  segment('stats', 'comp0', ScrollTrigger.create({ trigger: '.comp', start: 'top bottom', end: 'top top' }));
  const slide = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: { trigger: '.comp', start: 'top top', end: () => '+=' + distance(), pin: true, scrub: true, invalidateOnRefresh: true },
  });
  segment('comp0', 'comp1', slide.scrollTrigger);
  gsap.to('.comp__progress span', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.comp', start: 'top top', end: () => '+=' + distance(), scrub: true, invalidateOnRefresh: true },
  });
  gsap.utils.toArray('.card').forEach((card) => {
    gsap.fromTo(card, { scale: 0.86, opacity: 0.35 }, {
      scale: 1, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left 105%', end: 'left 65%', scrub: true },
    });
    gsap.fromTo(card.querySelector('.card__year'), { xPercent: 30 }, {
      xPercent: 0, ease: 'none',
      scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left right', end: 'right 60%', scrub: true },
    });
  });

  // Pilot: photo zooms out of its frame, the inset drifts up past it.
  segment('comp1', 'pilot', ScrollTrigger.create({ trigger: '.pilot', start: 'top bottom', end: 'top 20%' }));
  gsap.from('.pilot__text > *', {
    x: -50, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08,
    scrollTrigger: { trigger: '.pilot__grid', start: 'top 70%', once: true },
  });
  gsap.fromTo('.pilot__photo', { clipPath: 'inset(12% 12% 12% 12% round 24px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none',
    scrollTrigger: { trigger: '.pilot__photo', start: 'top bottom', end: 'center center', scrub: true },
  });
  gsap.fromTo('.pilot__photo img', { scale: 1.35 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.pilot__photo', start: 'top bottom', end: 'bottom 30%', scrub: true },
  });
  gsap.fromTo('.pilot__inset', { yPercent: 60 }, {
    yPercent: -20, ease: 'none',
    scrollTrigger: { trigger: '.pilot__media', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  // Featured projects: panels zoom up to full size, metric zooms out.
  segment('pilot', 'feat0', ScrollTrigger.create({ trigger: '.features', start: 'top bottom', end: 'top top' }));
  segment('feat0', 'feat1', ScrollTrigger.create({ trigger: '.features', start: 'top top', end: 'bottom bottom' }));
  revealHead('.features .section-head');
  gsap.utils.toArray('.feature').forEach((feature) => {
    const panel = feature.querySelector('.feature__panel');
    gsap.fromTo(panel, { scale: 0.84, opacity: 0.3, borderRadius: 56 }, {
      scale: 1, opacity: 1, borderRadius: 28, ease: 'none',
      scrollTrigger: { trigger: feature, start: 'top bottom', end: 'top 12%', scrub: true },
    });
    gsap.fromTo(feature.querySelector('.feature__metric'), { scale: 1.7 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: feature, start: 'top bottom', end: 'center center', scrub: true },
    });
    const img = feature.querySelector('.media img');
    if (img) {
      gsap.fromTo(img, { scale: 1.25 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: feature, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
    gsap.from(feature.querySelectorAll('.feature__text > *'), {
      x: -50, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: feature, start: 'top 55%', once: true },
    });
  });

  // All projects: cards rise in batches as they scroll into view.
  segment('feat1', 'projects', ScrollTrigger.create({ trigger: '.projects', start: 'top bottom', end: 'top 30%' }));
  revealHead('.projects .section-head');
  gsap.from('.filters', { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: '.filters', start: 'top 88%', once: true } });
  gsap.set('.pcard', { y: 70, opacity: 0 });
  ScrollTrigger.batch('.pcard', {
    start: 'top 90%',
    once: true,
    onEnter: (cards) => gsap.to(cards, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.1, overwrite: true }),
  });

  // Skills: endless sideways rows that speed up with scroll velocity.
  segment('projects', 'skills', ScrollTrigger.create({ trigger: '.skills', start: 'top bottom', end: 'center center' }));
  revealHead('.skills .section-head');
  buildMarquees();

  // About: words light up as you read.
  segment('skills', 'about', ScrollTrigger.create({ trigger: '.about', start: 'top bottom', end: 'top 20%' }));
  gsap.fromTo('.about__statement .w', { opacity: 0.14 }, {
    opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: '.about__statement', start: 'top 80%', end: 'bottom 45%', scrub: true },
  });
  gsap.fromTo('.about__photo img', { scale: 1.3 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.about__photo', start: 'top bottom', end: 'bottom 40%', scrub: true },
  });
  gsap.from('.about__item', {
    y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: '.about__cols', start: 'top 85%', once: true },
  });

  // Contact: drone settles under the headline, then climbs out of frame.
  segment('about', 'contact0', ScrollTrigger.create({ trigger: '.contact', start: 'top 35%', end: 'top top' }));
  gsap.from('.contact__inner > *', {
    y: 80, opacity: 0, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: '.contact', start: 'top 85%', end: 'top 15%', scrub: true },
  });
  const climb = ScrollTrigger.create({ trigger: '.contact', start: 'top top', end: '+=70%', pin: true });
  segment('contact0', 'contact1', climb);
}

function revealHead(selector) {
  gsap.from(`${selector} > *`, {
    y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1,
    scrollTrigger: { trigger: selector, start: 'top 85%', once: true },
  });
}

function buildMarquees() {
  const speed = { v: 1 };
  const loops = gsap.utils.toArray('.marquee').map((row, i) => {
    const track = row.querySelector('.marquee__track');
    const group = track.querySelector('.marquee__group:not([aria-hidden])');
    if (!track.dataset.filled) {
      // Each group must be at least a viewport wide, then a second copy makes the loop seamless.
      const items = [...group.children];
      let guard = 0;
      while (group.scrollWidth < window.innerWidth * 1.1 && guard++ < 6) {
        items.forEach((li) => {
          const copy = li.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          group.append(copy);
        });
      }
      const clone = group.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.append(clone);
      track.dataset.filled = '1';
    }
    const duration = 36 + i * 8;
    return i % 2
      ? gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, ease: 'none', duration, repeat: -1 })
      : gsap.to(track, { xPercent: -50, ease: 'none', duration, repeat: -1 });
  });
  const apply = () => loops.forEach((loop) => loop.timeScale(speed.v));
  ScrollTrigger.create({
    trigger: '.skills',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate(self) {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 220, 6);
      gsap.to(speed, {
        v: boost, duration: 0.25, overwrite: true, onUpdate: apply,
        onComplete: () => gsap.to(speed, { v: 1, duration: 1.2, onUpdate: apply }),
      });
    },
  });
}

function splitWords(el) {
  if (!el || el.dataset.split) return;
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.textContent = word;
    el.append(span);
    if (i < words.length - 1) el.append(' ');
  });
  el.dataset.split = '1';
}

function wireFilters() {
  const buttons = [...document.querySelectorAll('.filter')];
  const cards = [...document.querySelectorAll('.pcard')];
  const matches = (card, filter) => filter === 'all' || card.dataset.status === filter;
  buttons.forEach((button) => {
    button.querySelector('.filter__n').textContent = cards.filter((c) => matches(c, button.dataset.filter)).length;
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      cards.forEach((card) => { card.hidden = !matches(card, filter); });
      if (root.classList.contains('motion')) {
        gsap.fromTo(cards.filter((c) => !c.hidden), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06, overwrite: true });
      }
      // Later sections move when the grid changes height.
      ScrollTrigger.refresh();
    });
  });
}

function wireAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !lenis || a.classList.contains('skip')) return;
    const id = a.getAttribute('href');
    let target = id === '#top' ? 0 : document.querySelector(id);
    if (target === null) return;
    e.preventDefault();
    // Pinned sections sit inside a pin-spacer; scroll to the spacer so the pin starts cleanly.
    if (target instanceof Element && target.parentElement?.classList.contains('pin-spacer')) target = target.parentElement;
    lenis.scrollTo(target, { duration: 1.6 });
    history.replaceState(null, '', id);
  });
}

function refreshWhenLayoutSettles() {
  let timer;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => ScrollTrigger.refresh(), 150);
  };
  document.fonts?.ready.then(refresh);
  window.addEventListener('load', refresh);
  // Missing project photos remove their <figure> (inline onerror), which shifts layout.
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') refresh(); }, true);
}

async function startDrone(reducedMotion) {
  const canvas = document.querySelector('.drone-canvas');
  try {
    const { createDrone } = await import('./drone.js');
    const drone = createDrone(canvas, { getPose, reducedMotion });
    root.classList.add(drone ? 'drone-ready' : 'no-webgl');
  } catch (err) {
    console.warn('3D drone unavailable:', err);
    root.classList.add('no-webgl');
  }
}
