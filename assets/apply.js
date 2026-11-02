/* Applications: submit, follow by number, my applications. Nothing typed is sent anywhere. */
window.MoveCore = (function () {
  "use strict";
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function ri(r, a, b) { return a + Math.floor(r() * (b - a + 1)); }
  function pick(r, a) { return a[Math.floor(r() * a.length)]; }
  /* dates are UTC midnights standing for days of the Irad calendar */
  function addDays(d, n) { var x = new Date(d.getTime()); x.setUTCDate(x.getUTCDate() + n); return x; }
  function isW(d) { var g = d.getUTCDay(); return g !== 0 && g !== 6; }
  function addW(d, n) { var x = d; while (n > 0) { x = addDays(x, 1); if (isW(x)) n--; } return x; }
  function onW(d) { var x = d; while (!isW(x)) x = addDays(x, 1); return x; }
  function onDow(d, dow) { var x = d; while (x.getUTCDay() !== dow) x = addDays(x, 1); return x; }
  function wdays(a, b) { var n = 0, x = a; while (x < b) { x = addDays(x, 1); if (isW(x)) n++; } return n; }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function day(s) { return new Date(s + "T00:00:00Z"); }
  function ymd(s) { var d = day("20" + s.slice(0, 2) + "-" + s.slice(2, 4) + "-" + s.slice(4, 6)); return isNaN(d) || iso(d).replace(/-/g, "").slice(2) !== s ? null : d; }
  /* now in Irad time: {today, hour, min} */
  function irt(at) { var t = new Date((at || Date.now()) + 6 * 3600e3); return { today: day(t.toISOString().slice(0, 10)), hour: t.getUTCHours(), min: t.getUTCMinutes() }; }
  function check(s, alpha) { return alpha.charAt(hash("mv" + s) % alpha.length); }
  /* the events that have happened by now: an event without an hour happens at 10:00 */
  function upTo(ev, now) { return ev.filter(function (e) { return e.d < now.today || (+e.d === +now.today && (e.h == null ? 10 : e.h) <= now.hour); }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] != null ? v[k] : m; }); }

  /* the kept list: [{r: number, t: day taken, a: day of the visitor's step}] */
  function store(key, max) {
    function load() { try { var a = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(a) ? a.filter(function (x) { return x && x.r; }) : []; } catch (e) { return []; } }
    function save(a) { try { localStorage.setItem(key, JSON.stringify(a.slice(-max))); } catch (e) {} }
    return {
      load: load,
      get: function (ref) { return load().filter(function (x) { return x.r === ref; })[0] || null; },
      keep: function (ref, extra) { var a = load(), o = a.filter(function (x) { return x.r === ref; })[0] || { r: ref }; a = a.filter(function (x) { return x.r !== ref; }); for (var k in extra) o[k] = extra[k]; a.push(o); save(a); },
      drop: function (ref) { save(load().filter(function (x) { return x.r !== ref; })); }
    };
  }

  /* The page: three tabs (submit, follow, mine) inside el. O is the office (see offices/*.js). */
  function mount(el, O) {
    var S = store(O.key, O.max || 10), c = O.cls, L = O.L;
    function $(s) { return el.querySelector(s); }
    function $$(s) { return Array.prototype.slice.call(el.querySelectorAll(s)); }
    function now() { return irt(); }
    var tabIds = ["submit", "follow", "mine"], cur = 0;
    function draw() {
      el.innerHTML = '<div class="' + c.tabs + '" role="tablist">' + tabIds.map(function (id, i) { return '<a href="#' + id + '" role="tab" data-tab="' + i + '">' + esc(L(O.t.tabs[i])) + "</a>"; }).join("") + "</div>" +
        '<div data-pane="0"><form class="' + c.form + '" id="mvs" novalidate>' + O.form(now()) + '<div><button class="' + c.btn + '" type="submit">' + esc(L(O.t.send)) + '</button></div></form><div id="mvsr"></div></div>' +
        '<div data-pane="1" hidden><form class="' + c.form + '" id="mvf" novalidate><div><label for="mvn">' + esc(L(O.t.number)) + '</label><input id="mvn" type="text" autocomplete="off" spellcheck="false" placeholder="' + esc(O.sample) + '"></div><div><button class="' + c.btn + '" type="submit">' + esc(L(O.t.follow)) + '</button></div></form><div id="mvfr"></div></div>' +
        '<div data-pane="2" hidden><div id="mvm"></div></div>';
      $$("[data-tab]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); tab(+a.getAttribute("data-tab")); try { history.replaceState(null, "", location.pathname + location.search + (O.hashPrefix || "#") + tabIds[+a.getAttribute("data-tab")]); } catch (x) {} }); });
      $("#mvs").addEventListener("submit", function (e) {
        e.preventDefault();
        var r = O.submit($("#mvs"), now());
        if (typeof r === "string") { $("#mvsr").innerHTML = '<div class="' + c.warn + '">' + r + "</div>"; return; }
        S.keep(r.ref, { t: iso(now().today) });
        $("#mvsr").innerHTML = '<div class="' + c.done + '">' + r.html + '</div><p><a href="#" class="' + c.btn2 + '" data-go="' + esc(r.ref) + '">' + esc(L(O.t.followThis)) + "</a></p>";
        $("#mvs").reset(); if (O.after) O.after($("#mvs"));
        $("#mvsr [data-go]").addEventListener("click", function (ev) { ev.preventDefault(); go(r.ref); });
      });
      $("#mvf").addEventListener("submit", function (e) { e.preventDefault(); show($("#mvn").value); });
      if (O.wire) O.wire($("#mvs"), now());
      tab(cur);
    }
    function tab(i) { cur = i; $$("[data-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== String(i); }); $$("[data-tab]").forEach(function (a) { a.className = a.getAttribute("data-tab") === String(i) ? "on" : ""; }); if (i === 2) mine(); }
    function go(ref) { tab(1); $("#mvn").value = ref; show(ref); }
    function show(s) {
      var n = now(), p = O.parse(s, n.today), out = $("#mvfr");
      if (p === "bad" || p === "none") { out.innerHTML = '<div class="' + c.warn + '">' + esc(L(O.t[p])) + "</div>"; return; }
      var kept = S.get(p.ref), act = kept && kept.a || null, pl = O.plan(p, act), seen = upTo(pl.ev, n);
      if (!seen.length) seen = pl.ev.slice(0, 1);
      var last = seen[seen.length - 1], wait = pl.wait && last.k === pl.wait.at && !act ? pl.wait : null;
      var rows = seen.slice().reverse().map(function (e) { return '<tr><td class="' + (c.num || "") + '">' + esc(O.when(e)) + "</td><td>" + O.text(e, p) + "</td></tr>"; }).join("");
      out.innerHTML = '<div class="' + c.box + '"><p><b>' + esc(L(O.t.number)) + ":</b> " + esc(p.ref) + "<br>" + O.head(p) + "<br><b>" + esc(L(O.t.status)) + ":</b> " + esc(O.status(last, p)) + "</p></div>" +
        (wait ? '<div class="' + c.note + '">' + wait.html + '<p><button type="button" class="' + c.btn + '" id="mvact">' + esc(wait.btn) + "</button></p></div>" : "") +
        '<table class="' + c.table + '"><thead><tr><th>' + esc(L(O.t.date)) + "</th><th>" + esc(L(O.t.event)) + "</th></tr></thead><tbody>" + rows + "</tbody></table>" +
        (kept ? "" : '<p><a href="#" class="' + c.btn2 + '" id="mvkeep">' + esc(L(O.t.keep)) + "</a></p>");
      if ($("#mvact")) $("#mvact").addEventListener("click", function () { S.keep(p.ref, { a: iso(now().today) }); show(p.ref); });
      if ($("#mvkeep")) $("#mvkeep").addEventListener("click", function (e) { e.preventDefault(); S.keep(p.ref, {}); show(p.ref); });
    }
    function mine() {
      var a = S.load(), n = now(), box = $("#mvm");
      if (!a.length) { box.innerHTML = "<p>" + esc(L(O.t.empty)) + "</p>"; return; }
      box.innerHTML = '<table class="' + c.table + '"><thead><tr><th>' + esc(L(O.t.number)) + "</th><th>" + esc(L(O.t.status)) + "</th><th></th></tr></thead><tbody>" +
        a.slice().reverse().map(function (x) {
          var p = O.parse(x.r, n.today);
          if (typeof p === "string") return "";
          var pl = O.plan(p, x.a || null), seen = upTo(pl.ev, n), last = seen[seen.length - 1] || pl.ev[0];
          return '<tr><td><a href="#" data-go="' + esc(x.r) + '">' + esc(x.r) + "</a><br><small>" + O.head(p) + "</small></td><td>" + esc(O.status(last, p)) + '</td><td><a href="#" data-rm="' + esc(x.r) + '">' + esc(L(O.t.remove)) + "</a></td></tr>";
        }).join("") + "</tbody></table>";
      $$("#mvm [data-go]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); go(b.getAttribute("data-go")); }); });
      $$("#mvm [data-rm]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); S.drop(b.getAttribute("data-rm")); mine(); }); });
    }
    var h = (location.hash || "").replace(O.hashPrefix || "#", "");
    if (h === "follow") cur = 1; else if (h === "mine") cur = 2;
    draw();
    var q = /[?&]n=([^&#]+)/.exec(location.search) || /[?&]n=([^&#]+)/.exec(location.hash);
    if (q) go(decodeURIComponent(q[1]));
    return { redraw: draw };
  }

  return { hash: hash, rng: rng, ri: ri, pick: pick, addDays: addDays, isW: isW, addW: addW, onW: onW, onDow: onDow, wdays: wdays,
    iso: iso, day: day, ymd: ymd, irt: irt, check: check, upTo: upTo, esc: esc, fill: fill, store: store, mount: mount };
})();

window.TB_APPLY = function (BR) {
  "use strict";
  var C = window.MoveCore, START = "2026-10-01", DIG = "0123456789";
  var KIND = { C: "Talasbank Classic (som)", D: "Talasbank Dollar (US dollars)", S: "Salary card" };
  function L(x) { return x; }
  function br(n) { return BR.filter(function (b) { return b.no === n; })[0] || null; }
  function brName(b) { return ("0" + b.no).slice(-2) + " " + b.name + " (" + b.city + ")"; }
  function dmy(d) { var s = C.iso(d); return s.slice(8, 10) + "." + s.slice(5, 7) + "." + s.slice(0, 4); }
  function body(no, k, d, n) { return "TB" + ("0" + no).slice(-2) + k + "-" + C.iso(d).slice(2).replace(/-/g, "") + "-" + n; }
  function makeRef(no, k, d, n4) { var b = body(no, k, d, n4 || String(1000 + Math.floor(Math.random() * 9000))); return b + C.check(b, DIG); }
  function parse(s, today) {
    var m = /^TB(\d\d)([CDS])(\d{6})(\d{4})(\d)$/.exec(String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""));
    if (!m) return "bad";
    var b = br(+m[1]), d0 = C.ymd(m[3]), bd = body(+m[1], m[2], d0 || today, m[4]);
    if (!b || !d0 || C.check(bd, DIG) !== m[5] || d0 < C.day(START) || d0 > today) return "none";
    return { ref: bd + m[5], b: b, k: m[2], d0: d0 };
  }
  var ST = { recv: "Received", sal: "Left without consideration", reg: "Registered", sign: "Waiting for your signature", signed: "Under consideration",
    late: "Cancelled", pre: "Under consideration", sec: "Security check", decl: "Declined", acct: "Under consideration", order: "Card ordered",
    pause: "Card ordered", resume: "Card ordered", emb: "Card in production", sent: "On the way to the branch", got: "At the branch",
    nopin: "Waiting for the PIN envelope", pin: "At the branch", ready: "Ready for collection", gone: "Card destroyed" };
  var TX = {
    recv: "Application received through the website, No. {ref}. Passed to branch {b}.",
    sal: "Left without consideration. Salary cards are issued only under your employer's salary agreement with the bank: ask your accounts department. Pensions are paid to a salary card opened at the branch with your pension certificate.",
    reg: "Registered by branch {b} under No. {n}.",
    sign: "To issue the card the bank needs your signature on the application (form TB-K1) and your passport. Please come to branch {b} by {due}: Monday to Friday 9:00–18:00, Saturday 10:00–15:00.",
    signed: "Application signed at branch {b}. Passport checked.",
    late: "Cancelled: the application was not signed at the branch within 10 working days. You may apply again.",
    pre: "Application filled in by the branch from the bank's records and passed to the cards department. You will sign it when you collect the card.",
    sec: "Passed to the Security Service for checks.",
    decl: "The bank has declined to issue a card. Under the bank's rules the reasons are not given. You may ask at the branch for a written answer.",
    acct: "US dollar current account opened for the card.",
    order: "Checks completed. Card ordered from the Card Personalisation Centre, head office, Talas.",
    pause: "Card production paused during the card processing upgrade. Orders are kept in the queue in the order received.",
    resume: "Card production resumed.",
    emb: "Card embossed (cards are embossed on Wednesdays). PIN envelope printed.",
    sent: "Card and PIN envelope sent to branch {b} with the cash collection service.",
    got: "Card received at branch {b}.",
    nopin: "The PIN envelope did not come with the card. It follows with the next cash collection.",
    pin: "PIN envelope received at branch {b}.",
    ready: "Card ready for collection at branch {b}, desk “Cards”. Bring your passport{sg}. The card is kept at the branch until {d}.",
    gone: "Not collected within 60 days. The card and the PIN envelope have been destroyed under the bank's rules. You may apply again."
  };

  function plan(a, act) {
    var r = C.rng(C.hash("tbplan" + a.ref)), ev = [], d = a.d0, ri = function (x, y) { return C.ri(r, x, y); }, signAtCollection = true;
    function add(k, date, v, h) { ev.push({ k: k, d: date, v: v || {}, h: h }); d = date; }
    add("recv", a.d0, {}, 0);
    d = C.addW(d, ri(1, 2));
    if (a.k === "S") { add("sal", C.addW(d, ri(0, 1))); return { ev: ev }; }
    add("reg", d, { n: ("0" + a.b.no).slice(-2) + "/" + ri(1200, 6400) });
    var wait = null;
    if (r() < 0.6) {
      var due = C.addW(d, 10);
      add("sign", d, { due: dmy(due) });
      wait = { at: "sign", due: due, btn: "I have signed at the branch", html: "<b>Waiting for your signature.</b> Come to branch " + C.esc(brName(a.b)) + " with your passport by " + dmy(due) + ". When you have signed, mark it here." };
      var c = act ? C.day(act) : null;
      if (c && c.getUTCDay() === 0) c = C.addDays(c, 1);
      if (c && c < d) c = d;
      if (!c || c > due) { add("late", C.onW(C.addDays(due, 1))); return { ev: ev, wait: wait }; }
      add("signed", c, {}, +c === +d ? null : 0); signAtCollection = false; d = C.onW(c);
    } else { add("pre", C.addW(d, ri(0, 1))); }
    add("sec", C.addW(d, ri(1, 2)));
    if (r() < 0.04) { add("decl", C.addW(d, ri(2, 5))); return { ev: ev, wait: wait }; }
    if (a.k === "D") add("acct", C.addW(d, ri(1, 2)));
    add("order", C.addW(d, ri(1, 3)));
    if (r() < 0.12) { add("pause", C.addW(d, 1)); add("resume", C.addW(d, ri(5, 9))); }
    add("emb", C.onDow(C.addDays(d, 1), 3));
    add("sent", C.addW(d, 1));
    add("got", C.addW(d, a.b.city === "Talas" ? 1 : 2));
    if (r() < 0.15) { add("nopin", d); add("pin", C.addW(d, ri(2, 3))); }
    var until = C.addDays(d, 60);
    add("ready", d, { d: dmy(until), sg: signAtCollection ? " and sign the application (form TB-K1)" : "" });
    add("gone", C.onW(C.addDays(until, 1)));
    return { ev: ev, wait: wait };
  }

  var O = {
    key: "tb_apps", max: 10, L: L, sample: "TB07C-261102-48172",
    cls: { tabs: "seg mvtabs", form: "qform", btn: "btn g", btn2: "btn o", warn: "notice red", done: "notice", note: "notice", box: "mvbox", table: "list", num: "num" },
    t: { tabs: ["Apply for a card", "Check an application", "My applications"], send: "Send the application", number: "Application number", follow: "Check",
      followThis: "Check this application", status: "Status", date: "Date", event: "Event", keep: "Keep this number in this browser", remove: "remove",
      empty: "No applications are kept in this browser. Numbers you apply for or check are kept here.",
      bad: "This is not a Talasbank application number. It looks like TB07C-261102-48172.",
      none: "No application with this number. Check the figures: the last one is a check figure." },
    when: function (e) { return dmy(e.d); },
    status: function (e) { return ST[e.k]; },
    head: function (p) { return C.esc(KIND[p.k]) + ". Branch " + C.esc(brName(p.b)) + ". Sent " + dmy(p.d0) + "."; },
    text: function (e, p) { return C.esc(C.fill(TX[e.k], { ref: p.ref, b: brName(p.b), n: e.v.n, due: e.v.due, d: e.v.d, sg: e.v.sg })); },
    form: function () {
      return '<div><label for="mvk">Card</label><select id="mvk"><option value="C">' + KIND.C + '</option><option value="D">' + KIND.D + '</option><option value="S">' + KIND.S + "</option></select></div>" +
        '<div><label for="mvb">Branch where you will collect the card</label><select id="mvb">' + BR.map(function (b) { return '<option value="' + b.no + '">' + C.esc(brName(b)) + "</option>"; }).join("") + "</select></div>" +
        '<div class="mvchk"><label><input type="checkbox" id="mv1"> I am a resident of the Zone and have an ID card or a passport of the ISEZ.</label>' +
        '<label><input type="checkbox" id="mv2"> I have a current account at Talasbank, or ask the bank to open one for the card.</label>' +
        '<label><input type="checkbox" id="mv3"> I agree that the bank checks the information it holds about me.</label></div>' +
        '<p class="mvsmall">Do not enter your name, passport or card numbers here. The branch fills in the application from your passport.</p>';
    },
    submit: function (f, now) {
      if (!f.querySelector("#mv1").checked || !f.querySelector("#mv2").checked || !f.querySelector("#mv3").checked) return "Please tick all three boxes.";
      var no = +f.querySelector("#mvb").value, k = f.querySelector("#mvk").value, ref = makeRef(no, k, now.today), b = br(no);
      return { ref: ref, html: '<b class="h">Application sent</b>Your application number is <b class="mvref">' + ref + "</b>. Write it down: you will need it to check the application here or at branch " + C.esc(brName(b)) + ". " +
        (k === "S" ? "Salary cards are issued through employers; the branch will reply." : "The branch will register the application on the next working day.") };
    },
    parse: parse, plan: plan
  };
  O._makeRef = makeRef; O._parse = parse; O._plan = plan; O._gen = function (k, d0) { return makeRef(1 + k % 28, k % 10 === 0 ? "S" : k % 3 ? "C" : "D", d0, String(1000 + (k * 7919) % 9000)); };
  O._final = function (pl) { var e = pl.ev; return e[e.length - 1].k === "gone" ? e[e.length - 2] : e[e.length - 1]; };
  return O;
};
