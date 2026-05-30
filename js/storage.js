// js/storage.js  —  localStorage wrapper (swappable for any key-value store)

var Store = (function () {
  var MEM = {};
  var CACHE = {};
  var SERVER_OK = false;
  var INIT_DONE = false;
  var OK = true;
  var REG_KEY = 'brightsat_users';
  var LEGACY_STATE_KEY = 'brightsat_v1';
  var LEGACY_XP_KEY = 'brightsat_xp';
  var ACTIVITY_KEY = 'brightsat_activity';
  var STATS_KEY = 'brightsat_stats';
  try {
    var _k = '__bst_test__';
    localStorage.setItem(_k, '1');
    localStorage.removeItem(_k);
  } catch (e) {
    OK = false;
  }

  function _get(key, fallback) {
    try {
      if (CACHE[key] !== undefined) return CACHE[key];
      if (!OK) return MEM[key] !== undefined ? MEM[key] : fallback;
      var raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function _set(key, value) {
    CACHE[key] = value;
    try {
      if (!OK) MEM[key] = value;
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      MEM[key] = value;
    }
    _persistServer();
  }

  function _remove(key) {
    delete CACHE[key];
    try {
      if (!OK) delete MEM[key];
      else localStorage.removeItem(key);
    } catch (e) {
      delete MEM[key];
    }
    _persistServer();
  }

  function _hydrateLocalCache() {
    if (!OK) return;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('brightsat_') !== 0) continue;
        CACHE[key] = JSON.parse(localStorage.getItem(key));
      }
    } catch (e) {}
  }

  function _persistLocalCache() {
    if (!OK) return;
    try {
      Object.keys(CACHE).forEach(function(key) {
        if (key.indexOf('brightsat_') === 0) {
          localStorage.setItem(key, JSON.stringify(CACHE[key]));
        }
      });
    } catch (e) {}
  }

  function _persistServer() {
    if (!SERVER_OK) return;
    try {
      fetch('/api/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(CACHE),
        keepalive: true
      }).catch(function() { SERVER_OK = false; });
    } catch (e) {
      SERVER_OK = false;
    }
  }

  function _slug(handle) {
    return String(handle || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
  }

  function _registry() {
    var reg = _get(REG_KEY, null);
    if (!reg || !Array.isArray(reg.users)) return { users: [], activeSlug: null };
    return reg;
  }

  function _saveRegistry(reg) {
    _set(REG_KEY, reg);
  }

  function _activeUser() {
    var reg = _registry();
    if (!reg.activeSlug) return null;
    return reg.users.find(function(u) { return u.slug === reg.activeSlug; }) || null;
  }

  function _stateKey() {
    var user = _activeUser();
    return user ? LEGACY_STATE_KEY + '_' + user.slug : LEGACY_STATE_KEY;
  }

  function _xpKey() {
    var user = _activeUser();
    return user ? LEGACY_XP_KEY + '_' + user.slug : LEGACY_XP_KEY;
  }

  function _activityKey() {
    var user = _activeUser();
    return user ? ACTIVITY_KEY + '_' + user.slug : ACTIVITY_KEY;
  }

  function _statsKey() {
    var user = _activeUser();
    return user ? STATS_KEY + '_' + user.slug : STATS_KEY;
  }

  return {
    isAvailable: function () { return OK || SERVER_OK; },
    usesServer: function () { return SERVER_OK; },
    init: function (done) {
      if (INIT_DONE) {
        if (done) done();
        return;
      }
      _hydrateLocalCache();
      var localHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
      if (!localHost) {
        INIT_DONE = true;
        if (done) done();
        return;
      }
      fetch('/api/store', { cache: 'no-store' })
        .then(function(res) {
          if (!res.ok) throw new Error('No server store');
          return res.json();
        })
        .then(function(data) {
          if (data && typeof data === 'object') {
            CACHE = Object.assign({}, CACHE, data);
            _persistLocalCache();
          }
          SERVER_OK = true;
        })
        .catch(function() {
          SERVER_OK = false;
        })
        .finally(function() {
          INIT_DONE = true;
          if (done) done();
        });
    },

    getUsers: function () { return _registry().users; },
    getActiveUser: function () { return _activeUser(); },
    setActiveUser: function (slug) {
      var reg = _registry();
      var user = reg.users.find(function(u) { return u.slug === slug; });
      if (!user) return null;
      reg.activeSlug = slug;
      user.lastSeen = new Date().toISOString();
      _saveRegistry(reg);
      return user;
    },
    createOrSelectUser: function (handle, mode, domain) {
      var cleanHandle = String(handle || '').trim().replace(/\s+/g, ' ');
      var baseSlug = _slug(cleanHandle);
      if (!cleanHandle || !baseSlug) return null;

      var reg = _registry();
      var existing = reg.users.find(function(u) {
        return u.handle.toLowerCase() === cleanHandle.toLowerCase();
      });
      var now = new Date().toISOString();

      if (existing) {
        existing.mode = mode || existing.mode || 'all';
        existing.domain = domain || existing.domain || 'all';
        existing.lastSeen = now;
        reg.activeSlug = existing.slug;
        _saveRegistry(reg);
        return existing;
      }

      var slug = baseSlug;
      var i = 2;
      while (reg.users.some(function(u) { return u.slug === slug; })) {
        slug = baseSlug + '-' + i;
        i++;
      }

      var user = {
        handle: cleanHandle,
        slug: slug,
        mode: mode || 'all',
        domain: domain || 'all',
        createdAt: now,
        lastSeen: now
      };
      reg.users.push(user);
      reg.activeSlug = slug;
      _saveRegistry(reg);
      return user;
    },
    saveUserMode: function (mode, domain) {
      var reg = _registry();
      var user = reg.users.find(function(u) { return u.slug === reg.activeSlug; });
      if (!user) return null;
      user.mode = mode || 'all';
      if (domain !== undefined) user.domain = domain || 'all';
      user.lastSeen = new Date().toISOString();
      _saveRegistry(reg);
      return user;
    },
    clearActiveUser: function () {
      var reg = _registry();
      reg.activeSlug = null;
      _saveRegistry(reg);
    },
    deleteUser: function (slug) {
      var reg = _registry();
      var user = reg.users.find(function(u) { return u.slug === slug; });
      if (!user) return false;
      reg.users = reg.users.filter(function(u) { return u.slug !== slug; });
      if (reg.activeSlug === slug) reg.activeSlug = null;
      _saveRegistry(reg);
      _remove(LEGACY_STATE_KEY + '_' + slug);
      _remove(LEGACY_XP_KEY + '_' + slug);
      _remove(ACTIVITY_KEY + '_' + slug);
      _remove(STATS_KEY + '_' + slug);
      return true;
    },

    // ── Question state ────────────────────────────────────────
    // Shape: { [questionId]: { chosen, correct, answered, flagged } }
    getState:  function ()    { return _get(_stateKey(), {}); },
    setState:  function (obj) { _set(_stateKey(), obj); },
    saveQ: function (state, id, patch) {
      state[id] = Object.assign({}, state[id], patch);
      _set(_stateKey(), state);
    },

    // ── XP & streak ───────────────────────────────────────────
    // Shape: { xp, streak, lastDate, sessionXP, sessionCorrect, sessionTotal }
    getXP: function () {
      return _get(_xpKey(), { xp: 0, streak: 0, lastDate: null, sessionXP: 0, sessionCorrect: 0, sessionTotal: 0 });
    },
    setXP: function (obj) { _set(_xpKey(), obj); },
    addXP: function (points) {
      var xpData = Store.getXP();
      var today = new Date().toDateString();
      // Update streak
      if (xpData.lastDate === null) {
        xpData.streak = 1;
      } else if (xpData.lastDate !== today) {
        var yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        xpData.streak = (xpData.lastDate === yesterday.toDateString()) ? xpData.streak + 1 : 1;
      }
      xpData.lastDate = today;
      xpData.xp += points;
      xpData.sessionXP = (xpData.sessionXP || 0) + points;
      Store.setXP(xpData);
      return xpData;
    },
    resetSession: function () {
      var xpData = Store.getXP();
      xpData.sessionXP = 0;
      xpData.sessionCorrect = 0;
      xpData.sessionTotal = 0;
      Store.setXP(xpData);
    },

    getActivity: function () {
      return _get(_activityKey(), { completedTests: { math: 0, rw: 0, all: 0 } });
    },
    setActivity: function (obj) { _set(_activityKey(), obj); },
    recordPracticeComplete: function (mode) {
      var activity = Store.getActivity();
      if (!activity.completedTests) activity.completedTests = { math: 0, rw: 0, all: 0 };
      var key = mode === 'math' || mode === 'rw' ? mode : 'all';
      activity.completedTests[key] = (activity.completedTests[key] || 0) + 1;
      Store.setActivity(activity);
      return activity;
    },

    // ── Lifetime stats (persist across sessions) ─────────────
    // Shape: { totalAnswered, totalCorrect, bySection: {rw,math}, byDomain: {name} }
    getLifetimeStats: function () {
      return _get(_statsKey(), { totalAnswered: 0, totalCorrect: 0, bySection: {}, byDomain: {} });
    },
    setLifetimeStats: function (obj) { _set(_statsKey(), obj); },
    recordAnswer: function (q, correct) {
      var ls = Store.getLifetimeStats();
      ls.totalAnswered = (ls.totalAnswered || 0) + 1;
      ls.totalCorrect  = (ls.totalCorrect  || 0) + (correct ? 1 : 0);
      if (!ls.bySection) ls.bySection = {};
      if (!ls.bySection[q.section]) ls.bySection[q.section] = { answered: 0, correct: 0 };
      ls.bySection[q.section].answered++;
      if (correct) ls.bySection[q.section].correct++;
      if (!ls.byDomain) ls.byDomain = {};
      if (!ls.byDomain[q.domain]) ls.byDomain[q.domain] = { answered: 0, correct: 0 };
      ls.byDomain[q.domain].answered++;
      if (correct) ls.byDomain[q.domain].correct++;
      Store.setLifetimeStats(ls);
    },
    // Wipe per-question answers at session end; keep flagged entries
    clearAnswers: function () {
      var st = Store.getState();
      var cleaned = {};
      Object.keys(st).forEach(function(id) {
        if (st[id] && st[id].flagged) cleaned[id] = { flagged: true };
      });
      _set(_stateKey(), cleaned);
      return cleaned;
    }
  };
})();
