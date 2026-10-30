import React from "react";
import { useI18n } from "../context/I18nContext.jsx";
import { useTranslation } from "../hooks/useTranslation.js";

const translatedNodes = new WeakMap();
const EXCLUDED_TEXT_ELEMENTS =
  "script, style, noscript, textarea, input, option, [contenteditable='true'], [translate='no'], [data-no-auto-translate], [aria-hidden='true']";

function isTranslatableTextNode(node, root) {
  if (node?.nodeType !== Node.TEXT_NODE || !node.nodeValue?.trim()) return false;
  if (node.nodeValue.trim().length < 3 || !/[А-Яа-яЁё]/.test(node.nodeValue)) return false;
  const parent = node.parentElement;
  return Boolean(parent && root.contains(parent) && !parent.closest(EXCLUDED_TEXT_ELEMENTS));
}

export default function AutomaticPageTranslator({ rootRef, enabled = true }) {
  const { lang } = useI18n();
  const { translateBatch } = useTranslation();

  React.useEffect(() => {
    const root = rootRef?.current;
    if (!root) return undefined;

    if (!enabled || lang !== "ty") {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const record = translatedNodes.get(node);
        if (record && node.nodeValue === record.translated) {
          node.nodeValue = record.original;
          translatedNodes.delete(node);
        }
        node = walker.nextNode();
      }
      return undefined;
    }

    let active = true;
    let translating = false;
    const pending = new Set();

    const collect = (target) => {
      if (target?.nodeType === Node.TEXT_NODE) {
        if (isTranslatableTextNode(target, root)) {
          const record = translatedNodes.get(target);
          if (!record || target.nodeValue !== record.translated) {
            if (record) translatedNodes.delete(target);
            pending.add(target);
          }
        }
        return;
      }
      if (target?.nodeType === Node.ELEMENT_NODE && !target.matches(EXCLUDED_TEXT_ELEMENTS)) {
        const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
          collect(node);
          node = walker.nextNode();
        }
      }
    };

    const flush = async () => {
      if (!active || translating || pending.size === 0) return;
      translating = true;
      const batch = Array.from(pending).slice(0, 20);
      batch.forEach((node) => pending.delete(node));
      const originals = batch.map((node) => node.nodeValue);

      try {
        const results = await translateBatch(originals, "ru", "tyv");
        if (!active) return;
        results.forEach((result, index) => {
          const node = batch[index];
          if (!node.isConnected || node.nodeValue !== originals[index]) return;
          const translated = String(result?.translated || "").trim();
          if (!translated || translated === originals[index].trim()) return;
          const leading = originals[index].match(/^\s*/)?.[0] || "";
          const trailing = originals[index].match(/\s*$/)?.[0] || "";
          const translatedValue = `${leading}${translated}${trailing}`;
          translatedNodes.set(node, {
            original: originals[index],
            translated: translatedValue,
          });
          node.nodeValue = translatedValue;
        });
      } catch {
        // Keep the original text if translation is unavailable.
      } finally {
        translating = false;
        if (active && pending.size) void flush();
      }
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          collect(mutation.target);
        } else {
          mutation.addedNodes.forEach(collect);
        }
      });
      void flush();
    });

    collect(root);
    observer.observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    void flush();

    return () => {
      active = false;
      pending.clear();
      observer.disconnect();
    };
  }, [enabled, lang, rootRef, translateBatch]);

  return null;
}
