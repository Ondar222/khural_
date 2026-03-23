import React from "react";

/**
 * Базовый скелетон-компонент с анимацией мерцания
 */
export default function Skeleton({ width, height, borderRadius = 8, className = "", style = {} }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

/**
 * Скелетон для текстовых блоков
 */
export function SkeletonText({ rows = 1, width, height = "1em", className = "", style = {} }) {
  return (
    <div className={`skeleton-text ${className}`} style={style}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton-text-row"
          style={{
            width: typeof width === "string" && width.endsWith("%") 
              ? (i === rows - 1 ? "60%" : width) 
              : width,
            height,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Скелетон для изображений/фото
 */
export function SkeletonImage({ width = "100%", height = 200, borderRadius = 8, className = "", style = {} }) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={borderRadius}
      className={`skeleton-image ${className}`}
      style={style}
    />
  );
}

/**
 * Скелетон для карточки
 */
export function SkeletonCard({ className = "", style = {} }) {
  return (
    <div className={`skeleton-card ${className}`} style={style}>
      <SkeletonImage height={180} />
      <div style={{ padding: "12px 0" }}>
        <SkeletonText rows={2} height="1em" style={{ marginBottom: "8px" }} />
        <SkeletonText rows={1} height="0.8em" width="80%" />
      </div>
    </div>
  );
}

/**
 * Скелетон для списка (несколько карточек)
 */
export function SkeletonList({ count = 3, gap = "16px", className = "", style = {} }) {
  return (
    <div
      className={`skeleton-list ${className}`}
      style={{
        display: "grid",
        gap,
        ...style,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Скелетон для таблицы/списка строк
 */
export function SkeletonTable({ rows = 5, className = "", style = {} }) {
  return (
    <div className={`skeleton-table ${className}`} style={style}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          <Skeleton height="100%" style={{ flex: 1, marginRight: "8px" }} />
          <Skeleton height="100%" style={{ flex: 2 }} />
        </div>
      ))}
    </div>
  );
}
