/* Talasbank site scripts. Rates from the daily numbers file; everything else is worked out in the browser. */
(function () {
  var D = document, H = D.documentElement;
  function $(s, r) { return (r || D).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* Irad Time, UTC+6 */
  function irt() { var n = new Date(); return new Date(n.getTime() + n.getTimezoneOffset() * 60000 + 6 * 3600000); }
  function h32(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rnd(s) { return h32(s) / 4294967296; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  var T = window.TB_T || {}, L = store("tb_lang") || "en";
  if (!T[L]) L = "en";
  var MONTHS = { en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
    ir: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentyabr", "oktyabr", "noyabr", "dekabr"] };
  function fmtDate(d, l) { l = l || L; var m = MONTHS[l] || MONTHS.en; return l === "en" ? d.getDate() + " " + m[d.getMonth()] + " " + d.getFullYear() : d.getDate() + " " + m[d.getMonth()] + " " + d.getFullYear(); }

  function applyLang() {
    H.setAttribute("data-lang", L);
    H.lang = L === "ir" ? "ky" : L;
    if (L !== "en") $$("[data-t]").forEach(function (e) { var k = e.getAttribute("data-t"); if (T[L][k]) e.textContent = T[L][k]; });
    $$("#lang a[data-l]").forEach(function (a) { a.className = a.getAttribute("data-l") === L ? "on" : ""; });
    var lc = $("#langcur"); if (lc) lc.textContent = { en: "En", ru: "Ru", ir: "Ir" }[L];
  }
  var lg = $("#lang");
  if (lg) {
    $("button", lg).onclick = function () { lg.className = lg.className ? "" : "open"; };
    D.addEventListener("click", function (e) { if (!lg.contains(e.target)) lg.className = ""; });
  }
  $$("#lang a[data-l]").forEach(function (a) {
    a.onclick = function (e) { e.preventDefault(); var l = a.getAttribute("data-l"); if (l === L) return; store("tb_lang", l); location.reload(); };
  });
  var vi = $("#vi");
  if (store("tb_vi") === "1") H.className += " vi";
  if (vi) vi.onclick = function (e) { e.preventDefault(); var on = H.className.indexOf("vi") < 0; store("tb_vi", on ? "1" : "0"); H.className = on ? H.className + " vi" : H.className.replace(/\s*vi/g, ""); };
  applyLang();

  /* hero slides */
  var sl = $$("#hero .sl"), dots = $$("#hero .dots span"), cur = 0, timer;
  function show(i) { i = (i + sl.length) % sl.length; sl.forEach(function (s, j) { s.className = "sl" + (i === j ? " on" : ""); }); dots.forEach(function (d, j) { d.className = i === j ? "on" : ""; }); cur = i; }
  function auto() { clearInterval(timer); timer = setInterval(function () { show(cur + 1); }, 8000); }
  if (sl.length) {
    dots.forEach(function (d, i) { d.onclick = function () { show(i); auto(); }; });
    $$("#hero .arrows button").forEach(function (b) { b.onclick = function () { show(cur + +b.getAttribute("data-d")); auto(); }; });
    auto();
  }

  /* loan calculator: only the foal credit has a published rate (0% for 12 months); the rest are set at the branch */
  var LOANS = {
    foal: { min: 1000, max: 20000, step: 500, v: 8000, tmin: 3, tmax: 12, t: 12, pic: "assets/img/hero-foal-sq.jpg", horse: 1, note: "0% for the first 12 months. For buyers of Akyel and Chongtor foals from registered breeders." },
    cash: { min: 500, max: 10000, step: 500, v: 3000, tmin: 6, tmax: 36, t: 24, pic: "assets/img/card-classic.png", note: "The interest rate is set individually after the application is reviewed. Ask at any branch." },
    car: { min: 3000, max: 40000, step: 1000, v: 12000, tmin: 12, tmax: 60, t: 36, pic: "assets/img/hero-cash-sq.jpg", horse: 1, note: "The vehicle is pledged. The interest rate is set by the Credit Committee." },
    home: { min: 10000, max: 120000, step: 5000, v: 45000, tmin: 24, tmax: 180, t: 120, pic: "assets/img/hero-cash-sq.jpg", horse: 1, note: "New flats in Talas from partner developers. The interest rate is set by the Credit Committee." } };
  function usd(v) { return "US$" + Math.round(v).toLocaleString("en-US"); }
  var la = $("#lAmt"), lt = $("#lTerm"), kind = "foal";
  function fill(r) { r.style.setProperty("--p", ((r.value - r.min) / (r.max - r.min) * 100) + "%"); }
  function calc() {
    var c = LOANS[kind];
    $("#lAmtV").textContent = usd(la.value); $("#lTermV").textContent = lt.value + " months";
    $("#lPay").textContent = kind === "foal" ? usd(la.value / lt.value) : "at the branch";
    fill(la); fill(lt);
  }
  function setLoan(k) {
    var c = LOANS[k]; kind = k;
    la.min = c.min; la.max = c.max; la.step = c.step; la.value = c.v; lt.min = c.tmin; lt.max = c.tmax; lt.value = c.t;
    $("#lAmtMin").textContent = usd(c.min); $("#lAmtMax").textContent = usd(c.max);
    $("#lTermMin").textContent = c.tmin + " months"; $("#lTermMax").textContent = c.tmax + " months";
    $("#lNote").textContent = c.note; var p = $("#lPic"); p.src = c.pic; p.className = "card3d" + (c.horse ? " horse" : "");
    $$(".tabs button").forEach(function (b) { b.className = b.getAttribute("data-loan") === k ? "on" : ""; });
    calc();
  }
  if (la) { la.oninput = calc; lt.oninput = calc; $$(".tabs button").forEach(function (b) { b.onclick = function () { setLoan(b.getAttribute("data-loan")); }; }); setLoan("foal"); }

  /* rates: the Bank of Irad official rate from the daily numbers */
  var FALLBACK = window.TB_RATES || null, onRates = null, RATES = null;
  var NAMES = { en: { USD: "US dollar", EUR: "Euro", CNY: "Chinese yuan", RUB: "Russian rouble", KZT: "Kazakh tenge", KGS: "Kyrgyz som", UZS: "Uzbek sum" },
    ru: { USD: "Доллар США", EUR: "Евро", CNY: "Китайский юань", RUB: "Российский рубль", KZT: "Казахский тенге", KGS: "Кыргызский сом", UZS: "Узбекский сум" },
    ir: { USD: "AKSh dolları", EUR: "Evro", CNY: "Kıtay yuanı", RUB: "Orus rubl", KZT: "Kazak teñgesi", KGS: "Kırgız somu", UZS: "Özbek sumu" } };
  function num(v, d) { return v.toFixed(d).replace(".", L === "en" ? "." : ","); }
  function drawRates(r, date) {
    var rows = r && r.official && r.official.rows; if (!rows) return;
    $$("[data-rates]").forEach(function (el) {
      var full = el.getAttribute("data-rates") === "full", nm = NAMES[L] || NAMES.en, h = "";
      h += "<table class='rt'><tr><th>" + (T[L].rCur || "Currency") + "</th>" + (full ? "<th>" + (T[L].rUnits || "Units") + "</th>" : "") + "<th>" + (T[L].rSom || "Som") + "</th></tr>";
      rows.forEach(function (x) {
        if (!full && ["USD", "EUR", "RUB", "KZT", "CNY"].indexOf(x.code) < 0) return;
        h += "<tr><td>" + "<span class='cc'>" + x.code.slice(0, 2) + "</span>" + (full ? nm[x.code] + " (" + x.code + ")" : x.units + " " + x.code) + "</td>" + (full ? "<td>" + x.units + "</td>" : "") + "<td>" + num(x.som, x.som < 1 ? 4 : 2) + "</td></tr>";
      });
      h += "</table><div class='rtdate'>" + (T[L].rAsOf || "Official rate of the Bank of Irad for") + " " + fmtDate(new Date(date + "T12:00:00")) + "</div>";
      el.innerHTML = h;
    });
    convInit(rows);
    if (onRates) onRates();
  }
  if ($("[data-rates]")) {
    if (FALLBACK) drawRates(FALLBACK.rates, FALLBACK.date);
    try {
      fetch("https://iradone.com/data/today.json", { cache: "no-cache" }).then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.rates) drawRates(j.rates, j.date); }).catch(function () {});
    } catch (e) {}
  }

  /* online converter, at the official rate */
  var mode = "sell";
  function conv() {
    if (!RATES || !$("#cvA")) return;
    var r = {}; RATES.forEach(function (x) { r[x.code] = x.som / x.units; }); r.SOM = 1;
    var f = $("#cvF").value, t = $("#cvT").value, a = parseFloat($("#cvA").value) || 0;
    var v = a * r[f] / r[t];
    $("#cvB").value = v.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + t;
    $("#cvE1").textContent = "1 " + f + " = " + (r[f] / r[t]).toLocaleString("en-US", { maximumFractionDigits: 4 }) + " " + t;
    $("#cvE2").textContent = "1 " + t + " = " + (r[t] / r[f]).toLocaleString("en-US", { maximumFractionDigits: 4 }) + " " + f;
  }
  function convInit(rows) {
    RATES = rows; if (!$("#cvF")) return;
    var codes = ["SOM"].concat(rows.map(function (x) { return x.code; }));
    ["#cvF", "#cvT"].forEach(function (id, i) { var s = $(id), keep = s.value; s.innerHTML = codes.map(function (c) { return "<option>" + c + "</option>"; }).join(""); s.value = keep || (i ? "SOM" : "USD"); });
    conv();
  }
  if ($("#cvA")) {
    $("#cvA").oninput = conv; $("#cvF").onchange = conv; $("#cvT").onchange = conv;
    $("#cvS").onclick = function () { var f = $("#cvF").value; $("#cvF").value = $("#cvT").value; $("#cvT").value = f; conv(); };
    $$(".seg button").forEach(function (b) { b.onclick = function () { mode = b.getAttribute("data-m"); $$(".seg button").forEach(function (x) { x.className = x === b ? "on" : ""; });
      if ((mode === "buy") !== ($("#cvF").value === "SOM")) $("#cvS").onclick(); }; });
  }

  /* cash machines: the state of each machine changes from day to day */
  var STAT = [["ok", "In service", "Работает", "Iyshtep jatat"], ["ok", "In service", "Работает", "Iyshtep jatat"], ["ok", "In service", "Работает", "Iyshtep jatat"],
    ["warn", "Som only", "Только сомы", "Som gana"], ["warn", "Som only", "Только сомы", "Som gana"], ["warn", "No receipts", "Нет чеков", "Chek jok"],
    ["bad", "Out of cash", "Нет наличных", "Nakt akcha jok"], ["bad", "Out of service", "Не работает", "Iyshtebeyt"]];
  $$("[data-atm]").forEach(function (td) {
    var id = td.getAttribute("data-atm"), t = irt(), s = STAT[Math.floor(rnd(id + ymd(t) + (t.getHours() < 12 ? "a" : "p")) * STAT.length)];
    if (t.getDate() === 10 && s[0] === "ok" && rnd(id + "x") < 0.7) s = STAT[6];
    td.innerHTML = "<span class='" + s[0] + "'>" + s[L === "ru" ? 2 : L === "ir" ? 3 : 1] + "</span>";
  });
  var au = $("#atmUpd"); if (au) { var t2 = irt(); au.textContent = fmtDate(t2) + ", " + pad(t2.getHours() < 12 ? 8 : 13) + ":00"; }

  /* cards: tilt towards the pointer, a moving shine, click to turn over */
  $$(".c3d").forEach(function (c) {
    var f = $(".flip", c), g = $(".glare", c), over = false, auto = 0;
    function set(px, py) {
      var rx = (0.5 - py) * 16, ry = (px - 0.5) * 22;
      f.style.transform = "rotateX(" + rx.toFixed(1) + "deg) rotateY(" + ((over ? 180 : 0) + ry).toFixed(1) + "deg)";
      g.style.setProperty("--gx", (px * 100).toFixed(0) + "%"); g.style.setProperty("--gy", (py * 100).toFixed(0) + "%"); g.style.setProperty("--sx", (px * 130 - 15).toFixed(0) + "%");
    }
    c.addEventListener("mousemove", function (e) { var r = c.getBoundingClientRect(); f.style.transition = "transform .08s"; set((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
    c.addEventListener("mouseleave", function () { f.style.transition = ""; set(0.5, 0.5); });
    c.turnBack = function () { if (over) turn(); };
    function turn() { over = !over; f.style.transition = ""; set(0.5, 0.5); }
    c.addEventListener("click", turn);
    c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); turn(); } });
    /* a slow sweep of light when the pointer is not over the card (and on phones) */
    var t0 = Math.random() * 4000;
    setInterval(function () { if (c.matches(":hover")) return; var t = ((Date.now() + t0) % 5000) / 5000; g.style.setProperty("--sx", (t * 220 - 60).toFixed(0) + "%"); g.style.setProperty("--gx", (t * 160 - 30).toFixed(0) + "%"); }, 60);
  });

  $$(".thumbs a").forEach(function (a) {
    a.onclick = function (e) {
      e.preventDefault();
      $$(".thumbs a").forEach(function (x) { x.className = x === a ? "on" : ""; });
      var fr = $(".show .fr"), c = $(".show .c3d");
      fr.src = "assets/img/card-" + a.getAttribute("data-card") + ".png"; fr.alt = a.getAttribute("data-title") + ", front";
      $("#cardT").textContent = a.getAttribute("data-title"); $("#cardX").textContent = a.getAttribute("data-text");
      if (c.turnBack) c.turnBack();
    };
  });

  /* electronic queue */
  var qf = $("#qform");
  if (qf) {
    qf.onsubmit = function (e) {
      e.preventDefault();
      var br = $("#qbr").value, sv = $("#qsv").value, out = $("#qout"), t = irt(), d = t.getDate(), wd = t.getDay(), mins = t.getHours() * 60 + t.getMinutes();
      var opt = $("#qbr").selectedOptions ? $("#qbr").selectedOptions[0] : $("#qbr").options[$("#qbr").selectedIndex];
      if (opt.getAttribute("data-online") !== "1") { out.innerHTML = "<div class='notice'>" + T[L].qNotOnline + "</div>"; return; }
      var close = wd === 0 || wd === 6 ? -1 : 18 * 60;
      if (close < 0 || mins < 8 * 60 + 45 || mins >= close - 30) { out.innerHTML = "<div class='notice red'>" + T[L].qClosed + "</div>"; return; }
      var key = ymd(t) + br + sv, letter = { rem: "R", usd: "V", card: "K", pay: "P" }[sv] || "A";
      var stored = store("tb_q_" + key);
      var slot = Math.floor(mins / 20), crowd = d === 10 ? 280 : d === 9 || d === 11 ? 55 : wd === 1 ? 24 : 9;
      if (d === 10 && sv === "rem") crowd += 140;
      var served = Math.max(Math.floor((mins - 540) * (d === 10 ? 1.1 : 0.45)), 0);
      var ahead0 = crowd + Math.floor(rnd(key + slot) * crowd * 0.6) - (d === 10 ? Math.floor((mins - 540) * 0.25) : 0);
      var no = stored ? +stored : served + Math.max(ahead0, 3) + 1; store("tb_q_" + key, no);
      var ahead = Math.max(no - served - 1, 0);
      var wait = Math.round(ahead * (sv === "rem" ? 2.4 : 3.1)), late = mins + wait > close;
      out.innerHTML = "<div class='ticket'>TALASBANK<br>" + opt.textContent + "<hr><div>" + T[L].qYour + "</div><div class='no'>" + letter + "-" + ("000" + no).slice(-3) +
        "</div>" + T[L].qAhead + ": <b>" + ahead + "</b><br>" + T[L].qWait + ": <b>" + (wait >= 60 ? Math.floor(wait / 60) + " h " : "") + (wait % 60) + " min</b><hr>" +
        fmtDate(t) + " " + pad(t.getHours()) + ":" + pad(t.getMinutes()) + "</div>" +
        (late ? "<div class='notice red'>" + T[L].qLate + "</div>" : "") + "<p style='font-size:11px'>" + T[L].qValid + "</p>";
    };
  }
  var t3 = irt(), nx = new Date(t3.getFullYear(), t3.getMonth() + (t3.getDate() > 10 ? 1 : 0), 10);
  $$(".qnext").forEach(function (qd) { qd.textContent = t3.getDate() === 10 ? (T[L].qToday || "today") : fmtDate(nx); });

  /* currency exchange: the official rate, a number for the exchange cash desk, and the Irad clock (lunch, cash collection, closing) */
  var fx = $("#fxform");
  if (fx) {
    var OFFS = JSON.parse(fx.getAttribute("data-offices")), op = "sell", DK = ["su", "mo", "tu", "we", "th", "fr", "sa"], DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var STEP = { USD: 1, RUB: 50, KZT: 100 }, CUR = { USD: "US dollars", RUB: "roubles", KZT: "tenge" };
    function office() { var id = $("#fxo").value; for (var i = 0; i < OFFS.length; i++) if (OFFS[i].id === id) return OFFS[i]; return OFFS[0]; }
    function hm(t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; }
    function clk(m) { return pad(Math.floor(m / 60)) + ":" + pad(m % 60); }
    function iso(d) { return ymd(d); }
    function hol(d) { try { return window.IradClock && window.IradClock.holiday(iso(d)); } catch (e) { return null; } }
    /* the cash desk on a given day: [open, close, breaks] in minutes, or null when closed */
    function desk(o, d) {
      var h = o.h[DK[d.getDay()]], avia = o.id === "fx-avia", branch = o.id.indexOf("fx-") !== 0;
      if (!h || h === "closed") return null;
      if (branch && hol(d)) return null;
      var p = h.split("-"), a = hm(p[0]), b = hm(p[1]) - (avia ? 0 : 30), wk = d.getDay() > 0 && d.getDay() < 6, br = [];
      if (!avia && wk) { if (a < 11 * 60 && b > 11 * 60 + 15) br.push([660, 675, "col"]); if (a < 13 * 60 && b > 14 * 60) br.push([780, 840, "lunch"]); }
      return [a, b, br];
    }
    function nextOpen(o, t) {
      var d = new Date(t.getFullYear(), t.getMonth(), t.getDate());
      for (var i = 1; i < 10; i++) { d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); var k = desk(o, d); if (k) return [d, k[0]]; }
      return null;
    }
    function hoursLine(o) {
      var runs = [];
      [1, 2, 3, 4, 5, 6, 0].forEach(function (i) { var v = o.h[DK[i]] || "closed"; if (runs.length && runs[runs.length - 1][2] === v) runs[runs.length - 1][1] = i; else runs.push([i, i, v]); });
      return runs.map(function (r) { return (r[0] === r[1] ? DN[r[0]] : DN[r[0]] + "–" + DN[r[1]]) + " " + (r[2] === "closed" ? "closed" : r[2].replace("-", "–")); }).join(", ");
    }
    function rate(c) { if (!RATES) return null; for (var i = 0; i < RATES.length; i++) if (RATES[i].code === c) return RATES[i].som / RATES[i].units; return null; }
    function som(v) { v = Math.floor(v * 10 + 1e-6) / 10; return v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " som"; }
    function bought() { var t = irt(), k = "tb_fx_" + t.getFullYear() + pad(t.getMonth() + 1); return +(store(k) || 0); }
    function quote() {
      var c = op === "buy" ? "USD" : $("#fxc").value, a = Math.floor((parseFloat($("#fxa").value) || 0) / STEP[c]) * STEP[c], r = rate(c), out = $("#fxcalc");
      if (!r || a <= 0) { out.innerHTML = ""; return null; }
      var q = { c: c, a: a, r: r, s: a * r };
      out.innerHTML = (op === "sell" ? "You give <b>" + a.toLocaleString("en-US") + " " + c + "</b>, you receive <b>" + som(q.s) + "</b>"
        : "You pay <b>" + som(q.s) + "</b>, you receive <b>" + a.toLocaleString("en-US") + " USD</b>") +
        "<br><small>Rate: 1 " + c + " = " + r.toLocaleString("en-US", { maximumFractionDigits: 4 }) + " som (official rate of the Bank of Irad" + (c === "USD" ? ", fixed by the Bank of Irad Act 2008" : "") + ")" +
        (a !== (parseFloat($("#fxa").value) || 0) ? ". Amount rounded to whole banknotes: " + STEP[c] + " " + c : "") + "</small>";
      return q;
    }
    function showHours() { var o = office(); $("#fxh").textContent = (o.id === "fx-avia" ? "Exchange office: " + hoursLine(o) + ", no breaks" : "Office hours: " + hoursLine(o) + ". The exchange cash desk takes operations until 30 minutes before closing."); }
    $("#fxo").onchange = function () { showHours(); $("#fxout").innerHTML = ""; };
    $("#fxa").oninput = quote; $("#fxc").onchange = quote;
    $$(".fxseg button").forEach(function (b) {
      b.onclick = function () {
        op = b.getAttribute("data-op"); $$(".fxseg button").forEach(function (x) { x.className = x === b ? "on" : ""; });
        $("#fxc").value = "USD"; $("#fxc").disabled = op === "buy"; if (op === "buy" && +$("#fxa").value > 300) $("#fxa").value = 300; quote(); $("#fxout").innerHTML = "";
      };
    });
    var LUNCH = "<div class='fxsign'><div class='t'>ОБЕД</div><div>TÜSHKÜ TAMAK · LUNCH</div><div class='h'>13:00 – 14:00</div></div>";
    function when(d, m) { var t = irt(), td = new Date(t.getFullYear(), t.getMonth(), t.getDate()), dd = Math.round((d - td) / 864e5);
      return (dd === 0 ? "today" : dd === 1 ? "tomorrow" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d.getDay()] + " " + fmtDate(d)) + " at " + clk(m); }
    function E(x) { return String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
    fx.onsubmit = function (e) {
      e.preventDefault();
      var q = quote(), o = office(), t = irt(), mins = t.getHours() * 60 + t.getMinutes(), out = $("#fxout"), now = "It is now " + clk(mins) + " in Talas.";
      if (!q) { out.innerHTML = "<div class='notice red'>Enter the amount.</div>"; return; }
      var k = desk(o, t), h = hol(t), nx;
      /* closed for the day */
      if (!k || mins >= k[1] || mins < k[0]) {
        nx = !k || mins >= k[1] ? nextOpen(o, t) : [t, k[0]];
        out.innerHTML = "<div class='notice red'><b class='h'>The exchange cash desk is closed</b>" + (h && !k && o.h[DK[t.getDay()]] !== "closed" ? "Today is a public holiday (" + h.name[0] + "). " : "") +
          now + " Numbers are given only while the cash desk is open. It opens " + (nx ? when(nx[0], nx[1]) : "on the next working day") + ".</div>";
        return;
      }
      /* on a break: lunch, or cash collection */
      for (var i = 0; i < k[2].length; i++) {
        var b = k[2][i];
        if (mins >= b[0] && mins < b[1]) {
          out.innerHTML = (b[2] === "lunch" ? LUNCH + "<div class='notice'><b class='h'>Come back after lunch</b>" + now + " The cashier is at lunch. The cash desk opens again at 14:00, in " + (840 - mins) + " min. Numbers are given after lunch.</div>"
            : "<div class='notice'><b class='h'>Technical break: cash collection</b>" + now + " The cash desk is closed while the cash is collected. Please wait until " + clk(b[1]) + ".</div>");
          return;
        }
      }
      if (op === "buy") {
        var left = 300 - bought(), mo = t.getMonth(), day = ymd(t);
        if (q.a > left) { out.innerHTML = "<div class='notice red'><b class='h'>Over the monthly limit</b>Sale of cash US dollars is limited to US$300 per customer per month (Bank of Irad notice 2026/2). " +
          (left > 0 ? "You can buy up to US$" + left + " more this month." : "Your limit for " + fmtDate(t).replace(/^\d+ /, "") + " is used.") + "</div>"; return; }
        var p = t.getDate() === 10 ? 0 : o.id === "fx-avia" ? 0.5 : o.id === "biz-talas-0178" ? 0.45 : 0.22;
        if (mins > 12 * 60) p *= 0.5;
        if (rnd(o.id + day + "usd") >= p) { out.innerHTML = "<div class='notice red'><b class='h'>No cash US dollars in this office today</b>" + now +
          " The office has no US dollar banknotes for sale today. Deliveries from our correspondent banks are irregular; please ask in the morning or choose another office. Selling currency for som is not affected.</div>"; return; }
      }
      /* a number for the exchange cash desk */
      var key = ymd(t) + o.id + op, d = t.getDate(), wd = t.getDay(), stored = store("tb_fx_q_" + key);
      var crowd = d === 10 ? 40 : d === 9 || d === 11 ? 14 : wd === 6 ? 11 : o.id === "fx-bazar" ? 9 : 5;
      var served = Math.max(Math.floor((mins - k[0]) * 0.18), 0), ahead0 = crowd + Math.floor(rnd(key + Math.floor(mins / 20)) * crowd);
      var no = stored ? +stored : served + ahead0 + 1, ahead = Math.max(no - served - 1, 0);
      if (!stored) { store("tb_fx_q_" + key, no); if (op === "buy") store("tb_fx_" + t.getFullYear() + pad(t.getMonth() + 1), bought() + q.a); }
      var wait = Math.round(ahead * 4.5), at = mins + wait, lunchNote = "";
      k[2].forEach(function (b) { if (mins < b[0] && at >= b[0]) { at += b[1] - b[0]; if (b[2] === "lunch") lunchNote = "<div class='notice'><b class='h'>Lunch break</b>The cash desk closes for lunch from 13:00 to 14:00. If your number has not been called by 13:00, it will be called after lunch.</div>"; } });
      var late = at > k[1];
      out.innerHTML = "<div class='ticket'>TALASBANK<br>EXCHANGE OFFICE<br>" + E(o.n) + "<hr><div>" + (T[L].qYour || "Your number") + "</div><div class='no'>V-" + ("000" + no).slice(-3) + "</div>" +
        (op === "sell" ? q.a.toLocaleString("en-US") + " " + q.c + " → " + som(q.s) : som(q.s) + " → " + q.a + " USD") + "<br>1 " + q.c + " = " + q.r.toLocaleString("en-US", { maximumFractionDigits: 4 }) + " som<hr>" +
        (T[L].qAhead || "Customers ahead of you") + ": <b>" + ahead + "</b><br>" + (T[L].qWait || "Estimated waiting time") + ": <b>" + (at - mins >= 60 ? Math.floor((at - mins) / 60) + " h " : "") + ((at - mins) % 60) + " min</b><br>" +
        "Expected call: about <b>" + clk(Math.min(at, 1439)) + "</b><hr>" + fmtDate(t) + " " + clk(mins) + "</div>" + lunchNote +
        (late ? "<div class='notice red'>The cash desk may close before your number is called (it takes operations until " + clk(k[1]) + "). Please come early tomorrow or choose another office.</div>" : "") +
        "<p style='font-size:11px'>The number is valid today only, at the exchange cash desk of the office named on it. Bring the banknotes and your passport" + (op === "buy" ? "; the purchase is recorded against your monthly limit" : "") +
        ". The rate is that of the day of the operation.</p>";
    };
    onRates = quote; showHours(); quote();
  }
})();
