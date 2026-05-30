// js/storage.js  —  localStorage wrapper (swappable for any key-value store)

var Store = (function () {
  var MEM = {};
  var OK = true;
  try {
    var _k = '__bst_test__';
    localStorage.setItem(_k, '1');
    localStorage.removeItem(_k);
  } catch (e) {
    OK = false;
  }

  function _get(key, fallback) {
    try {
      if (!OK) return MEM[key] !== undefined ? MEM[key] : fallback;
      var raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function _set(key, value) {
    try {
      if (!OK) { MEM[key] = value; return; }
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      MEM[key] = value;
    }
  }

  return {
    isAvailable: function () { return OK; },

    // ── Question state ────────────────────────────────────────
    // Shape: { [questionId]: { chosen, correct, answered, flagged } }
    getState:  function ()    { return _get('brightsat_v1', {}); },
    setState:  function (obj) { _set('brightsat_v1', obj); },
    saveQ: function (state, id, patch) {
      state[id] = Object.assign({}, state[id], patch);
      _set('brightsat_v1', state);
    },

    // ── XP & streak ───────────────────────────────────────────
    // Shape: { xp, streak, lastDate, sessionXP, sessionCorrect, sessionTotal }
    getXP: function () {
      return _get('brightsat_xp', { xp: 0, streak: 0, lastDate: null, sessionXP: 0, sessionCorrect: 0, sessionTotal: 0 });
    },
    setXP: function (obj) { _set('brightsat_xp', obj); },
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
    }
  };
})();
