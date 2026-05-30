// js/app.js  —  BrightSAT Trainer main engine

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
  var ord = $('f-order').value;
  var arr = reviewMode
    ? QUESTIONS.filter(function(q) { return state[q.id] && state[q.id].flagged; })
    : QUESTIONS.filter(function(q) {
        return (sec === 'all' || q.section === sec) && (dom === 'all' || q.domain === dom);
      });
  // Always shuffle for variety, then apply sort preference, then cap at TEST_SIZE
  arr = arr.slice();
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  if (ord === 'unanswered') {
    arr.sort(function(a, b) {
      return (state[b.id] && state[b.id].answered ? 0 : 1) - (state[a.id] && state[a.id].answered ? 0 : 1);
    });
  }
  if (!reviewMode) arr = arr.slice(0, TEST_SIZE);
  list = arr;
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

// Official Digital SAT timing per module (one of two modules per section)
var SAT_RATES = {
  rw:   { qPerMin: 27 / 32, totalQ: 27, label: 'R&W Module (27 Q / 32 min)' },
  math: { qPerMin: 22 / 35, totalQ: 22, label: 'Math Module (22 Q / 35 min)' },
  all:  { qPerMin: 49 / 64, totalQ: 49, label: 'Mixed (49 Q / 64 min est.)' }
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
    $('timer-toggle').textContent = '▶ Resume';
  } else {
    timer.startMs = Date.now();
    timer.running = true;
    timer._tick = setInterval(updateTimerUI, 500);
    $('timer-toggle').textContent = '⏸ Pause';
    updateTimerUI();
  }
}

function timerReset() {
  clearInterval(timer._tick);
  timer.running = false;
  timer.startMs = null;
  timer.pausedMs = 0;
  timer.sessionAnswered = 0;
  $('timer-toggle').textContent = '▶ Start';
  updateTimerUI();
}

// Called whenever a question is submitted (correct or wrong)
function timerOnAnswer() {
  // Auto-start on first answer so the timer is never forgotten
  if (!timer.running && timer.pausedMs === 0) timerToggle();
  timer.sessionAnswered++;
  updateTimerUI();
}

function updateTimerUI() {
  var elapsed    = _timerElapsed();
  var elapsedMin = elapsed / 60000;

  $('timer-clock').textContent = _fmtTime(elapsed);

  var sec  = $('f-section').value;
  var rate = SAT_RATES[sec] || SAT_RATES.all;
  $('timer-section-badge').textContent = rate.label;

  $('tstat-required').textContent = rate.qPerMin.toFixed(2);
  $('tstat-answered').textContent = timer.sessionAnswered;

  // Not enough time for meaningful stats yet
  if (elapsedMin < 0.05) {
    $('tstat-pace').textContent   = '—';
    $('tstat-target').textContent = '0';
    $('pace-fill').style.width    = '0%';
    $('pace-needle').style.left   = '0%';
    var st0 = $('pace-status-text');
    st0.textContent = '';
    st0.className   = 'pace-status-text';
    $('tstat-pace-wrap').className = 'tstat';
    return;
  }

  var actualRate   = timer.sessionAnswered / elapsedMin;
  var targetByNow  = elapsedMin * rate.qPerMin;
  var diff         = timer.sessionAnswered - targetByNow; // + ahead, − behind

  $('tstat-pace').textContent   = actualRate.toFixed(2);
  $('tstat-target').textContent = Math.ceil(targetByNow);

  // Pace bar: position relative to totalQ for this section type
  var totalQ    = rate.totalQ;
  var fillPct   = Math.min(100, (timer.sessionAnswered / totalQ) * 100);
  var needlePct = Math.min(100, (targetByNow / totalQ) * 100);
  $('pace-fill').style.width  = fillPct   + '%';
  $('pace-needle').style.left = needlePct + '%';

  // Status + colour the "Your Q/min" box
  var st   = $('pace-status-text');
  var wrap = $('tstat-pace-wrap');
  if (diff >= 0.5) {
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
  showXPToast('+' + pts + ' XP');
  updateXPBar(xpData);
  if (consecutiveCorrect === 5 || consecutiveCorrect === 10 || consecutiveCorrect === 20) {
    showStreakCelebration(consecutiveCorrect);
  }
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

function render() {
  // All answered → test complete
  if (list.length > 0 && list.every(function(q){ return state[q.id] && state[q.id].answered; })) {
    var tc = list.filter(function(q){ return state[q.id].correct; }).length;
    var tp = Math.round(100*tc/list.length);
    var emoji = tp>=80?'🎉':tp>=60?'👍':'📚';
    $('qempty-msg').innerHTML =
      '<div class="tc-emoji">'+emoji+'</div>'+
      '<div class="tc-score">'+tc+' / '+list.length+'</div>'+
      '<div class="tc-pct">'+tp+'% correct</div>'+
      '<div class="tc-breakdown">'+
        '<span class="score-correct">✓ '+tc+' correct</span> &nbsp; '+
        '<span class="score-wrong">✗ '+(list.length-tc)+' wrong</span>'+
      '</div>';
    $('exitreviewbtn').textContent = 'New Test →';
    $('exitreviewbtn').onclick = function(){ pos=0; buildList(); render(); };
    $('exitreviewbtn').classList.remove('hidden');
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
  $('prevbtn').disabled = pos === 0;
  $('nextbtn').disabled = pos === list.length - 1;
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

function next() { if (pos < list.length - 1) { pos++; explainOpen = false; render(); } }
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
  var ans = QUESTIONS.filter(function(q) { return state[q.id] && state[q.id].answered; });
  var cor = ans.filter(function(q) { return state[q.id].correct; });
  $('st-answered').textContent = ans.length;
  $('st-correct').textContent = cor.length;
  $('st-acc').textContent = ans.length ? Math.round(100 * cor.length / ans.length) + '%' : '0%';
  $('st-flag').textContent = QUESTIONS.filter(function(q) { return state[q.id] && state[q.id].flagged; }).length;

  function sectionScore(sec) {
    var a = QUESTIONS.filter(function(q) { return q.section === sec && state[q.id] && state[q.id].answered; });
    if (a.length === 0) return null;
    var c = a.filter(function(q) { return state[q.id].correct; }).length;
    return { score: scaled(c / a.length), n: a.length };
  }

  var rw = sectionScore('rw'), m = sectionScore('math');
  $('sc-rw').textContent = rw ? rw.score : '—';
  $('sc-math').textContent = m ? m.score : '—';
  if (rw && m) {
    $('sc-total').textContent = rw.score + m.score;
  } else if (rw || m) {
    $('sc-total').textContent = (rw ? rw.score : 200) + (m ? m.score : 200);
  } else {
    $('sc-total').textContent = '—';
  }

  var parts = [];
  if (rw) parts.push('R&W based on ' + rw.n + ' answered');
  if (m) parts.push('Math based on ' + m.n + ' answered');
  $('score-note').textContent = (parts.length ? parts.join('; ') + '. ' : 'Answer some questions to see an estimate. ') +
    'Scores are estimates from your accuracy so far (200–800 per section). Not official College Board scores.';

  // Domain breakdown table
  var domains = [];
  QUESTIONS.forEach(function(q) {
    if (!domains.find(function(d) { return d.name === q.domain; }))
      domains.push({ name: q.domain, section: q.section });
  });

  var body = $('bd-body');
  body.innerHTML = '';
  domains.forEach(function(d) {
    var qs = QUESTIONS.filter(function(q) { return q.domain === d.name; });
    var a = qs.filter(function(q) { return state[q.id] && state[q.id].answered; });
    var c = a.filter(function(q) { return state[q.id].correct; }).length;
    var acc = a.length ? Math.round(100 * c / a.length) : null;
    var cl = crownLevel(a.length, acc, qs.length);

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
      '<td class="num">' + a.length + '/' + qs.length + '</td>' +
      '<td class="num">' + c + '</td>' +
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

$('f-section').onchange = function() { refreshDomainOptions(); reviewMode = false; pos = 0; buildList(); render(); updateTimerUI(); };
$('f-domain').onchange  = function() { pos = 0; buildList(); render(); };
$('f-order').onchange   = function() { pos = 0; buildList(); render(); };
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
  pos = 0; buildList(); render();
};
$('resetbtn').onclick = function() {
  if (confirm('Reset all answers, scores, and flags? This cannot be undone.')) {
    state = {};
    Store.setState(state);
    pos = 0;
    reviewMode = false;
    buildList();
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

$('cel-close').onclick    = function() { $('celebration-modal').classList.add('hidden'); };
$('timer-toggle').onclick = timerToggle;
$('timer-reset').onclick  = timerReset;

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
$('bankcount').textContent = QUESTIONS.length + ' questions';
refreshDomainOptions();
buildList();
render();
updateXPBar();
updateTimerUI();
