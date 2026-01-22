import React from "react";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

export default function NewsImageCarousel({ images = [] }) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 959;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth <= 959);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Filter out empty images and normalize URLs
  const validImages = React.useMemo(() => {
    return (Array.isArray(images) ? images : [])
      .map((img) => {
        if (typeof img === "string") {
          return normalizeFilesUrl(img);
        }
        if (img && typeof img === "object") {
          const link = img?.link || img?.url || img?.file?.link || img?.file?.url || "";
          return link ? normalizeFilesUrl(link) : "";
        }
        return "";
      })
      .filter((url) => url && url.trim());
  }, [images]);

  React.useEffect(() => {
    if (activeIndex >= validImages.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, validImages.length]);

  if (!validImages.length) return null;

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  const goToSlide = (index) => {
    setActiveIndex(index);
  };

  // Responsive button sizes (compact, flush to edges)
  const arrowButtonSize = isMobile ? 28 : 32;
  const arrowIconSize = isMobile ? 14 : 16;
  const arrowOffset = isMobile ? 6 : 8;
  const dotSize = isMobile ? 5 : 6;
  const dotActiveWidth = isMobile ? 14 : 18;
  const dotGap = isMobile ? 5 : 6;
  const dotsBottom = isMobile ? 10 : 12;

  return (
    <div style={{ position: "relative", height: 340, overflow: "hidden", borderRadius: 12 }}>
      {/* Images */}
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {validImages.map((imgUrl, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: index === activeIndex ? 1 : 0,
              transition: "opacity 0.3s ease-in-out",
              zIndex: index === activeIndex ? 1 : 0,
            }}
          >
            <img
              src={imgUrl}
              alt={`Изображение ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows (only show if more than 1 image) */}
      {validImages.length > 1 && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Предыдущее изображение"
            className="news-carousel-arrow news-carousel-arrow--prev"
            style={{
              position: "absolute",
              left: arrowOffset,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              background: "rgba(0, 0, 0, 0.4)",
              border: "none",
              borderRadius: "50%",
              width: arrowButtonSize,
              height: arrowButtonSize,
              color: "rgba(255, 255, 255, 0.95)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s ease, transform 0.2s ease",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.55)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.4)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(0.95)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
            }}
          >
            <svg
              width={arrowIconSize}
              height={arrowIconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginLeft: -1 }}
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Следующее изображение"
            className="news-carousel-arrow news-carousel-arrow--next"
            style={{
              position: "absolute",
              right: arrowOffset,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              background: "rgba(0, 0, 0, 0.4)",
              border: "none",
              borderRadius: "50%",
              width: arrowButtonSize,
              height: arrowButtonSize,
              color: "rgba(255, 255, 255, 0.95)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s ease, transform 0.2s ease",
              padding: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.55)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.4)";
              e.currentTarget.style.transform = "translateY(-50%) scale(1)";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(0.95)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "translateY(-50%) scale(1.1)";
            }}
          >
            <svg
              width={arrowIconSize}
              height={arrowIconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: -1 }}
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator (only show if more than 1 image) */}
      {validImages.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: dotsBottom,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            display: "flex",
            gap: dotGap,
            alignItems: "center",
            background: "rgba(0, 0, 0, 0.35)",
            padding: isMobile ? "5px 8px" : "6px 12px",
            borderRadius: "16px",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
        >
          {validImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Перейти к изображению ${index + 1}`}
              style={{
                width: index === activeIndex ? dotActiveWidth : dotSize,
                height: dotSize,
                borderRadius: index === activeIndex ? "3px" : "50%",
                border: "none",
                background: index === activeIndex ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.5)",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                if (index !== activeIndex) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.75)";
                  e.currentTarget.style.transform = "scale(1.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (index !== activeIndex) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
