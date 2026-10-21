// 讀到這裡 — 官網互動：書房配色預覽、進場動畫、年份
document.documentElement.classList.add("js");

// 三間書房：切換手機示意圖的配色
(function () {
  var phone = document.getElementById("phone");
  if (!phone) return;
  var buttons = document.querySelectorAll(".room-switch button[data-room]");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      phone.setAttribute("data-theme", btn.getAttribute("data-room"));
      buttons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("active", on);
        if (on) b.setAttribute("aria-pressed", "true");
        else b.removeAttribute("aria-pressed");
      });
    });
  });
})();

// 進場 reveal（尊重 reduced-motion）
(function () {
  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  items.forEach(function (el) { io.observe(el); });
})();

// 頁尾年份
(function () {
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());
})();
