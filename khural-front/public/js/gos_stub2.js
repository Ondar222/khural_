(function () {
  try {
    var r = document.currentScript && document.currentScript.parentNode;
    if (!r) return;
    var w = document.createElement("div");
    w.style.cssText =
      "height:300px;border-radius:16px;background:#fff;color:#111;padding:20px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 6px 24px rgba(0,0,0,.08)";
    w.innerHTML =
      '<div style="color:#2563eb;font-weight:800;">госуслуги<br/><span style="font-weight:600;color:#1f2937">Решаем вместе</span></div><div style="font-weight:900;font-size:28px;line-height:1.1;">Мой выбор,<br/>Моё будущее</div><div style="opacity:.8;">Общественное голосование на портале Госуслуг</div><a href="#" style="align-self:flex-start;background:#2563eb;color:#fff;padding:10px 14px;border-radius:12px;text-decoration:none;font-weight:700;">Участвовать</a>';
    r.appendChild(w);
  } catch (e) {}
})();
