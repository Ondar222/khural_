import React from "react";

export default function GosWidget({ src, id, variant = 1, fallbackImg = "/img/banner.svg" }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    // Placeholder renders immediately to avoid пустые блоки
    const renderCard1 = () => {
      if (!ref.current) return;
      ref.current.innerHTML =
        '<div style="height:200px;border-radius:16px;background:linear-gradient(135deg,#2b6cb0,#60a5fa);color:#fff;padding:20px;display:flex;flex-direction:column;justify-content:space-between;"><div style="font-weight:800;font-size:18px;">Не убран снег, яма на дороге?</div><div style="opacity:.95;">Столкнулись с проблемой — сообщите о ней!</div><a href="#" style="align-self:flex-start;background:#fff;color:#1e40af;padding:10px 14px;border-radius:12px;text-decoration:none;font-weight:700;">Сообщить о проблеме</a></div>';
    };
    const renderCard2 = () => {
      if (!ref.current) return;
      ref.current.innerHTML =
        '<div style="height:300px;border-radius:16px;background:#fff;color:#111;padding:20px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 6px 24px rgba(0,0,0,.08)"><div style="color:#2563eb;font-weight:800;">госуслуги<br/><span style="font-weight:600;color:#1f2937">Решаем вместе</span></div><div style="font-weight:900;font-size:28px;line-height:1.1;">Мой выбор,<br/>Моё будущее</div><div style="opacity:.8;">Общественное голосование на портале Госуслуг</div><a href="#" style="align-self:flex-start;background:#2563eb;color:#fff;padding:10px 14px;border-radius:12px;text-decoration:none;font-weight:700;">Участвовать</a></div>';
    };
    // Не дублируем: если есть src — сначала очищаем и грузим скрипт.
    ref.current.innerHTML = "";
    if (src) {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.onerror = () => {
        if (!ref.current) return;
        if (variant === 2) renderCard2();
        else renderCard1();
      };
      ref.current.appendChild(script);
    } else {
      if (variant === 2) renderCard2();
      else renderCard1();
    }
  }, [src, variant, fallbackImg]);

  return <div id={id} ref={ref} className="tile" style={{ padding: 0, overflow: "hidden" }} />;
}
