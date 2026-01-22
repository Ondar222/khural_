import React from "react";
import { normalizeFilesUrl } from "../utils/filesUrl.js";

export default function NewsImageCarousel({ images = [] }) {
  const [activeIndex, setActiveIndex] = React.useState(0);

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
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              background: "rgba(0, 0, 0, 0.5)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={goToNext}
            aria-label="Следующее изображение"
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              background: "rgba(0, 0, 0, 0.5)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
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
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            display: "flex",
            gap: 8,
          }}
        >
          {validImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              aria-label={`Перейти к изображению ${index + 1}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: "none",
                background: index === activeIndex ? "white" : "rgba(255, 255, 255, 0.5)",
                cursor: "pointer",
                padding: 0,
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
