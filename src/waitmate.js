/**
 * wait-mate — tiny delightful waiting animations for long-running tasks.
 * Vanilla JS, zero dependencies. MIT license.
 *
 * Usage:
 *   import { WaitMate } from './src/waitmate.js';
 *
 *   // wrap any async activity:
 *   WaitMate.start(fetchData(), { scene: 'walker', message: 'Fetching…' });
 *
 *   // or manual control:
 *   WaitMate.start();        // begins animation overlay
 *   ...
 *   WaitMate.stop();         // ends it (optionally with a flourish)
 *
 * Design conventions borrowed from loaders.css / SpinKit:
 *   - animate only transform/opacity (GPU-friendly, no layout thrash)
 *   - prefers-reduced-motion respected: static dots instead of theatrics
 */

const OVERLAY_ID = 'waitmate-overlay';

const SCENES = {
  walker: renderWalker,   // canvas: a little character strolling across a floor
  dots: renderDots,       // CSS: three bouncing dots (SpinKit-style)
  orbit: renderOrbit,     // CSS: dot circling a ring with a trailing comet
  meter: renderMeter,     // CSS: progress theatrics — bar that fakes progress
  sleepy: renderSleepy,   // emoji idle: sleepy companion with Zzz
};

let active = null; // { overlay, raf, timers }

function reducedMotion() {
  return window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ensureOverlay(message) {
  let el = document.getElementById(OVERLAY_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = OVERLAY_ID;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    Object.assign(el.style, {
      position: 'fixed', inset: '0', zIndex: 2147483646,
      display: 'flex', flexDirection: 'column', gap: '14px',
      alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 17, 21, 0.55)',
      backdropFilter: 'blur(2px)', color: '#f4f4f5',
      fontFamily: 'system-ui, sans-serif', fontSize: '14px',
      opacity: '0', transition: 'opacity 220ms ease',
    });
    document.body.appendChild(el);
  }
  el.innerHTML = '';
  const label = document.createElement('div');
  label.textContent = message || 'Working on it…';
  el.appendChild(label);
  return el;
}

/* ---------------- scenes ---------------- */

function renderDots(overlay) {
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;gap:8px;';
  for (let i = 0; i < 3; i++) {
    const d = document.createElement('div');
    d.style.cssText = `width:10px;height:10px;border-radius:50%;background:#8ab4ff;
      animation: wm-bounce 1.1s ${i * 0.16}s infinite ease-in-out;`;
    box.appendChild(d);
  }
  const style = document.createElement('style');
  style.textContent = `@keyframes wm-bounce {
    0%,80%,100% { transform: translateY(0); opacity:.5; }
    40% { transform: translateY(-14px); opacity:1; }
  }`;
  overlay.appendChild(style);
  overlay.appendChild(box);
}

function renderOrbit(overlay) {
  const ring = document.createElement('div');
  ring.style.cssText = `width:52px;height:52px;border-radius:50%;
    border:3px solid rgba(138,180,255,.25);position:relative;`;
  const comet = document.createElement('div');
  comet.style.cssText = `position:absolute;top:-7px;left:50%;width:12px;height:12px;
    margin-left:-6px;border-radius:50%;background:#8ab4ff;
    transform-origin:6px 33px;animation:wm-orbit 1.4s linear infinite;`;
  ring.appendChild(comet);
  const style = document.createElement('style');
  style.textContent = '@keyframes wm-orbit { to { transform: rotate(360deg); } }';
  overlay.appendChild(style);
  overlay.appendChild(ring);
}

function renderMeter(overlay) {
  const track = document.createElement('div');
  track.style.cssText = 'width:220px;height:8px;border-radius:6px;background:#2a2d33;overflow:hidden;';
  const bar = document.createElement('div');
  bar.style.cssText = 'width:0;height:100%;background:linear-gradient(90deg,#8ab4ff,#c58aff);border-radius:6px;';
  track.appendChild(bar);
  overlay.appendChild(track);
  // faked asymptotic progress: never quite finishes (classic waiting theatrics)
  let p = 0;
  const timer = setInterval(() => {
    p += (95 - p) * 0.06 + 0.4;
    bar.style.width = Math.min(p, 95) + '%';
  }, 180);
  active.timers.push(timer);
}

function renderSleepy(overlay) {
  const face = document.createElement('div');
  face.textContent = '😴';
  face.style.cssText = 'font-size:44px;animation:wm-snore 2.6s ease-in-out infinite;';
  const zzz = document.createElement('div');
  zzz.textContent = 'z Z z';
  zzz.style.cssText = 'font-size:16px;opacity:.7;animation:wm-drift 2.6s ease-in-out infinite;';
  const style = document.createElement('style');
  style.textContent = `@keyframes wm-snore {
    0%,100% { transform: scale(1); }
    50% { transform: scale(1.08) rotate(-2deg); }
  }
  @keyframes wm-drift {
    0% { transform: translateY(0); opacity:.2; }
    50% { transform: translateY(-8px); opacity:.8; }
    100% { transform: translateY(-16px); opacity:0; }
  }`;
  overlay.appendChild(style);
  overlay.appendChild(face);
  overlay.appendChild(zzz);
}

// canvas scene: tiny walking character with swinging legs
function renderWalker(overlay) {
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 360 * dpr; canvas.height = 120 * dpr;
  canvas.style.cssText = 'width:360px;height:120px;';
  overlay.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  let t = 0, raf;
  const floorY = 100;
  function draw() {
    t += 0.09;
    ctx.clearRect(0, 0, 360, 120);
    // scrolling floor
    ctx.strokeStyle = '#3a3f47'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(360, floorY); ctx.stroke();
    for (let i = -1; i < 15; i++) {
      const x = ((i * 30 - (t * 8) % 30) + 360) % 390;
      ctx.beginPath(); ctx.moveTo(x, floorY); ctx.lineTo(x - 8, floorY + 10); ctx.stroke();
    }
    // character: head + body + two swinging legs
    const bob = Math.sin(t * 2) * 2;
    const cx = 180, cy = 62 + bob;
    ctx.strokeStyle = '#8ab4ff'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy - 16, 7, 0, Math.PI * 2); ctx.stroke(); // head
    ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8); ctx.stroke(); // body
    const swing = Math.sin(t * 2.2) * 9;
    ctx.beginPath(); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx + swing, cy + 24); ctx.stroke();   // leg A
    ctx.beginPath(); ctx.moveTo(cx, cy + 8); ctx.lineTo(cx - swing, cy + 24); ctx.stroke();   // leg B
    ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx - swing * 0.6, cy + 4); ctx.stroke(); // arm
    // dust puff
    ctx.fillStyle = 'rgba(138,180,255,.25)';
    ctx.beginPath(); ctx.arc(cx - 12 - ((t * 20) % 20), floorY - 2, 3, 0, Math.PI * 2); ctx.fill();
    raf = requestAnimationFrame(draw);
  }
  if (reducedMotion()) { draw(); cancelAnimationFrame(raf); }
  else draw();
  active.raf = raf;
}

/* ---------------- API ---------------- */

export const WaitMate = {
  scenes: Object.keys(SCENES),

  /**
   * Two forms:
   *   WaitMate.start(promiseLike, opts?)  → returns the same promise,
   *       animation runs until it settles (auto-stop).
   *   WaitMate.start(opts?)               → manual; call WaitMate.stop().
   * opts: { scene: 'walker'|'dots'|'orbit'|'meter'|'sleepy', message: string }
   */
  start(activity, opts = {}) {
    if (activity && typeof activity.then === 'function') {
      return WaitMate.start({ ...opts }).then(() => activity)
        .finally(() => WaitMate.stop({ message: 'Done!' }));
    }
    const scene = SCENES[opts.scene] ? opts.scene : 'walker';
    Stop_(); // clear any previous run
    const overlay = ensureOverlay(opts.message);
    active = { overlay, raf: null, timers: [] };
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    if (reducedMotion()) {
      // calm fallback: dots but frozen
      renderDots(overlay);
      overlay.querySelectorAll('div').forEach(d => (d.style.animation = 'none'));
    } else {
      SCENES[scene](overlay);
    }
    return Promise.resolve();
  },

  /** Stop the current animation. opts: { message: 'Done!' } flashes a farewell. */
  stop(opts = {}) {
    if (!active) return;
    const overlay = active.overlay;
    Stop_();
    if (opts.message) {
      overlay.textContent = opts.message;
      overlay.style.opacity = '1';
      setTimeout(() => overlay.remove(), 700);
    } else {
      overlay.remove();
    }
  },
};

function Stop_() {
  if (!active) return;
  if (active.raf) cancelAnimationFrame(active.raf);
  active.timers.forEach(clearInterval);
  active = null;
}
