const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- NAV (vanilla — always runs, independent of GSAP) ---------------- */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

function updateNavState() {
  nav.classList.toggle('scrolled', (window.scrollY || window.pageYOffset) > 60);
}
window.addEventListener('scroll', updateNavState, { passive: true });
updateNavState();

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('open', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.classList.remove('open');
  document.body.style.overflow = '';
}));

/* ---------------- COLLECTION SCROLL PROGRESS (mobile) ---------------- */
(function collectionProgress(){
  const track = document.getElementById('collectionTrack');
  const fill = document.getElementById('collectionProgressFill');
  if (!track || !fill) return;

  function update() {
    const max = track.scrollWidth - track.clientWidth;
    if (max <= 0) { fill.style.width = '100%'; return; }
    const pct = (track.scrollLeft / max) * 100;
    fill.style.width = Math.min(100, Math.max(6, pct)) + '%';
  }
  track.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ---------------- HERO VIDEO — robust fallback ----------------
   Video playback over file:// (double-clicked file) is blocked by
   most browsers. .hero-media already carries the poster image as a
   CSS background, so if the video can't play we just hide the
   <video> tag and the cinematic still shows underneath. */
(function heroVideoFallback(){
  const heroEl = document.getElementById('hero');
  const video = document.getElementById('heroVideo');
  if (!heroEl || !video) return;

  let settled = false;
  function fallToImage(){
    if (settled) return;
    settled = true;
    heroEl.classList.add('no-video');
  }
  function confirmPlaying(){
    settled = true;
  }
  video.addEventListener('error', fallToImage);
  video.addEventListener('stalled', fallToImage);
  video.addEventListener('playing', confirmPlaying);

  // If nothing has happened within 2.5s (typical for a blocked
  // file:// video load), assume it failed and fall back.
  setTimeout(() => {
    if (!settled && video.readyState < 2) fallToImage();
  }, 2500);

  video.play().catch(fallToImage);
})();

if (!hasGSAP) {
  // Fallback: reveal everything immediately if animation libs failed to load
  document.querySelectorAll('.intro-text, .intro-image, .craft-head, .craft-row, .philosophy-inner, .lifestyle-split-text, .lifestyle-split-img, .final-content, .cta-inner')
    .forEach(el => el.classList.add('is-in'));
}

/* ---------------- CURSOR (desktop only) ---------------- */
const cursorDot = document.getElementById('cursorDot');
if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    cursorDot.style.opacity = '1';
    gsap.to(cursorDot, { x: e.clientX, y: e.clientY, duration: 0.35, ease: 'power3.out' });
  });
  document.querySelectorAll('a, button, .product-slide').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursorDot.style.width = '28px';
      cursorDot.style.height = '28px';
      cursorDot.style.background = 'rgba(178,136,85,0.35)';
    });
    el.addEventListener('mouseleave', () => {
      cursorDot.style.width = '10px';
      cursorDot.style.height = '10px';
      cursorDot.style.background = '#b28855';
    });
  });
}

if (hasGSAP) {
/* ---------------- HERO scroll reactivity ---------------- */
if (!prefersReduced) {
  gsap.to('.hero-video', {
    scale: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero-media', {
    yPercent: 18,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.hero-content', {
    yPercent: -40,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
} else {
  document.getElementById('heroVideo').removeAttribute('autoplay');
}

/* ---------------- HORIZONTAL COLLECTION SCROLL ---------------- */
function buildCollectionScroll() {
  const track = document.getElementById('collectionTrack');
  const pin = document.querySelector('.collection-pin');
  if (!track || !pin) return;

  // kill previous instance if resized
  ScrollTrigger.getAll().forEach(st => { if (st.vars.id === 'collectionScroll') st.kill(); });

  if (window.innerWidth <= 600) return; // native scroll-snap on mobile

  const trackWidth = track.scrollWidth;
  const viewportWidth = window.innerWidth;
  const distance = trackWidth - viewportWidth + 80;

  if (distance <= 0) return;

  gsap.to(track, {
    x: -distance,
    ease: 'none',
    scrollTrigger: {
      id: 'collectionScroll',
      trigger: '.collection',
      start: 'top top',
      end: () => '+=' + distance,
      scrub: 0.6,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });
}
buildCollectionScroll();
window.addEventListener('resize', () => {
  clearTimeout(window._ctResize);
  window._ctResize = setTimeout(() => { ScrollTrigger.refresh(); buildCollectionScroll(); }, 250);
});

/* ---------------- LIFESTYLE PARALLAX ---------------- */
if (!prefersReduced) {
  gsap.to('.lifestyle-media img', {
    yPercent: -14,
    ease: 'none',
    scrollTrigger: { trigger: '.lifestyle', start: 'top bottom', end: 'bottom top', scrub: true }
  });
}

/* ---------------- REVEAL ON SCROLL ---------------- */
const revealTargets = document.querySelectorAll(
  '.intro-text, .intro-image, .craft-head, .craft-row, .philosophy-inner, .lifestyle-split-text, .lifestyle-split-img, .final-content, .cta-inner'
);
revealTargets.forEach(el => el.classList.add('reveal'));

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach(el => io.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add('is-in'));
}

/* ---------------- MAGNETIC CTA ---------------- */
document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    gsap.to(el, { x: x * 0.28, y: y * 0.5, duration: 0.4, ease: 'power3.out' });
  });
  el.addEventListener('mouseleave', () => {
    gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
  });
});



}

/* ---------------- FINAL refresh ---------------- */
if (hasGSAP) window.addEventListener('load', () => ScrollTrigger.refresh());
