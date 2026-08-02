/* ============================================================
   MAGI SYSTEMS // SUPERCOMPUTER CORE ARRAY
   ============================================================ */

const cores = [0,1,2,3,4,5].map(i => ({ id: i, busy: false }));
let taskIdCounter = 0;
let paperLog = [];
let continuousRunning = false;
let continuousLoopActive = false;

function flashPath(id, color, duration) {
  duration = duration || 800;
  const p = document.getElementById(id);
  if (!p) return;
  p.classList.remove('flash-green', 'flash-red');
  void p.offsetWidth;
  p.classList.add('flash-' + color);
  setTimeout(() => p.classList.remove('flash-' + color), duration);
}

function setIndicators(prefix, on, red) {
  const inds = document.querySelectorAll('[id^="' + prefix + '-"]');
  inds.forEach(el => {
    el.classList.toggle('on', on);
    el.classList.toggle('red', !!red);
  });
}

function setCompActive(id, on) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('active', on);
}
function setCompAlert(id, on) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('alert', on);
}

function updateStatus(text, cls) {
  const s = document.getElementById('scStatus');
  s.textContent = text;
  s.className = 'sc-status' + (cls ? ' ' + cls : '');
}

function updateFooter() {
  const anyBusy = cores.some(c => c.busy);
  document.getElementById('scFootTask').textContent =
    'TASKS: ' + taskIdCounter + ' | QUEUE: ' + (continuousRunning ? 'CONTINUOUS' : (anyBusy ? 'ACTIVE' : 'IDLE'));
}

function openInputModal() {
  const singleBtn = document.getElementById('inputSingleBtn');
  const questionBtn = document.getElementById('inputQuestionBtn');
  const locked = continuousRunning;
  if (singleBtn) { singleBtn.disabled = locked; singleBtn.style.opacity = locked ? '0.3' : ''; singleBtn.style.cursor = locked ? 'not-allowed' : ''; }
  if (questionBtn) { questionBtn.disabled = locked; questionBtn.style.opacity = locked ? '0.3' : ''; questionBtn.style.cursor = locked ? 'not-allowed' : ''; }
  openModal('inputModal');
}
function openPaperModal() { renderPaper(); openModal('paperModal'); }

/* ---------- tape reels ---------- */
const reelData = [0, 0, 0];
const REEL_CIRC = 2 * Math.PI * 21;

function updateReel(discId) {
  const pct = reelData[discId];
  const pctEl = document.getElementById('reelPct' + discId);
  const fillEl = document.getElementById('reelFill' + discId);
  const svgEl = document.getElementById('reelSvg' + discId);
  if (pctEl) pctEl.textContent = pct + '%';
  if (fillEl) {
    const filled = REEL_CIRC * (pct / 100);
    fillEl.setAttribute('stroke-dasharray', filled.toFixed(2) + ' ' + (REEL_CIRC - filled).toFixed(2));
  }
  if (svgEl) {
    if (pct > 0) {
      svgEl.classList.add('spinning');
      const spd = pct <= 25 ? 4 : pct <= 50 ? 2.5 : pct <= 75 ? 1.5 : 0.8;
      svgEl.style.animationDuration = spd + 's';
    } else {
      svgEl.classList.remove('spinning');
      svgEl.style.animationDuration = '';
    }
  }
}

function setIdleLight(coreId, on) {
  const el = document.getElementById('indCore' + coreId + '-0');
  if (el) el.classList.toggle('idle-blink', on);
}

function setIndPartial(coreId, indices, on, red) {
  indices.forEach(i => {
    const el = document.getElementById('indCore' + coreId + '-' + i);
    if (!el) return;
    el.classList.toggle('on', on);
    el.classList.toggle('red', !!red);
  });
}

/* ---------- paper output log ---------- */
function addPaperEntry(title, body) {
  paperLog.unshift({ ts: ts(), title: title, body: body });
  if (paperLog.length > 200) paperLog = paperLog.slice(0, 200);
  const p = document.getElementById('compPrinter');
  p.classList.add('printing');
  setTimeout(() => p.classList.remove('printing'), 900);
}

function renderPaper() {
  const out = document.getElementById('paperOutput');
  if (paperLog.length === 0) {
    out.innerHTML = '<div style="color:var(--nge-muted);font-size:10px;text-align:center;padding:30px 0;">[ NO ENTRIES ]</div>';
    return;
  }
  out.innerHTML = paperLog.map(e =>
    '<div class="paper-entry">' +
      '<div><span class="ts">[' + e.ts + ']</span><span class="title">' + escapeHtml(e.title) + '</span></div>' +
      '<div class="body">' + escapeHtml(e.body) + '</div>' +
    '</div>'
  ).join('');
}

function clearPaper() { paperLog = []; renderPaper(); }

/* ---------- input modes ---------- */
async function chooseSingle() {
  closeModal('inputModal');
  runSingleTask();
}

function toggleContinuous() {
  closeModal('inputModal');
  if (continuousRunning) {
    continuousRunning = false;
    document.getElementById('continuousBtn').classList.remove('active');
  } else {
    continuousRunning = true;
    document.getElementById('continuousBtn').classList.add('active');
    runContinuous();
  }
}

async function runContinuous() {
  if (continuousLoopActive) return;
  continuousLoopActive = true;
  while (continuousRunning) {
    await runSingleTask();
    if (!continuousRunning) break;
    await wait(rand(300, 900));
  }
  continuousLoopActive = false;
}

function chooseQuestion() {
  closeModal('inputModal');
  openModal('questionModal');
  setTimeout(() => document.getElementById('questionInput').focus(), 60);
}

function submitQuestion() {
  const q = document.getElementById('questionInput').value.trim();
  if (!q) return;
  document.getElementById('questionInput').value = '';
  closeModal('questionModal');
  runQuestionTask(q);
}

document.getElementById('questionInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitQuestion();
});

/* ---------- task pipelines ---------- */
async function runSingleTask() {
  const size = rand(8, 100);
  const taskId = ++taskIdCounter;
  updateStatus('TASK-' + String(taskId).padStart(4,'0') + ' SIZE:' + String(size).padStart(3,'0'), 'active');
  updateFooter();

  const interpTime = 400 + size * 8;
  const coreTime = 600 + size * 22;

  const inInt = pick([1, 2]);

  flashPath('p-di-int' + inInt, 'green');
  await wait(500);

  setIndicators('indInt' + inInt, true);
  setCompActive('compInt' + inInt, true);
  await wait(interpTime);
  setIndicators('indInt' + inInt, false);
  setCompActive('compInt' + inInt, false);

  flashPath('p-int' + inInt + '-hub', 'green');
  await wait(450);

  setIndicators('indHub', true);
  setCompActive('compHub', true);
  await wait(300);
  setIndicators('indHub', false);
  setCompActive('compHub', false);

  let coreId = cores.findIndex(c => !c.busy);
  if (coreId === -1) coreId = rand(0, 5);
  cores[coreId].busy = true;
  setIdleLight(coreId, false);
  updateFooter();

  flashPath('p-hub-socket' + coreId, 'green');
  await wait(350);
  flashPath('p-socket' + coreId + '-core' + coreId, 'green');
  await wait(300);

  setIndicators('indCore' + coreId, true);
  setCompActive('compCore' + coreId, true);

  const discActivityCount = rand(0, 3);
  for (let i = 0; i < discActivityCount; i++) {
    setTimeout(() => { if (cores[coreId].busy) doDiscAccess(coreId); }, rand(200, Math.max(300, coreTime - 300)));
  }

  await wait(coreTime);
  setIndicators('indCore' + coreId, false);
  setCompActive('compCore' + coreId, false);

  flashPath('p-socket' + coreId + '-core' + coreId, 'green');
  await wait(300);
  flashPath('p-hub-socket' + coreId, 'green');
  await wait(350);
  cores[coreId].busy = false;
  setIdleLight(coreId, true);
  updateFooter();

  const outInt = 3 - inInt;
  flashPath('p-int' + outInt + '-hub', 'green');
  await wait(450);

  setIndicators('indInt' + outInt, true);
  setCompActive('compInt' + outInt, true);
  await wait(interpTime);
  setIndicators('indInt' + outInt, false);
  setCompActive('compInt' + outInt, false);

  flashPath('p-int' + outInt + '-paper', 'green');
  await wait(400);

  const outLen = Math.max(16, size * 2);
  let bin = '';
  for (let i = 0; i < outLen; i++) bin += Math.random() < 0.5 ? '0' : '1';

  addPaperEntry(
    'TASK-' + String(taskId).padStart(4,'0') + ' // SIZE:' + String(size).padStart(3,'0') + ' // CORE-' + String(coreId+1).padStart(2,'0'),
    bin
  );

  if (!cores.some(c => c.busy) && !continuousRunning) updateStatus('STANDBY');
  else if (continuousRunning) updateStatus('CONTINUOUS', 'active');
  updateFooter();
}

async function runQuestionTask(question) {
  const taskId = ++taskIdCounter;
  updateStatus('QUERY-' + String(taskId).padStart(4,'0'), 'active');
  updateFooter();

  flashPath('p-di-int1', 'green');
  flashPath('p-di-int2', 'green');
  await wait(400);
  setIndicators('indInt1', true); setCompActive('compInt1', true);
  setIndicators('indInt2', true); setCompActive('compInt2', true);
  await wait(900);
  setIndicators('indInt1', false); setCompActive('compInt1', false);
  setIndicators('indInt2', false); setCompActive('compInt2', false);

  flashPath('p-int1-hub', 'green');
  flashPath('p-int2-hub', 'green');
  await wait(500);
  setIndicators('indHub', true); setCompActive('compHub', true);
  await wait(500);
  setIndicators('indHub', false); setCompActive('compHub', false);

  const options = ['YES', 'NO', 'MAYBE', 'WHY?'];
  const responses = [];
  for (let i = 0; i < 6; i++) {
    cores[i].busy = true;
    setIdleLight(i, false);
    flashPath('p-hub-socket' + i, 'green');
    flashPath('p-socket' + i + '-core' + i, 'green');
  }
  updateFooter();
  await wait(350);
  for (let i = 0; i < 6; i++) {
    setIndicators('indCore' + i, true);
    setCompActive('compCore' + i, true);
  }
  await wait(1500 + rand(0, 500));

  for (let i = 0; i < 6; i++) {
    responses.push(pick(options));
    setIndicators('indCore' + i, false);
    setCompActive('compCore' + i, false);
    flashPath('p-socket' + i + '-core' + i, 'green');
    flashPath('p-hub-socket' + i, 'green');
    cores[i].busy = false;
    setIdleLight(i, true);
  }
  updateFooter();
  await wait(600);

  flashPath('p-int1-hub', 'green');
  flashPath('p-int2-hub', 'green');
  setIndicators('indInt1', true); setCompActive('compInt1', true);
  setIndicators('indInt2', true); setCompActive('compInt2', true);
  await wait(800);
  setIndicators('indInt1', false); setCompActive('compInt1', false);
  setIndicators('indInt2', false); setCompActive('compInt2', false);

  flashPath('p-int1-paper', 'green');
  flashPath('p-int2-paper', 'green');
  await wait(400);

  const body = 'Q: ' + question + '\n' +
    responses.map((r, i) => '  CORE-' + String(i+1).padStart(2,'0') + ' > ' + r).join('\n');
  addPaperEntry('QUERY-' + String(taskId).padStart(4,'0'), body);

  if (!cores.some(c => c.busy) && !continuousRunning) updateStatus('STANDBY');
  updateFooter();
}

/* ---------- ambient activity ---------- */
function doDiscAccess(coreId) {
  if (!cores[coreId] || !cores[coreId].busy) return;
  const discId = rand(0, 2);
  const uploading = Math.random() < 0.65;
  reelData[discId] = uploading
    ? Math.min(100, reelData[discId] + rand(12, 28))
    : Math.max(0, reelData[discId] - rand(1, 4));
  updateReel(discId);
  flashPath('p-socket' + coreId + '-core' + coreId, 'green', 500);
  flashPath('p-hub-socket' + coreId, 'green', 500);
  setTimeout(() => {
    flashPath('p-hub-mdm', 'green', 500);
    flashPath('p-mdm-disc' + discId, 'green', 500);
    setCompActive('compMdm', true);
    setCompActive('compDisc' + discId, true);
    setIndicators('indMdm', true);
    setTimeout(() => {
      setCompActive('compMdm', false);
      setCompActive('compDisc' + discId, false);
      setIndicators('indMdm', false);
    }, 600);
  }, 150);
}

async function doChat(a, b) {
  setIdleLight(a, false); setIdleLight(b, false);
  flashPath('p-socket' + a + '-core' + a, 'green', 600);
  flashPath('p-hub-socket' + a, 'green', 600);
  await wait(180);
  flashPath('p-hub-socket' + b, 'green', 600);
  flashPath('p-socket' + b + '-core' + b, 'green', 600);
  setIndPartial(a, [0,1,2], true, false);
  setIndPartial(b, [0,1,2], true, false);
  setCompActive('compCore' + a, true);
  setCompActive('compCore' + b, true);
  await wait(700);
  setIndPartial(a, [0,1,2], false);
  setIndPartial(b, [0,1,2], false);
  setCompActive('compCore' + a, false);
  setCompActive('compCore' + b, false);
  if (!cores[a].busy) setIdleLight(a, true);
  if (!cores[b].busy) setIdleLight(b, true);
}

async function doHousekeepDelete(coreId) {
  const discId = rand(0, 2);
  reelData[discId] = Math.max(0, reelData[discId] - rand(2, 6));
  updateReel(discId);
  setIdleLight(coreId, false);
  flashPath('p-socket' + coreId + '-core' + coreId, 'red', 700);
  flashPath('p-hub-socket' + coreId, 'red', 700);
  setIndPartial(coreId, [3,4,5], true, true);
  setCompAlert('compCore' + coreId, true);
  await wait(200);
  flashPath('p-hub-mdm', 'red', 700);
  flashPath('p-mdm-disc' + discId, 'red', 700);
  setCompAlert('compMdm', true);
  setCompAlert('compDisc' + discId, true);
  setIndicators('indMdm', true, true);
  await wait(700);
  setIndPartial(coreId, [3,4,5], false);
  setCompAlert('compCore' + coreId, false);
  setCompAlert('compMdm', false);
  setCompAlert('compDisc' + discId, false);
  setIndicators('indMdm', false);
  if (!cores[coreId].busy) setIdleLight(coreId, true);
}

setInterval(() => {
  if (document.hidden) return;
  const idle = cores.filter(c => !c.busy);
  if (idle.length < 2) return;
  if (Math.random() < 0.45) {
    const a = pick(idle);
    const rest = idle.filter(c => c.id !== a.id);
    const b = pick(rest);
    if (a && b) doChat(a.id, b.id);
  }
}, 2600);

setInterval(() => {
  if (document.hidden) return;
  const idle = cores.filter(c => !c.busy);
  if (idle.length === 0) return;
  if (Math.random() < 0.3) {
    const c = pick(idle);
    doHousekeepDelete(c.id);
  }
}, 3800);

updateStatus('STANDBY');
updateFooter();
cores.forEach(c => setIdleLight(c.id, true));
