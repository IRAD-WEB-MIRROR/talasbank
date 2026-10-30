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
  var FALLBACK = window.TB_RATES || null;
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
  }
  if ($("[data-rates]")) {
    if (FALLBACK) drawRates(FALLBACK.rates, FALLBACK.date);
    try {
      fetch("https://iradone.com/data/today.json", { cache: "no-cache" }).then(function (r) { return r.json(); })
        .then(function (j) { if (j && j.rates) drawRates(j.rates, j.date); }).catch(function () {});
    } catch (e) {}
  }

  /* online converter, at the official rate */
  var RATES = null, mode = "sell";
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
})();
