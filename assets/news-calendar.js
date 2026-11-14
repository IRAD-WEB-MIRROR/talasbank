/* News list: items from data file appear on their date (Talas time). */
(function () {
  var s = document.currentScript;
  if (!s || !window.fetch) return;
  var box = document.querySelector(s.getAttribute("data-into"));
  if (!box) return;
  var today = new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);
  fetch(s.getAttribute("data-src")).then(function (r) { return r.json(); }).then(function (items) {
    var due = items.filter(function (i) { return i.date <= today && !document.getElementById(i.id); });
    due.sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    var first = box.querySelector(s.getAttribute("data-before") || "*");
    due.forEach(function (i) {
      var w = document.createElement("div");
      w.innerHTML = i.html;
      var el = w.firstElementChild;
      if (first) first.parentNode.insertBefore(el, first); else box.appendChild(el);
    });
  })["catch"](function () {});
})();
