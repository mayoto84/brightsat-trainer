// data/math.js  —  Static questions + procedural generators
// Every generator independently recomputes its answer as a sanity check.

/* ═══════════════════════════════════════════
   GENERATOR HELPERS
═══════════════════════════════════════════ */

(function() { // IIFE so helpers don't pollute global scope

function _randInt(min, max, exclude) {
  exclude = exclude || [];
  let n, attempts = 0;
  do {
    n = Math.floor(Math.random() * (max - min + 1)) + min;
    attempts++;
    if (attempts > 1000) { n = min; break; } // safety valve
  } while (exclude.indexOf(n) !== -1);
  return n;
}

function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function _shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function _uid() { return 'gen_' + Math.random().toString(36).slice(2, 8); }

// Clamp distractors to unique integers, none equal to answer
function _distractors(answer, count, spread) {
  spread = spread || 5;
  var seen = [answer], result = [];
  var pool = [];
  for (var d = -spread; d <= spread; d++) {
    var v = answer + d;
    if (v !== answer) pool.push(v);
  }
  _shuffle(pool);
  for (var i = 0; i < pool.length && result.length < count; i++) {
    result.push(pool[i]);
  }
  // If we still need more, extend the pool
  var extra = -spread - 1;
  while (result.length < count) {
    if (extra !== answer) result.push(extra);
    extra--;
  }
  return result.slice(0, count);
}

// Build MC choices: insert correct answer at random index, return {choices, answerIdx}
function _mcChoices(correct, distractors) {
  var pool = _shuffle([correct].concat(distractors)).slice(0, 4);
  if (pool.indexOf(correct) === -1) { pool[Math.floor(Math.random() * 4)] = correct; }
  return { choices: pool.map(String), answerIdx: pool.indexOf(correct) };
}

// Format ax + b as string: "3x + 2", "3x - 2", "x", "-x", etc.
function _expr(a, b, v) {
  v = v || 'x';
  var termA = (a === 1) ? v : (a === -1) ? ('-' + v) : (a + v);
  if (b === 0) return termA;
  if (b > 0) return termA + ' + ' + b;
  return termA + ' − ' + Math.abs(b);
}

/* ───────────────────────────────────────────
   GENERATOR 1: Linear equation  ax + b = cx + d
─────────────────────────────────────────── */
function genLinearEq() {
  var x = _randInt(-9, 9, [0]);
  var a = _randInt(2, 9);
  var c = _randInt(1, 9, [a]);
  var b = _randInt(-8, 8);
  // ax + b = cx + d  →  d = (a-c)*x + b
  var d = (a - c) * x + b;
  // Verify: a*x + b === c*x + d
  console.assert(a * x + b === c * x + d, 'genLinearEq verify failed');
  var diff = a - c; // diff*x = d - b
  var mc = _mcChoices(x, _distractors(x, 3, 4));
  return {
    id: _uid(), section: 'math', domain: 'Algebra',
    skill: 'Linear equations in one variable', type: 'mc',
    stem: 'What is the value of x if ' + _expr(a, b) + ' = ' + _expr(c, d) + '?',
    choices: mc.choices, answer: mc.answerIdx,
    explanation: 'Subtract ' + c + 'x from both sides: ' + _expr(diff, b) + ' = ' + d +
      '. Subtract ' + b + ': ' + diff + 'x = ' + (d - b) +
      '. Divide by ' + diff + ': x = ' + x + '.'
  };
}

/* ───────────────────────────────────────────
   GENERATOR 2: Slope from two points
─────────────────────────────────────────── */
function genSlope() {
  var m = _randInt(-5, 5, [0]); // integer slope
  var x1 = _randInt(-4, 4);
  var y1 = _randInt(-6, 6);
  var dx = _randInt(1, 5);
  var x2 = x1 + dx;
  var y2 = y1 + m * dx;
  // Verify
  console.assert(m === Math.round((y2 - y1) / (x2 - x1)), 'genSlope verify failed');
  var mc = _mcChoices(m, _distractors(m, 3, 4));
  return {
    id: _uid(), section: 'math', domain: 'Algebra',
    skill: 'Linear functions', type: 'mc',
    stem: 'A line passes through the points (' + x1 + ', ' + y1 + ') and (' + x2 + ', ' + y2 +
      '). What is the slope of the line?',
    choices: mc.choices, answer: mc.answerIdx,
    explanation: 'Slope = (y₂ − y₁) / (x₂ − x₁) = (' + y2 + ' − ' + y1 + ') / (' + x2 + ' − ' + x1 + ') = ' + (y2 - y1) + ' / ' + dx + ' = ' + m + '.'
  };
}

/* ───────────────────────────────────────────
   GENERATOR 3: Systems of equations (elimination)
─────────────────────────────────────────── */
function genSystem() {
  var x = _randInt(-5, 5, [0]);
  var y = _randInt(-5, 5, [0]);
  // Eq1: a1*x + b1*y = c1
  var a1 = _randInt(1, 4); var b1 = _randInt(1, 3);
  var c1 = a1 * x + b1 * y;
  // Eq2: a2*x - b2*y = c2 (so we can eliminate y)
  var a2 = _randInt(1, 4, [a1]); var b2 = b1;
  var c2 = a2 * x - b2 * y;
  // Verify: a1*x + b1*y === c1 and a2*x - b2*y === c2
  console.assert(a1 * x + b1 * y === c1, 'genSystem eq1 verify');
  console.assert(a2 * x - b2 * y === c2, 'genSystem eq2 verify');
  var mc = _mcChoices(x, _distractors(x, 3, 3));
  return {
    id: _uid(), section: 'math', domain: 'Algebra',
    skill: 'Systems of linear equations', type: 'mc',
    stem: 'If ' + a1 + 'x + ' + b1 + 'y = ' + c1 + ' and ' + a2 + 'x − ' + b2 + 'y = ' + c2 + ', what is the value of x?',
    choices: mc.choices, answer: mc.answerIdx,
    explanation: 'Add the equations to eliminate y: (' + (a1 + a2) + ')x = ' + (c1 + c2) + ', so x = ' + x + '.'
  };
}

/* ───────────────────────────────────────────
   GENERATOR 4: Linear word problem (rate)
─────────────────────────────────────────── */
function genRateWord() {
  var templates = [
    function() {
      var fee = _pick([2, 3, 4, 5]);
      var rate = _pick([1.5, 2, 2.5, 3]);
      var miles = _randInt(2, 15);
      var total = fee + rate * miles;
      var mc = _mcChoices(miles, _distractors(miles, 3, 4));
      return {
        stem: 'A taxi charges a flat fee of $' + fee + ' plus $' + rate + ' per mile. A ride costs $' + total.toFixed(2) + '. How many miles long was the ride?',
        answer: miles, mc: mc,
        expl: 'Subtract the flat fee: ' + total.toFixed(2) + ' − ' + fee + ' = $' + (total - fee).toFixed(2) + '. Divide by the rate: ' + (total - fee).toFixed(2) + ' ÷ ' + rate + ' = ' + miles + ' miles.'
      };
    },
    function() {
      var start = _randInt(200, 600);
      var perHour = _randInt(20, 60);
      var hours = _randInt(2, 8);
      var total = start + perHour * hours;
      var mc = _mcChoices(total, _distractors(total, 3, 30));
      return {
        stem: 'A plumber charges $' + start + ' for a service call plus $' + perHour + ' for each hour of work. What is the total cost for ' + hours + ' hours of work?',
        answer: total, mc: mc,
        expl: 'Total = ' + start + ' + ' + perHour + ' × ' + hours + ' = ' + start + ' + ' + (perHour * hours) + ' = $' + total + '.'
      };
    }
  ];
  var t = _pick(templates)();
  return {
    id: _uid(), section: 'math', domain: 'Algebra',
    skill: 'Linear word problem', type: 'mc',
    stem: t.stem, choices: t.mc.choices, answer: t.mc.answerIdx,
    explanation: t.expl
  };
}

/* ───────────────────────────────────────────
   GENERATOR 5: Quadratic factoring (find roots)
─────────────────────────────────────────── */
function genQuadFactor() {
  var r1 = _randInt(-6, 6);
  var r2 = _randInt(-6, 6, [r1]);
  var b = -(r1 + r2); // coefficient of x
  var c = r1 * r2;    // constant
  // Equation: x^2 + bx + c = 0, roots r1 and r2
  // Verify
  function checkRoot(r) { return r * r + b * r + c === 0; }
  console.assert(checkRoot(r1) && checkRoot(r2), 'genQuadFactor verify failed for r1=' + r1 + ', r2=' + r2);
  var stem_b = (b >= 0) ? (b > 0 ? ' + ' + b : '') : ' − ' + Math.abs(b);
  var stem_c = (c >= 0) ? (c > 0 ? ' + ' + c : '') : ' − ' + Math.abs(c);
  // Ask for sum of roots (avoids having two correct answers for individual roots)
  var sumRoots = r1 + r2;
  var mc = _mcChoices(sumRoots, _distractors(sumRoots, 3, 5));
  return {
    id: _uid(), section: 'math', domain: 'Advanced Math',
    skill: 'Quadratic (factoring)', type: 'mc',
    stem: 'What is the sum of the solutions to x²' + stem_b + 'x' + stem_c + ' = 0?',
    choices: mc.choices, answer: mc.answerIdx,
    explanation: 'Factor: (x − (' + r1 + '))(x − (' + r2 + ')) = 0, giving x = ' + r1 + ' and x = ' + r2 +
      '. Their sum is ' + r1 + ' + (' + r2 + ') = ' + sumRoots +
      '. (For x² + bx + c, the sum of roots equals −b = ' + sumRoots + '.)'
  };
}

/* ───────────────────────────────────────────
   GENERATOR 6: Exponential growth / decay
─────────────────────────────────────────── */
function genExponential() {
  var start = _pick([100, 200, 500, 1000]);
  var pct = _pick([10, 20, 25, 50]); // percent change per period
  var periods = _pick([2, 3]);
  var type = _pick(['growth', 'decay']);
  var factor = type === 'growth' ? (1 + pct / 100) : (1 - pct / 100);
  var result = Math.round(start * Math.pow(factor, periods) * 100) / 100;
  // Snap to a clean number for display
  var resultClean = Math.round(result);
  console.assert(Math.abs(start * Math.pow(factor, periods) - resultClean) < 1.5, 'genExponential verify');
  var mc = _mcChoices(resultClean, _distractors(resultClean, 3, Math.round(resultClean * 0.25)));
  var verb = type === 'growth' ? 'increases by' : 'decreases by';
  return {
    id: _uid(), section: 'math', domain: 'Advanced Math',
    skill: type === 'growth' ? 'Exponential growth' : 'Exponential decay', type: 'mc',
    stem: 'A quantity starts at ' + start + ' and ' + verb + ' ' + pct + '% each period. What is the quantity after ' + periods + ' periods?',
    choices: mc.choices, answer: mc.answerIdx,
    explanation: 'Multiply by ' + factor.toFixed(2) + ' for each period: ' + start + ' × ' + factor.toFixed(2) +
      (periods === 2 ? '²' : '³') + ' ≈ ' + resultClean + '.'
  };
}

/* ───────────────────────────────────────────
   GENERATOR 7: Percentage problems
─────────────────────────────────────────── */
function genPercentage() {
  var templates = [
    function() { // Find percentage of whole — only pairs that give exact integers
      var pairs = [];
      [40,50,60,80,100,120,150,200,250].forEach(function(w) {
        [10,20,25,30,40,50,60,75,80].forEach(function(p) {
          if ((w * p) % 100 === 0) pairs.push([w, p]);
        });
      });
      var pair = _pick(pairs);
      var whole = pair[0], pct = pair[1];
      var part = whole * pct / 100;
      console.assert(Number.isInteger(part) && whole * pct / 100 === part, 'genPct type1 verify');
      var mc = _mcChoices(part, _distractors(part, 3, Math.round(part * 0.5) + 5));
      return { stem: 'What is ' + pct + '% of ' + whole + '?', answer: part, mc: mc,
        expl: pct + '% of ' + whole + ' = 0.' + (pct < 10 ? '0' + pct : pct) + ' × ' + whole + ' = ' + part + '.' };
    },
    function() { // Percent increase
      var orig = _pick([40, 50, 80, 100, 200]);
      var pct = _pick([10, 15, 20, 25, 50]);
      var newVal = orig + Math.round(orig * pct / 100);
      var mc = _mcChoices(pct, [pct + 5, pct - 5, pct + 10].filter(v => v > 0));
      var mc2 = _mcChoices(pct, _distractors(pct, 3, 10));
      return { stem: 'A value increased from ' + orig + ' to ' + newVal + '. What was the percent increase?',
        answer: pct, mc: mc2,
        expl: 'Increase = ' + newVal + ' − ' + orig + ' = ' + (newVal - orig) + '. Percent = ' + (newVal - orig) + ' / ' + orig + ' = ' + (pct / 100).toFixed(2) + ' = ' + pct + '%.' };
    },
    function() { // Find original before increase
      var pct = _pick([10, 20, 25, 50]);
      var orig = _pick([40, 60, 80, 100, 120, 160, 200]);
      var total = Math.round(orig * (1 + pct / 100));
      var mc = _mcChoices(orig, _distractors(orig, 3, 20));
      return { stem: 'After a ' + pct + '% increase, a value is ' + total + '. What was the original value?',
        answer: orig, mc: mc,
        expl: 'The total is ' + (100 + pct) + '% of the original. Original = ' + total + ' ÷ ' + (1 + pct / 100) + ' = ' + orig + '.' };
    }
  ];
  var t = _pick(templates)();
  return {
    id: _uid(), section: 'math', domain: 'Problem-Solving and Data Analysis',
    skill: 'Percentages', type: 'mc',
    stem: t.stem, choices: t.mc.choices, answer: t.mc.answerIdx,
    explanation: t.expl
  };
}

/* ───────────────────────────────────────────
   GENERATOR 8: Ratios & proportions
─────────────────────────────────────────── */
function genRatio() {
  var a = _randInt(1, 6);
  var b = _randInt(1, 6, [a]);
  var mult = _randInt(2, 8);
  var given = a * mult;
  var ask = b * mult;
  var mc = _mcChoices(ask, _distractors(ask, 3, 6));
  return {
    id: _uid(), section: 'math', domain: 'Problem-Solving and Data Analysis',
    skill: 'Ratios', type: 'mc',
    stem: 'Two quantities are in the ratio ' + a + ' to ' + b + '. If the first quantity is ' + given + ', what is the second?',
    choices: mc.choices, answer: mc.answerIdx,
    explanation: given + ' is ' + mult + ' times the ratio value ' + a + '. So the second quantity = ' + b + ' × ' + mult + ' = ' + ask + '.'
  };
}

/* ───────────────────────────────────────────
   GENERATOR 9: Statistics (mean)
─────────────────────────────────────────── */
function genMean() {
  var n = _pick([4, 5, 6]);
  var target = _randInt(8, 20);
  var total = n * target;
  // Generate n-1 known values
  var known = [];
  var knownSum = 0;
  for (var i = 0; i < n - 1; i++) {
    var v = _randInt(target - 8, target + 8);
    known.push(v);
    knownSum += v;
  }
  var missing = total - knownSum;
  // If missing is wild, regenerate known values to be closer
  if (missing < 1 || missing > 40) {
    known = [];
    for (var j = 0; j < n - 1; j++) { var w = target + _randInt(-3, 3); known.push(w); knownSum = known.reduce((a,b)=>a+b,0); }
    missing = total - knownSum;
    missing = Math.abs(missing); // clamp
  }
  console.assert(knownSum + missing === total, 'genMean verify');
  var mc = _mcChoices(missing, _distractors(missing, 3, 6));
  return {
    id: _uid(), section: 'math', domain: 'Problem-Solving and Data Analysis',
    skill: 'Mean (average)', type: 'mc',
    stem: 'The mean of ' + n + ' numbers is ' + target + '. ' + (n - 1) + ' of the numbers are ' + known.join(', ') + '. What is the ' + n + 'th number?',
    choices: mc.choices, answer: mc.answerIdx,
    explanation: 'Total of all ' + n + ' numbers = ' + n + ' × ' + target + ' = ' + total +
      '. Known numbers sum to ' + knownSum + '. Missing number = ' + total + ' − ' + knownSum + ' = ' + missing + '.'
  };
}

/* ───────────────────────────────────────────
   GENERATOR 10: Geometry — area / perimeter
─────────────────────────────────────────── */
function genGeometry() {
  var shapes = [
    function() { // Triangle area
      var base = _randInt(2, 16, [1]);
      var height = _randInt(2, 12, [1]);
      var area = (base * height) / 2;
      var areaStr = Number.isInteger(area) ? String(area) : (base + '×' + height + '/2');
      var areaVal = area;
      var mc = _mcChoices(areaVal, _distractors(areaVal, 3, 8));
      return {
        stem: 'A triangle has base ' + base + ' and height ' + height + '. What is its area?',
        answer: areaVal, mc: mc,
        expl: 'Area = (1/2) × ' + base + ' × ' + height + ' = ' + areaVal + '.'
      };
    },
    function() { // Rectangle perimeter
      var l = _randInt(3, 15);
      var w = _randInt(2, 10, [l]);
      var perim = 2 * (l + w);
      var mc = _mcChoices(perim, _distractors(perim, 3, 8));
      return {
        stem: 'A rectangle has length ' + l + ' and width ' + w + '. What is its perimeter?',
        answer: perim, mc: mc,
        expl: 'Perimeter = 2(length + width) = 2(' + l + ' + ' + w + ') = 2(' + (l + w) + ') = ' + perim + '.'
      };
    },
    function() { // Pythagorean theorem
      var triples = [[3,4,5],[5,12,13],[8,15,17],[6,8,10],[9,40,41]];
      var t = _pick(triples);
      var scale = _randInt(1, 3);
      var a = t[0]*scale, b = t[1]*scale, c = t[2]*scale;
      console.assert(a*a + b*b === c*c, 'genPythag verify');
      var mc = _mcChoices(c, _distractors(c, 3, 6));
      return {
        stem: 'A right triangle has legs ' + a + ' and ' + b + '. What is the length of the hypotenuse?',
        answer: c, mc: mc,
        expl: 'c² = ' + a + '² + ' + b + '² = ' + (a*a) + ' + ' + (b*b) + ' = ' + (c*c) + '. So c = ' + c + '.'
      };
    },
    function() { // Circle area
      var r = _randInt(2, 10);
      var area = r * r; // answer as coefficient of pi
      var mc = _mcChoices(area, _distractors(area, 3, 10));
      var choices = mc.choices.map(function(v) { return v + 'π'; });
      return {
        stem: 'A circle has radius ' + r + '. What is its area, in terms of π?',
        answer: area, mc: { choices: choices, answerIdx: mc.answerIdx },
        expl: 'Area = πr² = π × ' + r + '² = ' + area + 'π.'
      };
    }
  ];
  var t = _pick(shapes)();
  return {
    id: _uid(), section: 'math', domain: 'Geometry and Trigonometry',
    skill: 'Area / Perimeter / Pythagorean theorem', type: 'mc',
    stem: t.stem, choices: t.mc.choices, answer: t.mc.answerIdx,
    explanation: t.expl
  };
}

/* ───────────────────────────────────────────
   GENERATOR 11: Probability
─────────────────────────────────────────── */
function genProbability() {
  var colors = ['red', 'blue', 'green', 'yellow', 'purple'];
  var n = _randInt(2, 4); // number of color groups
  var colorPick = _shuffle(colors).slice(0, n);
  var counts = colorPick.map(function() { return _randInt(2, 15); });
  var total = counts.reduce(function(a, b) { return a + b; }, 0);
  var targetIdx = Math.floor(Math.random() * n);
  var targetCount = counts[targetIdx];
  // Simplify fraction targetCount/total
  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
  var g = gcd(targetCount, total);
  var numStr = String(targetCount / g);
  var denStr = String(total / g);
  var fracStr = (g === total) ? numStr : (numStr + '/' + denStr);
  // Build MC choices: a few fractions
  var allChoices = [fracStr];
  var used = [targetCount / g + '/' + total / g];
  for (var i = 0; i < 3; i++) {
    var fakeCount = _randInt(1, total - 1);
    while (fakeCount === targetCount) fakeCount = _randInt(1, total - 1);
    var g2 = gcd(fakeCount, total);
    var fake = (fakeCount / g2) + '/' + (total / g2);
    if (allChoices.indexOf(fake) === -1) allChoices.push(fake);
  }
  while (allChoices.length < 4) allChoices.push(_randInt(1, total - 1) + '/' + total);
  allChoices = _shuffle(allChoices).slice(0, 4);
  if (allChoices.indexOf(fracStr) === -1) allChoices[0] = fracStr;
  return {
    id: _uid(), section: 'math', domain: 'Problem-Solving and Data Analysis',
    skill: 'Probability', type: 'mc',
    stem: 'A bag contains ' + colorPick.map(function(c, i) { return counts[i] + ' ' + c; }).join(', ') + ' marbles. If one marble is drawn at random, what is the probability it is ' + colorPick[targetIdx] + '?',
    choices: allChoices,
    answer: allChoices.indexOf(fracStr),
    explanation: 'Total marbles = ' + counts.join(' + ') + ' = ' + total + '. P(' + colorPick[targetIdx] + ') = ' + targetCount + '/' + total + (g > 1 ? ' = ' + fracStr : '') + '.'
  };
}

/* ───────────────────────────────────────────
   GENERATOR 12: Interpreting slope / y-intercept
─────────────────────────────────────────── */
function genSlopeIntercept() {
  var contexts = [
    { obj: 'car', unit: 'miles', timeUnit: 'hour', startLabel: 'starting distance', rateLabel: 'speed' },
    { obj: 'plant', unit: 'centimeters', timeUnit: 'week', startLabel: 'initial height', rateLabel: 'growth rate' },
    { obj: 'account balance', unit: 'dollars', timeUnit: 'month', startLabel: 'initial balance', rateLabel: 'monthly change' }
  ];
  var ctx = _pick(contexts);
  var m = _randInt(1, 50);
  var b = _randInt(0, 200);
  var askSlope = Math.random() < 0.5;
  var correctAnswer = askSlope ? m : b;
  var correctDesc = askSlope
    ? ('The amount the ' + ctx.unit + ' change per ' + ctx.timeUnit)
    : ('The initial ' + ctx.unit + ' when time is 0');
  var wrongA = askSlope
    ? ('The total ' + ctx.unit + ' after one ' + ctx.timeUnit)
    : ('The rate of change per ' + ctx.timeUnit);
  var wrongB = askSlope
    ? ('The ' + ctx.unit + ' when time equals ' + b)
    : ('The total after ' + m + ' ' + ctx.timeUnit + 's');
  var wrongC = 'The maximum value';
  var allChoices = _shuffle([correctDesc, wrongA, wrongB, wrongC]);
  return {
    id: _uid(), section: 'math', domain: 'Algebra',
    skill: 'Interpreting slope', type: 'mc',
    stem: 'The equation y = ' + m + 'x + ' + b + ' models a ' + ctx.obj + ', where y is ' + ctx.unit + ' and x is ' + ctx.timeUnit + 's. What does ' + (askSlope ? m : b) + ' represent?',
    choices: allChoices,
    answer: allChoices.indexOf(correctDesc),
    explanation: (askSlope
      ? (m + ' is the slope: the ' + ctx.unit + ' increase per ' + ctx.timeUnit + '.')
      : (b + ' is the y-intercept: the initial ' + ctx.unit + ' when x = 0.'))
  };
}

/* ═══════════════════════════════════════════
   GENERATE POOL
═══════════════════════════════════════════ */

var GEN_FUNCTIONS = [
  genLinearEq, genLinearEq, genLinearEq,     // more weight
  genSlope, genSlope,
  genSystem,
  genRateWord, genRateWord,
  genQuadFactor, genQuadFactor,
  genExponential, genExponential,
  genPercentage, genPercentage, genPercentage,
  genRatio, genRatio,
  genMean, genMean,
  genGeometry, genGeometry, genGeometry,
  genProbability,
  genSlopeIntercept
];

function generateMathPool(n) {
  var results = [];
  var i = 0;
  while (results.length < n) {
    try {
      var q = GEN_FUNCTIONS[i % GEN_FUNCTIONS.length]();
      results.push(q);
    } catch(e) {
      // skip bad roll
    }
    i++;
  }
  return results;
}

// Expose generator functions for the test script
window._mathGenerators = {
  genLinearEq: genLinearEq,
  genSlope: genSlope,
  genSystem: genSystem,
  genRateWord: genRateWord,
  genQuadFactor: genQuadFactor,
  genExponential: genExponential,
  genPercentage: genPercentage,
  genRatio: genRatio,
  genMean: genMean,
  genGeometry: genGeometry,
  genProbability: genProbability,
  genSlopeIntercept: genSlopeIntercept
};

/* ═══════════════════════════════════════════
   STATIC QUESTIONS
═══════════════════════════════════════════ */

var MATH_STATIC = [

// ── Algebra ──────────────────────────────────────────────────

{id:"m_alg_01",section:"math",domain:"Algebra",skill:"Linear equations in one variable",type:"mc",
stem:"If 5x − 8 = 3x + 12, what is the value of x?",
choices:["2","4","8","10"],answer:3,
explanation:"Subtract 3x: 2x − 8 = 12. Add 8: 2x = 20. Divide: x = 10."},

{id:"m_alg_02",section:"math",domain:"Algebra",skill:"Linear functions",type:"mc",
stem:"A line passes through (0, 4) and (3, 19). What is the slope?",
choices:["3","5","7","15"],answer:1,
explanation:"Slope = (19 − 4) / (3 − 0) = 15 / 3 = 5."},

{id:"m_alg_03",section:"math",domain:"Algebra",skill:"Systems of linear equations",type:"mc",
stem:"If 2x + y = 11 and x − y = 1, what is the value of x?",
choices:["3","4","5","6"],answer:1,
explanation:"Add the equations: 3x = 12, so x = 4."},

{id:"m_alg_04",section:"math",domain:"Algebra",skill:"Linear inequalities",type:"mc",
stem:"Which value of x is a solution to 3x − 7 > 11?",
choices:["4","5","6","7"],answer:3,
explanation:"Add 7: 3x > 18. Divide: x > 6. Only 7 satisfies this."},

{id:"m_alg_05",section:"math",domain:"Algebra",skill:"Slope-intercept meaning",type:"mc",
stem:"A plumber charges a flat fee of $45 plus $30 per hour. Which equation gives the total cost C for h hours?",
choices:["C = 30h + 45","C = 45h + 30","C = 75h","C = 30 + 45h"],answer:0,
explanation:"Flat fee $45 is the constant; $30 per hour multiplies h. So C = 30h + 45."},

{id:"m_alg_06",section:"math",domain:"Algebra",skill:"Solving for a variable",type:"grid",
stem:"If 4(x + 3) = 28, what is the value of x?",
answer:["4"],
explanation:"Divide both sides by 4: x + 3 = 7. Subtract 3: x = 4."},

{id:"m_alg_07",section:"math",domain:"Algebra",skill:"Systems (substitution)",type:"grid",
stem:"If y = 2x + 1 and y = 9, what is the value of x?",
answer:["4"],
explanation:"Set 2x + 1 = 9. Subtract 1: 2x = 8. Divide: x = 4."},

{id:"m_alg_08",section:"math",domain:"Algebra",skill:"Linear word problem",type:"mc",
stem:"A taxi ride costs $3.50 to start plus $2.25 per mile. A ride cost $19.25. How many miles long was it?",
choices:["6","7","8","9"],answer:1,
explanation:"19.25 − 3.50 = 15.75. Then 15.75 ÷ 2.25 = 7 miles."},

{id:"m_alg_09",section:"math",domain:"Algebra",skill:"Interpreting slope",type:"mc",
stem:"V = 24000 − 1800t models a car's value V (dollars) t years after purchase. What does 1800 represent?",
choices:["The purchase price","The value after 1 year","The amount the value decreases each year","The years until worthless"],
answer:2,
explanation:"V decreases by 1800 for each unit increase in t — 1800 is the yearly decrease in value."},

{id:"m_alg_10",section:"math",domain:"Algebra",skill:"Parallel lines",type:"mc",
stem:"Line k is parallel to y = −3x + 5 and passes through the origin. What is the equation of line k?",
choices:["y = −3x","y = 3x","y = (1/3)x","y = −3x + 5"],answer:0,
explanation:"Parallel lines share slope (−3). Through the origin means y-intercept = 0: y = −3x."},

{id:"m_alg_11",section:"math",domain:"Algebra",skill:"Linear inequalities",type:"mc",
stem:"Which inequality is equivalent to −2x + 5 ≥ 13?",
choices:["x ≥ −4","x ≤ −4","x ≥ 4","x ≤ 4"],answer:1,
explanation:"Subtract 5: −2x ≥ 8. Divide by −2 (flip inequality): x ≤ −4."},

{id:"m_alg_12",section:"math",domain:"Algebra",skill:"Linear equations",type:"grid",
stem:"If (3/4)x = 18, what is the value of x?",
answer:["24"],
explanation:"Multiply both sides by 4/3: x = 18 × (4/3) = 24."},

// ── Advanced Math ─────────────────────────────────────────────

{id:"m_adv_01",section:"math",domain:"Advanced Math",skill:"Quadratic (factoring)",type:"mc",
stem:"What are the solutions to x² − 5x + 6 = 0?",
choices:["x = −2 and x = −3","x = 2 and x = 3","x = 1 and x = 6","x = −1 and x = −6"],
answer:1,
explanation:"Factor: (x − 2)(x − 3) = 0. So x = 2 or x = 3."},

{id:"m_adv_02",section:"math",domain:"Advanced Math",skill:"Evaluating functions",type:"mc",
stem:"If f(x) = 2x² − 3x + 1, what is f(3)?",
choices:["10","12","16","28"],answer:0,
explanation:"f(3) = 2(9) − 3(3) + 1 = 18 − 9 + 1 = 10."},

{id:"m_adv_03",section:"math",domain:"Advanced Math",skill:"Exponential growth",type:"mc",
stem:"A population of bacteria doubles every hour, starting at 50. Which expression gives the population after t hours?",
choices:["50 + 2t","50 × 2^t","50 × t²","2 × 50^t"],answer:1,
explanation:"Doubling each hour means multiplying by 2 each hour: 50 × 2^t."},

{id:"m_adv_04",section:"math",domain:"Advanced Math",skill:"Vertex of a parabola",type:"mc",
stem:"f(x) = (x − 4)² + 7. What is the minimum value of f(x)?",
choices:["−4","4","7","11"],answer:2,
explanation:"In vertex form (x − h)² + k the minimum is k = 7, reached at x = 4."},

{id:"m_adv_05",section:"math",domain:"Advanced Math",skill:"Exponent rules",type:"grid",
stem:"If 2^x = 32, what is the value of x?",answer:["5"],
explanation:"32 = 2^5, so x = 5."},

{id:"m_adv_06",section:"math",domain:"Advanced Math",skill:"Quadratic — sum of roots",type:"mc",
stem:"What is the sum of the solutions to x² − 7x + 10 = 0?",
choices:["3","5","7","10"],answer:2,
explanation:"Roots are 2 and 5 (from (x−2)(x−5)=0). Sum = 7. (For ax²+bx+c, sum of roots = −b/a.)"},

{id:"m_adv_07",section:"math",domain:"Advanced Math",skill:"Rational expressions",type:"mc",
stem:"For x ≠ 3, (x² − 9) / (x − 3) equals which of the following?",
choices:["x − 3","x + 3","x² − 3","x + 9"],answer:1,
explanation:"x² − 9 = (x − 3)(x + 3). Cancel (x − 3): the expression equals x + 3."},

{id:"m_adv_08",section:"math",domain:"Advanced Math",skill:"Function composition",type:"grid",
stem:"If g(x) = x² + 1, what is g(g(2))?",answer:["26"],
explanation:"g(2) = 4 + 1 = 5. Then g(5) = 25 + 1 = 26."},

{id:"m_adv_09",section:"math",domain:"Advanced Math",skill:"Polynomial roots",type:"mc",
stem:"If (x + 2) is a factor of x² + bx + 6, what is the value of b?",
choices:["3","4","5","6"],answer:2,
explanation:"(x+2)(x+3) = x²+5x+6. So b = 5."},

{id:"m_adv_10",section:"math",domain:"Advanced Math",skill:"Exponential decay",type:"mc",
stem:"A medicine starts at 200 mg and decreases by 25% each hour. How many mg remain after 2 hours?",
choices:["100","112.5","150","125"],answer:1,
explanation:"200 × 0.75 × 0.75 = 200 × 0.5625 = 112.5 mg."},

{id:"m_adv_11",section:"math",domain:"Advanced Math",skill:"Evaluating functions",type:"mc",
stem:"If h(x) = 3x² − x, what is h(−2)?",
choices:["10","14","−10","−14"],answer:1,
explanation:"h(−2) = 3(4) − (−2) = 12 + 2 = 14."},

{id:"m_adv_12",section:"math",domain:"Advanced Math",skill:"Quadratic — vertex",type:"grid",
stem:"The graph of y = (x + 3)² − 5 has its vertex at the point (h, k). What is the value of k?",
answer:["-5"],
explanation:"In vertex form y = (x − h)² + k, the vertex is (h, k). Here h = −3, k = −5."},

// ── Problem-Solving and Data Analysis ────────────────────────

{id:"m_psda_01",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Percentages",type:"mc",
stem:"A jacket originally priced at $80 is on sale for 35% off. What is the sale price?",
choices:["$28","$45","$52","$55"],answer:2,
explanation:"35% of 80 = 28. Sale price = 80 − 28 = $52."},

{id:"m_psda_02",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Ratios",type:"mc",
stem:"A recipe uses flour and sugar in a ratio of 5 to 2. If 15 cups of flour are used, how many cups of sugar are needed?",
choices:["4","6","7.5","10"],answer:1,
explanation:"15 is 3 × 5, so sugar = 3 × 2 = 6 cups."},

{id:"m_psda_03",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Unit rate",type:"mc",
stem:"A car travels 150 miles in 2.5 hours. At this rate, how far will it travel in 4 hours?",
choices:["210 miles","225 miles","240 miles","260 miles"],answer:2,
explanation:"Speed = 150 ÷ 2.5 = 60 mph. In 4 hours: 60 × 4 = 240 miles."},

{id:"m_psda_04",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Mean (average)",type:"grid",
stem:"The mean of five numbers is 12. Four of them are 10, 14, 8, and 16. What is the fifth?",
answer:["12"],
explanation:"Total = 5 × 12 = 60. Known sum = 48. Fifth = 60 − 48 = 12."},

{id:"m_psda_05",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Probability",type:"mc",
stem:"A bag contains 4 red, 6 blue, and 10 green marbles. If one is drawn at random, what is the probability it is blue?",
choices:["1/5","3/10","6/10","1/3"],answer:1,
explanation:"Total = 20. P(blue) = 6/20 = 3/10."},

{id:"m_psda_06",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Percent increase",type:"mc",
stem:"A town's population grew from 8,000 to 9,200. What was the percent increase?",
choices:["12%","15%","18%","20%"],answer:1,
explanation:"Increase = 1200. Percent = 1200/8000 = 0.15 = 15%."},

{id:"m_psda_07",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Median",type:"grid",
stem:"What is the median of: 3, 7, 9, 12, 15, 21?",
answer:["10.5","21/2"],
explanation:"6 values → median = average of 3rd and 4th = (9+12)/2 = 10.5."},

{id:"m_psda_08",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Proportions",type:"mc",
stem:"On a map, 2 inches represents 50 miles. How many miles are represented by 7 inches?",
choices:["125 miles","150 miles","175 miles","200 miles"],answer:2,
explanation:"Each inch = 25 miles. 7 × 25 = 175 miles."},

{id:"m_psda_09",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Percent of total",type:"mc",
stem:"In a survey of 250 students, 40% preferred online classes. How many students is that?",
choices:["80","90","100","110"],answer:2,
explanation:"0.40 × 250 = 100 students."},

{id:"m_psda_10",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Reverse percentage",type:"mc",
stem:"After a 20% tip, a restaurant bill totals $54. What was the bill before the tip?",
choices:["$43.20","$45","$48","$50"],answer:1,
explanation:"1.20 × b = 54, so b = 54 / 1.20 = $45."},

{id:"m_psda_11",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Median",type:"mc",
stem:"A data set has 7 values listed in order: 2, 5, 8, k, 14, 17, 20. If the median is 11, what is k?",
choices:["9","10","11","12"],answer:2,
explanation:"With 7 values, the median is the 4th value. So k = 11."},

{id:"m_psda_12",section:"math",domain:"Problem-Solving and Data Analysis",skill:"Unit conversion",type:"mc",
stem:"A runner completes a 10-kilometer race in 50 minutes. What is the runner's average speed in kilometers per hour?",
choices:["10 km/h","12 km/h","15 km/h","20 km/h"],answer:1,
explanation:"50 minutes = 50/60 hours. Speed = 10 ÷ (50/60) = 10 × 60/50 = 12 km/h."},

// ── Geometry and Trigonometry ─────────────────────────────────

{id:"m_geo_01",section:"math",domain:"Geometry and Trigonometry",skill:"Area of a triangle",type:"mc",
stem:"A triangle has base 12 cm and height 5 cm. What is its area?",
choices:["17 cm²","30 cm²","60 cm²","120 cm²"],answer:1,
explanation:"Area = (1/2)(12)(5) = 30 cm²."},

{id:"m_geo_02",section:"math",domain:"Geometry and Trigonometry",skill:"Pythagorean theorem",type:"mc",
stem:"A right triangle has legs of length 6 and 8. What is the hypotenuse?",
choices:["10","12","14","48"],answer:0,
explanation:"c² = 36 + 64 = 100, so c = 10."},

{id:"m_geo_03",section:"math",domain:"Geometry and Trigonometry",skill:"Circle area",type:"mc",
stem:"A circle has radius 5. What is its area, in terms of π?",
choices:["10π","25π","50π","100π"],answer:1,
explanation:"Area = π × 5² = 25π."},

{id:"m_geo_04",section:"math",domain:"Geometry and Trigonometry",skill:"Circle circumference",type:"grid",
stem:"A circle has diameter 14. What is its circumference, in terms of π? (Enter the number that multiplies π.)",
answer:["14"],
explanation:"Circumference = π × diameter = 14π."},

{id:"m_geo_05",section:"math",domain:"Geometry and Trigonometry",skill:"Volume of a rectangular prism",type:"mc",
stem:"A box is 4 inches long, 3 inches wide, and 5 inches tall. What is its volume?",
choices:["12 in³","20 in³","47 in³","60 in³"],answer:3,
explanation:"Volume = 4 × 3 × 5 = 60 in³."},

{id:"m_geo_06",section:"math",domain:"Geometry and Trigonometry",skill:"Angles (triangle sum)",type:"grid",
stem:"In a triangle, two angles are 55° and 65°. What is the third angle, in degrees?",
answer:["60"],
explanation:"Angles sum to 180. Third = 180 − 55 − 65 = 60°."},

{id:"m_geo_07",section:"math",domain:"Geometry and Trigonometry",skill:"Similar triangles",type:"mc",
stem:"Two similar triangles have a scale factor of 3. A side of the smaller triangle is 4. What is the corresponding side of the larger?",
choices:["7","12","16","64"],answer:1,
explanation:"4 × 3 = 12."},

{id:"m_geo_08",section:"math",domain:"Geometry and Trigonometry",skill:"Basic trigonometry (SOH)",type:"mc",
stem:"In a right triangle, the side opposite angle A is 3 and the hypotenuse is 5. What is sin(A)?",
choices:["3/5","4/5","3/4","5/3"],answer:0,
explanation:"sin = opposite/hypotenuse = 3/5."},

{id:"m_geo_09",section:"math",domain:"Geometry and Trigonometry",skill:"Special angles",type:"mc",
stem:"What is the value of sin(30°)?",
choices:["1/2","√2/2","√3/2","1"],answer:0,
explanation:"sin(30°) = 1/2."},

{id:"m_geo_10",section:"math",domain:"Geometry and Trigonometry",skill:"Volume of a cylinder",type:"mc",
stem:"A cylinder has radius 3 and height 10. What is its volume, in terms of π?",
choices:["30π","60π","90π","300π"],answer:2,
explanation:"Volume = π × 3² × 10 = 90π."},

{id:"m_geo_11",section:"math",domain:"Geometry and Trigonometry",skill:"Angle relationships",type:"mc",
stem:"Two parallel lines are cut by a transversal. One of the co-interior (same-side interior) angles is 65°. What is the measure of the other co-interior angle?",
choices:["65°","115°","25°","90°"],answer:1,
explanation:"Co-interior angles are supplementary (sum to 180°). 180 − 65 = 115°."},

{id:"m_geo_12",section:"math",domain:"Geometry and Trigonometry",skill:"Area of a circle sector",type:"mc",
stem:"A circle has radius 6. What is the area of a sector with central angle 90°?",
choices:["3π","6π","9π","12π"],answer:2,
explanation:"Sector area = (90/360) × π × 6² = (1/4) × 36π = 9π."},

]; // end MATH_STATIC

// Generate the pool (80 procedural questions per session)
var MATH_GENERATED = generateMathPool(80);

// Combine static + generated; expose globally
window.MATH_QUESTIONS = MATH_STATIC.concat(MATH_GENERATED);

})(); // end IIFE
