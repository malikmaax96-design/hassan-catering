/* ============================================================
   HASSAN CATERING — script.js
   Navbar · Menu Tabs · Scroll Reveals · Antigravity Physics
   ============================================================ */

// ── NAVBAR SCROLL ──────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ── HAMBURGER MENU ─────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── MENU TABS ──────────────────────────────────────────────
document.querySelectorAll('.menu-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.menu-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + target).classList.add('active');
  });
});

// ── SCROLL REVEAL ──────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(
  '.service-card, .package-card, .venue-card, .testimonial-card, ' +
  '.pillar, .about-img-main, .contact-detail, .menu-item, .trust-item, .accred-item'
).forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// ── CONTACT FORM ───────────────────────────────────────────
function handleSubmit(e) {
  e.preventDefault();
  const btn     = document.getElementById('submitBtn');
  const success = document.getElementById('formSuccess');
  btn.textContent = 'Sending…';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Send Enquiry';
    btn.disabled = false;
    success.style.display = 'block';
    e.target.reset();
    setTimeout(() => { success.style.display = 'none'; }, 5000);
  }, 1200);
}

// ── SMOOTH ACTIVE NAV HIGHLIGHT ────────────────────────────
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navAnchors.forEach(a => a.classList.remove('active-link'));
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active-link');
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => sectionObserver.observe(s));

// ================================================================
// ANTIGRAVITY PHYSICS ENGINE (Matter.js)
// ================================================================
let antigravityActive = false;
let engine, render, runner, world;
let bodies = [];
let domElements = [];
let animFrame;

const AG_BTN = document.getElementById('antigravityBtn');
const AG_OVERLAY = document.getElementById('agOverlay');

AG_BTN.addEventListener('click', enableAntigravity);

function enableAntigravity() {
  if (antigravityActive) return;
  antigravityActive = true;
  AG_BTN.style.display = 'none';
  AG_OVERLAY.style.display = 'block';

  const { Engine, Runner, Bodies, Body, Events, Mouse, MouseConstraint, Composite, World } = Matter;

  engine = Engine.create({ gravity: { x: 0, y: 0 } });
  world  = engine.world;
  runner = Runner.create();
  Runner.run(runner, engine);

  const W = window.innerWidth;
  const H = document.body.scrollHeight;

  // Invisible walls + floor + ceiling
  const walls = [
    Bodies.rectangle(W / 2, -25,    W, 50,  { isStatic: true }),  // top
    Bodies.rectangle(W / 2, H + 25, W, 50,  { isStatic: true }),  // bottom
    Bodies.rectangle(-25,   H / 2,  50, H,  { isStatic: true }),  // left
    Bodies.rectangle(W + 25, H / 2, 50, H,  { isStatic: true }),  // right
  ];
  Composite.add(world, walls);

  // Gather elements to float
  const selectors = [
    'h1','h2','h3','.section-tag','.btn-primary','.btn-outline',
    '.service-icon','.stat','.trust-item','.hero-badge',
    '.package-badge','.stars','.reviewer-avatar','.contact-icon',
    '.pillar-icon','.ag-icon','.accred-icon','.trust-icon',
    'nav', '.footer-bottom'
  ];

  const nodeList = [];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (!nodeList.includes(el)) nodeList.push(el);
    });
  });

  // Scroll offset before we freeze layout
  const scrollY = window.scrollY;

  nodeList.forEach(el => {
    const rect = el.getBoundingClientRect();
    const absTop  = rect.top + scrollY;
    const absLeft = rect.left;
    const w = Math.max(rect.width,  20);
    const h = Math.max(rect.height, 20);
    const cx = absLeft + w / 2;
    const cy = absTop  + h / 2;

    // Clone node into fixed position overlay
    const clone = el.cloneNode(true);
    Object.assign(clone.style, {
      position:  'fixed',
      left:      rect.left + 'px',
      top:       rect.top  + 'px',
      width:     w + 'px',
      height:    h + 'px',
      margin:    '0',
      zIndex:    '9997',
      pointerEvents: 'all',
      cursor:    'grab',
      boxSizing: 'border-box',
    });
    document.body.appendChild(clone);

    // Hide original
    el.style.visibility = 'hidden';

    const body = Bodies.rectangle(cx, absTop + rect.height / 2, w, h, {
      restitution: 0.6,
      friction:    0.08,
      frictionAir: 0.018,
      mass:        Math.max(0.5, (w * h) / 14000),
    });

    // Give a random initial velocity
    Body.setVelocity(body, {
      x: (Math.random() - 0.5) * 12,
      y: (Math.random() - 0.5) * 12,
    });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.18);

    Composite.add(world, body);
    bodies.push(body);
    domElements.push({ el: clone, body, origEl: el, w, h });
  });

  // Mouse constraint for dragging
  const mouse = Mouse.create(document.body);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: 0.2,
      render: { visible: false }
    }
  });
  Composite.add(world, mouseConstraint);

  // Viewport-relative positions (for scroll compensation)
  function sync() {
    domElements.forEach(({ el, body, w, h }) => {
      const pX = body.position.x - w / 2;
      const pY = body.position.y - window.scrollY - h / 2;
      el.style.left      = pX + 'px';
      el.style.top       = pY + 'px';
      el.style.transform = `rotate(${body.angle}rad)`;
    });
    animFrame = requestAnimationFrame(sync);
  }
  sync();

  // Gravity well — pull elements gently toward cursor on mouse move
  document.addEventListener('mousemove', attractToCursor);
  function attractToCursor(e) {
    if (!antigravityActive) return;
    const mouseX = e.clientX;
    const mouseY = e.clientY + window.scrollY;
    bodies.forEach(body => {
      const dx = mouseX - body.position.x;
      const dy = mouseY - body.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 220 && dist > 0) {
        const force = 0.000012 * body.mass * (1 - dist / 220);
        Body.applyForce(body, body.position, {
          x: dx / dist * force,
          y: dy / dist * force,
        });
      }
    });
  }

  AG_BTN._attractHandler = attractToCursor;
}

function disableAntigravity() {
  if (!antigravityActive) return;
  antigravityActive = false;

  if (animFrame) cancelAnimationFrame(animFrame);
  if (runner) Matter.Runner.stop(runner);
  if (engine) Matter.Engine.clear(engine);

  // Remove clones, restore originals
  domElements.forEach(({ el, origEl }) => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
    if (origEl) origEl.style.visibility = '';
  });

  bodies      = [];
  domElements = [];

  document.removeEventListener('mousemove', AG_BTN._attractHandler);
  AG_OVERLAY.style.display = 'none';
  AG_BTN.style.display = 'flex';
}

// ── KEYBOARD SHORTCUT: press 'G' to toggle ─────────────────
window.addEventListener('keydown', e => {
  if (e.key === 'g' || e.key === 'G') {
    if (antigravityActive) disableAntigravity();
    else enableAntigravity();
  }
});
