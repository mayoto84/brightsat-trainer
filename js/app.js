// js/app.js  —  BrightSAT Trainer main engine

/* ═══════════════════════════════════════════
   SOUND EFFECTS  (Web Audio API, no files)
═══════════════════════════════════════════ */
var _audioCtx = null;
function _getAudio() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return _audioCtx;
}
function _tone(freq, type, startSec, dur, gain) {
  var ctx = _getAudio(); if (!ctx) return;
  var osc = ctx.createOscillator();
  var g   = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ctx.currentTime + startSec);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startSec + dur);
  osc.start(ctx.currentTime + startSec);
  osc.stop(ctx.currentTime + startSec + dur);
}
function playCorrectSound() {
  // Two ascending sine tones — bright "ding-ding"
  _tone(523, 'sine', 0,    0.18, 0.28);
  _tone(784, 'sine', 0.12, 0.25, 0.22);
}
function playWrongSound() {
  // Descending buzz — short, not annoying
  var ctx = _getAudio(); if (!ctx) return;
  var osc = ctx.createOscillator();
  var g   = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.28);
  g.gain.setValueAtTime(0.18, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.28);
}
function playStartSound() {
  // Rising three-note fanfare — energetic but quick
  [[330, 0], [440, 0.10], [523, 0.20], [659, 0.32]].forEach(function(p) {
    _tone(p[0], 'sine', p[1], 0.18, 0.22);
  });
}
function playCompleteSound() {
  // Triumphant ascending chord sweep
  [[262, 0], [330, 0.08], [392, 0.16], [523, 0.26], [659, 0.38]].forEach(function(p) {
    _tone(p[0], 'sine', p[1], 0.45, 0.28);
  });
}

/* ═══════════════════════════════════════════
   QUESTIONS  (assembled from data files)
═══════════════════════════════════════════ */
var QUESTIONS = [].concat(
  window.READING_QUESTIONS || [],
  window.WRITING_QUESTIONS || [],
  window.MATH_QUESTIONS    || []
);

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
var state = Store.getState();
function saveQ(id, patch) { Store.saveQ(state, id, patch); }
var introMode = 'math';
var introDomain = 'all';
var pendingDeleteUser = null;
var completedTestRecorded = false;

/* ═══════════════════════════════════════════
   SCORING CURVE  200–800 per section
═══════════════════════════════════════════ */
var CURVE = [
  [0,200],[0.10,290],[0.20,360],[0.30,420],[0.40,480],
  [0.50,540],[0.60,590],[0.70,640],[0.80,690],[0.90,740],[1.0,800]
];
function scaled(pct) {
  if (pct <= 0) return 200;
  if (pct >= 1) return 800;
  for (var i = 0; i < CURVE.length - 1; i++) {
    var x1 = CURVE[i][0], y1 = CURVE[i][1];
    var x2 = CURVE[i+1][0], y2 = CURVE[i+1][1];
    if (pct >= x1 && pct <= x2) {
      var t = (pct - x1) / (x2 - x1);
      return Math.round((y1 + t * (y2 - y1)) / 10) * 10;
    }
  }
  return 200;
}

/* ═══════════════════════════════════════════
   DOMAIN HELPERS
═══════════════════════════════════════════ */
function domainsFor(section) {
  var set = [];
  QUESTIONS.forEach(function(q) {
    if ((section === 'all' || q.section === section) && set.indexOf(q.domain) === -1)
      set.push(q.domain);
  });
  return set;
}

/* ═══════════════════════════════════════════
   WORKING LIST
═══════════════════════════════════════════ */
var TEST_SIZE = 20;
var list = [], pos = 0, reviewMode = false;
function buildList() {
  var sec = $('f-section').value;
  var dom = $('f-domain').value;
  var arr = reviewMode
    ? QUESTIONS.filter(function(q) { return state[q.id] && state[q.id].flagged; })
    : QUESTIONS.filter(function(q) {
        return (sec === 'all' || q.section === sec) && (dom === 'all' || q.domain === dom);
      });
  // Weighted shuffle: unanswered questions score 0–0.55, answered score 0.45–1.0.
  // The ~10% overlap keeps the mix feeling random while new questions drift
  // toward the front of each 20-question set.
  arr = arr.slice().map(function(q) {
    var isNew = !state[q.id] || !state[q.id].answered;
    return { q: q, score: isNew ? Math.random() * 0.55 : 0.45 + Math.random() * 0.55 };
  }).sort(function(a, b) {
    return a.score - b.score;
  }).map(function(x) { return x.q; });
  if (!reviewMode) arr = arr.slice(0, TEST_SIZE);
  list = arr;
  completedTestRecorded = false;
  if (pos >= list.length) pos = 0;
}

/* ═══════════════════════════════════════════
   GRID ANSWER CHECKING
═══════════════════════════════════════════ */
function normNum(s) {
  s = String(s).trim();
  if (s === '') return null;
  if (/^-?\d+\/\d+$/.test(s)) {
    var p = s.split('/');
    var v = parseFloat(p[0]) / parseFloat(p[1]);
    return isFinite(v) ? v : null;
  }
  var n = parseFloat(s);
  return isFinite(n) ? n : null;
}
function gridCorrect(input, accepts) {
  var a = String(input).trim().toLowerCase();
  for (var i = 0; i < accepts.length; i++) {
    if (a === String(accepts[i]).trim().toLowerCase()) return true;
  }
  var n = normNum(input);
  if (n === null) return false;
  for (var j = 0; j < accepts.length; j++) {
    var m = normNum(accepts[j]);
    if (m !== null && Math.abs(m - n) < 1e-6) return true;
  }
  return false;
}

/* ═══════════════════════════════════════════
   TIMER
═══════════════════════════════════════════ */

// Official Digital SAT timing per module (one of two modules per section).
// The countdown scales this pacing to the active practice set size.
var SAT_RATES = {
  rw:   { qPerMin: 27 / 32, totalQ: 27, label: 'Reading & Writing', minutes: 32 },
  math: { qPerMin: 22 / 35, totalQ: 22, label: 'Math', minutes: 35 },
  all:  { qPerMin: 49 / 64, totalQ: 49, label: 'Mixed', minutes: 64 }
};

var timer = {
  running: false,
  startMs: null,   // wall-clock timestamp of last resume
  pausedMs: 0,     // ms accumulated before last pause
  sessionAnswered: 0,
  _tick: null
};

function _timerElapsed() {
  return timer.pausedMs + (timer.startMs ? Date.now() - timer.startMs : 0);
}

function _timerRate() {
  var sec = $('f-section').value;
  return SAT_RATES[sec] || SAT_RATES.all;
}

function _timerLimitMs() {
  var rate = _timerRate();
  var questionCount = Math.max(1, list.length || TEST_SIZE);
  return Math.round((questionCount / rate.qPerMin) * 60000);
}

function _fmtTime(ms) {
  var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  s = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

function timerToggle() {
  if (timer.running) {
    timer.pausedMs = _timerElapsed();
    timer.startMs = null;
    timer.running = false;
    clearInterval(timer._tick);
    $('timer-toggle').textContent = 'Resume';
  } else {
    if (timer.pausedMs === 0 && timer.sessionAnswered === 0) {
      // Fresh start — hide filters, show question card, play fanfare
      collapseFilters();
      showQuestionCard();
      playStartSound();
    }
    timer.startMs = Date.now();
    timer.running = true;
    timer._tick = setInterval(updateTimerUI, 500);
    $('timer-toggle').textContent = 'Pause';
    $('timer-toggle').classList.remove('btn-start');
    updateTimerUI();
  }
}

function timerReset() {
  clearInterval(timer._tick);
  timer.running = false;
  timer.startMs = null;
  timer.pausedMs = 0;
  timer.sessionAnswered = 0;
  completedTestRecorded = false;
  $('timer-toggle').textContent = 'Start';
  $('timer-toggle').classList.add('btn-start');
  state = Store.clearAnswers(); // wipe per-question answers; keep flags
  expandFilters();
  hideQuestionCard();
  updateTimerUI();
}

function timerStop() {
  if (!timer.running) return;
  timer.pausedMs = _timerElapsed();
  timer.startMs = null;
  timer.running = false;
  clearInterval(timer._tick);
  $('timer-toggle').textContent = 'Resume';
  updateTimerUI();
}

function timerElapsedMs() {
  return Math.min(_timerElapsed(), _timerLimitMs());
}

// Called whenever a question is submitted (correct or wrong)
function timerOnAnswer() {
  // Auto-start on first answer so the timer is never forgotten
  if (!timer.running && timer.pausedMs === 0) timerToggle();
  timer.sessionAnswered++;
  updateTimerUI();
}

function updateTimerUI() {
  var elapsed = _timerElapsed();
  var limitMs = _timerLimitMs();
  var remaining = Math.max(0, limitMs - elapsed);
  var elapsedMin = Math.min(elapsed, limitMs) / 60000;

  $('timer-clock').textContent = _fmtTime(remaining);
  $('timer-clock').classList.toggle('timer-warning', remaining > 0 && remaining <= 300000);
  $('timer-clock').classList.toggle('timer-expired', remaining === 0);

  if (timer.running && remaining === 0) {
    clearInterval(timer._tick);
    timer.pausedMs = limitMs;
    timer.startMs = null;
    timer.running = false;
    $('timer-toggle').textContent = 'Resume';
  }

  var rate = _timerRate();
  var questionCount = Math.max(1, list.length || TEST_SIZE);
  var allocMin = Math.round(limitMs / 60000);
  $('timer-section-badge').textContent = rate.label + ' · ' + questionCount + ' questions · ' + allocMin + ' min';

  $('tstat-required').textContent = rate.qPerMin.toFixed(1);

  // Correct / incorrect counts from session answers
  var sessionCorrect = list.filter(function(q) {
    return state[q.id] && state[q.id].answered && state[q.id].correct;
  }).length;
  var sessionWrong = list.filter(function(q) {
    return state[q.id] && state[q.id].answered && !state[q.id].correct;
  }).length;
  $('tstat-correct').textContent = sessionCorrect;
  $('tstat-wrong').textContent   = sessionWrong;
  $('pace-progress').textContent = timer.sessionAnswered + ' / ' + questionCount;
  // Mobile compact bar
  $('tmb-correct').textContent  = '✓ ' + sessionCorrect;
  $('tmb-wrong').textContent    = '✗ ' + sessionWrong;
  $('tmb-progress').textContent = timer.sessionAnswered + ' / ' + questionCount;

  // Not enough time for meaningful stats yet
  if (elapsedMin < 0.05) {
    $('tstat-pace').textContent = '—';
    $('pace-fill').style.width  = '0%';
    $('pace-needle').style.left = '0%';
    var st0 = $('pace-status-text');
    st0.textContent = remaining === 0 ? 'Time expired' : '';
    st0.className   = 'pace-status-text';
    $('tstat-pace-wrap').className = 'tstat';
    return;
  }

  var actualRate  = timer.sessionAnswered / elapsedMin;
  var targetByNow = Math.min(questionCount, elapsedMin * rate.qPerMin);
  var diff        = timer.sessionAnswered - targetByNow; // + ahead, − behind

  $('tstat-pace').textContent = actualRate.toFixed(1);

  // Pace bar: position relative to the active practice set size.
  var totalQ    = questionCount;
  var fillPct   = Math.min(100, (timer.sessionAnswered / totalQ) * 100);
  var needlePct = Math.min(100, (targetByNow / totalQ) * 100);
  $('pace-fill').style.width  = fillPct   + '%';
  $('pace-needle').style.left = needlePct + '%';

  // Status + colour the "Your Q/min" box
  var st   = $('pace-status-text');
  var wrap = $('tstat-pace-wrap');
  if (remaining === 0 && timer.sessionAnswered < questionCount) {
    st.textContent = 'Time expired';
    st.className   = 'pace-status-text behind';
    wrap.className = 'tstat tstat-warn';
  } else if (diff >= 0.5) {
    var ahead = Math.floor(diff + 0.5);
    st.textContent = '▲ ' + ahead + (ahead === 1 ? ' Q ahead' : ' Q ahead');
    st.className   = 'pace-status-text ahead';
    wrap.className = 'tstat tstat-ok';
  } else if (diff <= -0.5) {
    var behind = Math.ceil(Math.abs(diff));
    st.textContent = '▼ ' + behind + (behind === 1 ? ' Q behind' : ' Q behind');
    st.className   = 'pace-status-text behind';
    wrap.className = 'tstat tstat-warn';
  } else {
    st.textContent = '✓ On pace';
    st.className   = 'pace-status-text on-pace';
    wrap.className = 'tstat tstat-ok';
  }
}

/* ═══════════════════════════════════════════
   XP / STREAK / CELEBRATION
═══════════════════════════════════════════ */
var XP_PER_CORRECT = 10;
var consecutiveCorrect = 0;

function awardXP(correct) {
  if (!correct) { consecutiveCorrect = 0; return; }
  consecutiveCorrect++;
  var bonus = (consecutiveCorrect >= 5) ? 5 : 0;
  var pts = XP_PER_CORRECT + bonus;
  var xpData = Store.addXP(pts);
  updateXPBar(xpData);
}

function showXPToast(text) {
  var t = document.createElement('div');
  t.className = 'xp-toast';
  t.textContent = text;
  document.body.appendChild(t);
  requestAnimationFrame(function() {
    t.classList.add('xp-toast-show');
    setTimeout(function() {
      t.classList.add('xp-toast-hide');
      setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 400);
    }, 1200);
  });
}

function showStreakCelebration(n) {
  var modal = $('celebration-modal');
  $('celebration-text').textContent = n + '-question streak!';
  $('celebration-bonus').textContent = '+5 XP bonus per correct answer active';
  modal.classList.remove('hidden');
  setTimeout(function() { modal.classList.add('hidden'); }, 3000);
}

function updateXPBar(xpData) {
  if (!xpData) xpData = Store.getXP();
  updateUserUI();
  $('header-xp').textContent = xpData.xp + ' XP';
  $('header-streak').textContent = xpData.streak + (xpData.streak === 1 ? ' day' : ' days');
  $('streak-flame').classList.toggle('streak-active', xpData.streak >= 2);
}

/* ═══════════════════════════════════════════
   RENDERING
═══════════════════════════════════════════ */
var explainOpen = false;

function $(id) { return document.getElementById(id); }

function escHtml(s) {
  return String(s).replace(/[&<>"]/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function modeLabel(mode) {
  if (mode === 'math') return 'Math';
  if (mode === 'rw') return 'Reading & Writing';
  return 'Both';
}

function setIntroMode(mode) {
  introMode = mode || 'all';
  Array.from(document.querySelectorAll('.mode-option')).forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === introMode);
  });
  refreshIntroDomainOptions();
}

function refreshIntroDomainOptions(preferred) {
  var sel = $('intro-domain');
  var current = preferred !== undefined ? preferred : sel.value;
  var domains = domainsFor(introMode);
  sel.innerHTML = '<option value="all">Random</option>';
  domains.forEach(function(domain) {
    var o = document.createElement('option');
    o.value = domain;
    o.textContent = domain;
    sel.appendChild(o);
  });
  if (Array.from(sel.options).some(function(o) { return o.value === current; })) {
    sel.value = current;
  } else {
    sel.value = 'all';
  }
  introDomain = sel.value;
}

function userFocusLabel(user) {
  return modeLabel(user.mode) + ' - ' + (user.domain && user.domain !== 'all' ? user.domain : 'Random');
}

function renderUserList() {
  var users = Store.getUsers();
  var card = $('returning-users-card');
  var listEl = $('user-list');
  listEl.innerHTML = '';
  card.classList.toggle('hidden', users.length === 0);

  users
    .slice()
    .sort(function(a, b) { return String(b.lastSeen || '').localeCompare(String(a.lastSeen || '')); })
    .forEach(function(user) {
      var row = document.createElement('div');
      row.className = 'user-row';
      row.innerHTML = '<span><b>' + escHtml(user.handle) + '</b><span>' + escHtml(userFocusLabel(user)) + '</span></span>';

      var actions = document.createElement('div');
      actions.className = 'user-actions';

      var continueBtn = document.createElement('button');
      continueBtn.className = 'user-action continue';
      continueBtn.type = 'button';
      continueBtn.textContent = 'Continue';
      continueBtn.onclick = function() {
        Store.setActiveUser(user.slug);
        startAppForActiveUser();
      };

      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'user-action delete';
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = function() {
        openDeleteUserModal(user);
      };

      actions.appendChild(continueBtn);
      actions.appendChild(deleteBtn);
      row.appendChild(actions);
      listEl.appendChild(row);
    });
}

function showNewUserForm() {
  $('welcome-card').classList.add('hidden');
  $('welcome-stats').innerHTML = '';
  $('new-user-card').classList.remove('hidden');
  $('training-options-card').classList.remove('hidden');
  $('add-user-btn').classList.add('hidden');
  $('intro-handle').value = '';
  $('intro-error').classList.add('hidden');
  setIntroMode('math');
  refreshIntroDomainOptions('all');
  renderUserList();
}

function openDeleteUserModal(user) {
  pendingDeleteUser = user;
  $('delete-user-copy').innerHTML = 'This will permanently delete <b>' + escHtml(user.handle) + '</b>, including saved answers, flags, XP, and streak data.';
  $('delete-user-modal').classList.remove('hidden');
}

function closeDeleteUserModal() {
  pendingDeleteUser = null;
  $('delete-user-modal').classList.add('hidden');
}

function confirmDeleteUser() {
  if (!pendingDeleteUser) return;
  Store.deleteUser(pendingDeleteUser.slug);
  closeDeleteUserModal();
  showIntro();
}

function showIntro() {
  document.body.classList.add('intro-open');    // allow intro to scroll
  $('intro-screen').classList.remove('hidden');
  $('app-shell').classList.add('hidden');
  $('intro-error').classList.add('hidden');
  renderUserList();
  var active = Store.getActiveUser();
  var users = Store.getUsers();

  if (active) {
    state = Store.getState();
    $('welcome-title').textContent = 'Welcome Back ' + active.handle + '!';
    renderWelcomeStats();
    $('welcome-card').classList.remove('hidden');
    $('new-user-card').classList.add('hidden');
    $('training-options-card').classList.remove('hidden');
    $('add-user-btn').classList.remove('hidden');
    setIntroMode(active.mode || 'all');
    refreshIntroDomainOptions(active.domain || 'all');
  } else if (users.length > 0) {
    var latest = users.slice().sort(function(a, b) { return String(b.lastSeen || '').localeCompare(String(a.lastSeen || '')); })[0];
    Store.setActiveUser(latest.slug);
    showIntro();
  } else {
    showNewUserForm();
  }
}

function updateUserUI() {
  var user = Store.getActiveUser();
  $('change-user').textContent = user ? user.handle : 'Choose user';
}

function collapseFilters() {
  $('filter-card').classList.add('filters-hidden');
  $('timer-change-btn').classList.remove('hidden');
  $('timer-mobile-bar').classList.remove('hidden');
  document.querySelector('.tabs').classList.add('test-active');
}

function expandFilters() {
  $('filter-card').classList.remove('filters-hidden');
  $('timer-change-btn').classList.add('hidden');
  $('timer-mobile-bar').classList.add('hidden');
  document.querySelector('.tabs').classList.remove('test-active');
}

function showQuestionCard() {
  $('test-ready-card').classList.add('hidden');
  $('qcard').classList.remove('hidden');
}

function hideQuestionCard() {
  $('test-ready-card').classList.remove('hidden');
  $('qcard').classList.add('hidden');
}

function renderWelcomeStats() {
  var ls = Store.getLifetimeStats();
  var answered = ls.totalAnswered || 0;
  var correct  = ls.totalCorrect  || 0;
  var accuracy = answered ? Math.round(100 * correct / answered) + '%' : '0%';

  // Estimated scores
  function secScore(sec) {
    var sd = (ls.bySection || {})[sec];
    if (!sd || !sd.answered) return null;
    return scaled(sd.correct / sd.answered);
  }
  var rwScore   = secScore('rw');
  var mathScore = secScore('math');
  var totalScore = (rwScore && mathScore) ? rwScore + mathScore
                 : (rwScore || mathScore) ? (rwScore || 200) + (mathScore || 200)
                 : null;
  $('wsb-total').textContent = totalScore ? totalScore : '—';
  $('wsb-math').textContent  = mathScore  ? mathScore  : '—';
  $('wsb-rw').textContent    = rwScore    ? rwScore    : '—';
  var xpData = Store.getXP();
  var activity = Store.getActivity();
  var completed = activity.completedTests || {};
  $('welcome-stats').innerHTML =
    '<div class="welcome-stat"><b>' + answered + '</b><span>Answered</span></div>' +
    '<div class="welcome-stat"><b>' + accuracy + '</b><span>Accuracy</span></div>' +
    '<div class="welcome-stat"><b>' + xpData.xp + '</b><span>XP</span></div>' +
    '<div class="welcome-stat"><b>' + xpData.streak + '</b><span>Day streak</span></div>' +
    '<div class="welcome-stat"><b>' + (completed.math || 0) + '</b><span>Math tests</span></div>' +
    '<div class="welcome-stat"><b>' + (completed.rw || 0) + '</b><span>R&W tests</span></div>' +
    '<div class="welcome-stat"><b>' + (completed.all || 0) + '</b><span>Both tests</span></div>';
}

function startAppForActiveUser() {
  var user = Store.getActiveUser();
  if (!user) {
    showIntro();
    return;
  }

  state = Store.getState();
  reviewMode = false;
  pos = 0;
  $('f-section').value = user.mode || 'all';
  document.body.classList.remove('intro-open'); // lock scroll for test
  $('intro-screen').classList.add('hidden');
  $('app-shell').classList.remove('hidden');
  updateUserUI();
  refreshDomainOptions();
  var wantedDomain = user.domain || 'all';
  $('f-domain').value = Array.from($('f-domain').options).some(function(o) { return o.value === wantedDomain; }) ? wantedDomain : 'all';
  buildList();
  timerReset();
  render();
  updateXPBar();
}

function createUserFromIntro() {
  var handle = $('intro-handle').value;
  introDomain = $('intro-domain').value || 'all';
  var user = Store.createOrSelectUser(handle, introMode, introDomain);
  if (!user) {
    $('intro-error').textContent = 'Enter a handle using at least one letter or number.';
    $('intro-error').classList.remove('hidden');
    return;
  }
  startAppForActiveUser();
  timerToggle(); // auto-start the selected test
}

function startFromIntro() {
  var active = Store.getActiveUser();
  introDomain = $('intro-domain').value || 'all';
  if (active && $('new-user-card').classList.contains('hidden')) {
    Store.saveUserMode(introMode, introDomain);
    startAppForActiveUser();
    timerToggle(); // auto-start the countdown
    return;
  }
  createUserFromIntro();
}

function render() {
  // All answered → test complete
  if (list.length > 0 && list.every(function(q){ return state[q.id] && state[q.id].answered; })) {
    if (!reviewMode && !completedTestRecorded && timer.sessionAnswered > 0) {
      Store.recordPracticeComplete($('f-section').value);
      completedTestRecorded = true;
      playCompleteSound();
    }
    timerStop();
    var tc = list.filter(function(q){ return state[q.id].correct; }).length;
    var tp = Math.round(100*tc/list.length);
    var emoji = tp>=80?'🎉':tp>=60?'👍':'📚';
    var elapsedText = _fmtTime(timerElapsedMs());
    $('qempty-msg').innerHTML =
      '<div class="tc-emoji">'+emoji+'</div>'+
      '<div class="tc-score">'+tc+' / '+list.length+'</div>'+
      '<div class="tc-pct">'+tp+'% correct</div>'+
      '<div class="tc-time">Completed in '+elapsedText+'</div>'+
      '<div class="tc-breakdown">'+
        '<span class="score-correct">✓ '+tc+' correct</span> &nbsp; '+
        '<span class="score-wrong">✗ '+(list.length-tc)+' wrong</span>'+
      '</div>';
    $('exitreviewbtn').textContent = 'New Test →';
    $('exitreviewbtn').onclick = function(){ pos=0; buildList(); timerReset(); render(); };
    $('exitreviewbtn').classList.remove('hidden');
    var vpBtn = $('view-progress-btn');
    if (!vpBtn) {
      vpBtn = document.createElement('button');
      vpBtn.id = 'view-progress-btn';
      vpBtn.className = 'btn subtle';
      vpBtn.style.marginTop = '8px';
      vpBtn.textContent = 'View my progress';
      vpBtn.onclick = function() { $('tab-progress').onclick(); };
      $('exitreviewbtn').parentNode.insertBefore(vpBtn, $('exitreviewbtn').nextSibling);
    }
    vpBtn.classList.remove('hidden');
    $('qempty').classList.remove('hidden');
    $('qcontent').classList.add('hidden');
    $('pbar').style.width='100%';
    $('qpos').textContent='Test complete';
    $('qright').innerHTML='<span class="score-correct">✓ '+tc+'</span> · <span class="score-wrong">✗ '+(list.length-tc)+'</span> · <span class="score-pct">'+tp+'%</span>';
    return;
  }

  if (list.length === 0) {
    $('qempty').classList.remove('hidden');
    $('qcontent').classList.add('hidden');
    $('qempty-msg').textContent = 'No questions match this filter' +
      (reviewMode ? ' — you have no flagged questions yet.' : '.');
    $('exitreviewbtn').classList.toggle('hidden', !reviewMode);
    if ($('view-progress-btn')) $('view-progress-btn').classList.add('hidden');
    $('pbar').style.width = '0%';
    $('qpos').textContent = '—';
    $('qright').textContent = '';
    return;
  }
  $('qempty').classList.add('hidden');
  $('qcontent').classList.remove('hidden');

  var q = list[pos];
  var st = state[q.id] || {};

  // Meta chips
  var sname = q.section === 'rw' ? 'Reading & Writing' : 'Math';
  var meta = '<span class="chip">' + sname + '</span><span class="chip">' + escHtml(q.domain) + '</span>';
  if (q.skill) meta += '<span class="chip skill">' + escHtml(q.skill) + '</span>';
  if (st.flagged) meta += '<span class="chip chip-flag">Flagged</span>';
  $('qmeta').innerHTML = meta;

  // Passage
  if (q.passage) {
    $('qpassage').textContent = q.passage;
    $('qpassage').classList.remove('hidden');
  } else {
    $('qpassage').classList.add('hidden');
  }
  $('qstem').textContent = q.stem;

  var answered = !!st.answered;

  // Choices vs grid
  if (q.type === 'mc') {
    $('qgrid').classList.add('hidden');
    $('qchoices').classList.remove('hidden');
    var letters = ['A','B','C','D','E','F'];
    $('qchoices').innerHTML = '';
    q.choices.forEach(function(c, i) {
      var b = document.createElement('button');
      b.className = 'choice';
      b.type = 'button';
      b.innerHTML = '<span class="ltr">' + letters[i] + '</span><span>' + escHtml(c) + '</span>';
      if (answered) {
        b.disabled = true;
        if (i === q.answer) b.classList.add('correct');
        if (st.chosen === i && i !== q.answer) b.classList.add('wrong');
      }
      b.onclick = (function(idx) {
        return function() {
          if (answered) return;
          var correct = idx === q.answer;
          saveQ(q.id, { chosen: idx, answered: true, correct: correct });
          Store.recordAnswer(q, correct);
          if (correct) playCorrectSound(); else playWrongSound();
          awardXP(correct);
          timerOnAnswer();
          explainOpen = false;
          render();
        };
      })(i);
      $('qchoices').appendChild(b);
    });
  } else {
    $('qchoices').classList.add('hidden');
    $('qgrid').classList.remove('hidden');
    var inp = $('gridinput');
    inp.value = (st.chosen !== undefined && st.chosen !== null) ? st.chosen : '';
    inp.disabled = answered;
    $('gridsubmit').disabled = answered;
  }

  // Action row — MC auto-scores on click so no "Check answer" button needed
  $('checkbtn').classList.toggle('hidden', q.type !== 'grid' || answered);
  $('checkbtn').disabled = false;
  $('flagbtn').textContent = st.flagged ? 'Unflag' : 'Flag';
  $('flagbtn').classList.toggle('flagged', !!st.flagged);

  // Feedback — compact one-liner shown only after answering
  var fb = $('feedback'), ex = $('explain');
  if (answered) {
    fb.className = 'feedback show ' + (st.correct ? 'ok' : 'no');
    if (q.type === 'mc') {
      fb.innerHTML = st.correct
        ? '<span class="fb-icon">✓</span><span class="fb-msg">Correct</span>'
        : '<span class="fb-icon">✗</span><span class="fb-msg">Incorrect — correct answer: <b>' +
          ['A','B','C','D','E','F'][q.answer] + '</b></span>';
    } else {
      fb.innerHTML = st.correct
        ? '<span class="fb-icon">✓</span><span class="fb-msg">Correct</span>'
        : '<span class="fb-icon">✗</span><span class="fb-msg">Incorrect — accepted: <b>' +
          escHtml(q.answer.join(' or ')) + '</b></span>';
    }
  } else {
    fb.className = 'feedback';
    fb.innerHTML = '';
  }

  // Explanation
  ex.innerHTML = '<h4>How it\'s solved</h4>' + escHtml(q.explanation);
  ex.classList.toggle('hidden', !(answered || explainOpen));
  $('explainbtn').textContent = ex.classList.contains('hidden') ? 'Show explanation' : 'Hide explanation';

  // Nav
  var isLast = pos === list.length - 1;
  var hasUnanswered = list.some(function(q) { return !state[q.id] || !state[q.id].answered; });
  $('prevbtn').disabled = pos === 0;
  // Block Next until the current question is answered
  $('nextbtn').disabled = !answered || isLast;
  $('nextbtn').textContent = (isLast && answered && hasUnanswered) ? 'Review remaining →' : 'Next →';
  $('qpos').textContent = 'Question ' + (pos + 1) + ' of ' + list.length;
  var doneInList    = list.filter(function(x){ return state[x.id] && state[x.id].answered; }).length;
  var correctInList = list.filter(function(x){ return state[x.id] && state[x.id].answered && state[x.id].correct; }).length;
  var wrongInList   = doneInList - correctInList;
  var pctStr = doneInList ? Math.round(100*correctInList/doneInList)+'%' : '';
  $('qright').innerHTML = doneInList===0
    ? '<span style="color:var(--muted)">0 answered</span>'
    : '<span class="score-correct">✓ '+correctInList+'</span> <span class="score-sep">·</span> <span class="score-wrong">✗ '+wrongInList+'</span> <span class="score-sep">·</span> <span class="score-pct">'+pctStr+'</span>';
  $('pbar').style.width = (100 * (pos + 1) / list.length) + '%';
}

/* ═══════════════════════════════════════════
   ACTIONS
═══════════════════════════════════════════ */
function checkMC() {
  // MC is now scored instantly on choice click — this is a no-op fallback
}

function checkGrid() {
  var q = list[pos];
  var val = $('gridinput').value;
  if (String(val).trim() === '') return;
  var ok = gridCorrect(val, q.answer);
  saveQ(q.id, { chosen: val, answered: true, correct: ok });
  Store.recordAnswer(q, ok);
  if (ok) playCorrectSound(); else playWrongSound();
  awardXP(ok);
  timerOnAnswer();
  explainOpen = false;
  render();
}

function slideUpFeedback(correct) {
  var banner = $('slide-banner');
  banner.textContent = correct ? '✓ Correct!' : '✗ Incorrect';
  banner.className = 'slide-banner ' + (correct ? 'slide-ok' : 'slide-no') + ' slide-show';
  clearTimeout(window._bannerTimer);
  window._bannerTimer = setTimeout(function() {
    banner.classList.remove('slide-show');
  }, 1800);
}

function next() {
  if (pos < list.length - 1) { pos++; explainOpen = false; render(); return; }
  // At last position — jump to first unanswered question if any
  var firstUnanswered = list.findIndex(function(q) { return !state[q.id] || !state[q.id].answered; });
  if (firstUnanswered !== -1) { pos = firstUnanswered; explainOpen = false; render(); }
}
function prev() { if (pos > 0) { pos--; explainOpen = false; render(); } }
function toggleFlag() {
  var q = list[pos];
  var st = state[q.id] || {};
  saveQ(q.id, { flagged: !st.flagged });
  render();
}
function toggleExplain() { explainOpen = !explainOpen; render(); }
function exitReview() {
  reviewMode = false;
  $('tab-practice').click();
  buildList(); pos = 0; render();
}

/* ═══════════════════════════════════════════
   PROGRESS VIEW
═══════════════════════════════════════════ */
function crownLevel(answeredCount, accuracy, totalInDomain) {
  var pctAnswered = totalInDomain > 0 ? answeredCount / totalInDomain : 0;
  if (pctAnswered < 0.1) return 0;
  if (accuracy === null) return 0;
  if (accuracy >= 95 && pctAnswered >= 0.8) return 5;
  if (accuracy >= 85 && pctAnswered >= 0.6) return 4;
  if (accuracy >= 70 && pctAnswered >= 0.4) return 3;
  if (accuracy >= 55 && pctAnswered >= 0.2) return 2;
  return 1;
}

function renderCrowns(level) {
  var full = '★', empty = '☆';
  var s = '';
  for (var i = 0; i < 5; i++) s += (i < level) ? full : empty;
  return '<span class="crowns level-' + level + '">' + s + '</span>';
}

function renderProgress() {
  var ls = Store.getLifetimeStats();
  var totalAns = ls.totalAnswered || 0;
  var totalCor = ls.totalCorrect  || 0;
  $('st-answered').textContent = totalAns;
  $('st-correct').textContent  = totalCor;
  $('st-acc').textContent      = totalAns ? Math.round(100 * totalCor / totalAns) + '%' : '0%';
  $('st-flag').textContent = QUESTIONS.filter(function(q) { return state[q.id] && state[q.id].flagged; }).length;

  function sectionScore(sec) {
    var sd = (ls.bySection || {})[sec];
    if (!sd || !sd.answered) return null;
    return { score: scaled(sd.correct / sd.answered), n: sd.answered };
  }

  var rw = sectionScore('rw'), m = sectionScore('math');
  $('sc-rw').textContent   = rw ? rw.score : '—';
  $('sc-math').textContent = m  ? m.score  : '—';
  if (rw && m) {
    $('sc-total').textContent = rw.score + m.score;
  } else if (rw || m) {
    $('sc-total').textContent = (rw ? rw.score : 200) + (m ? m.score : 200);
  } else {
    $('sc-total').textContent = '—';
  }

  var parts = [];
  if (rw) parts.push('R&W based on ' + rw.n + ' attempts');
  if (m)  parts.push('Math based on ' + m.n  + ' attempts');
  $('score-note').textContent = (parts.length ? parts.join('; ') + '. ' : 'Answer some questions to see an estimate. ') +
    'Scores are estimates from your accuracy so far (200–800 per section). Not official College Board scores.';

  // Domain breakdown table — reads from lifetime stats
  var domains = [];
  QUESTIONS.forEach(function(q) {
    if (!domains.find(function(d) { return d.name === q.domain; }))
      domains.push({ name: q.domain, section: q.section });
  });

  var body = $('bd-body');
  body.innerHTML = '';
  domains.forEach(function(d) {
    var qs  = QUESTIONS.filter(function(q) { return q.domain === d.name; });
    var dd  = ((ls.byDomain || {})[d.name]) || { answered: 0, correct: 0 };
    var aLen = dd.answered;
    var c    = dd.correct;
    var acc  = aLen ? Math.round(100 * c / aLen) : null;
    // Cap pctAnswered at 1 since repeat attempts can exceed pool size
    var cl = crownLevel(Math.min(aLen, qs.length), acc, qs.length);

    var color = '#9aa3af', bg = '#eef1f6';
    if (acc !== null) {
      if (acc >= 80) { color = '#fff'; bg = 'var(--good)'; }
      else if (acc >= 60) { color = '#7a5200'; bg = '#fcebcd'; }
      else { color = '#fff'; bg = 'var(--bad)'; }
    }

    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + escHtml(d.name) + renderCrowns(cl) +
      '<br><span style="font-size:11px;color:var(--muted)">' +
      (d.section === 'rw' ? 'Reading & Writing' : 'Math') + '</span></td>' +
      '<td class="num">' + aLen + '</td>' +
      '<td class="num bd-hide-mobile">' + c + '</td>' +
      '<td class="num">' + (acc !== null
        ? '<span class="acc-pill" style="color:' + color + ';background:' + bg + '">' + acc + '%</span>'
        : '—') + '</td>';
    body.appendChild(tr);
  });

  $('savewarn').classList.toggle('hidden', Store.isAvailable());
  updateXPBar();
}

/* ═══════════════════════════════════════════
   WIRING
═══════════════════════════════════════════ */
function refreshDomainOptions() {
  var sec = $('f-section').value;
  var sel = $('f-domain');
  var cur = sel.value;
  sel.innerHTML = '<option value="all">All topics</option>';
  domainsFor(sec).forEach(function(d) {
    var o = document.createElement('option');
    o.value = d; o.textContent = d;
    sel.appendChild(o);
  });
  if (Array.from(sel.options).some(function(o) { return o.value === cur; })) sel.value = cur;
  else sel.value = 'all';
}

$('f-section').onchange = function() { Store.saveUserMode($('f-section').value, 'all'); refreshDomainOptions(); reviewMode = false; pos = 0; buildList(); timerReset(); render(); };
$('f-domain').onchange  = function() { Store.saveUserMode($('f-section').value, $('f-domain').value); pos = 0; buildList(); timerReset(); render(); };
$('filter-edit-btn').onclick = expandFilters;
$('timer-change-btn').onclick = function() { timerReset(); };
$('checkbtn').onclick   = checkMC;
$('gridsubmit').onclick = checkGrid;
$('gridinput').addEventListener('keydown', function(e) { if (e.key === 'Enter') checkGrid(); });
$('explainbtn').onclick = toggleExplain;
$('flagbtn').onclick    = toggleFlag;
$('nextbtn').onclick    = next;
$('prevbtn').onclick    = prev;

$('reviewflagged').onclick = function() {
  reviewMode = true;
  $('tab-practice').click();
  pos = 0; buildList(); timerReset(); collapseFilters(); showQuestionCard(); render();
};
$('resetbtn').onclick = function() {
  if (confirm('Reset all answers, scores, and flags? This cannot be undone.')) {
    state = {};
    Store.setState(state);
    Store.setLifetimeStats({ totalAnswered: 0, totalCorrect: 0, bySection: {}, byDomain: {} });
    pos = 0;
    reviewMode = false;
    buildList();
    timerReset();
    render();
    // Always land on the Practice tab so the user sees questions immediately
    $('tab-practice').classList.add('active');
    $('tab-progress').classList.remove('active');
    $('view-practice').classList.remove('hidden');
    $('view-progress').classList.add('hidden');
  }
};
$('resetxpbtn').onclick = function() {
  if (confirm('Reset XP and streak? This cannot be undone.')) {
    Store.setXP({ xp: 0, streak: 0, lastDate: null, sessionXP: 0 });
    updateXPBar();
  }
};

$('tab-practice').onclick = function() {
  $('tab-practice').classList.add('active');
  $('tab-progress').classList.remove('active');
  $('view-practice').classList.remove('hidden');
  $('view-progress').classList.add('hidden');
};
$('tab-progress').onclick = function() {
  $('tab-progress').classList.add('active');
  $('tab-practice').classList.remove('active');
  $('view-progress').classList.remove('hidden');
  $('view-practice').classList.add('hidden');
  renderProgress();
};
$('welcome-progress-btn').onclick = function() {
  startAppForActiveUser();
  $('tab-progress').click();
};

$('cel-close').onclick    = function() { $('celebration-modal').classList.add('hidden'); };
$('delete-user-cancel').onclick = closeDeleteUserModal;
$('delete-user-confirm').onclick = confirmDeleteUser;
$('delete-user-modal').onclick = function(e) {
  if (e.target === $('delete-user-modal')) closeDeleteUserModal();
};
$('timer-toggle').onclick = timerToggle;
$('timer-reset').onclick  = timerReset;
$('intro-start').onclick  = startFromIntro;
$('add-user-btn').onclick = showNewUserForm;
$('intro-handle').addEventListener('keydown', function(e) { if (e.key === 'Enter') startFromIntro(); });
$('intro-domain').onchange = function() { introDomain = $('intro-domain').value || 'all'; };
$('change-user').onclick = function() {
  timerReset();
  showIntro();
};
$('brand-home').onclick = function() {
  timerReset();
  var users = Store.getUsers();
  if (!Store.getActiveUser() && users.length > 0) {
    var latest = users.slice().sort(function(a, b) { return String(b.lastSeen || '').localeCompare(String(a.lastSeen || '')); })[0];
    Store.setActiveUser(latest.slug);
  }
  showIntro();
};
Array.from(document.querySelectorAll('.mode-option')).forEach(function(btn) {
  btn.onclick = function() { setIntroMode(btn.getAttribute('data-mode')); refreshIntroDomainOptions('all'); };
});

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
$('bankcount').textContent = TEST_SIZE + '-question practice tests';
Store.init(function() {
  state = Store.getState();
  setIntroMode(introMode);
  if (Store.getActiveUser()) {
    startAppForActiveUser();
  } else {
    showIntro();
  }
});
