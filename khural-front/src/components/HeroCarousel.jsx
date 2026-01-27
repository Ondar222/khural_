import React from "react";
import { useData } from "../context/DataContext.jsx";
import { useI18n } from "../context/I18nContext.jsx";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

export default function HeroCarousel() {
  const { slides: dataSlides } = useData();
  const { t } = useI18n();
  const [active, setActive] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const truncateWords = React.useCallback((text, maxWords) => {
    const s = String(text || "").trim();
    if (!s) return "";
    const words = s.split(/\s+/).filter(Boolean);
    const n = Number(maxWords || 0);
    if (!n || words.length <= n) return s;
    return words.slice(0, n).join(" ") + "…";
  }, []);

  const splitDateAndDescription = React.useCallback((text) => {
    const s = String(text || "");
    const m = s.match(/^\s*(?:Дата события|Дата)\s*:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*\n?/i);
    if (m) {
      const date = m[1] || "";
      const rest = s.slice(m[0].length).trimStart();
      return { date, description: rest };
    }
    // Also support raw "YYYY-MM-DD ..." at the start
    const m2 = s.match(/^\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\b\s*/);
    if (m2) {
      const date = m2[1] || "";
      const rest = s.slice(m2[0].length).trimStart();
      return { date, description: rest };
    }
    return { date: "", description: s };
  }, []);

  const stripHtmlToText = React.useCallback((input) => {
    const s = String(input || "");
    if (!s.trim()) return "";
    // Prefer real HTML parsing when in browser (handles entities, nested tags, etc.)
    try {
      if (typeof window !== "undefined" && typeof window.DOMParser !== "undefined") {
        const doc = new window.DOMParser().parseFromString(String(s), "text/html");
        const text = String(doc?.body?.textContent || "").replace(/\s+/g, " ").trim();
        if (text) return text;
      }
    } catch {
      // ignore and fallback to regex
    }
    // Fallback: strip tags and collapse whitespace
    return String(s)
      .replace(/&nbsp;/gi, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const baseSlides = React.useMemo(() => {
    // Slider must come from backend/admin only (no code fallbacks)
    const base = Array.isArray(dataSlides) ? dataSlides : [];
    return base.map((s) => ({
      id: String(s?.id ?? "").trim(),
      title: String(s?.title || "").trim(),
      desc: String(s?.desc ?? s?.description ?? s?.subtitle ?? "").trim(),
      link: s?.link ? String(s.link) : "/news",
      image: s?.image || "",
    }));
  }, [dataSlides]);

  const slides = React.useMemo(
    () => baseSlides.filter((s) => s.title && s.image).slice(0, 5),
    [baseSlides]
  );

  React.useEffect(() => {
    if (!slides.length) return;
    const len = slides.length || 1;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % len);
    }, 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  React.useEffect(() => {
    // If slides length changed and active is out of bounds — reset.
    if (!slides.length) return;
    if (active >= slides.length) setActive(0);
  }, [active, slides.length]);

  if (!slides.length) return null;

  const current = slides[active] || slides[0];
  const desc = current?.desc ? String(current.desc).trim() : "";
  const previewText = stripHtmlToText(desc);
  const { date, description } = splitDateAndDescription(previewText);
  const subtitleText = String(description || "").trim();
  // On mobile, keep subtitle short to avoid overflowing the hero card.
  const subtitlePreview = truncateWords(subtitleText, isMobile ? 15 : 30);
  const href = current?.id
    ? `/news/slider/${encodeURIComponent(String(current.id))}`
    : "/news";

  return (
    <div className="container">
      <section className="hero hero--contained" aria-label="Важные объявления">
        <div className="slides" aria-hidden>
          {slides.map((s, i) => (
            <div
              key={i}
              className={`slide ${i === active ? "active" : ""}`}
              style={{ backgroundImage: `url(${normalizeFilesUrl(s.image)})` }}
            />
          ))}
          <div className="overlay" />
        </div>
        <div className="caption center">
          <div className="hero__panel">
            <h1 className="title center">{current?.title}</h1>
            {subtitlePreview ? <p className="hero__desc">{subtitlePreview}</p> : null}
            {date ? <div className="hero__date">{date}</div> : null}
            <div className="hero__actions">
              <a className="hero__btn" href={href}>
                {t("more")} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
        <div className="social-left" aria-hidden>
          <a
            className="sbtn sbtn--vk"
            href="https://vk.com/public114457376"
            target="_blank"
            rel="noreferrer"
            aria-label="VK"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="100"
              height="100"
              viewBox="0 0 48 48"
            >
              <path fill="#1976d2" d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"></path>
              <path
                fill="#fff"
                d="M35.937,18.041c0.046-0.151,0.068-0.291,0.062-0.416C35.984,17.263,35.735,17,35.149,17h-2.618 c-0.661,0-0.966,0.4-1.144,0.801c0,0-1.632,3.359-3.513,5.574c-0.61,0.641-0.92,0.625-1.25,0.625C26.447,24,26,23.786,26,23.199 v-5.185C26,17.32,25.827,17,25.268,17h-4.649C20.212,17,20,17.32,20,17.641c0,0.667,0.898,0.827,1,2.696v3.623 C21,24.84,20.847,25,20.517,25c-0.89,0-2.642-3-3.815-6.932C16.448,17.294,16.194,17,15.533,17h-2.643 C12.127,17,12,17.374,12,17.774c0,0.721,0.6,4.619,3.875,9.101C18.25,30.125,21.379,32,24.149,32c1.678,0,1.85-0.427,1.85-1.094 v-2.972C26,27.133,26.183,27,26.717,27c0.381,0,1.158,0.25,2.658,2c1.73,2.018,2.044,3,3.036,3h2.618 c0.608,0,0.957-0.255,0.971-0.75c0.003-0.126-0.015-0.267-0.056-0.424c-0.194-0.576-1.084-1.984-2.194-3.326 c-0.615-0.743-1.222-1.479-1.501-1.879C32.062,25.36,31.991,25.176,32,25c0.009-0.185,0.105-0.361,0.249-0.607 C32.223,24.393,35.607,19.642,35.937,18.041z"
              ></path>
            </svg>
          </a>
       
          <a
            className="sbtn sbtn--tg"
            href="https://t.me/s/tuva_parlament"
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="100"
              height="100"
              viewBox="0 0 48 48"
            >
              <path fill="#29b6f6" d="M24 4A20 20 0 1 0 24 44A20 20 0 1 0 24 4Z"></path>
              <path
                fill="#fff"
                d="M33.95,15l-3.746,19.126c0,0-0.161,0.874-1.245,0.874c-0.576,0-0.873-0.274-0.873-0.274l-8.114-6.733 l-3.97-2.001l-5.095-1.355c0,0-0.907-0.262-0.907-1.012c0-0.625,0.933-0.923,0.933-0.923l21.316-8.468 c-0.001-0.001,0.651-0.235,1.126-0.234C33.667,14,34,14.125,34,14.5C34,14.75,33.95,15,33.95,15z"
              ></path>
              <path
                fill="#b0bec5"
                d="M23,30.505l-3.426,3.374c0,0-0.149,0.115-0.348,0.12c-0.069,0.002-0.143-0.009-0.219-0.043 l0.964-5.965L23,30.505z"
              ></path>
              <path
                fill="#cfd8dc"
                d="M29.897,18.196c-0.169-0.22-0.481-0.26-0.701-0.093L16,26c0,0,2.106,5.892,2.427,6.912 c0.322,1.021,0.58,1.045,0.58,1.045l0.964-5.965l9.832-9.096C30.023,18.729,30.064,18.416,29.897,18.196z"
              ></path>
            </svg>
          </a>
          {/* <a className="sbtn sbtn--mx" href="#" aria-label="MAX">
            <img src="/img/max.png" alt="" />
          </a> */}
        </div>
        <div className="dots center">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === active ? "active" : ""}`}
              type="button"
              aria-label={`Слайд ${i + 1}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
