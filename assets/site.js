
(function () {
  'use strict';
  var SALT = 'westonbirt-maths-student-site', HASH = '3ed45339cc92bfd6b343ede0e8bd6f4d6bd3da637f5380fafb8d9e7b7991a793', UNLOCK = 'wb-student-unlocked';
  function sget(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { if (v === null) window.sessionStorage.removeItem(k); else window.sessionStorage.setItem(k, v); } catch (e) {} }
  function lget(k) { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lset(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  // ---- Card MK (29.21): THE "I CAN" RATINGS' ONE STORAGE MODULE. OLE, 17 Oct 2026: "browser first - to test before
  // building into school login." Everything else reads and writes ratings through these four calls, so a school login
  // replaces this block and nothing else. A year's ratings: { lesson id: { s1: 'can'|'nearly'|'not', s2: ... } }.
  // Kept in memory too, so the taps still work for this visit when the browser won't store anything.
  var Ratings = (function () {
    var P = 'wb-rating:', mem = {};
    function load(y) { if (!mem[y]) { var o = lget(P + y); mem[y] = (o && typeof o === 'object') ? o : {}; } return mem[y]; }
    return {
      year: function (y) { return load(y); },
      get: function (y, lid) { return load(y)[lid] || {}; },
      set: function (y, lid, lo, v) {
        var o = load(y), r = o[lid] || {};
        if (v) r[lo] = v; else delete r[lo];
        if (Object.keys(r).length) o[lid] = r; else delete o[lid];
        lset(P + y, o);
      },
      saved: function () { try { var k = 'wb-rating-probe'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); return true; } catch (e) { return false; } }
    };
  })();
  var RATING_ORDER = { not: 0, nearly: 1, can: 2 }, RATING_WORD = { not: 'Not yet', nearly: 'Nearly', can: 'I can do this' };
  function worst(r) { var w = null; for (var k in r) if (r.hasOwnProperty(k) && RATING_ORDER.hasOwnProperty(r[k]) && (w === null || RATING_ORDER[r[k]] < RATING_ORDER[w])) w = r[k]; return w; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmt(iso) { if (!iso) return 'date to be set'; var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]); return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }
  function unlocked() { return sget(UNLOCK) === '1'; }
  // ---- SHA-256 (the PIN is checked against a salted hash; the code itself is never in the page)
  function sha256(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mp = Math.pow, max = mp(2, 32), i, j, result = '', words = [], blen = ascii.length * 8;
    var hash = [], k = [], pc = 0, isC = {};
    for (var cand = 2; pc < 64; cand++) { if (!isC[cand]) { for (i = 0; i < 313; i += cand) isC[i] = cand;
      hash[pc] = (mp(cand, .5) * max) | 0; k[pc++] = (mp(cand, 1 / 3) * max) | 0; } }
    hash = hash.slice(0, 8);
    ascii += '\x80'; while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = ((blen / max) | 0); words[words.length] = (blen);
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), oh = hash; hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i]
          + (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash); hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + oh[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? '0' : '') + b.toString(16); }
    return result;
  }
  // ---- PIN pad
  var LOCK_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>';
  var LOGO_IMG = '<img class="logo" src="../assets/westonbirt_logo.png" alt="Westonbirt School" width="121" height="80" decoding="async" loading="lazy">';   // Card KP job 6 (year pages sit one folder down)
  function openPin(onOk) {
    var pin = '', bg = document.createElement('div');
    bg.className = 'pinbg';
    bg.innerHTML = '<div class="pinbox" role="dialog" aria-modal="true" aria-label="Teacher unlock"><div class="pk">TEACHER UNLOCK</div>' +
      '<div class="pt">Enter the code to open lessons that haven\'t been taught yet.</div><div class="dots"><span class="dotp"></span><span class="dotp"></span><span class="dotp"></span></div>' +
      '<div class="pinerr" hidden>That code isn\'t right. Try again.</div><div class="keys"></div><button class="cancel">Cancel</button></div>';
    var keys = bg.querySelector('.keys'), dots = bg.querySelectorAll('.dotp'), err = bg.querySelector('.pinerr');
    function draw() { for (var i = 0; i < 3; i++) dots[i].className = 'dotp' + (i < pin.length ? ' on' : ''); }
    function close() { document.removeEventListener('keydown', onKey); bg.remove(); }
    function check() {
      if (sha256(SALT + ':' + pin) === HASH) { sset(UNLOCK, '1'); close(); onOk(); }
      else { pin = ''; err.hidden = false; draw(); }
    }
    function press(v) {
      if (v === 'del') { pin = pin.slice(0, -1); err.hidden = true; draw(); return; }
      if (v === 'ok') { check(); return; }
      if (pin.length >= 3) return;
      pin += v; err.hidden = true; draw();
      if (pin.length === 3) check();
    }
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].forEach(function (k) {
      var b = document.createElement('button'); b.className = 'key'; b.type = 'button';
      b.textContent = k === 'del' ? '\u232B' : (k === 'ok' ? '\u2713' : k);
      b.setAttribute('aria-label', k === 'del' ? 'Delete' : (k === 'ok' ? 'Enter' : k));
      b.addEventListener('click', function () { press(k); }); keys.appendChild(b);
    });
    function onKey(e) { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('del'); else if (e.key === 'Enter') press('ok'); else if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);
    bg.querySelector('.cancel').addEventListener('click', close);
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    document.body.appendChild(bg); draw();
    var first = keys.querySelector('button'); if (first) first.focus();
  }
  window.WBStudent = { openPin: openPin, unlocked: unlocked, todayISO: todayISO, relock: function () { sset(UNLOCK, null); }, ratings: Ratings };
  // Card MK: the rating card on a lesson page (after the exit ticket)
  function wireRatings() {
    var pg = (document.body.getAttribute('data-page') || '').split('/'), y = pg[0], lid = pg.slice(1).join('/');
    var rows = document.querySelectorAll('.rtrow');
    if (!rows.length) return;
    function draw() {
      var r = Ratings.get(y, lid);
      Array.prototype.forEach.call(rows, function (row) {
        var lo = row.getAttribute('data-lo');
        Array.prototype.forEach.call(row.querySelectorAll('.rtb'), function (b) { b.setAttribute('aria-pressed', r[lo] === b.getAttribute('data-v') ? 'true' : 'false'); });
      });
    }
    Array.prototype.forEach.call(rows, function (row) {
      var lo = row.getAttribute('data-lo');
      Array.prototype.forEach.call(row.querySelectorAll('.rtb'), function (b) {
        b.addEventListener('click', function () { var v = b.getAttribute('data-v'); Ratings.set(y, lid, lo, Ratings.get(y, lid)[lo] === v ? null : v); draw(); });
      });
    });
    var note = document.getElementById('rtnote');
    if (note && !Ratings.saved()) note.textContent = 'Your ratings are saved on this device only, and this browser isn’t saving them: they will be gone when you close the page.';
    draw();
  }
  function lockScreen(lock, what, opensText) {
    var yr = document.body.getAttribute('data-year');
    lock.innerHTML = '<div class="kick">' + LOCK_SVG + ' Not open yet</div><h1>This ' + what + ' is locked</h1>' +
      '<p>' + opensText + '</p>' +
      '<a class="rev" href="index.html" style="text-decoration:none">← All ' + esc(yr) + ' lessons</a>' +
      '<button class="unl" type="button" id="unlockbtn">' + LOCK_SVG + ' Teacher unlock</button>';
    document.getElementById('unlockbtn').addEventListener('click', function () { openPin(function () { location.reload(); }); });
  }
  var kind = document.body.getAttribute('data-kind');

  // ================= LESSON =================
  if (kind === 'lesson') {
    var date = document.body.getAttribute('data-date'), today = todayISO();
    var lesson = document.getElementById('lesson'), lock = document.getElementById('lockscreen');
    var extra = document.body.getAttribute('data-extra') === '1';   // Card KQ: cut from the schedule, never locked
    var future = !extra && (!date || date > today);
    if (future && !unlocked()) {
      lesson.hidden = true; lock.hidden = false;
      var yr = document.body.getAttribute('data-year');
      lock.innerHTML = '<div class="kick">' + LOCK_SVG + ' Not open yet</div><h1>This lesson is locked</h1>' +
        '<p>' + (date ? 'It opens on ' + esc(document.body.getAttribute('data-opens')) + ', the day you\'re taught it.' : 'It hasn\'t got a date yet.') + '</p>' +
        '<a class="rev" href="index.html" style="text-decoration:none">\u2190 All ' + esc(yr) + ' lessons</a>' +
        '<button class="unl" type="button" id="unlockbtn">' + LOCK_SVG + ' Teacher unlock</button>';
      document.getElementById('unlockbtn').addEventListener('click', function () { openPin(function () { location.reload(); }); });
      return;
    }
    if (future && unlocked()) {
      var tb = document.createElement('div'); tb.className = 'teacherbar';
      tb.innerHTML = '<div class="pill"><span>Teacher view \u00B7 not taught yet</span><button class="lockbtn" type="button">Lock again</button></div>';
      tb.querySelector('button').addEventListener('click', function () { sset(UNLOCK, null); location.reload(); });
      lesson.parentNode.insertBefore(tb, lesson);
    }
    var KEY = 'wb-student:' + document.body.getAttribute('data-page');
    var st = lget(KEY) || {}; st.open = st.open || {}; st.step = st.step || {}; st.pick = st.pick || {};
    function save() { lset(KEY, st); }
    var revs = document.querySelectorAll('[data-rev]'), exs = document.querySelectorAll('[data-steps]'), exq = document.querySelectorAll('[data-steps]:not([data-cstep])'), cfus = document.querySelectorAll('.cfu');
    function progress() {
      var total = revs.length + exq.length + cfus.length, done = 0;
      Array.prototype.forEach.call(revs, function (b) { if (st.open[b.getAttribute('data-rev')]) done++; });
      Array.prototype.forEach.call(exq, function (b) { var id = b.getAttribute('data-steps'); if ((st.step[id] || 0) >= +b.getAttribute('data-n')) done++; });
      Array.prototype.forEach.call(cfus, function (c) { if (st.pick[c.id] && st.pick[c.id] === c.getAttribute('data-key')) done++; });
      var t = document.getElementById('progtext'), f = document.getElementById('progfill');
      if (t) t.textContent = done + ' of ' + total + ' checked';
      if (f) f.style.width = (total ? Math.round(100 * done / total) : 0) + '%';
    }
    Array.prototype.forEach.call(revs, function (b) {
      var id = b.getAttribute('data-rev'), box = document.getElementById(id), label = b.textContent;
      function draw() { var o = !!st.open[id]; box.hidden = !o; b.setAttribute('aria-expanded', o ? 'true' : 'false'); b.textContent = o ? 'Hide answer' : label; }
      b.addEventListener('click', function () { st.open[id] = !st.open[id]; save(); draw(); progress(); });
      draw();
    });
    Array.prototype.forEach.call(exs, function (b) {
      var id = b.getAttribute('data-steps'), n = +b.getAttribute('data-n'), art = document.getElementById(id);
      function draw() {
        var s = st.step[id] || 0;
        Array.prototype.forEach.call(art.querySelectorAll('[data-step]'), function (r) { r.hidden = +r.getAttribute('data-step') > s; });
        b.textContent = s >= n ? 'Start again' : (b.hasAttribute('data-cstep') ? '' : 'What’s the next step? ') + 'Show step ' + (s + 1) + ' of ' + n;
      }
      b.addEventListener('click', function () { var s = st.step[id] || 0; st.step[id] = s >= n ? 0 : s + 1; save(); draw(); progress(); });
      draw();
    });
    Array.prototype.forEach.call(cfus, function (c) {
      var key = c.getAttribute('data-key');
      function draw() {
        var p = st.pick[c.id];
        Array.prototype.forEach.call(c.querySelectorAll('.opt'), function (o) {
          var l = o.getAttribute('data-opt'); o.className = 'opt' + (p === l ? (l === key ? ' right' : ' wrong') : '');
          o.setAttribute('aria-pressed', p === l ? 'true' : 'false');
        });
        Array.prototype.forEach.call(c.querySelectorAll('.fb'), function (f) { f.hidden = f.getAttribute('data-for') !== p; });
      }
      Array.prototype.forEach.call(c.querySelectorAll('.opt'), function (o) {
        o.addEventListener('click', function () { st.pick[c.id] = o.getAttribute('data-opt'); save(); draw(); progress(); });
      });
      draw();
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-hint]'), function (b) {
      var box = document.getElementById(b.getAttribute('data-hint'));
      b.addEventListener('click', function () { box.hidden = !box.hidden; b.setAttribute('aria-expanded', box.hidden ? 'false' : 'true'); b.textContent = box.hidden ? 'Show hint' : 'Hide hint'; });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-more]'), function (b) {
      var box = document.getElementById(b.getAttribute('data-more'));
      b.addEventListener('click', function () { box.hidden = !box.hidden; b.setAttribute('aria-expanded', box.hidden ? 'false' : 'true'); b.textContent = box.hidden ? 'Read more' : 'Show less'; });
    });
    wireRatings();
    progress();
    return;
  }

  // ================= REVISE (Card MK, 29.20) =================
  if (kind === 'revise') {
    var rdate = document.body.getAttribute('data-date'), rT = todayISO();
    var rmain = document.getElementById('revise'), rlock = document.getElementById('lockscreen');
    var rfuture = !rdate || rdate > rT;
    if (rfuture && !unlocked()) {
      rmain.hidden = true; rlock.hidden = false;
      lockScreen(rlock, 'revision page', rdate ? 'It opens on ' + esc(document.body.getAttribute('data-opens')) + ', after the last lesson it covers.' : 'Its lessons haven’t all got dates yet.');
      return;
    }
    if (rfuture && unlocked()) {
      var rtb = document.createElement('div'); rtb.className = 'teacherbar';
      rtb.innerHTML = '<div class="pill"><span>Teacher view · not all taught yet</span><button class="lockbtn" type="button">Lock again</button></div>';
      rtb.querySelector('button').addEventListener('click', function () { sset(UNLOCK, null); location.reload(); });
      rmain.parentNode.insertBefore(rtb, rmain);
    }
    var N = +document.body.getAttribute('data-n') || 10, yk = document.body.getAttribute('data-yk');
    var lids = (document.body.getAttribute('data-lids') || '').split(',');
    var list = document.getElementById('rvlist'), pool = Array.prototype.slice.call(list.querySelectorAll('.rvi'));
    var shown = [], seen = {}, rst = { open: {}, pick: {} };
    // what the student said: 'Not yet' first, else 'Nearly' (worst rating per lesson, from the storage module)
    var rated = Ratings.year(yk), notYet = [], nearly = [];
    lids.forEach(function (l) { var w = worst(rated[l] || {}); if (w === 'not') notYet.push(l); else if (w === 'nearly') nearly.push(l); });
    var have = {}; pool.forEach(function (it) { have[it.getAttribute('data-lid')] = 1; });
    notYet = notYet.filter(function (l) { return have[l]; }); nearly = nearly.filter(function (l) { return have[l]; });
    var first = notYet.length ? notYet : nearly, said = document.getElementById('rvsaid');
    function andList(a) { var s = a.map(function (l) { return '<a href="' + esc(l) + '.html">' + esc(l) + '</a>'; }); return s.length > 1 ? s.slice(0, -1).join(', ') + ' and ' + s[s.length - 1] : s[0]; }
    if (first.length) {
      said.hidden = false; if (!notYet.length) said.className = 'rvsaid rvnear';
      said.innerHTML = 'You said ‘' + (notYet.length ? 'Not yet' : 'Nearly') + '’ on ' + andList(first) + ' — start there. ' +
        (first.length === 1 ? 'Its questions come first.' : 'Their questions come first.');
    }
    (function () {
      var tj = document.getElementById('nytry'); if (!tj || !notYet.length) return;
      var T; try { T = JSON.parse(tj.textContent); } catch (e) { return; }
      var rows = notYet.filter(function (l) { return T[l]; }).map(function (l) {
        return '<div class="nytry"><span class="nytl">Try these first for ' + esc(l) + ':</span>' + T[l].map(function (r) {
          return '<a href="' + esc(r[0]) + '"><span class="nytag">' + esc(r[1]) + '</span> ' + esc(r[2]) + ' ' + esc(r[3]) + '</a>';
        }).join('') + '</div>';
      });
      if (rows.length) said.insertAdjacentHTML('beforeend', rows.join(''));
    })();
    function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    // interleave: one item from each lesson in turn (the lessons in a fresh random order each round)
    function interleave(items, k) {
      var by = {}, ls = [];
      shuffle(items.slice()).forEach(function (it) { var l = it.getAttribute('data-lid'); if (!by[l]) { by[l] = []; ls.push(l); } by[l].push(it); });
      var out = [];
      while (out.length < k) {
        var any = false;
        shuffle(ls).forEach(function (l) { if (out.length < k && by[l].length) { out.push(by[l].shift()); any = true; } });
        if (!any) break;
      }
      return out;
    }
    function draw() {
      var fresh = pool.filter(function (it) { return !seen[it.id]; });
      if (fresh.length < Math.min(N, pool.length)) { seen = {}; fresh = pool.slice(); }
      var pri = fresh.filter(function (it) { return first.indexOf(it.getAttribute('data-lid')) >= 0; });
      var others = fresh.filter(function (it) { return first.indexOf(it.getAttribute('data-lid')) < 0; });
      // the lessons rated low come first, up to 6 of the 10 while other lessons have questions, so the set still mixes
      var take = interleave(pri, others.length ? Math.min(6, N) : N);
      take = take.concat(interleave(others, N - take.length));
      if (take.length < N) take = take.concat(interleave(fresh.filter(function (it) { return take.indexOf(it) < 0; }), N - take.length));
      pool.forEach(function (it) { it.hidden = true; });
      shown = take;
      take.forEach(function (it, i) {
        seen[it.id] = 1;
        delete rst.pick[it.id];
        Array.prototype.forEach.call(it.querySelectorAll('[data-rev]'), function (b) { delete rst.open[b.getAttribute('data-rev')]; });
        it.querySelector('.rvn').textContent = (i + 1) + '.';
        list.appendChild(it); it.hidden = false;
        drawItem(it);
      });
      rprogress();
    }
    function drawItem(it) {
      Array.prototype.forEach.call(it.querySelectorAll('[data-rev]'), function (b) {
        var id = b.getAttribute('data-rev'), o = !!rst.open[id];
        document.getElementById(id).hidden = !o; b.setAttribute('aria-expanded', o ? 'true' : 'false'); b.textContent = o ? 'Hide answer' : 'Show answer';
      });
      if (it.classList.contains('cfu')) {
        var key = it.getAttribute('data-key'), p = rst.pick[it.id];
        Array.prototype.forEach.call(it.querySelectorAll('.opt'), function (o) {
          var l = o.getAttribute('data-opt'); o.className = 'opt' + (p === l ? (l === key ? ' right' : ' wrong') : '');
          o.setAttribute('aria-pressed', p === l ? 'true' : 'false');
        });
        Array.prototype.forEach.call(it.querySelectorAll('.fb'), function (f) { f.hidden = f.getAttribute('data-for') !== p; });
      }
    }
    function rprogress() {
      var done = 0;
      shown.forEach(function (it) {
        if (it.classList.contains('cfu')) { if (rst.pick[it.id] && rst.pick[it.id] === it.getAttribute('data-key')) done++; }
        else {          // Card NG: an item is checked once EVERY answer in it is shown (a Checkpoint card has one per part)
          var bs = it.querySelectorAll('[data-rev]'), all = bs.length > 0;
          Array.prototype.forEach.call(bs, function (b) { if (!rst.open[b.getAttribute('data-rev')]) all = false; });
          if (all) done++;
        }
      });
      var t = document.getElementById('progtext'), f = document.getElementById('progfill');
      if (t) t.textContent = done + ' of ' + shown.length + ' checked';
      if (f) f.style.width = (shown.length ? Math.round(100 * done / shown.length) : 0) + '%';
    }
    pool.forEach(function (it) {
      Array.prototype.forEach.call(it.querySelectorAll('[data-rev]'), function (b) {
        b.addEventListener('click', function () { var id = b.getAttribute('data-rev'); rst.open[id] = !rst.open[id]; drawItem(it); rprogress(); });
      });
      Array.prototype.forEach.call(it.querySelectorAll('.opt'), function (o) {
        o.addEventListener('click', function () { rst.pick[it.id] = o.getAttribute('data-opt'); drawItem(it); rprogress(); });
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.rvmore'), function (b) {
      b.addEventListener('click', function () { draw(); window.scrollTo(0, 0); });
    });
    draw();
    return;
  }

  // ================= HOME =================
  function lessonsOf(y) { var out = []; y.topics.forEach(function (t) { t.lessons.forEach(function (l) { out.push({ id: l[0], title: l[1], date: l[2], topic: t.title, tn: t.n, soon: !!l[3], extra: !!l[4] }); }); }); return out; }
  var tl = document.getElementById('todaylab'); if (tl) tl.textContent = 'Today \u00B7 ' + fmt(todayISO());
  if (kind === 'home') {
    var yds = JSON.parse(document.getElementById('homedata').textContent), T = todayISO();
    document.getElementById('tiles').innerHTML = yds.map(function (y) {
      var ls = lessonsOf(y), td = ls.filter(function (l) { return l.date === T; })[0];
      var past = ls.filter(function (l) { return l.date && l.date < T; }), last = td || past[past.length - 1];
      return '<a class="tile" href="' + y.key + '/index.html"><span class="big">' + esc(y.short) + '</span><span class="nm">' + esc(y.name) + '</span>' +
        '<span class="foot"><span class="tk">' + (td ? 'TODAY' : 'LATEST') + '</span><span class="tl">' + (last ? esc(last.id + '  ' + last.title) : 'No lessons yet') + '</span></span></a>';
    }).join('');
    return;
  }

  // ================= YEAR =================
  if (kind === 'year') {
    var Y = JSON.parse(document.getElementById('yeardata').textContent), view = document.getElementById('yearview');
    var expanded = {};
    function render() {
      var T = todayISO(), un = unlocked(), ls = lessonsOf(Y);
      var td = ls.filter(function (l) { return l.date === T; })[0], past = ls.filter(function (l) { return l.date && l.date < T; });
      var feature = td || past[past.length - 1] || null;
      var recent = past.slice(-4).reverse();
      var curTopic = feature ? feature.tn : (Y.topics[0] ? Y.topics[0].n : null);
      var h = '<div style="padding-top:28px"><a class="back" href="../index.html">\u2190 Change year</a></div>';
      h += '<section class="yhead"><div><div class="yk">' + esc(Y.name) + ' \u00B7 Maths</div><h1>' + esc(Y.short) + ' lessons</h1></div>' +
        '<div class="yside">' + LOGO_IMG + (un ? '<div class="pill"><span>Teacher view \u00B7 every lesson open</span><button class="lockbtn" type="button" id="relock">Lock again</button></div>'
            : '<button class="unl" type="button" id="openpin">' + LOCK_SVG + ' Teacher unlock</button>') + '</div></section>';
      h += '<div class="feat">';
      if (feature) h += '<a class="today" href="' + esc(feature.id) + '.html"><span class="tk">' + (td ? 'TODAY\u2019S LESSON' : 'LATEST LESSON') + '</span>' +
        '<span class="tid">' + esc(feature.id) + ' \u00B7 ' + esc(feature.topic) + '</span><span class="tt">' + esc(feature.title) + '</span><span class="go">Open lesson \u2192</span></a>';
      else h += '<div class="today"><span class="tk">FIRST LESSON</span><span class="tt">Not taught yet</span></div>';
      h += '<div class="catch"><span class="ck">CATCH UP</span>' + (recent.length ? recent.map(function (r) {
        return '<a class="crow" href="' + esc(r.id) + '.html"><span class="i">' + esc(r.id) + '</span><span class="t">' + esc(r.title) + '</span><span class="w">' + fmt(r.date) + '</span></a>';
      }).join('') : '<span class="w">Nothing to catch up on yet.</span>') + '</div></div>';
      h += '<h2 class="yh2">The year, topic by topic</h2><div class="topics">';
      var rated = Ratings.year(Y.key);                 // Card MK: the student's own ratings, this device only
      function rvOpen(d) { return un || (d && d <= T); }
      Y.topics.forEach(function (t, ti) {
        (Y.hts || []).forEach(function (ht) {          // Card MK: "Revise this half term" heads its half term's topics
          if (ht.t !== ti) return;
          h += '<div class="hth"><span class="htl">' + esc(ht.name) + '</span>' + (ht.rv ? (rvOpen(ht.rvd)
            ? '<a class="rvh" href="' + esc(ht.rv) + '">Revise this half term →</a>'
            : '<span class="rvh off">Revise this half term: opens ' + (ht.rvd ? fmt(ht.rvd) : 'when it’s taught') + '</span>') : '') + '</div>';
        });
        var states = t.lessons.map(function (l) { return l[4] ? 'extra' : (!l[2] ? 'future' : (l[2] < T ? 'done' : (l[2] === T ? 'today' : 'future'))); });
        var core = states.filter(function (s) { return s !== 'extra'; }), firstD = (t.lessons.filter(function (l) { return !l[4]; })[0] || t.lessons[0])[2];
        var allF = core.every(function (s) { return s === 'future'; }), allD = core.every(function (s) { return s === 'done'; });
        var ex = expanded[ti] !== undefined ? expanded[ti] : (t.n === curTopic);
        var sub = t.lessons.length + (t.lessons.length === 1 ? ' lesson' : ' lessons') + ' \u00B7 ' + (allD ? 'done' : (allF ? 'starts ' + fmt(firstD) : 'in progress'));
        var nNot = t.lessons.filter(function (l) { return worst(rated[l[0]] || {}) === 'not'; }).length;   // Card MK
        if (nNot) sub += ' \u00B7 <span class="rtsum">' + nNot + ' Not yet</span>';
        var badge = allF && !un ? 'b-future' : (allD ? 'b-done' : 'b-now');
        h += '<div class="tp"><div class="tph"><button class="tprow" type="button" data-t="' + ti + '" aria-expanded="' + ex + '"><span class="badge ' + badge + '">' + esc(t.n) + '</span>' +
          '<span class="tpt"><span class="a' + (allF && !un ? ' mute' : '') + (t.ic ? ' hasic' : '') + '">' + (t.ic ? '<svg class="tic" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#ic-' + esc(t.ic) + '"/></svg><span>' + esc(t.title) + '</span>' : esc(t.title)) + '</span><span class="b">' + sub + '</span></span>' +
          '<span class="pips">' + core.map(function (s) { return '<span class="pip ' + (s === 'done' ? 'done' : (s === 'today' ? 'now' : '')) + '"></span>'; }).join('') + '</span>' +
          '<span class="chev">' + (ex ? '\u2212' : '+') + '</span></button>' +
          (t.rv && rvOpen(t.rvd) ? '<a class="rvl" href="' + esc(t.rv) + '" aria-label="Revise topic ' + esc(t.n) + '">Revise</a>' : '') + '</div>';
        function rpip(lid) { var w = worst(rated[lid] || {}); return w ? '<span class="rtpip rt-' + w + '" role="img" aria-label="You said: ' + RATING_WORD[w] + '" title="You said: ' + RATING_WORD[w] + '"></span>' : ''; }
        if (ex) {
          h += '<div class="lsn">' + t.lessons.map(function (l, i) {
            var s = states[i], open = s !== 'future' || un;
            if (s === 'extra') return '<a class="lrow" href="' + esc(l[0]) + '.html"><span class="i">' + esc(l[0]) + '</span><span class="t">' + esc(l[1]) + '</span><span class="w">Extra</span>' +
              '<span class="chip c-extra">Extra — not taught in class</span></a>';
            if (open) return '<a class="lrow" href="' + esc(l[0]) + '.html"><span class="i">' + esc(l[0]) + rpip(l[0]) + '</span><span class="t">' + esc(l[1]) + '</span><span class="w">' + fmt(l[2]) + '</span>' +
              '<span class="chip ' + (l[3] ? 'c-soon' : (s === 'today' ? 'c-today' : (s === 'done' ? 'c-done' : 'c-open'))) + '">' + (l[3] ? 'Coming soon' : (s === 'today' ? 'Today' : (s === 'done' ? 'Done' : 'Open'))) + '</span></a>';
            return '<button class="lrow shut" type="button" data-lock="' + esc(l[0]) + '"><span class="i">' + esc(l[0]) + '</span><span class="t">' + esc(l[1]) + '</span><span class="w">' + fmt(l[2]) + '</span>' +
              '<span class="c-lock">' + LOCK_SVG + 'Locked</span></button>';
          }).join('') + '</div>';
        }
        h += '</div>';
      });
      h += '</div>';
      view.innerHTML = h;
      Array.prototype.forEach.call(view.querySelectorAll('.tprow'), function (b) {
        b.addEventListener('click', function () { var i = +b.getAttribute('data-t'); expanded[i] = b.getAttribute('aria-expanded') !== 'true'; render(); });
      });
      Array.prototype.forEach.call(view.querySelectorAll('[data-lock], #openpin'), function (b) {
        b.addEventListener('click', function () { openPin(render); });
      });
      var rl = document.getElementById('relock'); if (rl) rl.addEventListener('click', function () { sset(UNLOCK, null); render(); });
    }
    render();
  }
})();
/* Card LI (conventions 29.19): only a cell STILL wider than its card after breaking scrolls, and only sideways. Its
   content is wrapped in .hx (overflow-x:auto, overflow-y:hidden, padded); a cell that fits again is unwrapped. Watched
   with a ResizeObserver, so a revealed step, a shown answer and a rotated phone are each measured when they appear. */
(function () {
  'use strict';
  var SEL = '.lg .l, .lg .r, .lg .w, .al .alr, .ans, .tq > .q, .gq > .q, .pq > div:first-child, .xq > div, .opt';
  var cells = document.querySelectorAll(SEL);
  if (!cells.length) return;
  var ledgers = document.querySelectorAll('.steps.lg'), optsets = document.querySelectorAll('.opts');
  function over(c) { return c.clientWidth > 0 && c.scrollWidth > c.clientWidth + 1; }
  function unwrap(c) {
    var w = c.firstElementChild;
    if (w && w.classList.contains('hx') && c.childNodes.length === 1) { while (w.firstChild) c.insertBefore(w.firstChild, w); c.removeChild(w); }
  }
  var ROWSTACK = 1 === 1;
  function wraps(l) {               // the left side's maths pieces sit on more than one line
    if (!l.offsetParent) return false;
    var m = l.querySelectorAll('math');
    if (m.length < 2) return false;
    var a = m[0].getBoundingClientRect(), b = m[m.length - 1].getBoundingClientRect();
    return b.top >= a.bottom - 2;
  }
  function any(root, sel) { var a = root.querySelectorAll(sel); for (var i = 0; i < a.length; i++) if (over(a[i])) return true; return false; }
  function run() {
    queued = null;
    var i;
    // start from the authored layout, then: 1. break (stack a ledger, one option per row), 2. scroll what still overflows
    for (i = 0; i < cells.length; i++) unwrap(cells[i]);
    for (i = 0; i < ledgers.length; i++) ledgers[i].classList.remove('lstk');
    var lw = document.querySelectorAll('.steps.lg .step.lwr');
    for (i = 0; i < lw.length; i++) lw[i].classList.remove('lwr');
    for (i = 0; i < optsets.length; i++) optsets[i].classList.remove('wjs');
    for (i = 0; i < ledgers.length; i++) if (any(ledgers[i], '.l, .r, .w')) ledgers[i].classList.add('lstk');
    if (ROWSTACK) {                 // Card MQ (7.44 (bb1)): a wrapping left side stacks the row, never wraps beside it
      for (i = 0; i < ledgers.length; i++) {
        var ls = ledgers[i].querySelectorAll('.step > .l'), j;
        for (j = 0; j < ls.length; j++) if (wraps(ls[j])) { ledgers[i].classList.add('lstk'); break; }
        if (!ledgers[i].classList.contains('lstk')) continue;
        for (j = 0; j < ls.length; j++) if (wraps(ls[j])) ls[j].parentNode.classList.add('lwr');
      }
    }
    for (i = 0; i < optsets.length; i++) if (!optsets[i].classList.contains('wide') && any(optsets[i], '.opt')) optsets[i].classList.add('wjs');
    for (i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (!over(c)) continue;
      var w = document.createElement('div'); w.className = 'hx';
      while (c.firstChild) w.appendChild(c.firstChild);
      c.appendChild(w);
    }
  }
  var queued = null;
  function soon() { if (!queued) queued = window.requestAnimationFrame(run); }
  if (window.ResizeObserver) { var ro = new ResizeObserver(soon); for (var i = 0; i < cells.length; i++) ro.observe(cells[i]); }
  window.addEventListener('resize', soon);
  window.addEventListener('load', soon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
  soon();
})();
