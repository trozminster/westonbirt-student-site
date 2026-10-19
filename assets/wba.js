(function (G) {
'use strict';
if (G.WBA) return;
var C = {ink: '#2B2823', mute: '#8B857D', mar: '#5B1A24', teal: '#0F5460', mark: '#2E7C8A', t1: '#FBEDEC',
t2: '#EAF5F7', fr: '#E3C4C8', fb: '#BFDCE1', edge: '#E5E0D7', amb: '#DCA83C', bg: '#F8F6F1', white: '#FFFFFF'};
var MATH = "'Latin Modern Math','Cambria Math','STIX Two Math',serif", PROSE = "Mulish,'Segoe UI',system-ui,sans-serif";
var GREEK = {pi: 0x1D70B, theta: 0x1D703, alpha: 0x1D6FC, xi: 0x1D709};   // xi: Card MU (31.8, MS b6 E4)
var UPRIGHT = {sin: 1, cos: 1, tan: 1};
var OPS = {'-': '−', '*': '×', '<=': '≤', '>=': '≥', '~': '≈'};
function n1(v) { return Math.round(v * 10) / 10; }
function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function col(c) { return c == null ? 'none' : (C[c] || c); }
function ital(ch) {                         // a letter in maths is italic: the Unicode maths-italic alphabet
var c = ch.charCodeAt(0);
if (ch === 'h') return 'ℎ';
if (c >= 97 && c <= 122) return String.fromCodePoint(0x1D44E + c - 97);
if (c >= 65 && c <= 90) return String.fromCodePoint(0x1D434 + c - 65);
return ch;
}
function script(s, i) {                      // the body after ^ or _ at s[i]: [body, the index after it]
if (s[i + 1] === '{') { var k = s.indexOf('}', i); if (k < 0) k = s.length; return [s.slice(i + 2, k), k + 1]; }
var m = /^(?:[0-9]+|[a-z]+)/i.exec(s.slice(i + 1)) || [''];
return [m[0], i + 1 + m[0].length];
}
function mathSpans(s, size, html) {          // html: the same maths for a page (an index is <sup>, a subscript <sub>)
var out = '', i = 0, back = 0, up = n1(size * 0.36), dn = n1(size * 0.22), sm = n1(size * 0.71);
function put(t) { if (html) { out += esc(t); return; } if (back) { out += '<tspan dy="' + n1(back) + '">' + esc(t) + '</tspan>'; back = 0; } else out += esc(t); }
while (i < s.length) {
var ch = s[i], m;
if (ch === "'") { var j = s.indexOf("'", i + 1); if (j < 0) j = s.length; put(s.slice(i + 1, j)); i = j + 1; continue; }
if (ch === '^' || ch === '_') {
var sc = script(s, i), body = sc[0], sub = ch === '_', d0 = back; i = sc[1]; back = 0;
if (html) { out += (sub ? '<sub>' : '<sup>') + mathSpans(body, sm, 1) + (sub ? '</sub>' : '</sup>'); continue; }
out += '<tspan dy="' + n1(d0 + (sub ? dn : -up)) + '" font-size="' + sm + '">' + mathSpans(body, sm) + '</tspan>';
back = sub ? -dn : up; continue;
}
if (s.slice(i, i + 5) === 'sqrt{') {        // Card MQ (31.8, MS b2 E1): sqrt{...} is a square root
var e = s.indexOf('}', i + 5); if (e < 0) e = s.length;
var rad = s.slice(i + 5, e); i = e + 1;
if (html) { out += '<span class="wba-rt"><svg viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0.5 12.5L2.5 11.4L5.5 19.5L9.8 0.3L10 0.3"/></svg><span class="wba-rd">' + mathSpans(rad, size, 1) + '</span></span>'; continue; }
var wrap = rad.length > 1 && !/^\([^()]*\)$/.test(rad);   // one bracketed group needs no second pair
var b0 = back; back = 0;
out += (b0 ? '<tspan dy="' + n1(b0) + '" font-family="' : '<tspan font-family="') + PROSE.replace(/'/g, '&apos;') + '">√</tspan>' + (wrap ? '(' : '') + mathSpans(rad, size);
back = LIFT; if (wrap) put(')'); continue;
}
if ((m = /^[a-z]+/i.exec(s.slice(i)))) {
var w = m[0], t = '';
if (GREEK[w]) t = String.fromCodePoint(GREEK[w]);
else if (UPRIGHT[w]) t = w;
else for (var q = 0; q < w.length; q++) t += ital(w[q]);
put(t); i += w.length; continue;
}
if (ch === ' ') {                          // a space is kept only beside an operator or after a comma
var prev = s.slice(0, i).replace(/ +$/, '').slice(-1), nx = s.slice(i).replace(/^ +/, '').slice(0, 2);
if (/[0-9]/.test(prev) && /^[0-9]/.test(nx)) put('\u2009');
else if (/[=+\-*×|<>~≈,:÷≠≤≥→±]/.test(prev) || /^[=+\-*×|<>~≈÷':≠≤≥→±]/.test(nx) ||
/(^|[^a-z])(sin|cos|tan)$/i.test(s.slice(0, i).replace(/ +$/, '')) ||
/^(sin|cos|tan)(?![a-z])/i.test(s.slice(i).replace(/^ +/, ''))) put(' ');
while (s[i] === ' ') i++;
continue;
}
var two = s.slice(i, i + 2);
if (OPS[two]) { put(OPS[two]); i += 2; continue; }
put(OPS[ch] || ch); i++;
}
LIFT = back;                                 // a closing index or subscript leaves the baseline moved: the caller returns it
return out;
}
var LIFT = 0;
var ADV = {'(': 0.389, ')': 0.389, ' ': 0.333, '-': 0.778, '+': 0.778, '=': 0.778, '÷': 0.778, '×': 0.778, '*': 0.778};
function advUnits(t) {
var e = 0, i = 0;
while (i < t.length) {
if (t[i] === '^' || t[i] === '_') { var sc = script(t, i); e += 0.71 * advUnits(sc[0]); i = sc[1]; continue; }
e += ADV[t[i]] || 0.5; i++;
}
return e;
}
function mathAdv(t, z) { return advUnits(t) * z * 1.12; }
function richSpans(s, size) {                 // prose with $maths$ inside
var drop = 0;
return s.split('$').map(function (part, k) {
if (!part) return '';
var dy = drop ? ' dy="' + drop + '"' : ''; drop = 0;
if (k % 2) { var m = mathSpans(part, size * 1.12); drop = LIFT; return '<tspan' + dy + ' font-family="' + MATH + '" font-size="' + n1(size * 1.12) + '">' + m + '</tspan>'; }
return '<tspan' + dy + '>' + esc(part) + '</tspan>';
}).join('');
}
function Kit() { this.o = []; }
function paint(o, defS) {
o = o || {};
var r = ' fill="' + col(o.f) + '"';
var s = o.s === undefined ? defS : o.s;
if (s) r += ' stroke="' + col(s) + '" stroke-width="' + (o.w || 2) + '" stroke-linejoin="round" stroke-linecap="round"';
if (o.d) r += ' stroke-dasharray="' + o.d + '"';
if (o.op != null && o.op < 1) r += ' opacity="' + n1(o.op * 100) / 100 + '"';
return r;
}
function anchor(a) { return a === 's' ? 'start' : a === 'e' ? 'end' : 'middle'; }
Kit.prototype = {
C: C,
line: function (x1, y1, x2, y2, o) { this.o.push('<line x1="' + n1(x1) + '" y1="' + n1(y1) + '" x2="' + n1(x2) + '" y2="' + n1(y2) + '"' + paint(o, 'ink') + '/>'); },
segs: function (list, o) {                 // many lines in one stroke style, one path (a grid, ticks)
this.path(list.map(function (q) { return 'M' + n1(q[0]) + ' ' + n1(q[1]) + 'L' + n1(q[2]) + ' ' + n1(q[3]); }).join(''), o);
},
poly: function (pts, o) { this.o.push('<polygon points="' + pts.map(function (p) { return n1(p[0]) + ',' + n1(p[1]); }).join(' ') + '"' + paint(o, 'ink') + '/>'); },
path: function (d, o) { this.o.push('<path d="' + d + '"' + paint(o, 'ink') + '/>'); },
rect: function (x, y, w, h, o) { this.o.push('<rect x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) + '"' + paint(o, 'ink') + '/>'); },
circle: function (x, y, r, o) { this.o.push('<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(r) + '"' + paint(o, 'ink') + '/>'); },
dot: function (x, y, c) { this.circle(x, y, 6, {f: c || 'mar', s: null}); },
arrow: function (x1, y1, x2, y2, o) {
o = o || {}; var a = Math.atan2(y2 - y1, x2 - x1), h = o.h || 12, c = o.s || 'ink';
this.line(x1, y1, x2 - Math.cos(a) * h * 0.6, y2 - Math.sin(a) * h * 0.6, o);
this.poly([[x2, y2], [x2 - h * Math.cos(a - 0.4), y2 - h * Math.sin(a - 0.4)], [x2 - h * Math.cos(a + 0.4), y2 - h * Math.sin(a + 0.4)]], {f: c, s: null});
},
_t: function (x, y, inner, o, fam, size) {
o = o || {};
this.o.push('<text xml:space="preserve" x="' + n1(x) + '" y="' + n1(y) + '" font-family="' + fam + '" font-size="' + size + '" text-anchor="' + anchor(o.a) + '" fill="' + col(o.f || 'ink') + '"' + (o.b ? ' font-weight="700"' : '') + (o.halo === false ? ' class="nh"' : '') + (o.op != null ? ' opacity="' + o.op + '"' : '') + '>' + inner + '</text>');
},
text: function (x, y, s, o) { var z = (o && o.z) || 20; this._t(x, y, esc(s), o, PROSE, z); },
math: function (x, y, s, o) { var z = n1(((o && o.z) || 22) * 1.12); this._t(x, y, mathSpans(s, z), o, MATH, z); },
rich: function (x, y, s, o) { var z = (o && o.z) || 20; this._t(x, y, richSpans(s, z), o, PROSE, z); },
root: function (x, y, rad, o) {
o = o || {}; var z = o.z || 22, k = z / 22, c = o.f || 'ink', w = rad ? mathAdv(rad, z) : 8;
var d = [[x, y - 9 * k], [x + 4 * k, y - 11 * k], [x + 10 * k, y + 4 * k], [x + 17 * k, y - 22 * k], [x + 21 * k + w + 3, y - 22 * k]];
this.path('M' + d.map(function (p) { return n1(p[0]) + ' ' + n1(p[1]); }).join('L'), {f: null, s: c, w: o.w || 1.8, op: o.op});
if (rad) this.math(x + 20 * k, y, rad, {z: z, a: 's', f: c, op: o.op});
return 21 * k + w + 3;
},
frac: function (x, y, a, b, o) {
o = o || {}; var z = o.z || 20, c = o.f || 'ink', w = Math.max(fracW(a, z), fracW(b, z)), m = o.a === 's' ? x + w / 2 : x;
this.math(m, y - 6, '' + a, {z: z, f: c, op: o.op});
this.line(m - w / 2, y, m + w / 2, y, {s: c, w: 1.8, op: o.op});
this.math(m, y + 6 + z * 0.9, '' + b, {z: z, f: c, op: o.op});
return w;
},
colvec: function (x, y, top, bot, o) {
o = o || {}; var h = 30, w = 22, c = o.f || 'ink';
this.path('M' + (x - w + 6) + ' ' + (y - h) + 'Q' + (x - w - 4) + ' ' + y + ' ' + (x - w + 6) + ' ' + (y + h), {f: null, s: c, w: 1.8, op: o.op});
this.path('M' + (x + w - 6) + ' ' + (y - h) + 'Q' + (x + w + 4) + ' ' + y + ' ' + (x + w - 6) + ' ' + (y + h), {f: null, s: c, w: 1.8, op: o.op});
this.math(x, y - 5, '' + top, {z: o.z || 20, f: c, op: o.op}); this.math(x, y + 23, '' + bot, {z: o.z || 20, f: c, op: o.op});
},
out: function () { return this.o.join(''); }
};
function fracW(t, z) { return String(t).replace('-', '').length * 0.52 * z * 1.12 + (/-/.test(t) ? 0.8 * z : 0) + 8; }
function stepState(A, k) {
var s = {}, key;
for (key in A.s0 || {}) s[key] = A.s0[key];
for (var i = 0; i <= k; i++) for (key in A.steps[i].s || {}) s[key] = A.steps[i].s[key];
return s;
}
var CAP_H = 56;
function capHTML(cap) {                      // the caption under the live picture, as page text (readable at 390 px)
return (cap || '').split('$').map(function (part, k) {
return k % 2 ? '<span class="wba-m">' + mathSpans(part, 20, 1) + '</span>' : esc(part);
}).join('');
}
function inner(A, s, cap) {
var g = new Kit(), w = A.view[0], h = A.view[1];
g.o.push('<style>text{stroke:#FFF;stroke-width:4px;stroke-linejoin:round;paint-order:stroke}.nh{stroke:none}</style>');
A.draw(g, s);
if (cap) g.rich(w / 2, h - CAP_H / 2 + 8, cap, {z: 22});
return g.out();
}
function svg(A, s, cap, opt) {
opt = opt || {};
var w = A.view[0], h = A.view[1];
return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '"' + (opt.px ? ' width="' + opt.px + '" height="' + Math.round(opt.px * h / w) + '"' : '') +
' role="img" aria-label="' + esc(plain(A.title)) + '">' + (opt.bg ? '<rect width="' + w + '" height="' + h + '" fill="' + col(opt.bg) + '"/>' : '') + inner(A, s, cap) + '</svg>';
}
function capAt(A, k, s) { var c = A.steps[k].cap; return typeof c === 'function' ? c(s || stepState(A, k)) : c; }
function frames(A, opt) {                      // the slide's frames, one per step, and the step captions
return A.steps.map(function (st, k) { var s = stepState(A, k), c = capAt(A, k, s); return {cap: c, svg: svg(A, s, c, opt)}; });
}
var REG = {};
function def(A) {
if (!A.steps || A.steps.length < 3 || A.steps.length > 8) throw new Error(A.id + ': an animation has 3-8 steps');
REG[A.id] = A;
if (G.document) mountAll();
}
var CSS = '.wba{margin:0;background:#FFF;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:10px;min-width:0}' +
'.wba svg{display:block;width:100%;height:auto}.wba h3{margin:0;font-size:18px;font-weight:800}' +
'.wba-c{display:flex;gap:8px;align-items:center;flex-wrap:wrap}' +
'.wba button{font:700 14px Mulish,system-ui,sans-serif;border-radius:999px;min-height:44px;padding:10px 16px;cursor:pointer;border:1.5px solid #5B1A24;background:#FFF;color:#5B1A24}' +
'.wba button.go{background:#5B1A24;color:#FFF}.wba button:disabled{opacity:.35;cursor:default}' +
'.wba-n{margin-left:auto;font-size:14px;color:#8B857D}' +
'.wba-cap{margin:0;font-size:16px;line-height:1.5;text-align:center;min-height:3em}.wba-m{font-family:' + MATH + ';font-size:1.12em;white-space:nowrap}' +
'.wba-rt{white-space:nowrap}.wba-rt svg{display:inline-block;width:.6em;height:1.2em;vertical-align:-.28em;fill:none;stroke:currentColor;stroke-width:1.2;overflow:visible}' +
'.wba-rd{border-top:.06em solid currentColor;padding:.08em .08em 0 .04em}' +
'.wba label{display:flex;align-items:center;gap:12px;font-size:15px}.wba input{flex:1;min-width:0;accent-color:#5B1A24;min-height:32px}' +
'.wba output{min-width:3.2em;text-align:right;font-variant-numeric:tabular-nums}' +
'.wba-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}';
function el(tag, cls, txt) { var e = G.document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
var SUPS = {0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻', '+': '⁺', n: 'ⁿ'};
var SUBS = {0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉'};
function plainMath(t) {
var out = '', i = 0;
while (i < t.length) {
var ch = t[i];
if (ch === "'") { var j = t.indexOf("'", i + 1); if (j < 0) j = t.length; out += t.slice(i + 1, j); i = j + 1; continue; }
if (ch === ' ') {                          // a space reads only where the drawing keeps it (mathSpans)
var pv = t.slice(0, i).replace(/ +$/, ''), nx = t.slice(i).replace(/^ +/, '');
if (/[0-9]$/.test(pv) && /^[0-9]/.test(nx)) out += '\u2009';
else if (/[=+\-*×|<>~≈,:÷≠≤≥→±]$/.test(pv) || /^[=+\-*×|<>~≈÷':≠≤≥→±]/.test(nx) ||
/(^|[^a-z])(sin|cos|tan)$/i.test(pv) || /^(sin|cos|tan)(?![a-z])/i.test(nx)) out += ' ';
while (t[i] === ' ') i++;
continue;
}
if (ch === '^' || ch === '_') {
var sc = script(t, i), map = ch === '^' ? SUPS : SUBS, b = plainMath(sc[0]), r = '';
for (var k = 0; k < b.length && r != null; k++) r = map[b[k]] ? r + map[b[k]] : null;
out += r != null && b ? r : ch + (b.length > 1 ? '(' + b + ')' : b); i = sc[1]; continue;
}
if (t.slice(i, i + 5) === 'sqrt{') {
var e = t.indexOf('}', i + 5); if (e < 0) e = t.length;
var rad = plainMath(t.slice(i + 5, e)); i = e + 1;
out += '√' + (/[ +\-×÷=]/.test(rad) && !/^\([^()]*\)$/.test(rad) ? '(' + rad + ')' : rad); continue;
}
var two = t.slice(i, i + 2);
if (two === '<=' || two === '>=') { out += two === '<=' ? '≤' : '≥'; i += 2; continue; }
out += ch === '*' ? '×' : ch === '~' ? '≈' : ch; i++;
}
return out;
}
function plain(cap) { return (cap || '').split('$').map(function (p, k) { return k % 2 ? plainMath(p) : p; }).join(''); }
function mountAll() {
var figs = G.document.querySelectorAll('figure.wba[data-wba]:not([data-on])');
for (var i = 0; i < figs.length; i++) if (REG[figs[i].getAttribute('data-wba')]) mount(figs[i], REG[figs[i].getAttribute('data-wba')]);
}
function mount(fig, A) {
if (!G.document.getElementById('wba-css')) { var st = el('style'); st.id = 'wba-css'; st.textContent = CSS; G.document.head.appendChild(st); }
fig.setAttribute('data-on', '1');
var sv = fig.querySelector('svg'), n = A.steps.length, k = 0, cur = stepState(A, 0), cap = capAt(A, 0, cur), timer = 0, raf = 0;
var kept = {}, exploring = false;
function capFor(j, s, moved) {
var c = A.steps[j].cap;
if (typeof c === 'function') return exploring && A.cap ? A.cap(s) : c(s);
return (moved || exploring) && A.cap ? A.cap(s) : c;
}
function liveCap() { return capFor(k, cur, false); }
var still = G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches;
var bar = el('div', 'wba-c'), prev = el('button', '', '‹ Back'), play = el('button', 'go', 'Play'), next = el('button', '', 'Next ›');
var cnt = el('span', 'wba-n'), live = el('span', 'wba-sr');
live.setAttribute('aria-live', 'polite');
bar.appendChild(prev); bar.appendChild(play); bar.appendChild(next); bar.appendChild(cnt); bar.appendChild(live);
var pc = el('p', 'wba-cap');
sv.setAttribute('viewBox', '0 0 ' + A.view[0] + ' ' + (A.view[1] - CAP_H));
fig.insertBefore(pc, sv.nextSibling);
fig.appendChild(bar);
var sl = (A.sliders || []).map(function (d) {
var lab = el('label'), nm = el('span'), inp = el('input'), outp = el('output');
nm.innerHTML = mathSpansHTML(d.lab || d.k);
inp.type = 'range'; inp.min = d.min; inp.max = d.max; inp.step = d.step;
inp.setAttribute('aria-label', d.k);
lab.appendChild(nm); lab.appendChild(inp); lab.appendChild(outp); fig.appendChild(lab);
inp.addEventListener('input', function () { stop(); cancel(); cur[d.k] = +inp.value; kept[d.k] = cur[d.k]; exploring = true; cap = liveCap(); draw(); });
return {d: d, inp: inp, out: outp, lab: lab};
});
function rangeAt(d, j) {                     // the slider's [min, max, shown] at step index j
var s = j + 1, lo = d.min, hi = d.max;
if (d.at) for (var key in d.at) if (+key <= s) { lo = d.at[key][0]; hi = d.at[key][1]; }
return [lo, hi, !(d.from && s < d.from)];
}
function sliderAt(x) {
var r = rangeAt(x.d, k);
if (+x.inp.min !== +r[0]) x.inp.min = r[0];
if (+x.inp.max !== +r[1]) x.inp.max = r[1];
x.lab.hidden = !r[2];
}
function draw() {
sv.innerHTML = inner(A, cur, '');
pc.innerHTML = capHTML(cap);
cnt.textContent = 'Step ' + (k + 1) + ' of ' + n;
prev.disabled = k === 0; next.disabled = k === n - 1;
sl.forEach(function (x) { if (x.d.at || x.d.from) sliderAt(x); x.inp.value = cur[x.d.k]; x.out.textContent = x.d.fmt ? x.d.fmt(cur[x.d.k]) : fmt(cur[x.d.k]); });
}
function cancel() { if (raf) G.cancelAnimationFrame(raf); raf = 0; }
function go(j, done) {
cancel();
var k0 = k, from = cur, to = stepState(A, j), ints = A.ints || [], t0 = 0, dur = still ? 0 : (A.ms || 800), own = A.steps[j].s || {};
var moved = false;
sl.forEach(function (x) {                    // carry what the sliders set, unless step j sets it, hides it or rules it out
var key = x.d.k, r = rangeAt(x.d, j);
if (!(key in kept)) return;
if (key in own || !r[2] || kept[key] < r[0] || kept[key] > r[1]) { delete kept[key]; return; }
if (to[key] !== kept[key]) moved = true;
to[key] = kept[key];
});
k = j; exploring = false; cap = capFor(j, to, moved); live.textContent = plain(cap);
ints.forEach(function (key) { from[key] = to[key]; });
if (A.steps[j].from && j === k0 + 1) for (var fk in A.steps[j].from) if (!(fk in kept)) from[fk] = A.steps[j].from[fk];
function tick(ts) {
if (!t0) t0 = ts;
var p = dur ? Math.min(1, (ts - t0) / dur) : 1, e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2, s = {};
for (var key in to) s[key] = (typeof to[key] === 'number' && typeof from[key] === 'number') ? from[key] + (to[key] - from[key]) * e : to[key];
cur = s; draw();
if (p < 1) raf = G.requestAnimationFrame(tick); else { raf = 0; cur = to; if (done) done(); }
}
raf = G.requestAnimationFrame(tick);
}
function stop() { if (timer) G.clearTimeout(timer); timer = 0; play.textContent = 'Play'; }
function onward() { if (k >= n - 1) { stop(); return; } go(k + 1, function () { if (timer) timer = G.setTimeout(onward, A.hold || 1100); }); }
play.addEventListener('click', function () {
if (timer) { stop(); return; }
play.textContent = 'Pause'; timer = 1;
if (k >= n - 1) { kept = {}; exploring = false; cur = stepState(A, 0); k = 0; cap = capAt(A, 0, cur); draw(); timer = G.setTimeout(onward, 700); } else onward();
});
prev.addEventListener('click', function () { stop(); if (k > 0) go(k - 1); });
next.addEventListener('click', function () { stop(); if (k < n - 1) go(k + 1); });
draw(); live.textContent = plain(cap);
}
function fmt(v) { return (Math.round(v * 100) / 100).toString().replace('-', '−'); }
function mathSpansHTML(s) {
var w = Math.max(44, Math.ceil(mathAdv(s.replace(/'/g, ''), 22) * 0.92 + 6));
return '<svg width="' + (w === 44 ? '2.2' : n1(w / 20)) + 'em" height="1.4em" viewBox="0 0 ' + w + ' 28" aria-hidden="true"><text x="2" y="21" font-family="' + MATH + '" font-size="22">' + mathSpans(s, 22) + '</text></svg>';
}
G.WBA = {def: def, svg: svg, frames: frames, stepState: stepState, capAt: capAt, reg: REG, C: C, mathSpans: mathSpans, plain: plain,
mathAdv: mathAdv};
var q = G.WBQ || [];
G.WBQ = {push: def};
q.forEach(def);
if (G.document && G.document.readyState === 'loading') G.document.addEventListener('DOMContentLoaded', mountAll);
if (typeof module !== 'undefined' && module.exports) module.exports = G.WBA;
})(typeof window !== 'undefined' ? window : globalThis);
