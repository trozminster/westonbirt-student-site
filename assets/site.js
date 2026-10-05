
(function () {
  'use strict';
  var SALT = 'westonbirt-maths-student-site', HASH = '3ed45339cc92bfd6b343ede0e8bd6f4d6bd3da637f5380fafb8d9e7b7991a793', UNLOCK = 'wb-student-unlocked';
  function sget(k) { try { return window.sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { if (v === null) window.sessionStorage.removeItem(k); else window.sessionStorage.setItem(k, v); } catch (e) {} }
  function lget(k) { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lset(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
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
  window.WBStudent = { openPin: openPin, unlocked: unlocked, todayISO: todayISO, relock: function () { sset(UNLOCK, null); } };
  var kind = document.body.getAttribute('data-kind');

  // ================= LESSON =================
  if (kind === 'lesson') {
    var date = document.body.getAttribute('data-date'), today = todayISO();
    var lesson = document.getElementById('lesson'), lock = document.getElementById('lockscreen');
    var future = !date || date > today;
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
      tb.innerHTML = '<div class="pill"><span>Teacher view \u00B7 not taught yet</span><button class="dark" type="button">Lock again</button></div>';
      tb.querySelector('button').addEventListener('click', function () { sset(UNLOCK, null); location.reload(); });
      lesson.parentNode.insertBefore(tb, lesson);
    }
    var KEY = 'wb-student:' + document.body.getAttribute('data-page');
    var st = lget(KEY) || {}; st.open = st.open || {}; st.step = st.step || {}; st.pick = st.pick || {};
    function save() { lset(KEY, st); }
    var revs = document.querySelectorAll('[data-rev]'), exs = document.querySelectorAll('[data-steps]'), cfus = document.querySelectorAll('.cfu');
    function progress() {
      var total = revs.length + exs.length + cfus.length, done = 0;
      Array.prototype.forEach.call(revs, function (b) { if (st.open[b.getAttribute('data-rev')]) done++; });
      Array.prototype.forEach.call(exs, function (b) { var id = b.getAttribute('data-steps'); if ((st.step[id] || 0) >= +b.getAttribute('data-n')) done++; });
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
        b.textContent = s >= n ? 'Start again' : 'Show step ' + (s + 1) + ' of ' + n;
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
    Array.prototype.forEach.call(document.querySelectorAll('[data-more]'), function (b) {
      var box = document.getElementById(b.getAttribute('data-more'));
      b.addEventListener('click', function () { box.hidden = !box.hidden; b.setAttribute('aria-expanded', box.hidden ? 'false' : 'true'); b.textContent = box.hidden ? 'Read more' : 'Show less'; });
    });
    progress();
    return;
  }

  // ================= HOME =================
  function lessonsOf(y) { var out = []; y.topics.forEach(function (t) { t.lessons.forEach(function (l) { out.push({ id: l[0], title: l[1], date: l[2], topic: t.title, tn: t.n, soon: !!l[3] }); }); }); return out; }
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
        (un ? '<div class="pill"><span>Teacher view \u00B7 every lesson open</span><button class="dark" type="button" id="relock">Lock again</button></div>'
            : '<button class="unl" type="button" id="openpin">' + LOCK_SVG + ' Teacher unlock</button>') + '</section>';
      h += '<div class="feat">';
      if (feature) h += '<a class="today" href="' + esc(feature.id) + '.html"><span class="tk">' + (td ? 'TODAY\u2019S LESSON' : 'LATEST LESSON') + '</span>' +
        '<span class="tid">' + esc(feature.id) + ' \u00B7 ' + esc(feature.topic) + '</span><span class="tt">' + esc(feature.title) + '</span><span class="go">Open lesson \u2192</span></a>';
      else h += '<div class="today"><span class="tk">FIRST LESSON</span><span class="tt">Not taught yet</span></div>';
      h += '<div class="catch"><span class="ck">CATCH UP</span>' + (recent.length ? recent.map(function (r) {
        return '<a class="crow" href="' + esc(r.id) + '.html"><span class="i">' + esc(r.id) + '</span><span class="t">' + esc(r.title) + '</span><span class="w">' + fmt(r.date) + '</span></a>';
      }).join('') : '<span class="w">Nothing to catch up on yet.</span>') + '</div></div>';
      h += '<h2 class="yh2">The year, topic by topic</h2><div class="topics">';
      Y.topics.forEach(function (t, ti) {
        var states = t.lessons.map(function (l) { return !l[2] ? 'future' : (l[2] < T ? 'done' : (l[2] === T ? 'today' : 'future')); });
        var allF = states.every(function (s) { return s === 'future'; }), allD = states.every(function (s) { return s === 'done'; });
        var ex = expanded[ti] !== undefined ? expanded[ti] : (t.n === curTopic);
        var sub = t.lessons.length + (t.lessons.length === 1 ? ' lesson' : ' lessons') + ' \u00B7 ' + (allD ? 'done' : (allF ? 'starts ' + fmt(t.lessons[0][2]) : 'in progress'));
        var badge = allF && !un ? 'b-future' : (allD ? 'b-done' : 'b-now');
        h += '<div class="tp"><button class="tprow" type="button" data-t="' + ti + '" aria-expanded="' + ex + '"><span class="badge ' + badge + '">' + esc(t.n) + '</span>' +
          '<span class="tpt"><span class="a' + (allF && !un ? ' mute' : '') + '">' + esc(t.title) + '</span><span class="b">' + sub + '</span></span>' +
          '<span class="pips">' + states.map(function (s) { return '<span class="pip ' + (s === 'done' ? 'done' : (s === 'today' ? 'today' : '')) + '"></span>'; }).join('') + '</span>' +
          '<span class="chev">' + (ex ? '\u2212' : '+') + '</span></button>';
        if (ex) {
          h += '<div class="lsn">' + t.lessons.map(function (l, i) {
            var s = states[i], open = s !== 'future' || un;
            if (open) return '<a class="lrow" href="' + esc(l[0]) + '.html"><span class="i">' + esc(l[0]) + '</span><span class="t">' + esc(l[1]) + '</span><span class="w">' + fmt(l[2]) + '</span>' +
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
