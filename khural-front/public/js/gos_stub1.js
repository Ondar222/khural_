(function () {
  try {
    var r = document.currentScript && document.currentScript.parentNode;
    if (!r) return;
    var w = document.createElement("div");
    w.style.cssText =
      "height:200px;border-radius:16px;background:linear-gradient(135deg,#2b6cb0,#60a5fa);color:#fff;padding:20px;display:flex;flex-direction:column;justify-content:space-between;";
    w.innerHTML =
      '<div style="font-weight:800;font-size:18px;">Не убран снег, яма на дороге?</div><div style="opacity:.95;">Столкнулись с проблемой — сообщите о ней!</div><a href="#" style="align-self:flex-start;background:#fff;color:#1e40af;padding:10px 14px;border-radius:12px;text-decoration:none;font-weight:700;">Сообщить о проблеме</a>';
    r.appendChild(w);
  } catch (e) {}
})();
