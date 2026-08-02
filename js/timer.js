/* ============================================================
   MAGI SYSTEMS // TIMER SUBSYSTEM
   Countdown is measured in centiseconds (cs).
   ============================================================ */

let totalCs = 0, remainingCs = 0, tmrState = 'external';
let tInterval = null, rechargeAnim = null, frame = 0, tmrElapsedAtPause = 0;

const SEG_MAP = [
  [1,1,1,1,1,1,0],[0,1,1,0,0,0,0],[1,1,0,1,1,0,1],[1,1,1,1,0,0,1],
  [0,1,1,0,0,1,1],[1,0,1,1,0,1,1],[1,0,1,1,1,1,1],[1,1,1,0,0,0,0],
  [1,1,1,1,1,1,1],[1,1,1,1,0,1,1]
];

function drawSeg(ctx, x, y, seg, on, bright, dim) {
  const W = 42, H = 75, T = 7, m = T * 0.75;
  ctx.lineCap = 'round';
  ctx.lineWidth = T;
  ctx.strokeStyle = on ? bright : dim;
  ctx.beginPath();
  if      (seg === 'a') { ctx.moveTo(x+m, y+T/2);     ctx.lineTo(x+W-m, y+T/2); }
  else if (seg === 'b') { ctx.moveTo(x+W-T/2, y+m);   ctx.lineTo(x+W-T/2, y+H/2-m); }
  else if (seg === 'c') { ctx.moveTo(x+W-T/2, y+H/2+m); ctx.lineTo(x+W-T/2, y+H-m); }
  else if (seg === 'd') { ctx.moveTo(x+m, y+H-T/2);   ctx.lineTo(x+W-m, y+H-T/2); }
  else if (seg === 'e') { ctx.moveTo(x+T/2, y+H/2+m); ctx.lineTo(x+T/2, y+H-m); }
  else if (seg === 'f') { ctx.moveTo(x+T/2, y+m);     ctx.lineTo(x+T/2, y+H/2-m); }
  else if (seg === 'g') { ctx.moveTo(x+m, y+H/2);     ctx.lineTo(x+W-m, y+H/2); }
  ctx.stroke();
}

function drawDigit(ctx, x, y, n, bright, dim) {
  const s = SEG_MAP[Math.min(9, Math.max(0, n))];
  ['a','b','c','d','e','f','g'].forEach((seg, i) => drawSeg(ctx, x, y, seg, s[i], bright, dim));
}

function drawColon(ctx, x, y, on, bright, dim) {
  ctx.fillStyle = on ? bright : dim;
  ctx.beginPath(); ctx.arc(x+6, y+22, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(x+6, y+53, 4, 0, Math.PI*2); ctx.fill();
}

function drawDot(ctx, x, y, bright) {
  ctx.fillStyle = bright;
  ctx.beginPath(); ctx.arc(x+5, y+69, 4, 0, Math.PI*2); ctx.fill();
}

function renderSeg() {
  const canvas = document.getElementById('segCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, W, H);

  const finished = remainingCs <= 0 && totalCs > 0;
  const bright = finished ? '#FF2200' : tmrState === 'internal' ? '#00FF66' : '#FF6600';
  const dim    = finished ? '#33080044' : tmrState === 'internal' ? '#00332244' : '#2a100044';

  ctx.shadowBlur = 14;
  ctx.shadowColor = bright;

  const safe = Math.max(0, remainingCs);
  const totalSec = Math.floor(safe / 100);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  const cc = safe % 100;
  const d = [Math.floor(mm/10), mm%10, Math.floor(ss/10), ss%10, Math.floor(cc/10), cc%10];

  const DW=42, GAP=5, CW=14, DOW=12;
  const contentW = DW*6 + GAP*7 + CW + DOW;
  let x = Math.floor((W - contentW) / 2);
  const y = Math.floor((H - 75) / 2);

  const colonOn = tmrState === 'internal' || (finished && Math.floor(Date.now()/500)%2===0) || tmrState === 'recharging';

  drawDigit(ctx, x, y, d[0], bright, dim); x += DW + GAP;
  drawDigit(ctx, x, y, d[1], bright, dim); x += DW + GAP;
  drawColon(ctx, x, y, colonOn, bright, dim); x += CW + GAP;
  drawDigit(ctx, x, y, d[2], bright, dim); x += DW + GAP;
  drawDigit(ctx, x, y, d[3], bright, dim); x += DW + GAP;
  drawDot(ctx, x, y, dim); x += DOW + GAP;
  drawDigit(ctx, x, y, d[4], bright, dim); x += DW + GAP;
  drawDigit(ctx, x, y, d[5], bright, dim);

  ctx.shadowBlur = 0;
}

function fmtCs(cs) {
  const s = Math.floor(Math.max(0, cs) / 100);
  return String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
}
function fmtFull(d) {
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') + ':' + String(d.getSeconds()).padStart(2,'0');
}
function updateClock() {
  document.getElementById('clkTxt').textContent = 'CLOCK: ' + fmtFull(new Date());
}
setInterval(updateClock, 1000); updateClock();

function playChime() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    [[880,0,0.22],[1320,0.15,0.2],[1760,0.28,0.28]].forEach(([freq, delay, dur]) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.connect(g); g.connect(ac.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, ac.currentTime + delay);
      o.frequency.exponentialRampToValueAtTime(freq * 0.88, ac.currentTime + delay + dur);
      g.gain.setValueAtTime(0, ac.currentTime + delay);
      g.gain.linearRampToValueAtTime(0.2, ac.currentTime + delay + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + dur);
      o.start(ac.currentTime + delay);
      o.stop(ac.currentTime + delay + dur + 0.05);
    });
  } catch(e) {}
}

function tmrRender() {
  const prog = document.getElementById('progFill');
  const status = document.getElementById('statusTxt');
  const finished = remainingCs <= 0 && totalCs > 0;

  const pct = totalCs > 0 ? (remainingCs / totalCs) * 100 : 100;
  prog.style.width = Math.max(0, pct) + '%';
  prog.className = 'nge-progress-fill' +
    (finished ? ' finished' : tmrState === 'internal' ? ' running' : tmrState === 'recharging' ? ' running' : '');

  if (finished) {
    status.textContent = '!! POWER DEPLETED !!'; status.className = 'nge-status alert';
  } else if (tmrState === 'recharging') {
    status.textContent = 'RECHARGING'; status.className = 'nge-status alert';
  } else if (tmrState === 'internal') {
    status.textContent = 'INTERNAL POWER'; status.className = 'nge-status';
  } else {
    status.textContent = totalCs > 0 ? 'EXTERNAL POWER' : 'STANDBY'; status.className = 'nge-status';
  }

  const btnI = document.getElementById('btnInternal');
  const btnE = document.getElementById('btnExternal');
  const rRow = document.getElementById('rechargeRow');
  if (btnI) btnI.classList.toggle('on', tmrState === 'internal');
  if (btnE) btnE.classList.toggle('on', tmrState !== 'internal');
  if (rRow) rRow.classList.toggle('visible', tmrState === 'external' && totalCs > 0 && remainingCs < totalCs);

  const elapsedCs = totalCs - remainingCs;
  document.getElementById('sdTotal').textContent = fmtCs(totalCs);
  document.getElementById('sdElapsed').textContent = fmtCs(elapsedCs);
  document.getElementById('sdRemain').textContent = fmtCs(Math.max(0, remainingCs));

  const pwrDraw = document.getElementById('pwrDraw');
  const pwrState = document.getElementById('pwrState');
  if (pwrDraw && pwrState) {
    if (tmrState === 'internal' && totalCs > 0) {
      const totalHr = totalCs / 100 / 3600;
      const kw = 3000 / totalHr;
      pwrDraw.textContent = kw >= 1000 ? (kw/1000).toFixed(2)+' MW' : kw.toFixed(1)+' kW';
      pwrDraw.className = 'nge-data-val hi';
      pwrState.textContent = 'INTERNAL';
    } else if (tmrState === 'recharging' && tmrElapsedAtPause > 0) {
      const pctGone = (totalCs - remainingCs) / totalCs;
      const kwhSpent = pctGone * 3000;
      const elapsedHr = tmrElapsedAtPause / 100 / 3600;
      const ckw = kwhSpent / elapsedHr;
      pwrDraw.textContent = (ckw >= 1000 ? '+' + (ckw/1000).toFixed(2)+' MW' : '+' + ckw.toFixed(1)+' kW');
      pwrDraw.className = 'nge-data-val warn';
      pwrState.textContent = 'RECHARGING';
    } else {
      pwrDraw.textContent = '0 W';
      pwrDraw.className = 'nge-data-val';
      pwrState.textContent = finished ? 'DEPLETED' : 'EXTERNAL';
    }
  }

  frame++;
  document.getElementById('frameTxt').textContent = 'FRAME ' + String(frame).padStart(6,'0');
  renderSeg();
}

function setPreset(s) {
  if (tmrState !== 'external') return;
  totalCs = s * 100; remainingCs = totalCs; tmrElapsedAtPause = 0; tmrRender();
}

function setCustom() {
  if (tmrState !== 'external') return;
  const m = parseInt(document.getElementById('inMin').value) || 0;
  const s = parseInt(document.getElementById('inSec').value) || 0;
  totalCs = (m * 60 + s) * 100; remainingCs = totalCs; tmrElapsedAtPause = 0;
  tmrRender();
}

function switchInternal() {
  if (tmrState === 'recharging' || !totalCs) return;
  if (remainingCs <= 0) { remainingCs = totalCs; }
  if (tmrState === 'internal') return;
  tmrState = 'internal';
  playChime();
  clearInterval(tInterval);

  // Wall-clock based so the countdown stays accurate when the OS throttles
  // background timers (phones do this aggressively).
  const startCs = remainingCs;
  const t0 = performance.now();
  tInterval = setInterval(() => {
    remainingCs = Math.round(startCs - (performance.now() - t0) / 10);
    if (remainingCs <= 0) {
      remainingCs = 0;
      tmrState = 'external';
      tmrElapsedAtPause = totalCs;
      clearInterval(tInterval); tInterval = null;
    }
    tmrRender();
  }, 10);
  tmrRender();
}

function switchExternal() {
  if (tmrState === 'recharging' || tmrState === 'external') return;
  tmrState = 'external';
  tmrElapsedAtPause = totalCs - remainingCs;
  clearInterval(tInterval); tInterval = null;
  tmrRender();
}

function startRecharge() {
  if (tmrState !== 'external' || remainingCs >= totalCs || !totalCs) return;
  tmrElapsedAtPause = totalCs - remainingCs;
  tmrState = 'recharging';
  const startCs = remainingCs;
  const delta = totalCs - startCs;
  const t0 = performance.now();
  const DURATION = 3500;
  clearInterval(rechargeAnim);
  rechargeAnim = setInterval(() => {
    const prog = Math.min(1, (performance.now() - t0) / DURATION);
    remainingCs = Math.round(startCs + delta * prog);
    tmrRender();
    if (prog >= 1) {
      remainingCs = totalCs;
      tmrElapsedAtPause = 0;
      tmrState = 'external';
      clearInterval(rechargeAnim); rechargeAnim = null;
      tmrRender();
    }
  }, 16);
  tmrRender();
}

setInterval(() => { if (!document.hidden) renderSeg(); }, 33);
document.addEventListener('visibilitychange', () => { if (!document.hidden) tmrRender(); });
tmrRender();
