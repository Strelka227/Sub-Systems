/* ============================================================
   MAGI SYSTEMS // SHELL
   Navigation, shared helpers, stage scaling, PWA plumbing.
   ============================================================ */

/* ---------- shared helpers (used by supercomputer.js) ---------- */
const wait = ms => new Promise(r => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function ts() {
  const d = new Date();
  return String(d.getHours()).padStart(2,'0') + ':' +
         String(d.getMinutes()).padStart(2,'0') + ':' +
         String(d.getSeconds()).padStart(2,'0');
}

function escapeHtml(s) {
  return String(s).replace(/[<>&"']/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&#39;' }[c]));
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(o => o.classList.remove('open'));
});

/* ---------- system navigation ---------- */
function showSystem(target) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.system === target));
  document.querySelectorAll('.system').forEach(s => s.classList.toggle('active', s.id === 'sys-' + target));
  fitStage();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showSystem(btn.dataset.system));
});

// Manifest shortcuts land on ./?system=timer etc.
const requestedSystem = new URLSearchParams(location.search).get('system');
if (requestedSystem && document.getElementById('sys-' + requestedSystem)) showSystem(requestedSystem);

/* ---------- scale the 1280x720 core array to the viewport ---------- */
const STAGE_W = 1280, STAGE_H = 720;
let lastFitWidth = -1;

function fitStage() {
  const wrap = document.getElementById('scScale');
  const stage = document.getElementById('scStage');
  if (!wrap || !stage) return;
  const avail = wrap.clientWidth;
  if (!avail || avail === lastFitWidth) return; // hidden, or nothing changed
  lastFitWidth = avail;
  const scale = Math.min(1, avail / STAGE_W);
  stage.style.transform = 'scale(' + scale + ')';
  stage.style.marginLeft = Math.max(0, (avail - STAGE_W * scale) / 2) + 'px';
  wrap.style.height = (STAGE_H * scale) + 'px';
}

window.addEventListener('resize', fitStage);
window.addEventListener('orientationchange', fitStage);
window.addEventListener('load', fitStage);
window.addEventListener('pageshow', fitStage);
if (window.visualViewport) window.visualViewport.addEventListener('resize', fitStage);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitStage());

// Catches the first real layout pass, tab switches, and any container resize.
if (window.ResizeObserver) {
  const wrapEl = document.getElementById('scScale');
  if (wrapEl) new ResizeObserver(() => fitStage()).observe(wrapEl);
}
fitStage();

/* ---------- service worker ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('MAGI // service worker registration failed:', err);
    });
  });
}

/* ---------- install prompt ---------- */
let deferredInstallPrompt = null;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  if (installBtn) installBtn.classList.add('visible');
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.classList.remove('visible');
  });
}

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  if (installBtn) installBtn.classList.remove('visible');
});
