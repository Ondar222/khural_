import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { useTranslation } from "./useTranslation.js";
import { isKnownTuvanText } from "../utils/translationMemory.js";

function normalizeMenuLabel(value) {
  return String(value ?? "").trim();
}

/**
 * Автоматически переводит подписи пунктов меню, которых нет в статическом
 * словаре (например, страницы, созданные в админке).
 *
 * @param {string[]} labels - Подписи, которые могут потребовать перевода
 * @param {boolean} enabled - Нужен ли перевод (обычно lang === "ty")
 * @returns {{ translateMenuLabel: (label: string, needsTranslation?: boolean) => string }}
 */
export function useMenuTranslation(labels, enabled) {
  const { t } = useI18n();
  const { translateBatch } = useTranslation();
  const [translations, setTranslations] = React.useState({});

  const labelsKey = React.useMemo(
    () =>
      Array.from(
        new Set(
          (Array.isArray(labels) ? labels : [])
            .map(normalizeMenuLabel)
            .filter(Boolean)
        )
      ).join("\u0000"),
    [labels]
  );

  const uniqueLabels = React.useMemo(
    () => (labelsKey ? labelsKey.split("\u0000") : []),
    [labelsKey]
  );

  React.useEffect(() => {
    if (!enabled) return undefined;

    const missing = uniqueLabels.filter(
      (label) =>
        !translations[label] &&
        // Уже переведено статическим словарём.
        t(label) === label &&
        !isKnownTuvanText(label)
    );
    if (missing.length === 0) return undefined;

    let alive = true;
    translateBatch(missing, "ru", "tyv")
      .then((results) => {
        if (!alive) return;
        const next = {};
        results.forEach((result, index) => {
          const source = missing[index];
          const translated = String(result?.translated || "").trim();
          if (source && translated && translated !== source) {
            next[source] = translated;
          }
        });
        if (Object.keys(next).length > 0) {
          setTranslations((prev) => ({ ...prev, ...next }));
        }
      })
      .catch(() => {
        // Если переводчик недоступен, оставляем исходную подпись.
      });

    return () => {
      alive = false;
    };
  }, [enabled, uniqueLabels, translations, t, translateBatch]);

  const translateMenuLabel = React.useCallback(
    (label, needsTranslation = true) => {
      const text = normalizeMenuLabel(label);
      if (!text) return text;

      // Сначала статический словарь, затем автоматический перевод.
      const fromDictionary = t(text);
      if (fromDictionary !== text) return fromDictionary;
      if (!enabled || !needsTranslation) return text;

      return translations[text] || text;
    },
    [enabled, t, translations]
  );

  return { translateMenuLabel };
}
